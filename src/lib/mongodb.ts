import { MongoClient, type Collection } from "mongodb";

/**
 * MongoDB Atlas access for the contact API.
 * Server-only — never import this from a client component.
 *
 * Connection reuse matters in serverless: a single cached client avoids
 * opening a new pool on every invocation (and exhausting Atlas connections).
 */

export type ContactDocument = {
  name: string;
  email: string;
  subject: string;
  message: string;
  projectType: string;
  budget: string;
  timeline: string;
  /** Normalised client IP (may be "unknown" behind restrictive proxies). */
  ip: string;
  userAgent: string;
  referer: string;
  /** Which storage path handled it — surfaced in the API response for transparency. */
  persisted: boolean;
  createdAt: Date;
};

type MongoGlobal = {
  promise?: Promise<MongoClient>;
  indexed?: boolean;
};

const globalCache = globalThis as unknown as { __mongo?: MongoGlobal };
if (!globalCache.__mongo) globalCache.__mongo = {};

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0);
}

export function getDbName(): string {
  return process.env.MONGODB_DB?.trim() || "portfolio";
}

export function getCollectionName(): string {
  return process.env.MONGODB_COLLECTION?.trim() || "messages";
}

function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is not configured");

  const cache = globalCache.__mongo as MongoGlobal;
  if (!cache.promise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5_000,
      maxPoolSize: 5,
      appName: "orbital-cyber-portfolio",
    });
    cache.promise = client.connect().then((connected) => {
      // Fail fast on a bad credential instead of hanging per request.
      return connected;
    });
    cache.promise.catch(() => {
      // Allow a retry on the next request rather than caching a rejected promise.
      cache.promise = undefined;
    });
  }
  return cache.promise;
}

async function ensureIndexes(collection: Collection<ContactDocument>): Promise<void> {
  const cache = globalCache.__mongo as MongoGlobal;
  if (cache.indexed) return;
  try {
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ email: 1 });
    cache.indexed = true;
  } catch (error) {
    // A read-only Atlas user can't create indexes; that must not block writes.
    console.warn("[mongo] index creation skipped:", (error as Error).message);
    cache.indexed = true;
  }
}

/** Inserts one contact submission. Throws when storage is unavailable. */
export async function insertContactMessage(
  doc: Omit<ContactDocument, "createdAt" | "persisted">,
): Promise<{ id: string }> {
  const client = await getClient();
  const collection = client
    .db(getDbName())
    .collection<ContactDocument>(getCollectionName());

  await ensureIndexes(collection);

  const result = await collection.insertOne({
    ...doc,
    persisted: true,
    createdAt: new Date(),
  });

  return { id: result.insertedId.toHexString() };
}
