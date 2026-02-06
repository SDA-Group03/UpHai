import Docker from "dockerode";

const isWindows = process.platform === "win32";
const docker = new Docker(
  isWindows ? { host: "127.0.0.1", port: 2375 } : { socketPath: "/var/run/docker.sock" }
);

export interface ContainerStats {
  id: string;
  name: string;
  status: string;
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  memoryLimit: number; // MB
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

/**
 * Stop a container
 */
export async function stopContainer(containerId: string, timeout = 10): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop({ t: timeout });
    console.log(`✅ Container ${containerId} stopped`);
  } catch (error: any) {
    if (error.statusCode === 304) {
      console.log(`ℹ️  Container ${containerId} already stopped`);
    } else {
      throw error;
    }
  }
}

/**
 * Start a container
 */
export async function startContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.start();
    console.log(`✅ Container ${containerId} started`);
  } catch (error: any) {
    if (error.statusCode === 304) {
      console.log(`ℹ️  Container ${containerId} already running`);
    } else {
      throw error;
    }
  }
}

/**
 * Restart a container
 */
export async function restartContainer(containerId: string, timeout = 10): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.restart({ t: timeout });
    console.log(`✅ Container ${containerId} restarted`);
  } catch (error) {
    console.error(`Error restarting container ${containerId}:`, error);
    throw error;
  }
}

/**
 * Remove a container (stops first if running)
 */
export async function removeContainer(containerId: string, force = false): Promise<void> {
  try {
    const container = docker.getContainer(containerId);

    if (!force) {
      await container.stop({ t: 5 });
    }

    await container.remove({ force });
    console.log(`✅ Container ${containerId} removed`);
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log(`ℹ️  Container ${containerId} not found`);
    } else {
      throw error;
    }
  }
}

/**
 * Get container information
 */
export async function getContainerInfo(containerId: string): Promise<ContainerInfo | null> {
  try {
    const container = docker.getContainer(containerId);
    const data = await container.inspect();

    // Parse ports
    const ports: { container: number; host: number }[] = [];
    if (data.NetworkSettings.Ports) {
      for (const [containerPort, hostBindings] of Object.entries(data.NetworkSettings.Ports)) {
        if (hostBindings && Array.isArray(hostBindings)) {
          const portNum = parseInt(containerPort);
          hostBindings.forEach((binding: any) => {
            ports.push({
              container: portNum,
              host: parseInt(binding.HostPort),
            });
          });
        }
      }
    }

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
  } catch (error) {
    console.error(`Container ${containerId} not found`);
    return null;
  }
}

/**
 * Get container stats (CPU, Memory)
 */
export async function getContainerStats(containerId: string): Promise<ContainerStats | null> {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    const stats = await container.stats({ stream: false });

    // Calculate CPU usage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuUsage = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    // Calculate memory usage
    const memoryUsage = stats.memory_stats.usage / (1024 * 1024); // Convert to MB
    const memoryLimit = stats.memory_stats.limit / (1024 * 1024);

    // Calculate uptime
    const startTime = new Date(info.State.StartedAt).getTime();
    const uptime = formatUptime(Date.now() - startTime);

    return {
      id: containerId.substring(0, 12),
      name: info.Name.replace(/^\//, ""),
      status: info.State.Status,
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryUsage: Math.round(memoryUsage),
      memoryLimit: Math.round(memoryLimit),
      uptime,
    };
  } catch (error) {
    console.error(`Error getting stats for ${containerId}:`, error);
    return null;
  }
}

/**
 * List all containers with optional filter
 */
export async function listContainers(all = true, filter?: string): Promise<ContainerInfo[]> {
  try {
    const containers = await docker.listContainers({ all });

    let filtered = containers;
    if (filter) {
      filtered = containers.filter(
        (c) =>
          c.Image.includes(filter) ||
          c.Names.some((name) => name.includes(filter)) ||
          c.Id.includes(filter)
      );
    }

    const results: ContainerInfo[] = [];
    for (const container of filtered) {
      // Parse ports
      const ports: { container: number; host: number }[] = [];
      if (container.Ports) {
        container.Ports.forEach((port: any) => {
          if (port.PublicPort) {
            ports.push({
              container: port.PrivatePort,
              host: port.PublicPort,
            });
          }
        });
      }

      results.push({
        id: container.Id.substring(0, 12),
        name: container.Names[0]?.replace(/^\//, "") || "Unnamed",
        image: container.Image,
        status: container.Status,
        state: container.State,
        ports,
        createdAt: new Date(container.Created * 1000).toISOString(),
        startedAt: "", // Not available in list
      });
    }

    return results;
  } catch (error) {
    console.error("Error listing containers:", error);
    return [];
  }
}

/**
 * Auto-cleanup idle containers
 */
export async function cleanupIdleContainers(maxIdleMinutes = 30): Promise<string[]> {
  console.log(`🧹 Cleaning up containers idle for more than ${maxIdleMinutes} minutes...`);

  const containers = await docker.listContainers({ all: false }); // Only running
  const removed: string[] = [];

  for (const container of containers) {
    const info = await docker.getContainer(container.Id).inspect();

    // Check last activity (using StartedAt as proxy)
    const startedAt = new Date(info.State.StartedAt).getTime();
    const idleTime = Date.now() - startedAt;
    const idleMinutes = idleTime / (1000 * 60);

    // Only cleanup our managed containers (by label or image pattern)
    const isManagedContainer =
      info.Config.Image.includes("ollama") ||
      info.Config.Image.includes("whisper") ||
      info.Config.Image.includes("stable-diffusion");

    if (isManagedContainer && idleMinutes > maxIdleMinutes) {
      try {
        await removeContainer(container.Id, true);
        removed.push(container.Id.substring(0, 12));
        console.log(`✅ Removed idle container: ${container.Id.substring(0, 12)}`);
      } catch (error) {
        console.error(`Error removing container ${container.Id}:`, error);
      }
    }
  }

  console.log(`✅ Cleanup complete. Removed ${removed.length} containers.`);
  return removed;
}

/**
 * Format uptime duration
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}