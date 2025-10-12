import { formatDate } from "./date-formatter";

export function prepareTransactionsSummaryData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = ["fecha", "tipo", "categoria", "monto", "descripcion"];

  const rows = [
    { fecha: "Resumen", tipo: "Total Ingresos", monto: data.totalIncome },
    { fecha: "Resumen", tipo: "Total Gastos", monto: data.totalExpense },
    { fecha: "Resumen", tipo: "Balance Neto", monto: data.netBalance },
    {
      fecha: "Resumen",
      tipo: "Cantidad Transacciones",
      monto: data.transactionCount,
    },
    { fecha: "Resumen", tipo: "Cantidad Ingresos", monto: data.incomeCount },
    { fecha: "Resumen", tipo: "Cantidad Gastos", monto: data.expenseCount },
    { fecha: "Resumen", tipo: "Ingreso Promedio", monto: data.averageIncome },
    { fecha: "Resumen", tipo: "Gasto Promedio", monto: data.averageExpense },
    {},
    { fecha: "Categorías Principales" },
  ];

  if (data.topIncomeCategory) {
    rows.push({
      fecha: "Categoría Top Ingreso",
      tipo: data.topIncomeCategory.name,
      monto: data.topIncomeCategory.amount,
    });
  }

  if (data.topExpenseCategory) {
    rows.push({
      fecha: "Categoría Top Gasto",
      tipo: data.topExpenseCategory.name,
      monto: data.topExpenseCategory.amount,
    });
  }

  rows.push({}, { fecha: "Transacciones" });

  data.transactions?.forEach((transaction: any) => {
    rows.push({
      fecha: formatDate(transaction.date),
      tipo: transaction.type === "INCOME" ? "Ingreso" : "Gasto",
      categoria: transaction.category || "Sin categoría",
      monto: transaction.amount,
      descripcion: transaction.description || "",
    } as any);
  });

  return { fields, data: rows };
}

export function prepareExpensesByCategoryData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = ["categoria", "monto", "porcentaje", "cantidadTransacciones"];

  const rows = [
    {
      categoria: "Resumen",
      monto: "Total Gastos",
      porcentaje: data.totalExpenses,
    },
    {
      categoria: "Resumen",
      monto: "Cantidad Categorías",
      porcentaje: data.categoryCount,
    },
    {},
    { categoria: "Categorías" },
  ];

  data.categories?.forEach((category: any) => {
    rows.push({
      categoria: category.name,
      monto: category.amount,
      porcentaje: category.percentage,
      cantidadTransacciones: category.transactionCount,
    } as any);

    category.transactions?.forEach((transaction: any) => {
      rows.push({
        categoria: `  ${transaction.description || "Sin descripción"}`,
        monto: transaction.amount,
        porcentaje: "",
        cantidadTransacciones: formatDate(transaction.date),
      } as any);
    });

    rows.push({});
  });

  return { fields, data: rows };
}

export function prepareMonthlyTrendData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = [
    "mes",
    "ingresos",
    "gastos",
    "balance",
    "cantidadTransacciones",
  ];

  const rows = [
    {
      mes: "Resumen",
      ingresos: "Ingreso Mensual Promedio",
      gastos: data.averageMonthlyIncome,
    },
    {
      mes: "Resumen",
      ingresos: "Gasto Mensual Promedio",
      gastos: data.averageMonthlyExpense,
    },
    {
      mes: "Resumen",
      ingresos: "Tendencia",
      gastos: data.trend?.toUpperCase(),
    },
    {},
    { mes: "Datos Mensuales" },
  ];

  data.months?.forEach((month: any) => {
    rows.push({
      mes: month.month,
      ingresos: month.income,
      gastos: month.expense,
      balance: month.balance,
      cantidadTransacciones: month.transactionCount,
    } as any);
  });

  return { fields, data: rows };
}
