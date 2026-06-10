/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // Inclui os componentes do design system compartilhado.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#1DB954", // verde estilo Spotify
        prefetch: "#f5a623", // cor da zona de prefetch na seek bar
      },
    },
  },
  plugins: [],
};
