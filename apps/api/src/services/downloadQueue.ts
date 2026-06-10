import type { DownloadStatus } from "@ytune/types";
import { downloadAudio } from "./downloader.js";
import { isCached } from "./cache.js";

/**
 * Fila in-memory que garante que o mesmo videoId não seja baixado duas vezes em
 * paralelo. Usada pelo prefetch (POST /download/:id) e consultada via status.
 */
const state = new Map<string, DownloadStatus>();
const inFlight = new Map<string, Promise<void>>();

/** Enfileira um download em background (idempotente). */
export async function enqueue(videoId: string): Promise<DownloadStatus> {
  if (await isCached(videoId)) {
    state.set(videoId, "done");
    return "done";
  }

  // Só desvia se há um download em andamento. Um "done" obsoleto (arquivo
  // removido pelo job de limpeza ou DELETE) NÃO bloqueia o re-download —
  // já sabemos que não está em cache pelo check acima.
  const existing = state.get(videoId);
  if (existing === "downloading") return existing;

  state.set(videoId, "downloading");
  const task = downloadAudio(videoId)
    .then(() => {
      state.set(videoId, "done");
    })
    .catch((err) => {
      state.set(videoId, "error");
      console.error(`[queue] erro ao baixar ${videoId}:`, (err as Error).message);
    })
    .finally(() => {
      inFlight.delete(videoId);
    });

  inFlight.set(videoId, task);
  return "downloading";
}

/** Aguarda o término de um download em andamento, se houver. */
export async function waitFor(videoId: string): Promise<void> {
  const task = inFlight.get(videoId);
  if (task) await task;
}

/** Estado atual de um download. */
export function getStatus(videoId: string): DownloadStatus {
  return state.get(videoId) ?? "idle";
}
