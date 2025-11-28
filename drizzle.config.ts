import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import path from "node:path";

// Load environment variables based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
    ? ".env.docker"
    : ".env";

expand(config({ path: path.resolve(process.cwd(), envFile) }));

// Parse DATABASE_URL if available to get the actual database name
let dbHost = "localhost";
let dbPort = 5432;
let dbUser = process.env.DATABASE_USERNAME || "postgres";
let dbPassword = process.env.DATABASE_PASSWORD || "postgres";
let dbName = process.env.DATABASE_NAME || "fopymes";

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    dbHost = url.hostname;
    dbPort = url.port ? parseInt(url.port) : 5432;
    dbUser = url.username || dbUser;
    dbPassword = url.password || dbPassword;
    dbName = url.pathname.replace("/", "") || dbName;
  } catch (error) {
    console.error("Error parsing DATABASE_URL:", error);
  }
}

export default {
  schema: "./src/core/infrastructure/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.NODE_ENV === "production" ? "db" : dbHost,
    port: process.env.NODE_ENV === "production" ? 5432 : dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ssl: false,
  },
} satisfies Config;
