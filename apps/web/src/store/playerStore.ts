import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DownloadStatus, Video } from "@ytune/types";

export type RepeatMode = "none" | "one" | "all";

interface PlayerState {
  currentTrack: Video | null;
  queue: Video[];
  mix: Video[];
  history: Video[];
  isPlaying: boolean;
  volume: number; // 0–1
  repeat: RepeatMode;
  shuffle: boolean;
  currentTime: number;
  duration: number;
  prefetchStatus: Record<string, DownloadStatus>;

  // Ações
  play: (track?: Video) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  ended: () => void;
  addToQueue: (track: Video) => void;
  playNext: (track: Video) => void;
  addMixToQueue: () => void;
  removeFromQueue: (id: string) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  setMix: (tracks: Video[]) => void;
  setVolume: (v: number) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  setProgress: (currentTime: number, duration: number) => void;
  setPrefetchStatus: (id: string, status: DownloadStatus) => void;
}

/** Remove uma faixa (por id) de uma lista. */
function without(list: Video[], id: string): Video[] {
  return list.filter((v) => v.id !== id);
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      mix: [],
      history: [],
      isPlaying: false,
      volume: 1,
      repeat: "none",
      shuffle: false,
      currentTime: 0,
      duration: 0,
      prefetchStatus: {},

      play: (track) => {
        if (!track) {
          if (get().currentTrack) set({ isPlaying: true });
          return;
        }
        const { currentTrack, history } = get();
        const newHistory =
          currentTrack && currentTrack.id !== track.id
            ? [currentTrack, ...history].slice(0, 100)
            : history;
        set({
          currentTrack: track,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
          history: newHistory,
          // Se a faixa veio da fila, remove-a de lá.
          queue: without(get().queue, track.id),
        });
      },

      pause: () => set({ isPlaying: false }),

      togglePlay: () => {
        if (!get().currentTrack) return;
        set({ isPlaying: !get().isPlaying });
      },

      next: () => {
        const { queue, mix, currentTrack, shuffle, history } = get();
        let nextTrack: Video | undefined;
        let restQueue = queue;
        let restMix = mix;

        if (queue.length > 0) {
          if (shuffle) {
            const idx = Math.floor(Math.random() * queue.length);
            nextTrack = queue[idx];
            restQueue = queue.filter((_, i) => i !== idx);
          } else {
            nextTrack = queue[0];
            restQueue = queue.slice(1);
          }
        } else if (mix.length > 0) {
          // Fila esgotou: puxa do mix automático.
          const idx = shuffle ? Math.floor(Math.random() * mix.length) : 0;
          nextTrack = mix[idx];
          restMix = mix.filter((_, i) => i !== idx);
        }

        if (!nextTrack) {
          set({ isPlaying: false });
          return;
        }

        set({
          currentTrack: nextTrack,
          queue: restQueue,
          mix: restMix,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
          history: currentTrack ? [currentTrack, ...history].slice(0, 100) : history,
        });
      },

      prev: () => {
        const { history, currentTrack, queue, currentTime } = get();
        // Reinicia a faixa atual se já passou de 3s.
        if (currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }
        const [previous, ...restHistory] = history;
        if (!previous) {
          set({ currentTime: 0 });
          return;
        }
        set({
          currentTrack: previous,
          history: restHistory,
          queue: currentTrack ? [currentTrack, ...queue] : queue,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
        });
      },

      ended: () => {
        const { repeat } = get();
        if (repeat === "one") {
          set({ currentTime: 0, isPlaying: true });
          return;
        }
        const { queue, mix } = get();
        if (queue.length === 0 && mix.length === 0 && repeat === "all") {
          // Repete a fila a partir do histórico (mais antigo primeiro).
          const { history, currentTrack } = get();
          const restart = [...history].reverse();
          const first = restart[0];
          if (first) {
            set({
              currentTrack: first,
              queue: [...restart.slice(1), ...(currentTrack ? [currentTrack] : [])],
              history: [],
              isPlaying: true,
              currentTime: 0,
              duration: 0,
            });
            return;
          }
        }
        get().next();
      },

      addToQueue: (track) => {
        if (get().queue.some((v) => v.id === track.id)) return;
        set({ queue: [...get().queue, track] });
      },

      playNext: (track) =>
        set({ queue: [track, ...without(get().queue, track.id)] }),

      addMixToQueue: () => {
        const { queue, mix } = get();
        const ids = new Set(queue.map((v) => v.id));
        const additions = mix.filter((v) => !ids.has(v.id));
        set({ queue: [...queue, ...additions], mix: [] });
      },

      removeFromQueue: (id) => set({ queue: without(get().queue, id) }),

      reorderQueue: (from, to) => {
        const queue = [...get().queue];
        if (from < 0 || from >= queue.length || to < 0 || to >= queue.length) return;
        const [moved] = queue.splice(from, 1);
        if (moved) queue.splice(to, 0, moved);
        set({ queue });
      },

      clearQueue: () => set({ queue: [] }),

      setMix: (tracks) => set({ mix: tracks }),

      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),

      cycleRepeat: () => {
        const order: RepeatMode[] = ["none", "all", "one"];
        const idx = order.indexOf(get().repeat);
        set({ repeat: order[(idx + 1) % order.length]! });
      },

      toggleShuffle: () => set({ shuffle: !get().shuffle }),

      setProgress: (currentTime, duration) =>
        set({ currentTime, duration: Number.isFinite(duration) ? duration : 0 }),

      setPrefetchStatus: (id, status) =>
        set({ prefetchStatus: { ...get().prefetchStatus, [id]: status } }),
    }),
    {
      name: "ytune-player",
      partialize: (state) => ({
        history: state.history,
        volume: state.volume,
        repeat: state.repeat,
        shuffle: state.shuffle,
      }),
    },
  ),
);
