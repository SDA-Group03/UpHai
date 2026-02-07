import { db } from "../db/client";
import { models, engines } from "../db/schema";
import { eq, like, and, or, inArray, isNull, isNotNull, gte, lte, asc, desc, sql } from "drizzle-orm";

export class ModelService {
  // ดึง models ทั้งหมด
  async getAllModels() {
    try {
      return await db.select().from(models);
    } catch (error) {
      console.error("Error fetching all models:", error);
      throw error;
    }
  }

  // ดึง model ตาม ID
  async getModelById(id: string) {
    try {
      const result = await db
        .select()
        .from(models)
        .where(eq(models.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`Error fetching model ${id}:`, error);
      throw error;
    }
  }

  // ดึง models ตาม engine
  async getModelsByEngine(engineId: string) {
    try {
      return await db
        .select()
        .from(models)
        .where(eq(models.engine, engineId));
    } catch (error) {
      console.error(`Error fetching models for engine ${engineId}:`, error);
      throw error;
    }
  }


  // ค้นหา models (search by name or display_name)
  async searchModels(searchTerm: string) {
    try {
      const searchPattern = `%${searchTerm}%`;
      return await db
        .select()
        .from(models)
        .where(
          or(
            like(models.name, searchPattern),
            like(models.displayName, searchPattern),
            like(models.description, searchPattern)
          )
        );
    } catch (error) {
      console.error(`Error searching models with term "${searchTerm}":`, error);
      throw error;
    }
  }


  // Filter models ด้วยหลายเงื่อนไข
  async filterModels(filters: {
    category?: string;
    series?: string;
    performanceTier?: string;
    engine?: string;
    minSize?: number;
    maxSize?: number;
  }) {
    try {
      const conditions = [];

      if (filters.category) {
        conditions.push(eq(models.category, filters.category));
      }

      if (filters.series) {
        conditions.push(eq(models.series, filters.series));
      }

      if (filters.performanceTier) {
        conditions.push(eq(models.performanceTier, filters.performanceTier));
      }

      if (filters.engine) {
        conditions.push(eq(models.engine, filters.engine));
      }

      if (filters.minSize !== undefined) {
        conditions.push(gte(models.sizeMb, filters.minSize));
      }

      if (filters.maxSize !== undefined) {
        conditions.push(lte(models.sizeMb, filters.maxSize));
      }

      if (conditions.length === 0) {
        return await this.getAllModels();
      }

      return await db
        .select()
        .from(models)
        .where(and(...conditions));
    } catch (error) {
      console.error("Error filtering models:", error);
      throw error;
    }
  }



  // ดึง models หลายตัวตาม IDs
  async getModelsByIds(ids: string[]) {
    try {
      return await db
        .select()
        .from(models)
        .where(inArray(models.id, ids));
    } catch (error) {
      console.error("Error fetching models by IDs:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const modelService = new ModelService();