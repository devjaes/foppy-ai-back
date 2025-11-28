import { describe, it, expect, beforeAll } from "vitest";
import { generateToken, verifyToken } from "@/shared/utils/jwt.util";

describe("jwt.util", () => {
  // Asegurar que JWT_SECRET esté configurado
  beforeAll(() => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET =
        "test-secret-key-for-jwt-testing-minimum-32-chars";
    }
  });

  describe("generateToken", () => {
    it("debe generar un token JWT válido", async () => {
      const payload = { id: 1, email: "test@example.com" };
      const token = await generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT tiene 3 partes separadas por puntos
    });

    it("debe generar tokens diferentes para diferentes payloads", async () => {
      const payload1 = { id: 1, email: "test1@example.com" };
      const payload2 = { id: 2, email: "test2@example.com" };

      const token1 = await generateToken(payload1);
      const token2 = await generateToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it("debe incluir el payload en el token", async () => {
      const payload = { id: 123, email: "user@example.com" };
      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified?.id).toBe(payload.id);
      expect(verified?.email).toBe(payload.email);
    });
  });

  describe("verifyToken", () => {
    it("debe verificar correctamente un token válido", async () => {
      const payload = { id: 1, email: "test@example.com" };
      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified?.id).toBe(payload.id);
      expect(verified?.email).toBe(payload.email);
    });

    it("debe rechazar un token inválido", async () => {
      const invalidToken = "invalid.token.string";
      const verified = await verifyToken(invalidToken);

      expect(verified).toBeNull();
    });

    it("debe rechazar un token malformado", async () => {
      const malformedToken = "not.a.valid.jwt.token";
      const verified = await verifyToken(malformedToken);

      expect(verified).toBeNull();
    });

    it("debe rechazar un token vacío", async () => {
      const emptyToken = "";
      const verified = await verifyToken(emptyToken);

      expect(verified).toBeNull();
    });
  });
});

