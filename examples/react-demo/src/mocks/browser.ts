import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

let workerStart: Promise<ServiceWorkerRegistration | undefined> | null = null;

export function startMockBackend(): Promise<ServiceWorkerRegistration | undefined> {
  if (workerStart) return workerStart;

  const worker = setupWorker(...handlers);
  workerStart = worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });

  return workerStart;
}
