import Docker from "dockerode";

const docker = new Docker(
  process.platform === "win32" 
    ? { host: "127.0.0.1", port: 2375 } 
    : { socketPath: "/var/run/docker.sock" }
);

export interface VolumeInfo {
  name: string;
  driver: string;
  mountpoint: string;
  createdAt: string;
  size?: string;
}

export const ensureVolume = async (name: string) => {
  try {
    await docker.getVolume(name).inspect();
  } catch {
    await docker.createVolume({ Name: name });
  }
};

export const getVolumeInfo = async (name: string): Promise<VolumeInfo | null> => {
  try {
    const info = await docker.getVolume(name).inspect();
    return {
      name: info.Name,
      driver: info.Driver,
      mountpoint: info.Mountpoint,
      createdAt: "",
    };
  } catch {
    return null;
  }
};

export const listVolumes = async (filter?: string): Promise<VolumeInfo[]> => {
  const result = await docker.listVolumes();
  let volumes = result.Volumes || [];

  if (filter) {
    volumes = volumes.filter(v => v.Name.includes(filter));
  }

  return volumes.map(v => ({
    name: v.Name,
    driver: v.Driver,
    mountpoint: v.Mountpoint,
    createdAt: "",
  }));
};

export const deleteVolume = async (name: string, force = false) => {
  await docker.getVolume(name).remove({ force });
};

export const initializeEngineVolumes = async () => {
  const volumes = [
    process.env.OLLAMA_VOLUME || "ollama-models",
    process.env.WHISPER_VOLUME || "whisper-models",
    process.env.SD_VOLUME || "sd-models",
  ];

  await Promise.all(volumes.map(ensureVolume));
};

export const getEngineVolumesSummary = async () => {
  const volumes = [
    process.env.OLLAMA_VOLUME || "ollama-models",
    process.env.WHISPER_VOLUME || "whisper-models",
    process.env.SD_VOLUME || "sd-models",
  ];

  return await Promise.all(
    volumes.map(async name => ({
      name,
      info: await getVolumeInfo(name),
      size: "Unknown",
    }))
  );
};