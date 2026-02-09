import { Elysia, t } from "elysia";
import { createContainerByEngine } from "../services/engineRegistry";
import * as container from "../services/containerService";
import { instanceService } from "../services/instanceService";
import { getEngineVolumesSummary } from "../services/volumeService";

export const dockerRoutes = new Elysia({ prefix: "/api/docker" })
  .post(
    "/instances",
    async ({ body, set }) => {
      if (!body.userId) {
        set.status = 400;
        return { success: false, error: "userId is required" };
      }
      const result = await createContainerByEngine(body);
      set.status = 201;
      return {
        success: true,
        data: result,
        message: `${body.engine}/${body.modelName} deployed`,
      };
    },
    {
      body: t.Object({
        userId: t.String(),
        engine: t.String(),
        modelName: t.String(),
      }),
    },
  )
  .get("/instances/user/:userId", async ({ params }) => {
    const instances = await instanceService.getUserInstances(params.userId);
    const enhanced = await Promise.all(
      instances.map(async (inst) => {
        const [info, stats] = await Promise.all([
          container.getContainerInfo(inst.id),
          container.getContainerStats(inst.id),
        ]);
        return {
          ...inst,
          containerStatus: info?.status || "unknown",
          startedAt: info?.startedAt || null,
          uptime: stats?.uptime || "0s",
          cpuUsage: stats?.cpuUsage || 0,
          memoryUsage: stats?.memoryUsage || 0,
          lastActiveAt: inst.lastActivity ? new Date(inst.lastActivity).toISOString() : null,
        };
      }),
    );
    return { success: true, data: enhanced, count: enhanced.length };
  })
  .get(
    "/instances",
    async ({ query }) => {
      const data = await container.listContainers(true, query.filter);
      return { success: true, data, count: data.length };
    },
    {
      query: t.Object({ filter: t.Optional(t.String()) }),
    },
  )
  .get("/instances/:id", async ({ params, set }) => {
    const [dbInstance, containerInfo] = await Promise.all([
      instanceService.getInstanceById(params.id),
      container.getContainerInfo(params.id),
    ]);
    if (!containerInfo) {
      set.status = 404;
      return { success: false, error: `Container ${params.id} not found` };
    }

    await instanceService.updateInstance(params.id, {
      lastActivity: Date.now(),
    });

    return { success: true, data: { ...(dbInstance ?? {}), container: containerInfo } };
  })
  .get("/instances/:id/stats", async ({ params, set }) => {
    const stats = await container.getContainerStats(params.id);
    if (!stats) {
      set.status = 404;
      return { success: false, error: `Container ${params.id} not found` };
    }
    return { success: true, data: stats };
  })
  .post("/instances/:id/stop", async ({ params }) => {
    await container.stopContainer(params.id);
    await instanceService.updateInstance(params.id, {
      status: "stopped",
      lastActivity: Date.now(),
    });
    return { success: true, message: `Container ${params.id} stopped` };
  })
  .post("/instances/:id/start", async ({ params }) => {
    await container.startContainer(params.id);
    await instanceService.updateInstance(params.id, {
      status: "running",
      lastActivity: Date.now(),
    });
    return { success: true, message: `Container ${params.id} started` };
  })
  .post("/instances/:id/terminate", async ({ params, set }) => {
    try {
      await container.removeContainer(params.id, true);
      await instanceService.deleteInstance(params.id);
      return { success: true, message: `Container ${params.id} terminated` };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to terminate container",
      };
    }
  })
  .post("/instances/:id/restart", async ({ params }) => {
    await container.restartContainer(params.id);
    await instanceService.updateInstance(params.id, {
      status: "running",
      lastActivity: Date.now(),
    });
    return { success: true, message: `Container ${params.id} restarted` };
  })
  .delete("/instances/:id", async ({ params, query }) => {
    await container.removeContainer(params.id, query.force === "true");
    await instanceService.deleteInstance(params.id);
    return { success: true, message: `Container ${params.id} removed` };
  })
  .get("/volumes", async () => {
    const data = await getEngineVolumesSummary();
    return { success: true, data };
  });
