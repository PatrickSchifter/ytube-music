import { existsSync } from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { config } from "./config.js";
import { ensureCacheDir } from "./services/cache.js";
import { searchRoutes } from "./routes/search.js";
import { infoRoutes } from "./routes/info.js";
import { streamRoutes } from "./routes/stream.js";
import { downloadRoutes } from "./routes/download.js";
import { cacheRoutes } from "./routes/cache.js";
import { startCleanupJob } from "./services/cleanupJob.js";

async function bootstrap(): Promise<void> {
  await ensureCacheDir();

  const app = Fastify({
    logger: {
      transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
    },
  });

  await app.register(cors, { origin: config.corsOrigin });

  // Healthcheck na raiz (usado pelo Docker/orquestrador).
  app.get("/health", async () => ({ status: "ok", service: "ytune-api" }));

  // Todas as rotas da API vivem sob /api — mesma origem do PWA em produção.
  await app.register(
    async (api) => {
      await api.register(searchRoutes);
      await api.register(infoRoutes);
      await api.register(streamRoutes);
      await api.register(downloadRoutes);
      await api.register(cacheRoutes);
    },
    { prefix: "/api" },
  );

  // Em produção, serve o PWA buildado e faz fallback de SPA.
  const canServeWeb = config.serveWeb && existsSync(path.join(config.webDist, "index.html"));
  if (config.serveWeb && !canServeWeb) {
    app.log.warn(`SERVE_WEB ativo mas web build não encontrado em ${config.webDist}`);
  }
  if (canServeWeb) {
    await app.register(fastifyStatic, { root: config.webDist, wildcard: false });
    app.setNotFoundHandler((request, reply) => {
      // Requisições à API que não casaram → 404 JSON; o resto → index.html (SPA).
      if (request.url.startsWith("/api") || request.url.startsWith("/health")) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: `Rota ${request.url} não encontrada`,
        });
      }
      return reply.sendFile("index.html");
    });
    app.log.info(`Servindo PWA de ${config.webDist}`);
  }

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode ?? 500).send({
      statusCode: error.statusCode ?? 500,
      error: error.name ?? "Internal Server Error",
      message: error.message,
    });
  });

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`YTune API ouvindo em http://localhost:${config.port}`);
    // Job de limpeza do cache (LRU/TTL de 7 dias) — roda dentro do processo.
    startCleanupJob();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void bootstrap();
