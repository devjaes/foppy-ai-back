import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceOrchestratorService } from '../application/services/voice-orchestrator.service';
import { ITranscriptionService, ILLMService } from '../domain/ports/transcription.port';
import { TransactionAgentService } from '../application/services/transaction-agent.service';
import { GoalAgentService } from '../application/services/goal-agent.service';
import { BudgetAgentService } from '../application/services/budget-agent.service';
import { ValidationAgentService } from '../application/services/validation-agent.service';

describe('VoiceOrchestratorService', () => {
  let voiceOrchestratorService: VoiceOrchestratorService;
  let transcriptionServiceMock: ITranscriptionService;
  let llmServiceMock: ILLMService;
  let transactionAgentMock: TransactionAgentService;
  let goalAgentMock: GoalAgentService;
  let budgetAgentMock: BudgetAgentService;
  let validationAgentMock: ValidationAgentService;

  beforeEach(() => {
    transcriptionServiceMock = {
      transcribe: vi.fn(),
    } as any;

    llmServiceMock = {
      classifyIntent: vi.fn(),
      extractData: vi.fn(),
    } as any;

    transactionAgentMock = {
      processTransaction: vi.fn(),
    } as any;

    goalAgentMock = {
      processGoal: vi.fn(),
    } as any;

    budgetAgentMock = {
      processBudget: vi.fn(),
    } as any;

    validationAgentMock = {
      validateResponse: vi.fn(),
    } as any;

    voiceOrchestratorService = new VoiceOrchestratorService(
      transcriptionServiceMock,
      llmServiceMock,
      transactionAgentMock,
      goalAgentMock,
      budgetAgentMock,
      validationAgentMock
    );
  });

  describe('processVoiceCommand', () => {
    it('should return error if intent confidence is low', async () => {
      (transcriptionServiceMock.transcribe as any).mockResolvedValue('test');
      (llmServiceMock.classifyIntent as any).mockResolvedValue({ intent: 'CREATE_TRANSACTION', confidence: 0.5 });

      const result = await voiceOrchestratorService.processVoiceCommand({} as any, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No pude entender tu solicitud. ¿Podrías repetirla de otra manera?');
    });

    it('should process transaction command', async () => {
      (transcriptionServiceMock.transcribe as any).mockResolvedValue('test');
      (llmServiceMock.classifyIntent as any).mockResolvedValue({ intent: 'CREATE_TRANSACTION', confidence: 0.9 });
      (llmServiceMock.extractData as any).mockResolvedValue({ data: {}, confidence: 0.9 });
      (transactionAgentMock.processTransaction as any).mockResolvedValue({ success: true });
      (validationAgentMock.validateResponse as any).mockResolvedValue({ success: true });

      const result = await voiceOrchestratorService.processVoiceCommand({} as any, 1);

      expect(result.success).toBe(true);
      expect(transactionAgentMock.processTransaction).toHaveBeenCalled();
    });

    it('should process goal command', async () => {
      (transcriptionServiceMock.transcribe as any).mockResolvedValue('test');
      (llmServiceMock.classifyIntent as any).mockResolvedValue({ intent: 'CREATE_GOAL', confidence: 0.9 });
      (llmServiceMock.extractData as any).mockResolvedValue({ data: {}, confidence: 0.9 });
      (goalAgentMock.processGoal as any).mockResolvedValue({ success: true });
      (validationAgentMock.validateResponse as any).mockResolvedValue({ success: true });

      const result = await voiceOrchestratorService.processVoiceCommand({} as any, 1);

      expect(result.success).toBe(true);
      expect(goalAgentMock.processGoal).toHaveBeenCalled();
    });

    it('should process budget command', async () => {
      (transcriptionServiceMock.transcribe as any).mockResolvedValue('test');
      (llmServiceMock.classifyIntent as any).mockResolvedValue({ intent: 'CREATE_BUDGET', confidence: 0.9 });
      (llmServiceMock.extractData as any).mockResolvedValue({ data: {}, confidence: 0.9 });
      (budgetAgentMock.processBudget as any).mockResolvedValue({ success: true });
      (validationAgentMock.validateResponse as any).mockResolvedValue({ success: true });

      const result = await voiceOrchestratorService.processVoiceCommand({} as any, 1);

      expect(result.success).toBe(true);
      expect(budgetAgentMock.processBudget).toHaveBeenCalled();
    });

    it('should return error if intent is unknown', async () => {
      (transcriptionServiceMock.transcribe as any).mockResolvedValue('test');
      (llmServiceMock.classifyIntent as any).mockResolvedValue({ intent: 'UNKNOWN_INTENT', confidence: 0.9 });
      (llmServiceMock.extractData as any).mockResolvedValue({ data: {}, confidence: 0.9 });

      const result = await voiceOrchestratorService.processVoiceCommand({} as any, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Tipo de comando no soportado');
    });

    it('should handle errors gracefully', async () => {
      (transcriptionServiceMock.transcribe as any).mockRejectedValue(new Error('Error'));

      const result = await voiceOrchestratorService.processVoiceCommand({} as any, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Ocurrió un error procesando tu solicitud');
    });
  });
});
