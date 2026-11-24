import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En GitHub Actions el repositorio se publica bajo /adara_parfum/, localmente se usa './'
const base = process.env.GITHUB_ACTIONS === 'true' ? '/adara_parfum/' : './';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
});
