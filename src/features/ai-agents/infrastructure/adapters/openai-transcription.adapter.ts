import { ITranscriptionService } from "../../domain/ports/transcription.port";

export class OpenAITranscriptionAdapter implements ITranscriptionService {
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/audio/transcriptions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');
      formData.append('response_format', 'json');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
} 