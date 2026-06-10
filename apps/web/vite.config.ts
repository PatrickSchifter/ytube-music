import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "YTune",
        short_name: "YTune",
        description: "Streaming de áudio do YouTube — audio-first, instalável.",
        theme_color: "#1DB954",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Shell (HTML/JS/CSS) → precache (Cache First implícito).
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // /search e /info → Network First (dados precisam ser frescos).
            urlPattern: ({ url }) => /\/(search|info)\b/.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "ytune-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 30 },
            },
          },
          {
            // Thumbnails do YouTube → Cache First por 7 dias.
            urlPattern: ({ url }) => /(^|\.)ytimg\.com$/.test(url.hostname),
            handler: "CacheFirst",
            options: {
              cacheName: "yt-thumbnails",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // /stream/* → Network Only (streaming nunca é cacheado no SW).
            urlPattern: ({ url }) => /\/stream\//.test(url.pathname),
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Encaminha chamadas à API durante o dev, evitando configurar CORS/URL.
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
