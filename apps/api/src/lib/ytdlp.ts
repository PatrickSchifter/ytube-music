import { promises as fs } from "node:fs";
import path from "node:path";
import { create } from "yt-dlp-exec";
import type { Video } from "@ytune/types";
import { config, watchUrl } from "../config.js";

/**
 * Usa o yt-dlp do sistema (no PATH) em vez do binário baixado pelo pacote —
 * evita o download no postinstall e a dependência de Python.
 */
const ytdlpExec = create(config.ytDlpPath);

/**
 * Wrapper tipado sobre yt-dlp-exec.
 *
 * yt-dlp-exec ora resolve para a string de stdout, ora (quando há flags de dump)
 * para o JSON já parseado. Para uniformizar, `raw()` sempre devolve a string de
 * stdout, e `json()` faz o parse a partir dela.
 */

type YtFlags = Record<string, unknown>;

/** Acrescenta o arquivo de cookies às flags, quando configurado. */
function withCookies(flags: YtFlags): YtFlags {
  return config.cookiesFile ? { ...flags, cookies: config.cookiesFile } : flags;
}

async function raw(url: string, flags: YtFlags): Promise<string> {
  const res = (await ytdlpExec(url, withCookies(flags))) as unknown;
  if (typeof res === "string") return res;
  if (res && typeof res === "object" && "stdout" in res) {
    return String((res as { stdout: unknown }).stdout ?? "");
  }
  // Já veio parseado: re-serializa para que `json()` consiga reparsear.
  return JSON.stringify(res);
}

async function json<T>(url: string, flags: YtFlags): Promise<T> {
  const out = await raw(url, { ...flags, dumpSingleJson: true });
  return JSON.parse(out) as T;
}

/** Entrada bruta de uma playlist/busca achatada vinda do yt-dlp. */
interface RawEntry {
  id?: string;
  title?: string;
  duration?: number | null;
  channel?: string | null;
  uploader?: string | null;
  thumbnail?: string | null;
  thumbnails?: Array<{ url: string }> | null;
}

interface RawPlaylist {
  entries?: (RawEntry | null)[];
}

interface RawVideo extends RawEntry {
  filesize?: number | null;
  filesize_approx?: number | null;
}

/** Thumbnail estável a partir do id — garante uma URL válida sempre. */
function thumbFor(id: string, raw?: RawEntry): string {
  if (raw?.thumbnail) return raw.thumbnail;
  const fromList = raw?.thumbnails?.at(-1)?.url;
  if (fromList) return fromList;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function toVideo(entry: RawEntry): Video | null {
  if (!entry.id) return null;
  return {
    id: entry.id,
    title: entry.title ?? "(sem título)",
    duration: Math.round(entry.duration ?? 0),
    thumbnail: thumbFor(entry.id, entry),
    channel: entry.channel ?? entry.uploader ?? "Desconhecido",
    cached: false,
  };
}

/** Busca vídeos no YouTube via `ytsearch`. */
export async function searchVideos(query: string): Promise<Video[]> {
  const searchUrl = `ytsearch${config.searchLimit}:${query}`;
  const data = await json<RawPlaylist>(searchUrl, {
    flatPlaylist: true,
    noWarnings: true,
  });
  return (data.entries ?? []).filter((e): e is RawEntry => !!e).map(toVideo).filter((v): v is Video => !!v);
}

/** Retorna o mix automático (rádio) do YouTube para um vídeo. */
export async function getMix(videoId: string): Promise<Video[]> {
  const mixUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;
  const data = await json<RawPlaylist>(mixUrl, {
    flatPlaylist: true,
    noWarnings: true,
    playlistEnd: config.mixLimit,
  });
  return (data.entries ?? [])
    .filter((e): e is RawEntry => !!e)
    .map(toVideo)
    .filter((v): v is Video => !!v)
    // O primeiro item do mix costuma ser o próprio vídeo de origem.
    .filter((v) => v.id !== videoId);
}

/** Metadados completos de um único vídeo. */
export async function getVideoInfo(videoId: string): Promise<Video | null> {
  const data = await json<RawVideo>(watchUrl(videoId), {
    noWarnings: true,
    noPlaylist: true,
  });
  return toVideo(data);
}

/**
 * Baixa o vídeo no formato indicado para um arquivo temporário e devolve o path.
 * Deixa o próprio yt-dlp lidar com merge de formatos (ex.: worstvideo+bestaudio).
 */
export async function downloadToTemp(videoId: string, format: string): Promise<string> {
  await fs.mkdir(config.tmpDir, { recursive: true });

  // Limpa restos de tentativas anteriores para este id.
  await cleanupTemp(videoId);

  const outputTemplate = path.join(config.tmpDir, `${videoId}.%(ext)s`);
  await ytdlpExec(
    watchUrl(videoId),
    withCookies({
      format,
      output: outputTemplate,
      noPlaylist: true,
      noWarnings: true,
      noPart: true,
      retries: 3,
    }),
  );

  const files = (await fs.readdir(config.tmpDir)).filter((f) => f.startsWith(`${videoId}.`));
  if (files.length === 0) {
    throw new Error(`yt-dlp não produziu arquivo para ${videoId} (formato: ${format})`);
  }
  return path.join(config.tmpDir, files[0]!);
}

/** Remove arquivos temporários associados a um videoId. */
export async function cleanupTemp(videoId: string): Promise<void> {
  try {
    const files = (await fs.readdir(config.tmpDir)).filter((f) => f.startsWith(`${videoId}.`));
    await Promise.all(files.map((f) => fs.rm(path.join(config.tmpDir, f), { force: true })));
  } catch {
    // diretório ainda não existe — nada a limpar
  }
}
