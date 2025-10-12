export function prepareBudgetPerformanceData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = [
    "nombreCategoria",
    "mes",
    "montoLimite",
    "montoActual",
    "porcentaje",
    "estado",
  ];

  const rows = [
    {
      nombreCategoria: "Resumen",
      mes: "Total Presupuestos",
      montoLimite: data.totalBudgets,
    },
    {
      nombreCategoria: "Resumen",
      mes: "Cantidad Excedidos",
      montoLimite: data.exceededCount,
    },
    {
      nombreCategoria: "Resumen",
      mes: "Cantidad Advertencia",
      montoLimite: data.warningCount,
    },
    {
      nombreCategoria: "Resumen",
      mes: "Cantidad Buenos",
      montoLimite: data.goodCount,
    },
    {},
    { nombreCategoria: "Detalles Presupuestos" },
  ];

  data.budgets?.forEach((budget: any) => {
    const statusLabel =
      budget.status === "exceeded"
        ? "EXCEDIDO"
        : budget.status === "warning"
        ? "ADVERTENCIA"
        : "BUENO";

    rows.push({
      nombreCategoria: budget.categoryName || "Sin categoría",
      mes: budget.month || "N/A",
      montoLimite: budget.limitAmount,
      montoActual: budget.currentAmount,
      porcentaje: budget.percentage,
      estado: statusLabel,
    } as any);
  });

  return { fields, data: rows };
}
