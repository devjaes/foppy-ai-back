import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduledTransactionService } from '../application/services/scheduled-transaction.service';
import { IScheduledTransactionRepository } from '../domain/ports/scheduled-transaction-repository.port';
import { ITransactionRepository } from '@/transactions/domain/ports/transaction-repository.port';
import { ScheduledTransactionUtilsService } from '../application/services/scheduled-transaction-utils.service';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { ScheduledTransactionApiAdapter } from '../infrastructure/adapters/scheduled-transaction-api.adapter';

// Mocks
vi.mock('../infrastructure/adapters/scheduled-transaction-api.adapter', () => ({
  ScheduledTransactionApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

describe('ScheduledTransactionService', () => {
  let scheduledTransactionService: ScheduledTransactionService;
  let scheduledTransactionRepositoryMock: IScheduledTransactionRepository;
  let transactionRepositoryMock: ITransactionRepository;
  let scheduledTransactionUtilsMock: ScheduledTransactionUtilsService;

  beforeEach(() => {
    scheduledTransactionRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findPendingExecutions: vi.fn(),
    } as any;

    transactionRepositoryMock = {
      create: vi.fn(),
    } as any;

    scheduledTransactionUtilsMock = {
      validateUser: vi.fn(),
      validatePaymentMethod: vi.fn(),
      shouldExecute: vi.fn(),
    } as any;

    (ScheduledTransactionService as any).instance = null;
    scheduledTransactionService = ScheduledTransactionService.getInstance(
      scheduledTransactionRepositoryMock,
      transactionRepositoryMock,
      scheduledTransactionUtilsMock
    );
  });

  describe('getAll', () => {
    it('should return all scheduled transactions', async () => {
      (scheduledTransactionRepositoryMock.findAll as any).mockResolvedValue([]);
      const c = {
        json: vi.fn(),
      };

      await scheduledTransactionService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Scheduled transactions retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if scheduled transaction not found', async () => {
      (scheduledTransactionRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await scheduledTransactionService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Scheduled transaction not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return scheduled transaction if found', async () => {
      (scheduledTransactionRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await scheduledTransactionService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Scheduled transaction retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getByUserId', () => {
    it('should return 404 if user not found', async () => {
      (scheduledTransactionUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await scheduledTransactionService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return user scheduled transactions if user found', async () => {
      (scheduledTransactionUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      (scheduledTransactionRepositoryMock.findByUserId as any).mockResolvedValue([]);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await scheduledTransactionService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'User scheduled transactions retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 404 if user not found', async () => {
      (scheduledTransactionUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1 }) },
        json: vi.fn(),
      };

      await scheduledTransactionService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should create scheduled transaction successfully', async () => {
      (scheduledTransactionUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      (scheduledTransactionRepositoryMock.create as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, name: 'Test', amount: 100, next_execution_date: '2023-01-01' }) },
        json: vi.fn(),
      };

      await scheduledTransactionService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Scheduled transaction created successfully' }),
        HttpStatusCodes.CREATED
      );
    });
  });

  describe('update', () => {
    it('should return 404 if scheduled transaction not found', async () => {
      (scheduledTransactionRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({}) },
        json: vi.fn(),
      };

      await scheduledTransactionService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Scheduled transaction not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should update scheduled transaction successfully', async () => {
      (scheduledTransactionRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (scheduledTransactionRepositoryMock.update as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({ name: 'New Name' }) },
        json: vi.fn(),
      };

      await scheduledTransactionService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Scheduled transaction updated successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('delete', () => {
    it('should return 404 if scheduled transaction not found', async () => {
      (scheduledTransactionRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await scheduledTransactionService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Scheduled transaction not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should delete scheduled transaction successfully', async () => {
      (scheduledTransactionRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (scheduledTransactionRepositoryMock.delete as any).mockResolvedValue(true);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await scheduledTransactionService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Scheduled transaction deleted successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('findPendingExecutions', () => {
    it('should execute pending transactions', async () => {
      const scheduled = { id: 1, userId: 1, amount: 100, nextExecutionDate: new Date(), frequency: 'MONTHLY' };
      (scheduledTransactionRepositoryMock.findPendingExecutions as any).mockResolvedValue([scheduled]);
      (scheduledTransactionUtilsMock.shouldExecute as any).mockResolvedValue(true);
      (transactionRepositoryMock.create as any).mockResolvedValue({ id: 1 });
      
      const c = {
        json: vi.fn(),
      };

      await scheduledTransactionService.findPendingExecutions(c as any);

      expect(transactionRepositoryMock.create).toHaveBeenCalled();
      expect(scheduledTransactionRepositoryMock.update).toHaveBeenCalled();
      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Pending transactions executed successfully' }),
        HttpStatusCodes.OK
      );
    });
  });
});
