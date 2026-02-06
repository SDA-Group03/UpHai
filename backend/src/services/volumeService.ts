import Docker from "dockerode";

const isWindows = process.platform === "win32";
const docker = new Docker(
  isWindows ? { host: "127.0.0.1", port: 2375 } : { socketPath: "/var/run/docker.sock" }
);

export interface VolumeInfo {
  name: string;
  driver: string;
  mountpoint: string;
  createdAt: string;
  size?: string;
}

/**
 * Ensure volume exists, create if not
 */
export async function ensureVolume(volumeName: string): Promise<void> {
  try {
    await docker.getVolume(volumeName).inspect();
    console.log(`✅ Volume '${volumeName}' exists`);
  } catch (error) {
    console.log(`📦 Creating volume '${volumeName}'...`);
    await docker.createVolume({ Name: volumeName });
    console.log(`✅ Volume '${volumeName}' created`);
  }
}

/**
 * Get volume information
 */
export async function getVolumeInfo(volumeName: string): Promise<VolumeInfo | null> {
  try {
    const volume = docker.getVolume(volumeName);
    const info = await volume.inspect();

    return {
      name: info.Name,
      driver: info.Driver,
      mountpoint: info.Mountpoint,
      createdAt: "",
    };
  } catch (error) {
    console.error(`Volume '${volumeName}' not found`);
    return null;
  }
}

/**
 * List all volumes with optional filter
 */
export async function listVolumes(filter?: string): Promise<VolumeInfo[]> {
  try {
    const result = await docker.listVolumes();
    let volumes = result.Volumes || [];

    if (filter) {
      volumes = volumes.filter((v) => v.Name.includes(filter));
    }

    return volumes.map((v) => ({
      name: v.Name,
      driver: v.Driver,
      mountpoint: v.Mountpoint,
      createdAt: "",
    }));
  } catch (error) {
    console.error("Error listing volumes:", error);
    return [];
  }
}

/**
 * Get volume size (requires running a container to check)
 */
export async function getVolumeSize(volumeName: string): Promise<string> {
  try {
    // Run a temporary container to check disk usage
    const container = await docker.createContainer({
      Image: "busybox",
      Cmd: ["du", "-sh", "/data"],
      HostConfig: {
        Binds: [`${volumeName}:/data:ro`],
        AutoRemove: true,
      },
    });

    await container.start();
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
    });

    // Parse output
    let output = "";
    stream.on("data", (chunk) => {
      output += chunk.toString();
    });

    await container.wait();

    // Extract size from du output
    const match = output.match(/^(\S+)/);
    return  "Unknown";
  } catch (error) {
    console.error("Error getting volume size:", error);
    return "Error";
  }
}

/**
 * Delete volume (dangerous!)
 */
export async function deleteVolume(volumeName: string, force = false): Promise<void> {
  try {
    const volume = docker.getVolume(volumeName);
    await volume.remove({ force });
    console.log(`✅ Volume '${volumeName}' deleted`);
  } catch (error) {
    console.error(`Error deleting volume '${volumeName}':`, error);
    throw error;
  }
}

/**
 * Initialize all engine volumes
 */
export async function initializeEngineVolumes(): Promise<void> {
  console.log("📦 Initializing engine volumes...");

  const volumes = [
    process.env.OLLAMA_VOLUME || "ollama-models",
    process.env.WHISPER_VOLUME || "whisper-models",
    process.env.SD_VOLUME || "sd-models",
  ];

  for (const volumeName of volumes) {
    await ensureVolume(volumeName);
  }

  console.log("✅ All volumes ready");
}

/**
 * Get summary of all engine volumes
 */
export async function getEngineVolumesSummary(): Promise<
  { name: string; info: VolumeInfo | null; size: string }[]
> {
  const volumes = [
    process.env.OLLAMA_VOLUME || "ollama-models",
    process.env.WHISPER_VOLUME || "whisper-models",
    process.env.SD_VOLUME || "sd-models",
  ];

  const summary = [];
  for (const volumeName of volumes) {
    const info = await getVolumeInfo(volumeName);
    const size = info ? await getVolumeSize(volumeName) : "N/A";
    summary.push({ name: volumeName, info, size });
  }

  return summary;
}