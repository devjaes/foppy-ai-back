import { Worksheet } from "exceljs";
import { formatDate, formatDateOnly } from "../csv/date-formatter";

export function formatGoalsByStatus(worksheet: Worksheet, data: any) {
  worksheet.addRow([
    "Nombre",
    "Estado",
    "Monto Objetivo",
    "Monto Actual",
    "Progreso",
    "Fecha Límite",
  ]);

  data.goals?.forEach((goal: any) => {
    worksheet.addRow([
      goal.name,
      goal.status,
      goal.targetAmount,
      goal.currentAmount,
      goal.progress,
      formatDateOnly(goal.deadline),
    ]);
  });

  worksheet.addRow([]);
  worksheet.addRow(["Resumen"]);
  worksheet.addRow(["Total Metas", data.total]);
  worksheet.addRow(["Metas Completadas", data.completed]);
  worksheet.addRow(["Metas Expiradas", data.expired]);
  worksheet.addRow(["Metas en Progreso", data.inProgress]);
}

export function formatGoalsByCategory(worksheet: Worksheet, data: any) {
  worksheet.addRow([
    "Categoría",
    "Total Metas",
    "Monto Total",
    "Monto Completado",
    "Progreso",
  ]);

  data.categories.forEach((category: any) => {
    worksheet.addRow([
      category.name,
      category.totalGoals,
      category.totalAmount,
      category.completedAmount,
      category.progress,
    ]);

    category.goals.forEach((goal: any) => {
      worksheet.addRow([
        `  ${goal.name}`,
        "",
        goal.targetAmount,
        goal.currentAmount,
        goal.progress,
      ]);
    });

    worksheet.addRow([]);
  });
}

export function formatContributionsByGoal(worksheet: Worksheet, data: any) {
  worksheet.addRow(["Fecha", "Monto", "ID Transacción"]);

  worksheet.addRow(["Nombre de Meta", data.goalName]);
  worksheet.addRow([]);

  data.contributions.forEach((contribution: any) => {
    worksheet.addRow([
      formatDate(contribution.date),
      contribution.amount,
      contribution.transactionId,
    ]);
  });

  worksheet.addRow([]);
  worksheet.addRow(["Total Contribuciones", data.totalContributions]);
  worksheet.addRow(["Contribución Promedio", data.averageContribution]);
  worksheet.addRow([
    "Última Contribución",
    formatDate(data.lastContributionDate),
  ]);
}

export function formatSavingsComparison(worksheet: Worksheet, data: any) {
  worksheet.addRow(["Fecha", "Monto Planificado", "Monto Real", "Diferencia"]);

  worksheet.addRow(["Nombre de Meta", data.goalName]);
  worksheet.addRow([]);

  data.deviations.forEach((deviation: any) => {
    worksheet.addRow([
      formatDate(deviation.date),
      deviation.plannedAmount,
      deviation.actualAmount,
      deviation.difference,
    ]);
  });
}

export function formatSavingsSummary(worksheet: Worksheet, data: any) {
  worksheet.addRow(["Métrica", "Valor"]);

  worksheet.addRow(["Total Metas", data.totalGoals]);
  worksheet.addRow(["Monto Total Objetivo", data.totalTargetAmount]);
  worksheet.addRow(["Monto Total Actual", data.totalCurrentAmount]);
  worksheet.addRow(["Progreso General (%)", data.overallProgress]);
  worksheet.addRow(["Metas Completadas", data.completedGoals]);
  worksheet.addRow(["Metas Expiradas", data.expiredGoals]);
  worksheet.addRow(["Metas en Progreso", data.inProgressGoals]);
  worksheet.addRow(["Contribución Promedio", data.averageContribution]);
  worksheet.addRow([
    "Fecha Última Contribución",
    formatDate(data.lastContributionDate),
  ]);

  worksheet.addRow([]);
  worksheet.addRow(["Desglose por Categoría"]);

  data.categoryBreakdown.forEach((category: any) => {
    worksheet.addRow([category.categoryName]);
    worksheet.addRow(["  Total Metas", category.totalGoals]);
    worksheet.addRow(["  Monto Total", category.totalAmount]);
    worksheet.addRow(["  Progreso (%)", category.progress]);
    worksheet.addRow([]);
  });
}
