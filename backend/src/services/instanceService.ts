import { db } from "../db/client";
import { instances, models } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export interface CreateInstanceData {
  userId: string;
  engineId: string;
  modelId: string;
  containerName: string;
  containerId: string;
  port: number;
  allocatedMemoryMb?: number;
  allocatedCpuCores?: number;
  autoStopMinutes?: number | null;
}

export class InstanceService {
  async createInstance(data: CreateInstanceData) {
    const [result] = await db.insert(instances).values({
      id: data.containerId,
      userId: data.userId,
      engineId: data.engineId,
      modelId: data.modelId,
      containerName: data.containerName,
      port: data.port,
      status: "running",
      allocatedMemoryMb: data.allocatedMemoryMb,
      allocatedCpuCores: data.allocatedCpuCores,
      autoStopMinutes: data.autoStopMinutes,
      createdAt: new Date(), 
      lastActivity: new Date(),
    }).returning();

    return result;
  }

  async getInstanceById(id: string) {
    const [result] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
    return result || null;
  }

  async getUserInstances(userId: string) {
    const result = await db
      .select({
        id: instances.id,
        userId: instances.userId,
        engineId: instances.engineId,
        modelId: instances.modelId,
        modelName: models.name,
        modelCategory: models.category,
        containerName: instances.containerName,
        port: instances.port,
        status: instances.status,
        allocatedMemoryMb: instances.allocatedMemoryMb,
        allocatedCpuCores: instances.allocatedCpuCores,
        autoStopMinutes: instances.autoStopMinutes,
        createdAt: instances.createdAt,
        lastActivity: instances.lastActivity,
      })
      .from(instances)
      .leftJoin(models, eq(instances.modelId, models.id))
      .where(eq(instances.userId, userId))
      .orderBy(desc(instances.createdAt));

    return result;
  }

  async updateInstance(id: string, data: { status?: string; lastActivity?: number }) {
    const lastActivityDate =
      typeof data.lastActivity === "number"
        ? // Accept either unix seconds or epoch milliseconds
          new Date(data.lastActivity > 10_000_000_000 ? data.lastActivity : data.lastActivity * 1000)
        : new Date();

    const [result] = await db
      .update(instances)
      .set({
        ...data,
        lastActivity: lastActivityDate,
      })
      .where(eq(instances.id, id))
      .returning();

    return result;
  }

  async touchInstanceByPort(port: number) {
    await db
      .update(instances)
      .set({ lastActivity: new Date() })
      .where(eq(instances.port, port));
  }

  async deleteInstance(id: string) {
    await db.delete(instances).where(eq(instances.id, id));
  }
}

export const instanceService = new InstanceService();
