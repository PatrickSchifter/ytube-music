import { usePlayerStore } from "../store/playerStore";
import { QueueList } from "../components/QueueList";
import { TrackCard } from "../components/TrackCard";

export function QueuePage() {
  const queue = usePlayerStore((s) => s.queue);
  const history = usePlayerStore((s) => s.history);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximas ({queue.length})</h2>
          {queue.length > 0 && (
            <button onClick={clearQueue} className="text-xs text-zinc-400 hover:text-red-400">
              Limpar fila
            </button>
          )}
        </div>
        <QueueList />
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-300">Histórico recente</h2>
          <div className="flex flex-col opacity-80">
            {history.slice(0, 20).map((track, i) => (
              <TrackCard key={`${track.id}-${i}`} track={track} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
