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
 * Pull Stable Diffusion Image (FastSD CPU Version)
 * ตัวนี้เบากว่าและออกแบบมาเพื่อ CPU โดยเฉพาะ
 */
async function ensureSDImage(): Promise<void> {
  const imageName = "rupeshs/fastsdcpu:latest";
  try {
    await docker.getImage(imageName).inspect();
    console.log(`✅ Image ${imageName} exists`);
  } catch (error) {
    console.log(`📥 Pulling ${imageName} (Optimized for CPU)...`);
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
 * Create Stable Diffusion Instance (CPU Only)
 */
export async function createSDInstance(
  modelName: string = "sdxl-turbo"
): Promise<SDInstanceResult> {
  console.log(`🎨 Creating SD CPU instance: ${modelName}`);

  try {
    await ensureSDImage();

    const containerConfig: any = {
      Image: "universonic/stable-diffusion-webui",
      Env: [
        `MODEL_NAME=${modelName}`,
        "DEVICE=cpu",
        "USE_OPENVINO=true" // ช่วยเร่งความเร็วบน CPU
      ],
      Tty: true,
      HostConfig: {
        // FastSD CPU ใช้พอร์ต 8000 เป็นหลัก
        PortBindings: { "8000/tcp": [{ HostPort: "" }] }, 
        // จำกัด RAM (4GB กำลังดีสำหรับ CPU mode)
        Memory: 4 * 1024 * 1024 * 1024, 
        // จำกัด CPU เพื่อไม่ให้เครื่องค้าง (เช่นใช้ไม่เกิน 2 คอร์)
        CpuQuota: 200000, 
        Binds: [`${SD_VOLUME}:/app/models:ro`],
      },
    };

    const container = await docker.createContainer(containerConfig);
    await container.start();

    // Get assigned port
    const data = await container.inspect();
    const hostPort = data.NetworkSettings.Ports["8000/tcp"]?.[0]?.HostPort;
    if (!hostPort) throw new Error("Port not found");

    console.log(`✅ SD CPU container running on port: ${hostPort}`);

    // รอ Service พร้อมใช้งาน
    await waitForSD(hostPort);

    console.log(`🎉 Stable Diffusion ${modelName} ready! (CPU Mode)`);

    return { containerId: container.id, port: hostPort, model: modelName };
  } catch (error) {
    console.error("❌ SD Error:", error);
    throw error;
  }
}

/**
 * Wait for SD service to be ready
 */
async function waitForSD(port: string, maxRetries = 60): Promise<void> {
  console.log("⏳ Waiting for SD service (CPU loading might take time)...");
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/`);
      if (response.ok) {
        console.log("✅ SD service ready");
        return;
      }
    } catch (e) {
      // Not ready
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("SD startup timeout");
}

export async function stopSDInstance(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
    console.log(`✅ SD container ${containerId} removed`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}