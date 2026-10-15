import { defineConfig } from 'vite';
import { createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
    plugins: [{
        name: 'angular-demo-route',
        configureServer(server) {
            const index = resolve(import.meta.dirname, 'public/angular/index.html');
            server.middlewares.use((request, response, next) => {
                const path = new URL(request.url, 'http://localhost').pathname;
                if (path === '/angular') {
                    response.writeHead(308, { Location: '/angular/' });
                    response.end();
                    return;
                }
                if (path !== '/angular/') return next();
                if (!existsSync(index)) {
                    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
                    response.end('Build the Angular demo with npm run site:angular first.');
                    return;
                }
                response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                createReadStream(index).pipe(response);
            });
        }
    }],
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                install: resolve(import.meta.dirname, 'install/index.html')
            }
        }
    }
});
