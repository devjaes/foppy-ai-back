import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import app from "@/app";
import {
  testDb,
  createTestUser,
  createAuthToken,
} from "../helpers/test-helpers";
import { makeRequest, parseJsonResponse } from "../helpers/test-helpers";

describe("Auth Integration Tests", () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Verificar conexión a la base de datos
    const isConnected = await testDb.checkConnection();
    if (!isConnected) {
      throw new Error("No se pudo conectar a la base de datos de pruebas");
    }
  });

  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await testDb.cleanDatabase();

    // Crear usuario de prueba
    testUser = await createTestUser({
      email: "test@example.com",
      password: "TestPassword123!",
    });

    authToken = await createAuthToken(testUser.id, testUser.email);
  });

  describe("POST /auth/login", () => {
    it("debe hacer login exitoso con credenciales válidas", async () => {
      const response = await makeRequest(app, "POST", "/auth/login", {
        body: {
          email: "test@example.com",
          password: "TestPassword123!",
        },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.token).toBeDefined();
      expect(json.data.email).toBe("test@example.com");
      expect(json.data.id).toBe(testUser.id);
      expect(json.message).toBe("Login successful");
    });

    it("debe rechazar login con email incorrecto", async () => {
      const response = await makeRequest(app, "POST", "/auth/login", {
        body: {
          email: "nonexistent@example.com",
          password: "TestPassword123!",
        },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Invalid credentials");
    });

    it("debe rechazar login con contraseña incorrecta", async () => {
      const response = await makeRequest(app, "POST", "/auth/login", {
        body: {
          email: "test@example.com",
          password: "WrongPassword123!",
        },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Invalid credentials");
    });
  });

  describe("POST /auth/register", () => {
    it("debe registrar un nuevo usuario exitosamente", async () => {
      const response = await makeRequest(app, "POST", "/auth/register", {
        body: {
          name: "New User",
          username: "newuser",
          email: "newuser@example.com",
          password: "NewPassword123!",
        },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.token).toBeDefined();
      expect(json.data.email).toBe("newuser@example.com");
      expect(json.data.username).toBe("newuser");
      expect(json.message).toBe("Registration successful");
    });

    it("debe rechazar registro con email duplicado", async () => {
      const response = await makeRequest(app, "POST", "/auth/register", {
        body: {
          name: "Duplicate User",
          username: "duplicateuser",
          email: "test@example.com", // Email ya existe
          password: "TestPassword123!",
        },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Email already exists");
    });

    it("debe rechazar registro con username duplicado", async () => {
      const response = await makeRequest(app, "POST", "/auth/register", {
        body: {
          name: "Duplicate User",
          username: testUser.username, // Username ya existe
          email: "different@example.com",
          password: "TestPassword123!",
        },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Username already exists");
    });

    it("debe validar formato de contraseña", async () => {
      const response = await makeRequest(app, "POST", "/auth/register", {
        body: {
          name: "Test User",
          username: "testuser2",
          email: "test2@example.com",
          password: "weak", // Contraseña débil
        },
      });

      // Debe fallar la validación de Zod
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("debe procesar solicitud de recuperación de contraseña", async () => {
      const response = await makeRequest(app, "POST", "/auth/forgot-password", {
        body: {
          email: "test@example.com",
        },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.message).toContain("recovery link will be sent");
    });

    it("debe retornar éxito incluso si el email no existe (seguridad)", async () => {
      const response = await makeRequest(app, "POST", "/auth/forgot-password", {
        body: {
          email: "nonexistent@example.com",
        },
      });

      const json = await parseJsonResponse(response);

      expect(response.status).toBe(200);
      expect(json.message).toContain("recovery link will be sent");
    });
  });
});
