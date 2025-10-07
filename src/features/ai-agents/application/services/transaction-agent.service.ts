import { AgentResponse } from "../../domain/entities/voice-command.entity";

export class TransactionAgentService {
  async processTransaction(extractedData: Record<string, any>, userId: number): Promise<AgentResponse> {
    try {
      const processedData = this.normalizeTransactionData(extractedData, userId);
      
      return {
        success: true,
        intent: 'CREATE_TRANSACTION',
        extractedData: processedData,
        confidence: 0.9,
        message: `He identificado una transacción: ${processedData.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'} de $${processedData.amount} en ${processedData.description || 'Sin descripción'}`
      };
    } catch (error) {
      return {
        success: false,
        intent: 'CREATE_TRANSACTION',
        extractedData: {},
        confidence: 0,
        message: "No pude procesar los datos de la transacción"
      };
    }
  }

  private normalizeTransactionData(data: Record<string, any>, userId: number) {
    return {
      user_id: userId,
      amount: this.parseAmount(data.amount),
      type: this.determineTransactionType(data),
      description: data.description || data.concept || '',
      category_id: data.category_id || null,
      payment_method_id: data.payment_method_id || null,
      date: data.date || new Date().toISOString()
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

  private determineTransactionType(data: Record<string, any>): 'INCOME' | 'EXPENSE' {
    const type = data.type?.toUpperCase();
    if (type === 'INCOME' || type === 'INGRESO') return 'INCOME';
    if (type === 'EXPENSE' || type === 'GASTO') return 'EXPENSE';
    
    const keywords = data.description?.toLowerCase() || '';
    if (keywords.includes('gané') || keywords.includes('recibí') || keywords.includes('ingreso')) {
      return 'INCOME';
    }
    
    return 'EXPENSE';
  }
} 