import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(process.env.MONGODB_DB || "gifta");
    const products = await db
      .collection("products")
      .find({ tags: "demo-product", storeId: "store-85f63f767e" }, { projection: { _id: 0, id: 1, slug: 1, name: 1, price: 1, category: 1, variants: 1 } })
      .sort({ id: -1 })
      .limit(10)
      .toArray();

    const settings = await db
      .collection("settings")
      .findOne({ _id: "global-categories" }, { projection: { _id: 0, customizableCategories: 1 } });

    const priceCheck = products.every((p) => Number.isFinite(p.price) && p.price >= 1 && p.price <= 10);
    const variantProducts = products.filter((p) => Array.isArray(p.variants) && p.variants.length > 0).length;

    console.log(
      JSON.stringify(
        {
          demoProductsFound: products.length,
          priceCheck,
          variantProducts,
          customizableCategories: settings?.customizableCategories ?? [],
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            variantCount: Array.isArray(p.variants) ? p.variants.length : 0,
          })),
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
