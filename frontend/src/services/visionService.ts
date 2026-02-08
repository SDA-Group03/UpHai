import type { Message } from "@/lib/types";

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
    const response = await fetch(`http://localhost:${port}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
