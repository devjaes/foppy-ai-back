import { hash } from "@/shared/utils/crypto.util";
import { generateToken } from "@/shared/utils/jwt.util";
import { TestDatabase } from "./test-db";
import { users } from "@/core/infrastructure/database/schema";
import { IUser } from "@/features/users/domain/entities/IUser";

const testDb = TestDatabase.getInstance();

/**
 * Factory para crear usuarios de prueba
 */
export async function createTestUser(
  overrides?: Partial<{
    name: string;
    username: string;
    email: string;
    password: string;
    active: boolean;
  }>
): Promise<IUser> {
  const db = testDb.getDb();
  const password = overrides?.password || "TestPassword123!";
  const passwordHash = await hash(password);

  const [user] = await db
    .insert(users)
    .values({
      name: overrides?.name || "Test User",
      username: overrides?.username || `testuser_${Date.now()}`,
      email: overrides?.email || `test_${Date.now()}@example.com`,
      password_hash: passwordHash,
      active: overrides?.active !== undefined ? overrides.active : true,
    })
    .returning();

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    passwordHash: user.password_hash,
    active: user.active,
    registration_date: user.registration_date,
    recoveryToken: user.recovery_token || null,
    recoveryTokenExpires: user.recovery_token_expires || null,
  };
}

/**
 * Crea un token JWT válido para un usuario
 */
export async function createAuthToken(
  userId: number,
  email: string
): Promise<string> {
  return await generateToken({ id: userId, email });
}

/**
 * Helper para hacer requests HTTP en tests de integración
 */
export async function makeRequest(
  app: any,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, string>;
  }
): Promise<Response> {
  const url = new URL(path, "http://localhost");
  if (options?.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const request = new Request(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  return await app.fetch(request);
}

/**
 * Helper para parsear respuesta JSON
 */
export async function parseJsonResponse(response: Response): Promise<any> {
  return await response.json();
}

/**
 * Helper para esperar un tiempo (útil para tests de timing)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { testDb };
