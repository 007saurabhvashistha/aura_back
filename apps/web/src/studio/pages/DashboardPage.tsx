import { Heart, MessageSquare, Mic, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COMPANIONS, USER_COMPANIONS } from '../data/mock';

const LEVEL_TONE: Record<string, string> = {
  Stranger: 's-badge-neutral',
  Friend: 's-badge-cyan',
  'Close Friend': 's-badge-violet',
  'Best Friend': 's-badge-magenta',
  Soulmate: 's-badge-success',
};

export function DashboardPage() {
  const navigate = useNavigate();

  const trending = [...COMPANIONS].sort((a, b) => b.activeUsers - a.activeUsers).slice(0, 4);
  const recentlyUpdated = [...COMPANIONS].sort((a, b) => b.requestCount - a.requestCount).slice(0, 4);
  const favorites = COMPANIONS.filter((item) => ['sophia', 'maya', 'zara'].includes(item.id));

  return (
    <div>
      <motion.section
        className="s-wow-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div className="s-eyebrow" style={{ marginBottom: 10 }}>Aura OS</div>
          <h1 className="s-page-title">Good Evening, Saurabh 👋</h1>
          <p className="s-page-sub">Your companion universe is alive. Discover, assign, and build deeper relationships.</p>
        </div>
        <div className="s-wow-hero-actions">
          <button className="s-btn s-btn-glow" onClick={() => navigate('/studio/marketplace')}>Explore Companions</button>
          <button className="s-btn s-btn-ghost" onClick={() => navigate('/studio/requests')}>Review Requests</button>
        </div>
      </motion.section>

      <section style={{ marginBottom: 18 }}>
        <div className="s-between" style={{ marginBottom: 10 }}>
          <h2 style={{ fontSize: 18 }}>🔥 Trending Companions</h2>
          <button className="s-btn s-btn-soft s-btn-sm" onClick={() => navigate('/studio/marketplace')}>View All</button>
        </div>
        <div className="s-wow-rail">
          {trending.map((item) => (
            <article key={item.id} className="s-wow-card s-card s-card-hover" onClick={() => navigate(`/studio/companions/${item.id}`)}>
              <div className="s-wow-card-cover" style={{ background: item.gradient }}>
                <span className={`s-status-dot ${item.online ? 'online' : 'offline'}`} />
                <span className="s-badge s-badge-neutral">{item.online ? 'Online' : 'Offline'}</span>
              </div>
              <div className="s-wow-card-body">
                <div className="s-center" style={{ gap: 10 }}>
                  <div className="s-face" style={{ width: 42, height: 42, borderRadius: 12, background: item.gradient, fontSize: 19 }}>{item.emoji}</div>
                  <div>
                    <b>{item.name}</b>
                    <div className="s-dim" style={{ fontSize: 12 }}>{item.tagline}</div>
                  </div>
                </div>
                <div className="s-wow-mini-stats">
                  <span>⭐ {item.rating || '-'}</span>
                  <span>👥 {item.activeUsers.toLocaleString()}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="s-grid" style={{ gridTemplateColumns: '1.45fr 1fr', marginBottom: 18 }}>
        <section className="s-card s-card-pad">
          <div className="s-between" style={{ marginBottom: 10 }}>
            <h2 style={{ fontSize: 18 }}>💖 My Companions</h2>
            <button className="s-btn s-btn-ghost s-btn-sm" onClick={() => navigate('/studio/marketplace')}>Browse Now</button>
          </div>
          {!USER_COMPANIONS.length ? (
            <div className="s-empty-state">
              <h3>No Companion Yet</h3>
              <p className="s-page-sub">Explore companion library and request access.</p>
              <button className="s-btn s-btn-primary" onClick={() => navigate('/studio/marketplace')}>Browse Now</button>
            </div>
          ) : (
            <div className="s-col" style={{ gap: 12 }}>
              {USER_COMPANIONS.map((row) => {
                const item = COMPANIONS.find((c) => c.id === row.companionId);
                if (!item) return null;
                const xpPct = Math.min(100, Math.round((row.xp / row.xpToNext) * 100));
                return (
                  <article key={row.id} className="s-my-comp-row">
                    <div className="s-center" style={{ gap: 12 }}>
                      <div className="s-face" style={{ width: 48, height: 48, borderRadius: 14, background: item.gradient, fontSize: 20 }}>{item.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div className="s-dim" style={{ fontSize: 12 }}>Last chat: {row.lastChat}</div>
                      </div>
                    </div>
                    <div style={{ minWidth: 220 }}>
                      <div className="s-between" style={{ marginBottom: 6, fontSize: 12 }}>
                        <span>Relationship Level</span>
                        <span className={`s-badge ${LEVEL_TONE[row.relationshipLevel]}`}>{row.relationshipLevel}</span>
                      </div>
                      <div className="s-bar-track">
                        <div className="s-bar-fill" style={{ width: `${xpPct}%`, background: 'var(--s-grad)' }} />
                      </div>
                      <div className="s-dim" style={{ marginTop: 4, fontSize: 11.5 }}>XP {row.xp}/{row.xpToNext}</div>
                    </div>
                    <div className="s-my-comp-stats">
                      <span><MessageSquare size={13} /> {row.chats}</span>
                      <span><Mic size={13} /> {row.voiceCalls}</span>
                      <span><Heart size={13} /> {row.memories}</span>
                    </div>
                    <button className="s-btn s-btn-primary s-btn-sm">Open Chat</button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="s-card s-card-pad">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>📈 Platform Stats</h2>
          <div className="s-col" style={{ gap: 10 }}>
            <div className="s-platform-row">
              <span><Sparkles size={14} /> Active Companions</span>
              <b>124</b>
            </div>
            <div className="s-platform-row">
              <span><TrendingUp size={14} /> Trending This Week</span>
              <b>18</b>
            </div>
            <div className="s-platform-row">
              <span><Heart size={14} /> Most Loved Avg Rating</span>
              <b>4.8</b>
            </div>
            <div className="s-platform-row">
              <span><MessageSquare size={14} /> Daily Chats</span>
              <b>42.3K</b>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>❤️ Recently Updated</h3>
            <div className="s-col" style={{ gap: 8 }}>
              {recentlyUpdated.map((item) => (
                <button key={item.id} className="s-list-item-btn" onClick={() => navigate(`/studio/companions/${item.id}`)}>
                  <span className="s-center" style={{ gap: 8 }}>
                    <span className="s-face" style={{ width: 28, height: 28, borderRadius: 9, background: item.gradient, fontSize: 13 }}>{item.emoji}</span>
                    <span>{item.name}</span>
                  </span>
                  <span className="s-dim">{item.requestCount} req</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>⭐ Your Favorites</h3>
            <div className="s-fav-wrap">
              {favorites.map((item) => (
                <button key={item.id} className="s-chip" onClick={() => navigate(`/studio/companions/${item.id}`)}>
                  {item.emoji} {item.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
