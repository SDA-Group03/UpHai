import Docker from "dockerode";

const docker = new Docker(
  process.platform === "win32" 
    ? { host: "127.0.0.1", port: 2375 } 
    : { socketPath: "/var/run/docker.sock" }
);

const WHISPER_VOLUME = process.env.WHISPER_VOLUME || "whisper-models";

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

const waitForService = async (port: string) => {
  for (let i = 0; i < 30; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/`)).ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("Whisper start timeout");
};

export const createWhisperInstance = async (modelName = "base"): Promise<WhisperInstanceResult> => {
  await ensureImage();

  const container = await docker.createContainer({
    Image: "fedirz/faster-whisper-server:latest-cpu",
    Env: [`ASR_MODEL=${modelName}`, `ASR_ENGINE=openai_whisper`],
    Tty: true,
    HostConfig: {
      PortBindings: { "9000/tcp": [{ HostPort: "" }] },
      Memory: 2 * 1024 * 1024 * 1024,
      Binds: [`${WHISPER_VOLUME}:/root/.cache/whisper:ro`],
    },
  });

  await container.start();
  const data = await container.inspect();
  const port = data.NetworkSettings.Ports["9000/tcp"]?.[0]?.HostPort;
  
  if (!port) throw new Error("Port not found");

  await waitForService(port);

  return { containerId: container.id, port, model: modelName };
};

export const stopWhisperInstance = async (containerId: string) => {
  const container = docker.getContainer(containerId);
  await container.stop();
  await container.remove();
};