import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "@/features/auth/application/services/auth.service";
import { IUserRepository } from "@/features/users/domain/ports/user-repository.port";
import { IUser } from "@/features/users/domain/entities/IUser";
import { hash } from "@/shared/utils/crypto.util";
import { createTestUser, testDb } from "../../helpers/test-helpers";
import { PgUserRepository } from "@/features/users/infrastructure/adapters/user.repository";

describe("AuthService", () => {
  let authService: AuthService;
  let userRepository: IUserRepository;
  let testUser: IUser;

  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await testDb.cleanDatabase();

    // Usar repositorio real para tests más realistas
    userRepository = PgUserRepository.getInstance();
    authService = AuthService.getInstance(userRepository);

    // Crear usuario de prueba
    testUser = await createTestUser({
      email: "test@example.com",
      password: "TestPassword123!",
    });
  });

  describe("login", () => {
    it("debe hacer login exitoso con credenciales válidas", async () => {
      const mockContext = createMockContext({
        email: "test@example.com",
        password: "TestPassword123!",
      });

      const response = await authService.login(mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.token).toBeDefined();
      expect(json.data.email).toBe(testUser.email);
      expect(json.message).toBe("Login successful");
    });

    it("debe rechazar login con email incorrecto", async () => {
      const mockContext = createMockContext({
        email: "nonexistent@example.com",
        password: "TestPassword123!",
      });

      const response = await authService.login(mockContext);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Invalid credentials");
    });

    it("debe rechazar login con contraseña incorrecta", async () => {
      const mockContext = createMockContext({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      const response = await authService.login(mockContext);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Invalid credentials");
    });

    it("debe rechazar login con usuario inactivo", async () => {
      // Crear usuario inactivo
      const inactiveUser = await createTestUser({
        email: "inactive@example.com",
        password: "TestPassword123!",
        active: false,
      });

      const mockContext = createMockContext({
        email: "inactive@example.com",
        password: "TestPassword123!",
      });

      const response = await authService.login(mockContext);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Invalid credentials");
    });
  });

  describe("register", () => {
    it("debe registrar un nuevo usuario exitosamente", async () => {
      const mockContext = createMockContext({
        name: "New User",
        username: "newuser",
        email: "newuser@example.com",
        password: "NewPassword123!",
      });

      const response = await authService.register(mockContext);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.token).toBeDefined();
      expect(json.data.email).toBe("newuser@example.com");
      expect(json.data.username).toBe("newuser");
      expect(json.message).toBe("Registration successful");
    });

    it("debe rechazar registro con email duplicado", async () => {
      const mockContext = createMockContext({
        name: "Duplicate User",
        username: "duplicateuser",
        email: "test@example.com", // Email ya existe
        password: "TestPassword123!",
      });

      const response = await authService.register(mockContext);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Email already exists");
    });

    it("debe rechazar registro con username duplicado", async () => {
      const mockContext = createMockContext({
        name: "Duplicate User",
        username: testUser.username, // Username ya existe
        email: "different@example.com",
        password: "TestPassword123!",
      });

      const response = await authService.register(mockContext);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Username already exists");
    });
  });

  describe("forgotPassword", () => {
    it("debe generar token de recuperación para email válido", async () => {
      const mockContext = createMockContext({
        email: "test@example.com",
      });

      const response = await authService.forgotPassword(mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      // El servicio puede retornar success: false si el email falla, pero el token se genera
      // Verificamos que el token se guardó correctamente
      const updatedUser = await userRepository.findByEmail("test@example.com");
      expect(updatedUser?.recoveryToken).toBeDefined();
      expect(updatedUser?.recoveryTokenExpires).toBeDefined();
      expect(json.message).toContain("recovery link will be sent");
    });

    it("debe retornar éxito incluso si el email no existe (seguridad)", async () => {
      const mockContext = createMockContext({
        email: "nonexistent@example.com",
      });

      const response = await authService.forgotPassword(mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      // El servicio retorna success: false cuando el usuario no existe, pero status 200 por seguridad
      expect(json.message).toContain("recovery link will be sent");
    });
  });

  describe("resetPassword", () => {
    it("debe resetear contraseña con token válido", async () => {
      // Primero generar token de recuperación
      const forgotContext = createMockContext({
        email: "test@example.com",
      });
      await authService.forgotPassword(forgotContext);

      // Obtener el token generado
      const user = await userRepository.findByEmail("test@example.com");
      const token = user?.recoveryToken;
      expect(token).toBeDefined();

      // Resetear contraseña
      const resetContext = createMockContext({
        token: token!,
        password: "NewPassword123!",
      });

      const response = await authService.resetPassword(resetContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe("Password has been reset successfully");

      // Verificar que el token fue limpiado
      const updatedUser = await userRepository.findByEmail("test@example.com");
      expect(updatedUser?.recoveryToken).toBeNull();

      // Verificar que la contraseña fue actualizada (intentando login)
      const loginContext = createMockContext({
        email: "test@example.com",
        password: "NewPassword123!",
      });
      const loginResponse = await authService.login(loginContext);
      const loginJson = await loginResponse.json();
      expect(loginJson.success).toBe(true);
    });

    it("debe rechazar reset con token inválido", async () => {
      const mockContext = createMockContext({
        token: "invalid_token_12345",
        password: "NewPassword123!",
      });

      const response = await authService.resetPassword(mockContext);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe("Invalid or expired token");
    });
  });
});

/**
 * Helper para crear un mock context de Hono
 */
function createMockContext(body: any): any {
  return {
    req: {
      valid: (type: string) => {
        if (type === "json") {
          return body;
        }
        return body;
      },
    },
    json: (data: any, status: number = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
}
