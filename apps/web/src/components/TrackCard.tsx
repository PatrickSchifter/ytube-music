import type { Video } from "@ytune/types";
import { Avatar, Spinner } from "@ytune/ui";
import { usePlayerStore } from "../store/playerStore";
import { formatTime } from "../lib/format";

interface TrackCardProps {
  track: Video;
  /** Mostra indicador de prefetch (usado na fila para a próxima faixa). */
  showPrefetch?: boolean;
}

export function TrackCard({ track, showPrefetch }: TrackCardProps) {
  const play = usePlayerStore((s) => s.play);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const status = usePlayerStore((s) => s.prefetchStatus[track.id]);

  const isCurrent = currentTrack?.id === track.id;

  return (
    <div
      className={`group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/5 ${
        isCurrent ? "bg-white/10" : ""
      }`}
    >
      <button
        onClick={() => play(track)}
        className="relative shrink-0"
        aria-label={`Tocar ${track.title}`}
      >
        <Avatar src={track.thumbnail} alt={track.title} size={48} />
        <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          ▶
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${isCurrent ? "text-brand" : "text-zinc-100"}`}>
          {track.title}
        </p>
        <p className="truncate text-xs text-zinc-400">{track.channel}</p>
      </div>

      {showPrefetch && status === "downloading" && (
        <Spinner size={16} className="text-prefetch" />
      )}
      {showPrefetch && status === "done" && (
        <span className="text-brand" title="Pronto (em cache)">
          ✓
        </span>
      )}
      {track.cached && !showPrefetch && (
        <span className="text-brand text-xs" title="Em cache">
          ●
        </span>
      )}

      <span className="w-10 text-right text-xs tabular-nums text-zinc-500">
        {formatTime(track.duration)}
      </span>

      <button
        onClick={() => addToQueue(track)}
        className="rounded-full px-2 py-1 text-xs text-zinc-400 opacity-0 transition hover:bg-white/10 hover:text-zinc-100 group-hover:opacity-100"
        aria-label="Adicionar à fila"
        title="Adicionar à fila"
      >
        + Fila
      </button>
    </div>
  );
}
