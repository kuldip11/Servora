import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@pos/types": path.resolve(
        __dirname,
        "../../packages/types/src/index.ts",
      ),
      "@pos/validation": path.resolve(
        __dirname,
        "../../packages/validation/src/index.ts",
      ),
      "@pos/ui": path.resolve(__dirname, "../../packages/ui/src/index.tsx"),
      "@pos/api-client": path.resolve(
        __dirname,
        "../../packages/api-client/src/index.ts",
      ),
      "@pos/realtime": path.resolve(
        __dirname,
        "../../packages/realtime/src/index.ts",
      ),
    },
  },
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          )
            return "vendor-react";
          if (id.includes("/@tanstack/")) return "vendor-tanstack";
          if (id.includes("/@radix-ui/")) return "vendor-radix";
          if (id.includes("/lucide-react/")) return "vendor-icons";
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      "/ws": { target: "ws://localhost:3000", ws: true },
    },
  },
});
