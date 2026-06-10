import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CacheListResponse } from "@ytune/types";
import { listCache, removeFromCache } from "../services/cache.js";

const params = z.object({ videoId: z.string().min(1) });

export async function cacheRoutes(app: FastifyInstance): Promise<void> {
  app.get("/cache", async (_request, reply) => {
    const { entries, totalBytes } = await listCache();
    const body: CacheListResponse = { entries, totalBytes };
    return reply.send(body);
  });

  app.delete("/cache/:videoId", async (request, reply) => {
    const parsed = params.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "videoId inválido",
      });
    }

    const removed = await removeFromCache(parsed.data.videoId);
    return reply.send({ videoId: parsed.data.videoId, removed });
  });
}
