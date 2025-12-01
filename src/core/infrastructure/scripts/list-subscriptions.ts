import DatabaseConnection from "@/core/infrastructure/database";
import { subscriptions, users, plans } from "@/schema";
import { eq } from "drizzle-orm";

async function listSubscriptions() {
  const db = DatabaseConnection.getInstance().db;
  const subs = await db
    .select({
      subscriptionId: subscriptions.id,
      user: users.email,
      plan: plans.name,
      active: subscriptions.active,
      startDate: subscriptions.start_date,
      endDate: subscriptions.end_date,
    })
    .from(subscriptions)
    .leftJoin(users, eq(subscriptions.user_id, users.id))
    .leftJoin(plans, eq(subscriptions.plan_id, plans.id));
    
  console.log(JSON.stringify(subs, null, 2));
  await DatabaseConnection.getInstance().close();
}

listSubscriptions();
