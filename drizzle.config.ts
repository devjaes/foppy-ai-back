import env from "@/env";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/core/infrastructure/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.NODE_ENV === "production" ? "db" : "localhost",
    port: Number(env.NODE_ENV === "production" ? "5432" : env.DATABASE_PORT),
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: false,
  },
} satisfies Config;
