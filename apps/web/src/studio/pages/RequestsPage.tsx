import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, Search, ShieldAlert, X } from 'lucide-react';
import { REQUESTS } from '../data/mock';

type LaneKey = 'pending' | 'approved' | 'rejected';

const lanes: Array<{ key: LaneKey; label: string; tone: string }> = [
  { key: 'pending', label: 'Pending', tone: 's-badge-warning' },
  { key: 'approved', label: 'Approved', tone: 's-badge-success' },
  { key: 'rejected', label: 'Rejected', tone: 's-badge-danger' },
];

function priorityTone(priority: 'Low' | 'Medium' | 'High') {
  if (priority === 'High') return 's-badge-danger';
  if (priority === 'Medium') return 's-badge-warning';
  return 's-badge-cyan';
}

export function RequestsPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(REQUESTS);
  const [selected, setSelected] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((request) => {
      if (!q) return true;
      return (
        request.user.toLowerCase().includes(q) ||
        request.requestedCompanion.toLowerCase().includes(q) ||
        request.reason.toLowerCase().includes(q) ||
        request.useCase.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const grouped = useMemo(() => ({
    pending: filtered.filter((request) => request.status === 'pending'),
    approved: filtered.filter((request) => request.status === 'approved'),
    rejected: filtered.filter((request) => request.status === 'rejected'),
  }), [filtered]);

  function updateStatus(ids: string[], status: LaneKey) {
    if (!ids.length) return;
    setItems((prev) => prev.map((item) => (ids.includes(item.id) ? { ...item, status } : item)));
    setSelected((prev) => prev.filter((id) => !ids.includes(id)));
  }

  function toggleSelected(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div>
      <div className="s-page-head">
        <div>
          <div className="s-eyebrow" style={{ marginBottom: 8 }}>Companion Access Governance</div>
          <h1 className="s-page-title">Requests</h1>
          <p className="s-page-sub">Kanban workflow with drag and drop assignment plus bulk moderation.</p>
        </div>

        <div className="s-center" style={{ gap: 8, flexWrap: 'wrap' }}>
          <div className="s-search" style={{ width: 280 }}>
            <Search size={15} />
            <input placeholder="Search user, companion, use case" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <button className="s-btn s-btn-primary" onClick={() => updateStatus(selected, 'approved')}>Bulk Approve</button>
          <button className="s-btn s-btn-ghost" onClick={() => updateStatus(selected, 'rejected')}>Bulk Reject</button>
        </div>
      </div>

      <div className="s-dim" style={{ fontSize: 12, marginBottom: 10 }}>Selected: {selected.length}</div>

      <div className="s-kanban">
        {lanes.map((lane, laneIndex) => (
          <motion.section
            key={lane.key}
            className="s-kanban-col s-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, delay: laneIndex * 0.05 }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggingId) return;
              updateStatus([draggingId], lane.key);
              setDraggingId(null);
            }}
          >
            <div className="s-kanban-head">
              <h3>{lane.label}</h3>
              <span className={`s-badge ${lane.tone}`}>{grouped[lane.key].length}</span>
            </div>

            <div className="s-kanban-list">
              {grouped[lane.key].map((request, index) => (
                <motion.article
                  key={request.id}
                  className={`s-request-card ${selected.includes(request.id) ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  draggable
                  onDragStart={() => setDraggingId(request.id)}
                >
                  <div className="s-between" style={{ alignItems: 'flex-start' }}>
                    <div className="s-center" style={{ gap: 10 }}>
                      <input type="checkbox" checked={selected.includes(request.id)} onChange={() => toggleSelected(request.id)} />
                      <span className="s-face" style={{ width: 34, height: 34, fontSize: 12, borderRadius: 10, background: 'var(--s-grad-vm)' }}>{request.avatar}</span>
                      <div>
                        <b style={{ fontSize: 13.5 }}>{request.user}</b>
                        <div className="s-dim" style={{ fontSize: 11.5 }}>{request.requestedDate}</div>
                      </div>
                    </div>
                    <span className={`s-badge ${priorityTone(request.priority)}`}>{request.priority}</span>
                  </div>

                  <div className="s-request-grid">
                    <div>
                      <div className="s-dim">Companion</div>
                      <b>{request.requestedCompanion}</b>
                    </div>
                    <div>
                      <div className="s-dim">Use Case</div>
                      <b>{request.useCase}</b>
                    </div>
                  </div>

                  <div>
                    <div className="s-dim" style={{ marginBottom: 4 }}>Reason</div>
                    <p className="s-page-sub" style={{ margin: 0, fontSize: 12.5 }}>{request.reason}</p>
                  </div>

                  <div className="s-request-actions">
                    <button className="s-btn s-btn-primary s-btn-sm" onClick={() => updateStatus([request.id], 'approved')}><Check size={13} /> Approve</button>
                    <button className="s-btn s-btn-ghost s-btn-sm" onClick={() => updateStatus([request.id], 'rejected')}><X size={13} /> Reject</button>
                    <button className="s-btn s-btn-soft s-btn-sm"><Eye size={13} /> View Profile</button>
                  </div>
                </motion.article>
              ))}

              {!grouped[lane.key].length && (
                <div className="s-card" style={{ padding: 18, textAlign: 'center', borderStyle: 'dashed' }}>
                  <div className="s-empty-icon"><ShieldAlert size={18} /></div>
                  <div className="s-dim" style={{ marginTop: 8 }}>No requests in this lane.</div>
                </div>
              )}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
