import { Elysia, t } from "elysia";
import { modelService } from "../services/modelService";

export const modelRoutes = new Elysia({ prefix: "/api" })
  .get("/models", async () => {
    const data = await modelService.getAllModels();
    return { success: true, data, count: data.length };
  })

  .get("/models/:id", async ({ params, set }) => {
    const data = await modelService.getModelById(params.id);
    if (!data) {
      set.status = 404;
      return { success: false, error: "Model not found" };
    }
    return { success: true, data };
  })

  .get("/models/engine/:engineId", async ({ params }) => {
    const data = await modelService.getModelsByEngine(params.engineId);
    return { success: true, data, count: data.length };
  })

  .get("/models/search", async ({ query, set }) => {
    if (!query.q) {
      set.status = 400;
      return { success: false, error: "Search query is required" };
    }
    const data = await modelService.searchModels(query.q);
    return { success: true, data, count: data.length, query: query.q };
  }, {
    query: t.Object({ q: t.Optional(t.String()) }),
  })

  .post("/models/filter", async ({ body }) => {
    const data = await modelService.filterModels(body);
    return { success: true, data, count: data.length, filters: body };
  }, {
    body: t.Object({
      category: t.Optional(t.String()),
      series: t.Optional(t.String()),
      performanceTier: t.Optional(t.String()),
      engine: t.Optional(t.String()),
      minSize: t.Optional(t.Number()),
      maxSize: t.Optional(t.Number()),
    }),
  });