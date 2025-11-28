import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from '../application/services/transactions.service';
import { ITransactionRepository } from '@/transactions/domain/ports/transaction-repository.port';
import { TransactionUtilsService } from '../application/services/transactions-utils.service';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { TransactionApiAdapter } from '@/transactions/infrastructure/adapters/transaction-api.adapter';

vi.mock('@/transactions/infrastructure/adapters/transaction-api.adapter', () => ({
  TransactionApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let transactionRepositoryMock: ITransactionRepository;
  let transactionUtilsMock: TransactionUtilsService;

  beforeEach(() => {
    transactionRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByFilters: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getMonthlyBalance: vi.fn(),
      getCategoryTotals: vi.fn(),
      getMonthlyTrends: vi.fn(),
      findByContributionId: vi.fn(),
    } as any;

    transactionUtilsMock = {
      validateUser: vi.fn(),
      validatePaymentMethod: vi.fn(),
    } as any;

    (TransactionService as any).instance = null;
    transactionService = TransactionService.getInstance(
      transactionRepositoryMock,
      transactionUtilsMock
    );
  });

  describe('getAll', () => {
    it('should return all transactions', async () => {
      const transactions = [{ id: 1, amount: 100 }];
      (transactionRepositoryMock.findAll as any).mockResolvedValue(transactions);
      const c = {
        json: vi.fn(),
      };

      await transactionService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ amount: 100 })]),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if transaction not found', async () => {
      (transactionRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await transactionService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Transaction not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return transaction if found', async () => {
      const transaction = { id: 1, amount: 100 };
      (transactionRepositoryMock.findById as any).mockResolvedValue(transaction);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await transactionService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ amount: 100 }),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 404 if user not found', async () => {
      (transactionUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1 }) },
        json: vi.fn(),
      };

      await transactionService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return 400 if payment method invalid', async () => {
      (transactionUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      (transactionUtilsMock.validatePaymentMethod as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, payment_method_id: 2 }) },
        json: vi.fn(),
      };

      await transactionService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid payment method' }),
        HttpStatusCodes.BAD_REQUEST
      );
    });

    it('should create transaction successfully', async () => {
      (transactionUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      const transactionData = {
        user_id: 1,
        amount: 100,
        type: 'EXPENSE',
        description: 'Test',
      };
      const createdTransaction = { id: 1, ...transactionData };
      (transactionRepositoryMock.create as any).mockResolvedValue(createdTransaction);
      const c = {
        req: { valid: vi.fn().mockReturnValue(transactionData) },
        json: vi.fn(),
      };

      await transactionService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ amount: 100 }),
        }),
        HttpStatusCodes.CREATED
      );
    });
  });

  describe('update', () => {
    it('should return 404 if transaction not found', async () => {
      (transactionRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({}) },
        json: vi.fn(),
      };

      await transactionService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Transaction not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should update transaction successfully', async () => {
      const existingTransaction = { id: 1, amount: 100, userId: 1 };
      (transactionRepositoryMock.findById as any).mockResolvedValue(existingTransaction);
      const updateData = { amount: 200 };
      const updatedTransaction = { ...existingTransaction, ...updateData };
      (transactionRepositoryMock.update as any).mockResolvedValue(updatedTransaction);
      
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue(updateData) },
        json: vi.fn(),
      };

      await transactionService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ amount: 200 }),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('delete', () => {
    it('should return 404 if transaction not found', async () => {
      (transactionRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await transactionService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Transaction not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should delete transaction successfully', async () => {
      (transactionRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (transactionRepositoryMock.delete as any).mockResolvedValue(true);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await transactionService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { deleted: true },
        }),
        HttpStatusCodes.OK
      );
    });
  });
});
