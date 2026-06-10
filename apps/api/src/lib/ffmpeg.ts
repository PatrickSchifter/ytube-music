import ffmpeg from "fluent-ffmpeg";
import { config } from "../config.js";

/**
 * Extrai/transcodifica o áudio de `input` (path local ou URL) para MP3.
 * `.noVideo()` (-vn) ignora completamente qualquer stream de vídeo — só o áudio
 * é mantido, mesmo quando a origem é um container de vídeo (Níveis 2 e 3).
 */
export function convertToMp3(input: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .noVideo() // -vn
      .audioCodec("libmp3lame")
      .audioBitrate(config.audioBitrate)
      .format("mp3")
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outPath);
  });
}
