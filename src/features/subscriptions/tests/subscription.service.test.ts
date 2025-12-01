import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../application/services/subscription.service';
import { IPlanRepository } from '@/subscriptions/domain/ports/plan-repository.port';
import { ISubscriptionRepository } from '@/subscriptions/domain/ports/subscription-repository.port';
import { IUserRepository } from '@/users/domain/ports/user-repository.port';
import * as HttpStatusCodes from 'stoker/http-status-codes';

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let planRepositoryMock: IPlanRepository;
  let subscriptionRepositoryMock: ISubscriptionRepository;
  let userRepositoryMock: IUserRepository;

  beforeEach(() => {
    planRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
    } as any;

    subscriptionRepositoryMock = {
      create: vi.fn(),
      findById: vi.fn(),
      cancel: vi.fn(),
      findByUserId: vi.fn(),
    } as any;

    userRepositoryMock = {
      findById: vi.fn(),
    } as any;

    (SubscriptionService as any).instance = null;
    subscriptionService = SubscriptionService.getInstance(
      planRepositoryMock,
      subscriptionRepositoryMock,
      userRepositoryMock
    );
  });

  describe('listPlans', () => {
    it('should return all plans except demo', async () => {
      const plans = [
        { id: 1, name: 'Basic', price: 10 },
        { id: 2, name: 'Plan Demo', price: 0 },
      ];
      (planRepositoryMock.findAll as any).mockResolvedValue(plans);
      const c = {
        json: vi.fn(),
      };

      await subscriptionService.listPlans(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ name: 'Basic' })]),
        }),
        HttpStatusCodes.OK
      );
      expect(c.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.objectContaining({ name: 'Plan Demo' })]),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('setPlan', () => {
    it('should return 404 if user not found', async () => {
      (userRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { valid: vi.fn().mockReturnValue({ userId: 1, planId: 1 }) },
        json: vi.fn(),
      };

      await subscriptionService.setPlan(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return 404 if plan not found', async () => {
      (userRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (planRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { valid: vi.fn().mockReturnValue({ userId: 1, planId: 1 }) },
        json: vi.fn(),
      };

      await subscriptionService.setPlan(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Plan not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return 201 if plan set', async () => {
      (userRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (planRepositoryMock.findById as any).mockResolvedValue({ id: 1, durationDays: 30 });
      (subscriptionRepositoryMock.create as any).mockResolvedValue({ id: 1, userId: 1, planId: 1 });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ userId: 1, planId: 1, frequency: 'monthly' }) },
        json: vi.fn(),
      };

      await subscriptionService.setPlan(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: 1 }),
        }),
        HttpStatusCodes.CREATED
      );
    });
  });
});
