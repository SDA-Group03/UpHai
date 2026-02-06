import { createOllamaInstance } from "./ollamaService";
import { createWhisperInstance } from "./whisperService";
import { createSDInstance } from "./sdService";

export interface InstanceResult {
  containerId: string;
  port: string;
  model: string;
  engine: string;
}

/**
 * Create container based on engine type
 */
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
      throw new Error(`Engine '${engine}' not supported. Available: ollama, whisper, stable-diffusion`);
  }
}

/**
 * Get engine configuration
 */
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
      dockerImage: "onerahmet/openai-whisper-asr-webservice:latest",
    },
    "stable-diffusion": {
      volume: process.env.SD_VOLUME || "sd-models",
      defaultPort: 7860,
      healthEndpoint: "/health",
      dockerImage: "stabilityai/stable-diffusion:latest",
    },
  };

  const config = configs[engine.toLowerCase() as keyof typeof configs];
  if (!config) {
    throw new Error(`Unknown engine: ${engine}`);
  }

  return config;
}

/**
 * List supported engines
 */
export function getSupportedEngines() {
  return ["ollama", "whisper", "stable-diffusion"];
}