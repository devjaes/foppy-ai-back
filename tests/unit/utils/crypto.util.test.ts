import { describe, it, expect } from "vitest";
import { hash, verify } from "@/shared/utils/crypto.util";

describe("crypto.util", () => {
  describe("hash", () => {
    it("debe generar un hash válido para una contraseña", async () => {
      const password = "TestPassword123!";
      const hashed = await hash(password);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
      expect(hashed.length).toBeGreaterThan(0);
      expect(hashed).not.toBe(password);
    });

    it("debe generar hashes diferentes para la misma contraseña (sal aleatoria)", async () => {
      const password = "TestPassword123!";
      const hash1 = await hash(password);
      const hash2 = await hash(password);

      // Los hashes deben ser diferentes debido al salt
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verify", () => {
    it("debe verificar correctamente una contraseña válida", async () => {
      const password = "TestPassword123!";
      const hashed = await hash(password);

      const isValid = await verify(password, hashed);
      expect(isValid).toBe(true);
    });

    it("debe rechazar una contraseña incorrecta", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hashed = await hash(password);

      const isValid = await verify(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });

    it("debe rechazar un hash inválido", async () => {
      const password = "TestPassword123!";
      const invalidHash = "invalid_hash_string";

      try {
        const isValid = await verify(password, invalidHash);
        expect(isValid).toBe(false);
      } catch (error) {
        // Bun.password.verify lanza error con hash inválido, lo cual es el comportamiento esperado
        expect(error).toBeDefined();
      }
    });
  });
});
