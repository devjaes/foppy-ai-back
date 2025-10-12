import { Worksheet } from "exceljs";

export function formatBudgetPerformance(worksheet: Worksheet, data: any) {
  worksheet.addRow(["Resumen"]);
  worksheet.addRow(["Total Presupuestos", data.totalBudgets]);
  worksheet.addRow(["Cantidad Excedidos", data.exceededCount]);
  worksheet.addRow(["Cantidad Advertencia", data.warningCount]);
  worksheet.addRow(["Cantidad Buenos", data.goodCount]);
  worksheet.addRow([]);

  worksheet.addRow(["Detalles Presupuestos"]);
  worksheet.addRow([
    "Categoría",
    "Mes",
    "Monto Límite",
    "Monto Actual",
    "Porcentaje",
    "Estado",
  ]);

  data.budgets?.forEach((budget: any) => {
    const statusLabel =
      budget.status === "exceeded"
        ? "EXCEDIDO"
        : budget.status === "warning"
        ? "ADVERTENCIA"
        : "BUENO";

    worksheet.addRow([
      budget.categoryName || "Sin categoría",
      budget.month || "N/A",
      budget.limitAmount,
      budget.currentAmount,
      budget.percentage,
      statusLabel,
    ]);
  });
}
