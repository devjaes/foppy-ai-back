import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FriendService } from '../application/services/friend.service';
import { IFriendRepository } from '../domain/ports/friend-repository.port';
import { FriendUtilsService } from '../application/services/friend-utils.service';
import { IUserRepository } from '@/users/domain/ports/user-repository.port';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { FriendApiAdapter } from '../infrastructure/adapters/friend-api.adapter';

// Mocks
vi.mock('../infrastructure/adapters/friend-api.adapter', () => ({
  FriendApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

describe('FriendService', () => {
  let friendService: FriendService;
  let friendRepositoryMock: IFriendRepository;
  let friendUtilsMock: FriendUtilsService;
  let userRepositoryMock: IUserRepository;

  beforeEach(() => {
    friendRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    } as any;

    friendUtilsMock = {
      validateUser: vi.fn(),
      validateFriendship: vi.fn(),
    } as any;

    userRepositoryMock = {
      findByEmail: vi.fn(),
    } as any;

    (FriendService as any).instance = null;
    friendService = FriendService.getInstance(friendRepositoryMock, friendUtilsMock, userRepositoryMock);
  });

  describe('getAll', () => {
    it('should return all friends', async () => {
      (friendRepositoryMock.findAll as any).mockResolvedValue([]);
      const c = {
        json: vi.fn(),
      };

      await friendService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Friends retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if friend not found', async () => {
      (friendRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await friendService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Friend not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return friend if found', async () => {
      (friendRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await friendService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Friend retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getByUserId', () => {
    it('should return 404 if user not found', async () => {
      (friendUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await friendService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return user friends if user found', async () => {
      (friendUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      (friendRepositoryMock.findByUserId as any).mockResolvedValue([]);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await friendService.getByUserId(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'User friends retrieved successfully' }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 404 if friend email not found', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue(null);
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, friend_email: 'test@example.com' }) },
        json: vi.fn(),
      };

      await friendService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return 400 if friendship is invalid', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue({ id: 2 });
      (friendUtilsMock.validateFriendship as any).mockResolvedValue({ isValid: false, message: 'Invalid' });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, friend_email: 'test@example.com' }) },
        json: vi.fn(),
      };

      await friendService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid' }),
        HttpStatusCodes.BAD_REQUEST
      );
    });

    it('should create friendship if valid', async () => {
      (userRepositoryMock.findByEmail as any).mockResolvedValue({ id: 2 });
      (friendUtilsMock.validateFriendship as any).mockResolvedValue({ isValid: true });
      (friendRepositoryMock.create as any).mockResolvedValue({ id: 1 });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1, friend_email: 'test@example.com' }) },
        json: vi.fn(),
      };

      await friendService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Friend added successfully' }),
        HttpStatusCodes.CREATED
      );
    });
  });

  describe('delete', () => {
    it('should return 404 if friend not found', async () => {
      (friendRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await friendService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Friend not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should delete friend if found', async () => {
      (friendRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (friendRepositoryMock.delete as any).mockResolvedValue(true);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await friendService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Friend removed successfully' }),
        HttpStatusCodes.OK
      );
    });
  });
});
