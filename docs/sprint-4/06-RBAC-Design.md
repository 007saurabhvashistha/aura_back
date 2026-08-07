# Sprint 4: RBAC Design (Role-Based Access Control)

## Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                  PLATFORM ADMIN                         │
│  (Super user - all access, can manage all resources)   │
│  - Manage agents, prompts, users                        │
│  - View/export analytics, logs, audit trail            │
│  - Configure system settings, feature flags            │
│  - Manage other admins and roles                       │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
                ▼         ▼         ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  Operator    │ │  Moderator   │ │ Analytics    │
    │  (Manage     │ │  (Monitor    │ │ Viewer       │
    │   agents &   │ │   conversations  │  (Read-only) │
    │   prompts)   │ │   & users)   │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘
                │         │         │
                └─────────┼─────────┘
                          │
                          ▼
    ┌──────────────────────────────────────┐
    │        END USER (user)               │
    │  (No admin access)                   │
    └──────────────────────────────────────┘
```

---

## Permission Matrix

| Resource | Action | Admin | Operator | Moderator | Analyst | User |
|----------|--------|-------|----------|-----------|---------|------|
| **Agents** | List | ✅ | ✅ | ❌ | ❌ | ❌ |
| | View Detail | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Update | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Prompts** | List | ✅ | ✅ | ❌ | ❌ | ❌ |
| | View Detail | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Update | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Users** | List | ✅ | ❌ | ✅ | ❌ | ❌ |
| | View Detail | ✅ | ❌ | ✅ | ❌ | View Own |
| | Update | ✅ | ❌ | ✅ | ❌ | Own Only |
| | Change Role | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Suspend/Ban | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Conversations** | List | ✅ | ❌ | ✅ | ✅ | Own Only |
| | View Detail | ✅ | ❌ | ✅ | ✅ | Own Only |
| | Archive | ✅ | ❌ | ✅ | ❌ | Own Only |
| | Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sessions** | List | ✅ | ❌ | ✅ | ❌ | View Own |
| | View Detail | ✅ | ❌ | ✅ | ❌ | View Own |
| | Terminate | ✅ | ❌ | ✅ | ❌ | Own Only |
| **Logs** | List | ✅ | ❌ | ✅ | ✅ | ❌ |
| | View Detail | ✅ | ❌ | ✅ | ✅ | ❌ |
| | Export | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Analytics** | View All | ✅ | ❌ | ❌ | ✅ | ❌ |
| | View Agent | ✅ | ✅ | ✅ | ✅ | ❌ |
| | View User | ✅ | ❌ | ✅ | ✅ | Own Only |
| | Export Report | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Settings** | View | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Update General | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Update API | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Manage Features | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Manage Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Audit Trail** | View | ✅ | ❌ | ✅ | ✅ | ❌ |
| | Export | ✅ | ❌ | ✅ | ✅ | ❌ |

---

## Authorization Implementation

### JWT Token Structure

```typescript
{
  sub: "user-uuid",           // Subject (user ID)
  email: "user@example.com",
  role: "admin",              // Admin role
  iat: 1691000000,           // Issued at
  exp: 1691003600,           // Expires in 1 hour
  type: "access"
}
```

### Middleware Pattern

```typescript
// middleware/authorize.ts
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw HttpError.unauthorized('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw HttpError.forbidden('Insufficient permissions for this action');
    }
    next();
  };
}

// Usage in routes
agentsRouter.get('/', authorize('admin', 'operator'), getAgents);
usersRouter.post('/', authorize('admin'), createUser);
```

### Field-Level Authorization

```typescript
// In controller - hide sensitive fields
export const usersController = {
  async getUser(req: Request, res: Response) {
    const user = await usersService.getById(req.params.id);
    
    // Admin sees everything
    if (req.user!.role === 'admin') {
      return res.json(success(user));
    }
    
    // Moderator sees less
    if (req.user!.role === 'moderator') {
      const filtered = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      };
      return res.json(success(filtered));
    }
    
    // User sees only own profile
    if (user.id !== req.user!.id) {
      throw HttpError.forbidden('Cannot view other user profiles');
    }
    return res.json(success(user));
  },
};
```

### Row-Level Authorization (Conversations)

```typescript
// Only admin/moderator or conversation owner can view
export async function getConversation(id: string, userId: string, userRole: string) {
  const convo = await db.select().from(conversations).where(eq(conversations.id, id));
  
  if (!convo) {
    throw HttpError.notFound();
  }
  
  // Admin/moderator sees all conversations
  if (['admin', 'moderator'].includes(userRole)) {
    return convo;
  }
  
  // User can only see own conversations
  if (convo.userId !== userId) {
    throw HttpError.forbidden('Cannot access other user conversations');
  }
  
  return convo;
}
```

---

## Role Definitions

### Platform Admin

**Description:** Full system access, can manage all features and users.

**Capabilities:**
- Create, read, update, delete agents
- Create, read, update, delete prompts
- Manage all users (change roles, suspend)
- View all conversations and sessions
- Access complete audit trail
- Configure system settings
- Manage feature flags
- Create/revoke API keys

**Use Case:** Platform founders, DevOps engineers, system administrators

**Database Entry:**
```sql
INSERT INTO roles (id, name, description) VALUES
('admin-role-1', 'Platform Admin', 'Full system access');
```

---

### Operator

**Description:** Manages AI agents and prompts, monitors system health.

**Capabilities:**
- Create, read, update agents
- Create, read, update prompts
- View agent analytics
- View system logs
- Cannot delete agents (Admin only)
- Cannot manage users

**Use Case:** AI engineers, product managers, system maintainers

---

### Moderator

**Description:** Monitors conversations, manages users, enforces policies.

**Capabilities:**
- View and manage conversations (archive, detail)
- View active sessions
- Manage user status (suspend, reset password)
- View audit trail for moderation
- Cannot create/edit agents or prompts
- Cannot delete anything

**Use Case:** Customer support leads, compliance officers, community managers

---

### Analytics Viewer

**Description:** Read-only access to analytics and reporting.

**Capabilities:**
- View all analytics dashboards
- View system logs (read-only)
- Export reports
- Cannot modify any data
- Cannot access user details beyond analytics

**Use Case:** Data analysts, business stakeholders, finance team

---

### User (Default Role)

**Description:** End-user with no admin access.

**Capabilities:**
- View own profile
- View own conversations
- View own sessions
- Cannot access admin panel

**Use Case:** Regular product users

---

## Permission Model

### Principle of Least Privilege

```
Admin has all permissions
  ↓
Operator has agent/prompt mgmt
  ↓
Moderator has conversation mgmt
  ↓
Analytics Viewer has read-only access
  ↓
User has personal access only
```

### Feature Flags for Gradual Rollout

```typescript
// Grant new features to subsets of roles first
const canUseAdvancedFiltering = await featureFlagService.isEnabled(
  'advanced-filtering',
  {
    roles: ['admin', 'operator'],  // Only these roles
    percentage: 50,                 // 50% of those users
  }
);

if (!canUseAdvancedFiltering) {
  throw HttpError.forbidden('Feature not available to your role');
}
```

---

## Database Design for RBAC

### Schema

```sql
-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Role mapping (many-to-many for future multi-role support)
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,        -- 'agents', 'prompts', etc.
  action TEXT NOT NULL,          -- 'read', 'write', 'delete', 'admin'
  PRIMARY KEY (role_id, resource, action)
);

-- Feature flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0,  -- 0-100
  roles_allowed TEXT[] DEFAULT NULL,      -- role IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Authorization Audit

Every authorized action is logged:

```typescript
// In audit middleware
{
  userId: "uuid",
  action: "CREATE",
  resource: "agents",
  resourceId: "new-agent-uuid",
  role: "admin",
  allowed: true,
  timestamp: "2026-08-06T15:00:00Z",
  ipAddress: "192.168.1.100"
}
```

This enables:
- Compliance reporting
- Security investigation
- Permission audit trails
- Access pattern analysis

---

## Future: Attribute-Based Access Control (ABAC)

As the system grows, can extend to attributes:

```typescript
// Policy: Admin in 'engineering' department can delete agents
{
  role: "admin",
  department: "engineering",
  resource: "agents",
  action: "delete"
}

// Policy: Support can only view conversations from their region
{
  role: "moderator",
  region: "us-west",
  resource: "conversations",
  action: "read",
  constraints: { createdIn: "us-west" }
}
```

---

## Security Considerations

1. **Token Expiration** - Access tokens expire in 1 hour
2. **Refresh Rotation** - Refresh tokens rotate on use
3. **Permission Checking** - Every endpoint validates role
4. **Audit Logging** - All access logged for compliance
5. **Principle of Least Privilege** - Start restrictive, add permissions
6. **Role Separation** - Can't promote self to admin
7. **Field Masking** - Sensitive fields hidden from lower roles
