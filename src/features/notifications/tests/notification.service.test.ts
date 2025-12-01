import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../application/services/notification.service';
import { INotificationRepository } from '../domain/ports/notification-repository.port';
import { PgUserRepository } from '@/users/infrastructure/adapters/user.repository';
import { NotificationEmailService } from '../application/services/notification-email.service';
import { NotificationUtilsService } from '../application/services/notification-utils.service';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { NotificationApiAdapter } from '../infrastructure/adapters/notification-api.adapter';

// Mocks
vi.mock('../infrastructure/adapters/notification-api.adapter', () => ({
  NotificationApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

vi.mock('@/users/infrastructure/adapters/user.repository', () => ({
  PgUserRepository: {
    getInstance: vi.fn(),
  },
}));

vi.mock('../application/services/notification-email.service', () => ({
  NotificationEmailService: {
    getInstance: vi.fn().mockReturnValue({
      sendNotificationEmail: vi.fn(),
    }),
  },
}));

vi.mock('../application/services/notification-utils.service', () => ({
  NotificationUtilsService: {
    getInstance: vi.fn().mockReturnValue({}),
  },
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let notificationRepositoryMock: INotificationRepository;
  let userRepositoryMock: any;
  let notificationEmailServiceMock: any;

  beforeEach(() => {
    notificationRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findUnreadByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteExpired: vi.fn(),
    } as any;

    userRepositoryMock = {
      findById: vi.fn(),
    };
    (PgUserRepository.getInstance as any).mockReturnValue(userRepositoryMock);

    notificationEmailServiceMock = {
      sendNotificationEmail: vi.fn(),
    };
    (NotificationEmailService.getInstance as any).mockReturnValue(notificationEmailServiceMock);

    (NotificationService as any).instance = null;
    notificationService = NotificationService.getInstance(notificationRepositoryMock);
  });

  describe('getAll', () => {
    it('should return all notifications', async () => {
      (notificationRepositoryMock.findAll as any).mockResolvedValue([]);
      const c = {
        json: vi.fn(),
      };

      await notificationService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Notifications retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if notification not found', async () => {
      (notificationRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await notificationService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Notification not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return notification if found', async () => {
      (notificationRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await notificationService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Notification retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getByUserId', () => {
    it('should return 404 if user not found', async () => {
      (userRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await notificationService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return user notifications if user found', async () => {
      (userRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (notificationRepositoryMock.findByUserId as any).mockResolvedValue([]);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await notificationService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'User notifications retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 404 if user not found', async () => {
      (userRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1 }) },
        json: vi.fn(),
      };

      await notificationService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should create notification successfully', async () => {
      (userRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (notificationRepositoryMock.create as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, title: 'Test', message: 'Test' }) },
        json: vi.fn(),
      };

      await notificationService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Notification created successfully' }),
        HttpStatusCodes.CREATED
      );
    });
  });

  describe('update', () => {
    it('should return 404 if notification not found', async () => {
      (notificationRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({}) },
        json: vi.fn(),
      };

      await notificationService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Notification not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should update notification successfully', async () => {
      (notificationRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (notificationRepositoryMock.update as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({ title: 'New Title' }) },
        json: vi.fn(),
      };

      await notificationService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Notification updated successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('delete', () => {
    it('should return 404 if notification not found', async () => {
      (notificationRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await notificationService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Notification not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should delete notification successfully', async () => {
      (notificationRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (notificationRepositoryMock.delete as any).mockResolvedValue(true);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await notificationService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Notification deleted successfully' }),
        HttpStatusCodes.OK
      );
    });
  });
});
