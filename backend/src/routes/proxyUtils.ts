import Docker from 'dockerode';

const DOCKER_NETWORK = process.env.DOCKER_NETWORK || '';

const docker = DOCKER_NETWORK
  ? new Docker(
      process.platform === 'win32'
        ? { host: '127.0.0.1', port: 2375 }
        : { socketPath: '/var/run/docker.sock' }
    )
  : null;

// Cache: hostPort -> "internalIp:internalPort"
const cache = new Map<number, string>();

/**
 * แปลง host port เป็น container internal address บน Docker network
 * - ถ้าไม่มี DOCKER_NETWORK → ใช้ 127.0.0.1:hostPort (local dev)
 * - ถ้ามี DOCKER_NETWORK → หา container IP จาก Docker API แล้วเชื่อมตรง (server)
 */
export async function resolveUpstream(hostPort: number, path: string): Promise<string> {
  if (!DOCKER_NETWORK || !docker) {
    return `http://127.0.0.1:${hostPort}${path}`;
  }

  const cached = cache.get(hostPort);
  if (cached) return `http://${cached}${path}`;

  try {
    const containers = await docker.listContainers({
      filters: { network: [DOCKER_NETWORK] },
    });

    for (const c of containers) {
      const match = (c.Ports || []).find((p: any) => p.PublicPort === hostPort);
      if (match) {
        const networks = (c.NetworkSettings?.Networks || {}) as Record<string, any>;
        const ip = networks[DOCKER_NETWORK]?.IPAddress;
        if (ip) {
          const addr = `${ip}:${match.PrivatePort}`;
          cache.set(hostPort, addr);
          return `http://${addr}${path}`;
        }
      }
    }
  } catch (err) {
    console.error('[proxy] Container resolve failed:', err);
  }

  // Fallback
  return `http://host.docker.internal:${hostPort}${path}`;
}
