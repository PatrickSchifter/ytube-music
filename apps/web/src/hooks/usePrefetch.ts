import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/playerStore";
import { getAudioElement } from "../lib/audio";
import { api } from "../lib/api";

/**
 * Ao atingir 80% da faixa atual, dispara o download da próxima faixa da fila
 * (POST /download/:id). Evita chamadas duplicadas com um Set interno.
 */
export function usePrefetch(): void {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const mix = usePlayerStore((s) => s.mix);
  const setPrefetchStatus = usePlayerStore((s) => s.setPrefetchStatus);
  const prefetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    const audio = getAudioElement();

    const onTimeUpdate = () => {
      if (!audio.duration || !Number.isFinite(audio.duration)) return;
      const pct = audio.currentTime / audio.duration;
      if (pct < 0.8) return;

      const next = queue[0] ?? mix[0];
      if (!next || next.cached || prefetched.current.has(next.id)) return;

      prefetched.current.add(next.id);
      setPrefetchStatus(next.id, "downloading");
      void api.prefetch(next.id).then((res) => {
        if (res) setPrefetchStatus(next.id, res.status);
      });
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [currentTrack, queue, mix, setPrefetchStatus]);
}
