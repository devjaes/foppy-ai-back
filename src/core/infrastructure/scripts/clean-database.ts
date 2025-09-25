import DatabaseConnection from "@/core/infrastructure/database";
import { sql } from "drizzle-orm";

async function cleanDatabase() {
  console.log("🧹 Iniciando limpieza de la base de datos...");
  
  const db = DatabaseConnection.getInstance().db;
  
  try {
    // Desactivar restricciones de clave foránea temporalmente
    await db.execute(sql`SET session_replication_role = 'replica';`);
    
    // Limpiar datos de todas las tablas en orden inverso a las dependencias
    console.log("🗑️ Eliminando datos existentes...");
    
    await db.execute(sql`
      TRUNCATE TABLE notifications CASCADE;
      TRUNCATE TABLE goal_contribution_schedule CASCADE;
      TRUNCATE TABLE goal_contributions CASCADE;
      TRUNCATE TABLE transactions CASCADE;
      TRUNCATE TABLE budgets CASCADE;
      TRUNCATE TABLE debts CASCADE;
      TRUNCATE TABLE goals CASCADE;
      TRUNCATE TABLE payment_methods CASCADE;
      TRUNCATE TABLE friends CASCADE;
      TRUNCATE TABLE categories CASCADE;
      TRUNCATE TABLE users CASCADE;
    `);
    
    // Reactivar restricciones de clave foránea
    await db.execute(sql`SET session_replication_role = 'origin';`);
    
    console.log("✅ Base de datos limpiada exitosamente!");
    
  } catch (error) {
    console.error("❌ Error durante la limpieza de la base de datos:", error);
    throw error;
  } finally {
    await DatabaseConnection.getInstance().close();
  }
}

// Permitir ejecución directa del script
if (require.main === module) {
  cleanDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error fatal durante la limpieza de la base de datos:", error);
      process.exit(1);
    });
}

export default cleanDatabase; 