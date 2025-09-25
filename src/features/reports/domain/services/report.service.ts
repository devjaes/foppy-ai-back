import {
  Report,
  ReportFilters,
  ReportFormat,
  ReportType,
} from "../entities/report.entity";

export interface ReportService {
  generateReport(
    type: ReportType,
    format: ReportFormat,
    filters: ReportFilters
  ): Promise<Report>;

  getReport(id: string): Promise<Report>;

  deleteReport(id: string): Promise<void>;

  cleanupExpiredReports(): Promise<void>;
}
