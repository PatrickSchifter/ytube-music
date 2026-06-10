import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { ensureCacheDir } from "./services/cache.js";
import { searchRoutes } from "./routes/search.js";
import { infoRoutes } from "./routes/info.js";
import { streamRoutes } from "./routes/stream.js";
import { downloadRoutes } from "./routes/download.js";
import { cacheRoutes } from "./routes/cache.js";

async function bootstrap(): Promise<void> {
  await ensureCacheDir();

  const app = Fastify({
    logger: {
      transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
    },
  });

  await app.register(cors, { origin: config.corsOrigin });

  app.get("/health", async () => ({ status: "ok", service: "ytune-api" }));

  await app.register(searchRoutes);
  await app.register(infoRoutes);
  await app.register(streamRoutes);
  await app.register(downloadRoutes);
  await app.register(cacheRoutes);

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
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void bootstrap();
