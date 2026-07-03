import { defineConfig, devices } from '@playwright/test';

const usesExternalServer = process.env.AMB_E2E_EXTERNAL_SERVER === '1';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.e2e.js',
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    reporter: [['list']],
    use: {
        baseURL: 'http://127.0.0.1:5173',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    webServer: usesExternalServer
        ? undefined
        : {
            command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',
            url: 'http://127.0.0.1:5173/src/demo/index.html',
            reuseExistingServer: !process.env.CI,
            timeout: 120000
        },
    projects: [
        {
            name: 'chrome',
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chrome'
            }
        }
    ]
});
