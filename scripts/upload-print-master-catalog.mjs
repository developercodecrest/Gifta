import nextEnv from "@next/env";
import { MongoClient, ObjectId } from "mongodb";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const REQUESTED_STORE_IDENTIFIER = "69ca5848d8dad985f63f767f";
const DEFAULT_CATEGORY = "Customised Personal Gift";
const DEFAULT_TAGS = ["gift", "print-master", "customized"];

const RAW_CSV = `Title,Size,Price
CUSTOMIZED NAME FRAME,18 x 12,1100
LOVE FRAME,13 x 14,910
COUPLE FRAME,14 x 16,1120
COUPLE FRAME,7 x 11,385
COUPLE FRAME,12 x 7,425
COUPLE FRAME,8 x 10,400
FAMILY FRAME,16 x 10,800
FRIENDS FRAME,12 x 17,1020
COUPLE FRAME,11 x 8,440
COUPLE FRAME,12 x 18,1100
MOM FRAME,16 x 10,800
COUPLE FRAME,,499
HEART STONE FRAME,,550
LED HEART CUSHION,,550
MAGIC CUSHION,,400
HEART SHAPE CUSHION,,Small 350 / Big 450
SQUARE SHAPE CUSHION,,350
TEDDY PILLOW CUSHION,,550
SMILEY CUSHION,,325
ROTATION 4 PHOTO FRAME,7 x 4.8,850
ROTATION 4 PHOTO FRAME,5 x 4.8,449
SQUARE MAGIC MIRROR,,499
HEART SHAPE MAGIC MIRROR,,549
MAGIC MIRROR,,399
NORMAL T-SHIRT ROUND NECK,,250
POLO-T-SHIRT WITH PRINT,,350
POLO -T-SHIRT WITH PRINT,,350
POLO -T-SHIRT WITH PRINT,,350
WHITE - HOLI- T-SHIRT,,150
POLO -T-SHIRT WITH PRINT,,350
GREEN -T-SHIRT WITH PRINT,,350
HOODIE WITH PRINT,,550
CAP,,150
CUSTOMIZED PHOTO KEY RING,,80
CUSTOMIZED BATCH,,125
CUSTOMIZED KEY RING,,100
NAME FRAME,12 x 18,865
PHOTO FRAME,15 x 24,1500
HEART FRAME,18 x 18,1250
NAME FRAME,18 x 15,1080
KING FRAME,12 x 12,575
QUEEN FRAME,12 x 12,575
LOVE FRAME,15 x 18,1080
NAME FRAME,9 x 5,300
NAME FRAME,8 x 14,450
Acrylic Name Plates,12 x 6,720
Acrylic Name Plates,12 x 8,960
Acrylic Light Name Plates,15 x 8,1800
METTAL SIPPER,600ML / 750ML,250 / 320
3TONE HEART MUG,,325
NEON MUG,,280
WHITE SIPPER,600ML / 750ML,250 / 320
PEN HOLDER,,200
BLACK MAGIC MUG,,299
3 TONE MUG,,225
BLACK MAGIC HEART MUG,,325
WHITE MUG,,200
PATCH MUG,,255
GOLD & SILVER MUGS,,310`;

function splitSlash(value) {
  return String(value || "")
    .split("/")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function makeId(prefix) {
  return `${prefix}-${new ObjectId().toHexString().slice(-10)}`;
}

function toSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return slug || `item-${new ObjectId().toHexString().slice(-8)}`;
}

function normalizeTitle(value) {
  return String(value || "")
    .replace(/\s*[-]\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitleKey(value) {
  return normalizeTitle(value).toLowerCase();
}

function parseMoneyToken(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const numberMatch = raw.match(/(\d+(?:\.\d+)?)(?!.*\d)/);
  if (!numberMatch) {
    return null;
  }

  const price = Number(numberMatch[1]);
  if (!Number.isFinite(price)) {
    return null;
  }

  const label = raw.slice(0, numberMatch.index).trim();
  return {
    price,
    label: label || "",
  };
}

function parseDimension(sizeLabel) {
  const match = String(sizeLabel || "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)$/);

  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  return {
    width,
    height,
    dimensionUnit: "cm",
  };
}

function parseCsvRows(rawCsv) {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    const firstComma = line.indexOf(",");
    const secondComma = line.indexOf(",", firstComma + 1);

    if (firstComma === -1 || secondComma === -1) {
      continue;
    }

    const title = line.slice(0, firstComma).trim();
    const size = line.slice(firstComma + 1, secondComma).trim();
    const price = line.slice(secondComma + 1).trim();

    if (!title || !price) {
      continue;
    }

    rows.push({ title, size, price, rowNumber: index + 1 });
  }

  return rows;
}

function parseRowOptions(row) {
  const sizeTokens = splitSlash(row.size);
  const priceTokens = splitSlash(row.price);
  const parsedPriceTokens = priceTokens.map((token) => parseMoneyToken(token));

  const hasMultiOption = sizeTokens.length > 1 || priceTokens.length > 1;
  const options = [];

  if (hasMultiOption) {
    const length = Math.max(sizeTokens.length, priceTokens.length);
    for (let index = 0; index < length; index += 1) {
      const parsedPrice = parsedPriceTokens[index] || parsedPriceTokens[0];
      if (!parsedPrice) {
        continue;
      }

      const explicitSize = sizeTokens[index] || sizeTokens[0] || "";
      const derivedLabel = explicitSize || parsedPrice.label || `Option ${index + 1}`;
      options.push({
        label: derivedLabel,
        salePrice: Math.max(0, parsedPrice.price),
      });
    }
  } else {
    const parsedPrice = parseMoneyToken(row.price);
    if (!parsedPrice) {
      return {
        options,
        hasMultiOption,
        rowBaseSalePrice: undefined,
      };
    }

    if (row.size.trim()) {
      options.push({
        label: row.size.trim(),
        salePrice: Math.max(0, parsedPrice.price),
      });
    } else {
      options.push({
        label: parsedPrice.label || "",
        salePrice: Math.max(0, parsedPrice.price),
      });
    }
  }

  const basePriceCandidate = parseMoneyToken(row.price)?.price;

  return {
    options,
    hasMultiOption,
    rowBaseSalePrice: Number.isFinite(basePriceCandidate) ? Math.max(0, Number(basePriceCandidate)) : undefined,
  };
}

function uniqueByLabel(options) {
  const map = new Map();
  for (const option of options) {
    const label = String(option.label || "").trim();
    const key = label.toLowerCase();
    if (!key) {
      continue;
    }
    if (!map.has(key)) {
      map.set(key, {
        label,
        salePrice: option.salePrice,
      });
    }
  }

  return Array.from(map.values());
}

function buildPreparedProducts(rows, storeId, storeName, validCategoryNames) {
  const selectedCategory = validCategoryNames.includes(DEFAULT_CATEGORY)
    ? DEFAULT_CATEGORY
    : validCategoryNames[0];

  if (!selectedCategory) {
    throw new Error("No valid global category available");
  }

  const grouped = new Map();
  for (const row of rows) {
    const normalizedTitle = normalizeTitle(row.title);
    const key = normalizeTitleKey(normalizedTitle);
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: normalizedTitle,
        rows: [],
      });
    }
    grouped.get(key).rows.push(row);
  }

  const prepared = [];

  for (const [, group] of grouped.entries()) {
    const optionCandidates = [];
    let hasAnyMultiOption = false;

    for (const row of group.rows) {
      const parsed = parseRowOptions(row);
      if (parsed.hasMultiOption) {
        hasAnyMultiOption = true;
      }

      for (const option of parsed.options) {
        optionCandidates.push({
          label: option.label,
          salePrice: option.salePrice,
        });
      }
    }

    const nonEmptyLabels = new Set(
      optionCandidates
        .map((entry) => String(entry.label || "").trim())
        .filter(Boolean)
        .map((entry) => entry.toLowerCase()),
    );

    const shouldUseVariants = hasAnyMultiOption || nonEmptyLabels.size > 1;

    let salePrice = 0;
    let originalPrice = 50;
    let attributes = [];
    let variants = [];
    let shortDescription = "";

    if (shouldUseVariants) {
      const normalizedOptions = optionCandidates.map((entry) => ({
        label: String(entry.label || "").trim() || "Standard",
        salePrice: Math.max(0, Number(entry.salePrice || 0)),
      }));

      const dedupedOptions = uniqueByLabel(normalizedOptions);
      if (!dedupedOptions.length) {
        continue;
      }

      salePrice = dedupedOptions.reduce((min, entry) => Math.min(min, entry.salePrice), dedupedOptions[0].salePrice);
      originalPrice = salePrice + 50;

      attributes = [
        {
          name: "quantity",
          values: dedupedOptions.map((entry) => entry.label),
        },
      ];

      variants = dedupedOptions.map((entry) => {
        const dimensions = parseDimension(entry.label);
        return {
          id: makeId("var"),
          options: {
            quantity: entry.label,
          },
          salePrice: entry.salePrice,
          regularPrice: entry.salePrice + 50,
          ...(dimensions ? dimensions : {}),
          size: entry.label,
          inStock: true,
        };
      });

      shortDescription = `Available in ${dedupedOptions.length} option${dedupedOptions.length === 1 ? "" : "s"}.`;
    } else {
      const firstRow = group.rows[0];
      const parsedPrice = parseMoneyToken(firstRow.price);
      if (!parsedPrice) {
        continue;
      }

      salePrice = Math.max(0, parsedPrice.price);
      originalPrice = salePrice + 50;
      shortDescription = firstRow.size.trim() ? `Size: ${firstRow.size.trim()}` : "";
    }

    prepared.push({
      key: normalizeTitleKey(group.title),
      name: group.title,
      salePrice,
      originalPrice,
      productDoc: {
        slug: toSlug(group.title),
        name: group.title,
        shortDescription,
        description: `${group.title} by ${storeName}.`,
        price: salePrice,
        originalPrice,
        rating: 4.5,
        reviews: 0,
        category: selectedCategory,
        tags: DEFAULT_TAGS,
        media: [],
        images: [],
        inStock: true,
        minOrderQty: 1,
        maxOrderQty: 10,
        featured: false,
        storeId,
        attributes,
        variants,
      },
    });
  }

  return prepared;
}

async function resolveStore(storesCollection) {
  const byId = await storesCollection.findOne({ id: REQUESTED_STORE_IDENTIFIER });
  if (byId) {
    return byId;
  }

  if (ObjectId.isValid(REQUESTED_STORE_IDENTIFIER)) {
    const byObjectId = await storesCollection.findOne({ _id: new ObjectId(REQUESTED_STORE_IDENTIFIER) });
    if (byObjectId) {
      return byObjectId;
    }
  }

  return null;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || "gifta";
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const stores = db.collection("stores");
    const products = db.collection("products");
    const offers = db.collection("offers");
    const globalCategorySettings = db.collection("global_category_settings");

    const store = await resolveStore(stores);
    if (!store) {
      throw new Error(`Store not found for identifier: ${REQUESTED_STORE_IDENTIFIER}`);
    }

    const storeId = String(store.id || "").trim();
    if (!storeId) {
      throw new Error("Resolved store document does not have a valid string id field");
    }

    const settings = await globalCategorySettings.findOne({ _id: "global-categories" }, { projection: { categories: 1 } });
    const validCategoryNames = Array.isArray(settings?.categories)
      ? settings.categories.map((entry) => String(entry?.name || "").trim()).filter(Boolean)
      : [];

    const rows = parseCsvRows(RAW_CSV);
    const preparedProducts = buildPreparedProducts(rows, storeId, store.name || "Print Master", validCategoryNames);

    const existingOffers = await offers.find({ storeId }).toArray();
    const existingProductIds = Array.from(new Set(existingOffers.map((entry) => entry.productId).filter(Boolean)));
    const existingProducts = existingProductIds.length
      ? await products.find({ id: { $in: existingProductIds } }, { projection: { id: 1, name: 1 } }).toArray()
      : [];

    const existingProductByNameKey = new Map(
      existingProducts.map((entry) => [normalizeTitleKey(entry.name), entry]),
    );

    const created = [];
    const updated = [];

    for (const item of preparedProducts) {
      const existing = existingProductByNameKey.get(item.key);

      if (existing) {
        await products.updateOne(
          { id: existing.id },
          {
            $set: {
              slug: item.productDoc.slug,
              name: item.productDoc.name,
              shortDescription: item.productDoc.shortDescription,
              description: item.productDoc.description,
              price: item.salePrice,
              originalPrice: item.originalPrice,
              rating: 4.5,
              reviews: 0,
              category: item.productDoc.category,
              tags: item.productDoc.tags,
              media: item.productDoc.media,
              images: item.productDoc.images,
              inStock: true,
              minOrderQty: 1,
              maxOrderQty: 10,
              featured: false,
              storeId,
              attributes: item.productDoc.attributes,
              variants: item.productDoc.variants,
            },
          },
        );

        await offers.updateOne(
          { productId: existing.id, storeId },
          {
            $set: {
              price: item.salePrice,
              originalPrice: item.originalPrice,
              inStock: true,
              deliveryEtaHours: 24,
            },
            $setOnInsert: {
              id: makeId("of"),
              productId: existing.id,
              storeId,
            },
          },
          { upsert: true },
        );

        updated.push(item.productDoc.name);
        continue;
      }

      const productId = makeId("it");
      await products.insertOne({
        id: productId,
        ...item.productDoc,
      });

      await offers.insertOne({
        id: makeId("of"),
        productId,
        storeId,
        price: item.salePrice,
        originalPrice: item.originalPrice,
        inStock: true,
        deliveryEtaHours: 24,
      });

      created.push(item.productDoc.name);
    }

    const postOfferCount = await offers.countDocuments({ storeId });
    const postProducts = await products
      .find({ id: { $in: Array.from(new Set((await offers.find({ storeId }).toArray()).map((entry) => entry.productId))) } }, { projection: { _id: 0, name: 1, price: 1, originalPrice: 1, attributes: 1, variants: 1 } })
      .toArray();

    console.log(JSON.stringify({
      requestedStoreIdentifier: REQUESTED_STORE_IDENTIFIER,
      resolvedStoreId: storeId,
      resolvedStoreName: store.name,
      parsedInputRows: rows.length,
      uniquePreparedProducts: preparedProducts.length,
      createdCount: created.length,
      updatedCount: updated.length,
      offerCountForStoreAfterUpload: postOfferCount,
      createdNames: created,
      updatedNames: updated,
      sampleProducts: postProducts.slice(0, 10),
    }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
