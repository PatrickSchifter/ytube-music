import { promises as fs } from "node:fs";
import { config } from "../config.js";
import { cachePath } from "./cache.js";
import { findExpired, removeMeta } from "./audioMeta.js";

export interface CleanupResult {
  removed: number;
  freedBytes: number;
}

/**
 * Remove faixas não ouvidas desde `cutoff` (default: 7 dias atrás):
 * apaga o .mp3, o Hash audio:{id} e a entrada no ZSet audio:lru.
 */
export async function runCleanup(
  cutoff: number = Date.now() - config.cacheTtlMs,
): Promise<CleanupResult> {
  const expired = await findExpired(cutoff);
  let removed = 0;
  let freedBytes = 0;

  for (const videoId of expired) {
    try {
      const stat = await fs.stat(cachePath(videoId));
      freedBytes += stat.size;
      await fs.unlink(cachePath(videoId));
    } catch {
      // arquivo já não existe — segue removendo os metadados
    }
    await removeMeta(videoId);
    removed += 1;
  }

  if (removed > 0) {
    console.log(
      `[cleanup] ${removed} faixa(s) removida(s), ${(freedBytes / 1_048_576).toFixed(1)} MB liberados`,
    );
  }
  return { removed, freedBytes };
}

let timer: ReturnType<typeof setInterval> | null = null;

/** Inicia o job recorrente (roda uma vez no boot e depois a cada intervalo). */
export function startCleanupJob(): void {
  if (timer) return;

  void runCleanup().catch((err) => console.error("[cleanup] erro:", (err as Error).message));

  timer = setInterval(() => {
    void runCleanup().catch((err) => console.error("[cleanup] erro:", (err as Error).message));
  }, config.cleanupIntervalMs);

  // Não impede o processo de encerrar.
  timer.unref();
  console.log(`[cleanup] job ativo (a cada ${config.cleanupIntervalMs / 60_000} min)`);
}

/** Para o job (usado em testes/shutdown). */
export function stopCleanupJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
