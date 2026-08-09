import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'dist-lib',
        emptyOutDir: false,
        sourcemap: true,
        lib: {
            entry: resolve(projectRoot, 'src/library-legacy-entry.js'),
            name: 'AMB',
            formats: ['umd'],
            fileName: () => 'amb-grid.umd.js',
            cssFileName: 'amb-grid'
        }
    }
});
