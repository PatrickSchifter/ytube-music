import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/** Busca de vídeos via /search (react-query). */
export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

/** Mix automático do YouTube para uma faixa via /search/mix/:id. */
export function useMix(videoId: string | null) {
  return useQuery({
    queryKey: ["mix", videoId],
    queryFn: () => api.mix(videoId!),
    enabled: !!videoId,
    staleTime: 1000 * 60 * 5,
  });
}
