import { hash } from "@/shared/utils/crypto.util";
import { users } from "@/schema";
import { eq } from "drizzle-orm";
import DatabaseConnection from "@/db";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/schema";

interface CreateUserParams {
  name: string;
  username: string;
  email: string;
  password: string;
}

/**
 * Seeder para crear usuarios de prueba
 */
export default async function seedUsers() {
  const db = DatabaseConnection.getInstance().db as NodePgDatabase<typeof schema>;

  console.log("🌱 Creando usuarios de prueba...");
  
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length > 0) {
    console.log(`Se encontraron ${existingUsers.length} usuarios existentes.`);
    return { 
      adminUser: existingUsers.find(u => u.email === 'admin@example.com'),
      testUser: existingUsers.find(u => u.email === 'test@example.com')
    };
  }
  
  const adminUser = await createUser(db, {
    name: "Admin User",
    username: "admin",
    email: "admin@example.com",
    password: "Admin123456",
  });
  
  const testUser = await createUser(db, {
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
    
    password: "Test123456",
  });
  
  console.log(`✅ Se crearon ${2} usuarios de prueba.`);
  
  return { adminUser, testUser };
}

async function createUser(db: NodePgDatabase<typeof schema>, { name, username, email, password }: CreateUserParams) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  
  if (existingUser.length > 0) {
    console.log(`Usuario con email ${email} ya existe, omitiendo creación.`);
    return existingUser[0];
  }
  
  const passwordHash = await hash(password);
  const [user] = await db
    .insert(users)
    .values({
      name,
      username,
      email,
      password_hash: passwordHash,
      active: true,
    })
    .returning();
  
  return user;
}