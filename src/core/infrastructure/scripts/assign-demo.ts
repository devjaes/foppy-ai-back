import DatabaseConnection from "@/core/infrastructure/database";
import { subscriptions, plans } from "@/schema";
import { eq } from "drizzle-orm";

async function assignDemoPlan(userId: number) {
  const db = DatabaseConnection.getInstance().db;
  
  // Find Plan Demo
  const demoPlan = await db.query.plans.findFirst({
    where: eq(plans.name, "Plan Demo")
  });

  if (!demoPlan) {
    console.error("Plan Demo not found!");
    process.exit(1);
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + demoPlan.duration_days);

  await db.insert(subscriptions).values({
    user_id: userId,
    plan_id: demoPlan.id,
    frequency: demoPlan.frequency,
    start_date: startDate,
    end_date: endDate,
    active: true,
  });

  console.log(`Assigned Plan Demo to user ${userId}`);
  await DatabaseConnection.getInstance().close();
}

assignDemoPlan(1);
