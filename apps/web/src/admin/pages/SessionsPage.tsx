import { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface Session {
  id: string;
  userId: string;
  userName: string;
  status: 'active' | 'ended';
  device: string;
  ipAddress: string;
  startTime: string;
  duration: string;
  location: string;
}

const MOCK_SESSIONS: Session[] = [
  {
    id: 'sess-1',
    userId: 'user-123',
    userName: 'Sarah Johnson',
    status: 'active',
    device: 'Chrome on Windows',
    ipAddress: '192.168.1.100',
    startTime: 'just now',
    duration: '2 minutes',
    location: 'New York, USA',
  },
  {
    id: 'sess-2',
    userId: 'user-456',
    userName: 'Mike Chen',
    status: 'ended',
    device: 'Safari on iOS',
    ipAddress: '192.168.1.101',
    startTime: '1 hour ago',
    duration: '45 minutes',
    location: 'San Francisco, USA',
  },
  {
    id: 'sess-3',
    userId: 'user-789',
    userName: 'Emily Davis',
    status: 'active',
    device: 'Firefox on Mac',
    ipAddress: '192.168.1.102',
    startTime: '30 minutes ago',
    duration: '30 minutes',
    location: 'London, UK',
  },
  {
    id: 'sess-4',
    userId: 'user-101',
    userName: 'Alex Kumar',
    status: 'ended',
    device: 'Chrome on Android',
    ipAddress: '192.168.1.103',
    startTime: '2 hours ago',
    duration: '1 hour 15 minutes',
    location: 'Mumbai, India',
  },
  {
    id: 'sess-5',
    userId: 'user-202',
    userName: 'Jordan Smith',
    status: 'active',
    device: 'Edge on Windows',
    ipAddress: '192.168.1.104',
    startTime: '5 minutes ago',
    duration: '5 minutes',
    location: 'Toronto, Canada',
  },
];

export function SessionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSessions = useMemo(() => {
    return MOCK_SESSIONS.filter((session) => {
      const matchesSearch =
        session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-text-primary mb-2">Sessions</h1>
          <p className="text-secondary">Monitor active user sessions</p>
        </div>
        <Button variant="primary">
          Terminate All Sessions
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Active Sessions</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_SESSIONS.filter((s) => s.status === 'active').length}
          </p>
          <p className="text-xs text-green-600 font-medium mt-2">Currently online</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Total Today</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_SESSIONS.length * 8}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-2">Sessions</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Avg. Duration</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">34m</p>
          <p className="text-xs text-blue-600 font-medium mt-2">Per session</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Devices</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {new Set(MOCK_SESSIONS.map((s) => s.device)).size}
          </p>
          <p className="text-xs text-amber-600 font-medium mt-2">Browser types</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-admin-border rounded-lg bg-admin-bg-primary text-admin-text-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Sessions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Device</th>
                <th>Location</th>
                <th>IP Address</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center text-sm font-semibold text-primary-700">
                        {session.userName.charAt(0)}
                      </div>
                      <span className="font-medium text-admin-text-primary">
                        {session.userName}
                      </span>
                    </div>
                  </td>
                  <td className="text-secondary text-sm">{session.device}</td>
                  <td className="text-secondary text-sm">{session.location}</td>
                  <td className="font-mono text-secondary text-sm">{session.ipAddress}</td>
                  <td>
                    <Badge variant={session.status === 'active' ? 'success' : 'info'}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="text-secondary text-sm">{session.duration}</td>
                  <td className="text-secondary text-sm">{session.startTime}</td>
                  <td>
                    {session.status === 'active' && (
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Terminate
                      </button>
                    )}
                    {session.status === 'ended' && (
                      <button className="text-secondary hover:text-admin-text-primary text-sm font-medium">
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
