/** HTMLAudioElement singleton compartilhado por todo o player. */
let element: HTMLAudioElement | null = null;

export function getAudioElement(): HTMLAudioElement {
  if (!element) {
    element = new Audio();
    element.preload = "auto";
    element.crossOrigin = "anonymous";
  }
  return element;
}
