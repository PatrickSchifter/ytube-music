import { promises as fs } from "node:fs";
import type { DownloadLevel } from "@ytune/types";
import { convertToMp3 } from "../lib/ffmpeg.js";
import { downloadToTemp, cleanupTemp, getVideoInfo } from "../lib/ytdlp.js";
import { cachePath, ensureCacheDir, isCached, cachedSize } from "./cache.js";
import { recordCached } from "./audioMeta.js";

/**
 * Estratégia audio-first: tenta sempre baixar o menor volume de dados possível,
 * em três tentativas em cascata. O vídeo só é baixado como último recurso e o
 * áudio é extraído com `-vn`.
 */
const FORMAT_PRIORITY: { format: string; level: DownloadLevel }[] = [
  // Nível 1: áudio puro — sem vídeo, mínimo de dados.
  {
    format: "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio[ext=opus]/bestaudio",
    level: "audio",
  },
  // Nível 2: menor vídeo + melhor áudio embutido (áudio extraído depois).
  {
    format: "worstvideo+bestaudio/worst[height<=240]/worst[height<=144]",
    level: "video-fallback",
  },
  // Nível 3: qualquer coisa, o menor arquivo disponível.
  { format: "worst", level: "worst-fallback" },
];

export interface DownloadResult {
  path: string;
  level: DownloadLevel;
  sizeBytes: number;
  fromCache: boolean;
}

/** Resultado já em cache não carrega o nível usado originalmente. */
const lastLevel = new Map<string, DownloadLevel>();

export function getDownloadLevel(videoId: string): DownloadLevel | undefined {
  return lastLevel.get(videoId);
}

/**
 * Garante o MP3 do vídeo em cache, percorrendo a cascata de formatos.
 * Retorna o path do arquivo e o nível usado.
 */
export async function downloadAudio(videoId: string): Promise<DownloadResult> {
  await ensureCacheDir();
  const outPath = cachePath(videoId);

  if (await isCached(videoId)) {
    const size = (await cachedSize(videoId)) ?? 0;
    return { path: outPath, level: lastLevel.get(videoId) ?? "audio", sizeBytes: size, fromCache: true };
  }

  let lastError: unknown;

  for (const { format, level } of FORMAT_PRIORITY) {
    let tempFile: string | undefined;
    try {
      tempFile = await downloadToTemp(videoId, format);
      await convertToMp3(tempFile, outPath);

      const size = (await cachedSize(videoId)) ?? 0;
      lastLevel.set(videoId, level);
      console.log(`[downloader] ${videoId} → nível "${level}" (${(size / 1_048_576).toFixed(1)} MB)`);

      // Registra os metadados no Redis (Hash + ZSet LRU). Falha aqui não deve
      // quebrar o download/stream — apenas registra um aviso.
      try {
        const info = await getVideoInfo(videoId);
        await recordCached(videoId, {
          title: info?.title ?? videoId,
          channel: info?.channel ?? "Desconhecido",
          sizeBytes: size,
          downloadLevel: level,
        });
      } catch (metaErr) {
        console.warn(`[downloader] metadados Redis falharam para ${videoId}: ${(metaErr as Error).message}`);
      }

      return { path: outPath, level, sizeBytes: size, fromCache: false };
    } catch (err) {
      lastError = err;
      console.warn(`[downloader] ${videoId} falhou no nível "${level}": ${(err as Error).message}`);
      // Remove um mp3 parcial que possa ter sido criado antes do erro.
      await fs.rm(outPath, { force: true }).catch(() => {});
    } finally {
      if (tempFile) await cleanupTemp(videoId);
    }
  }

  throw new Error(
    `Não foi possível baixar áudio para ${videoId}. Último erro: ${(lastError as Error)?.message ?? "desconhecido"}`,
  );
}
