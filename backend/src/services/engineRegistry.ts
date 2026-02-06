import { createOllamaInstance } from "./ollamaService";

export async function createContainerByEngine(modelName: string, engine: string) {
  switch (engine.toLowerCase()) {
    case "ollama":
      return await createOllamaInstance(modelName);
    default:
      throw new Error(`Engine ${engine} not supported`);
  }
}
