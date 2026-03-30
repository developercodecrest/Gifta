import { ok, serverError, badRequest } from "@/lib/api-response";
import { getMongoDb } from "@/lib/mongodb";
import { products as seedProducts } from "@/data/products";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

interface ProductDoc {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: string;
  tags: string[];
  images: string[];
  inStock: boolean;
  featured?: boolean;
  storeId: string;
  minOrderQty?: number;
  maxOrderQty?: number;
  attributes?: unknown[];
  variants?: unknown[];
}

function normalizeInventoryProduct(doc: ProductDoc): ProductDoc {
  return {
    ...doc,
    rating: Math.min(5, Math.max(1, doc.rating)),
    reviews: Math.max(0, doc.reviews),
    price: Math.max(0, doc.price),
    originalPrice: Math.max(0, doc.originalPrice ?? doc.price),
    minOrderQty: Math.max(1, doc.minOrderQty ?? 1),
    maxOrderQty: Math.max(1, doc.maxOrderQty ?? 10),
  };
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return badRequest("This endpoint is only available in development");
  }

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const count = Math.min(10, Math.max(1, parseInt(searchParams.get("count") ?? "5")));

    if (!storeId?.trim()) {
      return badRequest("storeId is required as a query parameter");
    }

    const db = await getMongoDb();
    const stores = db.collection("stores");
    const products = db.collection("products");

    // Verify the store exists
    const store = await stores.findOne({ id: storeId.trim() });
    if (!store) {
      return badRequest(`Store with ID "${storeId}" not found`);
    }

    // Create products from seed data
    const productDocs: ProductDoc[] = [];
    for (let i = 0; i < Math.min(count, seedProducts.length); i++) {
      const seedProduct = seedProducts[i];
      const productId = `it-${new ObjectId().toHexString().slice(-10)}`;
      const slug = seedProduct.slug + "-" + storeId.toLowerCase().replace(/[^a-z0-9]/g, "-");

      productDocs.push(
        normalizeInventoryProduct({
          id: productId,
          slug,
          name: seedProduct.name,
          description: seedProduct.description,
          price: seedProduct.price,
          originalPrice: seedProduct.originalPrice,
          rating: seedProduct.rating,
          reviews: seedProduct.reviews,
          category: seedProduct.category as string,
          tags: seedProduct.tags,
          images: seedProduct.images,
          inStock: seedProduct.inStock,
          featured: i < 2, // Mark first 2 products as featured for home page display
          storeId,
          minOrderQty: 1,
          maxOrderQty: 10,
        })
      );
    }

    if (productDocs.length) {
      const result = await products.insertMany(productDocs);
      const insertedIds = Object.values(result.insertedIds);

      return ok({
        message: `Successfully added ${productDocs.length} products to store "${store.name}"`,
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
        },
        productsAdded: productDocs.length,
        insertedIds: insertedIds.map(id => id.toString()),
        products: productDocs.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          slug: p.slug,
        })),
      });
    }

    return ok({
      message: "No products were added",
      productsAdded: 0,
    });
  } catch (error) {
    return serverError("Unable to add products", error);
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return badRequest("This endpoint is only available in development");
  }

  try {
    const db = await getMongoDb();
    const stores = db.collection("stores");

    const allStores = await stores.find({}).project({ id: 1, name: 1, slug: 1 }).toArray();

    return ok({
      message: "Available stores for adding products",
      stores: allStores,
      instruction: "Use POST request with ?storeId=<id>&count=<number> to add products",
      example: "POST /api/dev/add-products?storeId=st-nyra&count=5",
    });
  } catch (error) {
    return serverError("Unable to fetch stores", error);
  }
}
