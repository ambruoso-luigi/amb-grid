import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const server = await createServer({
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true
    }
});

const runPlaywright = () => {
    return new Promise(resolve => {
        const child = spawn(
            process.execPath,
            ['./node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
            {
                env: {
                    ...process.env,
                    AMB_E2E_EXTERNAL_SERVER: '1'
                },
                stdio: 'inherit'
            }
        );

        child.on('exit', code => {
            resolve(code ?? 1);
        });
        child.on('error', error => {
            console.error(error);
            resolve(1);
        });
    });
};

let exitCode = 1;

try {
    await server.listen();
    exitCode = await runPlaywright();
} finally {
    await server.close();
}

process.exit(exitCode);
