import Docker from "dockerode";

const docker = new Docker(
  process.platform === "win32"
    ? { host: "127.0.0.1", port: 2375 }
    : { socketPath: "/var/run/docker.sock" }
);

const WHISPER_VOLUME = process.env.WHISPER_VOLUME || "whisper-models";
const DOCKER_NETWORK = process.env.DOCKER_NETWORK || "";

export interface WhisperInstanceResult {
  containerId: string;
  port: string;
  model: string;
}

const ensureImage = async () => {
  const image = "fedirz/faster-whisper-server:latest-cpu";
  try {
    await docker.getImage(image).inspect();
  } catch {
    await new Promise<void>((resolve, reject) => {
      docker.pull(image, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, err => err ? reject(err) : resolve());
      });
    });
  }
};

const waitForService = async (host: string, port: string | number) => {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://${host}:${port}/`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Whisper start timeout");
};

export const createWhisperInstance = async (
  modelName = "base",
  memoryMb = 2048,
  containerName?: string
): Promise<WhisperInstanceResult> => {
  await ensureImage();

  const memoryBytes = memoryMb * 1024 * 1024;
  // CPU allocation not implemented yet

  const container = await docker.createContainer({
    ...(containerName ? { _query: { name: containerName } } : {}),
    _body: {
      Image: "fedirz/faster-whisper-server:latest-cpu",
      Env: [`ASR_MODEL=${modelName}`, `ASR_ENGINE=openai_whisper`],
      Tty: true,
      HostConfig: {
        PortBindings: { "8000/tcp": [{ HostPort: "" }] },
        Memory: memoryBytes,
        // NanoCpus: nanoCpus, // TODO: implement CPU allocation
        Binds: [`${WHISPER_VOLUME}:/root/.cache/whisper:ro`],
      },
    },
  } as any);

  await container.start();

  // ถ้ามี DOCKER_NETWORK → connect container เข้า network เดียวกับ backend
  if (DOCKER_NETWORK) {
    const network = docker.getNetwork(DOCKER_NETWORK);
    await network.connect({ Container: container.id });
    const data = await container.inspect();
    const containerIp = data.NetworkSettings.Networks[DOCKER_NETWORK]?.IPAddress;
    if (!containerIp) throw new Error("Container IP not found on network");
    await waitForService(containerIp, 8000);
    const port = data.NetworkSettings.Ports["8000/tcp"]?.[0]?.HostPort;
    if (!port) throw new Error("Host port not found after container start");
    return { containerId: container.id, port, model: modelName };
  }

  // local dev: ใช้ host port ตามเดิม
  const data = await container.inspect();
  const port = data.NetworkSettings.Ports["8000/tcp"]?.[0]?.HostPort;
  if (!port) throw new Error("Port not found");
  await waitForService("localhost", port);

  return { containerId: container.id, port, model: modelName };
};

export const stopWhisperInstance = async (containerId: string) => {
  const container = docker.getContainer(containerId);
  await container.stop();
  await container.remove();
};
