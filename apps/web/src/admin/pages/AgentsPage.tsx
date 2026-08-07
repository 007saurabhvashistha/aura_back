import { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Loading } from '../components/Loading';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive' | 'training';
  model: string;
  accuracy: number | null;
  conversationCount: number;
  createdAt: string;
  updatedAt: string;
}

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: '1',
          limit: '50',
          status: statusFilter,
          ...(searchTerm && { search: searchTerm }),
        });

        const response = await fetch(
          `/api/v1/admin/agents?${params}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch agents: ${response.statusText}`);
        }

        const result = await response.json();
        setAgents(result.data?.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [statusFilter, searchTerm]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchTerm, statusFilter]);

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'training':
        return 'info';
      case 'inactive':
        return 'warning';
      default:
        return 'info';
    }
  };

  const avgAccuracy =
    agents.length > 0
      ? (
          agents.reduce((sum, a) => sum + (a.accuracy || 0), 0) / agents.filter((a) => a.accuracy).length
        ).toFixed(1)
      : '0';

  const totalConversations = agents.reduce((sum, a) => sum + a.conversationCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-text-primary mb-2">AI Agents</h1>
          <p className="text-secondary">Deploy and manage AI agents</p>
        </div>
        <Button variant="primary">
          + Create Agent
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Total Agents</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {agents.length}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-2">Connected</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Active</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {agents.filter((a) => a.status === 'active').length}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-2">In production</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Avg. Accuracy</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {avgAccuracy}%
          </p>
          <p className="text-xs text-green-600 font-medium mt-2">Performance metric</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Total Conversations</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {totalConversations.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 font-medium mt-2">All time</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search agents..."
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
              <option value="training">Training</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <p className="text-sm text-secondary">
            Showing {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>

      {filteredAgents.length === 0 && !loading && (
        <Card>
          <div className="text-center py-12">
            <p className="text-secondary">
              {error ? 'Failed to load agents' : 'No agents found'}
            </p>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </Card>
      )}

      {loading && (
        <Card>
          <div className="text-center py-12">
            <Loading />
            <p className="text-secondary mt-4">Loading agents...</p>
          </div>
        </Card>
      )}

      {!loading && filteredAgents.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} title={agent.name} variant="elevated">
              <div className="space-y-4">
                <p className="text-sm text-secondary">
                  {agent.description || 'No description'}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-secondary">Model</p>
                    <p className="text-sm font-semibold text-admin-text-primary mt-1">
                      {agent.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary">Status</p>
                    <Badge variant={getStatusColor(agent.status)} className="mt-1">
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {agent.accuracy !== null && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-xs font-medium text-secondary">Accuracy</p>
                      <p className="text-sm font-semibold text-admin-text-primary">
                        {agent.accuracy}%
                      </p>
                    </div>
                    <div className="w-full h-2 bg-admin-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-teal-500"
                        style={{ width: `${agent.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-secondary">Conversations</p>
                    <p className="font-semibold text-admin-text-primary">
                      {agent.conversationCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary">Created</p>
                    <p className="font-semibold text-admin-text-primary">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
