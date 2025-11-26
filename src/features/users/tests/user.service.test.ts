import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../application/services/user.service';
import { IUserRepository } from '@/users/domain/ports/user-repository.port';
import { UserUtilsService } from '../application/services/user-utils.service';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { hash } from '@/shared/utils/crypto.util';
import { PgPlanRepository } from '@/subscriptions/infrastructure/adapters/plan.repository';
import { PgSubscriptionRepository } from '@/subscriptions/infrastructure/adapters/subscription.repository';

// Mocks
vi.mock('@/shared/utils/crypto.util', () => ({
  hash: vi.fn(),
}));
vi.mock('@/subscriptions/infrastructure/adapters/plan.repository', () => ({
  PgPlanRepository: {
    getInstance: vi.fn(),
  },
}));
vi.mock('@/subscriptions/infrastructure/adapters/subscription.repository', () => ({
  PgSubscriptionRepository: {
    getInstance: vi.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let userRepositoryMock: IUserRepository;
  let userUtilsMock: UserUtilsService;
  let planRepositoryMock: any;
  let subscriptionRepositoryMock: any;

  beforeEach(() => {
    userRepositoryMock = {
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      setRecoveryToken: vi.fn(),
      findByRecoveryToken: vi.fn(),
    } as any;

    userUtilsMock = {
      validateUniqueFields: vi.fn(),
      validateEmailUnique: vi.fn(),
      validateUsernameUnique: vi.fn(),
    } as any;

    planRepositoryMock = {
      findByName: vi.fn(),
    };
    (PgPlanRepository.getInstance as any) = vi.fn().mockReturnValue(planRepositoryMock);

    subscriptionRepositoryMock = {
      create: vi.fn(),
    };
    (PgSubscriptionRepository.getInstance as any) = vi.fn().mockReturnValue(subscriptionRepositoryMock);

    (UserService as any).instance = null;
    userService = UserService.getInstance(userRepositoryMock, userUtilsMock);
  });

  describe('searchByEmail', () => {
    it('should return 404 if user not found', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue(null);
      const c = {
        req: { valid: vi.fn().mockReturnValue({ email: 'test@example.com' }) },
        json: vi.fn(),
      };

      await userService.searchByEmail(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return 200 if user found', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        username: 'test',
      });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ email: 'test@example.com' }) },
        json: vi.fn(),
      };

      await userService.searchByEmail(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ email: 'test@example.com' }),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 409 if fields not unique', async () => {
      (userUtilsMock.validateUniqueFields as any).mockResolvedValue({ isValid: false, field: 'email' });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ email: 'test@example.com', username: 'test' }) },
        json: vi.fn(),
      };

      await userService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'The email is already taken' }),
        HttpStatusCodes.CONFLICT
      );
    });

    it('should return 201 if user created', async () => {
      (userUtilsMock.validateUniqueFields as any).mockResolvedValue({ isValid: true });
      (hash as any).mockResolvedValue('hashed');
      (userRepositoryMock.create as any).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        username: 'test',
        active: true,
      });
      (planRepositoryMock.findByName as any).mockResolvedValue({ id: 'plan1', durationDays: 30, frequency: 'monthly' });

      const c = {
        req: { valid: vi.fn().mockReturnValue({
          email: 'test@example.com',
          username: 'test',
          password: 'password',
          name: 'Test',
        }) },
        json: vi.fn(),
      };

      await userService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ email: 'test@example.com' }),
        }),
        HttpStatusCodes.CREATED
      );
      expect(subscriptionRepositoryMock.create).toHaveBeenCalled();
    });
  });
});
