import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DownloadStatusResponse, EnqueueResponse } from "@ytune/types";
import { enqueue, getStatus } from "../services/downloadQueue.js";

const params = z.object({ videoId: z.string().min(1) });

export async function downloadRoutes(app: FastifyInstance): Promise<void> {
  // Prefetch: dispara o download em background e responde imediatamente (202).
  app.post("/download/:videoId", async (request, reply) => {
    const parsed = params.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "videoId inválido",
      });
    }

    const { videoId } = parsed.data;
    const status = await enqueue(videoId);
    const body: EnqueueResponse = { videoId, status };
    return reply.status(202).send(body);
  });

  app.get("/download/:videoId/status", async (request, reply) => {
    const parsed = params.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Bad Request",
        message: "videoId inválido",
      });
    }

    const { videoId } = parsed.data;
    const body: DownloadStatusResponse = { videoId, status: getStatus(videoId) };
    return reply.send(body);
  });
}
