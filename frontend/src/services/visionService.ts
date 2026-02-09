import type { Message } from "@/lib/types";
import { getAccessToken } from './authService';

const normalizeApiOrigin = (value: string) => {
    const normalized = value.trim().replace(/\/+$/, '');
    return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
};

const apiOrigin = normalizeApiOrigin(import.meta.env.VITE_API_URL ?? '');
const OLLAMA_PROXY_BASE_URL = `${apiOrigin}/api/ollama`;

function authHeaders(): Record<string, string> {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface VisionChatPayload {
    model: string;
    messages: Message[];
    stream: boolean;
    options: {
        temperature: number;
        num_predict: number;
    };
}

export const streamVisionChat = async (
    port: number,
    payload: VisionChatPayload,
    onChunk: (chunk: string) => void
): Promise<void> => {
    const response = await fetch(`${OLLAMA_PROXY_BASE_URL}/chat?port=${port}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            onChunk(chunk);
        }
    }
};
