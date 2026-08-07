# Sprint 4: Security Model

## Authentication & Authorization

### JWT-Based Authentication

**Flow:**
```
1. User logs in (email + password)
2. Server validates credentials
3. Server creates two tokens:
   - Access Token (1 hour)
   - Refresh Token (7 days, persisted)
4. Client stores both (AccessToken in memory, RefreshToken in cookie)
5. Client sends AccessToken in Authorization header for requests
6. On expiry, client uses RefreshToken to get new AccessToken
```

**Token Structure:**
```typescript
{
  sub: "user-uuid",
  email: "user@example.com",
  role: "admin",
  iat: 1691000000,
  exp: 1691003600,
  type: "access"
}
```

### Refresh Token Rotation

```typescript
// On refresh, invalidate old refresh token
// Create new refresh token pair

await db.delete(refreshTokens).where(eq(refreshTokens.id, jti));
const newJti = randomUUID();
const newRefreshToken = signRefreshToken(userId, newJti);
await db.insert(refreshTokens).values({
  id: newJti,
  userId,
  tokenHash: hashToken(newRefreshToken),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});
```

**Benefits:**
- Limits window of token compromise
- Can detect stolen tokens (rotation pattern broken)
- Previous token immediately invalid

### Secure Storage

```typescript
// Frontend
// ✅ AccessToken: In memory (cleared on logout)
// ✅ RefreshToken: HttpOnly cookie (cannot be stolen by XSS)
//    - Secure flag (HTTPS only)
//    - SameSite=Strict (CSRF protection)

// Backend
// ✅ Password: Bcrypt hashed (salt cost: 12)
// ✅ Refresh Token: SHA-256 hashed in DB (salted)
// ✅ API Keys: Hashed like passwords
```

---

## Access Control

### Admin Panel Access

```typescript
// 1. Authenticate
import { authenticate } from './middleware/authenticate';
app.use(authenticate);  // All /api/admin/* routes require JWT

// 2. Authorize by role
import { authorize } from './middleware/authorize';
agentsRouter.use(authorize('admin', 'operator'));  // Only these roles

// 3. Enforce at data level
async function getConversation(id: string, userId: string, userRole: string) {
  const convo = await db.query.conversations.findFirst({ where: eq(id) });
  
  // Admins/moderators see all
  if (['admin', 'moderator'].includes(userRole)) return convo;
  
  // Users only see own
  if (convo.userId !== userId) throw HttpError.forbidden();
  
  return convo;
}
```

### Permission Hierarchy

```
Admin (All)
  ├─ Operator (Agents + Prompts)
  ├─ Moderator (Conversations + Users)
  └─ Analyst (Read-only)

User (Personal data only)
```

---

## Data Protection

### Encryption at Rest

**Database:** PostgreSQL with encryption at storage layer (Neon handles this)

**Sensitive Fields (Future):**
```typescript
// Store encrypted
const encrypted = await cipher.encrypt(sensitiveData, encryptionKey);
await db.insert(table).values({ field: encrypted });

// Decrypt on retrieval
const decrypted = await cipher.decrypt(row.field, encryptionKey);
```

### Encryption in Transit

```typescript
// All traffic HTTPS only
// ✅ TLS 1.3 minimum
// ✅ HSTS headers
// ✅ Secure cookies

app.use(helmet());  // Security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### System Settings Security

**Sensitive Configuration Fields:**
```typescript
// Fields that should be encrypted/redacted in settings table:
// - smtp_password
// - api_keys
// - webhook_secrets
// - encryption_key_material
// - database_connection_strings

// Implementation:
// 1. Store encrypted in system_settings.setting_value
// 2. Never return sensitive fields to frontend except admin
// 3. Audit all changes via audit_log
// 4. Rotate secrets on a schedule
```

**Access Control for System Settings:**
```typescript
// Only Platform Admin can:
// - View all settings
// - Modify any setting
// - Rotate secrets

// Implementation:
app.put('/api/v1/admin/settings', authenticate, authorize('admin'), updateSettings);
```

---

## Input Validation

### Frontend Validation

```typescript
// Client-side validation (UX only, not security)
const schema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
});

const result = schema.safeParse(formData);
if (!result.success) {
  // Show error to user
}
```

### Server-Side Validation (Enforcement)

```typescript
// ✅ ALWAYS validate at server (client can be bypassed)
export const createAgentSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    model: z.enum(['gpt-4', 'claude-3']),
  })
  .strict();  // Reject unknown fields

export const agentsController = {
  async create(req: Request, res: Response) {
    // Validate before processing
    const input = createAgentSchema.parse(req.body);
    // ...
  },
};
```

### SQL Injection Prevention

```typescript
// ✅ Drizzle ORM prevents SQL injection
const agents = await db
  .select()
  .from(agents)
  .where(eq(agents.name, userInput));  // Parameterized

// ❌ Never concatenate user input
// const query = `SELECT * FROM agents WHERE name = '${userInput}'`;
```

### XSS Prevention

```typescript
// ✅ React auto-escapes by default
<div>{userContent}</div>  // Safe

// ❌ Only unsafe if using dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />  // Risky

// Sanitize if needed
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userContent);
```

---

## Audit Logging

### What to Log

```typescript
// Every mutation (POST, PUT, DELETE) logged
export const auditLog = (resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      auditService.log({
        userId: req.user?.id,
        action: req.method,  // POST, PUT, DELETE
        resource,            // agents, users, prompts
        resourceId: req.params.id,
        oldValue: req.body?.old,
        newValue: req.body,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date(),
      });
    }
    next();
  };
};
```

### Audit Trail Example

```json
{
  "timestamp": "2026-08-06T15:30:45.123Z",
  "userId": "user-123",
  "action": "PUT",
  "resource": "agents",
  "resourceId": "agent-456",
  "changes": {
    "status": { "from": "inactive", "to": "active" },
    "accuracy": { "from": null, "to": 94.2 }
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### Retention Policy

```
- Keep forever for compliance
- Exportable for audits
- Searchable by resource/date range
- Tamper-proof (immutable inserts only)
```

---

## Rate Limiting

### API Rate Limits

```typescript
import rateLimit from 'express-rate-limit';

// General API limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests
  message: 'Too many requests',
  standardHeaders: true,      // Return limit in `RateLimit-*` headers
});

app.use(limiter);

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 login attempts
  skip: (req) => req.method !== 'POST',
});

app.post('/api/v1/auth/login', authLimiter, loginController);
```

### Bypass for Admin

```typescript
// IPs in whitelist bypass rate limits (for internal tools)
const limiter = rateLimit({
  skip: (req) => process.env.ADMIN_IPS?.includes(req.ip),
});
```

---

## CORS & Security Headers

### CORS Configuration

```typescript
import cors from 'cors';

app.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(','),  // Only web app
    credentials: true,                           // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet());  // Adds:
// - X-Frame-Options: DENY (clickjacking)
// - X-Content-Type-Options: nosniff
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security
// - Content-Security-Policy
```

---

## Environment Secrets

### Never Commit Secrets

```bash
# ✅ Use environment variables
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=... (rotate regularly)
JWT_REFRESH_SECRET=... (rotate regularly)

# ❌ Never in code
// const SECRET = 'hardcoded-password';  // DON'T
```

### Secret Rotation

```typescript
// Every 6 months, rotate secrets
// 1. Create new secret alongside old
// 2. Accept both old & new for 30 days
// 3. After 30 days, only accept new
// 4. All new tokens use new secret

const JWT_ACCESS_SECRET_CURRENT = process.env.JWT_ACCESS_SECRET;
const JWT_ACCESS_SECRET_PREVIOUS = process.env.JWT_ACCESS_SECRET_PREVIOUS;  // null after rotation

// Verify against both
try {
  return jwt.verify(token, JWT_ACCESS_SECRET_CURRENT);
} catch {
  if (JWT_ACCESS_SECRET_PREVIOUS) {
    return jwt.verify(token, JWT_ACCESS_SECRET_PREVIOUS);
  }
  throw;
}
```

---

## API Key Security

### Hashed Storage

```typescript
// When creating API key
const apiKey = 'aura_' + randomBytes(32).toString('hex');
const keyHash = await hash(apiKey);  // Bcrypt

await db.insert(apiKeys).values({
  id: uuid(),
  userId,
  keyHash,
  scopes: ['read:agents', 'write:prompts'],
  createdAt: new Date(),
});

// Return key ONCE (client must save)
res.json({ apiKey });

// Never return full key again
// Only show masked: aura_abc...xyz (last 4 chars)
```

### API Key Validation

```typescript
// Client sends in X-API-Key header
const apiKey = req.get('X-API-Key');
const keyHash = await hash(apiKey);

const key = await db.query.apiKeys.findFirst({
  where: eq(keyHashes.keyHash, keyHash),
});

if (!key) throw HttpError.unauthorized('Invalid API key');
```

---

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Security-critical updates (immediate)
npm install <package>@latest

# Review CHANGELOG before updating
# Some breaking changes require code updates
```

### Pinned Versions

```json
{
  "dependencies": {
    "express": "4.18.2",        // Pinned
    "drizzle-orm": "0.29.1"
  }
}
```

---

## Monitoring & Alerting

### Security Monitoring

```typescript
// Alert on suspicious patterns
if (failedLoginAttempts > 5) {
  await sendSecurityAlert({
    type: 'BRUTE_FORCE_ATTEMPT',
    userId,
    ipAddress,
    timestamp,
  });
}

// Alert on unauthorized access
if (response.status === 403) {
  logger.warn('Unauthorized access attempt', {
    userId: req.user?.id,
    resource: req.path,
    ipAddress: req.ip,
  });
}

// Alert on role changes
if (oldUser.role !== newUser.role) {
  await sendSecurityAlert({
    type: 'ROLE_CHANGE',
    changedBy: req.user?.id,
    targetUser: userId,
    oldRole: oldUser.role,
    newRole: newUser.role,
  });
}
```

---

## Compliance & Privacy

### Data Retention

```
- User conversations: 90 days then archive
- Session logs: 30 days then delete
- Audit logs: 1 year minimum (compliance requirement)
- Analytics: Permanent (anonymized)
```

### GDPR/Privacy

```typescript
// Right to be forgotten
async function deleteUser(userId: string) {
  // Anonymize user data
  await db.update(users).set({
    email: `deleted-${uuid()}@anonymous.local`,
    passwordHash: null,
    name: 'Deleted User',
  });

  // Keep audit logs for compliance
  // Delete conversations/sessions (30+ days old)
  // Keep billing records (legal requirement)
}
```

### Data Handling

```typescript
// Don't log sensitive data
// ❌ logger.info(`User login: ${email}, ${password}`);
// ✅ logger.info('User login successful', { userId });

// Mask sensitive data in responses
const filtered = {
  ...user,
  passwordHash: undefined,  // Never expose
  email: maskEmail(user.email),  // Show only ***@***.com
};
```

---

## Security Checklist

- ✅ All admin endpoints require authentication
- ✅ Role-based access control enforced
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (ORM)
- ✅ XSS prevention (React escaping)
- ✅ CSRF protection (same-origin forms)
- ✅ Rate limiting enabled
- ✅ HTTPS only (Secure cookies)
- ✅ Secrets in environment variables
- ✅ Audit logging for mutations
- ✅ Error messages don't leak info
- ✅ Dependencies regularly updated
- ✅ Security headers configured
- ✅ CORS restricted to web app
- ✅ Refresh token rotation
