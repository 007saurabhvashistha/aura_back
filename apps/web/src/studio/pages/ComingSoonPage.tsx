import { Sparkles } from 'lucide-react';

export function ComingSoonPage({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <div className="s-page-head">
        <div className="s-anim-in">
          <div className="s-eyebrow" style={{ marginBottom: 8 }}>Aura Studio</div>
          <h1 className="s-page-title">{title}</h1>
          <p className="s-page-sub">{sub}</p>
        </div>
      </div>
      <div className="s-card s-card-pad s-anim-in" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div className="s-face" style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--s-grad)', margin: '0 auto 20px', fontSize: 30 }}>
          <Sparkles size={30} />
        </div>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>{title} is coming next</h2>
        <p className="s-page-sub" style={{ maxWidth: 460, margin: '0 auto' }}>
          This module is part of the Aura Studio roadmap. The design system, navigation and flows are ready — screens land in the next iteration.
        </p>
      </div>
    </div>
  );
}
