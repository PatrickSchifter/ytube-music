import { Avatar, Button, Slider } from "@ytune/ui";
import { usePlayerStore } from "../store/playerStore";
import { SeekBar } from "./SeekBar";

export function PlayerBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const repeat = usePlayerStore((s) => s.repeat);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  if (!currentTrack) {
    return (
      <footer className="flex h-20 items-center justify-center border-t border-white/10 bg-zinc-950 text-sm text-zinc-500">
        Busque uma faixa e toque para começar.
      </footer>
    );
  }

  return (
    <footer className="grid grid-cols-1 items-center gap-2 border-t border-white/10 bg-zinc-950 px-4 py-2 md:grid-cols-3">
      {/* Faixa atual */}
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={currentTrack.thumbnail} alt={currentTrack.title} size={48} />
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-100">{currentTrack.title}</p>
          <p className="truncate text-xs text-zinc-400">{currentTrack.channel}</p>
        </div>
      </div>

      {/* Controles + seek */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="icon"
            onClick={toggleShuffle}
            className={shuffle ? "text-brand" : ""}
            aria-label="Aleatório"
            title="Aleatório"
          >
            🔀
          </Button>
          <Button variant="icon" onClick={prev} aria-label="Anterior" title="Anterior">
            ⏮
          </Button>
          <Button
            variant="icon"
            onClick={togglePlay}
            className="bg-white text-black hover:bg-white/90"
            aria-label={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? "⏸" : "▶"}
          </Button>
          <Button variant="icon" onClick={next} aria-label="Próxima" title="Próxima">
            ⏭
          </Button>
          <Button
            variant="icon"
            onClick={cycleRepeat}
            className={repeat !== "none" ? "text-brand" : ""}
            aria-label="Repetir"
            title={`Repetir: ${repeat}`}
          >
            {repeat === "one" ? "🔂" : "🔁"}
          </Button>
        </div>
        <SeekBar />
      </div>

      {/* Volume */}
      <div className="hidden items-center justify-end gap-2 md:flex">
        <span className="text-zinc-400" aria-hidden>
          🔊
        </span>
        <div className="w-28">
          <Slider
            value={Math.round(volume * 100)}
            min={0}
            max={100}
            onValueChange={(v) => setVolume(v / 100)}
            aria-label="Volume"
          />
        </div>
      </div>
    </footer>
  );
}
