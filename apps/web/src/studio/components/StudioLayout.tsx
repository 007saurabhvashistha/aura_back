import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudioSidebar } from './StudioSidebar';
import { StudioTopbar } from './StudioTopbar';
import '../studio.css';

export function StudioLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="studio-root">
      <div className="studio-shell">
        <StudioSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="studio-main">
          <StudioTopbar />
          <main className="studio-content">
            <div className="studio-content-inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
