import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pos/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@pos/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
      '@pos/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      '@pos/realtime': path.resolve(__dirname, '../../packages/realtime/src/index.ts'),
      '@pos/validation': path.resolve(__dirname, '../../packages/validation/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/ws':  { target: 'ws://localhost:3000', ws: true },
    },
  },
});
