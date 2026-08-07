import { Routes, Route } from 'react-router-dom';
import { StudioLayout } from '../components/StudioLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { CompanionStudioPage } from '../pages/CompanionStudioPage';
import { MarketplacePage } from '../pages/MarketplacePage';
import { RequestsPage } from '../pages/RequestsPage';
import { CompanionDetailPage } from '../pages/CompanionDetailPage';
import { CompanionEditorPage } from '../pages/CompanionEditorPage';
import { CompanionAnalyticsPage } from '../pages/CompanionAnalyticsPage';
import { ModuleWorkspacePage } from '../pages/ModuleWorkspacePage';

export function StudioRoutes() {
  return (
    <Routes>
      <Route element={<StudioLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="companions" element={<CompanionStudioPage />} />
        <Route path="create" element={<CompanionEditorPage mode="create" />} />
        <Route path="companions/:companionId" element={<CompanionDetailPage />} />
        <Route path="companions/:companionId/editor" element={<CompanionEditorPage mode="edit" />} />
        <Route path="companions/:companionId/analytics" element={<CompanionAnalyticsPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="users" element={<ModuleWorkspacePage moduleKey="users" />} />
        <Route path="conversations" element={<ModuleWorkspacePage moduleKey="conversations" />} />
        <Route path="brain" element={<ModuleWorkspacePage moduleKey="brain" />} />
        <Route path="personality" element={<ModuleWorkspacePage moduleKey="personality" />} />
        <Route path="memory" element={<ModuleWorkspacePage moduleKey="memory" />} />
        <Route path="knowledge" element={<ModuleWorkspacePage moduleKey="knowledge" />} />
        <Route path="voice" element={<ModuleWorkspacePage moduleKey="voice" />} />
        <Route path="avatar" element={<ModuleWorkspacePage moduleKey="avatar" />} />
        <Route path="analytics" element={<CompanionAnalyticsPage />} />
        <Route path="settings" element={<ModuleWorkspacePage moduleKey="settings" />} />
        <Route path="*" element={<ModuleWorkspacePage moduleKey="notFound" />} />
      </Route>
    </Routes>
  );
}
