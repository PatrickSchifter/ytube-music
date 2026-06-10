import { Redis } from "ioredis";
import { config } from "../config.js";

/**
 * Cliente Redis singleton — uma única conexão reutilizada em todo o app.
 */
let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
    client.on("error", (err: Error) => {
      console.error("[redis]", err.message);
    });
    client.on("connect", () => {
      console.log("[redis] conectado em", config.redisUrl);
    });
  }
  return client;
}

/** Encerra a conexão (usado no shutdown gracioso, se necessário). */
export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
