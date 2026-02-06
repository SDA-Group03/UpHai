import Docker from "dockerode";

const SD_VOLUME = process.env.SD_VOLUME || "sd-models";

const isWindows = process.platform === "win32";
const docker = new Docker(
  isWindows ? { host: "127.0.0.1", port: 2375 } : { socketPath: "/var/run/docker.sock" }
);

export interface SDInstanceResult {
  containerId: string;
  port: string;
  model: string;
}

/**
 * Pull Stable Diffusion Docker Image
 */
async function ensureSDImage(): Promise<void> {
  const imageName = "stabilityai/stable-diffusion:latest";
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
 * Create Stable Diffusion Instance
 * Models: sdxl-turbo, sd-1.5, playground-v2, etc.
 */
export async function createSDInstance(
  modelName: string = "sdxl-turbo"
): Promise<SDInstanceResult> {
  console.log(`🎨 Creating Stable Diffusion instance: ${modelName}`);

  try {
    await ensureSDImage();

    // Determine if GPU is available
    const useGPU = await checkGPUAvailable();

    const containerConfig: any = {
      Image: "stabilityai/stable-diffusion:latest",
      Env: [`MODEL_NAME=${modelName}`, `DEVICE=cpu`], // Default to CPU
      Tty: true,
      HostConfig: {
        PortBindings: { "7860/tcp": [{ HostPort: "" }] }, // Random port
        Memory: 4 * 1024 * 1024 * 1024, // 4GB for image gen
        Binds: [`${SD_VOLUME}:/models:ro`],
      },
    };

    // Add GPU support if available
    if (useGPU) {
      containerConfig.Env = [`MODEL_NAME=${modelName}`, `DEVICE=cuda`];
      containerConfig.HostConfig.DeviceRequests = [
        {
          Driver: "nvidia",
          Count: -1, // All GPUs
          Capabilities: [["gpu"]],
        },
      ];
    }

    const container = await docker.createContainer(containerConfig);
    await container.start();

    // Get assigned port
    const data = await container.inspect();
    const hostPort = data.NetworkSettings.Ports["7860/tcp"]?.[0]?.HostPort;
    if (!hostPort) throw new Error("Port not found");

    console.log(`✅ SD container running on port: ${hostPort} (${useGPU ? "GPU" : "CPU"})`);

    // Wait for service
    await waitForSD(hostPort);

    console.log(`🎉 Stable Diffusion ${modelName} ready!`);

    return { containerId: container.id, port: hostPort, model: modelName };
  } catch (error) {
    console.error("❌ SD Error:", error);
    throw error;
  }
}

/**
 * Check if NVIDIA GPU is available
 */
async function checkGPUAvailable(): Promise<boolean> {
  try {
    // Try to run nvidia-smi in a test container
    const container = await docker.createContainer({
      Image: "nvidia/cuda:11.8.0-base-ubuntu22.04",
      Cmd: ["nvidia-smi"],
      HostConfig: {
        DeviceRequests: [
          {
            Driver: "nvidia",
            Count: -1,
            Capabilities: [["gpu"]],
          },
        ],
      },
    });

    await container.start();
    await container.wait();
    await container.remove();
    return true;
  } catch (error) {
    // GPU not available, fallback to CPU
    return false;
  }
}

/**
 * Wait for SD service to be ready
 */
async function waitForSD(port: string, maxRetries = 60): Promise<void> {
  console.log("⏳ Waiting for SD service (may take up to 2 minutes for model loading)...");
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        console.log("✅ SD service ready");
        return;
      }
    } catch (e) {
      // Service not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("SD startup timeout");
}

/**
 * Stop and remove SD container
 */
export async function stopSDInstance(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 10 }); // 10 second grace period
    await container.remove();
    console.log(`✅ SD container ${containerId} removed`);
  } catch (error) {
    console.error("❌ Error removing SD container:", error);
    throw error;
  }
}