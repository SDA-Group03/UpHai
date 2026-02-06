import { Elysia, t } from "elysia";
import { modelService } from "../services/modelService";

export const modelRoutes = new Elysia({ prefix: "/api" })
  // ============= MODEL ROUTES =============
  
  // GET /api/models - ดึง models ทั้งหมด
  .get("/models", async () => {
    try {
      const models = await modelService.getAllModels();
      return {
        success: true,
        data: models,
        count: models.length,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch models"
      );
    }
  })

  // GET /api/models/:id - ดึง model ตาม ID
  .get(
    "/models/:id",
    async ({ params, set }) => {
      try {
        const model = await modelService.getModelById(params.id);

        if (!model) {
          set.status = 404;
          return {
            success: false,
            error: "Model not found",
          };
        }

        return {
          success: true,
          data: model,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch model"
        );
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // GET /api/models/engine/:engineId - ดึง models ตาม engine
  .get(
    "/models/engine/:engineId",
    async ({ params }) => {
      try {
        const models = await modelService.getModelsByEngine(params.engineId);

        return {
          success: true,
          data: models,
          count: models.length,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch models by engine"
        );
      }
    },
    {
      params: t.Object({
        engineId: t.String(),
      }),
    }
  )

  // GET /api/models/category/:category - ดึง models ตาม category
  .get(
    "/models/category/:category",
    async ({ params }) => {
      try {
        const models = await modelService.getModelsByCategory(params.category);

        return {
          success: true,
          data: models,
          count: models.length,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch models by category"
        );
      }
    },
    {
      params: t.Object({
        category: t.String(),
      }),
    }
  )

  // GET /api/models/series/:series - ดึง models ตาม series
  .get(
    "/models/series/:series",
    async ({ params }) => {
      try {
        const models = await modelService.getModelsBySeries(params.series);

        return {
          success: true,
          data: models,
          count: models.length,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch models by series"
        );
      }
    },
    {
      params: t.Object({
        series: t.String(),
      }),
    }
  )

  // GET /api/models/tier/:tier - ดึง models ตาม performance tier
  .get(
    "/models/tier/:tier",
    async ({ params }) => {
      try {
        const models = await modelService.getModelsByPerformanceTier(
          params.tier
        );

        return {
          success: true,
          data: models,
          count: models.length,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch models by tier"
        );
      }
    },
    {
      params: t.Object({
        tier: t.String(),
      }),
    }
  )

  // GET /api/models/search?q=llama - ค้นหา models
  .get(
    "/models/search",
    async ({ query, set }) => {
      try {
        if (!query.q) {
          set.status = 400;
          return {
            success: false,
            error: "Search query is required",
          };
        }

        const models = await modelService.searchModels(query.q);

        return {
          success: true,
          data: models,
          count: models.length,
          query: query.q,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to search models"
        );
      }
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
    }
  )

  // GET /api/models/with-engines - ดึง models พร้อม engine info
  .get("/models/with-engines", async () => {
    try {
      const models = await modelService.getModelsWithEngines();

      return {
        success: true,
        data: models,
        count: models.length,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch models with engines"
      );
    }
  })

  // POST /api/models/filter - Filter models ด้วยหลายเงื่อนไข
  .post(
    "/models/filter",
    async ({ body }) => {
      try {
        const models = await modelService.filterModels(body);

        return {
          success: true,
          data: models,
          count: models.length,
          filters: body,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to filter models"
        );
      }
    },
    {
      body: t.Object({
        category: t.Optional(t.String()),
        series: t.Optional(t.String()),
        performanceTier: t.Optional(t.String()),
        engine: t.Optional(t.String()),
        minSize: t.Optional(t.Number()),
        maxSize: t.Optional(t.Number()),
      }),
    }
  )

  // GET /api/models/small?maxSize=2000 - ดึง models ขนาดเล็ก
  .get(
    "/models/small",
    async ({ query }) => {
      try {
        const maxSize = query.maxSize ? parseInt(query.maxSize) : 2000;
        const models = await modelService.getSmallModels(maxSize);

        return {
          success: true,
          data: models,
          count: models.length,
          maxSize,
        };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch small models"
        );
      }
    },
    {
      query: t.Object({
        maxSize: t.Optional(t.String()),
      }),
    }
  )

  // ============= METADATA ROUTES =============

  // GET /api/metadata/categories - ดึง categories ทั้งหมด
  .get("/metadata/categories", async () => {
    try {
      const categories = await modelService.getCategories();

      return {
        success: true,
        data: categories,
        count: categories.length,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch categories"
      );
    }
  })

  // GET /api/metadata/series - ดึง series ทั้งหมด
  .get("/metadata/series", async () => {
    try {
      const series = await modelService.getSeries();

      return {
        success: true,
        data: series,
        count: series.length,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch series"
      );
    }
  })

  // GET /api/metadata/tiers - ดึง performance tiers ทั้งหมด
  .get("/metadata/tiers", async () => {
    try {
      const tiers = await modelService.getPerformanceTiers();

      return {
        success: true,
        data: tiers,
        count: tiers.length,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch performance tiers"
      );
    }
  })

  // GET /api/metadata/stats - ดึงสถิติ models
  .get("/metadata/stats", async () => {
    try {
      const countByCategory = await modelService.countModelsByCategory();

      return {
        success: true,
        data: {
          byCategory: countByCategory,
        },
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch stats"
      );
    }
  });