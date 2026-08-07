import { useMemo, useState } from 'react';
import { Brain, CheckCircle2, Mic, UploadCloud, Wand2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { VoicePreview, Toggle } from '../components/ui';
import { getCompanionById } from '../data/mock';

const STEPS = ['Identity', 'Brain', 'Appearance', 'Voice Lab', 'Safety', 'Preview'];
const AVATAR_STYLES = ['Anime', 'Realistic', '3D', 'Pixel', 'Luxury', 'Corporate', 'Fantasy'];
const BRAIN_MODULES = ['Memory', 'Emotion', 'Knowledge', 'Safety', 'Reflection', 'Thinking', 'Planning', 'Humor', 'Boundaries', 'Goals', 'Relationship'];

function brainHealth(module: string) {
  const value = 72 + (module.length % 5) * 6;
  return Math.min(98, value);
}

export function CompanionEditorPage({ mode = 'edit' }: { mode?: 'create' | 'edit' }) {
  const params = useParams();
  const companion = getCompanionById(params.companionId ?? 'sophia');

  const [step, setStep] = useState('Identity');
  const [pitch, setPitch] = useState(58);
  const [speed, setSpeed] = useState(64);
  const [warmth, setWarmth] = useState(82);
  const [emotion, setEmotion] = useState(76);
  const [laugh, setLaugh] = useState(38);
  const [pause, setPause] = useState(35);
  const [breathing, setBreathing] = useState(49);
  const [thinkingDepth, setThinkingDepth] = useState(74);
  const [creativity, setCreativity] = useState(70);
  const [privateMode, setPrivateMode] = useState(false);

  const identityScore = useMemo(() => 91, []);

  return (
    <div>
      <div className="s-page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="s-eyebrow" style={{ marginBottom: 8 }}>{mode === 'create' ? 'Create Companion' : 'Companion Studio'}</div>
          <h1 className="s-page-title">Apple-level Companion Editor</h1>
          <p className="s-page-sub">Left for steps, center for precise controls, right for live behavior preview.</p>
        </div>
        <div className="s-center" style={{ gap: 8 }}>
          <button className="s-btn s-btn-ghost">Save Draft</button>
          <button className="s-btn s-btn-primary">Publish</button>
        </div>
      </div>

      <section className="s-editor-shell">
        <aside className="s-editor-steps s-card">
          <div className="s-card-pad" style={{ paddingBottom: 10 }}>
            <h3 style={{ fontSize: 15 }}>Steps</h3>
          </div>
          <div className="s-col" style={{ gap: 6, padding: '0 14px 14px' }}>
            {STEPS.map((item, index) => (
              <button key={item} className={`s-step-btn ${step === item ? 'active' : ''}`} onClick={() => setStep(item)}>
                <span>{index + 1}</span>
                <b>{item}</b>
              </button>
            ))}
          </div>
        </aside>

        <main className="s-editor-center s-card s-card-pad">
          <div className="s-between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 16 }}>{step}</h3>
            <span className="s-badge s-badge-success"><CheckCircle2 size={12} /> Live Synced</span>
          </div>

          <div className="s-col" style={{ gap: 16 }}>
            <section>
              <h4 style={{ marginBottom: 8 }}>Avatar Builder</h4>
              <div className="s-tab-inline">
                <button className="s-chip active">Upload</button>
                <button className="s-chip">Generate</button>
                <button className="s-chip">Gallery</button>
              </div>

              <div className="s-avatar-builder-grid">
                <div className="s-avatar-dropzone">
                  <UploadCloud size={20} />
                  <b>Upload Avatar</b>
                  <span>PNG / JPG up to 8MB</span>
                </div>

                <div className="s-card" style={{ padding: 12 }}>
                  <label className="s-label">Prompt</label>
                  <textarea className="s-textarea" placeholder="Elegant companion portrait, cinematic lighting..." />
                  <div className="s-tag-wrap" style={{ marginTop: 8 }}>
                    {AVATAR_STYLES.map((style) => (
                      <button key={style} className="s-chip">{style}</button>
                    ))}
                  </div>
                  <button className="s-btn s-btn-soft s-btn-sm" style={{ marginTop: 8 }}><Wand2 size={14} /> Generate</button>
                </div>
              </div>
            </section>

            <section>
              <h4 style={{ marginBottom: 8 }}>Voice Lab</h4>
              <div className="s-grid s-grid-2">
                {[
                  { key: 'Pitch', value: pitch, setter: setPitch },
                  { key: 'Speed', value: speed, setter: setSpeed },
                  { key: 'Warmth', value: warmth, setter: setWarmth },
                  { key: 'Emotion', value: emotion, setter: setEmotion },
                  { key: 'Laugh', value: laugh, setter: setLaugh },
                  { key: 'Pause', value: pause, setter: setPause },
                  { key: 'Breathing', value: breathing, setter: setBreathing },
                ].map((control) => (
                  <div key={control.key} className="s-trait">
                    <div className="s-trait-head"><b>{control.key}</b><span className="s-trait-val">{control.value}%</span></div>
                    <input className="s-range" type="range" min={0} max={100} value={control.value} onChange={(event) => control.setter(Number(event.target.value))} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <VoicePreview label="Preview Voice" />
              </div>
            </section>

            <section>
              <h4 style={{ marginBottom: 8 }}>Brain Studio</h4>
              <div className="s-grid s-grid-2">
                {BRAIN_MODULES.map((module) => {
                  const health = brainHealth(module);
                  return (
                    <article key={module} className="s-brain-module">
                      <div className="s-between" style={{ marginBottom: 6 }}>
                        <b>{module}</b>
                        <span className="s-badge s-badge-cyan">{health}%</span>
                      </div>
                      <div className="s-bar-track"><div className="s-bar-fill" style={{ width: `${health}%`, background: 'var(--s-grad-cv)' }} /></div>
                    </article>
                  );
                })}
              </div>

              <div className="s-grid s-grid-2" style={{ marginTop: 12 }}>
                <div className="s-trait">
                  <div className="s-trait-head"><b>Thinking Depth</b><span className="s-trait-val">{thinkingDepth}%</span></div>
                  <input className="s-range" type="range" min={0} max={100} value={thinkingDepth} onChange={(event) => setThinkingDepth(Number(event.target.value))} />
                </div>
                <div className="s-trait">
                  <div className="s-trait-head"><b>Creativity</b><span className="s-trait-val">{creativity}%</span></div>
                  <input className="s-range" type="range" min={0} max={100} value={creativity} onChange={(event) => setCreativity(Number(event.target.value))} />
                </div>
              </div>
            </section>

            <section>
              <h4 style={{ marginBottom: 8 }}>Permissions</h4>
              <div className="s-tag-wrap" style={{ marginBottom: 8 }}>
                <button className="s-chip active">Public</button>
                <button className="s-chip">Private</button>
                <button className="s-chip">Invite Only</button>
              </div>
              <div className="s-between s-editor-doc-row">
                <span>Private Mode</span>
                <Toggle on={privateMode} onChange={setPrivateMode} />
              </div>
            </section>
          </div>
        </main>

        <aside className="s-editor-right s-card s-card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Live Preview</h3>

          <div className="s-live-phone">
            <div className="s-live-phone-header" style={{ background: companion.gradient }}>
              <div className="s-face" style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', fontSize: 20 }}>{companion.emoji}</div>
              <div>
                <b>{companion.name}</b>
                <div className="s-dim" style={{ fontSize: 11.5 }}>{companion.online ? 'Online now' : 'Offline'}</div>
              </div>
            </div>
            <div className="s-live-chat">
              <div className="s-bubble ai">I can sense your energy feels low today. Want a quick reset?</div>
              <div className="s-bubble me">Yes please.</div>
              <div className="s-bubble ai">Great. Breathe in for 4, hold for 4, release for 6.</div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <h4 style={{ marginBottom: 8 }}>Voice Test</h4>
            <VoicePreview label="Play Sample" />
          </div>

          <div className="s-col" style={{ gap: 8, marginTop: 12 }}>
            <div className="s-editor-doc-row"><span>Identity Score</span><b>{identityScore}%</b></div>
            <div className="s-editor-doc-row"><span>Brain Health</span><b>94%</b></div>
            <div className="s-editor-doc-row"><span>Safety Ready</span><b>99%</b></div>
          </div>

          <div className="s-between" style={{ marginTop: 12 }}>
            <button className="s-btn s-btn-ghost s-btn-sm"><Mic size={14} /> Voice Clone</button>
            <button className="s-btn s-btn-glow s-btn-sm"><Brain size={14} /> Publish</button>
          </div>
        </aside>
      </section>
    </div>
  );
}
