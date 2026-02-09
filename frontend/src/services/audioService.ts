/**
 * Whisper API Service with CORS handling
 * OpenAI-compatible API for transcription and translation
 */
import { getAccessToken } from './authService';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const normalizeApiOrigin = (value: string) => {
  const normalized = value.trim().replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
};

const apiOrigin = normalizeApiOrigin(import.meta.env.VITE_API_URL ?? '');
const API_BASE_URL = `${apiOrigin}/api`;
const WHISPER_PROXY_BASE_URL = `${API_BASE_URL}/whisper`;

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

  try {
    const response = await fetch(`${WHISPER_PROXY_BASE_URL}/audio/transcriptions?port=${port}`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.text();
        if (errorData) {
          errorMessage += ` - ${errorData}`;
        }
      } catch (e) {
        // Ignore parse error
      }
      
      throw new Error(errorMessage);
    }

    // Handle streaming response
    if (isStreaming && response.body) {
      return handleStreamingResponse(response.body, onChunk);
    }

    // Handle non-streaming response
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    
    // Plain text response
    const text = await response.text();
    return { text };

  } catch (error) {
    // Enhanced error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to Whisper service (port ${port}) via backend proxy. Is the backend running?`);
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

  try {
    const response = await fetch(`${WHISPER_PROXY_BASE_URL}/audio/translations?port=${port}`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.text();
        if (errorData) {
          errorMessage += ` - ${errorData}`;
        }
      } catch (e) {
        // Ignore
      }
      
      throw new Error(errorMessage);
    }

    if (isStreaming && response.body) {
      return handleStreamingResponse(response.body, onChunk);
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    
    const text = await response.text();
    return { text };

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to Whisper service (port ${port}) via backend proxy. Is the backend running?`);
    }
    throw error;
  }
}

/**
 * Handle Server-Sent Events (SSE) streaming response
 */
async function handleStreamingResponse(
  body: ReadableStream<Uint8Array>,
  onChunk?: (text: string) => void
): Promise<TranscriptionResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        
        // SSE format: "data: {json}" or just text chunks
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.substring(6);
          
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const text = parsed.text || parsed.chunk || '';
            if (text) {
              fullText += text;
              if (onChunk) onChunk(text);
            }
          } catch {
            // If not JSON, treat as plain text
            if (data) {
              fullText += data;
              if (onChunk) onChunk(data);
            }
          }
        } else if (trimmed && !trimmed.startsWith(':')) {
          // Plain text chunk (not SSE comment)
          fullText += trimmed;
          if (onChunk) onChunk(trimmed);
        }
      }
    }

    return { text: fullText };
  } finally {
    reader.releaseLock();
  }
}

/**
 * Check if Whisper service is healthy
 */
export async function checkWhisperHealth(port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${WHISPER_PROXY_BASE_URL}/health?port=${port}`, {
      method: 'GET',
      headers: authHeaders(),
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) return false;
    const data = await response.json().catch(() => null);
    return Boolean(data?.ok);
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
