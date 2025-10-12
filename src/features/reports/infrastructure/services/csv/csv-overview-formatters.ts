import { formatDateOnly } from "./date-formatter";

export function prepareFinancialOverviewData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = ["seccion", "metrica", "valor", "detalles"];

  const rows = [
    {
      seccion: "Período",
      metrica: "Fecha Inicio",
      valor: formatDateOnly(data.period?.startDate),
    },
    {
      seccion: "Período",
      metrica: "Fecha Fin",
      valor: formatDateOnly(data.period?.endDate),
    },
    {},
    {
      seccion: "Resumen",
      metrica: "Total Ingresos",
      valor: data.summary?.totalIncome,
    },
    {
      seccion: "Resumen",
      metrica: "Total Gastos",
      valor: data.summary?.totalExpense,
    },
    {
      seccion: "Resumen",
      metrica: "Balance Neto",
      valor: data.summary?.netBalance,
    },
    {
      seccion: "Resumen",
      metrica: "Tasa de Ahorro (%)",
      valor: data.summary?.savingsRate,
    },
    {},
    { seccion: "Metas", metrica: "Total", valor: data.goals?.total },
    { seccion: "Metas", metrica: "Completadas", valor: data.goals?.completed },
    { seccion: "Metas", metrica: "En Progreso", valor: data.goals?.inProgress },
    {
      seccion: "Metas",
      metrica: "Total Ahorrado",
      valor: data.goals?.totalSaved,
    },
    {
      seccion: "Metas",
      metrica: "Total Objetivo",
      valor: data.goals?.totalTarget,
    },
    {
      seccion: "Metas",
      metrica: "Progreso General (%)",
      valor: data.goals?.overallProgress,
    },
    {},
    { seccion: "Presupuestos", metrica: "Total", valor: data.budgets?.total },
    {
      seccion: "Presupuestos",
      metrica: "Excedidos",
      valor: data.budgets?.exceeded,
    },
    {
      seccion: "Presupuestos",
      metrica: "Utilización Promedio (%)",
      valor: data.budgets?.averageUtilization,
    },
    {},
    { seccion: "Deudas", metrica: "Total", valor: data.debts?.total },
    {
      seccion: "Deudas",
      metrica: "Monto Total",
      valor: data.debts?.totalAmount,
    },
    {
      seccion: "Deudas",
      metrica: "Total Pendiente",
      valor: data.debts?.totalPending,
    },
    {},
    { seccion: "Categorías Top Gastos" },
  ];

  data.topCategories?.expenses?.forEach((category: any) => {
    rows.push({
      seccion: "Categorías Top Gastos",
      metrica: category.name || "Sin nombre",
      valor: category.amount,
      detalles: `${category.percentage?.toFixed(1)}%`,
    } as any);
  });

  rows.push({}, { seccion: "Categorías Top Ingresos" });

  data.topCategories?.income?.forEach((category: any) => {
    rows.push({
      seccion: "Categorías Top Ingresos",
      metrica: category.name || "Sin nombre",
      valor: category.amount,
      detalles: `${category.percentage?.toFixed(1)}%`,
    } as any);
  });

  return { fields, data: rows };
}
