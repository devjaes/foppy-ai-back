import DatabaseConnection from "@/core/infrastructure/database";
import { users } from "@/schema";

async function listUsers() {
  const db = DatabaseConnection.getInstance().db;
  const allUsers = await db.select().from(users);
  console.log(JSON.stringify(allUsers, null, 2));
  await DatabaseConnection.getInstance().close();
}

listUsers();
