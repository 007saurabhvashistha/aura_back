import { Route, Routes } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import { AdminLayout } from '../components/AdminLayout';
import { AdminDashboard } from '../pages/AdminDashboard';
import { UsersPage } from '../pages/UsersPage';
import { AgentsPage } from '../pages/AgentsPage';
import { ConversationsPage } from '../pages/ConversationsPage';
import { SessionsPage } from '../pages/SessionsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { LogsPage } from '../pages/LogsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function AdminRoutes() {
  return (
    <AdminRoute>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AdminLayout>
    </AdminRoute>
  );
}
