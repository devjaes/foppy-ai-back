import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtService } from '../application/services/debt.service';
import { IDebtRepository } from '../domain/ports/debt-repository.port';
import { DebtUtilsService } from '../application/services/debt-utils.service';
import { ITransactionRepository } from '@/transactions/domain/ports/transaction-repository.port';
import { IPaymentMethodRepository } from '@/payment-methods/domain/ports/payment-method-repository.port';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { DebtApiAdapter } from '../infrastructure/adapters/debt-api.adapter';
import { TransactionApiAdapter } from '@/transactions/infrastructure/adapters/transaction-api.adapter';

// Mocks
vi.mock('../infrastructure/adapters/debt-api.adapter', () => ({
  DebtApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

vi.mock('@/transactions/infrastructure/adapters/transaction-api.adapter', () => ({
  TransactionApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

vi.mock('../application/services/debt-notification.service', () => ({
  DebtNotificationService: {
    getInstance: vi.fn().mockReturnValue({
      notifyDebtCreated: vi.fn(),
      checkDueDateApproaching: vi.fn(),
      notifyDebtPaymentStatusChanged: vi.fn(),
      notifyDebtAmountUpdated: vi.fn(),
    }),
  },
}));

describe('DebtService', () => {
  let debtService: DebtService;
  let debtRepositoryMock: IDebtRepository;
  let transactionRepositoryMock: ITransactionRepository;
  let debtUtilsMock: DebtUtilsService;
  let paymentMethodRepositoryMock: IPaymentMethodRepository;

  beforeEach(() => {
    debtRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByCreditorId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updatePendingAmount: vi.fn(),
    } as any;

    transactionRepositoryMock = {
      create: vi.fn(),
      findByFilters: vi.fn(),
    } as any;

    debtUtilsMock = {
      validateUser: vi.fn(),
      validateDebt: vi.fn(),
      validatePaymentMethod: vi.fn(),
    } as any;

    paymentMethodRepositoryMock = {
      findById: vi.fn(),
    } as any;

    (DebtService as any).instance = null;
    debtService = DebtService.getInstance(
      debtRepositoryMock,
      transactionRepositoryMock,
      debtUtilsMock,
      paymentMethodRepositoryMock
    );
  });

  describe('getAll', () => {
    it('should return all debts', async () => {
      (debtRepositoryMock.findAll as any).mockResolvedValue([]);
      const c = {
        json: vi.fn(),
      };

      await debtService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Debts retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if debt not found', async () => {
      (debtRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await debtService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Debt not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return debt if found', async () => {
      (debtRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await debtService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Debt retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getByUserId', () => {
    it('should return 404 if user not found', async () => {
      (debtUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await debtService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return user debts if user found', async () => {
      (debtUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      (debtRepositoryMock.findByUserId as any).mockResolvedValue([]);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await debtService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'User debts retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 404 if user not found', async () => {
      (debtUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1 }) },
        json: vi.fn(),
      };

      await debtService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should create debt successfully', async () => {
      (debtUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      (debtRepositoryMock.create as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, original_amount: 100, due_date: '2023-01-01' }) },
        json: vi.fn(),
      };

      await debtService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Debt created successfully' }),
        HttpStatusCodes.CREATED
      );
    });
  });

  describe('update', () => {
    it('should return 404 if debt not found', async () => {
      (debtRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({}) },
        json: vi.fn(),
      };

      await debtService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Debt not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should update debt successfully', async () => {
      (debtRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (debtRepositoryMock.update as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({ pending_amount: 50 }) },
        json: vi.fn(),
      };

      await debtService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Debt updated successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('delete', () => {
    it('should return 404 if debt not found', async () => {
      (debtRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await debtService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Debt not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should delete debt successfully', async () => {
      (debtRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (debtRepositoryMock.delete as any).mockResolvedValue(true);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await debtService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Debt deleted successfully' }),
        HttpStatusCodes.OK
      );
    });
  });
});
