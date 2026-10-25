import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/vue/',
  plugins: [vue()],
  server: {
    fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] }
  }
});
