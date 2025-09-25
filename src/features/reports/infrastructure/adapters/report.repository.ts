import { eq, lt } from "drizzle-orm";
import DatabaseConnection from "../../../../core/infrastructure/database";
import {
  Report,
  ReportFormat,
  ReportType,
} from "../../domain/entities/report.entity";
import { ReportRepository } from "../../domain/repositories/report.repository";
import { reports } from "../../../../core/infrastructure/database/schema";

export class PgReportRepository implements ReportRepository {
  private static instance: PgReportRepository;

  private db = DatabaseConnection.getInstance().db;

  private constructor() {}

  public static getInstance(): PgReportRepository {
    if (!PgReportRepository.instance) {
      PgReportRepository.instance = new PgReportRepository();
    }
    return PgReportRepository.instance;
  }

  async save(report: Report): Promise<Report> {
    const result = await this.db
      .insert(reports)
      .values({
        user_id: report.userId,
        type: report.type,
        format: report.format,
        data: report.data,
        expires_at: report.expiresAt,
      })
      .returning();

    return this.mapToReport(result[0]);
  }

  async findById(id: string): Promise<Report | null> {
    const result = await this.db
      .select()
      .from(reports)
      .where(eq(reports.id, parseInt(id)));

    if (!result || result.length === 0) {
      return null;
    }

    return this.mapToReport(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(reports).where(eq(reports.id, parseInt(id)));
  }

  async deleteExpired(): Promise<void> {
    await this.db.delete(reports).where(lt(reports.expires_at, new Date()));
  }

  private mapToReport(row: any): Report {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as ReportType,
      format: row.format as ReportFormat,
      filters: row.filters ?? {},
      data: row.data ?? {},
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }
}
