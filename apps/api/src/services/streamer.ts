import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import type { ServerResponse } from "node:http";

interface RangeSpec {
  start: number;
  end: number;
}

/** Faz o parse de um header `Range: bytes=START-END` (RFC 7233). */
export function parseRange(header: string | undefined, totalSize: number): RangeSpec | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  let start: number;
  let end: number;

  if (rawStart === "") {
    // Sufixo: bytes=-N → últimos N bytes.
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(totalSize - suffix, 0);
    end = totalSize - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? totalSize - 1 : Math.min(Number(rawEnd), totalSize - 1);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= totalSize) {
    return null;
  }
  return { start, end };
}

/**
 * Escreve uma resposta de streaming de áudio em `res` (ServerResponse nativo).
 * Suporta Range requests (206 Partial Content) e fallback para 200 completo.
 */
export async function streamAudio(
  filePath: string,
  rangeHeader: string | undefined,
  res: ServerResponse,
): Promise<void> {
  const { size } = await fs.stat(filePath);
  const range = parseRange(rangeHeader, size);

  if (rangeHeader && !range) {
    // Range inválido / fora dos limites.
    res.writeHead(416, {
      "Content-Range": `bytes */${size}`,
      "Accept-Ranges": "bytes",
    });
    res.end();
    return;
  }

  if (range) {
    const chunkSize = range.end - range.start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    });
    createReadStream(filePath, { start: range.start, end: range.end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Length": size,
    "Accept-Ranges": "bytes",
    "Content-Type": "audio/mpeg",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}
