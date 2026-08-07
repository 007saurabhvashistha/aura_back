import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-text-primary mb-2">Analytics</h1>
          <p className="text-secondary">Platform performance and user insights</p>
        </div>
        <Button variant="primary">
          Download Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Total Revenue</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">$48.5K</p>
          <p className="text-xs text-green-600 font-medium mt-2">+18.2% vs last month</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Conversion Rate</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">3.8%</p>
          <p className="text-xs text-green-600 font-medium mt-2">+0.5% trend</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Avg. Session Value</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">$127</p>
          <p className="text-xs text-teal-600 font-medium mt-2">Per user</p>
        </Card>
        <Card variant="metric">
          <p className="text-sm font-medium text-secondary">Churn Rate</p>
          <p className="text-3xl font-bold text-admin-text-primary mt-2">2.1%</p>
          <p className="text-xs text-amber-600 font-medium mt-2">Monthly</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card title="Revenue Trend" description="Last 12 months" variant="elevated">
          <div className="space-y-4">
            {[
              { month: 'Jan', value: 28 },
              { month: 'Feb', value: 35 },
              { month: 'Mar', value: 42 },
              { month: 'Apr', value: 38 },
              { month: 'May', value: 45 },
              { month: 'Jun', value: 48.5 },
            ].map((item) => (
              <div key={item.month} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-secondary">{item.month}</span>
                  <span className="text-sm font-semibold text-admin-text-primary">
                    ${item.value}K
                  </span>
                </div>
                <div className="w-full h-2 bg-admin-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-teal-500"
                    style={{ width: `${(item.value / 48.5) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Growth */}
        <Card title="User Growth" description="Weekly basis" variant="elevated">
          <div className="space-y-4">
            {[
              { week: 'Week 1', users: 234 },
              { week: 'Week 2', users: 289 },
              { week: 'Week 3', users: 312 },
              { week: 'Week 4', users: 356 },
            ].map((item) => (
              <div key={item.week} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-secondary">{item.week}</span>
                  <span className="text-sm font-semibold text-admin-text-primary">
                    +{item.users}
                  </span>
                </div>
                <div className="w-full h-2 bg-admin-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-primary-500"
                    style={{ width: `${(item.users / 356) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-3 gap-6">
        <Card title="Top Features" variant="elevated">
          <div className="space-y-3">
            {[
              { name: 'AI Conversations', usage: 45 },
              { name: 'User Dashboard', usage: 32 },
              { name: 'Settings Panel', usage: 18 },
              { name: 'Analytics View', usage: 5 },
            ].map((feature) => (
              <div key={feature.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-secondary">{feature.name}</span>
                  <span className="text-xs font-semibold text-admin-text-primary">
                    {feature.usage}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-admin-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                    style={{ width: `${feature.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Traffic Sources" variant="elevated">
          <div className="space-y-3">
            {[
              { source: 'Direct', percentage: 42 },
              { source: 'Search', percentage: 28 },
              { source: 'Referral', percentage: 18 },
              { source: 'Social', percentage: 12 },
            ].map((item) => (
              <div key={item.source} className="flex items-center justify-between">
                <span className="text-sm text-secondary">{item.source}</span>
                <Badge variant="teal">{item.percentage}%</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Device Types" variant="elevated">
          <div className="space-y-3">
            {[
              { device: 'Desktop', count: 1247 },
              { device: 'Mobile', count: 856 },
              { device: 'Tablet', count: 243 },
            ].map((item) => (
              <div key={item.device}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-secondary">{item.device}</span>
                  <span className="text-xs font-semibold text-admin-text-primary">
                    {item.count}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-admin-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-teal-600"
                    style={{ width: `${(item.count / 1247) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card
        title="Engagement Metrics"
        description="User interaction patterns"
        variant="elevated"
      >
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: 'Avg. Session Length', value: '12m 34s' },
            { label: 'Pages per Session', value: '6.2' },
            { label: 'Bounce Rate', value: '24%' },
            { label: 'Return Visitors', value: '68%' },
          ].map((metric) => (
            <div key={metric.label} className="text-center">
              <p className="text-sm text-secondary mb-2">{metric.label}</p>
              <p className="text-2xl font-bold text-admin-text-primary">{metric.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
