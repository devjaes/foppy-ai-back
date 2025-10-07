import { VoiceCommand, AgentResponse, CommandIntent } from "../../domain/entities/voice-command.entity";
import { ITranscriptionService, ILLMService } from "../../domain/ports/transcription.port";
import { TransactionAgentService } from "./transaction-agent.service";
import { GoalAgentService } from "./goal-agent.service";
import { BudgetAgentService } from "./budget-agent.service";
import { ValidationAgentService } from "./validation-agent.service";

export class VoiceOrchestratorService {
  constructor(
    private transcriptionService: ITranscriptionService,
    private llmService: ILLMService,
    private transactionAgent: TransactionAgentService,
    private goalAgent: GoalAgentService,
    private budgetAgent: BudgetAgentService,
    private validationAgent: ValidationAgentService
  ) {}

  async processVoiceCommand(audioBlob: Blob, userId: number): Promise<AgentResponse> {
    try {
      const transcription = await this.transcriptionService.transcribe(audioBlob);
      
      const intentResult = await this.llmService.classifyIntent(transcription);
      const intent = intentResult.intent as CommandIntent;
      
      if (intentResult.confidence < 0.7) {
        return {
          success: false,
          intent: 'UNKNOWN',
          extractedData: {},
          confidence: intentResult.confidence,
          message: "No pude entender tu solicitud. ¿Podrías repetirla de otra manera?"
        };
      }

      const extractionResult = await this.llmService.extractData(transcription, intent);
      
      let agentResponse: AgentResponse;
      
      switch (intent) {
        case 'CREATE_TRANSACTION':
          agentResponse = await this.transactionAgent.processTransaction(
            extractionResult.data, 
            userId
          );
          break;
        case 'CREATE_GOAL':
          agentResponse = await this.goalAgent.processGoal(
            extractionResult.data, 
            userId
          );
          break;
        case 'CREATE_BUDGET':
          agentResponse = await this.budgetAgent.processBudget(
            extractionResult.data, 
            userId
          );
          break;
        default:
          return {
            success: false,
            intent: 'UNKNOWN',
            extractedData: {},
            confidence: 0,
            message: "Tipo de comando no soportado"
          };
      }

      const validatedResponse = await this.validationAgent.validateResponse(
        agentResponse, 
        userId
      );

      return {
        ...validatedResponse,
        intent,
        confidence: Math.min(intentResult.confidence, extractionResult.confidence)
      };

    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        success: false,
        intent: 'UNKNOWN',
        extractedData: {},
        confidence: 0,
        message: "Ocurrió un error procesando tu solicitud"
      };
    }
  }
} 