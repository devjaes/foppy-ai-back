import DatabaseConnection from "@/core/infrastructure/database";
import { plans } from "@/schema";
import { sql } from "drizzle-orm";

async function clearPlans() {
  const db = DatabaseConnection.getInstance().db;
  await db.execute(sql`TRUNCATE TABLE ${plans} RESTART IDENTITY CASCADE`);
  console.log("Plans table truncated.");
  await DatabaseConnection.getInstance().close();
}

clearPlans();
