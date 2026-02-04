import Docker from "dockerode";

// 1. Setup Docker แบบกระชับ
const isWindows = process.platform === "win32";
const docker = new Docker(isWindows ? { host: "127.0.0.1", port: 2375 } : { socketPath: "/var/run/docker.sock" });

export interface ChatInstanceResult {
  containerId: string;
  port: string;
  model: string;
}

/**
 * 2. Pull Image แบบย่อ (ตัด Progress bar รกๆ ทิ้ง)
 */
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
        docker.modem.followProgress(stream, (err) => err ? reject(err) : resolve());
      });
    });
    console.log(`✅ ดาวน์โหลด Image สำเร็จ`);
  }
}

/**
 * สร้าง Chat Instance (เปลี่ยนวิธี Pull Model เป็น HTTP API)
 */
export async function createChatInstance(modelName: string = "qwen:0.5b"): Promise<ChatInstanceResult> {
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

    // 5. 🔥 ไฮไลท์: ใช้ HTTP API Pull แทน exec (ลบปัญหาสตรีม Docker 101 ทิ้งไปเลย)
    console.log(`⏳ กำลังสั่งให้ Container โหลดโมเดล ${modelName}...`);
    
    const response = await fetch(`http://localhost:${hostPort}/api/pull`, {
      method: "POST",
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.body) throw new Error("Failed to pull model");

    // อ่าน Stream จาก HTTP Response (ง่ายกว่า Docker Stream มาก)
    const reader = response.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
      // ถ้าอยากดู log ให้ parse chunk เป็น text ตรงนี้
    }

    console.log(`🎉 โมเดล ${modelName} พร้อมใช้งาน!`);

    return { containerId: container.id, port: hostPort, model: modelName };

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Helper: รอให้พร้อม (เหมือนเดิมแต่ตัด comment รกๆ)
async function waitForOllama(port: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/api/tags`)).ok) return;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Ollama start timeout");
}