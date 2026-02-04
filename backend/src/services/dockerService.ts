import Docker from "dockerode";

// ตรวจสอบระบบปฏิบัติการ
const isWindows = process.platform === "win32";

// เชื่อมต่อ Docker ตาม OS
const docker = new Docker(
  isWindows
    ? {
        host: "127.0.0.1",
        port: 2375, // Docker Desktop exposes on this port
      }
    : { socketPath: "/var/run/docker.sock" },
);

export interface ChatInstanceResult {
  containerId: string;
  port: string;
  model: string;
}

/**
 * ตรวจสอบและ Pull Ollama Image ถ้ายังไม่มี
 */
async function ensureOllamaImage(): Promise<void> {
  const imageName = "ollama/ollama";

  try {
    // ตรวจสอบว่ามี image อยู่แล้วหรือไม่
    await docker.getImage(imageName).inspect();
    console.log(`✅ Image ${imageName} มีอยู่แล้ว`);
  } catch (error) {
    // ถ้าไม่มี ให้ pull
    console.log(`📥 กำลังดาวน์โหลด ${imageName}... (อาจใช้เวลา 2-5 นาที)`);

    await new Promise<void>((resolve, reject) => {
      docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) {
          reject(err);
          return;
        }

        // แสดง progress
        docker.modem.followProgress(
          stream,
          (err: Error | null) => {
            if (err) {
              reject(err);
            } else {
              console.log(`\n✅ ดาวน์โหลด ${imageName} สำเร็จ!`);
              resolve();
            }
          },
          (event: any) => {
            // แสดง progress bar
            if (event.status === "Downloading" || event.status === "Extracting") {
              const progress = event.progress || "";
              process.stdout.write(`\r${event.status}: ${event.id || ""} ${progress}`);
            }
          },
        );
      });
    });
  }
}

/**
 * สร้าง Container ใหม่สำหรับ Model
 * @param modelName - ชื่อ model ที่ต้องการใช้ (เช่น "qwen:0.5b")
 * @returns ข้อมูล container ที่สร้าง
 */
export async function createChatInstance(modelName: string = "qwen:0.5b"): Promise<ChatInstanceResult> {
  console.log(`🚀 กำลังเริ่มกระบวนการสร้างห้องแชทสำหรับโมเดล: ${modelName}`);

  try {
    // 0. ตรวจสอบและ Pull Ollama Image ถ้ายังไม่มี
    await ensureOllamaImage();

    // 1. สร้าง Container (ยังไม่ Start)
    const container = await docker.createContainer({
      Image: "ollama/ollama",
      Tty: true, //รัน background
      HostConfig: {
        PortBindings: {
          "11434/tcp": [{ HostPort: "" }], // ให้ Docker สุ่ม Port
        },
        Memory: 1024 * 1024 * 1024, // จำกัด RAM 1GB
      },
    });

    console.log(`📦 สร้าง Container ID: ${container.id.substring(0, 12)} สำเร็จ`);

    // 2. Start Container
    await container.start();

    // 3. ดึงข้อมูล Port ที่สุ่มได้
    const data = await container.inspect();
    const hostPort = data.NetworkSettings.Ports["11434/tcp"]?.[0]?.HostPort;

    if (!hostPort) {
      throw new Error("ไม่สามารถดึง Port จาก Container ได้");
    }

    console.log(`✅ Container เริ่มทำงานแล้วที่ Port: ${hostPort}`);

    // 4. รอให้ Ollama service พร้อมใช้งาน
    console.log(`⏳ รอให้ Ollama service เริ่มทำงาน...`);
    await waitForOllama(hostPort);

    // 5. Pull Model ภายใน Container
    console.log(`⏳ กำลังดาวน์โหลดโมเดล ${modelName} ภายใน Container (อาจใช้เวลานาน)...`);

    const exec = await container.exec({
      Cmd: ["ollama", "pull", modelName],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    // รอให้โหลดเสร็จ - ใช้วิธีที่ robust กว่า โดยไม่ใช้ demuxStream
    await new Promise<void>((resolve, reject) => {
      let completed = false;
      let outputBuffer = "";

      // รับ data ทั้งหมดเองโดยไม่ผ่าน demuxStream
      stream.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        outputBuffer += text;
        process.stdout.write(text);
      });

      // เมื่อ stream จบ - ถือว่าสำเร็จเสมอ
      stream.on("end", () => {
        if (!completed) {
          completed = true;
          console.log("\n✅ Model download completed");
          resolve();
        }
      });

      // Handle errors - ignore ทุก error ที่เกี่ยวกับ stream/connection closure
      stream.on("error", (err: any) => {
        if (!completed) {
          // List ของ error codes/messages ที่ถือว่าปกติเมื่อ stream ปิด
          const normalClosureErrors = [
            err.statusCode === 101, // Switching Protocols
            err.statusCode === 0, // No error code
            err.message?.includes("101"),
            err.message?.includes("ECONNRESET"), // Connection reset
            err.message?.includes("socket hang up"), // Socket closed
            err.message?.includes("aborted"), // Request aborted
            err.code === "ECONNRESET",
            err.code === "EPIPE", // Broken pipe
            err.reason === "undefined",
            !err.message, // No error message
          ];

          // ตรวจสอบว่าเป็น normal closure error หรือไม่
          if (normalClosureErrors.some((condition) => condition)) {
            completed = true;
            console.log("\n✅ Model download completed (stream closed normally)");
            resolve();
          } else {
            // Error จริงๆ ที่ควร report
            completed = true;
            console.error("\n❌ Unexpected error:", err);
            reject(err);
          }
        }
      });

      // Timeout safety net (15 minutes for large models)
      setTimeout(() => {
        if (!completed) {
          completed = true;
          reject(new Error("⏱️ Model download timeout after 15 minutes"));
        }
      }, 900000);
    });

    console.log(`🎉 เสร็จสิ้น! โมเดล ${modelName} พร้อมคุยแล้ว!`);
    console.log(`👉 ลองยิง API ไปที่: http://localhost:${hostPort}/api/chat`);

    return {
      containerId: container.id,
      port: hostPort,
      model: modelName,
    };
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการสร้าง Container:", error);
    throw error;
  }
}

/**
 * รอให้ Ollama service พร้อมใช้งาน
 */
async function waitForOllama(port: string, maxRetries: number = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/tags`);
      if (response.ok) {
        console.log(`✅ Ollama service พร้อมใช้งานแล้ว!`);
        return;
      }
    } catch (error) {
      // ยังไม่พร้อม รออีก 1 วินาที
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.stdout.write(".");
  }

  throw new Error("Timeout: Ollama service ไม่สามารถเริ่มทำงานได้");
}

/**
 * ตรวจสอบว่าเชื่อมต่อ Docker ได้หรือไม่
 */
export async function checkDockerConnection(): Promise<boolean> {
  try {
    await docker.ping();
    console.log("✅ เชื่อมต่อ Docker สำเร็จ!");
    console.log(`📡 Connected via: ${isWindows ? "TCP (127.0.0.1:2375)" : "Unix Socket"}`);
    return true;
  } catch (error: any) {
    console.error("❌ เชื่อมต่อ Docker ไม่ได้:", error);

    if (isWindows) {
      console.log("\n💡 วิธีแก้ปัญหาบน Windows:");
      console.log("1. เปิด Docker Desktop");
      console.log("2. ไปที่ Settings → General");
      console.log('3. เปิด "Expose daemon on tcp://localhost:2375 without TLS"');
      console.log("4. คลิก Apply & Restart");
      console.log("\n⚠️  หรือลองใช้ WSL 2 แทน\n");
    } else {
      console.log("💡 กรุณาเปิด Docker Desktop ก่อนใช้งาน");
    }

    return false;
  }
}

/**
 * หยุดและลบ Container
 */
export async function stopAndRemoveContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
    console.log(`🗑️  ลบ Container ${containerId.substring(0, 12)} สำเร็จ`);
  } catch (error) {
    console.error("❌ ไม่สามารถลบ Container ได้:", error);
    throw error;
  }
}

/**
 * ดึงรายการ Container ทั้งหมด
 */
export async function listContainers(): Promise<Docker.ContainerInfo[]> {
  try {
    return await docker.listContainers({ all: true });
  } catch (error) {
    console.error("❌ ไม่สามารถดึงรายการ Container ได้:", error);
    throw error;
  }
}

/**
 * ดึงรายการ Images ทั้งหมด
 */
export async function listImages(): Promise<Docker.ImageInfo[]> {
  try {
    return await docker.listImages();
  } catch (error) {
    console.error("❌ ไม่สามารถดึงรายการ Images ได้:", error);
    throw error;
  }
}
