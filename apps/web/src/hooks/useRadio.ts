import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePlayerStore } from "../store/playerStore";
import { api } from "../lib/api";

/**
 * Dirige o "rádio" (mix automático) do player a partir de `mixSeedId`.
 *
 * O seed só muda quando o usuário toca uma faixa explicitamente (play) ou quando
 * o mix está acabando e `next()` re-semeia pela faixa atual. Assim o rádio segue
 * descendo a lista em vez de ser re-semeado a cada avanço do autoplay — o que
 * antes fazia o player repetir o mesmo punhado de músicas.
 *
 * Os resultados são acrescentados via `appendMix`, que deduplica contra a faixa
 * atual, o histórico, a fila e o próprio mix. Deve ser montado uma única vez (App).
 */
export function useRadio(): void {
  const seedId = usePlayerStore((s) => s.mixSeedId);
  const appendMix = usePlayerStore((s) => s.appendMix);

  const { data } = useQuery({
    queryKey: ["radio", seedId],
    queryFn: () => api.mix(seedId!),
    enabled: !!seedId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data) appendMix(data.results);
  }, [data, appendMix]);
}
