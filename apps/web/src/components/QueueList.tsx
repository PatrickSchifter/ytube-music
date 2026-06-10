import { useRef, useState } from "react";
import { Avatar, Spinner } from "@ytune/ui";
import { usePlayerStore } from "../store/playerStore";
import { formatTime } from "../lib/format";

export function QueueList() {
  const queue = usePlayerStore((s) => s.queue);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const play = usePlayerStore((s) => s.play);
  const prefetchStatus = usePlayerStore((s) => s.prefetchStatus);

  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (queue.length === 0) {
    return <p className="px-2 py-8 text-center text-sm text-zinc-500">A fila está vazia.</p>;
  }

  return (
    <ul className="flex flex-col">
      {queue.map((track, index) => {
        const status = prefetchStatus[track.id];
        const isNext = index === 0;
        return (
          <li
            key={track.id}
            draggable
            onDragStart={() => (dragIndex.current = index)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDrop={() => {
              if (dragIndex.current !== null) reorderQueue(dragIndex.current, index);
              dragIndex.current = null;
              setOverIndex(null);
            }}
            onDragEnd={() => {
              dragIndex.current = null;
              setOverIndex(null);
            }}
            className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/5 ${
              overIndex === index ? "ring-1 ring-brand/50" : ""
            }`}
          >
            <span className="w-5 cursor-grab text-center text-zinc-600" aria-hidden>
              ⋮⋮
            </span>
            <button onClick={() => play(track)} aria-label={`Tocar ${track.title}`}>
              <Avatar src={track.thumbnail} alt={track.title} size={40} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-100">{track.title}</p>
              <p className="truncate text-xs text-zinc-400">{track.channel}</p>
            </div>

            {isNext && status === "downloading" && <Spinner size={16} className="text-prefetch" />}
            {isNext && status === "done" && (
              <span className="text-brand" title="Pré-carregada">
                ✓
              </span>
            )}

            <span className="w-10 text-right text-xs tabular-nums text-zinc-500">
              {formatTime(track.duration)}
            </span>
            <button
              onClick={() => removeFromQueue(track.id)}
              className="rounded-full px-2 text-zinc-500 hover:text-red-400"
              aria-label="Remover da fila"
              title="Remover da fila"
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
