import Docker from "dockerode";

const docker = new Docker(
  process.platform === "win32" ? { host: "127.0.0.1", port: 2375 } : { socketPath: "/var/run/docker.sock" },
);

export interface ContainerStats {
  id: string;
  name: string;
  status: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryLimit: number;
  uptime: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: { container: number; host: number }[];
  createdAt: string;
  startedAt: string;
}

export const stopContainer = async (id: string) => {
  await docker
    .getContainer(id)
    .stop({ t: 10 })
    .catch(() => {});
};

export const startContainer = async (id: string) => {
  await docker
    .getContainer(id)
    .start()
    .catch(() => {});
};

export const restartContainer = async (id: string) => {
  await docker.getContainer(id).restart({ t: 10 });
};

export const removeContainer = async (id: string, force = false) => {
  const container = docker.getContainer(id);
  if (!force) await container.stop({ t: 5 }).catch(() => {});
  await container.remove({ force });
};

export const getContainerInfo = async (id: string): Promise<ContainerInfo | null> => {
  try {
    const data = await docker.getContainer(id).inspect();
    const ports = Object.entries(data.NetworkSettings.Ports || {}).flatMap(([port, bindings]: any) =>
      (bindings || []).map((b: any) => ({
        container: parseInt(port),
        host: parseInt(b.HostPort),
      })),
    );

    return {
      id: data.Id.substring(0, 12),
      name: data.Name.replace(/^\//, ""),
      image: data.Config.Image,
      status: data.State.Status,
      state: data.State.Running ? "running" : "stopped",
      ports,
      createdAt: data.Created,
      startedAt: data.State.StartedAt,
    };
  } catch {
    return null;
  }
};

export const getContainerStats = async (id: string): Promise<ContainerStats | null> => {
  try {
    const container = docker.getContainer(id);
    const [info, stats] = await Promise.all([container.inspect(), container.stats({ stream: false })]);

    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuUsage = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    return {
      id: id.substring(0, 12),
      name: info.Name.replace(/^\//, ""),
      status: info.State.Status,
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryUsage: Math.round(stats.memory_stats.usage / (1024 * 1024)),
      memoryLimit: Math.round(stats.memory_stats.limit / (1024 * 1024)),
      uptime: formatUptime(Date.now() - new Date(info.State.StartedAt).getTime()),
    };
  } catch {
    return null;
  }
};

export const listContainers = async (all = true, filter?: string): Promise<ContainerInfo[]> => {
  const containers = await docker.listContainers({ all });
  const filtered = filter
    ? containers.filter(
        (c) => c.Image.includes(filter) || c.Names.some((n) => n.includes(filter)) || c.Id.includes(filter),
      )
    : containers;

  return filtered.map((c) => ({
    id: c.Id.substring(0, 12),
    name: c.Names[0]?.replace(/^\//, "") || "Unnamed",
    image: c.Image,
    status: c.Status,
    state: c.State,
    ports: (c.Ports || [])
      .filter((p: any) => p.PublicPort)
      .map((p: any) => ({ container: p.PrivatePort, host: p.PublicPort })),
    createdAt: new Date(c.Created * 1000).toISOString(),
    startedAt: "",
  }));
};

export const cleanupIdleContainers = async (maxIdleMinutes = 30): Promise<string[]> => {
  const containers = await docker.listContainers({ all: false });
  const removed: string[] = [];

  for (const c of containers) {
    const info = await docker.getContainer(c.Id).inspect();
    const idleMinutes = (Date.now() - new Date(info.State.StartedAt).getTime()) / 60000;
    const isManaged = ["ollama", "whisper", "stable-diffusion"].some((name) => info.Config.Image.includes(name));

    if (isManaged && idleMinutes > maxIdleMinutes) {
      await removeContainer(c.Id, true).catch(() => {});
      removed.push(c.Id.substring(0, 12));
    }
  }

  return removed;
};

const formatUptime = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
};
