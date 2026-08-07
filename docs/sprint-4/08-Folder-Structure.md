# Sprint 4: Frontend & Backend Folder Structure

## Frontend Folder Structure

```
apps/web/src/
├── admin/                               # Admin console
│   ├── components/                      # Admin-specific components
│   │   ├── Card.tsx                    # Styled card containers
│   │   ├── Button.tsx                  # Styled buttons
│   │   ├── Badge.tsx                   # Status badges
│   │   ├── Input.tsx                   # Form inputs
│   │   ├── Sidebar.tsx                 # Navigation sidebar
│   │   ├── Topbar.tsx                  # Top navigation bar
│   │   ├── Modal.tsx                   # Modal dialog container
│   │   ├── Loading.tsx                 # Loading spinner
│   │   ├── Table.tsx                   # Generic table component
│   │   ├── Pagination.tsx              # Pagination controls
│   │   ├── SearchInput.tsx             # Search with debounce
│   │   ├── FilterDropdown.tsx          # Dropdown filters
│   │   ├── DateRangePicker.tsx         # Date range selector
│   │   ├── CodeEditor.tsx              # Syntax highlighting (prompts)
│   │   └── index.ts                    # Barrel export
│   │
│   ├── hooks/                           # Admin-specific hooks
│   │   ├── useAdminAuth.ts             # Admin auth check
│   │   ├── useDarkMode.ts              # Theme toggle
│   │   ├── usePagination.ts            # Pagination state
│   │   ├── useSearch.ts                # Search with debounce
│   │   ├── useFilters.ts               # Filter state management
│   │   └── useAsync.ts                 # Fetch data hook
│   │
│   ├── pages/                           # Admin page components
│   │   ├── AdminDashboard.tsx          # Dashboard overview
│   │   ├── AgentsPage.tsx              # Agent management
│   │   ├── PromptsPage.tsx             # Prompt management
│   │   ├── UsersPage.tsx               # User management
│   │   ├── ConversationsPage.tsx       # Conversation monitoring
│   │   ├── SessionsPage.tsx            # Session tracking
│   │   ├── LogsPage.tsx                # System logs viewer
│   │   ├── AnalyticsPage.tsx           # Analytics dashboard
│   │   ├── SettingsPage.tsx            # Settings & config
│   │   └── NotFoundPage.tsx            # 404 for admin
│   │
│   ├── routes/                          # Routing configuration
│   │   ├── AdminRoutes.tsx             # Admin route wrapper
│   │   └── AdminLayout.tsx             # Sidebar + topbar layout
│   │
│   ├── styles/                          # Admin styling
│   │   ├── admin.css                   # Admin-specific styles
│   │   ├── theme.css                   # Theme variables
│   │   └── animations.css              # Animations
│   │
│   └── lib/                             # Admin utilities
│       ├── api.ts                      # Admin API calls
│       ├── formatters.ts               # Date, number formatting
│       └── validators.ts               # Form validation
│
├── auth/                                # Auth module
│   ├── AuthContext.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   └── ...
│
├── pages/                               # Main app pages
│   ├── HomePage.tsx
│   ├── ConversationPage.tsx
│   ├── ProfilePage.tsx
│   └── ...
│
├── routes/
│   ├── AppRoutes.tsx
│   ├── ProtectedRoute.tsx
│   └── ...
│
├── lib/                                 # Shared utilities
│   ├── api.ts                          # Main API client
│   ├── catalogues.ts
│   ├── conversationApi.ts
│   └── profileApi.ts
│
├── App.css
├── index.css
├── main.tsx
└── vite-env.d.ts
```

---

## Backend Folder Structure

```
services/api/src/
├── modules/                             # Feature modules
│   │
│   ├── agents/
│   │   ├── agents.controller.ts        # HTTP handlers
│   │   ├── agents.service.ts           # Business logic
│   │   ├── agents.repository.ts        # Data access (optional)
│   │   ├── agents.routes.ts            # Express routes
│   │   ├── agents.schemas.ts           # Zod schemas
│   │   ├── agents.types.ts             # TypeScript types
│   │   └── agents.test.ts              # Unit tests
│   │
│   ├── prompts/
│   │   ├── prompts.controller.ts
│   │   ├── prompts.service.ts
│   │   ├── prompt-versions.service.ts  # Versioning logic
│   │   ├── prompts.routes.ts
│   │   ├── prompts.schemas.ts
│   │   ├── prompts.types.ts
│   │   └── prompts.test.ts
│   │
│   ├── users/                           # User admin endpoints
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.routes.ts
│   │   ├── users.schemas.ts
│   │   ├── users.types.ts
│   │   └── users.test.ts
│   │
│   ├── conversations/                   # Conversation monitoring
│   │   ├── conversations.controller.ts
│   │   ├── conversations.service.ts
│   │   ├── conversations.repository.ts
│   │   ├── conversations.routes.ts
│   │   ├── conversations.schemas.ts
│   │   ├── conversations.types.ts
│   │   └── conversations.test.ts
│   │
│   ├── sessions/                        # Session tracking
│   │   ├── sessions.controller.ts
│   │   ├── sessions.service.ts
│   │   ├── sessions.routes.ts
│   │   ├── sessions.schemas.ts
│   │   ├── sessions.types.ts
│   │   └── sessions.test.ts
│   │
│   ├── logs/                            # Logging & audit
│   │   ├── logs.controller.ts
│   │   ├── logs.service.ts
│   │   ├── audit.service.ts            # Audit logging
│   │   ├── logs.routes.ts
│   │   ├── logs.schemas.ts
│   │   └── logs.test.ts
│   │
│   ├── analytics/                       # Metrics & reporting
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   ├── metrics.service.ts          # Metric calculation
│   │   ├── analytics.routes.ts
│   │   ├── analytics.schemas.ts
│   │   └── analytics.test.ts
│   │
│   ├── settings/                        # Configuration
│   │   ├── settings.controller.ts
│   │   ├── settings.service.ts
│   │   ├── feature-flags.service.ts    # Feature flags
│   │   ├── settings.routes.ts
│   │   ├── settings.schemas.ts
│   │   └── settings.test.ts
│   │
│   ├── auth/                            # Existing auth module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.schemas.ts
│   │   └── ...
│   │
│   ├── profile/                         # Existing profile module
│   ├── conversations/                   # Existing conversations
│   ├── health/                          # Existing health check
│   └── storage/                         # Existing storage
│
├── middleware/                          # Express middleware
│   ├── authenticate.ts                  # JWT verification
│   ├── authorize.ts                     # Role-based access (NEW)
│   ├── error_handler.ts
│   ├── rate_limit.ts
│   ├── request_logger.ts                # Request logging (NEW)
│   ├── audit_logger.ts                  # Mutation logging (NEW)
│   ├── validation.ts                    # Zod error handling (NEW)
│   └── cors.ts
│
├── utils/                               # Utility functions
│   ├── api_response.ts                  # Response formatting
│   ├── http_error.ts
│   ├── async_handler.ts                 # Express error wrapping
│   ├── tokens.ts                        # JWT utilities
│   ├── password.ts
│   ├── logger.ts                        # Winston logger
│   ├── pagination.ts                    # Pagination helpers (NEW)
│   ├── date.ts                          # Date utilities (NEW)
│   ├── validation.ts                    # Form validators (NEW)
│   └── cache.ts                         # Caching utilities (NEW)
│
├── db/                                  # Database layer
│   ├── client.ts                        # Drizzle instance
│   ├── schema.ts                        # Table definitions
│   └── migrations/                      # SQL migrations
│
├── config/                              # Configuration
│   ├── env.ts                           # Environment variables
│   ├── constants.ts                     # App constants
│   └── permissions.ts                   # RBAC matrix (NEW)
│
├── jobs/                                # Background tasks (NEW)
│   ├── analytics-aggregator.ts          # Compute metrics
│   ├── log-retention.ts                 # Clean old logs
│   └── session-cleaner.ts               # Clean expired sessions
│
├── services/                            # Shared services (NEW)
│   ├── email.service.ts                 # Email sending
│   ├── notification.service.ts          # Push notifications
│   ├── cache.service.ts                 # Redis cache
│   └── queue.service.ts                 # Job queue
│
├── app.ts                               # Express app factory
├── index.ts                             # Entry point
└── types/
    └── global.d.ts                      # Global type definitions
```

---

## Database & Migration Structure

```
services/api/
├── drizzle/                             # Drizzle migrations
│   ├── 0001_initial.sql                # Initial schema
│   ├── 0002_users_roles.sql            # Add user roles
│   ├── 0003_agents_table.sql           # Agents module
│   ├── 0004_prompts_table.sql          # Prompts module
│   ├── 0005_audit_logs.sql             # Audit logging
│   ├── 0006_analytics.sql              # Analytics tables
│   ├── 0007_feature_flags.sql          # Feature flags
│   ├── 0008_indexes.sql                # Performance indexes
│   └── meta/                           # Drizzle metadata
│       ├── _journal.json               # Migration journal
│       └── snapshots/                  # Schema snapshots
│
└── drizzle.config.ts                   # Drizzle configuration
```

---

## Package Structure

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── admin.ts                    # Admin API types
│   │   ├── auth.ts
│   │   ├── conversation.ts
│   │   └── user.ts
│   ├── schemas/
│   │   ├── admin.ts                    # Admin Zod schemas
│   │   └── ...
│   └── index.ts                        # Barrel export
├── package.json
└── tsconfig.json
```

---

## Test Structure

```
services/api/tests/
├── unit/
│   ├── agents.service.test.ts
│   ├── prompts.service.test.ts
│   ├── users.service.test.ts
│   └── ...
├── integration/
│   ├── agents.api.test.ts
│   ├── prompts.api.test.ts
│   ├── auth.test.ts
│   └── ...
├── e2e/
│   ├── admin-flow.test.ts              # Full admin workflows
│   └── permissions.test.ts             # RBAC verification
└── fixtures/
    ├── users.ts                        # Test data
    ├── agents.ts
    └── prompts.ts
```

---

## Build & Distribution

```
apps/web/
├── dist/                                # Built output
│   ├── index.html
│   ├── assets/                         # JS/CSS chunks
│   └── ...
├── vite.config.ts                      # Vite configuration
├── tsconfig.json
├── package.json
└── .eslintrc.json

services/api/
├── dist/                                # Compiled output
│   ├── modules/
│   ├── middleware/
│   ├── app.js
│   └── index.js
├── tsconfig.json
├── package.json
├── .eslintrc.json
└── drizzle.config.ts
```

---

## Key Principles

### Single Responsibility
Each file has one clear purpose:
- `.controller.ts` - HTTP request/response only
- `.service.ts` - Business logic only
- `.repository.ts` - Data access only
- `.schemas.ts` - Validation only

### Barr Exports
```typescript
// agents/index.ts
export { agentsController } from './agents.controller';
export { agentsService } from './agents.service';
export * from './agents.types';
```

Usage:
```typescript
import { agentsService } from './agents';  // Clean imports
```

### Shared vs Local
- **Shared** (`packages/shared`) - Types, schemas used by both frontend & backend
- **Local** (`apps/web/src/admin/lib`, `services/api/utils`) - Module-specific utilities

### No Circular Dependencies
- Frontend calls backend APIs only (not vice versa)
- Modules don't import from other modules (use services)
- Utils can be imported by anyone

### Testing Colocation
```
agents/
├── agents.service.ts
├── agents.service.test.ts          ← Same folder
├── agents.controller.ts
└── agents.controller.test.ts       ← Same folder
```
