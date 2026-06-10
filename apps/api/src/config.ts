import path from "node:path";

const cwd = process.cwd();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? "0.0.0.0",

  /** Diretório onde os MP3s processados ficam em cache. */
  cacheDir: path.resolve(process.env.CACHE_DIR ?? path.join(cwd, "cache")),
  /** Subdiretório para downloads temporários (origem antes da transcodificação). */
  tmpDir: path.resolve(process.env.CACHE_DIR ?? path.join(cwd, "cache"), ".tmp"),

  /** Bitrate de saída do MP3 (kbps). */
  audioBitrate: 192,

  /** Quantidade máxima de resultados de busca. */
  searchLimit: Number(process.env.SEARCH_LIMIT ?? 20),
  /** Quantidade máxima de itens do mix automático. */
  mixLimit: Number(process.env.MIX_LIMIT ?? 25),

  /** Origem permitida pelo CORS (true = qualquer origem, ideal para uso local). */
  corsOrigin: process.env.CORS_ORIGIN ?? true,

  /** Caminho do binário yt-dlp. Default resolve via PATH. */
  ytDlpPath: process.env.YT_DLP_PATH ?? "yt-dlp",
  /**
   * Arquivo de cookies (formato Netscape) para autenticar no YouTube.
   * Necessário quando o servidor roda em IP de datacenter — o YouTube exige
   * "Sign in to confirm you're not a bot". Opcional em IP residencial.
   */
  cookiesFile: process.env.YT_DLP_COOKIES || undefined,

  /** Em produção, a API também serve o PWA buildado (mesma origem). */
  serveWeb: process.env.SERVE_WEB === "true",
  /** Diretório do build do frontend (apps/web/dist). */
  webDist: path.resolve(process.env.WEB_DIST ?? path.join(cwd, "..", "web", "dist")),

  /** Conexão com o Redis (cache inteligente de metadados + LRU). */
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  /** TTL do cache: faixas não ouvidas por mais que isso são removidas pelo job. */
  cacheTtlMs: Number(process.env.CACHE_TTL_MS ?? 7 * 24 * 60 * 60 * 1000),
  /** Intervalo entre execuções do job de limpeza. */
  cleanupIntervalMs: Number(process.env.CLEANUP_INTERVAL_MS ?? 60 * 60 * 1000),
} as const;

/** Constrói a URL canônica de um vídeo do YouTube a partir do id. */
export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
