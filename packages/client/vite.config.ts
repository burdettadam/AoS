/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// __dirname is not available in ESM; reconstruct it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Blood on the Clocktower Digital",
        short_name: "BotC Digital",
        description:
          "A platform-agnostic, AI-assisted implementation of Blood on the Clocktower",
        theme_color: "#1f2937",
        background_color: "#111827",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Use the built package root, let module resolution handle the rest
      "@botc/shared": path.resolve(__dirname, "../shared"),
    },
  },
  optimizeDeps: {
    // Ensure that the shared package is treated as a prebundled dependency
    include: ["@botc/shared"],
  },
  server: {
    // Use a non-conflicting default dev port; keep strict to expose port issues early
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://botct-server:3001",
      // Proxy artwork routes to the server so dev uses backend file serving
      "/artwork": "http://botct-server:3001",
      "/ws": {
        target: "ws://botct-server:3001",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.{ts,js}",
        "**/index.ts",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
