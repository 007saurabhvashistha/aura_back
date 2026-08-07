import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Bot, Inbox, Users, MessagesSquare,
  BarChart3, Settings, Plus, ChevronLeft, Sparkles,
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: { to: string; label: string; icon: typeof Bot; badge?: string }[];
}

const NAV: NavGroup[] = [
  {
    label: 'Companion Studio',
    items: [
      { to: '/studio', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/studio/companions', label: 'Companions', icon: Bot },
      { to: '/studio/requests', label: 'Requests', icon: Inbox, badge: '4' },
      { to: '/studio/users', label: 'Users', icon: Users },
      { to: '/studio/conversations', label: 'Conversations', icon: MessagesSquare },
      { to: '/studio/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/studio/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function StudioSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`s-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="s-brand">
        <div className="s-brand-mark">
          <Sparkles size={20} />
        </div>
        <div className="s-brand-text">
          <b>Aura Studio</b>
          <span>Creator Console</span>
        </div>
        <button
          className="s-iconbtn"
          onClick={onToggle}
          style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 9 }}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} />
        </button>
      </div>

      <div style={{ padding: '4px 12px 8px' }}>
        <NavLink to="/studio/create" className="s-btn s-btn-glow" style={{ width: '100%' }}>
          <Plus size={17} />
          {!collapsed && <span>Create Companion</span>}
        </NavLink>
      </div>

      <nav className="s-nav">
        {NAV.map((group) => (
          <div key={group.label}>
            <div className="s-nav-label">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/studio'}
                  className={({ isActive }) => `s-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={19} strokeWidth={1.9} />
                  <span className="s-nav-text">{item.label}</span>
                  {item.badge && <span className="s-nav-badge">{item.badge}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="s-side-card">
        <h5>✨ Aura Pro</h5>
        <p>Unlock advanced brain tuning, evolution & analytics.</p>
        <button className="s-btn s-btn-primary s-btn-sm" style={{ width: '100%' }}>Upgrade</button>
      </div>
    </aside>
  );
}
