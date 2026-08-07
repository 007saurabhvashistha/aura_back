# Sprint 4: Backend Module Architecture

## Module Organization

```
services/api/src/
├── modules/
│   ├── agents/                          # Agent management
│   │   ├── agents.controller.ts
│   │   ├── agents.service.ts
│   │   ├── agents.routes.ts
│   │   ├── agents.schemas.ts
│   │   ├── agents.types.ts
│   │   └── agents.repository.ts
│   │
│   ├── prompts/                         # Prompt management
│   │   ├── prompts.controller.ts
│   │   ├── prompts.service.ts
│   │   ├── prompts.routes.ts
│   │   ├── prompts.schemas.ts
│   │   ├── prompts.types.ts
│   │   └── prompt-versions.service.ts
│   │
│   ├── users/                           # User management (admin)
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.routes.ts
│   │   ├── users.schemas.ts
│   │   └── users.types.ts
│   │
│   ├── conversations/                   # Conversation monitoring
│   │   ├── conversations.controller.ts
│   │   ├── conversations.service.ts
│   │   ├── conversations.routes.ts
│   │   ├── conversations.schemas.ts
│   │   └── conversations.types.ts
│   │
│   ├── sessions/                        # Session tracking
│   │   ├── sessions.controller.ts
│   │   ├── sessions.service.ts
│   │   ├── sessions.routes.ts
│   │   ├── sessions.schemas.ts
│   │   └── sessions.types.ts
│   │
│   ├── logs/                            # System logging & audit
│   │   ├── logs.controller.ts
│   │   ├── logs.service.ts
│   │   ├── logs.routes.ts
│   │   ├── logs.schemas.ts
│   │   └── audit.service.ts
│   │
│   ├── analytics/                       # Analytics & metrics
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   ├── analytics.routes.ts
│   │   ├── analytics.schemas.ts
│   │   └── metrics.service.ts
│   │
│   ├── settings/                        # Platform settings
│   │   ├── settings.controller.ts
│   │   ├── settings.service.ts
│   │   ├── settings.routes.ts
│   │   ├── settings.schemas.ts
│   │   └── feature-flags.service.ts
│   │
│   ├── auth/                            # Authentication (existing)
│   ├── conversations/                   # Conversation (existing)
│   ├── profile/                         # User profile (existing)
│   └── health/                          # Health check (existing)
│
├── middleware/
│   ├── authenticate.ts                  # JWT verification
│   ├── authorize.ts                     # Role-based access control
│   ├── error_handler.ts
│   ├── rate_limit.ts
│   ├── request_logger.ts                # NEW: Request logging
│   └── audit_logger.ts                  # NEW: Mutation logging
│
├── utils/
│   ├── api_response.ts                  # Response formatting
│   ├── http_error.ts
│   ├── tokens.ts
│   ├── password.ts
│   ├── logger.ts
│   ├── async_handler.ts
│   └── pagination.ts                    # NEW: Pagination helpers
│
├── db/
│   ├── client.ts                        # Drizzle instance
│   └── schema.ts                        # All table definitions
│
├── config/
│   └── env.ts                           # Environment config
│
├── app.ts                               # Express app factory
└── index.ts                             # Entry point

```

---

## Module Patterns

### 1. Service Layer Pattern

**Purpose:** Encapsulate business logic

```typescript
// agents.service.ts
export const agentsService = {
  async list(query: ListAgentsQuery): Promise<{ data: Agent[]; total: number }> {
    // Pagination + filtering logic
  },

  async getById(id: string): Promise<Agent> {
    // Fetch and transform
  },

  async create(input: CreateAgentInput, createdBy: string): Promise<Agent> {
    // Validation + creation + audit
  },

  async update(id: string, input: UpdateAgentInput): Promise<Agent> {
    // Validation + update + audit
  },

  async delete(id: string): Promise<void> {
    // Soft delete + audit
  },

  async incrementConversationCount(agentId: string): Promise<void> {
    // Internal helper
  },
};
```

**Benefits:**
- Testable business logic (no HTTP concerns)
- Reusable across controllers and async tasks
- Clear separation of concerns
- Easy to mock

### 2. Controller Layer Pattern

**Purpose:** HTTP request/response handling

```typescript
// agents.controller.ts
export const agentsController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listAgentsQuerySchema.parse(req.query);
    const { data, total } = await agentsService.list(query);
    res.json(success({ data, pagination: { total } }));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createAgentSchema.parse(req.body);
    const agent = await agentsService.create(input, req.user!.id);
    res.status(201).json(success(agent, 'Agent created'));
  },

  // ... update, delete, etc.
};
```

**Benefits:**
- Thin controllers (logic in services)
- Consistent error handling (middleware catches)
- Input validation at boundary

### 3. Authorization Middleware Pattern

**Purpose:** Role-based access control

```typescript
// middleware/authorize.ts
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw HttpError.unauthorized();
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw HttpError.forbidden('Insufficient permissions');
    }
    next();
  };
}

// Usage in routes
agentsRouter.get('/', authorize('admin', 'operator'), agentsController.list);
agentsRouter.post('/', authorize('admin'), agentsController.create);
```

### 4. Audit Logging Pattern

**Purpose:** Track all mutations for compliance

```typescript
// middleware/audit_logger.ts
export function auditLog(resource: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(data: any) {
      if (req.method !== 'GET') {
        auditService.log({
          userId: req.user?.id,
          action: req.method,
          resource,
          resourceId: req.params.id,
          oldValue: req.body?.old,
          newValue: data,
          ipAddress: req.ip,
          timestamp: new Date(),
        });
      }
      return originalJson.call(this, data);
    };
    next();
  };
}

// Usage
agentsRouter.post('/', auditLog('agents'), agentsController.create);
```

### 5. Pagination Helper Pattern

**Purpose:** Consistent pagination across list endpoints

```typescript
// utils/pagination.ts
export async function paginate<T>(
  query: number,
  limit: number,
  total: number,
): Promise<PaginationMeta> {
  return {
    page: Math.max(1, query),
    limit: Math.min(limit, 100),
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: query * limit < total,
  };
}

// Usage
const { data, total } = await agentsService.list(query);
const pagination = await paginate(query.page, query.limit, total);
res.json(success({ data, pagination }));
```

---

## Request/Response Flow

```
Request
   ↓
┌─────────────────────────────────────┐
│ Middleware Layer                    │
├─────────────────────────────────────┤
│ 1. Authenticate (JWT)               │
│ 2. Authorize (Role)                 │
│ 3. Request Logger                   │
│ 4. Rate Limiter                     │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Controller Layer                    │
├─────────────────────────────────────┤
│ 1. Parse & validate input (Zod)     │
│ 2. Call service                     │
│ 3. Format response                  │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Service Layer                       │
├─────────────────────────────────────┤
│ 1. Business logic                   │
│ 2. Database queries                 │
│ 3. Error handling                   │
│ 4. Audit logging                    │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ Data Layer                          │
├─────────────────────────────────────┤
│ 1. Drizzle ORM queries              │
│ 2. Database execution               │
│ 3. Result transformation            │
└─────────────────────────────────────┘
   ↓
Response
```

---

## Error Handling Strategy

```typescript
// All errors bubble up to error_handler middleware

// Service throws
throw HttpError.badRequest('Agent name already exists');
throw HttpError.notFound('Agent not found');
throw HttpError.unauthorized('Invalid token');
throw HttpError.forbidden('Admin access required');

// Error handler catches and formats
{
  "status": "error",
  "message": "Agent name already exists",
  "data": null,
  "errors": [
    {
      "code": "bad_request",
      "message": "Agent name already exists"
    }
  ],
  "meta": null
}
```

---

## Dependency Injection Pattern

**No complex DI container needed.** Use simple module exports:

```typescript
// agents.service.ts
export const agentsService = { /* ... */ };

// agents.controller.ts
import { agentsService } from './agents.service';

// Easy to mock in tests
vi.mock('./agents.service', () => ({
  agentsService: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));
```

---

## Testing Strategy

```
Unit Tests (Services)
├─ agentsService.list() → pagination, filtering
├─ agentsService.create() → validation, constraints
├─ agentsService.update() → business logic
└─ agentsService.delete() → soft delete

Integration Tests (APIs)
├─ GET /api/v1/admin/agents → 200 with data
├─ POST /api/v1/admin/agents → 201 with created agent
├─ PUT /api/v1/admin/agents/:id → 200 with updated agent
├─ DELETE /api/v1/admin/agents/:id → 204 no content
└─ Error cases (401, 403, 400, 404)

Authorization Tests
├─ Non-admin user → 403 Forbidden
├─ Missing auth header → 401 Unauthorized
└─ Expired token → 401 Unauthorized
```
