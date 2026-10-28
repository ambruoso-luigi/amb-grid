import { defineConfig } from 'vite';
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';

const isIntegratedSiteDev = command => command === 'serve' && process.env.npm_lifecycle_event === 'dev:site';

// Both framework demos are built sites, rather than Vite source entry points.
// Keep one build in flight, and wait for a quiet period after the latest write.
const watchFrameworkDemos = server => {
    const sources = ['angular', 'vue'].map(name => ({
        name, root: resolve(import.meta.dirname, `examples/${name}-demo/src`),
    }));
    const pending = new Map();
    const revisions = new Map();
    const npmCli = process.env.npm_execpath;
    const delay = 300;
    let timer;
    let building = false;
    let shuttingDown = false;

    const schedule = () => {
        clearTimeout(timer);
        if (shuttingDown || building || !pending.size) return;
        const latest = Math.max(...pending.values());
        timer = setTimeout(runBuild, Math.max(0, latest + delay - Date.now()));
    };

    const runBuild = async () => {
        if (shuttingDown || building || !pending.size) return;
        const [name] = pending.keys();
        pending.delete(name);
        const revision = revisions.get(name);
        building = true;
        server.config.logger.info(`${name === 'vue' ? 'Vue' : 'Angular'} source changed; rebuilding /${name}/...`);
        try {
            if (!npmCli) throw new Error('npm CLI path is unavailable');
            const result = await new Promise((resolveBuild, rejectBuild) => {
                const child = spawn(process.execPath, [npmCli, 'run', `site:${name}`], {
                    cwd: import.meta.dirname,
                    stdio: 'inherit',
                });
                child.once('error', rejectBuild);
                child.once('close', code => resolveBuild(code));
            });
            if (result !== 0) throw new Error(`site:${name} exited with code ${result}`);
            // A newer source edit needs another build before this page reloads.
            if (!shuttingDown && revisions.get(name) === revision) {
                server.ws.send({ type: 'full-reload', path: `/${name}/index.html` });
                server.config.logger.info(`/${name}/ build ready; browser reload sent.`);
            }
        } catch (error) {
            server.config.logger.error(`${name} rebuild failed: ${error.message}`);
        } finally {
            building = false;
            schedule();
        }
    };

    const onWatchEvent = (event, path) => {
        if (shuttingDown || !['add', 'change', 'unlink'].includes(event)) return;
        for (const source of sources) {
            const within = relative(source.root, resolve(path));
            if (!within || within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within)) continue;
            revisions.set(source.name, (revisions.get(source.name) ?? 0) + 1);
            pending.set(source.name, Date.now());
            schedule();
            break;
        }
    };

    server.watcher.add(sources.map(source => source.root));
    server.watcher.on('all', onWatchEvent);
    server.httpServer?.once('close', () => {
        shuttingDown = true;
        clearTimeout(timer);
        server.watcher.off('all', onWatchEvent);
    });
};

const serveDemoIndex = async (server, index, response) => {
    try {
        const html = await readFile(index, 'utf8');
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(html.replace('<head>', '<head>\n<script type="module" src="/@vite/client"></script>'));
    } catch (error) {
        server.config.logger.error(`Cannot serve demo: ${error.message}`);
        response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('The demo is temporarily unavailable.');
    }
};

// Generated output is excluded from Vite's watcher to prevent premature reloads.
// Read assets from disk rather than Vite's startup inventory of public files.
const serveDemoAsset = (name, path, response, next) => {
    const prefix = `/${name}/`;
    if (!path.startsWith(prefix)) return next();
    const directory = resolve(import.meta.dirname, `public/${name}`);
    let file;
    try {
        file = resolve(directory, decodeURIComponent(path.slice(prefix.length)));
    } catch {
        response.writeHead(400).end();
        return;
    }
    const within = relative(directory, file);
    if (!within || within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within) ||
        !existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404).end();
        return;
    }
    const types = {
        '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
        '.json': 'application/json', '.map': 'application/json', '.svg': 'image/svg+xml',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
        '.woff': 'font/woff', '.woff2': 'font/woff2', '.wasm': 'application/wasm',
    };
    response.writeHead(200, {
        'Content-Type': types[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
    });
    createReadStream(file).pipe(response);
};

export default defineConfig(({ command }) => ({
    plugins: [{
        name: 'vue-demo-route',
        configureServer(server) {
            const integratedDev = isIntegratedSiteDev(command);
            const index = resolve(import.meta.dirname, 'public/vue/index.html');
            server.middlewares.use((request, response, next) => {
                const path = new URL(request.url, 'http://localhost').pathname;
                if (path === '/vue') {
                    response.writeHead(308, { Location: '/vue/' });
                    response.end();
                    return;
                }
                if (path !== '/vue/' && path !== '/vue/index.html') return serveDemoAsset('vue', path, response, next);
                if (!existsSync(index)) {
                    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
                    response.end('Build the Vue demo with npm run site:vue first.');
                    return;
                }
                if (integratedDev) void serveDemoIndex(server, index, response);
                else {
                    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    createReadStream(index).pipe(response);
                }
            });
        }
    }, {
        name: 'angular-demo-route',
        configureServer(server) {
            const integratedDev = isIntegratedSiteDev(command);
            const index = resolve(import.meta.dirname, 'public/angular/index.html');
            server.middlewares.use((request, response, next) => {
                const path = new URL(request.url, 'http://localhost').pathname;
                if (path === '/angular') {
                    response.writeHead(308, { Location: '/angular/' });
                    response.end();
                    return;
                }
                if (path !== '/angular/' && path !== '/angular/index.html') return serveDemoAsset('angular', path, response, next);
                if (!existsSync(index)) {
                    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
                    response.end('Build the Angular demo with npm run site:angular first.');
                    return;
                }
                if (integratedDev) {
                    void serveDemoIndex(server, index, response);
                    return;
                }
                response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                createReadStream(index).pipe(response);
            });

            if (!integratedDev) return;

            watchFrameworkDemos(server);
        }
    }],
    server: isIntegratedSiteDev(command) ? {
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
