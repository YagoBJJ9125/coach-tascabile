import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// base "./" so the static build works on GitHub Pages / any subpath.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "Coach Tascabile",
        short_name: "Coach",
        description: "Allenamento e alimentazione, il tuo coach in tasca",
        lang: "it",
        theme_color: "#0e0e1a",
        background_color: "#0e0e1a",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallback: "index.html",
      },
      // PWA/service worker attivi solo nella build di produzione (npm run build).
      // In dev resterebbe il SW a fare cache e a complicare il debug.
    }),
  ],
  server: { port: 5173, open: true },
});
