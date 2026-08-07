# Sprint 4: Information Architecture

## Admin Platform Structure

```
ADMIN CONSOLE
│
├─ DASHBOARD
│  ├─ KPI Cards (Users, Sessions, Conversations, Health)
│  ├─ Recent Activity Feed
│  └─ System Status (Services, Uptime)
│
├─ AGENT MANAGEMENT
│  ├─ Agent List (Table)
│  │  ├─ Search by name
│  │  ├─ Filter by status (active/training/inactive)
│  │  └─ Sort by accuracy, conversations
│  ├─ Agent Detail (Modal/Page)
│  ├─ Create Agent (Form)
│  ├─ Edit Agent (Form)
│  └─ Delete Agent (Confirmation)
│
├─ PROMPT MANAGEMENT
│  ├─ Prompt List (Table)
│  │  ├─ Search by name/type
│  │  ├─ Filter by type (system/persona/context)
│  │  └─ Filter by agent assignment
│  ├─ Prompt Detail (Full editor)
│  ├─ Prompt Versions (History)
│  ├─ Create Prompt (Editor)
│  ├─ Edit Prompt (Editor)
│  └─ Assign to Agent (Dialog)
│
├─ USER MANAGEMENT
│  ├─ User List (Table)
│  │  ├─ Search by email/name
│  │  ├─ Filter by role (user/admin/moderator)
│  │  ├─ Filter by status (active/inactive/suspended)
│  │  └─ Sort by joined date
│  ├─ User Detail (Profile)
│  ├─ Edit User (Form)
│  ├─ Change Role (Dialog)
│  ├─ Suspend/Unsuspend (Confirmation)
│  └─ Reset Password (Action)
│
├─ CONVERSATION MONITORING
│  ├─ Conversation List (Table)
│  │  ├─ Search by topic/user
│  │  ├─ Filter by status (active/completed/archived)
│  │  ├─ Filter by assigned agent
│  │  └─ Sort by duration/start time
│  ├─ Conversation Detail (Timeline)
│  │  ├─ Message timeline (user ↔ agent)
│  │  ├─ Metadata (user, agent, duration, sentiment)
│  │  ├─ Memory snapshot (context retained)
│  │  └─ Playback (replay conversation)
│  └─ Archive/Delete (Actions)
│
├─ SESSION MONITORING
│  ├─ Active Sessions (Live list)
│  │  ├─ Search by user
│  │  ├─ Filter by device/browser
│  │  ├─ Filter by location
│  │  └─ Sort by duration
│  ├─ Session Detail (Metadata)
│  │  ├─ Device info (OS, browser, version)
│  │  ├─ Location (IP, geo)
│  │  ├─ Duration and idle time
│  │  └─ Activity history
│  └─ Terminate Session (Action)
│
├─ SYSTEM LOGS
│  ├─ Log Viewer (Table)
│  │  ├─ Search by message/service
│  │  ├─ Filter by level (info/warning/error/success)
│  │  ├─ Filter by service (auth/api/db/queue)
│  │  └─ Time range picker
│  ├─ Log Detail (Full entry)
│  │  ├─ Timestamp, level, service
│  │  ├─ Message and full details (JSON)
│  │  ├─ Stack trace (if error)
│  │  └─ Related logs (same request)
│  └─ Export Logs (CSV/JSON)
│
├─ ANALYTICS
│  ├─ Overview Dashboard
│  │  ├─ Revenue/Billing (if applicable)
│  │  ├─ User Growth Chart
│  │  ├─ Conversation Volume Chart
│  │  ├─ Top Agents (by conversations)
│  │  └─ Top Features Used
│  ├─ User Analytics
│  │  ├─ Active Users (daily/weekly/monthly)
│  │  ├─ Retention Rate
│  │  ├─ Churn Rate
│  │  └─ Cohort Analysis
│  ├─ Agent Analytics
│  │  ├─ Accuracy Trends
│  │  ├─ Conversation Count
│  │  ├─ Avg Response Time
│  │  └─ Error Rate
│  └─ System Analytics
│       ├─ API Response Times
│       ├─ Error Rate
│       ├─ Database Performance
│       └─ Queue Depth
│
├─ SETTINGS
│  ├─ General Settings
│  │  ├─ Platform name
│  │  ├─ Support contact
│  │  └─ Deployment info
│  ├─ API Configuration
│  │  ├─ API keys (view/rotate/revoke)
│  │  ├─ Rate limits
│  │  └─ Webhook URLs
│  ├─ Feature Flags
│  │  ├─ Toggle features (beta, maintenance, etc.)
│  │  └─ Per-user feature rollout
│  ├─ Email Configuration
│  │  ├─ SMTP settings
│  │  ├─ Email templates
│  │  └─ Send test email
│  ├─ System Configuration
│  │  ├─ Max concurrent sessions
│  │  ├─ Session timeout
│  │  ├─ Rate limits
│  │  └─ Storage limits
│  └─ Danger Zone
│       ├─ Clear Cache
│       ├─ Reset Analytics
│       └─ Restart Services
│
└─ ADMIN SETTINGS
   ├─ Role Management
   │  ├─ View/edit roles
   │  └─ Manage permissions per role
   ├─ Audit Trail
   │  ├─ All admin actions logged
   │  └─ Exportable audit reports
   └─ API Keys
      ├─ Create/revoke API keys
      └─ Scope-based permissions

```

---

## Navigation Hierarchy

```
Sidebar (Persistent)
├─ Logo
├─ Primary Nav (8 items)
│  ├─ Dashboard
│  ├─ Agents
│  ├─ Prompts
│  ├─ Users
│  ├─ Conversations
│  ├─ Sessions
│  ├─ Logs
│  ├─ Analytics
│  └─ Settings
├─ Secondary Nav (Collapse on mobile)
│  └─ "Admin Settings" (link to admin-only section)
└─ Footer
   ├─ Version info
   └─ Aura branding

Topbar (Persistent)
├─ Left: Page title + breadcrumb
├─ Center: (Empty for mobile space)
└─ Right
   ├─ Search (global search, future)
   ├─ Theme toggle
   ├─ Notifications (future)
   └─ User menu
      ├─ Profile
      ├─ API Keys
      └─ Logout

Modal/Dialog Layer
├─ Create/Edit forms
├─ Confirmations
├─ Notifications (toast)
└─ Modals (details, previews)

```

---

## URL Structure

```
/admin
├─ / (Dashboard)
├─ /agents
│  ├─ / (List)
│  ├─ /:id (Detail)
│  └─ /create (Create form)
├─ /prompts
│  ├─ / (List)
│  ├─ /:id (Detail with versions)
│  └─ /create (Create editor)
├─ /users
│  ├─ / (List)
│  ├─ /:id (Detail)
│  └─ /:id/edit (Edit form)
├─ /conversations
│  ├─ / (List)
│  └─ /:id (Detail + timeline)
├─ /sessions
│  ├─ / (List)
│  └─ /:id (Detail)
├─ /logs
│  ├─ / (List)
│  └─ /:id (Detail)
├─ /analytics
│  ├─ / (Overview)
│  ├─ /users (User analytics)
│  ├─ /agents (Agent analytics)
│  └─ /system (System metrics)
└─ /settings
   ├─ /general
   ├─ /api
   ├─ /features
   ├─ /email
   ├─ /system
   └─ /admin (Admin-only)

```

---

## Page Templates

### 1. List Page Template
```
┌─────────────────────────────────────────┐
│ Page Title + Description                │
│ [+ Create Button]                       │
├─────────────────────────────────────────┤
│ [Search] [Filter Dropdown] [Sort]      │
│ "Showing N items"                       │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Table/Cards ─────────────────────┐ │
│  │ Item 1 [Edit] [Delete]            │ │
│  │ Item 2 [Edit] [Delete]            │ │
│  │ Item 3 [Edit] [Delete]            │ │
│  └─────────────────────────────────────┘ │
│                                         │
│ [← Prev] [1 2 3] [Next →]             │
└─────────────────────────────────────────┘
```

### 2. Detail Page Template
```
┌─────────────────────────────────────────┐
│ ← Back | Item Name                      │
│        [Edit] [Delete] [Archive]       │
├─────────────────────────────────────────┤
│                                         │
│ Overview Card:                          │
│ ┌─────────────────────────────────────┐ │
│ │ Key Metrics (4 cards)               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Details Card:                           │
│ ┌─────────────────────────────────────┐ │
│ │ All metadata and attributes         │ │
│ │ [Edit] [Copy] [Share]               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Activity/Logs Card:                     │
│ ┌─────────────────────────────────────┐ │
│ │ Recent actions/changes              │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Form Template
```
┌─────────────────────────────────────────┐
│ Form Title                              │
├─────────────────────────────────────────┤
│                                         │
│ Section 1: Basic Info                   │
│ ├─ [Field] [Field]                      │
│ └─ [Field]                              │
│                                         │
│ Section 2: Configuration                │
│ ├─ [Field] [Field]                      │
│ ├─ [Field]                              │
│ └─ [Complex Component]                  │
│                                         │
│ Section 3: Advanced                     │
│ └─ [Toggle] → [Expanded Options]        │
│                                         │
│ Footer:                                 │
│ [Cancel] [Save] [Save & Continue]      │
│                                         │
└─────────────────────────────────────────┘
```
