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
    const result = await db
      .select({
        id: instances.id,
        userId: instances.userId,
        engineId: instances.engineId,
        modelId: instances.modelId,
        modelName: models.name, // <-- get the model name
        containerName: instances.containerName,
        port: instances.port,
        status: instances.status,
        createdAt: instances.createdAt,
        lastActivity: instances.lastActivity,
      })
      .from(instances)
      .leftJoin(models, eq(instances.modelId, models.id)) // join models table
      .where(eq(instances.userId, userId))
      .orderBy(desc(instances.createdAt));

    return result;
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