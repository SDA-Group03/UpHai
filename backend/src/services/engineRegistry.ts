import { createOllamaInstance } from "./model/ollamaService";
import { createWhisperInstance } from "./model/whisperService";
import { instanceService } from "./instanceService";
import { modelService } from "./modelService";

export interface InstanceResult {
  containerId: string;
  port: string;
  model: string;
  engine: string;
}

export interface ResourceConfig {
  memoryMb: number;
  autoStopMinutes: number | null;
  // cpuCores not implemented on backend
}

export interface CreateInstanceOptions {
  modelName: string;
  engine: string;
  userId: string;
  resourceConfig?: ResourceConfig;
}

export const createContainerByEngine = async (options: CreateInstanceOptions): Promise<InstanceResult> => {
  const { modelName, engine, userId, resourceConfig } = options;

  const models = await modelService.searchModels(modelName);
  const model = models.find(m => m.name === modelName && m.engine === engine);

  if (!model) throw new Error(`Model '${modelName}' not found for engine '${engine}'`);

  // Use provided config or fall back to recommended values
  const memoryMb = resourceConfig?.memoryMb ?? model.recMemoryMb ?? 2048;
  const autoStopMinutes = resourceConfig?.autoStopMinutes ?? 30;

  const engineMap: Record<string, () => Promise<any>> = {
    ollama: () => createOllamaInstance(modelName, memoryMb),
    whisper: () => createWhisperInstance(modelName, memoryMb),
  };

  const createFn = engineMap[engine.toLowerCase()];
  if (!createFn) throw new Error(`Engine '${engine}' not supported`);

  const result = { ...await createFn(), engine };

  await instanceService.createInstance({
    userId,
    engineId: engine,
    modelId: model.id,
    containerName: `${engine}-${modelName}-${result.containerId.substring(0, 8)}`,
    containerId: result.containerId,
    port: parseInt(result.port),
    allocatedMemoryMb: memoryMb,
    // allocatedCpuCores: cpuCores, // TODO: implement backend support
    autoStopMinutes: autoStopMinutes,
  });

  return result;
};

export const getEngineConfig = (engine: string) => {
  const configs = {
    ollama: {
      volume: process.env.OLLAMA_VOLUME || "ollama-models",
      defaultPort: 11434,
      healthEndpoint: "/api/tags",
      dockerImage: "ollama/ollama",
    },
    whisper: {
      volume: process.env.WHISPER_VOLUME || "whisper-models",
      defaultPort: 8000,
      healthEndpoint: "/",
      dockerImage: "fedirz/faster-whisper-server:latest-cpu",
    },
    "stable-diffusion": {
      volume: process.env.SD_VOLUME || "sd-models",
      defaultPort: 8000,
      healthEndpoint: "/",
      dockerImage: "universonic/stable-diffusion-webui",
    },
  };

  const config = configs[engine.toLowerCase() as keyof typeof configs];
  if (!config) throw new Error(`Unknown engine: ${engine}`);
  return config;
};