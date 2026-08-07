import { motion } from 'framer-motion';
import { BarChart3, Bot, Brain, Database, MessageSquare, Mic, Settings, Shield, Sparkles, Users } from 'lucide-react';

const moduleMap = {
  users: { title: 'Users', sub: 'Subscriber health, lifecycle, and trust controls.', icon: Users },
  conversations: { title: 'Conversations', sub: 'Conversation quality, escalation trends, and channel diagnostics.', icon: MessageSquare },
  brain: { title: 'Brain', sub: 'Reasoning orchestration, routing policy, and cost-latency control.', icon: Brain },
  personality: { title: 'Personality', sub: 'Trait templates, emotional vectors, and tuning profiles.', icon: Sparkles },
  memory: { title: 'Memory', sub: 'Retention strategy, summarization, and semantic recall confidence.', icon: Database },
  knowledge: { title: 'Knowledge', sub: 'Sources, ingestion state, and grounding quality.', icon: Shield },
  voice: { title: 'Voice', sub: 'Voice packs, language expansion, and QA playback.', icon: Mic },
  avatar: { title: 'Avatar', sub: 'Identity sets, visual styling, and media governance.', icon: Bot },
  analytics: { title: 'Analytics', sub: 'Revenue, engagement, quality, and operational KPIs.', icon: BarChart3 },
  settings: { title: 'Settings', sub: 'Workspace governance, billing, and platform switches.', icon: Settings },
  notFound: { title: 'Workspace', sub: 'This area maps into Aura Studio operating modules.', icon: Settings },
} as const;

type ModuleKey = keyof typeof moduleMap;

export function ModuleWorkspacePage({ moduleKey }: { moduleKey: ModuleKey }) {
  const config = moduleMap[moduleKey] ?? moduleMap.notFound;
  const Icon = config.icon;

  return (
    <div>
      <motion.div className="s-page-head" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="s-eyebrow" style={{ marginBottom: 8 }}>Aura Studio Module</div>
          <h1 className="s-page-title">{config.title}</h1>
          <p className="s-page-sub">{config.sub}</p>
        </div>
      </motion.div>

      <div className="s-grid s-grid-3">
        {[
          'Operational Overview',
          'Live Controls',
          'Safety & Compliance',
          'Quality Signals',
          'Growth Levers',
          'Automation Rules',
        ].map((card, index) => (
          <motion.article
            key={card}
            className="s-card s-card-pad s-card-hover"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
          >
            <div className="s-center" style={{ gap: 10, marginBottom: 10 }}>
              <div className="s-stat-icon" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.16)', color: '#c4b5fd' }}>
                <Icon size={18} />
              </div>
              <h3 style={{ fontSize: 15 }}>{card}</h3>
            </div>
            <p className="s-page-sub" style={{ marginTop: 0 }}>
              Production-ready panel for {config.title.toLowerCase()} with real-time controls and state visibility.
            </p>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
