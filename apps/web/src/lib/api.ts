import type {
  CacheListResponse,
  DownloadStatusResponse,
  EnqueueResponse,
  MixResponse,
  SearchResponse,
  StreamInfo,
} from "@ytune/types";

/**
 * Em dev, BASE é "/api" e o Vite faz proxy para http://localhost:3001.
 * Em produção, defina VITE_API_URL apontando para o backend.
 */
const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API ${res.status} em ${path}`);
  }
  return (await res.json()) as T;
}

export const api = {
  search: (q: string): Promise<SearchResponse> =>
    getJson(`/search?q=${encodeURIComponent(q)}`),

  mix: (videoId: string): Promise<MixResponse> => getJson(`/search/mix/${videoId}`),

  info: (videoId: string): Promise<StreamInfo> => getJson(`/info/${videoId}`),

  /** URL direta usada como `audio.src` (suporta Range/seek). */
  streamUrl: (videoId: string): string => `${BASE}/stream/${videoId}`,

  /** Prefetch fire-and-forget — dispara o download da próxima faixa. */
  prefetch: async (videoId: string): Promise<EnqueueResponse | null> => {
    try {
      const res = await fetch(`${BASE}/download/${videoId}`, { method: "POST" });
      return (await res.json()) as EnqueueResponse;
    } catch {
      return null;
    }
  },

  downloadStatus: (videoId: string): Promise<DownloadStatusResponse> =>
    getJson(`/download/${videoId}/status`),

  cacheList: (): Promise<CacheListResponse> => getJson(`/cache`),

  removeCache: async (videoId: string): Promise<void> => {
    await fetch(`${BASE}/cache/${videoId}`, { method: "DELETE" });
  },
};
