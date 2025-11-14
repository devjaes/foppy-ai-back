import DatabaseConnection from "@/core/infrastructure/database";
import { plans } from "@/schema";

async function seedPlans() {
  console.log("🌱 Iniciando seeding de planes...");
  
  const db = DatabaseConnection.getInstance().db;
  
  try {
    const existingPlans = await db.select().from(plans);
    
    if (existingPlans.length > 0) {
      console.log(`Ya existen ${existingPlans.length} planes en la base de datos.`);
      return;
    }
    
    const plansData = [
      { name: "demo", durationDays: 15, price: "0.00", frequency: "one-time" },
      { name: "lite", durationDays: 30, price: "9.99", frequency: "monthly" },
      { name: "lite", durationDays: 365, price: "99.99", frequency: "yearly" },
      { name: "plus", durationDays: 30, price: "19.99", frequency: "monthly" },
      { name: "plus", durationDays: 365, price: "199.99", frequency: "yearly" },
    ];
    
    console.log(`Creando ${plansData.length} planes...`);
    
    for (const plan of plansData) {
      await db.insert(plans).values({
        name: plan.name,
        duration_days: plan.durationDays,
        price: plan.price,
        frequency: plan.frequency,
      });
    }
    
    console.log("✅ Planes creados exitosamente!");
    
  } catch (error) {
    console.error("❌ Error durante la creación de planes:", error);
  } finally {
    await DatabaseConnection.getInstance().close();
  }
}

if (require.main === module) {
  seedPlans()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error fatal durante el seeding de planes:", error);
      process.exit(1);
    });
}

export default seedPlans;

