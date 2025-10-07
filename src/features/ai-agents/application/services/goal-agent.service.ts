import { AgentResponse } from "../../domain/entities/voice-command.entity";

export class GoalAgentService {
  async processGoal(extractedData: Record<string, any>, userId: number): Promise<AgentResponse> {
    try {
      const processedData = this.normalizeGoalData(extractedData, userId);
      
      return {
        success: true,
        intent: 'CREATE_GOAL',
        extractedData: processedData,
        confidence: 0.9,
        message: `He identificado una meta de ahorro: "${processedData.name}" con objetivo de $${processedData.target_amount}`
      };
    } catch (error) {
      return {
        success: false,
        intent: 'CREATE_GOAL',
        extractedData: {},
        confidence: 0,
        message: "No pude procesar los datos de la meta de ahorro"
      };
    }
  }

  private normalizeGoalData(data: Record<string, any>, userId: number) {
    return {
      user_id: userId,
      name: data.name || data.goal_name || 'Meta sin nombre',
      target_amount: this.parseAmount(data.target_amount || data.amount),
      current_amount: 0,
      end_date: this.parseDate(data.end_date || data.deadline),
      category_id: data.category_id || null,
      contribution_frequency: data.contribution_frequency || null,
      contribution_amount: data.contribution_amount ? this.parseAmount(data.contribution_amount) : null
    };
  }

  private parseAmount(amount: any): number {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const cleanAmount = amount.replace(/[^\d.,]/g, '');
      return parseFloat(cleanAmount.replace(',', '.'));
    }
    return 0;
  }

  private parseDate(dateInput: any): string {
    if (!dateInput) {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      return futureDate.toISOString();
    }
    
    if (dateInput instanceof Date) {
      return dateInput.toISOString();
    }
    
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    return futureDate.toISOString();
  }
} 