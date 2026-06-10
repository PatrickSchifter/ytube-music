import { z } from "zod";

/**
 * Nível usado pelo pipeline de download audio-first.
 * - audio:           stream de áudio puro (Nível 1)
 * - video-fallback:  menor vídeo com áudio embutido, áudio extraído (Nível 2)
 * - worst-fallback:  pior formato disponível (Nível 3)
 */
export const DownloadLevelSchema = z.enum(["audio", "video-fallback", "worst-fallback"]);

/** Estado de um download na fila in-memory do backend. */
export const DownloadStatusSchema = z.enum(["idle", "downloading", "done", "error"]);

/** Metadados de uma faixa/vídeo do YouTube. */
export const VideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number(),
  thumbnail: z.string().url(),
  channel: z.string(),
  cached: z.boolean().default(false),
  /** Preenchido após o download concluir. */
  downloadLevel: DownloadLevelSchema.optional(),
  /** Tamanho do mp3 em cache, em bytes. */
  sizeBytes: z.number().optional(),
});

export const SearchResponseSchema = z.object({
  results: z.array(VideoSchema),
});

export const MixResponseSchema = z.object({
  results: z.array(VideoSchema),
});

/** Resposta de POST /download/:videoId — prefetch enfileirado. */
export const EnqueueResponseSchema = z.object({
  videoId: z.string(),
  status: DownloadStatusSchema,
});

/** Resposta de GET /download/:videoId/status. */
export const DownloadStatusResponseSchema = z.object({
  videoId: z.string(),
  status: DownloadStatusSchema,
});

/** Uma entrada do cache em disco. */
export const CacheEntrySchema = z.object({
  videoId: z.string(),
  sizeBytes: z.number(),
  createdAt: z.string(), // ISO 8601
});

export const CacheListResponseSchema = z.object({
  entries: z.array(CacheEntrySchema),
  totalBytes: z.number(),
});

/** Informações de streaming devolvidas por /info/:videoId. */
export const StreamInfoSchema = VideoSchema.extend({
  cached: z.boolean(),
});

/** Erro padronizado da API. */
export const ApiErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});

// ---- Tipos inferidos ----
export type DownloadLevel = z.infer<typeof DownloadLevelSchema>;
export type DownloadStatus = z.infer<typeof DownloadStatusSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type MixResponse = z.infer<typeof MixResponseSchema>;
export type EnqueueResponse = z.infer<typeof EnqueueResponseSchema>;
export type DownloadStatusResponse = z.infer<typeof DownloadStatusResponseSchema>;
export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CacheListResponse = z.infer<typeof CacheListResponseSchema>;
export type StreamInfo = z.infer<typeof StreamInfoSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
