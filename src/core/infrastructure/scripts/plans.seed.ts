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
      { 
        name: "Plan Demo", 
        durationDays: 15, 
        price: "0.00", 
        frequency: "one-time",
        description: "Prueba las funcionalidades básicas",
        features: ["Acceso limitado", "Prueba de concepto"]
      },
      { 
        name: "Plan Lite", 
        durationDays: 30, 
        price: "9.99", 
        frequency: "monthly",
        description: "Perfecto para comenzar con la gestión financiera inteligente",
        features: [
          "Entrada de voz",
          "Acceso ilimitado a IA",
          "Soporte básico",
          "Acceso a la app móvil",
          "Informes exportables"
        ]
      },
      { 
        name: "Plan Lite Anual", 
        durationDays: 365, 
        price: "99.99", 
        frequency: "yearly",
        description: "Perfecto para comenzar con la gestión financiera inteligente",
        features: [
          "Entrada de voz",
          "Acceso ilimitado a IA",
          "Soporte básico",
          "Acceso a la app móvil",
          "Informes exportables"
        ]
      },
      { 
        name: "Plan Plus", 
        durationDays: 30, 
        price: "19.99", 
        frequency: "monthly",
        description: "Para usuarios avanzados que quieren insights avanzados y soporte prioritario",
        features: [
          "Entrada de voz",
          "Acceso ilimitado a IA",
          "Recomendaciones avanzadas",
          "Informes detallados",
          "Soporte prioritario",
          "Categorías personalizadas",
          "Alertas de presupuesto",
          "Sincronización multi-dispositivo"
        ]
      },
      { 
        name: "Plan Plus Anual", 
        durationDays: 365, 
        price: "199.99", 
        frequency: "yearly",
        description: "Para usuarios avanzados que quieren insights avanzados y soporte prioritario",
        features: [
          "Entrada de voz",
          "Acceso ilimitado a IA",
          "Recomendaciones avanzadas",
          "Informes detallados",
          "Soporte prioritario",
          "Categorías personalizadas",
          "Alertas de presupuesto",
          "Sincronización multi-dispositivo"
        ]
      },
    ];
    
    console.log(`Creando ${plansData.length} planes...`);
    
    for (const plan of plansData) {
      await db.insert(plans).values({
        name: plan.name,
        duration_days: plan.durationDays,
        price: plan.price,
        frequency: plan.frequency,
        description: plan.description,
        features: plan.features,
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

