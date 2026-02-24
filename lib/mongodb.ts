import { Db, MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB ?? "gifta";

type MongoGlobal = {
  _giftaMongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as typeof globalThis & MongoGlobal;

function getClientPromise() {
  if (!globalForMongo._giftaMongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set. Please configure your environment variables.");
    }

    globalForMongo._giftaMongoClientPromise = new MongoClient(uri).connect();
  }

  return globalForMongo._giftaMongoClientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  return getClientPromise();
}

export async function getMongoDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}
