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
  // กรณีรัน Local หรือไม่ได้ตั้งค่า Docker Network ให้ยิงเข้า localhost ตรงๆ
  if (!DOCKER_NETWORK || !docker) {
    return `http://127.0.0.1:${hostPort}${path}`;
  }

  // ถ้าเคยหาเจอแล้ว ให้ใช้ค่าจาก Cache (ลดภาระการเรียก Docker API)
  const cached = cache.get(hostPort);
  if (cached) return `http://${cached}${path}`;

  try {
    // กรองเอาเฉพาะ Container ที่อยู่ใน Network ที่เราสนใจ (ช่วยให้เร็วขึ้น)
    const containers = await docker.listContainers({
      filters: { network: [DOCKER_NETWORK] },
    });

    for (const c of containers) {
      // หา Container ที่เปิด Public Port ตรงกับที่เราต้องการ (hostPort)
      const match = (c.Ports || []).find((p: any) => p.PublicPort === hostPort);
      
      if (match) {
        const networks = (c.NetworkSettings?.Networks || {}) as Record<string, any>;
        
        // 1. พยายามหา IP จาก Network ที่กำหนดใน .env ก่อน (ถูกต้องที่สุด)
        let ip = networks[DOCKER_NETWORK]?.IPAddress;

        // 2. ถ้าหาไม่เจอ (เช่น อาจจะอยู่คนละ Subnet หรือชื่อไม่ตรง) ให้ลองหยิบ IP แรกที่มีมาใช้
        if (!ip) {
          const firstNet = Object.values(networks)[0];
          ip = (firstNet as any)?.IPAddress;
        }

        if (ip) {
          const addr = `${ip}:${match.PrivatePort}`;
          
          // Log เพื่อให้เห็นว่าระบบทำงานถูกต้อง (Debug)
          console.log(`🚀 [proxy] Successfully resolved port ${hostPort} to ${addr} (Network: ${DOCKER_NETWORK})`);
          
          cache.set(hostPort, addr);
          return `http://${addr}${path}`;
        }
      }
    }
  } catch (err) {
    console.error('❌ [proxy] Container resolve failed:', err);
  }

  // Fallback: ถ้าหาไม่เจอจริงๆ ให้ยิงไปที่ host.docker.internal (อาจจะช้ากว่าหรือต่อไม่ได้ในบาง setup)
  console.warn(`⚠️ [proxy] Could not resolve IP for port ${hostPort} in network "${DOCKER_NETWORK}". Using fallback.`);
  return `http://host.docker.internal:${hostPort}${path}`;
}