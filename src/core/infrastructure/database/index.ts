import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import env from "@/env";
import * as schema from "./schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;
  private drizzleInstance: NodePgDatabase<typeof schema>;
  private isClosing: boolean = false;

  private constructor() {
    // Si existe DATABASE_URL, usar esa cadena de conexión, de lo contrario construir los parámetros
    if (env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    } else {
      // Determinar el host basado en el entorno
      const host = process.env.NODE_ENV === "production" ? "db" : "localhost";

      this.pool = new Pool({
        host,
        port: Number(
          env.NODE_ENV === "production" ? "5432" : env.DATABASE_PORT
        ),
        user: env.DATABASE_USERNAME,
        password: env.DATABASE_PASSWORD,
        database: env.DATABASE_NAME,
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }

    this.drizzleInstance = drizzle(this.pool, { schema });

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      process.exit(-1);
    });

    process.once("SIGINT", async () => {
      console.info("\nReceived SIGINT. Closing database connection...");
      await this.close();
      process.exit(0);
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public get db(): NodePgDatabase<typeof schema> {
    return this.drizzleInstance;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query("SELECT NOW()");
      client.release();
      console.info("Database connection successful at", env.DATABASE_URL);
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }

  public getPoolStatus(): string {
    return `Total: ${this.pool.totalCount} | Idle: ${this.pool.idleCount} | Waiting: ${this.pool.waitingCount}`;
  }

  public async close(): Promise<void> {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;

    try {
      await this.pool.end();
      console.info("✅ Database connection closed successfully");
    } catch (error) {
      console.error("❌ Error closing database connection:", error);
      throw error;
    }
  }
}

export const db = DatabaseConnection.getInstance().db;

export default DatabaseConnection;
