import DatabaseConnection from "@/core/infrastructure/database";
import { categories } from "@/schema";

async function seedCategories() {
  console.log("🌱 Iniciando seeding de categorías...");
  
  const db = DatabaseConnection.getInstance().db;
  
  try {
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length > 0) {
      console.log(`Ya existen ${existingCategories.length} categorías en la base de datos.`);
      console.log("Si deseas recrear las categorías, primero elimina las existentes.");
      return;
    }
    
    const expenseCategories = [
      { name: "Otros", description: "Otros gastos" },
      { name: "Alimentación", description: "Supermercado, restaurantes, delivery" },
      { name: "Transporte", description: "Combustible, transporte público, taxis" },
      { name: "Vivienda", description: "Alquiler, hipoteca, servicios, mantenimiento" },
      { name: "Salud", description: "Medicamentos, consultas médicas, seguros de salud" },
      { name: "Educación", description: "Materiales, cursos, matrículas" },
      { name: "Entretenimiento", description: "Cine, eventos, suscripciones" },
      { name: "Ropa", description: "Vestimenta y calzado" },
      { name: "Tecnología", description: "Dispositivos, software, servicios digitales" },
      { name: "Deudas", description: "Pagos de préstamos, tarjetas de crédito" },
      { name: "Mascotas", description: "Alimentación, veterinario, accesorios" },
    ];
    
    const incomeCategories = [
      { name: "Salario", description: "Ingreso por trabajo en relación de dependencia" },
      { name: "Freelance", description: "Ingresos por trabajos independientes" },
      { name: "Inversiones", description: "Rendimientos, dividendos, ganancias de capital" },
      { name: "Regalos", description: "Dinero recibido como regalo" },
      { name: "Reembolsos", description: "Devoluciones de dinero" },
    ];
    
    const allCategories = [...expenseCategories, ...incomeCategories];
    
    console.log(`Creando ${allCategories.length} categorías...`);
    
    for (const category of allCategories) {
      await db.insert(categories).values(category);
    }
    
    console.log("✅ Categorías creadas exitosamente!");
    
  } catch (error) {
    console.error("❌ Error durante la creación de categorías:", error);
  } finally {
    await DatabaseConnection.getInstance().close();
  }
}

if (require.main === module) {
  seedCategories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error fatal durante el seeding de categorías:", error);
      process.exit(1);
    });
}

export default seedCategories;