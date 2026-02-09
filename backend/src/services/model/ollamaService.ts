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

// สั่ง pull model เข้า container — ถ้ามีใน volume แล้วจะเร็วมาก ถ้าไม่มีจะโหลดจาก registry
const pullModel = async (host: string, port: string | number, model: string) => {
  const res = await fetch(`http://${host}:${port}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: model, stream: false }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to pull model '${model}': ${res.status} ${text}`);
  }
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

  let hostPort: string;
  let serviceHost: string;
  const servicePort = 11434;

  if (DOCKER_NETWORK) {
    const network = docker.getNetwork(DOCKER_NETWORK);
    await network.connect({ Container: container.id });
    const data = await container.inspect();
    const containerIp = data.NetworkSettings.Networks[DOCKER_NETWORK]?.IPAddress;
    if (!containerIp) throw new Error("Container IP not found on network");
    hostPort = data.NetworkSettings.Ports["11434/tcp"]?.[0]?.HostPort || "11434";
    serviceHost = containerIp;
  } else {
    const data = await container.inspect();
    hostPort = data.NetworkSettings.Ports["11434/tcp"]?.[0]?.HostPort || "";
    if (!hostPort) throw new Error("Port not found");
    serviceHost = "localhost";
  }

  // ทำ background — ไม่ block response กลับ frontend
  // frontend มี health check poll ทุก 30 วิ จะรู้เองว่าพร้อมใช้เมื่อไหร่
  waitForService(serviceHost, servicePort)
    .then(() => pullModel(serviceHost, servicePort, modelName))
    .then(() => console.log(`[ollama] Model '${modelName}' ready (port ${hostPort})`))
    .catch((err) => console.error(`[ollama] Setup failed (port ${hostPort}):`, err));

  return { containerId: container.id, port: hostPort, model: modelName };
};