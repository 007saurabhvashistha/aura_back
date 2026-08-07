import { Search, Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function StudioTopbar() {
  const navigate = useNavigate();
  return (
    <header className="s-topbar">
      <div className="s-search">
        <Search size={17} />
        <input placeholder="Search companions, users, requests…" />
        <kbd>⌘K</kbd>
      </div>

      <div className="s-topbar-spacer" />

      <button className="s-btn s-btn-ghost s-btn-sm" onClick={() => navigate('/studio/create')}>
        <Plus size={16} />
        New
      </button>

      <button className="s-iconbtn" aria-label="Notifications">
        <Bell size={18} />
        <span className="s-dot" />
      </button>

      <button className="s-avatar-chip">
        <span className="s-av">AU</span>
        <span>
          <b>Admin</b>
          <small>Owner</small>
        </span>
      </button>
    </header>
  );
}
