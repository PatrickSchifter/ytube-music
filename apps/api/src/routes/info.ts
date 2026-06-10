import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { StreamInfo } from "@ytune/types";
import { getVideoInfo } from "../lib/ytdlp.js";
import { isCached, cachedSize } from "../services/cache.js";
import { getDownloadLevel } from "../services/downloader.js";

const params = z.object({ videoId: z.string().min(1) });

export async function infoRoutes(app: FastifyInstance): Promise<void> {
  app.get("/info/:videoId", async (request, reply) => {
    const parsed = params.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "videoId inválido",
      });
    }

    const { videoId } = parsed.data;
    const video = await getVideoInfo(videoId);
    if (!video) {
      return reply.status(404).send({
        statusCode: 404,
        error: "Not Found",
        message: `Vídeo ${videoId} não encontrado`,
      });
    }

    const cached = await isCached(videoId);
    const body: StreamInfo = {
      ...video,
      cached,
      sizeBytes: await cachedSize(videoId),
      downloadLevel: getDownloadLevel(videoId),
    };
    return reply.send(body);
  });
}
