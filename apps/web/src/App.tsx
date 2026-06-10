import { useState } from "react";
import { usePlayer } from "./hooks/usePlayer";
import { usePrefetch } from "./hooks/usePrefetch";
import { useRadio } from "./hooks/useRadio";
import { useMediaSession } from "./hooks/useMediaSession";
import { usePlayerStore } from "./store/playerStore";
import { PlayerBar } from "./components/PlayerBar";
import { SearchPage } from "./pages/SearchPage";
import { QueuePage } from "./pages/QueuePage";
import { CachePage } from "./pages/CachePage";

type View = "search" | "queue" | "cache";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "search", label: "Buscar", icon: "🔍" },
  { id: "queue", label: "Fila", icon: "≡" },
  { id: "cache", label: "Cache", icon: "💾" },
];

export function App() {
  const [view, setView] = useState<View>("search");
  const queueCount = usePlayerStore((s) => s.queue.length);

  // Wiring central do player (uma única vez).
  usePlayer();
  usePrefetch();
  useRadio();
  useMediaSession();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b border-white/10 px-4 py-3">
        <h1 className="text-xl font-bold text-brand">YTune</h1>
        <nav className="flex gap-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                view === item.id ? "bg-white/10 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span aria-hidden>{item.icon}</span> {item.label}
              {item.id === "queue" && queueCount > 0 && (
                <span className="ml-1 rounded-full bg-brand/20 px-1.5 text-xs text-brand">
                  {queueCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-4">
        {view === "search" && <SearchPage />}
        {view === "queue" && <QueuePage />}
        {view === "cache" && <CachePage />}
      </main>

      <PlayerBar />
    </div>
  );
}
