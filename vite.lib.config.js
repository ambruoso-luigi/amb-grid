import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'dist-lib',
        emptyOutDir: true,
        sourcemap: true,
        lib: {
            entry: resolve(projectRoot, 'src/library-entry.js'),
            formats: ['es'],
            fileName: 'amb-grid',
            cssFileName: 'amb-grid'
        },
        rollupOptions: {
            external: [
                'tabulator-tables',
                'awesomplete',
                'vanillajs-datepicker/Datepicker'
            ]
        }
    }
});
