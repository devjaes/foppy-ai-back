import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportServiceImpl } from '../application/services/report.service';
import { ReportType, ReportFormat } from '../domain/entities/report.entity';

describe('ReportService', () => {
  let reportService: ReportServiceImpl;
  let reportRepositoryMock: any;
  let goalRepositoryMock: any;
  let goalContributionRepositoryMock: any;
  let budgetRepositoryMock: any;
  let transactionRepositoryMock: any;
  let excelServiceMock: any;
  let csvServiceMock: any;

  beforeEach(() => {
    reportRepositoryMock = {
      save: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
      deleteExpired: vi.fn(),
    };
    goalRepositoryMock = {
      findByFilters: vi.fn(),
    };
    goalContributionRepositoryMock = {};
    budgetRepositoryMock = {
      findByUserId: vi.fn(),
    };
    transactionRepositoryMock = {
      findByFilters: vi.fn(),
      getMonthlyBalance: vi.fn(),
      getCategoryTotals: vi.fn(),
      getMonthlyTrends: vi.fn(),
    };
    excelServiceMock = {};
    csvServiceMock = {};

    (ReportServiceImpl as any).instance = null;
    reportService = ReportServiceImpl.getInstance(
      reportRepositoryMock,
      goalRepositoryMock,
      goalContributionRepositoryMock,
      budgetRepositoryMock,
      transactionRepositoryMock,
      excelServiceMock,
      csvServiceMock
    );
  });

  describe('generateReport', () => {
    it('should generate GOALS_BY_STATUS report', async () => {
      const filters = { userId: '1' };
      (goalRepositoryMock.findByFilters as any).mockResolvedValue([]);
      (reportRepositoryMock.save as any).mockImplementation((report: any) => Promise.resolve(report));

      const report = await reportService.generateReport(
        ReportType.GOALS_BY_STATUS,
        ReportFormat.JSON,
        filters
      );

      expect(report).toBeDefined();
      expect(report.type).toBe(ReportType.GOALS_BY_STATUS);
      expect(report.data).toEqual({
        completed: 0,
        expired: 0,
        inProgress: 0,
        total: 0,
        goals: [],
      });
      expect(reportRepositoryMock.save).toHaveBeenCalled();
    });

    it('should generate TRANSACTIONS_SUMMARY report', async () => {
      const filters = { userId: '1' };
      (transactionRepositoryMock.findByFilters as any).mockResolvedValue([]);
      (reportRepositoryMock.save as any).mockImplementation((report: any) => Promise.resolve(report));

      const report = await reportService.generateReport(
        ReportType.TRANSACTIONS_SUMMARY,
        ReportFormat.JSON,
        filters
      );

      expect(report).toBeDefined();
      expect(report.type).toBe(ReportType.TRANSACTIONS_SUMMARY);
      expect(report.data).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        transactionCount: 0,
        incomeCount: 0,
        expenseCount: 0,
        averageIncome: 0,
        averageExpense: 0,
        transactions: [],
      });
    });

    it('should throw error for unsupported report type', async () => {
      const filters = { userId: '1' };
      await expect(
        reportService.generateReport('UNSUPPORTED' as any, ReportFormat.JSON, filters)
      ).rejects.toThrow('Unsupported report type: UNSUPPORTED');
    });
  });

  describe('getReport', () => {
    it('should return report if found', async () => {
      const mockReport = { id: '1', type: ReportType.GOALS_BY_STATUS };
      (reportRepositoryMock.findById as any).mockResolvedValue(mockReport);

      const report = await reportService.getReport('1');

      expect(report).toEqual(mockReport);
    });

    it('should throw error if report not found', async () => {
      (reportRepositoryMock.findById as any).mockResolvedValue(null);

      await expect(reportService.getReport('1')).rejects.toThrow('Report not found');
    });
  });
});
