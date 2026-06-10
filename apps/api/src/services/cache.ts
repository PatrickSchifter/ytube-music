import { promises as fs } from "node:fs";
import path from "node:path";
import type { CacheEntry } from "@ytune/types";
import { config } from "../config.js";

/** Path do MP3 em cache para um videoId. */
export function cachePath(videoId: string): string {
  return path.join(config.cacheDir, `${videoId}.mp3`);
}

/** Garante que o diretório de cache existe. */
export async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(config.cacheDir, { recursive: true });
}

/** Verifica se o áudio de um vídeo já está em cache. */
export async function isCached(videoId: string): Promise<boolean> {
  try {
    const stat = await fs.stat(cachePath(videoId));
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

/** Tamanho em bytes do MP3 em cache, ou undefined se não existir. */
export async function cachedSize(videoId: string): Promise<number | undefined> {
  try {
    const stat = await fs.stat(cachePath(videoId));
    return stat.size;
  } catch {
    return undefined;
  }
}

/** Lista todas as entradas do cache. */
export async function listCache(): Promise<{ entries: CacheEntry[]; totalBytes: number }> {
  await ensureCacheDir();
  const files = (await fs.readdir(config.cacheDir)).filter((f) => f.endsWith(".mp3"));
  const entries: CacheEntry[] = [];
  let totalBytes = 0;

  for (const file of files) {
    const stat = await fs.stat(path.join(config.cacheDir, file));
    totalBytes += stat.size;
    entries.push({
      videoId: file.replace(/\.mp3$/, ""),
      sizeBytes: stat.size,
      createdAt: stat.birthtime.toISOString(),
    });
  }

  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { entries, totalBytes };
}

/** Remove um áudio do cache. Retorna true se algo foi removido. */
export async function removeFromCache(videoId: string): Promise<boolean> {
  try {
    await fs.rm(cachePath(videoId), { force: true });
    return true;
  } catch {
    return false;
  }
}
