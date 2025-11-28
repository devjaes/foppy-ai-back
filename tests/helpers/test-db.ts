import { drizzle } from "drizzle-orm/node-postgres";
import { getTableName } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "@/core/infrastructure/database/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Configuración de base de datos para tests
 * Usa DATABASE_URL de test o crea una nueva conexión
 */
export class TestDatabase {
  private static instance: TestDatabase;
  private pool: Pool;
  private db: NodePgDatabase<typeof schema>;

  private constructor() {
    // FORZAR uso de base de datos de test - NUNCA usar la base de datos principal
    // Si no hay TEST_DATABASE_URL configurado, usar un nombre de BD diferente
    let databaseUrl = process.env.TEST_DATABASE_URL;

    if (!databaseUrl) {
      // Si hay DATABASE_URL, cambiar el nombre de la base de datos a uno de test
      if (process.env.DATABASE_URL) {
        const mainUrl = new URL(process.env.DATABASE_URL);
        const mainDbName = mainUrl.pathname.replace("/", "");

        // ADVERTENCIA: Verificar que no estamos usando la base de datos principal
        if (!mainDbName.endsWith("_test") && !mainDbName.includes("test")) {
          console.warn(
            "⚠️  ADVERTENCIA: Se está usando la base de datos principal como test!"
          );
          console.warn(
            "⚠️  Configura TEST_DATABASE_URL en .env.test para usar una BD separada"
          );
          console.warn("⚠️  Base de datos principal:", mainDbName);

          // Forzar cambio a nombre de test
          mainUrl.pathname = `/${mainDbName}_test`;
          databaseUrl = mainUrl.toString();
          console.warn("⚠️  Usando base de datos de test:", mainUrl.pathname);
        } else {
          databaseUrl = process.env.DATABASE_URL;
        }
      } else {
        // Fallback a configuración por defecto de test
        databaseUrl =
          "postgresql://postgres:postgres@localhost:5432/fopymes_test";
      }
    }

    // Verificación final de seguridad
    const testDbName = new URL(databaseUrl).pathname
      .replace("/", "")
      .toLowerCase();
    if (!testDbName.includes("test") && process.env.NODE_ENV === "test") {
      console.error(
        "❌ ERROR CRÍTICO: La base de datos de test no contiene 'test' en el nombre!"
      );
      console.error("❌ Base de datos:", testDbName);
      console.error("❌ Esto podría borrar datos de producción!");
      throw new Error(
        "Base de datos de test no configurada correctamente. " +
          "Configura TEST_DATABASE_URL con una base de datos que contenga 'test' en el nombre."
      );
    }

    console.log(
      "🔧 TestDatabase usando:",
      databaseUrl.replace(/:[^:@]+@/, ":****@")
    ); // Ocultar password en log

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: false,
      max: 10,
    });

    this.db = drizzle(this.pool, { schema });
  }

  public static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  public getDb(): NodePgDatabase<typeof schema> {
    return this.db;
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  private async safeDelete(table: any): Promise<void> {
    const tableName = getTableName(table);
    try {
      await this.db.delete(table);
    } catch (error: any) {
      const message = error?.message || "";
      if (typeof message === "string" && message.includes("does not exist")) {
        console.warn(
          `[TestDatabase] Tabla ${tableName} no existe en la BD de test, se omite.`
        );
        return;
      }
      throw error;
    }
  }

  /**
   * Limpia todas las tablas en orden correcto (respetando foreign keys)
   */
  public async cleanDatabase(): Promise<void> {
    // Orden de eliminación respetando foreign keys
    // Primero eliminar tablas que referencian a otras
    await this.safeDelete(schema.goal_contribution_schedule);
    await this.safeDelete(schema.transactions); // Referencia a goal_contributions, debts, budgets, etc.
    await this.safeDelete(schema.goal_contributions); // Después de transactions
    await this.safeDelete(schema.scheduled_transactions);
    await this.safeDelete(schema.debts);
    await this.safeDelete(schema.budgets);
    await this.safeDelete(schema.notifications);
    await this.safeDelete(schema.recommendations);
    await this.safeDelete(schema.goals);
    await this.safeDelete(schema.payment_methods);
    await this.safeDelete(schema.friends);
    await this.safeDelete(schema.users);
    // categories no se eliminan porque son datos de referencia
  }

  /**
   * Verifica conexión a la base de datos
   */
  public async checkConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();
      return true;
    } catch (error) {
      console.error("Error connecting to test database:", error);
      return false;
    }
  }
}

export const testDb = TestDatabase.getInstance();
