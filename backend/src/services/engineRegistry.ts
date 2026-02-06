import { createOllamaInstance } from "./ollamaService";
import { createWhisperInstance } from "./whisperService";
import { createSDInstance } from "./sdService";

export interface InstanceResult {
  containerId: string;
  port: string;
  model: string;
  engine: string;
}

export async function createContainerByEngine(
  modelName: string,
  engine: string
): Promise<InstanceResult> {
  console.log(`🎯 Creating instance: ${engine}/${modelName}`);

  switch (engine.toLowerCase()) {
    case "ollama": {
      const result = await createOllamaInstance(modelName);
      return { ...result, engine: "ollama" };
    }
    case "whisper": {
      const result = await createWhisperInstance(modelName);
      return { ...result, engine: "whisper" };
    }
    case "stable-diffusion":
    case "sd": {
      const result = await createSDInstance(modelName);
      return { ...result, engine: "stable-diffusion" };
    }
    default:
      throw new Error(`Engine '${engine}' not supported.`);
  }
}

export function getEngineConfig(engine: string) {
  const configs = {
    ollama: {
      volume: process.env.OLLAMA_VOLUME || "ollama-models",
      defaultPort: 11434,
      healthEndpoint: "/api/tags",
      dockerImage: "ollama/ollama",
    },
    whisper: {
      volume: process.env.WHISPER_VOLUME || "whisper-models",
      defaultPort: 9000,
      healthEndpoint: "/",
      dockerImage: "fedirz/faster-whisper-server:latest-cpu",
    },
    "stable-diffusion": {
      volume: process.env.SD_VOLUME || "sd-models",
      defaultPort: 8000, // อัปเดตพอร์ตเป็น 8000 สำหรับ FastSD CPU
      healthEndpoint: "/",
      dockerImage: "universonic/stable-diffusion-webui",
    },
  };

  const config = configs[engine.toLowerCase() as keyof typeof configs];
  if (!config) throw new Error(`Unknown engine: ${engine}`);
  return config;
}