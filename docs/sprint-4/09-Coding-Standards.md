# Sprint 4: Coding Standards

## TypeScript

### Strict Mode

All TypeScript must compile with strict settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Annotations

✅ **Do:**
```typescript
function calculateTotal(items: Agent[], taxRate: number): number {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: Date;
}

const users: User[] = [];
```

❌ **Don't:**
```typescript
function calculateTotal(items, taxRate) {  // No types
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + taxRate);
}

const users = [];  // Inferred as any[]
const role: any = 'admin';  // Never use any
```

### Naming Conventions

```typescript
// Interfaces/Types: PascalCase, descriptive nouns
interface Agent { }
interface CreateAgentInput { }
interface AgentRow { }

// Functions/Methods: camelCase, verb-first
function createAgent() { }
export const agentsService = { }

// Constants: UPPER_SNAKE_CASE for true constants
const MAX_AGENTS = 100;
const DEFAULT_PAGE_SIZE = 10;

// Classes: PascalCase
class AgentValidator { }

// Files:
// - Components: PascalCase.tsx (AgentsPage.tsx)
// - Services: snake_case.ts (agents.service.ts)
// - Types: snake_case.ts (agents.types.ts)
// - Schemas: snake_case.ts (agents.schemas.ts)
```

### Imports/Exports

✅ **Do:**
```typescript
// Named exports
export const agentsService = { /* ... */ };
export type Agent = { /* ... */ };

// Barrel exports
// agents/index.ts
export { agentsController } from './agents.controller';
export { agentsService } from './agents.service';
export type { Agent } from './agents.types';

// Usage
import { agentsService, type Agent } from './agents';
```

❌ **Don't:**
```typescript
// Default exports (avoid for clarity)
export default agentsService;

// Star imports (too broad)
import * as agents from './agents';

// Mixing relative/absolute
import Service from '../../../services/agents.service';  // Use absolute
```

### Error Handling

```typescript
// Throw HttpError from services
throw HttpError.badRequest('Agent name already exists');
throw HttpError.notFound('Agent not found');
throw HttpError.forbidden('Admin access required');

// Never throw generic Error
// ❌ throw new Error('Something went wrong');
// ✅ throw HttpError.internalServerError('Database error');
```

---

## React & Frontend

### Component Structure

```typescript
// agents/components/AgentCard.tsx
import { FC } from 'react';
import type { Agent } from '../types';

interface Props {
  agent: Agent;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const AgentCard: FC<Props> = ({ agent, onEdit, onDelete }) => {
  return (
    <div className="agent-card">
      <h3>{agent.name}</h3>
      <p>{agent.description}</p>
      <div className="actions">
        {onEdit && <button onClick={onEdit}>Edit</button>}
        {onDelete && <button onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
};

// Export with display name for dev tools
AgentCard.displayName = 'AgentCard';
```

### Hook Usage

✅ **Do:**
```typescript
// Custom hook for data fetching
export function useAgents(page: number) {
  const [data, setData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents(page)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  return { data, loading, error };
}

// Usage in component
const { data: agents, loading, error } = useAgents(1);
```

❌ **Don't:**
```typescript
// Inline logic in component
const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  
  useEffect(() => {
    // Complex logic inline - extract to hook
    fetch('/api/agents')
      .then(res => res.json())
      .then(setAgents);
  }, []);
};
```

### Styling

Use Tailwind CSS + CSS modules for scoped styles:

```typescript
// components/AgentCard.tsx
import styles from './AgentCard.module.css';

export const AgentCard = ({ agent }) => {
  return (
    <div className={`${styles.card} bg-white shadow-lg`}>
      <h3 className="text-lg font-bold">{agent.name}</h3>
      <p className={styles.description}>{agent.description}</p>
    </div>
  );
};
```

```css
/* components/AgentCard.module.css */
.card {
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

.description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}
```

---

## Backend/API

### Service Pattern

```typescript
// agents.service.ts - Business logic only (no HTTP)
export const agentsService = {
  async list(query: ListAgentsQuery): Promise<{ data: Agent[]; total: number }> {
    const { page, limit, status, search } = query;
    const offset = (page - 1) * limit;

    const conditions = [isNull(agents.deletedAt)];
    if (status !== 'all') conditions.push(eq(agents.status, status));
    if (search) conditions.push(like(agents.name, `%${search}%`));

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(agents)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(agents).where(and(...conditions)),
    ]);

    return {
      data: rows.map(rowToAgent),
      total: totalResult[0]?.count ?? 0,
    };
  },

  async create(input: CreateAgentInput, createdBy: string): Promise<Agent> {
    const existing = await db
      .select()
      .from(agents)
      .where(and(eq(agents.name, input.name), isNull(agents.deletedAt)));

    if (existing.length) {
      throw HttpError.badRequest('Agent with this name already exists');
    }

    const [row] = await db
      .insert(agents)
      .values({
        name: input.name,
        description: input.description || null,
        model: input.model,
        status: input.status || 'inactive',
        accuracy: null,
        conversationCount: 0,
        createdBy,
      })
      .returning();

    return rowToAgent(row);
  },

  // ... update, delete, etc.
};
```

### Controller Pattern

```typescript
// agents.controller.ts - HTTP handling only
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
};
```

### Zod Schemas

```typescript
// agents.schemas.ts - Validation only
export const createAgentSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(1000).optional(),
    model: z.enum(['gpt-4', 'claude-3', 'llama-2', 'gpt-3.5']),
    status: z.enum(['active', 'inactive', 'training']).default('inactive'),
    systemPromptId: z.string().uuid().optional(),
    personaPromptId: z.string().uuid().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
```

### Response Format

```typescript
// Consistent response structure
const successResponse = {
  status: 'success' as const,
  message: 'Agent created',
  data: { /* actual data */ },
};

const errorResponse = {
  status: 'error' as const,
  message: 'Agent name already exists',
  data: null,
  errors: [{ code: 'bad_request', message: '...' }],
};
```

---

## Comments & Documentation

### Code Comments

✅ **Do:**
```typescript
// Only comment WHY, not WHAT
// Caching agent accuracy because it's expensive to compute
const cachedAccuracy = await cache.get(`agent:${id}:accuracy`);
if (cachedAccuracy) return cachedAccuracy;

// Soft delete to preserve audit trail
await db.update(agents).set({ deletedAt: new Date() });
```

❌ **Don't:**
```typescript
// ❌ These are noise - the code is clear
// Set the name
const name = 'Agent';
// Push to array
items.push(item);

// ❌ Comments that repeat code
// Fetch agents from database
const agents = await db.select().from(agents);
```

### JSDoc for Public APIs

```typescript
/**
 * Create a new AI agent.
 *
 * @param input - Agent configuration
 * @param createdBy - User ID of creator
 * @returns Created agent with metadata
 * @throws HttpError.badRequest if name is duplicate
 * @throws HttpError.unauthorized if user lacks permission
 *
 * @example
 * const agent = await agentsService.create({
 *   name: 'Support Bot',
 *   model: 'gpt-4',
 * }, userId);
 */
export async function createAgent(
  input: CreateAgentInput,
  createdBy: string,
): Promise<Agent> {
  // implementation
}
```

---

## Git Conventions

### Branch Names

```
feature/sprint-4-admin-dashboard
feature/agent-management
fix/null-pointer-exception
docs/api-contracts
refactor/pagination-logic
chore/update-dependencies
```

### Commit Messages

```
Format: <type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scope: sprint-4, agents, auth, etc.
Subject: Imperative, no capital, no period

Example:
feat(sprint-4): implement agent listing with pagination
fix(agents): handle duplicate name validation
docs(api): update REST contract for agents endpoints
refactor(auth): extract token validation to utility
test(agents): add integration tests for CRUD
```

---

## Linting & Formatting

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier"
  ],
  "rules": {
    "no-unused-vars": "error",
    "no-implicit-any": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react/react-in-jsx-scope": "off",
    "react/display-name": "off"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Pre-commit Hooks

```bash
# Run in CI/CD before merge
npm run lint      # ESLint
npm run format    # Prettier
npm run type-check # TypeScript
npm run test      # Unit tests
```

---

## Performance

### Frontend

✅ **Do:**
```typescript
// Memoize expensive components
const AgentCard = memo(({ agent }: Props) => (
  <div>{agent.name}</div>
));

// Debounce search
const debouncedSearch = useMemo(
  () => debounce((query: string) => search(query), 300),
  [],
);
```

### Backend

✅ **Do:**
```typescript
// Use database indexes for filtered queries
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_created_at ON agents(created_at);

// Batch database queries
const [agents, total] = await Promise.all([
  db.select().from(agents).limit(10),
  db.select({ count: count() }).from(agents),
]);
```

---

## Testing

### Test Structure

```typescript
describe('AgentsService', () => {
  describe('create', () => {
    it('should create an agent with valid input', async () => {
      const input = { name: 'Bot', model: 'gpt-4' };
      const result = await agentsService.create(input, userId);
      expect(result.name).toBe('Bot');
    });

    it('should reject duplicate names', async () => {
      await agentsService.create(input, userId);
      await expect(agentsService.create(input, userId))
        .rejects
        .toThrow('already exists');
    });
  });
});
```

### Coverage Goals

- **Services:** 80%+ coverage
- **Controllers:** 70%+ coverage (mostly integration tests)
- **Utils:** 95%+ coverage
- **Pages/Components:** 60%+ (integration over unit)
