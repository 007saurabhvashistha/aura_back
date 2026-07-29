import { useEffect, useState } from 'react';
import type { HealthStatus } from '@aura/shared';
import { fetchHealth } from './lib/api';
import './App.css';

type ConnectionState =
  | { kind: 'loading' }
  | { kind: 'ok'; health: HealthStatus }
  | { kind: 'error'; message: string };

function App() {
  const [state, setState] = useState<ConnectionState>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((health) => active && setState({ kind: 'ok', health }))
      .catch((err: unknown) =>
        active &&
        setState({ kind: 'error', message: err instanceof Error ? err.message : 'Unknown error' }),
      );
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app">
      <div className="orb" aria-hidden="true" />
      <h1 className="title">Aura</h1>
      <p className="tagline">An AI Relationship Platform — voice-first, memory-driven.</p>

      <section className="status-card">
        <h2>Backend status</h2>
        {state.kind === 'loading' && <p className="muted">Connecting to API…</p>}
        {state.kind === 'error' && (
          <p className="down">API unreachable: {state.message}</p>
        )}
        {state.kind === 'ok' && (
          <ul className="status-list">
            <li>
              <span>Service</span>
              <strong>{state.health.service}</strong>
            </li>
            <li>
              <span>Status</span>
              <strong className="up">{state.health.status}</strong>
            </li>
            <li>
              <span>Database</span>
              <strong>{state.health.database}</strong>
            </li>
            <li>
              <span>Version</span>
              <strong>{state.health.version}</strong>
            </li>
          </ul>
        )}
      </section>

      <footer className="footer">Sprint 0 — Foundation</footer>
    </main>
  );
}

export default App;
