import { useRef } from "react";
import { usePlayerStore } from "../store/playerStore";
import { seekTo } from "../hooks/usePlayer";
import { formatTime } from "../lib/format";

/**
 * Barra de progresso clicável/arrastável. O segmento 80–100% recebe a cor de
 * "prefetch" — feedback de que o download antecipado já foi (ou será) disparado.
 */
export function SeekBar() {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const crossedPrefetch = pct >= 80;

  const handleSeek = (clientX: number) => {
    const el = trackRef.current;
    if (!el || duration <= 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    seekTo(ratio * duration);
  };

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400 select-none">
      <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
      <div
        ref={trackRef}
        className="relative h-3 flex-1 cursor-pointer"
        role="slider"
        aria-label="Posição da faixa"
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        aria-valuenow={Math.floor(currentTime)}
        tabIndex={0}
        onClick={(e) => handleSeek(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") seekTo(Math.min(duration, currentTime + 5));
          if (e.key === "ArrowLeft") seekTo(Math.max(0, currentTime - 5));
        }}
      >
        {/* Trilho */}
        <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-zinc-700" />
        {/* Zona de prefetch (80–100%) */}
        <div className="absolute top-1/2 right-0 h-1 w-1/5 -translate-y-1/2 rounded-full bg-prefetch/40" />
        {/* Progresso */}
        <div
          className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full transition-colors ${
            crossedPrefetch ? "bg-prefetch" : "bg-brand"
          }`}
          style={{ width: `${pct}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="w-10 tabular-nums">{formatTime(duration)}</span>
    </div>
  );
}
