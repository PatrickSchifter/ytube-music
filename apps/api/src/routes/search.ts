import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { MixResponse, SearchResponse } from "@ytune/types";
import { getMix, searchVideos } from "../lib/ytdlp.js";
import { isCached, cachedSize } from "../services/cache.js";

const searchQuery = z.object({ q: z.string().min(1, "query vazia") });
const mixParams = z.object({ videoId: z.string().min(1) });

/** Anota `cached`/`sizeBytes` consultando o cache em disco. */
async function annotate<T extends { id: string; cached: boolean; sizeBytes?: number }>(
  items: T[],
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      cached: await isCached(item.id),
      sizeBytes: await cachedSize(item.id),
    })),
  );
}

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get("/search", async (request, reply) => {
    const parsed = searchQuery.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: parsed.error.issues[0]?.message ?? "query inválida",
      });
    }

    const results = await annotate(await searchVideos(parsed.data.q));
    const body: SearchResponse = { results };
    return reply.send(body);
  });

  app.get("/search/mix/:videoId", async (request, reply) => {
    const parsed = mixParams.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "videoId inválido",
      });
    }

    const results = await annotate(await getMix(parsed.data.videoId));
    const body: MixResponse = { results };
    return reply.send(body);
  });
}
