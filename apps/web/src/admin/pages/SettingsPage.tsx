import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    apiKey: 'sk_live_51234567890abcdefg',
    webhookUrl: 'https://api.example.com/webhooks',
    maxSessions: '100',
    maintenanceMode: false,
    analyticsTracking: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-admin-text-primary mb-2">Settings</h1>
        <p className="text-secondary">Platform configuration and preferences</p>
      </div>

      {/* General Settings */}
      <Card title="General Settings" variant="elevated">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-admin-text-primary mb-2">
              Platform Name
            </label>
            <Input placeholder="Aura Platform" defaultValue="Aura" />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-primary mb-2">
              Support Email
            </label>
            <Input
              type="email"
              placeholder="support@aura.ai"
              defaultValue="support@aura.ai"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-primary mb-2">
              Support Phone
            </label>
            <Input placeholder="+1 (555) 000-0000" defaultValue="+1 (555) 000-0000" />
          </div>

          <div className="flex gap-4">
            <Button variant="primary">Save Changes</Button>
            <Button variant="secondary">Discard</Button>
          </div>
        </div>
      </Card>

      {/* API Configuration */}
      <Card title="API Configuration" variant="elevated">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-admin-text-primary mb-2">
              API Key
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              />
              <Button variant="secondary">Copy</Button>
            </div>
            <p className="text-xs text-secondary mt-2">
              Use this key for API authentication
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-primary mb-2">
              Webhook URL
            </label>
            <Input
              value={settings.webhookUrl}
              onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
            />
            <p className="text-xs text-secondary mt-2">
              Receive real-time events at this URL
            </p>
          </div>

          <div className="flex gap-4">
            <Button variant="primary">Update API Settings</Button>
            <Button variant="secondary">Regenerate Key</Button>
          </div>
        </div>
      </Card>

      {/* Limits and Quotas */}
      <Card title="Limits & Quotas" variant="elevated">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-admin-text-primary mb-2">
              Max Concurrent Sessions
            </label>
            <Input
              type="number"
              value={settings.maxSessions}
              onChange={(e) => setSettings({ ...settings, maxSessions: e.target.value })}
            />
            <p className="text-xs text-secondary mt-2">
              Maximum simultaneous active sessions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-primary mb-2">
              API Rate Limit
            </label>
            <Input type="number" placeholder="1000" defaultValue="1000" />
            <p className="text-xs text-secondary mt-2">
              Requests per minute
            </p>
          </div>

          <div className="flex gap-4">
            <Button variant="primary">Save Limits</Button>
          </div>
        </div>
      </Card>

      {/* Feature Flags */}
      <Card title="Feature Flags" variant="elevated">
        <div className="space-y-4">
          {[
            { name: 'Maintenance Mode', description: 'Disable platform access for maintenance' },
            { name: 'Analytics Tracking', description: 'Enable user behavior tracking' },
            { name: 'Beta Features', description: 'Allow access to experimental features' },
            { name: 'Email Notifications', description: 'Send email alerts to admins' },
          ].map((feature) => (
            <div key={feature.name} className="flex items-center justify-between py-3 border-b border-admin-border last:border-b-0">
              <div>
                <p className="font-medium text-admin-text-primary">{feature.name}</p>
                <p className="text-xs text-secondary">{feature.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={feature.name === 'Analytics Tracking'} />
                <div className="w-11 h-6 bg-admin-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card variant="elevated" className="border-red-200">
        <div className="space-y-4">
          <h3 className="font-semibold text-red-600">Danger Zone</h3>
          <p className="text-sm text-secondary">Irreversible actions. Proceed with caution.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-red-900">Clear All Analytics Data</p>
                <p className="text-xs text-red-700 mt-1">
                  Delete all stored analytics and metrics
                </p>
              </div>
              <Button variant="danger" size="sm">
                Delete
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-red-900">Reset All Passwords</p>
                <p className="text-xs text-red-700 mt-1">
                  Force password reset for all users
                </p>
              </div>
              <Button variant="danger" size="sm">
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* System Info */}
      <Card title="System Information" variant="elevated">
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: 'Platform Version', value: 'v0.1.0' },
            { label: 'API Version', value: 'v1.0.0' },
            { label: 'Database', value: 'PostgreSQL 15' },
            { label: 'Last Updated', value: '2 hours ago' },
            { label: 'Uptime', value: '99.8%' },
            { label: 'Support Tier', value: 'Premium' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium text-secondary mb-1">{item.label}</p>
              <p className="font-semibold text-admin-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
