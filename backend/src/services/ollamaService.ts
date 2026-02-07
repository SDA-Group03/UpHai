import Docker from "dockerode";

const OLLAMA_VOLUME = process.env.OLLAMA_VOLUME || "ollama-models";

// 1. Setup Docker แบบกระชับ
const isWindows = process.platform === "win32";
const docker = new Docker(isWindows ? { host: "127.0.0.1", port: 2375 } : { socketPath: "/var/run/docker.sock" });

export interface ChatInstanceResult {
  containerId: string;
  port: string;
  model: string;
}


async function ensureOllamaImage(): Promise<void> {
  const imageName = "ollama/ollama";
  try {
    await docker.getImage(imageName).inspect();
  } catch (error) {
    console.log(`📥 กำลังดาวน์โหลด Image ${imageName}...`);
    // ใช้ followProgress แบบมินิมอล แค่รอให้จบ
    await new Promise<void>((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err) => (err ? reject(err) : resolve()));
      });
    });
    console.log(`✅ ดาวน์โหลด Image สำเร็จ`);
  }
}


export async function createOllamaInstance(modelName: string = "qwen:0.5b"): Promise<ChatInstanceResult> {
  console.log(`🚀 เริ่มสร้างห้องแชท: ${modelName}`);

  try {
    await ensureOllamaImage();

    // 3. สร้างและ Start Container
    const container = await docker.createContainer({
      Image: "ollama/ollama",
      Tty: true,
      HostConfig: {
        PortBindings: { "11434/tcp": [{ HostPort: "" }] }, // สุ่ม Port
        Memory: 1024 * 1024 * 1024,
        Binds: [`${OLLAMA_VOLUME}:/root/.ollama:ro`],
      },
    });

    await container.start();

    // ดึง Port
    const data = await container.inspect();
    const hostPort = data.NetworkSettings.Ports["11434/tcp"]?.[0]?.HostPort;
    if (!hostPort) throw new Error("หา Port ไม่เจอ");

    console.log(`✅ Container รันที่ Port: ${hostPort}`);

    // 4. รอ Service พร้อม
    await waitForOllama(hostPort);

    console.log(`🎉 โมเดล ${modelName} พร้อมใช้งาน!`);

    return { containerId: container.id, port: hostPort, model: modelName };
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

async function waitForOllama(port: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/api/tags`)).ok) return;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Ollama start timeout");
}
