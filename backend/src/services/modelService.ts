import { db } from "../db/client";
import { models } from "../db/schema";
import { eq, like, and, or, inArray, gte, lte } from "drizzle-orm";

export class ModelService {
  async getAllModels() {
    return await db.select().from(models);
  }

  async getModelById(id: string) {
    const [result] = await db.select().from(models).where(eq(models.id, id)).limit(1);
    return result || null;
  }

  async getModelsByEngine(engineId: string) {
    return await db.select().from(models).where(eq(models.engine, engineId));
  }

  async searchModels(term: string) {
    const pattern = `%${term}%`;
    return await db.select().from(models).where(
      or(
        like(models.name, pattern),
        like(models.displayName, pattern),
        like(models.description, pattern)
      )
    );
  }

  async filterModels(filters: {
    category?: string;
    series?: string;
    performanceTier?: string;
    engine?: string;
    minSize?: number;
    maxSize?: number;
  }) {
const conditions = [
    filters.category ? eq(models.category, filters.category) : undefined,
    filters.series ? eq(models.series, filters.series) : undefined,
    filters.performanceTier ? eq(models.performanceTier, filters.performanceTier) : undefined,
    filters.engine ? eq(models.engine, filters.engine) : undefined,
    filters.minSize !== undefined ? gte(models.sizeMb, filters.minSize) : undefined,
    filters.maxSize !== undefined ? lte(models.sizeMb, filters.maxSize) : undefined,
  ];

   return await db
    .select()
    .from(models)
    .where(and(...conditions));
  }

  async getModelsByIds(ids: string[]) {
    return await db.select().from(models).where(inArray(models.id, ids));
  }
}

export const modelService = new ModelService();