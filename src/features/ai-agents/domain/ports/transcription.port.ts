export interface ITranscriptionService {
  transcribe(audioBlob: Blob): Promise<string>;
}

export interface ILLMService {
  classifyIntent(transcription: string): Promise<{
    intent: string;
    confidence: number;
  }>;
  
  extractData(transcription: string, intent: string): Promise<{
    data: Record<string, any>;
    confidence: number;
  }>;
} 