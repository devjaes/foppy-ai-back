import { AgentResponse } from "../../domain/entities/voice-command.entity";

export class ValidationAgentService {
  async validateResponse(response: AgentResponse, userId: number): Promise<AgentResponse> {
    if (!response.success) {
      return response;
    }

    const validationErrors: string[] = [];
    const suggestedCorrections: Record<string, any> = {};

    switch (response.intent) {
      case 'CREATE_TRANSACTION':
        this.validateTransaction(response.extractedData, validationErrors, suggestedCorrections);
        break;
      case 'CREATE_GOAL':
        this.validateGoal(response.extractedData, validationErrors, suggestedCorrections);
        break;
      case 'CREATE_BUDGET':
        this.validateBudget(response.extractedData, validationErrors, suggestedCorrections);
        break;
    }

    return {
      ...response,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      suggestedCorrections: Object.keys(suggestedCorrections).length > 0 ? suggestedCorrections : undefined,
      success: validationErrors.length === 0,
      message: validationErrors.length > 0 
        ? `Se encontraron algunos problemas: ${validationErrors.join(', ')}`
        : response.message
    };
  }

  private validateTransaction(data: Record<string, any>, errors: string[], corrections: Record<string, any>) {
    if (!data.amount || data.amount <= 0) {
      errors.push("El monto debe ser mayor a 0");
      corrections.amount = 0;
    }

    if (!data.type || !['INCOME', 'EXPENSE'].includes(data.type)) {
      errors.push("Tipo de transacción inválido");
      corrections.type = 'EXPENSE';
    }

    if (!data.description || data.description.trim() === '') {
      errors.push("La descripción no puede estar vacía");
      corrections.description = 'Transacción sin descripción';
    }
  }

  private validateGoal(data: Record<string, any>, errors: string[], corrections: Record<string, any>) {
    if (!data.name || data.name.trim() === '') {
      errors.push("El nombre de la meta no puede estar vacío");
      corrections.name = 'Meta sin nombre';
    }

    if (!data.target_amount || data.target_amount <= 0) {
      errors.push("El monto objetivo debe ser mayor a 0");
      corrections.target_amount = 1000;
    }

    if (data.current_amount < 0) {
      errors.push("El monto actual no puede ser negativo");
      corrections.current_amount = 0;
    }

    if (!data.end_date) {
      errors.push("La fecha objetivo es requerida");
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      corrections.end_date = futureDate.toISOString();
    }
  }

  private validateBudget(data: Record<string, any>, errors: string[], corrections: Record<string, any>) {
    if (!data.limit_amount || data.limit_amount <= 0) {
      errors.push("El límite del presupuesto debe ser mayor a 0");
      corrections.limit_amount = 1000;
    }

    if (!data.category_id) {
      errors.push("Se requiere una categoría para el presupuesto");
    }

    if (!data.month) {
      errors.push("Se requiere especificar el mes del presupuesto");
      const currentDate = new Date();
      corrections.month = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    }
  }
} 