import { defineConfig } from 'vite';
import { spawn } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const isIntegratedAngularDev = command => command === 'serve' && process.env.npm_lifecycle_event === 'dev:site';

export default defineConfig(({ command }) => ({
    plugins: [{
        name: 'vue-demo-route',
        configureServer(server) {
            const index = resolve(import.meta.dirname, 'public/vue/index.html');
            server.middlewares.use((request, response, next) => {
                const path = new URL(request.url, 'http://localhost').pathname;
                if (path === '/vue') {
                    response.writeHead(308, { Location: '/vue/' });
                    response.end();
                    return;
                }
                if (path !== '/vue/' && path !== '/vue/index.html') return next();
                if (!existsSync(index)) {
                    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
                    response.end('Build the Vue demo with npm run site:vue first.');
                    return;
                }
                response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                createReadStream(index).pipe(response);
            });
        }
    }, {
        name: 'angular-demo-route',
        configureServer(server) {
            const integratedDev = isIntegratedAngularDev(command);
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
                if (integratedDev) {
                    readFile(index, 'utf8').then(html => {
                        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        response.end(html.replace('<head>', '<head>\n<script type="module" src="/@vite/client"></script>'));
                    }).catch(error => {
                        server.config.logger.error(`Cannot serve the Angular demo: ${error.message}`);
                        response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
                        response.end('The Angular demo is temporarily unavailable.');
                    });
                    return;
                }
                response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                createReadStream(index).pipe(response);
            });

            if (!integratedDev) return;

            const source = resolve(import.meta.dirname, 'examples/angular-demo/src');
            const npmCli = process.env.npm_execpath;
            let debounce;
            let pending = false;
            let building = false;
            let shuttingDown = false;

            const runBuild = async () => {
                if (building || !pending || shuttingDown) return;
                building = true;
                pending = false;
                server.config.logger.info('Angular source changed; rebuilding /angular/...');
                try {
                    if (!npmCli) throw new Error('npm CLI path is unavailable');
                    const result = await new Promise((resolveBuild, rejectBuild) => {
                        const child = spawn(process.execPath, [npmCli, 'run', 'site:angular'], {
                            cwd: import.meta.dirname,
                            stdio: 'inherit'
                        });
                        child.once('error', rejectBuild);
                        child.once('close', code => resolveBuild(code));
                    });
                    if (result !== 0) throw new Error(`site:angular exited with code ${result}`);
                    if (!shuttingDown) server.ws.send({ type: 'full-reload', path: '/angular/index.html' });
                } catch (error) {
                    server.config.logger.error(`Angular rebuild failed: ${error.message}`);
                } finally {
                    building = false;
                    if (pending) void runBuild();
                }
            };

            const onWatchEvent = (event, path) => {
                if (shuttingDown || !['add', 'change', 'unlink'].includes(event)) return;
                const withinSource = relative(source, resolve(path));
                if (!withinSource || withinSource === '..' ||
                    withinSource.startsWith(`..${sep}`) || isAbsolute(withinSource)) return;
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    pending = true;
                    void runBuild();
                }, 150);
            };

            server.watcher.add(source);
            server.watcher.on('all', onWatchEvent);
            server.httpServer?.once('close', () => {
                shuttingDown = true;
                clearTimeout(debounce);
                server.watcher.off('all', onWatchEvent);
            });
        }
    }],
    server: isIntegratedAngularDev(command) ? {
        watch: { ignored: ['**/public/angular/**', '**/examples/angular-demo/dist/**', '**/public/vue/**', '**/examples/vue-demo/dist/**'] }
    } : undefined,
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, 'index.html'),
                install: resolve(import.meta.dirname, 'install/index.html')
            }
        }
    }
}));
