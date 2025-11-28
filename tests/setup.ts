import path from "node:path";
import { existsSync } from "node:fs";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { execSync } from "node:child_process";

/**
 * Setup global para tests
 * Asegura que NODE_ENV=test esté configurado antes de cualquier import
 *
 * ⚠️ IMPORTANTE: Este archivo se ejecuta ANTES de cualquier import
 * para asegurar que se use la configuración de test correcta
 */

const envTestPath = path.resolve(process.cwd(), ".env.test");

if (existsSync(envTestPath)) {
  expand(
    config({
      path: envTestPath,
    })
  );
} else {
  expand(config());
}

// Configurar NODE_ENV=test ANTES de cualquier otra cosa
if (process.env.NODE_ENV !== "test") {
  process.env.NODE_ENV = "test";
  console.log("🔧 NODE_ENV configurado a 'test'");
}

// Asegurar que se use una base de datos de test diferente
if (!process.env.TEST_DATABASE_URL) {
  if (process.env.DATABASE_URL) {
    const mainUrl = new URL(process.env.DATABASE_URL);
    const mainDbName = mainUrl.pathname.replace("/", "");

    // Si la BD principal no termina en _test, crear una nueva URL con _test
    if (!mainDbName.endsWith("_test") && !mainDbName.includes("test")) {
      mainUrl.pathname = `/${mainDbName}_test`;
      process.env.TEST_DATABASE_URL = mainUrl.toString();
      console.log(
        "⚠️  TEST_DATABASE_URL no configurado, usando:",
        mainUrl.pathname
      );
      console.log(
        "⚠️  Configura TEST_DATABASE_URL en .env.test para mayor seguridad"
      );
    } else {
      // Si ya tiene test en el nombre, usarla directamente
      process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
    }
  } else {
    console.warn(
      "⚠️  TEST_DATABASE_URL no configurado y DATABASE_URL no encontrado."
    );
  }
}

// Forzar a que la app use la base de datos de test
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

console.log("🧪 Entorno de test configurado");
console.log("📦 NODE_ENV:", process.env.NODE_ENV);
if (process.env.TEST_DATABASE_URL) {
  const testUrl = new URL(process.env.TEST_DATABASE_URL);
  console.log("🗄️  Base de datos de test:", testUrl.pathname);

  // Advertencia si el nombre no contiene "test"
  if (!testUrl.pathname.toLowerCase().includes("test")) {
    console.error(
      "❌ ADVERTENCIA: El nombre de la BD de test no contiene 'test'!"
    );
    console.error("❌ Esto podría ser peligroso. Verifica tu configuración.");
  }
} else {
  console.warn("⚠️  TEST_DATABASE_URL no está configurado");
  console.warn("⚠️  Crea un archivo .env.test con TEST_DATABASE_URL");
}

const ensureMigrations = () => {
  const flag = "__TEST_MIGRATIONS_APPLIED__";
  if ((globalThis as Record<string, any>)[flag]) {
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.warn(
      "⚠️  No se ejecutarán migraciones porque DATABASE_URL no está definido."
    );
    return;
  }

  const drizzleConfigPath = path.resolve(process.cwd(), "drizzle.config.ts");
  const command = `bunx drizzle-kit migrate --config ${drizzleConfigPath}`;

  try {
    execSync(command, {
      stdio: "inherit",
      env: process.env,
    });
    console.log("✅ Migraciones de prueba aplicadas correctamente");
    (globalThis as Record<string, any>)[flag] = true;
  } catch (error) {
    console.error("❌ Error aplicando migraciones de prueba:", error);
    throw error;
  }
};

ensureMigrations();
