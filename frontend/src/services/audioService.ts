import ax from '@/conf/ax';

/**
 * Whisper API Service with CORS handling
 * OpenAI-compatible API for transcription and translation
 */

export interface TranscriptionOptions {
  model?: string;
  language?: string;
  temperature?: number;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  timestamp_granularities?: ('word' | 'segment')[];
  stream?: boolean;
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

/**
 * Transcribe audio file using Whisper API
 */
export async function transcribeAudio(
  port: number,
  audioFile: File,
  options: TranscriptionOptions = {},
  onChunk?: (text: string) => void
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('file', audioFile);

  // Add optional parameters
  if (options.model) formData.append('model', options.model);
  if (options.language) formData.append('language', options.language);
  if (options.temperature !== undefined) {
    formData.append('temperature', options.temperature.toString());
  }
  if (options.response_format) {
    formData.append('response_format', options.response_format);
  }
  if (options.timestamp_granularities) {
    formData.append('timestamp_granularities[]', options.timestamp_granularities.join(','));
  }

  const isStreaming = options.stream === true;
  if (isStreaming) formData.append('stream', 'true');

  const url = '/whisper/v1/audio/transcriptions';

  try {
    if (isStreaming) {
      return await handleAxiosStreamingRequest(url, formData, port, onChunk);
    }

    // Handle non-streaming response
    const response = await ax.post(url, formData, {
      params: { port },
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorData = response.data;
      if (errorData) {
        errorMessage += ` - ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`;
      }
      throw new Error(errorMessage);
    }
    
    if (typeof response.data === 'object' && response.data !== null) {
      return response.data;
    }
    
    const text = String(response.data);
    return { text };

  } catch (error: any) {
    if (error.isAxiosError && !error.response) {
      throw new Error(`Cannot connect to Whisper service on port ${port}. Is the container running or backend proxy available?`);
    }
    if (error.isAxiosError) {
      const message = error.response?.data?.error || error.response?.data || error.message;
      throw new Error(String(message));
    }
    throw error;
  }
}

/**
 * Translate audio file to English using Whisper API
 */
export async function translateAudio(
  port: number,
  audioFile: File,
  options: Omit<TranscriptionOptions, 'language'> = {},
  onChunk?: (text: string) => void
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('file', audioFile);

  if (options.model) formData.append('model', options.model);
  if (options.temperature !== undefined) {
    formData.append('temperature', options.temperature.toString());
  }
  if (options.response_format) {
    formData.append('response_format', options.response_format);
  }

  const isStreaming = options.stream === true;
  if (isStreaming) formData.append('stream', 'true');

  const url = '/whisper/v1/audio/translations';

  try {
    if (isStreaming) {
      return await handleAxiosStreamingRequest(url, formData, port, onChunk);
    }

    const response = await ax.post(url, formData, {
      params: { port },
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorData = response.data;
      if (errorData) {
        errorMessage += ` - ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`;
      }
      throw new Error(errorMessage);
    }

    if (typeof response.data === 'object' && response.data !== null) {
      return response.data;
    }
    
    const text = String(response.data);
    return { text };

  } catch (error: any) {
    if (error.isAxiosError && !error.response) {
      throw new Error(`Cannot connect to Whisper service on port ${port}. Is the container running or backend proxy available?`);
    }
    if (error.isAxiosError) {
      const message = error.response?.data?.error || error.response?.data || error.message;
      throw new Error(String(message));
    }
    throw error;
  }
}

/**
 * Handle streaming request via Axios with onDownloadProgress
 */
async function handleAxiosStreamingRequest(
  url: string,
  formData: FormData,
  port: number,
  onChunk?: (text: string) => void
): Promise<TranscriptionResponse> {
  let buffer = '';
  let fullText = '';
  let lastResponseLength = 0;

  const processChunk = (text: string) => {
    buffer += text;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.substring(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const chunkText = parsed.text || parsed.chunk || '';
          if (chunkText) {
            fullText += chunkText;
            if (onChunk) onChunk(chunkText);
          }
        } catch {
          if (data) {
            fullText += data;
            if (onChunk) onChunk(data);
          }
        }
      } else if (trimmed && !trimmed.startsWith(':')) {
        fullText += trimmed;
        if (onChunk) onChunk(trimmed);
      }
    }
  };

  const response = await ax.post(url, formData, {
    params: { port },
    responseType: 'text',
    transformResponse: v => v,
    validateStatus: () => true,
    onDownloadProgress: (pe: any) => {
      const xhr = pe?.event?.currentTarget as XMLHttpRequest | undefined;
      const responseText = xhr?.responseText;
      if (typeof responseText !== 'string') return;
      const chunk = responseText.substring(lastResponseLength);
      lastResponseLength = responseText.length;
      if (chunk) processChunk(chunk);
    },
  });

  if (response.status < 200 || response.status >= 300) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    if (response.data) {
      errorMessage += ` - ${response.data}`;
    }
    throw new Error(errorMessage);
  }

  if (buffer.trim()) processChunk('\n');
  return { text: fullText };
}

/**
 * Check if Whisper service is healthy
 */
export async function checkWhisperHealth(port: number): Promise<boolean> {
  try {
    const response = await ax.get('/whisper/health', {
      params: { port },
      timeout: 5000,
      validateStatus: () => true,
    });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error(`Health check failed for port ${port}:`, error);
    return false;
  }
}

/**
 * Create audio URL that works in browser
 * Converts File/Blob to playable URL
 */
export function createAudioURL(file: File | Blob): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke audio URL to free memory
 */
export function revokeAudioURL(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to revoke URL:', error);
  }
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 25MB for Whisper)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size is 25MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB` 
    };
  }

  // Check file type
  const validTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/m4a',
    'audio/x-m4a',
    'audio/ogg',
    'audio/flac',
    'audio/webm',
    'audio/aac',
  ];

  const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.webm', '.aac'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  if (!hasValidType && !hasValidExtension) {
    return { 
      valid: false, 
      error: `Invalid file type. Supported formats: MP3, WAV, M4A, OGG, FLAC, WebM, AAC` 
    };
  }

  return { valid: true };
}