import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VoicePreview } from '../components/ui';
import { COMPANIONS, MARKETPLACE_SECTIONS } from '../data/mock';

const SECTION_EMOJI: Record<string, string> = {
  Featured: '⭐',
  Trending: '🔥',
  'Most Loved': '❤️',
  'Best Listener': '🧠',
  'Business Mentor': '💼',
  'Study Buddy': '📚',
  'Gaming Partner': '🎮',
  'Language Coach': '🌍',
  Roleplay: '🎭',
  'New Arrivals': '✨',
};

function pickForSection(section: string) {
  switch (section) {
    case 'Featured':
      return COMPANIONS.filter((item) => item.premium || item.releaseTag === 'Staff Pick');
    case 'Trending':
      return COMPANIONS.filter((item) => item.releaseTag === 'Trending');
    case 'Most Loved':
      return [...COMPANIONS].sort((a, b) => b.rating - a.rating).slice(0, 5);
    case 'Best Listener':
      return COMPANIONS.filter((item) => item.personalityTags.includes('Listener') || item.personalityTags.includes('Empathetic'));
    case 'Business Mentor':
      return COMPANIONS.filter((item) => item.category === 'Professional');
    case 'Study Buddy':
      return COMPANIONS.filter((item) => item.category === 'Education');
    case 'Gaming Partner':
      return COMPANIONS.filter((item) => item.category === 'Gaming');
    case 'Language Coach':
      return COMPANIONS.filter((item) => item.languages.length >= 2);
    case 'Roleplay':
      return COMPANIONS.filter((item) => item.personalityTags.includes('Playful') || item.personalityTags.includes('Romantic'));
    case 'New Arrivals':
      return COMPANIONS.filter((item) => item.releaseTag === 'New');
    default:
      return COMPANIONS;
  }
}

export function MarketplacePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const sectionRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MARKETPLACE_SECTIONS.map((section) => {
      const data = pickForSection(section).filter((item) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.tagline.toLowerCase().includes(q) ||
          item.personalityTags.join(' ').toLowerCase().includes(q)
        );
      });
      return { section, data };
    }).filter((row) => row.data.length > 0);
  }, [query]);

  return (
    <div>
      <motion.div
        className="s-market-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <div className="s-eyebrow" style={{ marginBottom: 8 }}>Explore Companions</div>
          <h1 className="s-page-title">Your Companion Marketplace</h1>
          <p className="s-page-sub">Character AI discovery with emotional depth and premium matching.</p>
        </div>
        <div className="s-search" style={{ width: 330 }}>
          <Search size={16} />
          <input
            placeholder="Search by name, personality, language"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </motion.div>

      <div className="s-col" style={{ gap: 18 }}>
        {sectionRows.map((row, rowIndex) => (
          <section key={row.section}>
            <div className="s-between" style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 18 }}>
                {SECTION_EMOJI[row.section]} {row.section}
              </h2>
              <span className="s-dim" style={{ fontSize: 12 }}>{row.data.length} companions</span>
            </div>

            <div className="s-market-rail">
              {row.data.map((item, index) => (
                <motion.article
                  key={`${row.section}-${item.id}`}
                  className="s-market-card s-card s-card-hover"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: rowIndex * 0.03 + index * 0.02 }}
                >
                  <div className="s-market-card-cover" style={{ background: item.gradient }}>
                    <span className={`s-status-dot ${item.online ? 'online' : 'offline'}`} />
                    <div className="s-market-badges">
                      <span className="s-badge s-badge-neutral">{item.online ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>

                  <div className="s-market-card-body">
                    <div className="s-center" style={{ gap: 10, marginBottom: 10 }}>
                      <div className="s-face s-comp-av" style={{ width: 52, height: 52, borderRadius: 14, background: item.gradient, fontSize: 21 }}>
                        {item.emoji}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16 }}>{item.name}</h3>
                        <div className="s-dim" style={{ fontSize: 12 }}>{item.tagline}</div>
                      </div>
                    </div>

                    <div className="s-market-meta-row" style={{ marginBottom: 8 }}>
                      <span className="s-center" style={{ gap: 4 }}><Star size={13} fill="currentColor" /> {item.rating || '-'}</span>
                      <span className="s-center" style={{ gap: 4 }}><Users size={13} /> {item.activeUsers.toLocaleString()}</span>
                    </div>

                    <div className="s-tag-wrap" style={{ marginBottom: 10 }}>
                      {item.personalityTags.map((tag) => (
                        <span key={tag} className="s-badge s-badge-violet">{tag}</span>
                      ))}
                    </div>

                    <div className="s-tag-wrap" style={{ marginBottom: 12 }}>
                      {item.languages.map((language) => (
                        <span key={language} className="s-badge s-badge-cyan">{language}</span>
                      ))}
                    </div>

                    <div className="s-between" style={{ gap: 8 }}>
                      <VoicePreview label={item.voiceLabel} />
                      <button className="s-btn s-btn-primary s-btn-sm" onClick={() => navigate(`/studio/companions/${item.id}`)}>
                        Meet Me
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
