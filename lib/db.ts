import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for account and progress storage.");
}

const globalForPg = globalThis as unknown as {
  pawsPool?: Pool;
};

export const pool =
  globalForPg.pawsPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pawsPool = pool;
}