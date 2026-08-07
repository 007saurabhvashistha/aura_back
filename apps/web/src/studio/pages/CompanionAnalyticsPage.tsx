import { Activity, Brain, Clock3, Heart, MessageSquare, Mic, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Ring, Sparkline } from '../components/ui';
import {
  MEMORY_GROWTH_SERIES,
  RETENTION_SERIES,
  SESSION_SERIES,
  VOICE_USAGE_SERIES,
  getCompanionById,
} from '../data/mock';

export function CompanionAnalyticsPage() {
  const params = useParams();
  const companion = getCompanionById(params.companionId ?? 'sophia');

  return (
    <div>
      <div className="s-page-head">
        <div>
          <div className="s-eyebrow" style={{ marginBottom: 8 }}>Companion Analytics</div>
          <h1 className="s-page-title">{companion.name} Performance Dashboard</h1>
          <p className="s-page-sub">Daily chats, retention, memory growth, voice usage, mood and relationship distribution.</p>
        </div>
      </div>

      <div className="s-grid s-grid-4" style={{ marginBottom: 14 }}>
        <article className="s-card s-card-pad">
          <div className="s-between"><span className="s-muted">Daily Chats</span><MessageSquare size={15} /></div>
          <div className="s-stat-value" style={{ fontSize: 30 }}>3,842</div>
          <Sparkline data={SESSION_SERIES} color="#22d3ee" width={210} height={42} />
        </article>
        <article className="s-card s-card-pad">
          <div className="s-between"><span className="s-muted">Avg Session</span><Clock3 size={15} /></div>
          <div className="s-stat-value" style={{ fontSize: 30 }}>18.6m</div>
          <Sparkline data={RETENTION_SERIES} color="#8b5cf6" width={210} height={42} />
        </article>
        <article className="s-card s-card-pad">
          <div className="s-between"><span className="s-muted">Voice Usage</span><Mic size={15} /></div>
          <div className="s-stat-value" style={{ fontSize: 30 }}>67%</div>
          <Sparkline data={VOICE_USAGE_SERIES} color="#e879f9" width={210} height={42} />
        </article>
        <article className="s-card s-card-pad">
          <div className="s-between"><span className="s-muted">Active Users</span><Users size={15} /></div>
          <div className="s-stat-value" style={{ fontSize: 30 }}>{companion.activeUsers.toLocaleString()}</div>
          <Sparkline data={MEMORY_GROWTH_SERIES} color="#34d399" width={210} height={42} />
        </article>
      </div>

      <div className="s-grid" style={{ gridTemplateColumns: '1.5fr 1fr', marginBottom: 14 }}>
        <article className="s-card s-card-pad">
          <h3 style={{ marginBottom: 10 }}>Mood Distribution</h3>
          <div className="s-grid s-grid-2">
            {[
              { mood: 'Happy', value: 34 },
              { mood: 'Calm', value: 29 },
              { mood: 'Focused', value: 21 },
              { mood: 'Reflective', value: 16 },
            ].map((item) => (
              <div key={item.mood} className="s-stat-block">
                <div className="s-between" style={{ marginBottom: 6 }}>
                  <span>{item.mood}</span>
                  <b>{item.value}%</b>
                </div>
                <div className="s-bar-track"><div className="s-bar-fill" style={{ width: `${item.value}%`, background: 'var(--s-grad-cv)' }} /></div>
              </div>
            ))}
          </div>

          <h3 style={{ margin: '14px 0 10px' }}>Most Asked Topics</h3>
          <div className="s-tag-wrap">
            {['Relationship Advice', 'Loneliness', 'Career Guidance', 'Daily Planning', 'Language Practice'].map((topic) => (
              <span key={topic} className="s-badge s-badge-violet">{topic}</span>
            ))}
          </div>

          <h3 style={{ margin: '14px 0 10px' }}>Relationship Level Distribution</h3>
          <div className="s-grid s-grid-2">
            {[
              { label: 'Stranger', value: 12 },
              { label: 'Friend', value: 28 },
              { label: 'Close Friend', value: 31 },
              { label: 'Best Friend', value: 22 },
              { label: 'Soulmate', value: 7 },
            ].map((level) => (
              <div key={level.label} className="s-stat-block">
                <div className="s-between" style={{ marginBottom: 6 }}>
                  <span>{level.label}</span>
                  <b>{level.value}%</b>
                </div>
                <div className="s-bar-track"><div className="s-bar-fill" style={{ width: `${level.value}%`, background: 'var(--s-grad-vm)' }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="s-card s-card-pad">
          <h3 style={{ marginBottom: 10 }}>System Health</h3>
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 10 }}>
            <Ring value={95} size={150} stroke={12} color="#8b5cf6">
              <div>
                <div style={{ fontSize: 30, fontWeight: 800 }}>95%</div>
                <div className="s-dim" style={{ fontSize: 12 }}>Overall</div>
              </div>
            </Ring>
          </div>

          <div className="s-col" style={{ gap: 8 }}>
            <div className="s-editor-doc-row"><span><Brain size={14} /> Memory Growth</span><b>+26%</b></div>
            <div className="s-editor-doc-row"><span><Heart size={14} /> Retention</span><b>79%</b></div>
            <div className="s-editor-doc-row"><span><Activity size={14} /> Heatmap Peaks</span><b>9PM - 1AM</b></div>
          </div>
        </article>
      </div>
    </div>
  );
}
