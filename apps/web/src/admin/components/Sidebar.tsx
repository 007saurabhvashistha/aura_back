import { Link, useLocation } from 'react-router-dom';
import type { NavItem } from '../types/admin';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'AI Agents', href: '/admin/agents' },
  { label: 'Conversations', href: '/admin/conversations' },
  { label: 'Sessions', href: '/admin/sessions' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Settings', href: '/admin/settings' },
  { label: 'System Logs', href: '/admin/logs' },
];

interface SidebarProps {
  isOpen: boolean;
}

function NavIcon({ label }: { label: string }) {
  const icons: Record<string, React.ReactNode> = {
    Dashboard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-3m2 3l-2 3m2-3v6m9-11l2-3m2 3l-2 3m2-3v6M3 20h18M3 4h18v12a3 3 0 01-3 3H6a3 3 0 01-3-3V4z" />
      </svg>
    ),
    Users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'AI Agents': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    Conversations: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    Sessions: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Analytics: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    Settings: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      </svg>
    ),
    'System Logs': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  };
  return icons[label] || null;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();

  return (
    <nav
      className={`fixed top-0 left-0 h-screen bg-admin-bg-primary border-r border-admin-border transition-all duration-300 z-40 overflow-y-auto ${
        isOpen ? 'w-64' : 'w-0 -translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="pt-8 px-6 pb-8 border-b border-admin-border sticky top-0 bg-admin-bg-primary z-10">
        <h1 className="text-xl font-bold text-admin-text-primary mb-1">
          Aura
        </h1>
        <p className="text-xs text-secondary font-medium">Admin Console</p>
      </div>

      {/* Navigation */}
      <ul className="space-y-1 px-3 py-6">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group text-sm font-medium ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 shadow-sm'
                    : 'text-secondary hover:text-admin-text-primary hover:bg-admin-bg-tertiary'
                }`}
              >
                <span className={`transition-colors ${isActive ? 'text-primary-600' : 'text-secondary group-hover:text-admin-text-primary'}`}>
                  <NavIcon label={item.label} />
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-admin-border bg-gradient-to-t from-admin-bg-secondary to-transparent">
        <p className="text-xs text-secondary text-center leading-relaxed">
          <span className="block font-semibold text-admin-text-primary">Aura v0.1.0</span>
          <span>Sprint 4: Admin Platform</span>
        </p>
      </div>
    </nav>
  );
}
