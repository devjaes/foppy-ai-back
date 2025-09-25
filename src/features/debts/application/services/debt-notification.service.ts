import { NotificationUtilsService } from '@/notifications/application/services/notification-utils.service';
import { PgNotificationRepository } from '@/notifications/infrastructure/adapters/notification.repository';
import { IDebt } from '../../domain/entities/IDebt';
import { PgUserRepository } from '@/users/infrastructure/adapters/user.repository';

/**
 * Service for handling debt-related notifications
 */
export class DebtNotificationService {
  private static instance: DebtNotificationService;
  private notificationUtils: NotificationUtilsService;
  private userRepository: PgUserRepository;
  
  // Cache to prevent duplicate notifications
  private notificationCache: Map<string, Date> = new Map();

  private constructor() {
    const notificationRepository = PgNotificationRepository.getInstance();
    this.notificationUtils = NotificationUtilsService.getInstance(notificationRepository);
    this.userRepository = PgUserRepository.getInstance();
  }

  public static getInstance(): DebtNotificationService {
    if (!DebtNotificationService.instance) {
      DebtNotificationService.instance = new DebtNotificationService();
    }
    return DebtNotificationService.instance;
  }

  /**
   * Send a notification when a new debt is created
   * @param debt The debt that was created
   */
  async notifyDebtCreated(debt: IDebt): Promise<void> {
    // Format the due date
    const dueDate = this.formatDate(debt.dueDate);
    
    // Notify the debt owner
    await this.notificationUtils.createDebtNotification(
      debt.userId,
      debt.description,
      debt.dueDate,
      `Se ha registrado una nueva deuda "${debt.description}" por ${debt.originalAmount}. ` +
      `La fecha de vencimiento es el ${dueDate}.`
    );
    
    // If the debt has a creditor, notify them as well
    if (debt.creditorId) {
      const user = await this.userRepository.findById(debt.userId);
      const userName = user ? user.name : 'Un usuario';
      
      await this.notificationUtils.createDebtNotification(
        debt.creditorId,
        `Deuda a tu favor: ${debt.description}`,
        debt.dueDate,
        `${userName} ha registrado una deuda a tu favor por ${debt.originalAmount} ` +
        `relacionada con "${debt.description}". La fecha de vencimiento es el ${dueDate}.`
      );
    }
  }
  
  /**
   * Send notifications when a debt's payment status changes
   * @param debt The updated debt
   * @param previousPaid The previous payment status
   */
  async notifyDebtPaymentStatusChanged(debt: IDebt, previousPaid: boolean): Promise<void> {
    // Only send notification if the paid status changed
    if (debt.paid === previousPaid) return;
    
    if (debt.paid) {
      // Debt was marked as paid
      await this.notificationUtils.createCongratulationNotification(
        debt.userId,
        `Deuda pagada: ${debt.description}`,
        `¡Felicitaciones! Has pagado completamente tu deuda "${debt.description}" por ${debt.originalAmount}.`
      );
      
      // If there's a creditor, notify them as well
      if (debt.creditorId) {
        const user = await this.userRepository.findById(debt.userId);
        const userName = user ? user.name : 'Un usuario';
        
        await this.notificationUtils.createNotification(
          debt.creditorId,
          `Deuda pagada: ${debt.description}`,
          `${userName} ha pagado su deuda`,
          `${userName} ha pagado completamente la deuda de ${debt.originalAmount} ` +
          `relacionada con "${debt.description}".`,
          'DEBT',
          null,
          true
        );
      }
    } else {
      // Debt was marked as unpaid again
      await this.notificationUtils.createWarningNotification(
        debt.userId,
        `Deuda marcada como pendiente: ${debt.description}`,
        `Monto pendiente: ${debt.pendingAmount}`,
        `La deuda "${debt.description}" ha sido marcada como pendiente nuevamente. ` +
        `El monto pendiente es de ${debt.pendingAmount}.`
      );
    }
  }
  
  /**
   * Send notifications when a debt's amount is updated
   * @param debt The updated debt
   * @param previousAmount The previous pending amount
   */
  async notifyDebtAmountUpdated(debt: IDebt, previousAmount: number): Promise<void> {
    // Only send notification if the amount changed
    if (debt.pendingAmount === previousAmount) return;
    
    const difference = previousAmount - debt.pendingAmount;
    
    if (difference > 0) {
      // Amount was reduced (partial payment)
      await this.notificationUtils.createNotification(
        debt.userId,
        `Pago parcial registrado: ${debt.description}`,
        `Pagaste: ${difference}`,
        `Has realizado un pago parcial de ${difference} para tu deuda "${debt.description}". ` +
        `El monto pendiente ahora es de ${debt.pendingAmount}.`,
        'DEBT',
        null,
        true
      );
      
      // If there's a creditor, notify them as well
      if (debt.creditorId) {
        const user = await this.userRepository.findById(debt.userId);
        const userName = user ? user.name : 'Un usuario';
        
        await this.notificationUtils.createNotification(
          debt.creditorId,
          `Pago parcial recibido: ${debt.description}`,
          `${userName} pagó: ${difference}`,
          `${userName} ha realizado un pago parcial de ${difference} para la deuda "${debt.description}". ` +
          `El monto pendiente ahora es de ${debt.pendingAmount}.`,
          'DEBT',
          null,
          true
        );
      }
    } else if (difference < 0) {
      // Amount was increased
      await this.notificationUtils.createWarningNotification(
        debt.userId,
        `Aumento en deuda: ${debt.description}`,
        `Incremento: ${Math.abs(difference)}`,
        `El monto pendiente de tu deuda "${debt.description}" ha aumentado en ${Math.abs(difference)}. ` +
        `El monto pendiente ahora es de ${debt.pendingAmount}.`
      );
    }
  }
  
  /**
   * Check if a debt is approaching its due date and send notifications
   * @param debt The debt to check
   */
  async checkDueDateApproaching(debt: IDebt): Promise<void> {
    // Skip if debt is already paid
    if (debt.paid) return;
    
    const now = new Date();
    const daysUntilDue = Math.ceil(
      (debt.dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
    );
    
    // Send notifications at specific intervals (7, 3, and 1 day before due date)
    if ([7, 3, 1].includes(daysUntilDue)) {
      const cacheKey = `${debt.id}_due_${daysUntilDue}`;
      
      // Check if we've already sent this notification today
      if (this.hasRecentNotification(cacheKey)) return;
      
      await this.notificationUtils.createDebtNotification(
        debt.userId,
        debt.description,
        debt.dueDate,
        `Tu deuda "${debt.description}" por ${debt.pendingAmount} vence en ${daysUntilDue} ` +
        `día${daysUntilDue > 1 ? 's' : ''}. Recuerda realizar el pago a tiempo.`
      );
      
      this.storeNotificationSent(cacheKey);
    }
    
    // Send notification when the debt is overdue
    if (daysUntilDue < 0 && !this.hasRecentNotification(`${debt.id}_overdue`)) {
      // Only send overdue notification once per week
      const daysOverdue = Math.abs(daysUntilDue);
      if (daysOverdue === 1 || daysOverdue % 7 === 0) {
        await this.notificationUtils.createWarningNotification(
          debt.userId,
          `Deuda vencida: ${debt.description}`,
          `Vencida hace ${daysOverdue} días`,
          `Tu deuda "${debt.description}" por ${debt.pendingAmount} está vencida hace ${daysOverdue} ` +
          `días. Por favor, realiza el pago lo antes posible.`
        );
        
        this.storeNotificationSent(`${debt.id}_overdue`);
      }
    }
  }
  
  /**
   * Format a date for display in notifications
   * @param date The date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }
  
  /**
   * Check if a notification has been sent recently
   * @param key Cache key for the notification
   * @returns Whether the notification was sent recently
   */
  private hasRecentNotification(key: string): boolean {
    const lastSent = this.notificationCache.get(key);
    if (!lastSent) return false;
    
    const hoursSinceLastNotification = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastNotification < 24; // Don't send more than once per day
  }
  
  /**
   * Store that a notification has been sent
   * @param key Cache key for the notification
   */
  private storeNotificationSent(key: string): void {
    this.notificationCache.set(key, new Date());
  }
}
