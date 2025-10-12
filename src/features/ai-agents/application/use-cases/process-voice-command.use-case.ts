import { VoiceOrchestratorService } from "../services/voice-orchestrator.service";
import { AgentResponse } from "../../domain/entities/voice-command.entity";

export interface ProcessVoiceCommandRequest {
  audioBlob: Blob;
  userId: number;
}

export class ProcessVoiceCommandUseCase {
  constructor(
    private voiceOrchestrator: VoiceOrchestratorService
  ) {}

  async execute(request: ProcessVoiceCommandRequest): Promise<AgentResponse> {
    const { audioBlob, userId } = request;

    if (!audioBlob || audioBlob.size === 0) {
      return {
        success: false,
        intent: 'UNKNOWN',
        extractedData: {},
        confidence: 0,
        message: "No se recibió audio válido"
      };
    }

    if (!userId || userId <= 0) {
      return {
        success: false,
        intent: 'UNKNOWN',
        extractedData: {},
        confidence: 0,
        message: "Usuario no válido"
      };
    }

    try {
      return await this.voiceOrchestrator.processVoiceCommand(audioBlob, userId);
    } catch (error) {
      console.error('Error in ProcessVoiceCommandUseCase:', error);
      return {
        success: false,
        intent: 'UNKNOWN',
        extractedData: {},
        confidence: 0,
        message: "Error interno del servidor"
      };
    }
  }
} 