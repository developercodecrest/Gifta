import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRAFT_PATH = path.join(__dirname, "demo-products-draft.json");

function toSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function boundedPrice(input, fallback) {
  const numeric = Number.isFinite(Number(input)) ? Number(input) : fallback;
  const rounded = Math.floor(numeric);
  return Math.max(1, Math.min(10, rounded));
}

function dedupeStringArray(values, fallback = []) {
  const source = Array.isArray(values) ? values : fallback;
  return Array.from(
    new Set(
      source
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean),
    ),
  );
}

function normalizeMedia(mediaInput, imageInput) {
  const out = [];
  const pushMedia = (entry) => {
    if (!entry || typeof entry !== "object") return;
    const type = entry.type === "video" ? "video" : "image";
    const url = typeof entry.url === "string" ? entry.url.trim() : "";
    if (!url) return;
    const item = { type, url };
    const thumbnailUrl = typeof entry.thumbnailUrl === "string" ? entry.thumbnailUrl.trim() : "";
    const alt = typeof entry.alt === "string" ? entry.alt.trim() : "";
    if (thumbnailUrl) item.thumbnailUrl = thumbnailUrl;
    if (alt) item.alt = alt;
    out.push(item);
  };

  if (Array.isArray(mediaInput) && mediaInput.length) {
    for (const item of mediaInput) pushMedia(item);
  }

  if (!out.length) {
    const images = dedupeStringArray(imageInput);
    for (const url of images) {
      out.push({ type: "image", url });
    }
  }

  return out;
}

function normalizeAttributes(attributesInput) {
  if (!Array.isArray(attributesInput)) return [];
  const names = new Set();
  const result = [];

  for (const entry of attributesInput) {
    if (!entry || typeof entry !== "object") continue;
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    const values = dedupeStringArray(entry.values);
    if (!name || !values.length || names.has(name)) continue;
    names.add(name);
    result.push({ name, values });
  }

  return result;
}

function normalizeVariants(variantsInput, attributes) {
  if (!Array.isArray(variantsInput) || !variantsInput.length || !attributes.length) return [];
  const attributeNames = new Set(attributes.map((entry) => entry.name));
  const signatures = new Set();
  const output = [];

  for (const entry of variantsInput) {
    if (!entry || typeof entry !== "object") continue;
    const id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `var-${new ObjectId().toHexString().slice(-12)}`;

    const rawOptions = entry.options && typeof entry.options === "object" && !Array.isArray(entry.options)
      ? entry.options
      : null;
    if (!rawOptions) continue;

    const options = {};
    for (const attribute of attributes) {
      const value = typeof rawOptions[attribute.name] === "string" ? rawOptions[attribute.name].trim() : "";
      if (!value || !attribute.values.includes(value)) {
        options.__invalid = "1";
        break;
      }
      options[attribute.name] = value;
    }

    if (options.__invalid || Object.keys(options).length !== attributes.length) continue;
    if (Object.keys(options).some((name) => !attributeNames.has(name))) continue;

    const signature = attributes.map((attribute) => `${attribute.name}:${options[attribute.name]}`).join("|");
    if (signatures.has(signature)) continue;
    signatures.add(signature);

    const salePrice = boundedPrice(entry.salePrice, 5);
    const regularPrice = boundedPrice(entry.regularPrice, Math.min(10, salePrice + 1));
    const normalized = {
      id,
      options,
      salePrice,
      regularPrice,
      inStock: entry.inStock === undefined ? true : Boolean(entry.inStock),
    };

    if (typeof entry.size === "string" && entry.size.trim()) normalized.size = entry.size.trim();

    const weight = Number(entry.weight);
    if (Number.isFinite(weight)) {
      normalized.weight = Math.max(0, weight);
      const weightUnit = typeof entry.weightUnit === "string" ? entry.weightUnit.trim().toLowerCase() : "";
      normalized.weightUnit = ["g", "kg", "oz", "lb"].includes(weightUnit) ? weightUnit : "g";
    }

    const length = Number(entry.length);
    const width = Number(entry.width);
    const height = Number(entry.height);
    let hasDimensions = false;
    if (Number.isFinite(length)) {
      normalized.length = Math.max(0, length);
      hasDimensions = true;
    }
    if (Number.isFinite(width)) {
      normalized.width = Math.max(0, width);
      hasDimensions = true;
    }
    if (Number.isFinite(height)) {
      normalized.height = Math.max(0, height);
      hasDimensions = true;
    }
    if (hasDimensions) {
      const dimensionUnit = typeof entry.dimensionUnit === "string" ? entry.dimensionUnit.trim().toLowerCase() : "";
      normalized.dimensionUnit = ["mm", "cm", "m", "in", "ft"].includes(dimensionUnit) ? dimensionUnit : "cm";
    }

    output.push(normalized);
  }

  return output;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing");

  const raw = await fs.readFile(DRAFT_PATH, "utf8");
  const draft = JSON.parse(raw);

  const storeId = draft?.store?.id;
  if (!storeId || typeof storeId !== "string") throw new Error("Draft store.id is missing");

  if (!Array.isArray(draft.products) || draft.products.length !== 10) {
    throw new Error("Draft must contain exactly 10 products");
  }

  const dbName = process.env.MONGODB_DB || "gifta";
  const client = new MongoClient(uri);
  await client.connect();

  const nowIso = new Date().toISOString();
  const pushedProducts = [];

  try {
    const db = client.db(dbName);
    const stores = db.collection("stores");
    const products = db.collection("products");
    const offers = db.collection("offers");
    const settings = db.collection("settings");

    const store = await stores.findOne({ id: storeId }, { projection: { _id: 0, id: 1, name: 1, slug: 1 } });
    if (!store) throw new Error(`Store not found: ${storeId}`);

    const globalPatch = draft.requiredGlobalCategorySettings || {};
    const categories = Array.isArray(globalPatch.categories) ? globalPatch.categories : [];
    const customizableCategories = dedupeStringArray(globalPatch.customizableCategories);

    await settings.updateOne(
      { _id: "global-categories" },
      {
        $set: {
          categories,
          customizableCategories,
          updatedAt: nowIso,
          updatedBy: "demo-products-seed-script",
        },
      },
      { upsert: true },
    );

    for (let index = 0; index < draft.products.length; index += 1) {
      const source = draft.products[index];
      const productId = `it-${new ObjectId().toHexString().slice(-10)}`;
      const baseSlug = toSlug(source.previewSlug || source.name || `demo-item-${index + 1}`);
      const slug = `${baseSlug}-${productId.slice(-4)}`;

      const media = normalizeMedia(source.media, source.images);
      const images = media
        .filter((entry) => entry.type === "image")
        .map((entry) => entry.url)
        .filter(Boolean);

      const attributes = normalizeAttributes(source.attributes);
      const variants = normalizeVariants(source.variants, attributes);

      const price = boundedPrice(source.price, (index % 10) + 1);
      const originalPrice = boundedPrice(source.originalPrice, Math.min(10, price + 1));

      const productDoc = {
        id: productId,
        slug,
        name: String(source.name || `Demo Product ${index + 1}`).trim(),
        shortDescription: String(source.shortDescription || "Demo product for testing catalog flows").trim(),
        description: String(source.description || "<p>Demo product description</p>").trim(),
        ...(typeof source.disclaimerHtml === "string" ? { disclaimerHtml: source.disclaimerHtml.trim() } : {}),
        ...(typeof source.howToPersonaliseHtml === "string" ? { howToPersonaliseHtml: source.howToPersonaliseHtml.trim() } : {}),
        ...(typeof source.brandDetailsHtml === "string" ? { brandDetailsHtml: source.brandDetailsHtml.trim() } : {}),
        price,
        originalPrice,
        rating: 4.5,
        reviews: 0,
        category: String(source.category || "Customised Personal Gift").trim(),
        ...(typeof source.subcategory === "string" ? { subcategory: source.subcategory.trim() } : {}),
        tags: dedupeStringArray(source.tags, ["demo-product", "seed-demo", "print-master"]),
        media,
        images,
        inStock: source.inStock === undefined ? true : Boolean(source.inStock),
        minOrderQty: Math.max(1, Number.isFinite(Number(source.minOrderQty)) ? Math.floor(Number(source.minOrderQty)) : 1),
        maxOrderQty: Math.max(1, Number.isFinite(Number(source.maxOrderQty)) ? Math.floor(Number(source.maxOrderQty)) : 10),
        featured: source.featured === undefined ? false : Boolean(source.featured),
        storeId,
        attributes,
        variants,
      };

      const weight = Number(source.weight);
      if (Number.isFinite(weight)) {
        productDoc.weight = Math.max(0, weight);
        const weightUnit = typeof source.weightUnit === "string" ? source.weightUnit.trim().toLowerCase() : "";
        productDoc.weightUnit = ["g", "kg", "oz", "lb"].includes(weightUnit) ? weightUnit : "g";
      }

      const length = Number(source.length);
      const width = Number(source.width);
      const height = Number(source.height);
      let hasDimensions = false;
      if (Number.isFinite(length)) {
        productDoc.length = Math.max(0, length);
        hasDimensions = true;
      }
      if (Number.isFinite(width)) {
        productDoc.width = Math.max(0, width);
        hasDimensions = true;
      }
      if (Number.isFinite(height)) {
        productDoc.height = Math.max(0, height);
        hasDimensions = true;
      }
      if (hasDimensions) {
        const dimensionUnit = typeof source.dimensionUnit === "string" ? source.dimensionUnit.trim().toLowerCase() : "";
        productDoc.dimensionUnit = ["mm", "cm", "m", "in", "ft"].includes(dimensionUnit) ? dimensionUnit : "cm";
      }

      await products.insertOne(productDoc);

      const offerId = `of-${new ObjectId().toHexString().slice(-10)}`;
      const offerDoc = {
        id: offerId,
        productId,
        storeId,
        price,
        originalPrice,
        inStock: productDoc.inStock,
        deliveryEtaHours: Math.max(1, Number.isFinite(Number(source.deliveryEtaHours)) ? Math.floor(Number(source.deliveryEtaHours)) : 24),
      };

      await offers.insertOne(offerDoc);

      pushedProducts.push({
        id: productId,
        offerId,
        slug,
        name: productDoc.name,
        category: productDoc.category,
        price,
        originalPrice,
        variantCount: productDoc.variants.length,
      });
    }

    const summary = {
      ok: true,
      insertedProducts: pushedProducts.length,
      store,
      customizedCategoryValues: customizableCategories,
      priceRangeApplied: "1-10",
      products: pushedProducts,
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
