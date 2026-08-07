import { useId } from 'react';
import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/* ── Sparkline (area) ─────────────────────────────────────────── */
export function Sparkline({
  data,
  color = '#22d3ee',
  height = 44,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const gid = useId().replace(/:/g, '');
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 6) - 3]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Progress ring (donut) ────────────────────────────────────── */
export function Ring({
  value,
  size = 92,
  stroke = 9,
  color = '#8b5cf6',
  track = 'rgba(255,255,255,0.08)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const gid = useId().replace(/:/g, '');
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={`ring-${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${gid})`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  icon,
  gradient,
  trend,
  trendUp = true,
  series,
  seriesColor,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  gradient: string;
  trend?: string;
  trendUp?: boolean;
  series?: number[];
  seriesColor?: string;
  delay?: number;
}) {
  return (
    <div className="s-card s-card-pad s-card-hover s-anim-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="s-stat">
        <div className="s-stat-top">
          <div className="s-stat-icon" style={{ background: gradient }}>{icon}</div>
          {trend && (
            <span className={`s-trend ${trendUp ? 'up' : 'down'}`}>
              {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {trend}
            </span>
          )}
        </div>
        <div>
          <div className="s-stat-label">{label}</div>
          <div className="s-stat-value">{value}</div>
        </div>
        {series && (
          <div style={{ marginTop: 2 }}>
            <Sparkline data={series} color={seriesColor ?? '#22d3ee'} width={220} height={40} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Toggle switch ────────────────────────────────────────────── */
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" className={`s-switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} />;
}

/* ── Voice preview button (animated equalizer) ────────────────── */
export function VoicePreview({ label = 'Voice' }: { label?: string }) {
  return (
    <button className="s-voice-btn" type="button">
      <span className="s-voice-bars">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </span>
      {label}
    </button>
  );
}
