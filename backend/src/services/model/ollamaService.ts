import Docker from "dockerode";

const docker = new Docker(
  process.platform === "win32"
    ? { host: "127.0.0.1", port: 2375 }
    : { socketPath: "/var/run/docker.sock" }
);

const OLLAMA_VOLUME = process.env.OLLAMA_VOLUME || "ollama-models";
const DOCKER_NETWORK = process.env.DOCKER_NETWORK || "";

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

const waitForService = async (host: string, port: string | number) => {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://${host}:${port}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
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
      Binds: [`${OLLAMA_VOLUME}:/root/.ollama`],
    },
  });

  await container.start();

  // ถ้ามี DOCKER_NETWORK → connect container เข้า network เดียวกับ backend
  // แล้ว health check ผ่าน container IP ภายใน network ตรงๆ (ไม่ผ่าน host port)
  if (DOCKER_NETWORK) {
    const network = docker.getNetwork(DOCKER_NETWORK);
    await network.connect({ Container: container.id });
    const data = await container.inspect();
    const containerIp = data.NetworkSettings.Networks[DOCKER_NETWORK]?.IPAddress;
    if (!containerIp) throw new Error("Container IP not found on network");
    await waitForService(containerIp, 11434);
    const port = data.NetworkSettings.Ports["11434/tcp"]?.[0]?.HostPort || "11434";
    return { containerId: container.id, port, model: modelName };
  }

  // local dev: ไม่มี DOCKER_NETWORK → ใช้ host port ตามเดิม
  const data = await container.inspect();
  const port = data.NetworkSettings.Ports["11434/tcp"]?.[0]?.HostPort;
  if (!port) throw new Error("Port not found");
  await waitForService("localhost", port);

  return { containerId: container.id, port, model: modelName };
};