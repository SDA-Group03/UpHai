import { Elysia, t } from "elysia";
import { createContainerByEngine } from "../services/engineRegistry";
import {
  stopContainer,
  startContainer,
  restartContainer,
  removeContainer,
  getContainerInfo,
  getContainerStats,
  listContainers,
  cleanupIdleContainers,
} from "../services/containerService";
import { getEngineVolumesSummary } from "../services/volumeService";

export const dockerRoutes = new Elysia({ prefix: "/docker" })
  // ===================================================
  // CREATE INSTANCE
  // ===================================================
  .post(
    "/instances",
    async ({ body, set }) => {
      try {
        const result = await createContainerByEngine(body.modelName, body.engine);

        set.status = 201;
        return {
          success: true,
          data: result,
          message: `${body.engine}/${body.modelName} deployed successfully`,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create instance",
        };
      }
    },
    {
      body: t.Object({
        engine: t.String({
          description: "Engine type: ollama, whisper, stable-diffusion",
          examples: ["ollama", "whisper", "stable-diffusion"],
        }),
        modelName: t.String({
          description: "Model name to deploy",
          examples: ["qwen:0.5b", "tiny", "sdxl-turbo"],
        }),
      }),
    }
  )

  // ===================================================
  // LIST INSTANCES
  // ===================================================
  .get(
    "/instances",
    async ({ query }) => {
      try {
        const containers = await listContainers(true, query.filter);

        return {
          success: true,
          data: containers,
          count: containers.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to list instances",
        };
      }
    },
    {
      query: t.Object({
        filter: t.Optional(t.String({ description: "Filter by image or name" })),
      }),
    }
  )

  // ===================================================
  // GET INSTANCE DETAILS
  // ===================================================
  .get("/instances/:id", async ({ params, set }) => {
    try {
      const info = await getContainerInfo(params.id);

      if (!info) {
        set.status = 404;
        return {
          success: false,
          error: `Container ${params.id} not found`,
        };
      }

      return {
        success: true,
        data: info,
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get instance info",
      };
    }
  })

  // ===================================================
  // GET INSTANCE STATS
  // ===================================================
  .get("/instances/:id/stats", async ({ params, set }) => {
    try {
      const stats = await getContainerStats(params.id);

      if (!stats) {
        set.status = 404;
        return {
          success: false,
          error: `Container ${params.id} not found`,
        };
      }

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get stats",
      };
    }
  })

  // ===================================================
  // STOP INSTANCE
  // ===================================================
  .post("/instances/:id/stop", async ({ params, set }) => {
    try {
      await stopContainer(params.id);

      return {
        success: true,
        message: `Container ${params.id} stopped`,
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to stop container",
      };
    }
  })

  // ===================================================
  // START INSTANCE
  // ===================================================
  .post("/instances/:id/start", async ({ params, set }) => {
    try {
      await startContainer(params.id);

      return {
        success: true,
        message: `Container ${params.id} started`,
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start container",
      };
    }
  })

  // ===================================================
  // RESTART INSTANCE
  // ===================================================
  .post("/instances/:id/restart", async ({ params, set }) => {
    try {
      await restartContainer(params.id);

      return {
        success: true,
        message: `Container ${params.id} restarted`,
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to restart container",
      };
    }
  })

  // ===================================================
  // DELETE INSTANCE
  // ===================================================
  .delete("/instances/:id", async ({ params, query, set }) => {
    try {
      await removeContainer(params.id, query.force === "true");

      return {
        success: true,
        message: `Container ${params.id} removed`,
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove container",
      };
    }
  })

  // ===================================================
  // CLEANUP IDLE INSTANCES
  // ===================================================
  .post(
    "/instances/cleanup",
    async ({ body }) => {
      try {
        const removed = await cleanupIdleContainers(body.maxIdleMinutes);

        return {
          success: true,
          data: {
            removed,
            count: removed.length,
          },
          message: `Cleaned up ${removed.length} idle containers`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Cleanup failed",
        };
      }
    },
    {
      body: t.Object({
        maxIdleMinutes: t.Number({
          default: 30,
          description: "Remove containers idle for more than this many minutes",
        }),
      }),
    }
  )

  // ===================================================
  // GET VOLUMES SUMMARY
  // ===================================================
  .get("/volumes", async () => {
    try {
      const summary = await getEngineVolumesSummary();

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get volumes info",
      };
    }
  });