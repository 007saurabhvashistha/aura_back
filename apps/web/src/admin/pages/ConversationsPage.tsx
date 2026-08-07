import { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  topic: string;
  status: 'active' | 'completed' | 'archived';
  messages: number;
  duration: string;
  startedAt: string;
  agent: string;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    userId: 'user-123',
    userName: 'Sarah Johnson',
    topic: 'Product inquiry',
    status: 'completed',
    messages: 12,
    duration: '8 minutes',
    startedAt: '2 hours ago',
    agent: 'Sales Assistant',
  },
  {
    id: 'conv-2',
    userId: 'user-456',
    userName: 'Mike Chen',
    topic: 'Technical support',
    status: 'active',
    messages: 5,
    duration: '3 minutes',
    startedAt: 'just now',
    agent: 'Technical Troubleshooter',
  },
  {
    id: 'conv-3',
    userId: 'user-789',
    userName: 'Emily Davis',
    topic: 'Billing question',
    status: 'completed',
    messages: 8,
    duration: '5 minutes',
    startedAt: '1 hour ago',
    agent: 'Customer Support Bot',
  },
  {
    id: 'conv-4',
    userId: 'user-101',
    userName: 'Alex Kumar',
    topic: 'Feature request',
    status: 'archived',
    messages: 15,
    duration: '12 minutes',
    startedAt: '3 days ago',
    agent: 'Customer Support Bot',
  },
  {
    id: 'conv-5',
    userId: 'user-202',
    userName: 'Jordan Smith',
    topic: 'Account access',
    status: 'active',
    messages: 3,
    duration: '2 minutes',
    startedAt: '5 minutes ago',
    agent: 'Customer Support Bot',
  },
];

export function ConversationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredConversations = useMemo(() => {
    return MOCK_CONVERSATIONS.filter((conv) => {
      const matchesSearch =
        conv.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.userName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const getStatusColor = (status: Conversation['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'archived':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-text-primary mb-2">
            Conversations
          </h1>
          <p className="text-secondary">View and manage user conversations</p>
        </div>
        <Button variant="primary">
          + Export Transcript
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Total Conversations</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_CONVERSATIONS.length}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-2">All time</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Active Now</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_CONVERSATIONS.filter((c) => c.status === 'active').length}
          </p>
          <p className="text-xs text-green-600 font-medium mt-2">In progress</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Avg. Duration</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">7.6m</p>
          <p className="text-xs text-blue-600 font-medium mt-2">Per conversation</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Satisfaction</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">4.8/5</p>
          <p className="text-xs text-amber-600 font-medium mt-2">Average rating</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search conversations..."
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
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Conversations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Topic</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Messages</th>
                <th>Duration</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map((conv) => (
                <tr key={conv.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center text-sm font-semibold text-primary-700">
                        {conv.userName.charAt(0)}
                      </div>
                      <span className="font-medium text-admin-text-primary">
                        {conv.userName}
                      </span>
                    </div>
                  </td>
                  <td className="text-admin-text-primary font-medium">{conv.topic}</td>
                  <td className="text-secondary text-sm">{conv.agent}</td>
                  <td>
                    <Badge variant={getStatusColor(conv.status)}>
                      {conv.status.charAt(0).toUpperCase() + conv.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="text-secondary text-sm">{conv.messages}</td>
                  <td className="text-secondary text-sm">{conv.duration}</td>
                  <td className="text-secondary text-sm">{conv.startedAt}</td>
                  <td>
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View
                    </button>
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
