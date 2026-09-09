import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

export function mountReactDemo(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  return () => root.unmount();
}
