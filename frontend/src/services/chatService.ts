// Chat Service สำหรับเชื่อมต่อกับ Ollama API
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatOptions {
  model: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  system?: string;
}

/**
 * ส่งข้อความไปยัง Ollama API และรับ response แบบ streaming
 */
export async function sendMessage(
  port: string,
  messages: Message[],
  options: ChatOptions,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`http://localhost:${port}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true,
        options: {
          temperature: options.temperature,
          top_p: options.top_p,
          top_k: options.top_k,
          num_predict: options.max_tokens,
          frequency_penalty: options.frequency_penalty,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // เก็บบรรทัดสุดท้ายที่ยังไม่เสร็จไว้ใน buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              onChunk(data.message.content);
            }
          } catch (e) {
            console.error('Failed to parse chunk:', line);
          }
        }
      }
    }
  } catch (error) {
    onError(error as Error);
  }
}

/**
 * ส่งข้อความไปยัง Ollama API (แบบไม่ stream)
 */
export async function sendMessageSimple(
  port: string,
  messages: Message[],
  options: ChatOptions
): Promise<string> {
  const response = await fetch(`http://localhost:${port}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      stream: false,
      options: {
        temperature: options.temperature,
        top_p: options.top_p,
        top_k: options.top_k,
        num_predict: options.max_tokens,
        frequency_penalty: options.frequency_penalty,
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.message?.content || '';
}

/**
 * สร้าง unique ID สำหรับข้อความ
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}