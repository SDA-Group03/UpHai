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

  // ดึง models ตาม category
  async getModelsByCategory(category: string) {
    try {
      return await db
        .select()
        .from(models)
        .where(eq(models.category, category));
    } catch (error) {
      console.error(`Error fetching models for category ${category}:`, error);
      throw error;
    }
  }

  // ดึง models ตาม series
  async getModelsBySeries(series: string) {
    try {
      return await db
        .select()
        .from(models)
        .where(eq(models.series, series));
    } catch (error) {
      console.error(`Error fetching models for series ${series}:`, error);
      throw error;
    }
  }

  // ดึง models ตาม performance tier
  async getModelsByPerformanceTier(tier: string) {
    try {
      return await db
        .select()
        .from(models)
        .where(eq(models.performanceTier, tier));
    } catch (error) {
      console.error(`Error fetching models for tier ${tier}:`, error);
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

  // ดึง models พร้อม engine info (JOIN)
  async getModelsWithEngines() {
    try {
      return await db
        .select({
          model: models,
          engine: engines,
        })
        .from(models)
        .leftJoin(engines, eq(models.engine, engines.id));
    } catch (error) {
      console.error("Error fetching models with engines:", error);
      throw error;
    }
  }

  // ดึง model พร้อม engine info ตาม ID
  async getModelWithEngineById(id: string) {
    try {
      const result = await db
        .select({
          model: models,
          engine: engines,
        })
        .from(models)
        .leftJoin(engines, eq(models.engine, engines.id))
        .where(eq(models.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`Error fetching model with engine ${id}:`, error);
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

  // ดึง unique categories
  async getCategories() {
    try {
      const result = await db
        .selectDistinct({ category: models.category })
        .from(models);
      
      return result.map(r => r.category);
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  // ดึง unique series (แก้ไขส่วนนี้)
  async getSeries() {
    try {
      const result = await db
        .selectDistinct({ series: models.series })
        .from(models)
        .where(isNotNull(models.series)); // ใช้ isNotNull แทน eq(models.series, null)

      return result.map(r => r.series).filter(Boolean);
    } catch (error) {
      console.error("Error fetching series:", error);
      throw error;
    }
  }

  // ดึง unique performance tiers
  async getPerformanceTiers() {
    try {
      const result = await db
        .selectDistinct({ tier: models.performanceTier })
        .from(models)
        .where(isNotNull(models.performanceTier));
      
      return result.map(r => r.tier).filter(Boolean);
    } catch (error) {
      console.error("Error fetching performance tiers:", error);
      throw error;
    }
  }

  // ดึง models ตามขนาด (เล็กไปใหญ่)
  async getModelsBySize(ascending: boolean = true) {
    try {
      return await db
        .select()
        .from(models)
        .orderBy(ascending ? asc(models.sizeMb) : desc(models.sizeMb));
    } catch (error) {
      console.error("Error fetching models by size:", error);
      throw error;
    }
  }

  // ดึง models ที่มีขนาดเล็กกว่าที่กำหนด
  async getSmallModels(maxSizeMb: number = 2000) {
    try {
      return await db
        .select()
        .from(models)
        .where(lte(models.sizeMb, maxSizeMb));
    } catch (error) {
      console.error(`Error fetching small models (< ${maxSizeMb}MB):`, error);
      throw error;
    }
  }

  // นับจำนวน models ตาม category
  async countModelsByCategory() {
    try {
      return await db
        .select({
          category: models.category,
          count: sql<number>`count(*)`.as('count')
        })
        .from(models)
        .groupBy(models.category);
    } catch (error) {
      console.error("Error counting models by category:", error);
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