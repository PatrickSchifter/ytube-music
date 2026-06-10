import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { cachePath, isCached } from "../services/cache.js";
import { enqueue, waitFor } from "../services/downloadQueue.js";
import { streamAudio } from "../services/streamer.js";

const params = z.object({ videoId: z.string().min(1) });

export async function streamRoutes(app: FastifyInstance): Promise<void> {
  app.get("/stream/:videoId", async (request, reply) => {
    const parsed = params.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "videoId inválido",
      });
    }

    const { videoId } = parsed.data;

    // Cache miss: baixa de forma síncrona (deduplicado pela fila) antes de servir.
    if (!(await isCached(videoId))) {
      await enqueue(videoId);
      await waitFor(videoId);

      if (!(await isCached(videoId))) {
        return reply.status(422).send({
          statusCode: 422,
          error: "Unprocessable Entity",
          message: `Não foi possível obter o áudio de ${videoId}`,
        });
      }
    }

    // Assume controle da resposta para fazer pipe direto no ServerResponse nativo.
    reply.hijack();
    try {
      await streamAudio(cachePath(videoId), request.headers.range, reply.raw);
    } catch (err) {
      app.log.error(err);
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(500);
        reply.raw.end();
      }
    }
  });
}
