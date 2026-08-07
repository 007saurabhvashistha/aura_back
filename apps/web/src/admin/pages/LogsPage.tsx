import { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';

interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  service: string;
  message: string;
  details: string;
}

const MOCK_LOGS: Log[] = [
  {
    id: '1',
    timestamp: '2026-08-06 14:32:45',
    level: 'info',
    service: 'API Server',
    message: 'User authentication successful',
    details: 'User: sarah.johnson@example.com',
  },
  {
    id: '2',
    timestamp: '2026-08-06 14:31:20',
    level: 'success',
    service: 'Database',
    message: 'Migration completed',
    details: 'Migration: 0003_conversation_foundation.sql',
  },
  {
    id: '3',
    timestamp: '2026-08-06 14:30:15',
    level: 'warning',
    service: 'Cache Layer',
    message: 'High memory usage detected',
    details: 'Memory: 87% of 8GB',
  },
  {
    id: '4',
    timestamp: '2026-08-06 14:29:00',
    level: 'info',
    service: 'WebSocket',
    message: 'New connection established',
    details: 'Client: 192.168.1.100',
  },
  {
    id: '5',
    timestamp: '2026-08-06 14:27:30',
    level: 'error',
    service: 'API Server',
    message: 'Request timeout',
    details: 'Endpoint: /api/conversations, Duration: 30s',
  },
  {
    id: '6',
    timestamp: '2026-08-06 14:26:10',
    level: 'info',
    service: 'Auth Service',
    message: 'Session created',
    details: 'User: mike.chen@example.com, Duration: 24h',
  },
  {
    id: '7',
    timestamp: '2026-08-06 14:25:05',
    level: 'success',
    service: 'AI Agent',
    message: 'Conversation processed',
    details: 'Agent: Customer Support Bot, Messages: 12',
  },
  {
    id: '8',
    timestamp: '2026-08-06 14:24:00',
    level: 'warning',
    service: 'API Server',
    message: 'Rate limit approaching',
    details: 'IP: 192.168.1.101, Usage: 950/1000 requests',
  },
];

export function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      const matchesSearch =
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesService = serviceFilter === 'all' || log.service === serviceFilter;
      return matchesSearch && matchesLevel && matchesService;
    });
  }, [searchTerm, levelFilter, serviceFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const getLevelColor = (level: Log['level']) => {
    switch (level) {
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getLevelIcon = (level: Log['level']) => {
    switch (level) {
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'success':
        return '✓';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  const services = [...new Set(MOCK_LOGS.map((log) => log.service))];
  const logLevels = ['info', 'warning', 'error', 'success'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-text-primary mb-2">System Logs</h1>
          <p className="text-secondary">Platform activity and audit trail</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Total Logs (24h)</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_LOGS.length * 12}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-2">Events</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Errors</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_LOGS.filter((l) => l.level === 'error').length}
          </p>
          <p className="text-xs text-red-600 font-medium mt-2">Needs attention</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Warnings</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_LOGS.filter((l) => l.level === 'warning').length}
          </p>
          <p className="text-xs text-amber-600 font-medium mt-2">Monitor</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Services</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {services.length}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-2">Active</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-admin-border rounded-lg bg-admin-bg-primary text-admin-text-primary"
            >
              <option value="all">All Levels</option>
              {logLevels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-admin-border rounded-lg bg-admin-bg-primary text-admin-text-primary"
            >
              <option value="all">All Services</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-secondary">
            Showing {paginatedLogs.length} of {filteredLogs.length} logs
          </p>
        </div>
      </Card>

      {/* Logs List */}
      <Card>
        {paginatedLogs.length > 0 ? (
          <div className="space-y-3">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border border-admin-border rounded-lg hover:bg-admin-bg-tertiary transition-colors"
              >
                {/* Level Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    log.level === 'error'
                      ? 'bg-red-100 text-red-600'
                      : log.level === 'warning'
                        ? 'bg-amber-100 text-amber-600'
                        : log.level === 'success'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-primary-100 text-primary-600'
                  }`}
                >
                  {getLevelIcon(log.level)}
                </div>

                {/* Log Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-admin-text-primary text-sm">
                      {log.message}
                    </p>
                    <Badge variant={getLevelColor(log.level)} className="text-xs">
                      {log.level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary mb-2">{log.details}</p>
                  <div className="flex gap-4 text-xs text-secondary">
                    <span>{log.service}</span>
                    <span>•</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                {/* Action */}
                <button className="text-primary-600 hover:text-primary-700 text-xs font-medium flex-shrink-0">
                  View
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-secondary">No logs found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-admin-border pt-4">
            <p className="text-sm text-secondary">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-admin-border rounded-lg text-sm font-medium hover:bg-admin-bg-tertiary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-admin-border rounded-lg text-sm font-medium hover:bg-admin-bg-tertiary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
