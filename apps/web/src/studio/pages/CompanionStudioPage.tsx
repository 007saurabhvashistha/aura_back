import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Edit3, Search, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COMPANIONS } from '../data/mock';

const GENDER = ['All', 'Female', 'Male', 'Non-binary'];
const VISIBILITY = ['All', 'Public', 'Private', 'Invite Only', 'Premium', 'Enterprise'];
const POPULARITY = ['All', '10K+', '5K+', '1K+'];

export function CompanionStudioPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('All');
  const [visibility, setVisibility] = useState('All');
  const [popularity, setPopularity] = useState('All');
  const [gender, setGender] = useState('All');

  const allLanguages = useMemo(() => ['All', ...new Set(COMPANIONS.flatMap((item) => item.languages))], []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMPANIONS.filter((companion) => {
      const searchMatch =
        !q ||
        companion.name.toLowerCase().includes(q) ||
        companion.category.toLowerCase().includes(q) ||
        companion.creator.toLowerCase().includes(q);
      const languageMatch = language === 'All' || companion.languages.includes(language);
      const visibilityMatch = visibility === 'All' || companion.visibility === visibility;
      const genderMatch = gender === 'All' || (gender === 'Female' && ['sophia', 'maya', 'zara'].includes(companion.id)) || (gender === 'Male' && ['alex', 'leo', 'kai'].includes(companion.id));
      const popularityMatch =
        popularity === 'All' ||
        (popularity === '10K+' && companion.followers >= 10000) ||
        (popularity === '5K+' && companion.followers >= 5000) ||
        (popularity === '1K+' && companion.followers >= 1000);

      return searchMatch && languageMatch && visibilityMatch && genderMatch && popularityMatch;
    });
  }, [gender, language, popularity, query, visibility]);

  return (
    <div>
      <div className="s-page-head">
        <div>
          <div className="s-eyebrow" style={{ marginBottom: 8 }}>Companion Studio</div>
          <h1 className="s-page-title">Companions</h1>
          <p className="s-page-sub">Admin-managed companion fleet with visibility, adoption, and quality controls.</p>
        </div>
        <button className="s-btn s-btn-glow" onClick={() => navigate('/studio/create')}>+ Create Companion</button>
      </div>

      <div className="s-filter-grid" style={{ marginBottom: 16 }}>
        <div className="s-search">
          <Search size={16} />
          <input placeholder="Search companion" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        <select className="s-select" value={language} onChange={(event) => setLanguage(event.target.value)}>
          {allLanguages.map((item) => <option key={item}>{item}</option>)}
        </select>

        <select className="s-select" value={gender} onChange={(event) => setGender(event.target.value)}>
          {GENDER.map((item) => <option key={item}>{item}</option>)}
        </select>

        <select className="s-select" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
          {VISIBILITY.map((item) => <option key={item}>{item}</option>)}
        </select>

        <select className="s-select" value={popularity} onChange={(event) => setPopularity(event.target.value)}>
          {POPULARITY.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="s-market-grid">
        {list.map((companion, index) => (
          <motion.article
            key={companion.id}
            className="s-market-card s-card s-card-hover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: index * 0.03 }}
          >
            <div className="s-market-card-cover" style={{ background: companion.gradient }}>
              <span className={`s-status-dot ${companion.online ? 'online' : 'offline'}`} />
              <span className="s-badge s-badge-neutral">{companion.status}</span>
            </div>

            <div className="s-market-card-body">
              <div className="s-between" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
                <div className="s-center" style={{ gap: 10 }}>
                  <div className="s-face" style={{ width: 44, height: 44, borderRadius: 12, background: companion.gradient, fontSize: 20 }}>{companion.emoji}</div>
                  <div>
                    <h3 style={{ fontSize: 16 }}>{companion.name}</h3>
                    <div className="s-dim" style={{ fontSize: 12 }}>Created by {companion.creator}</div>
                  </div>
                </div>
                <span className="s-badge s-badge-cyan">{companion.visibility}</span>
              </div>

              <p className="s-page-sub" style={{ fontSize: 13, marginTop: 0 }}>{companion.shortPersonality}</p>

              <div className="s-tag-wrap" style={{ marginBottom: 10 }}>
                {companion.personalityTags.map((tag) => <span key={tag} className="s-badge s-badge-violet">{tag}</span>)}
              </div>

              <div className="s-market-meta-row" style={{ marginBottom: 4 }}>
                <span className="s-center" style={{ gap: 4 }}><Star size={13} fill="currentColor" /> {companion.rating || '-'}</span>
                <span className="s-center" style={{ gap: 4 }}><Users size={13} /> {companion.activeUsers.toLocaleString()}</span>
              </div>
              <div className="s-market-meta-row s-dim" style={{ fontSize: 12, marginBottom: 12 }}>
                <span>Languages: {companion.languages.join(', ')}</span>
                <span>{companion.voiceLabel}</span>
              </div>

              <div className="s-row" style={{ gap: 8 }}>
                <button className="s-btn s-btn-primary s-btn-sm" onClick={() => navigate(`/studio/companions/${companion.id}`)}>
                  <ArrowRight size={13} /> Details
                </button>
                <button className="s-btn s-btn-soft s-btn-sm" onClick={() => navigate(`/studio/companions/${companion.id}/editor`)}>
                  <Edit3 size={13} /> Edit
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
