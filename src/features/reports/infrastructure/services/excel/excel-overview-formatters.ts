import { Worksheet } from "exceljs";
import { formatDateOnly } from "../csv/date-formatter";

export function formatFinancialOverview(worksheet: Worksheet, data: any) {
  worksheet.addRow(["Período"]);
  worksheet.addRow(["Fecha Inicio", formatDateOnly(data.period?.startDate)]);
  worksheet.addRow(["Fecha Fin", formatDateOnly(data.period?.endDate)]);
  worksheet.addRow([]);

  worksheet.addRow(["Resumen"]);
  worksheet.addRow(["Total Ingresos", data.summary?.totalIncome]);
  worksheet.addRow(["Total Gastos", data.summary?.totalExpense]);
  worksheet.addRow(["Balance Neto", data.summary?.netBalance]);
  worksheet.addRow(["Tasa de Ahorro (%)", data.summary?.savingsRate]);
  worksheet.addRow([]);

  worksheet.addRow(["Metas"]);
  worksheet.addRow(["Total", data.goals?.total]);
  worksheet.addRow(["Completadas", data.goals?.completed]);
  worksheet.addRow(["En Progreso", data.goals?.inProgress]);
  worksheet.addRow(["Total Ahorrado", data.goals?.totalSaved]);
  worksheet.addRow(["Total Objetivo", data.goals?.totalTarget]);
  worksheet.addRow(["Progreso General (%)", data.goals?.overallProgress]);
  worksheet.addRow([]);

  worksheet.addRow(["Presupuestos"]);
  worksheet.addRow(["Total", data.budgets?.total]);
  worksheet.addRow(["Excedidos", data.budgets?.exceeded]);
  worksheet.addRow([
    "Utilización Promedio (%)",
    data.budgets?.averageUtilization,
  ]);
  worksheet.addRow([]);

  worksheet.addRow(["Deudas"]);
  worksheet.addRow(["Total", data.debts?.total]);
  worksheet.addRow(["Monto Total", data.debts?.totalAmount]);
  worksheet.addRow(["Total Pendiente", data.debts?.totalPending]);
  worksheet.addRow([]);

  if (data.topCategories?.expenses && data.topCategories.expenses.length > 0) {
    worksheet.addRow(["Categorías Top Gastos"]);
    worksheet.addRow(["Categoría", "Monto", "Porcentaje"]);

    data.topCategories.expenses.forEach((category: any) => {
      worksheet.addRow([
        category.name || "Sin nombre",
        category.amount,
        category.percentage,
      ]);
    });

    worksheet.addRow([]);
  }

  if (data.topCategories?.income && data.topCategories.income.length > 0) {
    worksheet.addRow(["Categorías Top Ingresos"]);
    worksheet.addRow(["Categoría", "Monto", "Porcentaje"]);

    data.topCategories.income.forEach((category: any) => {
      worksheet.addRow([
        category.name || "Sin nombre",
        category.amount,
        category.percentage,
      ]);
    });
  }
}
