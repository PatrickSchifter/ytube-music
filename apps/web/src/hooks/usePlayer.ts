import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore";
import { getAudioElement } from "../lib/audio";
import { api } from "../lib/api";

/**
 * Sincroniza o estado do Zustand com o HTMLAudioElement singleton:
 * troca de faixa → novo src; play/pause; volume; e propaga progresso/term.
 * Deve ser montado uma única vez (em App).
 */
export function usePlayer(): void {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const ended = usePlayerStore((s) => s.ended);
  const pause = usePlayerStore((s) => s.pause);

  // Troca de faixa → define src e carrega.
  useEffect(() => {
    const audio = getAudioElement();
    if (!currentTrack) {
      audio.removeAttribute("src");
      audio.load();
      return;
    }
    const url = api.streamUrl(currentTrack.id);
    if (audio.src !== url) {
      audio.src = url;
      audio.load();
    }
  }, [currentTrack]);

  // play/pause.
  useEffect(() => {
    const audio = getAudioElement();
    if (!currentTrack) return;
    if (isPlaying) {
      void audio.play().catch(() => pause());
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, pause]);

  // Volume.
  useEffect(() => {
    getAudioElement().volume = volume;
  }, [volume]);

  // Listeners de progresso e término.
  useEffect(() => {
    const audio = getAudioElement();
    const onTime = () => setProgress(audio.currentTime, audio.duration);
    const onLoaded = () => setProgress(audio.currentTime, audio.duration);
    const onEnded = () => ended();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [setProgress, ended]);
}

/** Move o playhead do áudio para `seconds` (usado pela SeekBar). */
export function seekTo(seconds: number): void {
  const audio = getAudioElement();
  if (Number.isFinite(seconds)) audio.currentTime = seconds;
}
