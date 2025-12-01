import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoalService } from '../application/services/goal.service';
import { IGoalRepository } from '@/goals/domain/ports/goal-repository.port';
import { GoalUtilsService } from '../application/services/goal-utils.service';
import { IGoalContributionRepository } from '@/goals/domain/ports/goal-contribution-repository.port';
import { ITransactionRepository } from '@/transactions/domain/ports/transaction-repository.port';
import { GoalNotificationService } from '../application/services/goal-notification.service';
import { GoalScheduleGeneratorService } from '../application/services/goal-schedule-generator.service';
import { PgGoalContributionScheduleRepository } from '@/goals/infrastucture/adapters/goal-contribution-schedule.repository';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { GoalApiAdapter } from '@/goals/infrastucture/adapters/goal-api.adapter';

vi.mock('@/goals/infrastucture/adapters/goal-api.adapter', () => ({
  GoalApiAdapter: {
    toApiResponseList: vi.fn((data) => data),
    toApiResponse: vi.fn((data) => data),
  },
}));

// Mocks
vi.mock('../application/services/goal-notification.service', () => ({
  GoalNotificationService: {
    getInstance: vi.fn(),
  },
}));

vi.mock('../application/services/goal-schedule-generator.service', () => ({
  GoalScheduleGeneratorService: {
    getInstance: vi.fn(),
  },
}));

vi.mock('@/goals/infrastucture/adapters/goal-contribution-schedule.repository', () => ({
  PgGoalContributionScheduleRepository: {
    getInstance: vi.fn(),
  },
}));

describe('GoalService', () => {
  let goalService: GoalService;
  let goalRepositoryMock: IGoalRepository;
  let goalUtilsMock: GoalUtilsService;
  let goalContributionRepositoryMock: IGoalContributionRepository;
  let transactionRepositoryMock: ITransactionRepository;
  let goalNotificationServiceMock: any;
  let goalScheduleGeneratorServiceMock: any;

  beforeEach(() => {
    goalRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findSharedWithUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateProgress: vi.fn(),
      findByFilters: vi.fn(),
    } as any;

    goalUtilsMock = {
      validateUser: vi.fn(),
      validateSharing: vi.fn(),
      validateProgress: vi.fn(),
    } as any;

    goalContributionRepositoryMock = {
      findByGoalId: vi.fn(),
    } as any;

    transactionRepositoryMock = {
      findByContributionId: vi.fn(),
    } as any;

    goalNotificationServiceMock = {
      notifyGoalShared: vi.fn(),
      checkDeadlineApproaching: vi.fn(),
      checkProgressMilestones: vi.fn(),
    };
    (GoalNotificationService.getInstance as any) = vi.fn().mockReturnValue(goalNotificationServiceMock);

    goalScheduleGeneratorServiceMock = {
      generateSchedules: vi.fn(),
      recalculateSchedules: vi.fn(),
    };
    (GoalScheduleGeneratorService.getInstance as any) = vi.fn().mockReturnValue(goalScheduleGeneratorServiceMock);

    (PgGoalContributionScheduleRepository.getInstance as any) = vi.fn().mockReturnValue({});

    (GoalService as any).instance = null;
    goalService = GoalService.getInstance(
      goalRepositoryMock,
      goalUtilsMock,
      goalContributionRepositoryMock,
      transactionRepositoryMock
    );
  });

  describe('getAll', () => {
    it('should return all goals', async () => {
      const goals = [{ id: 1, name: 'Goal 1' }];
      (goalRepositoryMock.findAll as any).mockResolvedValue(goals);
      const c = {
        json: vi.fn(),
      };

      await goalService.getAll(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ name: 'Goal 1' })]),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('getById', () => {
    it('should return 404 if goal not found', async () => {
      (goalRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await goalService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Goal not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should return goal if found', async () => {
      const goal = { id: 1, name: 'Goal 1' };
      (goalRepositoryMock.findById as any).mockResolvedValue(goal);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await goalService.getById(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'Goal 1' }),
        }),
        HttpStatusCodes.OK
      );
    });
  });

  describe('create', () => {
    it('should return 404 if user not found', async () => {
      (goalUtilsMock.validateUser as any).mockResolvedValue({ isValid: false });
      const c = {
        req: { valid: vi.fn().mockReturnValue({ user_id: 1 }) },
        json: vi.fn(),
      };

      await goalService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'User not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should create goal successfully', async () => {
      (goalUtilsMock.validateUser as any).mockResolvedValue({ isValid: true });
      const goalData = {
        user_id: 1,
        name: 'New Goal',
        target_amount: 1000,
        end_date: '2023-12-31',
      };
      const createdGoal = { id: 1, ...goalData, endDate: new Date(goalData.end_date) };
      (goalRepositoryMock.create as any).mockResolvedValue(createdGoal);
      const c = {
        req: { valid: vi.fn().mockReturnValue(goalData) },
        json: vi.fn(),
      };

      await goalService.create(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'New Goal' }),
        }),
        HttpStatusCodes.CREATED
      );
      expect(goalScheduleGeneratorServiceMock.generateSchedules).toHaveBeenCalledWith(createdGoal);
    });
  });

  describe('update', () => {
    it('should return 404 if goal not found', async () => {
      (goalRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue({}) },
        json: vi.fn(),
      };

      await goalService.update(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Goal not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should update goal successfully', async () => {
      const existingGoal = { id: 1, name: 'Old Name', userId: 1 };
      (goalRepositoryMock.findById as any).mockResolvedValue(existingGoal);
      const updateData = { name: 'New Name' };
      const updatedGoal = { ...existingGoal, ...updateData };
      (goalRepositoryMock.update as any).mockResolvedValue(updatedGoal);
      
      const c = {
        req: { param: vi.fn().mockReturnValue('1'), valid: vi.fn().mockReturnValue(updateData) },
        json: vi.fn(),
      };

      await goalService.update(c as any);

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
    it('should return 404 if goal not found', async () => {
      (goalRepositoryMock.findById as any).mockResolvedValue(null);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await goalService.delete(c as any);

      expect(c.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Goal not found' }),
        HttpStatusCodes.NOT_FOUND
      );
    });

    it('should delete goal successfully', async () => {
      (goalRepositoryMock.findById as any).mockResolvedValue({ id: 1 });
      (goalRepositoryMock.delete as any).mockResolvedValue(true);
      const c = {
        req: { param: vi.fn().mockReturnValue('1') },
        json: vi.fn(),
      };

      await goalService.delete(c as any);

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
