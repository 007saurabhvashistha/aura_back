import { useAuth } from '../../auth/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { Button } from './Button';

interface TopbarProps {
  onSidebarToggle: () => void;
}

export function Topbar({ onSidebarToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 bg-admin-bg-primary border-b border-admin-border px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        <button
          onClick={onSidebarToggle}
          className="p-2 hover:bg-admin-bg-tertiary rounded-lg transition-all duration-200 text-admin-text-secondary hover:text-admin-text-primary"
          title="Toggle sidebar"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 6h16M4 12h16M4 18h16" 
            />
          </svg>
        </button>
        <div>
          <h2 className="text-sm font-semibold text-admin-text-primary">Admin Console</h2>
          <p className="text-xs text-secondary">Aura Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="p-2 hover:bg-admin-bg-tertiary rounded-lg transition-all duration-200 text-admin-text-secondary hover:text-admin-text-primary"
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? (
            <svg 
              className="w-5 h-5" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zm12-1.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V11.25a.75.75 0 01.75-.75zM7.5 20.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75z" />
            </svg>
          ) : (
            <svg 
              className="w-5 h-5" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-admin-border"></div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-admin-text-primary">
              {user?.email?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-xs text-secondary">Administrator</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-xs"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
