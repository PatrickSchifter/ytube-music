import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Spinner } from "@ytune/ui";
import { api } from "../lib/api";
import { formatBytes } from "../lib/format";

export function CachePage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["cache"],
    queryFn: () => api.cacheList(),
  });

  const remove = async (videoId: string) => {
    await api.removeCache(videoId);
    await queryClient.invalidateQueries({ queryKey: ["cache"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size={28} />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="py-10 text-center text-sm text-red-400">Erro ao carregar o cache.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cache no servidor</h2>
        <span className="text-sm text-zinc-400">
          {data.entries.length} faixas · {formatBytes(data.totalBytes)}
        </span>
      </div>

      {data.entries.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">Nada em cache ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {data.entries.map((entry) => (
            <li key={entry.videoId} className="flex items-center gap-3 py-2">
              <code className="flex-1 truncate text-sm text-zinc-200">{entry.videoId}</code>
              <span className="text-xs tabular-nums text-zinc-500">
                {formatBytes(entry.sizeBytes)}
              </span>
              <span className="hidden text-xs text-zinc-600 sm:inline">
                {new Date(entry.createdAt).toLocaleDateString("pt-BR")}
              </span>
              <Button variant="ghost" onClick={() => remove(entry.videoId)} className="text-xs">
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
