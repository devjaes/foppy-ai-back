import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env before importing service
vi.mock('@/core/infrastructure/env/env', () => ({
  default: {
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
  },
}));

import { BudgetService } from '../application/services/budget.service';
import { IBudgetRepository } from '../domain/ports/budget-repository.port';
import { BudgetUtilsService } from '../application/services/budget-utils.service';
import { ITransactionRepository } from '@/transactions/domain/ports/transaction-repository.port';
import { IPaymentMethodRepository } from '@/payment-methods/domain/ports/payment-method-repository.port';
import { BudgetNotificationService } from '../application/services/budget-notification.service';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { BudgetApiAdapter } from '../infrastructure/adapters/budget-api.adapter';
import { TransactionApiAdapter } from '@/transactions/infrastructure/adapters/transaction-api.adapter';
import { PgTransactionRepository } from '@/transactions/infrastructure/adapters/transaction.repository';

// Mocks
vi.mock('../infrastructure/adapters/budget-api.adapter', () => ({
  BudgetApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

vi.mock('@/transactions/infrastructure/adapters/transaction-api.adapter', () => ({
  TransactionApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
  },
}));

vi.mock('@/transactions/infrastructure/adapters/transaction.repository', () => ({
  PgTransactionRepository: {
    getInstance: vi.fn(),
  },
}));

vi.mock('../application/services/budget-notification.service', () => ({
  BudgetNotificationService: {
    getInstance: vi.fn().mockReturnValue({
      notifyBudgetShared: vi.fn(),
      checkBudgetLimits: vi.fn(),
    }),
  },
}));

describe('BudgetService', () => {
  let budgetService: BudgetService;
  let budgetRepositoryMock: IBudgetRepository;
  let budgetUtilsMock: BudgetUtilsService;
  let transactionRepositoryMock: ITransactionRepository;
  let paymentMethodRepositoryMock: IPaymentMethodRepository;
  let budgetNotificationServiceMock: BudgetNotificationService;

  beforeEach(() => {
    budgetRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndMonth: vi.fn(),
      findSharedWithUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateAmount: vi.fn(),
      updateLimitAmount: vi.fn(),
    } as any;

    budgetUtilsMock = {
      validateUser: vi.fn(),
      validateSharing: vi.fn(),
      validateAmount: vi.fn(),
      canAccess: vi.fn(),
      validatePaymentMethod: vi.fn(),
    } as any;

    transactionRepositoryMock = {
      create: vi.fn(),
      findByBudgetId: vi.fn(),
    } as any;

    paymentMethodRepositoryMock = {
      findById: vi.fn(),
    } as any;

    budgetNotificationServiceMock = {
      notifyBudgetShared: vi.fn(),
      checkBudgetLimits: vi.fn(),
    } as any;

    (PgTransactionRepository.getInstance as any).mockReturnValue(transactionRepositoryMock);

    (BudgetService as any).instance = null;
    budgetService = BudgetService.getInstance(
      budgetRepositoryMock,
      budgetUtilsMock,
      transactionRepositoryMock,
      paymentMethodRepositoryMock,
      budgetNotificationServiceMock
    );
  });

  describe('getAll', () => {
    it('should return all budgets', async () => {
      (budgetRepositoryMock.findAll as any).mockResolvedValue([]);
      const c = {
        json: vi.fn(),
      };

      await budgetService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Budgets retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if budget not found', async () => {
      (budgetRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await budgetService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Budget not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return budget if found', async () => {
      (budgetRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await budgetService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Budget retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getByUserId', () => {
    it('should return 404 if user not found', async () => {
      (budgetUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await budgetService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return user budgets if user found', async () => {
      (budgetUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      (budgetRepositoryMock.findByUserId as any).mockResolvedValue([]);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await budgetService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'User budgets retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 404 if user not found', async () => {
      (budgetUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1 }) },
        json: vi.fn(),
      };

      await budgetService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should create budget successfully', async () => {
      (budgetUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      (budgetRepositoryMock.create as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, limit_amount: 100, month: '2023-01-01' }) },
        json: vi.fn(),
      };

      await budgetService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Budget created successfully' }),
        HttpStatusCodes.CREATED
      );
    });
  });

  describe('update', () => {
    it('should return 404 if budget not found', async () => {
      (budgetRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({}) },
        json: vi.fn(),
      };

      await budgetService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Budget not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should update budget successfully', async () => {
      (budgetRepositoryMock.findById as any).mockResolvedValue({ id: 1, userId: 1 });
      (budgetRepositoryMock.update as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({ limit_amount: 200 }) },
        json: vi.fn(),
      };

      await budgetService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Budget updated successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('delete', () => {
    it('should return 404 if budget not found', async () => {
      (budgetRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await budgetService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Budget not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should delete budget successfully', async () => {
      (budgetRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (budgetRepositoryMock.delete as any).mockResolvedValue(true);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await budgetService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Budget deleted successfully' }),
        HttpStatusCodes.OK
      );
    });
  });
});
