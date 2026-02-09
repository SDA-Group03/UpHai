import Docker from "dockerode";
import { OLLAMA_SERVICE_HOST } from "../../config/env.ts";

const docker = new Docker(
  process.platform === "win32" 
    ? { host: "127.0.0.1", port: 2375 } 
    : { socketPath: "/var/run/docker.sock" }
);

const OLLAMA_VOLUME = process.env.OLLAMA_VOLUME || "ollama-models";

export interface ChatInstanceResult {
  containerId: string;
  port: string;
  model: string;
}

const ensureImage = async () => {
  try {
    await docker.getImage("ollama/ollama").inspect();
  } catch {
    await new Promise<void>((resolve, reject) => {
      docker.pull("ollama/ollama", (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, err => err ? reject(err) : resolve());
      });
    });
  }
};

const waitForService = async (port: string) => {
  for (let i = 0; i < 30; i++) {
    try {
      if ((await fetch(`http://${OLLAMA_SERVICE_HOST}:${port}/api/tags`)).ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error("Ollama start timeout");
};

export const createOllamaInstance = async (modelName = "qwen:0.5b"): Promise<ChatInstanceResult> => {
  await ensureImage();

  const container = await docker.createContainer({
    Image: "ollama/ollama",
    Tty: true,
    HostConfig: {
      PortBindings: { "11434/tcp": [{ HostPort: "" }] },
      Memory: 4 * 1024 * 1024 * 1024,
      Binds: [`${OLLAMA_VOLUME}:/root/.ollama:ro`],
    },
  });

  await container.start();
  const data = await container.inspect();
  const port = data.NetworkSettings.Ports["11434/tcp"]?.[0]?.HostPort;
  
  if (!port) throw new Error("Port not found");

  await waitForService(port);

  return { containerId: container.id, port, model: modelName };
};