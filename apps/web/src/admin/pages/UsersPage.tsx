import { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  joinedDate: string;
  lastLogin: string;
  role: 'user' | 'admin' | 'moderator';
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'sarah.johnson@example.com',
    name: 'Sarah Johnson',
    status: 'active',
    joinedDate: '2024-01-15',
    lastLogin: '2 hours ago',
    role: 'user',
  },
  {
    id: '2',
    email: 'mike.chen@example.com',
    name: 'Mike Chen',
    status: 'active',
    joinedDate: '2024-02-20',
    lastLogin: '1 day ago',
    role: 'user',
  },
  {
    id: '3',
    email: 'emily.davis@example.com',
    name: 'Emily Davis',
    status: 'active',
    joinedDate: '2024-01-08',
    lastLogin: '30 minutes ago',
    role: 'admin',
  },
  {
    id: '4',
    email: 'alex.kumar@example.com',
    name: 'Alex Kumar',
    status: 'inactive',
    joinedDate: '2024-03-10',
    lastLogin: '5 days ago',
    role: 'user',
  },
  {
    id: '5',
    email: 'jordan.smith@example.com',
    name: 'Jordan Smith',
    status: 'suspended',
    joinedDate: '2024-02-01',
    lastLogin: '3 weeks ago',
    role: 'user',
  },
  {
    id: '6',
    email: 'sophie.martin@example.com',
    name: 'Sophie Martin',
    status: 'active',
    joinedDate: '2024-01-25',
    lastLogin: 'just now',
    role: 'moderator',
  },
];

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'danger';
      default:
        return 'info';
    }
  };

  const getRoleLabel = (role: User['role']) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-text-primary mb-2">Users</h1>
          <p className="text-secondary">Manage platform users and permissions</p>
        </div>
        <Button variant="primary">
          + Add New User
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Total Users</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_USERS.length}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-2">+8 this week</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Active Now</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_USERS.filter((u) => u.status === 'active').length}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-2">87% of total</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Suspended</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {MOCK_USERS.filter((u) => u.status === 'suspended').length}
          </p>
          <p className="text-xs text-red-600 font-medium mt-2">Policy violations</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Premium</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">
            {Math.floor(MOCK_USERS.length * 0.45)}
          </p>
          <p className="text-xs text-amber-600 font-medium mt-2">45% conversion</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-admin-border rounded-lg bg-admin-bg-primary text-admin-text-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Results Info */}
          <p className="text-sm text-secondary">
            Showing {paginatedUsers.length} of {filteredUsers.length} users
          </p>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {paginatedUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center text-sm font-semibold text-primary-700">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-admin-text-primary">{user.name}</span>
                      </div>
                    </td>
                    <td className="text-secondary text-sm">{user.email}</td>
                    <td>
                      <Badge
                        variant={
                          user.role === 'admin'
                            ? 'info'
                            : user.role === 'moderator'
                              ? 'teal'
                              : 'success'
                        }
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={getStatusColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="text-secondary text-sm">{user.joinedDate}</td>
                    <td className="text-secondary text-sm">{user.lastLogin}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          View
                        </button>
                        <button className="text-secondary hover:text-admin-text-primary text-sm font-medium">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-secondary">No users found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-admin-border pt-4">
            <p className="text-sm text-secondary">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
