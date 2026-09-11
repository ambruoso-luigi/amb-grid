import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startMockBackend } from './mocks/browser';
import './styles.css';

export function mountReactDemo(container: HTMLElement) {
  const root = createRoot(container);
  let active = true;

  void startMockBackend().then(() => {
    if (!active) return;
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }).catch((error: unknown) => {
    if (!active) return;
    const message = error instanceof Error ? error.message : 'Mock backend non disponibile.';
    root.render(<p className="react-demo-bootstrap-error" role="alert">{message}</p>);
  });

  return () => {
    active = false;
    root.unmount();
  };
}
