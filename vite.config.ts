import { defineConfig } from "vite";
import { resolve } from "path";

// Build estatico: genera /dist listo para Cloudflare Pages.
export default defineConfig({
  base: "./",
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
  },
});
