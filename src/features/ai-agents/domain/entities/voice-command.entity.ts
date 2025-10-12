export interface VoiceCommand {
  id: string;
  userId: number;
  audioBlob?: Blob;
  transcription: string;
  intent: CommandIntent;
  extractedData: Record<string, any>;
  confidence: number;
  status: CommandStatus;
  createdAt: Date;
  processedAt?: Date;
}

export type CommandIntent = 
  | 'CREATE_TRANSACTION'
  | 'CREATE_GOAL'
  | 'CREATE_BUDGET'
  | 'UNKNOWN';

export type CommandStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'VALIDATED'
  | 'CONFIRMED'
  | 'EXECUTED'
  | 'FAILED';

export interface AgentResponse {
  success: boolean;
  intent: CommandIntent;
  extractedData: Record<string, any>;
  confidence: number;
  validationErrors?: string[];
  suggestedCorrections?: Record<string, any>;
  message: string;
} 