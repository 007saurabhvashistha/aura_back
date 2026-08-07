# Sprint 4: Admin Navigation & UI Flow

## Navigation Hierarchy

### Sidebar Navigation

```
┌─────────────────────────┐
│  ADMIN CONSOLE          │  ← Logo
│  ═════════════════════  │
├─────────────────────────┤
│                         │
│  📊 Dashboard           │  ← Current page indicator
│  🤖 Agents              │
│  💬 Prompts             │
│  👥 Users               │
│   💭 Conversations       │
│  🔌 Sessions            │
│  📋 Logs                │
│  📈 Analytics           │
│  ⚙️  Settings           │
│                         │
├─────────────────────────┤
│ > Admin Settings        │  ← Secondary/collapsible
│ > API Keys              │
│ > Audit Trail           │
├─────────────────────────┤
│ Aura v0.1.0             │
│ Sprint 4: Admin Panel   │
└─────────────────────────┘
```

**Mobile Behavior:**
- Sidebar slides out from left
- Hamburger menu icon in topbar
- Sidebar closes on navigation

---

## Topbar Elements

```
┌────────────────────────────────────────────────────────────┐
│ [≡] Dashboard                              🔍 🌙 🔔 [A] ▼ │
│     (Breadcrumb)                           │  │  │  │     │
│                                            │  │  │  └─────┘
│                                            │  │  │    Profile
│                                            │  │  └─ Notifications
│                                            │  └──── Dark Mode
│                                            └────── Search
└────────────────────────────────────────────────────────────┘
```

**Elements:**
1. **Hamburger/Toggle** - Mobile: open/close sidebar
2. **Page Breadcrumb** - Dashboard > Agents > Create
3. **Search** (future) - Global search across resources
4. **Theme Toggle** - Light/Dark mode
5. **Notifications** (future) - System alerts
6. **User Menu** - Profile, settings, logout

---

## Main Navigation Flow

### Dashboard
```
Dashboard
├─ KPI Cards (Users, Sessions, Conversations, Health)
├─ Recent Activity (Timeline)
├─ System Status (Services, Uptime)
└─ Quick Links
   ├─ [+ Create Agent]
   ├─ [View All Conversations]
   └─ [System Settings]
```

### Agents Management
```
Agents List
├─ Search by name
├─ Filter by status (All/Active/Training/Inactive)
├─ Sort by (Name/Accuracy/Conversations/Date)
├─ [+ Create Agent] (Button)
│
├─ Table Rows
│  ├─ Name
│  ├─ Model
│  ├─ Status Badge
│  ├─ Accuracy % (progress bar)
│  ├─ Conversations #
│  ├─ [Edit] [⋯ More]
│  └─ [Delete] (in dropdown)
│
└─ Pagination (← Prev 1 2 3 Next →)

          ↓ Click [Edit] or Name

Agent Detail
├─ ← Back | Agent Name | [Edit] [Delete]
├─ Stats Cards (Accuracy, Conversations, Uptime)
├─ Overview
│  ├─ Description
│  ├─ Model
│  ├─ Status
│  ├─ Assigned Prompts
│  └─ [Edit Agent]
├─ Activity
│  ├─ Recent Conversations
│  ├─ Performance Metrics
│  └─ Error Logs
└─ [Archive] [Restart] [View Logs]

          ↓ Click [Edit]

Edit Agent Form
├─ Agent Name
├─ Description
├─ Model (Dropdown)
├─ Status (Dropdown)
├─ Assign System Prompt
├─ Assign Persona Prompt
├─ Custom Metadata (JSON)
├─ [Cancel] [Save] [Save & Close]
└─ Error Messages (Validation)
```

### Prompt Management
```
Prompts List
├─ Search
├─ Filter by Type (All/System/Persona/Context)
├─ Filter by Agent
├─ [+ Create Prompt]
├─ Table Rows
│  ├─ Name
│  ├─ Type Badge
│  ├─ Used In (agent count)
│  ├─ Version #
│  ├─ Last Updated
│  └─ [Edit] [⋯]
└─ Pagination

        ↓ Click [Edit] or Name

Prompt Detail
├─ ← Back | Prompt Name
├─ Tabs
│  ├─ Editor (Current version)
│  ├─ Versions (History)
│  └─ Agents (Where used)
├─ Editor
│  ├─ Content (Large text area with syntax highlighting)
│  ├─ Type (Read-only: System/Persona/Context)
│  ├─ [Preview] [Test] [Copy]
│  └─ [Cancel] [Save as New Version]
├─ Version History
│  ├─ Version 5 (Current)
│  ├─ Version 4
│  ├─ Version 3
│  └─ [Compare Versions] [Revert]
└─ Used In Agents
   ├─ Agent 1 (System Prompt)
   ├─ Agent 2 (Persona Prompt)
   └─ [Remove from Agent]
```

### User Management
```
Users List
├─ Search by email/name
├─ Filter by Role (All/Admin/Moderator/User)
├─ Filter by Status (All/Active/Inactive/Suspended)
├─ Table Rows
│  ├─ Email
│  ├─ Name
│  ├─ Role Badge
│  ├─ Status Badge
│  ├─ Joined Date
│  ├─ Last Login
│  └─ [Edit] [⋯]
└─ Pagination

        ↓ Click [Edit]

Edit User Form
├─ Email (Read-only)
├─ Name
├─ Role (Dropdown: Admin/Moderator/User)
├─ Status (Dropdown: Active/Inactive/Suspended)
├─ Conversation Count (Read-only)
├─ Last Login (Read-only)
├─ Actions
│  ├─ [Reset Password] → Confirmation → "Link sent"
│  ├─ [Reset 2FA]
│  └─ [Clear Sessions] → Confirmation
├─ [Cancel] [Save] [Delete]
└─ Danger Zone
   └─ [Permanently Delete User] → Confirmation
```

### Conversation Monitoring
```
Conversations List
├─ Search by topic/user
├─ Filter by Status (All/Active/Completed/Archived)
├─ Filter by Agent
├─ Date Range
├─ Sort by (Date/Duration/Sentiment)
├─ Table Rows
│  ├─ User
│  ├─ Topic
│  ├─ Agent
│  ├─ Duration
│  ├─ Messages
│  ├─ Sentiment Score
│  └─ [View] [⋯]
└─ Pagination

        ↓ Click [View]

Conversation Detail (Timeline)
├─ ← Back | Topic | Status Badge | Duration
├─ User Info Card
│  ├─ Avatar
│  ├─ Name
│  ├─ Email
│  └─ Conversation Count
├─ Agent Info Card
│  ├─ Agent Name
│  ├─ Model
│  └─ Accuracy
├─ Message Timeline
│  ├─ User: "Hello, I need help with..."
│  │  └─ 10:00 AM
│  ├─ Agent: "I'd be happy to help..."
│  │  └─ 10:00:15 AM
│  ├─ User: "Thank you!"
│  │  └─ 10:01 AM
│  └─ [↓ Load More]
├─ Memory Snapshot
│  ├─ Entities Detected
│  ├─ Context
│  └─ [View Full Memory]
├─ Metadata
│  ├─ Started: 10:00 AM
│  ├─ Ended: 10:05 AM
│  ├─ Duration: 5 min
│  └─ Sentiment: 0.85
└─ Actions
   ├─ [Export Transcript]
   ├─ [Archive Conversation]
   └─ [Delete] → Confirmation
```

### Sessions Monitoring
```
Sessions List (Real-time)
├─ Filter by Status (All/Active/Ended)
├─ Table Rows (Live updates)
│  ├─ User
│  ├─ Device/Browser
│  ├─ IP Address
│  ├─ Location
│  ├─ Started
│  ├─ Duration
│  └─ [View] [Terminate]
└─ Pagination

        ↓ Click [View]

Session Detail
├─ ← Back | User: [Name]
├─ Session Status (Active/Ended)
├─ Timeline
│  ├─ Started: 2:30 PM
│  ├─ Last Activity: 3:15 PM
│  └─ Ended: (if ended)
├─ Device Info
│  ├─ Device: Apple MacBook
│  ├─ OS: macOS 14.2
│  ├─ Browser: Chrome 120.0
│  ├─ User Agent: [Full string]
│  └─ IP: 192.168.1.100
├─ Location
│  ├─ City, Country
│  ├─ Timezone: EST
│  └─ Map (future)
├─ Activity Log
│  ├─ 2:30 PM - Logged in
│  ├─ 2:35 PM - Viewed Dashboard
│  ├─ 2:45 PM - Started Conversation
│  └─ 3:15 PM - Last API call
└─ Actions
   └─ [Terminate Session] → Confirmation → Logged out
```

### System Logs
```
Logs Viewer
├─ Search by message
├─ Filter by Level (All/Info/Warning/Error/Success)
├─ Filter by Service (All/Auth/API/DB/Queue)
├─ Date Range Picker
├─ Table Rows
│  ├─ Timestamp
│  ├─ Level (colored icon)
│  ├─ Service
│  ├─ Message
│  └─ [View Details]
└─ Pagination with auto-refresh

        ↓ Click [View Details]

Log Detail
├─ Timestamp: 2026-08-06 15:30:45.123
├─ Level: ERROR (Red)
├─ Service: api
├─ Message: Failed to create agent
├─ Details
│  ├─ Error Code: DUPLICATE_NAME
│  ├─ User ID: uuid
│  ├─ Request ID: req-123456
│  └─ Full JSON
├─ Stack Trace (if error)
├─ Related Logs
│  ├─ [Previous error at 15:30:40]
│  └─ [Next error at 15:31:00]
└─ [Export] [Copy JSON] [Create Alert]
```

### Analytics
```
Analytics Overview
├─ Time Range Selector (Today/7 days/30 days/Custom)
├─ KPI Cards
│  ├─ Total Users
│  ├─ Active Users
│  ├─ Total Conversations
│  ├─ Avg Sentiment
│  └─ System Uptime
├─ Charts
│  ├─ User Growth (Line chart)
│  ├─ Conversation Volume (Bar chart)
│  ├─ Top Agents (Table)
│  └─ Feature Usage (Pie chart)
└─ [Export Report]

        ↓ Tabs/Links

User Analytics
├─ User Acquisition
│  ├─ Daily Active Users (DAU)
│  ├─ Monthly Active Users (MAU)
│  └─ Chart
├─ Retention
│  ├─ D1 Retention: 85%
│  ├─ D7 Retention: 65%
│  └─ Cohort Table
├─ Churn
│  ├─ Churn Rate: 2.1%
│  └─ Reasons Breakdown
└─ [Export Cohort Data]

Agent Analytics
├─ Accuracy Trends (Line chart)
├─ Conversation Volume (Bar chart)
├─ Response Time (Avg & P95)
├─ Error Rate
├─ Top Agents by Conversations
├─ Agent Comparison
└─ [Export Agent Report]

System Analytics
├─ API Response Times (P50/P95/P99)
├─ Error Rates
├─ Database Query Performance
├─ Cache Hit Rates
├─ Queue Depth
└─ Infrastructure Metrics
```

### Settings
```
Settings Menu (Sidebar)
├─ General
├─ API Configuration
├─ Features & Flags
├─ Email Configuration
├─ System Configuration
├─ Danger Zone
└─ Admin Tools

        ↓ Click [General]

General Settings
├─ Platform Configuration
│  ├─ Platform Name: Aura
│  ├─ Support Email: support@aura.ai
│  ├─ Support Phone: +1-555-0000
│  └─ [Save]
├─ Company Info
│  ├─ Logo
│  ├─ Description
│  └─ [Save]
└─ Deployment Info
   ├─ Environment: production
   ├─ Version: 0.1.0
   ├─ API Version: v1
   └─ (Read-only)

        ↓ Click [API Configuration]

API Settings
├─ API Keys
│  ├─ Key 1: aura_key_abc123...
│  │  ├─ Created: 2 months ago
│  │  ├─ Last Used: Today
│  │  ├─ [Rotate] [Copy] [Revoke]
│  │  └─ [Delete]
│  └─ [+ Generate New Key]
├─ Rate Limiting
│  ├─ Requests per minute: 1000
│  ├─ Burst size: 5000
│  └─ [Save]
├─ Webhooks
│  ├─ Webhook URL: https://...
│  ├─ Events: [Conversation Created] [Conversation Ended]
│  ├─ [Test Webhook]
│  └─ [Save]
└─ Scopes & Permissions
   ├─ [Select scopes...]
   └─ [Save]

        ↓ Click [Features & Flags]

Feature Flags
├─ Maintenance Mode
│  ├─ Toggle: OFF
│  └─ [Enable] → "Platform in maintenance"
├─ Analytics Tracking
│  ├─ Toggle: ON
│  └─ (Affects user analytics collection)
├─ Beta Features
│  ├─ Toggle: OFF
│  ├─ Rollout: 0%
│  └─ (Private beta for 0% of users)
├─ Advanced Filtering
│  ├─ Toggle: ON
│  ├─ Rollout: 50%
│  └─ (Gradual rollout to 50%)
└─ [Add New Flag]

        ↓ Click [Danger Zone]

Danger Zone
├─ ⚠️  Clear Analytics Cache
│  └─ [Clear Cache] → Confirmation → "Cache cleared"
├─ ⚠️  Reset All Passwords
│  └─ [Reset] → Confirmation → "Password reset emails sent"
├─ ⚠️  Restart Services
│  └─ [Restart] → Confirmation → Status monitor
└─ ⚠️  Delete All Logs
   └─ [Delete] → Double confirmation → "Logs deleted"
```

---

## Modal/Dialog Patterns

### Confirmation Dialog
```
┌──────────────────────────┐
│ Confirm Action           │
├──────────────────────────┤
│                          │
│ Are you sure you want to │
│ delete this agent?       │
│                          │
│ "Customer Support Bot"   │
│                          │
│ This action cannot be    │
│ undone.                  │
│                          │
│ [Cancel] [Delete]        │
│                          │
└──────────────────────────┘
```

### Form Modal
```
┌──────────────────────────┐
│ Create New Agent       ✕ │
├──────────────────────────┤
│                          │
│ Name *                   │
│ [________________]       │
│                          │
│ Model *                  │
│ [Dropdown: gpt-4]        │
│                          │
│ Description              │
│ [__________________]     │
│ [__________________]     │
│                          │
│ Status (inactive)        │
│ [Radio: Active/Inactive] │
│                          │
│ [Cancel] [Create]        │
│                          │
└──────────────────────────┘
```

### Notification Toast
```
✓ Agent created successfully
[Close]

(appears top-right, auto-dismisses in 4s)
```

---

## Page Transitions

```
List → Detail: Slide in from right
Detail → Edit: Modal or inline form
Edit → List: Back with refresh

List → Create: Modal with form
Create → List: Auto-navigate with success toast

Detail → Delete: Confirmation modal
Delete → List: Auto-navigate with info toast

Long operations: Show loading spinner + disabled buttons
```

---

## Responsive Behavior

### Desktop (1920px+)
- Sidebar always visible
- 2-3 column layouts
- Full tables with all columns
- Tooltips on hover

### Tablet (768px - 1024px)
- Sidebar collapsible
- 1-2 column layouts
- Tables: Hide non-critical columns
- Stack cards vertically

### Mobile (< 768px)
- Sidebar drawer
- Single column
- Simplified tables → Cards
- Touch-friendly buttons (48px min)
- Full-screen modals
