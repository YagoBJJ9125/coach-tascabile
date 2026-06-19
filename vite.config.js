import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the static build works on GitHub Pages / any subpath.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 5173, open: true },
});
