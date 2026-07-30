import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="app">
      <h1 className="title">404</h1>
      <p className="muted">This page drifted off into the aether.</p>
      <Link to="/" className="ghost">
        ← Back home
      </Link>
    </main>
  );
}
