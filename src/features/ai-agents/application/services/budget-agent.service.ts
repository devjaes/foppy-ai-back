import { AgentResponse } from "../../domain/entities/voice-command.entity";

export class BudgetAgentService {
  async processBudget(extractedData: Record<string, any>, userId: number): Promise<AgentResponse> {
    try {
      const processedData = this.normalizeBudgetData(extractedData, userId);
      
      return {
        success: true,
        intent: 'CREATE_BUDGET',
        extractedData: processedData,
        confidence: 0.9,
        message: `He identificado un presupuesto de $${processedData.limit_amount} para ${processedData.month}`
      };
    } catch (error) {
      return {
        success: false,
        intent: 'CREATE_BUDGET',
        extractedData: {},
        confidence: 0,
        message: "No pude procesar los datos del presupuesto"
      };
    }
  }

  private normalizeBudgetData(data: Record<string, any>, userId: number) {
    return {
      user_id: userId,
      category_id: data.category_id || null,
      limit_amount: this.parseAmount(data.limit_amount || data.amount),
      current_amount: 0,
      month: this.parseMonth(data.month || data.period)
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

  private parseMonth(monthInput: any): string {
    if (!monthInput) {
      const currentDate = new Date();
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    }
    
    if (monthInput instanceof Date) {
      return new Date(monthInput.getFullYear(), monthInput.getMonth(), 1).toISOString();
    }
    
    if (typeof monthInput === 'string') {
      const date = new Date(monthInput);
      if (!isNaN(date.getTime())) {
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      }
    }
    
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
  }
} 