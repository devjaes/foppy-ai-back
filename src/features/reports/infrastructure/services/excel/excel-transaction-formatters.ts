import { Worksheet } from "exceljs";
import { formatDate } from "../csv/date-formatter";

export function formatTransactionsSummary(worksheet: Worksheet, data: any) {
  worksheet.addRow(["Resumen"]);
  worksheet.addRow(["Total Ingresos", data.totalIncome]);
  worksheet.addRow(["Total Gastos", data.totalExpense]);
  worksheet.addRow(["Balance Neto", data.netBalance]);
  worksheet.addRow(["Cantidad Transacciones", data.transactionCount]);
  worksheet.addRow(["Cantidad Ingresos", data.incomeCount]);
  worksheet.addRow(["Cantidad Gastos", data.expenseCount]);
  worksheet.addRow(["Ingreso Promedio", data.averageIncome]);
  worksheet.addRow(["Gasto Promedio", data.averageExpense]);
  worksheet.addRow([]);

  if (data.topIncomeCategory) {
    worksheet.addRow([
      "Categoría Top Ingreso",
      data.topIncomeCategory.name,
      data.topIncomeCategory.amount,
    ]);
  }

  if (data.topExpenseCategory) {
    worksheet.addRow([
      "Categoría Top Gasto",
      data.topExpenseCategory.name,
      data.topExpenseCategory.amount,
    ]);
  }

  worksheet.addRow([]);
  worksheet.addRow(["Transacciones"]);
  worksheet.addRow(["Fecha", "Tipo", "Categoría", "Monto", "Descripción"]);

  data.transactions?.forEach((transaction: any) => {
    worksheet.addRow([
      formatDate(transaction.date),
      transaction.type === "INCOME" ? "Ingreso" : "Gasto",
      transaction.category || "Sin categoría",
      transaction.amount,
      transaction.description || "",
    ]);
  });
}

export function formatExpensesByCategory(worksheet: Worksheet, data: any) {
  worksheet.addRow(["Resumen"]);
  worksheet.addRow(["Total Gastos", data.totalExpenses]);
  worksheet.addRow(["Cantidad Categorías", data.categoryCount]);
  worksheet.addRow([]);

  worksheet.addRow(["Categorías"]);
  worksheet.addRow([
    "Categoría",
    "Monto",
    "Porcentaje",
    "Cantidad Transacciones",
  ]);

  data.categories?.forEach((category: any) => {
    worksheet.addRow([
      category.name,
      category.amount,
      category.percentage,
      category.transactionCount,
    ]);

    if (category.transactions && category.transactions.length > 0) {
      worksheet.addRow(["Transacciones"]);
      worksheet.addRow(["Descripción", "Monto", "Fecha"]);

      category.transactions.forEach((transaction: any) => {
        worksheet.addRow([
          transaction.description || "Sin descripción",
          transaction.amount,
          formatDate(transaction.date),
        ]);
      });

      worksheet.addRow([]);
    }
  });
}

export function formatMonthlyTrend(worksheet: Worksheet, data: any) {
  worksheet.addRow(["Resumen"]);
  worksheet.addRow(["Ingreso Mensual Promedio", data.averageMonthlyIncome]);
  worksheet.addRow(["Gasto Mensual Promedio", data.averageMonthlyExpense]);
  worksheet.addRow(["Tendencia", data.trend?.toUpperCase()]);
  worksheet.addRow([]);

  worksheet.addRow(["Datos Mensuales"]);
  worksheet.addRow([
    "Mes",
    "Ingresos",
    "Gastos",
    "Balance",
    "Cantidad Transacciones",
  ]);

  data.months?.forEach((month: any) => {
    worksheet.addRow([
      month.month,
      month.income,
      month.expense,
      month.balance,
      month.transactionCount,
    ]);
  });
}
