import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../application/services/auth.service';
import { IUserRepository } from '@/users/domain/ports/user-repository.port';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { hash, verify } from '@/shared/utils/crypto.util';
import { generateToken } from '@/shared/utils/jwt.util';
import { EmailService } from '@/email/application/services/email.service';
import { PgPlanRepository } from '@/subscriptions/infrastructure/adapters/plan.repository';
import { PgSubscriptionRepository } from '@/subscriptions/infrastructure/adapters/subscription.repository';

// Mocks
vi.mock('@/shared/utils/crypto.util', () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));
vi.mock('@/shared/utils/jwt.util', () => ({
  generateToken: vi.fn(),
}));
vi.mock('@/email/application/services/email.service', () => ({
  EmailService: {
    getInstance: vi.fn(),
  },
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

describe('AuthService', () => {
  let authService: AuthService;
  let userRepositoryMock: IUserRepository;
  let emailServiceMock: any;
  let planRepositoryMock: any;
  let subscriptionRepositoryMock: any;

  beforeEach(() => {
    userRepositoryMock = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      create: vi.fn(),
      setRecoveryToken: vi.fn(),
      findByRecoveryToken: vi.fn(),
      clearRecoveryToken: vi.fn(),
      update: vi.fn(),
    } as any;

    emailServiceMock = {
      sendSimpleEmail: vi.fn(),
    };
    (EmailService.getInstance as any) = vi.fn().mockReturnValue(emailServiceMock);

    planRepositoryMock = {
      findByName: vi.fn(),
    };
    (PgPlanRepository.getInstance as any) = vi.fn().mockReturnValue(planRepositoryMock);

    subscriptionRepositoryMock = {
      create: vi.fn(),
    };
    (PgSubscriptionRepository.getInstance as any) = vi.fn().mockReturnValue(subscriptionRepositoryMock);

    // Reset singleton instance
    (AuthService as any).instance = null;
    authService = AuthService.getInstance(userRepositoryMock);
  });

  describe('login', () => {
    it('should return 400 if user not found', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue(null);
      const c = {
        req: { valid: vi.fn().mockReturnValue({ email: 'test@example.com', password: 'password' }) },
        json: vi.fn(),
      };

      await authService.login(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid credentials' }),
        HttpStatusCodes.BAD_REQUEST
      );
    });

    it('should return 400 if password invalid', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        active: true,
      });
      (verify as any).mockResolvedValue(false);
      const c = {
        req: { valid: vi.fn().mockReturnValue({ email: 'test@example.com', password: 'password' }) },
        json: vi.fn(),
      };

      await authService.login(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid credentials' }),
        HttpStatusCodes.BAD_REQUEST
      );
    });

    it('should return 200 and token if login successful', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        active: true,
        name: 'Test',
        username: 'test',
      });
      (verify as any).mockResolvedValue(true);
      (generateToken as any).mockResolvedValue('token');
      const c = {
        req: { valid: vi.fn().mockReturnValue({ email: 'test@example.com', password: 'password' }) },
        json: vi.fn(),
      };

      await authService.login(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: 'token' }),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('register', () => {
    it('should return 409 if email exists', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue({});
      const c = {
        req: { valid: vi.fn().mockReturnValue({ email: 'test@example.com' }) },
        json: vi.fn(),
      };

      await authService.register(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Email already exists' }),
        HttpStatusCodes.CONFLICT
      );
    });

    it('should return 201 if registration successful', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue(null);
      (userRepositoryMock.findByUsername as any).mockResolvedValue(null);
      (hash as any).mockResolvedValue('hashed');
      (userRepositoryMock.create as any).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        username: 'test',
      });
      (generateToken as any).mockResolvedValue('token');
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

      await authService.register(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: 'token' }),
        }),
        HttpStatusCodes.CREATED
      );
      expect(subscriptionRepositoryMock.create).toHaveBeenCalled();
    });
  });
});
