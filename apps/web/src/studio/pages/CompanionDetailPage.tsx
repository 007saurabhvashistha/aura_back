import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { VoicePreview } from '../components/ui';
import { getCompanionById, USE_CASE_OPTIONS } from '../data/mock';

const TABS = ['About', 'Personality', 'Voice', 'Gallery', 'Reviews', 'Example Chats', 'Memories'] as const;
type ProfileTab = (typeof TABS)[number];

export function CompanionDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const companion = getCompanionById(params.companionId ?? 'sophia');

  const [activeTab, setActiveTab] = useState<ProfileTab>('About');
  const [requestOpen, setRequestOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [useCase, setUseCase] = useState<(typeof USE_CASE_OPTIONS)[number]>('Friendship');
  const [submitted, setSubmitted] = useState(false);

  const stars = useMemo(() => '★★★★★', []);

  return (
    <div>
      <motion.header
        className="s-profile-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="s-profile-head">
          <div className="s-face" style={{ width: 108, height: 108, borderRadius: 28, background: companion.gradient, fontSize: 44 }}>
            {companion.emoji}
          </div>

          <div>
            <h1 className="s-page-title" style={{ marginBottom: 6 }}>{companion.name}</h1>
            <p className="s-page-sub" style={{ marginTop: 0 }}>{companion.tagline}</p>
            <div className="s-dim" style={{ marginTop: 8, fontSize: 13 }}>{stars} {companion.rating} · {companion.followers.toLocaleString()} Friends</div>
            <div className="s-dim" style={{ marginTop: 4, fontSize: 12.5 }}>Created by {companion.creator}</div>

            <div className="s-tag-wrap" style={{ marginTop: 12 }}>
              {companion.personalityTags.map((tag) => (
                <span key={tag} className="s-badge s-badge-violet">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="s-btn s-btn-ghost" onClick={() => navigate('/studio/marketplace')}>Back</button>
          <button className="s-btn s-btn-soft" onClick={() => navigate(`/studio/companions/${companion.id}/analytics`)}>Analytics</button>
          <button className="s-btn s-btn-glow" onClick={() => setRequestOpen(true)}>Request Companion</button>
        </div>
      </motion.header>

      <div className="s-profile-tabs">
        {TABS.map((tab) => (
          <button key={tab} className={`s-chip ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      <section className="s-card s-card-pad">
        {activeTab === 'About' && (
          <div className="s-grid s-grid-2">
            <div>
              <h3 style={{ marginBottom: 8 }}>Introduction</h3>
              <p className="s-page-sub">{companion.shortPersonality} I am here for long conversations, emotional support, and practical daily help with genuine continuity.</p>
            </div>
            <div>
              <h3 style={{ marginBottom: 8 }}>Capabilities</h3>
              <div className="s-tag-wrap">
                {['Deep Conversation', 'Voice Companion', 'Mood-aware Replies', 'Long-term Memory'].map((x) => (
                  <span key={x} className="s-badge s-badge-cyan">{x}</span>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="s-dim" style={{ fontSize: 12 }}>Availability</div>
                <b>{companion.availability}</b>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Personality' && (
          <div className="s-grid s-grid-3">
            {[
              { label: 'Humor', value: 74 },
              { label: 'Confidence', value: 69 },
              { label: 'Empathy', value: 92 },
              { label: 'Energy', value: 67 },
              { label: 'Boundaries', value: 89 },
              { label: 'Flirting Level', value: 61 },
            ].map((item) => (
              <article key={item.label} className="s-stat-block">
                <div className="s-between" style={{ marginBottom: 6 }}>
                  <span>{item.label}</span>
                  <b>{item.value}%</b>
                </div>
                <div className="s-bar-track"><div className="s-bar-fill" style={{ width: `${item.value}%`, background: 'var(--s-grad)' }} /></div>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'Voice' && (
          <div className="s-grid s-grid-2">
            <div>
              <h3 style={{ marginBottom: 8 }}>Voice Demo</h3>
              <p className="s-page-sub">Warm pacing, expressive pauses, and high emotional variance tuned for natural rapport.</p>
              <VoicePreview label={`${companion.voiceLabel} · Play Demo`} />
            </div>
            <div className="s-tag-wrap">
              {companion.languages.map((lang) => (
                <span key={lang} className="s-badge s-badge-cyan">Language: {lang}</span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Gallery' && (
          <div className="s-gallery-grid">
            {[1, 2, 3, 4].map((slot) => (
              <div key={slot} className="s-gallery-item" style={{ background: companion.gradient }}>
                <span>{companion.emoji}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="s-col" style={{ gap: 10 }}>
            {[
              'Feels like talking to someone who truly remembers me.',
              'The voice warmth is incredible during late-night chats.',
              'Best emotional AI I have used so far.',
            ].map((review) => (
              <article key={review} className="s-review-item">
                <span className="s-badge s-badge-warning"><Star size={11} /> 5.0</span>
                <p style={{ margin: 8 }}>{review}</p>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'Example Chats' && (
          <div className="s-col" style={{ gap: 8 }}>
            <div className="s-bubble ai">You sounded tired today. Want a 2-minute reset together?</div>
            <div className="s-bubble me">Yeah please. I had a rough day.</div>
            <div className="s-bubble ai">I am here. Breathe in slowly for 4... hold... now release. Better?</div>
          </div>
        )}

        {activeTab === 'Memories' && (
          <div className="s-col" style={{ gap: 10 }}>
            {['Today', 'Yesterday', 'Last Week', 'Important Memory', 'Pinned Memory'].map((label) => (
              <div key={label} className="s-memory-row">
                <b>{label}</b>
                <span className="s-dim">Public highlight snapshot</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {requestOpen && (
        <div className="s-modal-scrim" role="dialog" aria-modal="true">
          <div className="s-modal-card s-card">
            <div className="s-card-head" style={{ marginBottom: 12 }}>
              <div>
                <h3>Request Companion</h3>
                <p className="s-page-sub">Send your request for admin approval.</p>
              </div>
              <button className="s-iconbtn" onClick={() => setRequestOpen(false)}>×</button>
            </div>

            {!submitted ? (
              <>
                <label className="s-label">Reason (optional)</label>
                <textarea
                  className="s-textarea"
                  placeholder="Why do you want this companion?"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />

                <label className="s-label" style={{ marginTop: 12 }}>Use Case</label>
                <div className="s-tag-wrap">
                  {USE_CASE_OPTIONS.map((item) => (
                    <button
                      key={item}
                      className={`s-chip ${useCase === item ? 'active' : ''}`}
                      onClick={() => setUseCase(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="s-between" style={{ marginTop: 16 }}>
                  <button className="s-btn s-btn-ghost" onClick={() => setRequestOpen(false)}>Cancel</button>
                  <button className="s-btn s-btn-primary" onClick={() => setSubmitted(true)}>Submit Request</button>
                </div>
              </>
            ) : (
              <div className="s-submit-success">
                <div className="s-empty-icon"><MessageCircle size={18} /></div>
                <h3>Request Submitted</h3>
                <p className="s-page-sub">Your request is now in Pending. Admin will approve or reject soon.</p>
                <button className="s-btn s-btn-glow" onClick={() => setRequestOpen(false)}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
