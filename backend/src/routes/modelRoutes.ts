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


 
 
  