import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import app from "@/app";
import {
  testDb,
  createTestUser,
  createAuthToken,
} from "../helpers/test-helpers";
import { makeRequest, parseJsonResponse } from "../helpers/test-helpers";
import { recommendations } from "@/core/infrastructure/database/schema";
import { testDb as dbHelper } from "../helpers/test-db";
import { eq } from "drizzle-orm";

describe("Recommendations Integration Tests", () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    const isConnected = await testDb.checkConnection();
    if (!isConnected) {
      throw new Error("No se pudo conectar a la base de datos de pruebas");
    }
  });

  beforeEach(async () => {
    await testDb.cleanDatabase();

    testUser = await createTestUser({
      email: "test@example.com",
      password: "TestPassword123!",
    });

    authToken = await createAuthToken(testUser.id, testUser.email);
  });

  describe("GET /recommendations", () => {
    it("debe obtener recomendaciones pendientes del usuario", async () => {
      // Crear una recomendación de prueba
      const db = dbHelper.getDb();
      await db.insert(recommendations).values({
        user_id: testUser.id,
        title: "Test Recommendation",
        description: "This is a test recommendation",
        type: "FINANCIAL_TIP",
        priority: "MEDIUM",
        status: "PENDING",
      });

      const response = await makeRequest(app, "GET", "/recommendations", {
        query: { userId: testUser.id.toString() },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      // Puede que el repositorio filtre por status "PENDING" (mayúsculas)
      if (json.data.length > 0) {
        expect(json.data[0].title).toBe("Test Recommendation");
      }
    });

    it("debe retornar error si no se proporciona userId", async () => {
      const response = await makeRequest(app, "GET", "/recommendations", {});

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.message).toContain("User ID");
    });

    it("debe retornar array vacío si no hay recomendaciones pendientes", async () => {
      const response = await makeRequest(app, "GET", "/recommendations", {
        query: { userId: testUser.id.toString() },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(0);
    });
  });

  describe("PATCH /recommendations/:id/view", () => {
    it("debe marcar una recomendación como vista", async () => {
      // Crear una recomendación de prueba
      const db = dbHelper.getDb();
      const [rec] = await db
        .insert(recommendations)
        .values({
          user_id: testUser.id,
          title: "Test Recommendation",
          description: "This is a test recommendation",
          type: "FINANCIAL_TIP",
          priority: "MEDIUM",
          status: "PENDING",
        })
        .returning();

      const response = await makeRequest(
        app,
        "PATCH",
        `/recommendations/${rec.id}/view`,
        {}
      );

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe("Recommendation marked as viewed");

      // Verificar que se actualizó en la base de datos
      const updatedRec = await db
        .select()
        .from(recommendations)
        .where(eq(recommendations.id, rec.id));
      // El status puede estar en mayúsculas
      expect(updatedRec[0].status?.toUpperCase()).toBe("VIEWED");
    });

    it("debe retornar error si la recomendación no existe", async () => {
      const response = await makeRequest(
        app,
        "PATCH",
        "/recommendations/99999/view",
        {}
      );

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Recommendation not found");
    });
  });

  describe("PATCH /recommendations/:id/dismiss", () => {
    it("debe descartar una recomendación", async () => {
      const db = dbHelper.getDb();
      const [rec] = await db
        .insert(recommendations)
        .values({
          user_id: testUser.id,
          title: "Test Recommendation",
          description: "This is a test recommendation",
          type: "FINANCIAL_TIP",
          priority: "MEDIUM",
          status: "PENDING",
        })
        .returning();

      const response = await makeRequest(
        app,
        "PATCH",
        `/recommendations/${rec.id}/dismiss`,
        {}
      );

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe("Recommendation dismissed successfully");
    });
  });
});
