import Docker from "dockerode";

const WHISPER_VOLUME = process.env.WHISPER_VOLUME || "whisper-models";

const isWindows = process.platform === "win32";
const docker = new Docker(
  isWindows ? { host: "127.0.0.1", port: 2375 } : { socketPath: "/var/run/docker.sock" }
);

export interface WhisperInstanceResult {
  containerId: string;
  port: string;
  model: string;
}

/**
 * Pull Whisper Docker Image
 */
async function ensureWhisperImage(): Promise<void> {
  const imageName = "fedirz/faster-whisper-server:latest-cpu";
  try {
    await docker.getImage(imageName).inspect();
    console.log(`✅ Image ${imageName} exists`);
  } catch (error) {
    console.log(`📥 Pulling ${imageName}...`);
    await new Promise<void>((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err) => (err ? reject(err) : resolve()));
      });
    });
    console.log(`✅ Image pulled successfully`);
  }
}

/**
 * Create Whisper Instance
 * Models: tiny, base, small, medium, large-v3
 */
export async function createWhisperInstance(
  modelName: string = "base"
): Promise<WhisperInstanceResult> {
  console.log(`🎤 Creating Whisper instance: ${modelName}`);

  try {
    await ensureWhisperImage();

    // Create and start container
    const container = await docker.createContainer({
      Image: "fedirz/faster-whisper-server:latest-cpu",
      Env: [`ASR_MODEL=${modelName}`, `ASR_ENGINE=openai_whisper`],
      Tty: true,
      HostConfig: {
        PortBindings: { "9000/tcp": [{ HostPort: "" }] }, // Random port
        Memory: 2 * 1024 * 1024 * 1024, // 2GB
        Binds: [`${WHISPER_VOLUME}:/root/.cache/whisper:ro`],
      },
    });

    await container.start();

    // Get assigned port
    const data = await container.inspect();
    const hostPort = data.NetworkSettings.Ports["9000/tcp"]?.[0]?.HostPort;
    if (!hostPort) throw new Error("Port not found");

    console.log(`✅ Whisper container running on port: ${hostPort}`);

    // Wait for service
    await waitForWhisper(hostPort);

    console.log(`🎉 Whisper ${modelName} ready!`);

    return { containerId: container.id, port: hostPort, model: modelName };
  } catch (error) {
    console.error("❌ Whisper Error:", error);
    throw error;
  }
}

/**
 * Wait for Whisper service to be ready
 */
async function waitForWhisper(port: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/`);
      if (response.ok) {
        console.log("✅ Whisper service ready");
        return;
      }
    } catch (e) {
      // Service not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Whisper startup timeout");
}

/**
 * Stop and remove Whisper container
 */
export async function stopWhisperInstance(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
    console.log(`✅ Whisper container ${containerId} removed`);
  } catch (error) {
    console.error("❌ Error removing Whisper container:", error);
    throw error;
  }
}