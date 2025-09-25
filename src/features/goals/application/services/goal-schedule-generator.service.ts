import { IGoal } from "@/goals/domain/entities/IGoal";
import { IGoalContributionSchedule } from "@/goals/domain/entities/IGoalContributionSchedule";
import { IGoalContributionScheduleRepository } from "@/goals/domain/ports/goal-contribution-schedule-repository.port";

export class GoalScheduleGeneratorService {
  private static instance: GoalScheduleGeneratorService;

  constructor(
    private readonly scheduleRepository: IGoalContributionScheduleRepository
  ) {}

  public static getInstance(
    scheduleRepository: IGoalContributionScheduleRepository
  ): GoalScheduleGeneratorService {
    if (!GoalScheduleGeneratorService.instance) {
      GoalScheduleGeneratorService.instance = new GoalScheduleGeneratorService(
        scheduleRepository
      );
    }
    return GoalScheduleGeneratorService.instance;
  }

  /**
   * Generate contribution schedules for a goal
   * @param goal The goal to generate schedules for
   * @returns The generated schedules
   */
  async generateSchedules(goal: IGoal): Promise<IGoalContributionSchedule[]> {
    const remaining = goal.targetAmount - goal.currentAmount;
    
    if (remaining <= 0) {
      return [];
    }

    const today = new Date();
    const endDate = new Date(goal.endDate);
    
    if (today >= endDate) {
      return [];
    }

    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const contributionFrequency = goal.contributionFrequency ? goal.contributionFrequency : 1;
    
    const possibleContributions = Math.floor(daysRemaining / contributionFrequency );
    
    if (possibleContributions <= 0) {
      return [];
    }

    let contributionAmount: number;
    
    if (goal.contributionAmount != null  && goal.contributionAmount > 0) {
      contributionAmount = goal.contributionAmount;
    } else {
      contributionAmount = Math.ceil(remaining / possibleContributions);
    }

    const scheduledDates: Date[] = [];
    let currentDate = new Date(today);
    
    for (let i = 0; i < possibleContributions; i++) {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + contributionFrequency);
      
      if (currentDate <= endDate) {
        scheduledDates.push(new Date(currentDate));
      }
    }

    const schedules: IGoalContributionSchedule[] = [];
    
    for (const date of scheduledDates) {
      const schedule = await this.scheduleRepository.create({
        goalId: goal.id,
        userId: goal.userId,
        scheduledDate: date,
        amount: contributionAmount,
        status: "pending",
        contributionId: null,
      });
      
      schedules.push(schedule);
    }

    return schedules;
  }

  /**
   * Recalculate schedules after a contribution or when goal details change
   * @param goal The updated goal
   * @returns Success indicator
   */
  async recalculateSchedules(goal: IGoal): Promise<boolean> {
    const existingSchedules = await this.scheduleRepository.findByGoalId(goal.id);
    const pendingSchedules = existingSchedules.filter(s => s.status === "pending");
    
    if (pendingSchedules.length === 0) {
      await this.generateSchedules(goal);
      return true;
    }

    const remaining = goal.targetAmount - goal.currentAmount;
    
    if (remaining <= 0) {
      return true;
    }

    const newAmount = Math.ceil(remaining / pendingSchedules.length);

    for (const schedule of pendingSchedules) {
      await this.scheduleRepository.update(schedule.id, {
        amount: newAmount
      });
    }

    return true;
  }

  /**
   * Check for upcoming scheduled contributions to notify users
   * @param daysAhead Number of days ahead to check
   * @returns Schedules due in the specified days
   */
  async getUpcomingSchedules(daysAhead: number = 1): Promise<IGoalContributionSchedule[]> {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);
    
    const allPending = await this.scheduleRepository.findByStatus("pending");
    
    return allPending.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      return scheduleDate <= targetDate;
    });
  }
}