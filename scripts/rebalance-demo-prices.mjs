import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI missing");
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(process.env.MONGODB_DB || "gifta");
    const productsCol = db.collection("products");
    const offersCol = db.collection("offers");

    const demoProducts = await productsCol
      .find(
        { tags: "demo-product", storeId: "store-85f63f767e" },
        { projection: { _id: 0, id: 1, name: 1, variants: 1 } },
      )
      .sort({ id: 1 })
      .toArray();

    if (demoProducts.length !== 10) {
      throw new Error(`Expected 10 demo products, found ${demoProducts.length}`);
    }

    const updates = [];

    for (let index = 0; index < demoProducts.length; index += 1) {
      const product = demoProducts[index];
      const targetPrice = index + 1;
      const targetOriginalPrice = Math.min(10, targetPrice + 1);

      const variantPatch = Array.isArray(product.variants)
        ? product.variants.map((variant) => ({
            ...variant,
            salePrice: targetPrice,
            regularPrice: targetOriginalPrice,
          }))
        : [];

      await productsCol.updateOne(
        { id: product.id },
        {
          $set: {
            price: targetPrice,
            originalPrice: targetOriginalPrice,
            variants: variantPatch,
          },
        },
      );

      await offersCol.updateMany(
        { productId: product.id, storeId: "store-85f63f767e" },
        {
          $set: {
            price: targetPrice,
            originalPrice: targetOriginalPrice,
          },
        },
      );

      updates.push({
        id: product.id,
        name: product.name,
        price: targetPrice,
        originalPrice: targetOriginalPrice,
        variantCount: variantPatch.length,
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          updatedProducts: updates.length,
          priceDistribution: updates.map((entry) => entry.price),
          updates,
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
  console.error("Rebalance failed:", error);
  process.exit(1);
});
