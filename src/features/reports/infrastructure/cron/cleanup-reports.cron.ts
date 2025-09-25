import { ReportService } from "../../domain/services/report.service";
import { CronJob } from "cron";

export class CleanupReportsCron {
  private static instance: CleanupReportsCron;
  private job: CronJob;

  private constructor(private reportService: ReportService) {
    this.job = new CronJob("0 0 * * *", async () => {
      await this.cleanupExpiredReports();
    });
  }

  public static getInstance(reportService: ReportService): CleanupReportsCron {
    if (!CleanupReportsCron.instance) {
      CleanupReportsCron.instance = new CleanupReportsCron(reportService);
    }
    return CleanupReportsCron.instance;
  }

  public start(): void {
    this.job.start();
  }

  public stop(): void {
    this.job.stop();
  }

  private async cleanupExpiredReports(): Promise<void> {
    try {
      await this.reportService.cleanupExpiredReports();
    } catch (error) {
      console.error("Error cleaning up expired reports:", error);
    }
  }
}
