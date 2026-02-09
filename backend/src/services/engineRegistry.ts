import { createOllamaInstance } from "./model/ollamaService";
import { createWhisperInstance } from "./model/whisperService";
import { instanceService } from "./instanceService";
import { modelService } from "./modelService";
import { randomUUID } from "node:crypto";

export interface InstanceResult {
  containerId: string;
  port: string;
  model: string;
  engine: string;
  containerName: string;
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
  containerName?: string;
  resourceConfig?: ResourceConfig;
}

const isValidContainerName = (name: string) =>
  /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(name);

const sanitizeContainerName = (raw: string) => {
  const trimmed = raw.trim();
  const replaced = trimmed.replace(/[^A-Za-z0-9_.-]+/g, "-");
  const collapsed = replaced.replace(/-+/g, "-");
  const stripped = collapsed.replace(/^[^A-Za-z0-9]+/, "").replace(/[^A-Za-z0-9]+$/, "");
  return stripped;
};

export const createContainerByEngine = async (options: CreateInstanceOptions): Promise<InstanceResult> => {
  const { modelName, engine, userId, resourceConfig, containerName: requestedContainerName } = options;

  const models = await modelService.searchModels(modelName);
  const model = models.find(m => m.name === modelName && m.engine === engine);

  if (!model) throw new Error(`Model '${modelName}' not found for engine '${engine}'`);

  // Use provided config or fall back to recommended values
  const memoryMb = resourceConfig?.memoryMb ?? model.recMemoryMb ?? 2048;
  const autoStopMinutes = resourceConfig?.autoStopMinutes ?? 30;

  const engineKey = engine.toLowerCase();
  const safeModelPart = sanitizeContainerName(modelName) || "model";
  const generatedContainerName = `${engineKey}-${safeModelPart}-${randomUUID().slice(0, 8)}`;
  const finalContainerName = requestedContainerName?.trim()
    ? requestedContainerName.trim()
    : generatedContainerName;

  if (!isValidContainerName(finalContainerName)) {
    const suggestion = isValidContainerName(generatedContainerName) ? generatedContainerName : `${engineKey}-instance-${randomUUID().slice(0, 8)}`;
    throw new Error(
      `Invalid containerName '${finalContainerName}'. Allowed: letters/numbers and . _ - (must start with letter/number). Example: '${suggestion}'`
    );
  }

  const engineMap: Record<string, () => Promise<any>> = {
    ollama: () => createOllamaInstance(modelName, memoryMb, finalContainerName),
    whisper: () => createWhisperInstance(modelName, memoryMb, finalContainerName),
  };

  const createFn = engineMap[engineKey];
  if (!createFn) throw new Error(`Engine '${engine}' not supported`);

  const result = { ...await createFn(), engine, containerName: finalContainerName };

  await instanceService.createInstance({
    userId,
    engineId: engine,
    modelId: model.id,
    containerName: finalContainerName,
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
