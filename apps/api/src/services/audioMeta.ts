import type { DownloadLevel } from "@ytune/types";
import { getRedis } from "../lib/redis.js";

/**
 * Metadados de cache mantidos no Redis.
 *
 *   Hash   audio:{videoId}  → title, channel, sizeBytes, downloadLevel,
 *                             cachedAt (ms), lastListenedAt (ms)
 *   ZSet   audio:lru        → member: videoId, score: lastListenedAt (ms)
 *
 * O ZSet permite achar eficientemente as faixas mais antigas (não ouvidas há
 * mais tempo) via ZRANGEBYSCORE — base da expiração por LRU feita pelo job.
 */

export const LRU_KEY = "audio:lru";

export function metaKey(videoId: string): string {
  return `audio:${videoId}`;
}

export interface AudioMeta {
  videoId: string;
  title: string;
  channel: string;
  sizeBytes: number;
  downloadLevel?: DownloadLevel;
  cachedAt: number;
  lastListenedAt: number;
}

interface RecordInput {
  title: string;
  channel: string;
  sizeBytes: number;
  downloadLevel: DownloadLevel;
}

/** Grava o Hash da faixa e a insere no ZSet LRU (chamado após salvar o .mp3). */
export async function recordCached(
  videoId: string,
  data: RecordInput,
  now: number = Date.now(),
): Promise<void> {
  const redis = getRedis();
  await redis.hset(metaKey(videoId), {
    title: data.title,
    channel: data.channel,
    sizeBytes: String(data.sizeBytes),
    downloadLevel: data.downloadLevel,
    cachedAt: String(now),
    lastListenedAt: String(now),
  });
  await redis.zadd(LRU_KEY, now, videoId);
}

/**
 * Atualiza lastListenedAt a cada play. Usa ZADD XX (só atualiza, não cria) e
 * não materializa um Hash parcial caso a faixa não esteja registrada.
 */
export async function touchListened(videoId: string, now: number = Date.now()): Promise<void> {
  const redis = getRedis();
  if (!(await redis.exists(metaKey(videoId)))) return;
  await redis.hset(metaKey(videoId), "lastListenedAt", String(now));
  await redis.zadd(LRU_KEY, "XX", now, videoId);
}

function parseMeta(videoId: string, hash: Record<string, string>): AudioMeta | null {
  if (!hash || Object.keys(hash).length === 0) return null;
  return {
    videoId,
    title: hash.title ?? "",
    channel: hash.channel ?? "",
    sizeBytes: Number(hash.sizeBytes ?? 0),
    downloadLevel: (hash.downloadLevel as DownloadLevel | undefined) || undefined,
    cachedAt: Number(hash.cachedAt ?? 0),
    lastListenedAt: Number(hash.lastListenedAt ?? 0),
  };
}

/** Metadados de uma faixa, ou null se não estiver registrada. */
export async function getMeta(videoId: string): Promise<AudioMeta | null> {
  const hash = await getRedis().hgetall(metaKey(videoId));
  return parseMeta(videoId, hash);
}

/** Lista todas as faixas registradas, da mais recente para a mais antiga. */
export async function listMeta(): Promise<AudioMeta[]> {
  const redis = getRedis();
  const videoIds = await redis.zrevrange(LRU_KEY, 0, -1);
  if (videoIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of videoIds) pipeline.hgetall(metaKey(id));
  const results = await pipeline.exec();

  const metas: AudioMeta[] = [];
  results?.forEach(([, hash], i) => {
    const meta = parseMeta(videoIds[i]!, (hash as Record<string, string>) ?? {});
    if (meta) metas.push(meta);
  });
  return metas;
}

/** Faixas expiradas: lastListenedAt <= cutoff. */
export async function findExpired(cutoff: number): Promise<string[]> {
  return getRedis().zrangebyscore(LRU_KEY, 0, cutoff);
}

/** Remove os metadados de uma faixa (Hash + entrada no ZSet). */
export async function removeMeta(videoId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(metaKey(videoId));
  await redis.zrem(LRU_KEY, videoId);
}
