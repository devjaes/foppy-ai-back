import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentMethodService } from '../application/services/payment-method.service';
import { IPaymentMethodRepository } from '@/payment-methods/domain/ports/payment-method-repository.port';
import { PaymentMethodUtilsService } from '../application/services/payment-method-utils.service';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { PaymentMethodApiAdapter } from '@/payment-methods/infrastructure/adapters/payment-method-api.adapter';

vi.mock('@/payment-methods/infrastructure/adapters/payment-method-api.adapter', () => ({
  PaymentMethodApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

describe('PaymentMethodService', () => {
  let paymentMethodService: PaymentMethodService;
  let paymentMethodRepositoryMock: IPaymentMethodRepository;
  let paymentMethodUtilsMock: PaymentMethodUtilsService;

  beforeEach(() => {
    paymentMethodRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findSharedWithUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;

    paymentMethodUtilsMock = {
      validateUser: vi.fn(),
      validateSharing: vi.fn(),
    } as any;

    (PaymentMethodService as any).instance = null;
    paymentMethodService = PaymentMethodService.getInstance(
      paymentMethodRepositoryMock,
      paymentMethodUtilsMock
    );
  });

  describe('getAll', () => {
    it('should return all payment methods', async () => {
      const paymentMethods = [{ id: 1, name: 'Card' }];
      (paymentMethodRepositoryMock.findAll as any).mockResolvedValue(paymentMethods);
      const c = {
        json: vi.fn(),
      };

      await paymentMethodService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ name: 'Card' })]),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if payment method not found', async () => {
      (paymentMethodRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await paymentMethodService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Payment method not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return payment method if found', async () => {
      const paymentMethod = { id: 1, name: 'Card' };
      (paymentMethodRepositoryMock.findById as any).mockResolvedValue(paymentMethod);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await paymentMethodService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'Card' }),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 400 if shared user not found', async () => {
      (paymentMethodUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, shared_user_id: 2 }) },
        json: vi.fn(),
      };

      await paymentMethodService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Shared user not found' }),
        HttpStatusCodes.BAD_REQUEST
      );
    });

    it('should create payment method successfully', async () => {
      const paymentMethodData = {
        user_id: 1,
        name: 'New Card',
        type: 'CARD',
        last_four_digits: '1234',
      };
      const createdPaymentMethod = { id: 1, ...paymentMethodData };
      (paymentMethodRepositoryMock.create as any).mockResolvedValue(createdPaymentMethod);
      const c = {
        req: { valid: vi.fn().mockReturnValue(paymentMethodData) },
        json: vi.fn(),
      };

      await paymentMethodService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'New Card' }),
        }),
        HttpStatusCodes.CREATED
      );
    });
  });

  describe('update', () => {
    it('should return 404 if payment method not found', async () => {
      (paymentMethodRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({}) },
        json: vi.fn(),
      };

      await paymentMethodService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Payment method not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should update payment method successfully', async () => {
      const existingPaymentMethod = { id: 1, name: 'Old Name', userId: 1 };
      (paymentMethodRepositoryMock.findById as any).mockResolvedValue(existingPaymentMethod);
      const updateData = { name: 'New Name' };
      const updatedPaymentMethod = { ...existingPaymentMethod, ...updateData };
      (paymentMethodRepositoryMock.update as any).mockResolvedValue(updatedPaymentMethod);
      
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue(updateData) },
        json: vi.fn(),
      };

      await paymentMethodService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'New Name' }),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('delete', () => {
    it('should return 404 if payment method not found', async () => {
      (paymentMethodRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await paymentMethodService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Payment method not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should delete payment method successfully', async () => {
      (paymentMethodRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (paymentMethodRepositoryMock.delete as any).mockResolvedValue(true);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await paymentMethodService.delete(c as any);

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
