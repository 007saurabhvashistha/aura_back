import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { HealthStatus } from '@aura/shared';
import { useAuth } from '../auth/AuthContext';
import { fetchHealth } from '../lib/api';

export function HomePage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((h) => active && setHealth(h))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const onboarding = profile?.onboarding;

  return (
    <main className="app">
      <div className="orb" aria-hidden="true" />
      <header className="home-header">
        <h1 className="title">Aura</h1>
        <div className="home-actions">
          <Link to="/profile" className="ghost">
            Profile
          </Link>
          <button
            type="button"
            className="ghost"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <p className="tagline">
        Welcome{profile?.profile.displayName ? `, ${profile.profile.displayName}` : ''} — voice-first,
        memory-driven.
      </p>

      {onboarding && !onboarding.complete && (
        <section className="banner">
          <p>Please complete your profile to get the full experience.</p>
          <Link to="/onboarding">Finish setup →</Link>
        </section>
      )}

      <section className="status-card">
        <h2>Account</h2>
        <ul className="status-list">
          <li>
            <span>Email</span>
            <strong>{user?.email ?? '—'}</strong>
          </li>
          <li>
            <span>Age verified</span>
            <strong>{profile?.profile.isAgeVerified ? 'yes' : 'no'}</strong>
          </li>
          <li>
            <span>Onboarding</span>
            <strong>{onboarding?.complete ? 'complete' : 'incomplete'}</strong>
          </li>
          <li>
            <span>Backend</span>
            <strong className={health ? 'up' : 'muted'}>{health?.status ?? '…'}</strong>
          </li>
        </ul>
      </section>
    </main>
  );
}
