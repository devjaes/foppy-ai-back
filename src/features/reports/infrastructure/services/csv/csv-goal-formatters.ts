import { Parser } from "json2csv";
import { formatDate, formatDateOnly } from "./date-formatter";

export function prepareGoalsByStatusData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = [
    "nombre",
    "estado",
    "montoObjetivo",
    "montoActual",
    "progreso",
    "fechaLimite",
  ];
  const rows = data.goals.map((goal: any) => ({
    nombre: goal.name,
    estado: goal.status,
    montoObjetivo: goal.targetAmount,
    montoActual: goal.currentAmount,
    progreso: goal.progress,
    fechaLimite: formatDateOnly(goal.deadline),
  }));

  rows.push(
    {},
    { nombre: "Resumen" },
    { nombre: "Total Metas", estado: data.total },
    { nombre: "Metas Completadas", estado: data.completed },
    { nombre: "Metas Expiradas", estado: data.expired },
    { nombre: "Metas en Progreso", estado: data.inProgress }
  );

  return { fields, data: rows };
}

export function prepareGoalsByCategoryData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = [
    "categoria",
    "totalMetas",
    "montoTotal",
    "montoCompletado",
    "progreso",
  ];
  const rows: any[] = [];

  data.categories.forEach((category: any) => {
    rows.push({
      categoria: category.name,
      totalMetas: category.totalGoals,
      montoTotal: category.totalAmount,
      montoCompletado: category.completedAmount,
      progreso: category.progress,
    });

    category.goals.forEach((goal: any) => {
      rows.push({
        categoria: `  ${goal.name}`,
        totalMetas: "",
        montoTotal: goal.targetAmount,
        montoCompletado: goal.currentAmount,
        progreso: goal.progress,
      });
    });

    rows.push({});
  });

  return { fields, data: rows };
}

export function prepareContributionsByGoalData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = ["fecha", "monto", "idTransaccion"];
  const rows = [
    { fecha: "Nombre de Meta", monto: data.goalName },
    {},
    ...data.contributions.map((contribution: any) => ({
      fecha: formatDate(contribution.date),
      monto: contribution.amount,
      idTransaccion: contribution.transactionId,
    })),
    {},
    { fecha: "Total Contribuciones", monto: data.totalContributions },
    { fecha: "Contribución Promedio", monto: data.averageContribution },
    {
      fecha: "Última Contribución",
      monto: formatDate(data.lastContributionDate),
    },
  ];

  return { fields, data: rows };
}

export function prepareSavingsComparisonData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = ["fecha", "montoPlanificado", "montoReal", "diferencia"];
  const rows = [
    { fecha: "Nombre de Meta", montoPlanificado: data.goalName },
    {},
    ...data.deviations.map((deviation: any) => ({
      fecha: formatDate(deviation.date),
      montoPlanificado: deviation.plannedAmount,
      montoReal: deviation.actualAmount,
      diferencia: deviation.difference,
    })),
  ];

  return { fields, data: rows };
}

export function prepareSavingsSummaryData(data: any): {
  fields: string[];
  data: any[];
} {
  const fields = ["metrica", "valor"];
  const rows = [
    { metrica: "Total Metas", valor: data.totalGoals },
    { metrica: "Monto Total Objetivo", valor: data.totalTargetAmount },
    { metrica: "Monto Total Actual", valor: data.totalCurrentAmount },
    { metrica: "Progreso General (%)", valor: data.overallProgress },
    { metrica: "Metas Completadas", valor: data.completedGoals },
    { metrica: "Metas Expiradas", valor: data.expiredGoals },
    { metrica: "Metas en Progreso", valor: data.inProgressGoals },
    { metrica: "Contribución Promedio", valor: data.averageContribution },
    {
      metrica: "Fecha Última Contribución",
      valor: formatDate(data.lastContributionDate),
    },
    {},
    { metrica: "Desglose por Categoría" },
  ];

  data.categoryBreakdown.forEach((category: any) => {
    rows.push(
      { metrica: category.categoryName },
      { metrica: "  Total Metas", valor: category.totalGoals },
      { metrica: "  Monto Total", valor: category.totalAmount },
      { metrica: "  Progreso (%)", valor: category.progress },
      {}
    );
  });

  return { fields, data: rows };
}
