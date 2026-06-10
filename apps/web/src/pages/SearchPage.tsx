import { useState } from "react";
import { Button, Spinner } from "@ytune/ui";
import { useMix, useSearch } from "../hooks/useSearch";
import { usePlayerStore } from "../store/playerStore";
import { TrackCard } from "../components/TrackCard";

type Tab = "results" | "mix";

export function SearchPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("results");

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addMixToQueue = usePlayerStore((s) => s.addMixToQueue);

  const search = useSearch(query);
  // Apenas exibição da aba "Mix"; o autoplay é alimentado por useRadio (App).
  const mix = useMix(currentTrack?.id ?? null);

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(input);
          setTab("results");
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Buscar música no YouTube…"
          className="flex-1 rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-brand/50"
        />
        <Button type="submit">Buscar</Button>
      </form>

      <div className="flex gap-2 border-b border-white/10">
        <TabButton active={tab === "results"} onClick={() => setTab("results")}>
          Resultados
        </TabButton>
        <TabButton
          active={tab === "mix"}
          onClick={() => setTab("mix")}
          disabled={!currentTrack}
        >
          Mix
        </TabButton>
        {tab === "mix" && currentTrack && (
          <button
            onClick={addMixToQueue}
            className="ml-auto px-3 text-xs text-brand hover:underline"
          >
            + Adicionar mix à fila
          </button>
        )}
      </div>

      {tab === "results" && (
        <Section
          isLoading={search.isLoading && !!query}
          isError={search.isError}
          empty={!query ? "Digite algo para buscar." : "Nenhum resultado."}
          items={search.data?.results ?? []}
        />
      )}

      {tab === "mix" && (
        <Section
          isLoading={mix.isLoading}
          isError={mix.isError}
          empty={
            currentTrack ? "Sem mix para esta faixa." : "Toque uma faixa para ver o mix."
          }
          items={mix.data?.results ?? []}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 text-sm transition-colors ${
        active ? "border-b-2 border-brand text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Section({
  isLoading,
  isError,
  empty,
  items,
}: {
  isLoading: boolean;
  isError: boolean;
  empty: string;
  items: import("@ytune/types").Video[];
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size={28} />
      </div>
    );
  }
  if (isError) {
    return <p className="py-10 text-center text-sm text-red-400">Erro ao carregar.</p>;
  }
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-zinc-500">{empty}</p>;
  }
  return (
    <div className="flex flex-col">
      {items.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
}
