import DatabaseConnection from "@/core/infrastructure/database";
import { plans } from "@/schema";

async function listPlans() {
  const db = DatabaseConnection.getInstance().db;
  const allPlans = await db.select().from(plans);
  console.log(JSON.stringify(allPlans, null, 2));
  await DatabaseConnection.getInstance().close();
}

listPlans();
