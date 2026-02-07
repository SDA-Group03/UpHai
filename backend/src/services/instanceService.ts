import { db } from "../db/client";
import { instances } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export interface CreateInstanceData {
  userId: string;
  engineId: string;
  modelId: string;
  containerName: string;
  containerId: string;
  port: number;
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
    return await db.select().from(instances)
      .where(eq(instances.userId, userId))
      .orderBy(desc(instances.createdAt));
  }

  async updateInstance(id: string, data: { status?: string; lastActivity?: number }) {
    const [result] = await db.update(instances)
      .set({
        ...data,
lastActivity: data.lastActivity ? new Date(data.lastActivity * 1000) : new Date(),      })
      .where(eq(instances.id, id))
      .returning();

    return result;
  }

  async deleteInstance(id: string) {
    await db.delete(instances).where(eq(instances.id, id));
  }
}

export const instanceService = new InstanceService();