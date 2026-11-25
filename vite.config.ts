import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En GitHub Actions el repositorio se publica bajo /adara_parfum/, localmente se usa './'
const base = process.env.GITHUB_ACTIONS === 'true' ? '/adara_parfum/' : './';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: false
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
});
