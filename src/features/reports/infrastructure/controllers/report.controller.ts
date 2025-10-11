import { createRouter } from "@/core/infrastructure/lib/create-app";
import { ReportFormat, ReportType } from "../../domain/entities/report.entity";
import { z } from "zod";
import { Context } from "hono";
import { PgReportRepository } from "../adapters/report.repository";
import { AppBindings } from "@/core/infrastructure/types/app-types";
import { ReportServiceImpl } from "../../application/services/report.service";
import { PgGoalRepository } from "@/goals/infrastucture/adapters/goal.repository";
import { PgGoalContributionRepository } from "@/goals/infrastucture/adapters/goal-contribution.repository";
import { PgBudgetRepository } from "@/budgets/infrastructure/adapters/budget.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { Data } from "hono/dist/types/context";
import { ExcelService } from "../services/excel.service";
import { CSVService } from "../services/csv.service";
import { CleanupReportsCron } from "../cron/cleanup-reports.cron";
import * as routes from "./report.routes";
import { PDFService } from "../services/pdf.service";

const reportRepository = PgReportRepository.getInstance();
const goalRepository = PgGoalRepository.getInstance();
const goalContributionRepository = PgGoalContributionRepository.getInstance();
const budgetRepository = PgBudgetRepository.getInstance();
const transactionRepository = PgTransactionRepository.getInstance();
const excelService = new ExcelService();
const csvService = new CSVService();
const pdfService = new PDFService();

const reportService = ReportServiceImpl.getInstance(
  reportRepository,
  goalRepository,
  goalContributionRepository,
  budgetRepository,
  transactionRepository,
  excelService,
  csvService
);

const generateReportHandler = createHandler(async (c: Context<AppBindings>) => {
  try {
    const { type, format, filters } = await c.req.json();

    // FIXED: Convertir strings de fecha a Date objects
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      // ADDED: Para reportes, siempre usar 'created_at' para filtrar metas
      filterBy: 'created_at' as const,
    };

    // FIXED: Validar que goalId sea proporcionado cuando se requiere
    const requiresGoalId = [
      ReportType.CONTRIBUTIONS_BY_GOAL,
      ReportType.SAVINGS_COMPARISON,
    ];

    if (requiresGoalId.includes(type) && !processedFilters.goalId) {
      return c.json(
        {
          success: false,
          data: null,
          message: "Se requiere seleccionar una meta para este tipo de reporte",
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    const report = await reportService.generateReport(type, format, processedFilters);
    
    return c.json(
      {
        success: true,
        data: {
          id: report.id?.toString() || "",
          type: report.type,
          format: report.format,
          createdAt: report.createdAt?.toISOString(),
          expiresAt: report.expiresAt?.toISOString(),
        },
        message: "Report generated successfully",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error generating report:", error);

    return c.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Failed to generate report",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }
});

const getReportHandler = createHandler(async (c: Context<AppBindings>) => {
  try {
    const { id } = c.req.param();
    const report = await reportService.getReport(id);

    if (report.format === ReportFormat.PDF) {
      const pdfBuffer = await pdfService.generatePDF(report);

      return new Response(pdfBuffer, {
        status: HttpStatusCodes.OK,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="report-${id}.pdf"`,
        },
      });
    }

    if (report.format === ReportFormat.EXCEL) {
      const excelBuffer = await excelService.generateExcel(report);
      return new Response(excelBuffer, {
        status: HttpStatusCodes.OK,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="report-${id}.xlsx"`,
        },
      });
    }

    if (report.format === ReportFormat.CSV) {
      const csvBuffer = await csvService.generateCSV(report);
      return new Response(csvBuffer, {
        status: HttpStatusCodes.OK,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report-${id}.csv"`,
        },
      });
    }

    // FIXED: Manejar correctamente las fechas en el response JSON
    return c.json(
      {
        success: true,
        data: {
          id: report.id,
          type: report.type,
          format: report.format,
          data: report.data,
          createdAt: typeof report.createdAt === 'string' 
            ? report.createdAt 
            : report.createdAt?.toISOString(),
          expiresAt: typeof report.expiresAt === 'string'
            ? report.expiresAt
            : report.expiresAt?.toISOString(),
        },
        message: "Report retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error retrieving report:", error);
    
    return c.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Failed to get report",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }
});

const deleteReportHandler = createHandler(async (c: Context<AppBindings>) => {
  try {
    const { id } = c.req.param();
    await reportService.deleteReport(id);
    return c.body(null, HttpStatusCodes.NO_CONTENT);
  } catch (error) {
    return c.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Failed to delete report",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }
});

const router = createRouter()
  .openapi(routes.generate, generateReportHandler)
  .openapi(routes.get, getReportHandler)
  .openapi(routes.delete_, deleteReportHandler);

export default router;

// Start cleanup reports cron
const cleanupReportsCron = CleanupReportsCron.getInstance(reportService);
cleanupReportsCron.start();
