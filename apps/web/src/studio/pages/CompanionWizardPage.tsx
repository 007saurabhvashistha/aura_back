import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Image as ImageIcon, AudioLines, Brain, Sparkles, BookOpen, Save,
  ShieldCheck, Globe, Rocket, ChevronLeft, ChevronRight, Check, X, Upload,
  Wand2, Play, FileText, Link2, StickyNote, Heart, Target, MessageCircle,
} from 'lucide-react';
import { Toggle } from '../components/ui';

interface Draft {
  name: string;
  nickname: string;
  gender: string;
  age: string;
  category: string;
  emoji: string;
  gradient: string;
  languages: string[];
  avatarMethod: string;
  voice: string;
  pitch: number;
  speed: number;
  emotion: string;
  traits: Record<string, number>;
  identity: string;
  speakingStyle: string[];
  memory: Record<string, boolean>;
  forgetPolicy: string;
  nsfw: boolean;
  medical: boolean;
  political: boolean;
  visibility: string;
  maxUsers: string;
  autoApprove: boolean;
  requestForm: boolean;
}

const STEPS = [
  { key: 'identity', label: 'Identity', hint: 'Name & basics', icon: User },
  { key: 'avatar', label: 'Avatar', hint: 'Face & look', icon: ImageIcon },
  { key: 'voice', label: 'Voice', hint: 'Sound & tone', icon: AudioLines },
  { key: 'brain', label: 'Brain', hint: 'Intelligence', icon: Brain },
  { key: 'personality', label: 'Personality', hint: 'Character', icon: Sparkles },
  { key: 'knowledge', label: 'Knowledge', hint: 'Sources', icon: BookOpen },
  { key: 'memory', label: 'Memory', hint: 'What it recalls', icon: Save },
  { key: 'safety', label: 'Safety', hint: 'Guardrails', icon: ShieldCheck },
  { key: 'availability', label: 'Availability', hint: 'Access & limits', icon: Globe },
  { key: 'publish', label: 'Publish', hint: 'Go live', icon: Rocket },
] as const;

const CATEGORIES = ['Romantic', 'Friends', 'Professional', 'Education', 'Healthcare', 'Gaming', 'Travel', 'Religion'];
const LANGS = ['EN', 'ES', 'FR', 'DE', 'HI', 'AR', 'JP', 'ZH'];
const VOICES = [
  { id: 'aria', name: 'Aria', desc: 'Warm · Feminine', g: 'linear-gradient(135deg,#fb7185,#e879f9)' },
  { id: 'nova', name: 'Nova', desc: 'Bright · Youthful', g: 'linear-gradient(135deg,#22d3ee,#3b82f6)' },
  { id: 'sage', name: 'Sage', desc: 'Calm · Neutral', g: 'linear-gradient(135deg,#34d399,#22d3ee)' },
  { id: 'orion', name: 'Orion', desc: 'Deep · Masculine', g: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' },
];
const TRAITS = ['Creativity', 'Empathy', 'Humor', 'Confidence', 'Curiosity', 'Intelligence'];
const STYLES = ['Warm', 'Playful', 'Formal', 'Witty', 'Poetic', 'Direct', 'Encouraging', 'Flirty'];
const GRADIENTS = [
  'linear-gradient(135deg,#fb7185,#e879f9)',
  'linear-gradient(135deg,#22d3ee,#3b82f6)',
  'linear-gradient(135deg,#34d399,#22d3ee)',
  'linear-gradient(135deg,#8b5cf6,#e879f9)',
  'linear-gradient(135deg,#f59e0b,#fb7185)',
  'linear-gradient(135deg,#22d3ee,#8b5cf6)',
];
const VISIBILITY = [
  { key: 'Public', desc: 'Anyone can discover & chat' },
  { key: 'Private', desc: 'Only you can access' },
  { key: 'Invite Only', desc: 'Access via invite link' },
  { key: 'Premium', desc: 'Paid subscribers only' },
  { key: 'Enterprise', desc: 'Assigned to an org' },
];

const KNOWLEDGE_SOURCES = [
  { icon: FileText, label: 'PDF Documents', hint: 'Upload up to 50MB' },
  { icon: Globe, label: 'Website', hint: 'Crawl a public URL' },
  { icon: StickyNote, label: 'Notion', hint: 'Connect a workspace' },
  { icon: FileText, label: 'Docs', hint: 'Google / Word docs' },
  { icon: Link2, label: 'URLs', hint: 'Paste reference links' },
];

const INITIAL: Draft = {
  name: '', nickname: '', gender: 'Female', age: '25', category: 'Friends',
  emoji: '✨', gradient: GRADIENTS[3], languages: ['EN'],
  avatarMethod: 'ai', voice: 'aria', pitch: 50, speed: 50, emotion: 'Warm',
  traits: { Creativity: 70, Empathy: 85, Humor: 60, Confidence: 65, Curiosity: 75, Intelligence: 80 },
  identity: '', speakingStyle: ['Warm', 'Playful'],
  memory: { names: true, preferences: true, events: true },
  forgetPolicy: '30 days of inactivity', nsfw: false, medical: false, political: false,
  visibility: 'Public', maxUsers: 'Unlimited', autoApprove: true, requestForm: false,
};

/* ── Small building blocks ────────────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="s-field">
      <label className="s-label">{label}</label>
      {children}
      {hint && <span className="s-hint">{hint}</span>}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub }: { icon: typeof User; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="s-center" style={{ gap: 12, marginBottom: 6 }}>
        <div className="s-stat-icon" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--s-grad-cv)' }}>
          <Icon size={20} color="#06121a" />
        </div>
        <h2 style={{ fontSize: 22 }}>{title}</h2>
      </div>
      <p className="s-page-sub">{sub}</p>
    </div>
  );
}

export function CompanionWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(INITIAL);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const progress = Math.round(((step + 1) / STEPS.length) * 100);
  const active = STEPS[step].key;

  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const readiness = useMemo(() => {
    let done = 0;
    if (d.name) done++;
    if (d.avatarMethod) done++;
    if (d.voice) done++;
    if (d.identity) done++;
    if (d.speakingStyle.length) done++;
    return Math.round((done / 5) * 100);
  }, [d]);

  return (
    <div className="studio-content" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="s-wizard">
        {/* ── Rail ── */}
        <div className="s-wizard-rail">
          <button className="s-btn s-btn-ghost s-btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/studio/companions')}>
            <ChevronLeft size={15} /> Exit
          </button>
          <div className="s-eyebrow" style={{ marginBottom: 10 }}>New Companion</div>
          <div className="s-between" style={{ marginBottom: 6 }}>
            <span className="s-dim" style={{ fontSize: 12 }}>Step {step + 1} of {STEPS.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--s-cyan)' }}>{progress}%</span>
          </div>
          <div className="s-progress-track" style={{ marginBottom: 20 }}>
            <div className="s-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="s-col" style={{ gap: 2 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const state = i === step ? 'active' : i < step ? 'done' : '';
              return (
                <div key={s.key} className={`s-step ${state}`} onClick={() => setStep(i)}>
                  <div className="s-step-num">{i < step ? <Check size={14} /> : <Icon size={14} />}</div>
                  <div className="s-step-label">
                    <b>{s.label}</b>
                    <span>{s.hint}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main ── */}
        <div className="s-wizard-main">
          <div key={active} className="s-anim-in" style={{ maxWidth: 640 }}>
            {active === 'identity' && (
              <>
                <SectionTitle icon={User} title="Identity" sub="Give your companion a name and a place in the world." />
                <div className="s-grid s-grid-2" style={{ marginBottom: 18 }}>
                  <Field label="Name"><input className="s-input" placeholder="e.g. Sophia" value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
                  <Field label="Nickname" hint="Optional pet name"><input className="s-input" placeholder="e.g. Soph" value={d.nickname} onChange={(e) => set('nickname', e.target.value)} /></Field>
                  <Field label="Gender">
                    <div className="s-seg" style={{ width: '100%' }}>
                      {['Female', 'Male', 'Non-binary'].map((g) => (
                        <button key={g} className={d.gender === g ? 'active' : ''} style={{ flex: 1 }} onClick={() => set('gender', g)}>{g}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Age"><input className="s-input" type="number" value={d.age} onChange={(e) => set('age', e.target.value)} /></Field>
                </div>
                <Field label="Category">
                  <div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {CATEGORIES.map((c) => (
                      <button key={c} className={`s-chip ${d.category === c ? 'active' : ''}`} onClick={() => set('category', c)}>{c}</button>
                    ))}
                  </div>
                </Field>
                <div style={{ height: 18 }} />
                <Field label="Languages" hint="Select all your companion speaks">
                  <div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                    {LANGS.map((l) => (
                      <button key={l} className={`s-chip ${d.languages.includes(l) ? 'active' : ''}`} onClick={() => set('languages', toggleIn(d.languages, l))}>{l}</button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {active === 'avatar' && (
              <>
                <SectionTitle icon={ImageIcon} title="Avatar" sub="Choose how your companion looks." />
                <div className="s-grid s-grid-3" style={{ marginBottom: 24 }}>
                  {[
                    { id: 'upload', icon: Upload, t: 'Upload', s: 'Use your own image' },
                    { id: 'ai', icon: Wand2, t: 'AI Generate', s: 'Describe & create' },
                    { id: 'creator', icon: User, t: 'Character Creator', s: 'Build from scratch' },
                  ].map((o) => {
                    const Icon = o.icon;
                    return (
                      <div key={o.id} className={`s-optcard ${d.avatarMethod === o.id ? 'active' : ''}`} onClick={() => set('avatarMethod', o.id)} style={{ alignItems: 'flex-start' }}>
                        <div className="s-stat-icon" style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(139,92,246,0.18)', color: '#c4b5fd' }}><Icon size={18} /></div>
                        <b style={{ fontSize: 14 }}>{o.t}</b>
                        <span className="s-dim" style={{ fontSize: 12 }}>{o.s}</span>
                      </div>
                    );
                  })}
                </div>
                <Field label="Accent color"><div className="s-center" style={{ gap: 10, flexWrap: 'wrap' }}>
                  {GRADIENTS.map((g) => (
                    <button key={g} onClick={() => set('gradient', g)} style={{ width: 46, height: 46, borderRadius: 13, background: g, border: d.gradient === g ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', boxShadow: d.gradient === g ? '0 0 0 3px rgba(255,255,255,0.15)' : 'none' }} />
                  ))}
                </div></Field>
                <div style={{ height: 18 }} />
                <Field label="Emoji mark"><div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {['✨', '❤️', '🌙', '🎓', '🧘', '💼', '🎮', '👩', '🕊️'].map((e) => (
                    <button key={e} className={`s-chip ${d.emoji === e ? 'active' : ''}`} style={{ fontSize: 18, padding: '6px 12px' }} onClick={() => set('emoji', e)}>{e}</button>
                  ))}
                </div></Field>
              </>
            )}

            {active === 'voice' && (
              <>
                <SectionTitle icon={AudioLines} title="Voice" sub="Pick a voice and fine-tune how it speaks." />
                <div className="s-grid s-grid-2" style={{ marginBottom: 22 }}>
                  {VOICES.map((v) => (
                    <div key={v.id} className={`s-optcard ${d.voice === v.id ? 'active' : ''}`} onClick={() => set('voice', v.id)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <div className="s-face" style={{ width: 42, height: 42, borderRadius: 12, background: v.g, fontSize: 16 }}><AudioLines size={18} /></div>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 14 }}>{v.name}</b>
                        <div className="s-dim" style={{ fontSize: 12 }}>{v.desc}</div>
                      </div>
                      <button className="s-iconbtn" style={{ width: 34, height: 34 }}><Play size={15} /></button>
                    </div>
                  ))}
                </div>
                <div className="s-col" style={{ gap: 18, marginBottom: 20 }}>
                  {([['pitch', 'Pitch'], ['speed', 'Speed']] as const).map(([k, lbl]) => (
                    <div key={k} className="s-trait">
                      <div className="s-trait-head"><b>{lbl}</b><span className="s-trait-val">{d[k]}%</span></div>
                      <input className="s-range" type="range" min={0} max={100} value={d[k]} onChange={(e) => set(k, Number(e.target.value))} />
                    </div>
                  ))}
                </div>
                <Field label="Emotion"><div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {['Warm', 'Calm', 'Excited', 'Serious', 'Playful'].map((e) => (
                    <button key={e} className={`s-chip ${d.emotion === e ? 'active' : ''}`} onClick={() => set('emotion', e)}>{e}</button>
                  ))}
                </div></Field>
              </>
            )}

            {active === 'brain' && (
              <>
                <SectionTitle icon={Brain} title="Brain" sub="Shape the intelligence and temperament of your companion." />
                <div className="s-col" style={{ gap: 22 }}>
                  {TRAITS.map((t) => (
                    <div key={t} className="s-trait">
                      <div className="s-trait-head"><b>{t}</b><span className="s-trait-val">{d.traits[t]}</span></div>
                      <input className="s-range" type="range" min={0} max={100} value={d.traits[t]}
                        onChange={(e) => set('traits', { ...d.traits, [t]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {active === 'personality' && (
              <>
                <SectionTitle icon={Sparkles} title="Personality" sub="Define character, voice and boundaries." />
                <Field label="Identity" hint="A short description of who they are">
                  <textarea className="s-textarea" placeholder="Sophia is a caring, emotionally intelligent companion who…" value={d.identity} onChange={(e) => set('identity', e.target.value)} />
                </Field>
                <div style={{ height: 18 }} />
                <Field label="Speaking style"><div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {STYLES.map((s) => (
                    <button key={s} className={`s-chip ${d.speakingStyle.includes(s) ? 'active' : ''}`} onClick={() => set('speakingStyle', toggleIn(d.speakingStyle, s))}>{s}</button>
                  ))}
                </div></Field>
                <div className="s-grid s-grid-2" style={{ marginTop: 18 }}>
                  <Field label="Likes"><input className="s-input" placeholder="Music, deep talks…" /></Field>
                  <Field label="Dislikes"><input className="s-input" placeholder="Rudeness, spam…" /></Field>
                </div>
                <div style={{ marginTop: 18 }}>
                  <Field label="Goals"><div className="s-center" style={{ gap: 8, padding: '12px 14px', borderRadius: 12, background: 'var(--s-bg-2)', border: '1px solid var(--s-border)' }}>
                    <Target size={16} color="#22d3ee" /><span className="s-muted" style={{ fontSize: 13 }}>Make every user feel heard, supported and understood.</span>
                  </div></Field>
                </div>
              </>
            )}

            {active === 'knowledge' && (
              <>
                <SectionTitle icon={BookOpen} title="Knowledge" sub="Feed your companion sources it can learn from." />
                <div className="s-col" style={{ gap: 12 }}>
                  {KNOWLEDGE_SOURCES.map((k) => {
                    const Icon = k.icon;
                    return (
                      <div key={k.label} className="s-card s-card-hover" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                        <div className="s-stat-icon" style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(34,211,238,0.14)', color: '#22d3ee' }}><Icon size={19} /></div>
                        <div style={{ flex: 1 }}>
                          <b style={{ fontSize: 14 }}>{k.label}</b>
                          <div className="s-dim" style={{ fontSize: 12 }}>{k.hint}</div>
                        </div>
                        <button className="s-btn s-btn-ghost s-btn-sm"><Upload size={14} /> Add</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {active === 'memory' && (
              <>
                <SectionTitle icon={Save} title="Memory" sub="Decide what your companion remembers over time." />
                <div className="s-col" style={{ gap: 12, marginBottom: 22 }}>
                  {[
                    { k: 'names', t: 'Remember names', s: 'Recall the user and people they mention' },
                    { k: 'preferences', t: 'Remember preferences', s: 'Likes, dislikes and habits' },
                    { k: 'events', t: 'Remember events', s: 'Birthdays, milestones, past moments' },
                  ].map((m) => (
                    <div key={m.k} className="s-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="s-stat-icon" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.16)', color: '#c4b5fd' }}><Sparkles size={18} /></div>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 14 }}>{m.t}</b>
                        <div className="s-dim" style={{ fontSize: 12 }}>{m.s}</div>
                      </div>
                      <Toggle on={d.memory[m.k]} onChange={(v) => set('memory', { ...d.memory, [m.k]: v })} />
                    </div>
                  ))}
                </div>
                <Field label="Forget policy">
                  <select className="s-select" value={d.forgetPolicy} onChange={(e) => set('forgetPolicy', e.target.value)}>
                    <option>Never forget</option>
                    <option>30 days of inactivity</option>
                    <option>90 days of inactivity</option>
                    <option>End of each session</option>
                  </select>
                </Field>
              </>
            )}

            {active === 'safety' && (
              <>
                <SectionTitle icon={ShieldCheck} title="Safety" sub="Set guardrails and content boundaries." />
                <Field label="Allowed topics"><div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {['Wellness', 'Relationships', 'Study', 'Career', 'Hobbies', 'Motivation'].map((t) => (
                    <span key={t} className="s-badge s-badge-success" style={{ padding: '6px 12px' }}><Check size={11} /> {t}</span>
                  ))}
                </div></Field>
                <div style={{ height: 18 }} />
                <Field label="Restricted topics"><div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {['Self-harm', 'Illegal advice', 'Explicit violence'].map((t) => (
                    <span key={t} className="s-badge s-badge-danger" style={{ padding: '6px 12px' }}><X size={11} /> {t}</span>
                  ))}
                </div></Field>
                <div className="s-col" style={{ gap: 12, marginTop: 22 }}>
                  {[
                    { k: 'nsfw' as const, t: 'Allow NSFW content', s: 'Mature themes for adult users' },
                    { k: 'medical' as const, t: 'Medical guidance', s: 'Provide general health information' },
                    { k: 'political' as const, t: 'Political topics', s: 'Discuss politics & current events' },
                  ].map((s) => (
                    <div key={s.k} className="s-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="s-stat-icon" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(251,191,36,0.16)', color: '#fbbf24' }}><ShieldCheck size={18} /></div>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 14 }}>{s.t}</b>
                        <div className="s-dim" style={{ fontSize: 12 }}>{s.s}</div>
                      </div>
                      <Toggle on={d[s.k]} onChange={(v) => set(s.k, v)} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {active === 'availability' && (
              <>
                <SectionTitle icon={Globe} title="Availability" sub="Control who can access this companion and how." />
                <Field label="Visibility">
                  <div className="s-grid s-grid-2" style={{ gap: 12 }}>
                    {VISIBILITY.map((v) => (
                      <div key={v.key} className={`s-optcard ${d.visibility === v.key ? 'active' : ''}`} onClick={() => set('visibility', v.key)}>
                        <b style={{ fontSize: 14 }}>{v.key}</b>
                        <span className="s-dim" style={{ fontSize: 12 }}>{v.desc}</span>
                      </div>
                    ))}
                  </div>
                </Field>
                <div style={{ height: 20 }} />
                <Field label="Maximum users"><div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {['Unlimited', '100', '500', '1000', 'VIP Only'].map((m) => (
                    <button key={m} className={`s-chip ${d.maxUsers === m ? 'active' : ''}`} onClick={() => set('maxUsers', m)}>{m}</button>
                  ))}
                </div></Field>
                <div className="s-col" style={{ gap: 12, marginTop: 20 }}>
                  <div className="s-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>Auto approve</b><div className="s-dim" style={{ fontSize: 12 }}>Instantly grant access without review</div></div>
                    <Toggle on={d.autoApprove} onChange={(v) => set('autoApprove', v)} />
                  </div>
                  <div className="s-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>Require request form</b><div className="s-dim" style={{ fontSize: 12 }}>Ask users why they want access</div></div>
                    <Toggle on={d.requestForm} onChange={(v) => set('requestForm', v)} />
                  </div>
                </div>
              </>
            )}

            {active === 'publish' && (
              <>
                <SectionTitle icon={Rocket} title="Publish" sub="Review everything and launch your companion." />
                <div className="s-card s-card-pad" style={{ marginBottom: 18 }}>
                  <div className="s-center" style={{ gap: 16 }}>
                    <div className="s-face" style={{ width: 68, height: 68, borderRadius: 18, background: d.gradient, fontSize: 30 }}>{d.emoji}</div>
                    <div>
                      <h2 style={{ fontSize: 22 }}>{d.name || 'Untitled Companion'}</h2>
                      <p className="s-page-sub" style={{ marginTop: 2 }}>{d.category} · {d.visibility} · {d.languages.join(' / ')}</p>
                    </div>
                  </div>
                  <hr className="s-divider" style={{ margin: '18px 0' }} />
                  <div className="s-grid s-grid-3" style={{ gap: 14 }}>
                    {[['Voice', d.voice], ['Emotion', d.emotion], ['Max users', d.maxUsers], ['Auto approve', d.autoApprove ? 'On' : 'Off'], ['Empathy', String(d.traits.Empathy)], ['Memory', 'Enabled']].map(([k, v]) => (
                      <div key={k}><div className="s-dim" style={{ fontSize: 12 }}>{k}</div><b style={{ fontSize: 14, textTransform: 'capitalize' }}>{v}</b></div>
                    ))}
                  </div>
                </div>
                <div className="s-card s-card-pad" style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.08),rgba(139,92,246,0.1))' }}>
                  <div className="s-between" style={{ marginBottom: 8 }}>
                    <b style={{ fontSize: 14 }}>Setup completeness</b>
                    <span style={{ fontWeight: 700, color: 'var(--s-cyan)' }}>{readiness}%</span>
                  </div>
                  <div className="s-progress-track"><div className="s-progress-fill" style={{ width: `${readiness}%` }} /></div>
                </div>
                <button className="s-btn s-btn-glow s-btn-lg" style={{ width: '100%', marginTop: 20 }}>
                  <Rocket size={18} /> Launch Companion
                </button>
              </>
            )}
          </div>

          {/* Footer nav */}
          <div className="s-between" style={{ maxWidth: 640, marginTop: 40, paddingTop: 22, borderTop: '1px solid var(--s-border)' }}>
            <button className="s-btn s-btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ChevronLeft size={16} /> Back
            </button>
            <div className="s-center" style={{ gap: 8 }}>
              <button className="s-btn s-btn-soft"><Save size={15} /> Save draft</button>
              {step < STEPS.length - 1 ? (
                <button className="s-btn s-btn-primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button className="s-btn s-btn-glow" onClick={() => navigate('/studio/companions')}>
                  <Check size={16} /> Finish
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Live preview ── */}
        <div className="s-wizard-preview">
          <div className="s-eyebrow" style={{ marginBottom: 14 }}>Live Preview</div>
          <div className="s-phone">
            <div className="s-phone-hero" style={{ background: d.gradient }}>
              <div style={{ textAlign: 'center', color: '#fff', zIndex: 1 }}>
                <div style={{ fontSize: 44 }}>{d.emoji}</div>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div className="s-center" style={{ gap: 8 }}>
                <h3 style={{ fontSize: 17 }}>{d.name || 'Your Companion'}</h3>
                <span className="s-badge s-badge-violet">Lv.1</span>
              </div>
              <p className="s-dim" style={{ fontSize: 12.5, marginTop: 2 }}>{d.category} Companion</p>
              <div className="s-center" style={{ gap: 6, flexWrap: 'wrap', margin: '10px 0 14px' }}>
                {d.speakingStyle.slice(0, 3).map((s) => <span key={s} className="s-badge s-badge-cyan">{s}</span>)}
              </div>
              <div className="s-col" style={{ gap: 8 }}>
                <div className="s-bubble ai">Hi{d.nickname ? `, I'm ${d.nickname}` : ''}! I'm {d.name || 'your companion'}. How are you feeling today? 💫</div>
                <div className="s-bubble me">Honestly, a little tired.</div>
                <div className="s-bubble ai">I hear you. Let's take it slow — I'm right here with you.</div>
              </div>
            </div>
          </div>

          <div className="s-card s-card-pad" style={{ marginTop: 16 }}>
            <div className="s-between" style={{ marginBottom: 10 }}>
              <b style={{ fontSize: 13 }}>Brain profile</b>
              <MessageCircle size={15} color="#8b5cf6" />
            </div>
            <div className="s-col" style={{ gap: 9 }}>
              {['Empathy', 'Humor', 'Creativity'].map((t) => (
                <div key={t} className="s-col" style={{ gap: 5 }}>
                  <div className="s-between" style={{ fontSize: 12 }}><span className="s-muted">{t}</span><b>{d.traits[t]}</b></div>
                  <div className="s-bar-track"><div className="s-bar-fill" style={{ width: `${d.traits[t]}%`, background: 'var(--s-grad-vm)' }} /></div>
                </div>
              ))}
            </div>
            <div className="s-center" style={{ gap: 8, marginTop: 14, padding: '10px 12px', borderRadius: 10, background: 'var(--s-bg-2)' }}>
              <Heart size={15} color="#fb7185" />
              <span className="s-dim" style={{ fontSize: 12 }}>Ready to build emotional connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
