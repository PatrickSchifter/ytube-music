import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CacheEntry, CacheListResponse } from "@ytune/types";
import { removeFromCache } from "../services/cache.js";
import { listMeta, removeMeta } from "../services/audioMeta.js";

const params = z.object({ videoId: z.string().min(1) });

export async function cacheRoutes(app: FastifyInstance): Promise<void> {
  app.get("/cache", async (_request, reply) => {
    const metas = await listMeta();
    const entries: CacheEntry[] = metas.map((m) => ({
      videoId: m.videoId,
      title: m.title,
      channel: m.channel,
      sizeBytes: m.sizeBytes,
      downloadLevel: m.downloadLevel,
      cachedAt: m.cachedAt,
      lastListenedAt: m.lastListenedAt,
    }));
    const totalBytes = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
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

    const { videoId } = parsed.data;
    const removed = await removeFromCache(videoId); // apaga o .mp3
    await removeMeta(videoId); // remove Hash + ZSet
    return reply.send({ videoId, removed });
  });
}
