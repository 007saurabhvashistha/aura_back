import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

export function AdminDashboard() {
  const metrics = [
    { 
      label: 'Total Users', 
      value: '2,847', 
      change: '+12.5%',
      status: 'success'
    },
    { 
      label: 'Active Sessions', 
      value: '384', 
      change: '+8.2%',
      status: 'success'
    },
    { 
      label: 'Total Conversations', 
      value: '12,456', 
      change: '+23.1%',
      status: 'success'
    },
    { 
      label: 'Platform Health', 
      value: '99.8%', 
      change: 'Stable',
      status: 'healthy'
    },
  ];

  const recentActivity = [
    { user: 'Sarah Johnson', action: 'Started conversation', time: '2 minutes ago' },
    { user: 'Mike Chen', action: 'Completed session', time: '15 minutes ago' },
    { user: 'Emily Davis', action: 'Profile updated', time: '28 minutes ago' },
    { user: 'Alex Kumar', action: 'Joined platform', time: '1 hour ago' },
  ];

  const systemServices = [
    { name: 'API Server', status: 'healthy', latency: '45ms' },
    { name: 'Database', status: 'healthy', latency: 'N/A' },
    { name: 'Cache Layer', status: 'healthy', latency: '12ms' },
    { name: 'WebSocket', status: 'healthy', latency: '28ms' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-admin-text-primary mb-2">Dashboard</h1>
        <p className="text-secondary">Real-time overview of your platform performance and user activity.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <Card key={idx} variant="metric" className="hover:shadow-lg">
            <div className="space-y-3">
              <p className="text-sm font-medium text-secondary">{metric.label}</p>
              <div>
                <p className="text-3xl font-bold text-admin-text-primary">{metric.value}</p>
                <p className={`text-sm mt-1 font-medium ${
                  metric.status === 'healthy' ? 'text-teal-600' : 'text-green-600'
                }`}>
                  {metric.change}
                </p>
              </div>
              <Badge 
                variant={metric.status === 'healthy' ? 'success' : 'success'}
                className="text-xs"
              >
                {metric.status === 'healthy' ? 'Optimal' : 'Growing'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2">
          <Card 
            title="Recent Activity" 
            description="User actions and engagement over the last hour"
            variant="elevated"
          >
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-4 border-b border-admin-border last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-700">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-admin-text-primary text-sm">{activity.user}</p>
                      <p className="text-xs text-secondary">{activity.action}</p>
                    </div>
                  </div>
                  <p className="text-xs text-secondary">{activity.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* System Status */}
        <div>
          <Card 
            title="System Status" 
            description="Service health & latency"
            variant="elevated"
          >
            <div className="space-y-3">
              {systemServices.map((service) => (
                <div key={service.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-admin-text-primary">{service.name}</span>
                    <Badge variant="success" className="text-xs">
                      ✓ Up
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary">Latency</span>
                    <span className="font-mono font-semibold text-admin-text-primary">{service.latency}</span>
                  </div>
                  <div className="w-full h-1 bg-admin-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-green-400 to-teal-500"></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        <Card title="Engagement Metrics" variant="elevated">
          <div className="space-y-4">
            {[
              { label: 'Avg Session Duration', value: '12.4 min' },
              { label: 'User Retention', value: '87.3%' },
              { label: 'Satisfaction Score', value: '4.7/5.0' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-xs text-secondary font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-admin-text-primary">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Growth Trends" variant="elevated">
          <div className="space-y-4">
            {[
              { label: 'Weekly Sign-ups', value: '+234', arrow: '↑' },
              { label: 'Weekly Sessions', value: '+1,205', arrow: '↑' },
              { label: 'Weekly Revenue', value: '+$3,245', arrow: '↑' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-xs text-secondary font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-green-600">{stat.arrow} {stat.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions" variant="elevated">
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md font-medium text-sm hover:bg-primary-700 transition-colors">
              View All Users
            </button>
            <button className="w-full px-4 py-2 bg-admin-bg-tertiary text-admin-text-primary rounded-md font-medium text-sm hover:bg-admin-border transition-colors">
              Export Reports
            </button>
            <button className="w-full px-4 py-2 bg-admin-bg-tertiary text-admin-text-primary rounded-md font-medium text-sm hover:bg-admin-border transition-colors">
              System Settings
            </button>
          </div>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-4">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 7a1 1 0 000 2h6a1 1 0 000-2H8zm0 3a1 1 0 000 2h3a1 1 0 000-2H8z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-teal-900 mb-1">Platform Status Excellent</h3>
          <p className="text-sm text-teal-700">
            All systems operational. 99.8% uptime maintained. Real-time data syncing with backend.
          </p>
        </div>
      </div>
    </div>
  );
}
