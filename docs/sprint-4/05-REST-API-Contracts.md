# Sprint 4: REST API Contracts

## Authentication & Authorization

All admin endpoints require:
- JWT Bearer token in `Authorization` header
- Token must have `role: 'admin'` claim
- Token must not be expired

```
Authorization: Bearer <access_token>
```

---

## Agent Management Endpoints

### List Agents

**Endpoint:** `GET /api/v1/admin/agents`

**Query Parameters:**
```typescript
{
  page?: number;          // Default: 1, Min: 1
  limit?: number;         // Default: 10, Min: 1, Max: 100
  status?: 'all' | 'active' | 'training' | 'inactive';  // Default: 'all'
  search?: string;        // Search by name (partial match, case-insensitive)
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Agents retrieved",
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Customer Support Bot",
        "description": "Handles inquiries",
        "model": "gpt-4",
        "status": "active",
        "accuracy": 94.2,
        "conversationCount": 1247,
        "systemPromptId": "uuid",
        "personaPromptId": "uuid",
        "createdBy": "uuid",
        "metadata": { "custom": "data" },
        "createdAt": "2026-08-06T10:00:00Z",
        "updatedAt": "2026-08-06T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

**Response 401:**
```json
{
  "status": "error",
  "message": "Invalid or expired access token",
  "data": null,
  "errors": [{ "code": "unauthorized", "message": "..." }]
}
```

**Response 403:**
```json
{
  "status": "error",
  "message": "Admin access required",
  "data": null,
  "errors": [{ "code": "forbidden", "message": "..." }]
}
```

---

### Create Agent

**Endpoint:** `POST /api/v1/admin/agents`

**Request Body:**
```json
{
  "name": "New Agent",
  "description": "Agent description",
  "model": "gpt-4",
  "status": "inactive",
  "systemPromptId": "uuid",
  "personaPromptId": "uuid",
  "metadata": {}
}
```

**Validation Rules:**
- `name`: required, 1-255 chars, unique
- `description`: optional, max 1000 chars
- `model`: required, must be in enum (gpt-4, claude-3, llama-2, gpt-3.5)
- `status`: optional, default 'inactive'
- `systemPromptId`, `personaPromptId`: optional, must exist if provided

**Response 201:**
```json
{
  "status": "success",
  "message": "Agent created",
  "data": {
    "id": "new-uuid",
    "name": "New Agent",
    "description": "Agent description",
    "model": "gpt-4",
    "status": "inactive",
    "accuracy": null,
    "conversationCount": 0,
    "systemPromptId": "uuid",
    "personaPromptId": "uuid",
    "createdBy": "your-uuid",
    "metadata": {},
    "createdAt": "2026-08-06T16:00:00Z",
    "updatedAt": "2026-08-06T16:00:00Z"
  }
}
```

**Response 400:**
```json
{
  "status": "error",
  "message": "Agent with this name already exists",
  "data": null,
  "errors": [{ "code": "bad_request", "message": "..." }]
}
```

---

### Get Agent

**Endpoint:** `GET /api/v1/admin/agents/:id`

**Response 200:**
```json
{
  "status": "success",
  "message": "Agent retrieved",
  "data": { /* agent object */ }
}
```

**Response 404:**
```json
{
  "status": "error",
  "message": "Agent not found",
  "data": null,
  "errors": [{ "code": "not_found", "message": "..." }]
}
```

---

### Update Agent

**Endpoint:** `PUT /api/v1/admin/agents/:id`

**Request Body (all optional):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "model": "claude-3",
  "status": "active",
  "systemPromptId": "new-uuid",
  "personaPromptId": null,
  "metadata": { "key": "value" }
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Agent updated",
  "data": { /* updated agent object */ }
}
```

---

### Delete Agent

**Endpoint:** `DELETE /api/v1/admin/agents/:id`

**Response 204:** No content (soft delete)

**Response 404:**
```json
{
  "status": "error",
  "message": "Agent not found",
  "data": null
}
```

---

## Prompt Management Endpoints

### List Prompts

**Endpoint:** `GET /api/v1/admin/prompts`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  type?: 'all' | 'system' | 'persona' | 'context';
  search?: string;  // Search by name
}
```

**Response 200:** Same structure as agents list

---

### Create Prompt

**Endpoint:** `POST /api/v1/admin/prompts`

**Request Body:**
```json
{
  "name": "Customer Support System Prompt",
  "type": "system",
  "content": "You are a helpful customer support agent...",
  "description": "System prompt for support agents"
}
```

**Validation:**
- `name`: required, unique
- `type`: required, enum (system, persona, context)
- `content`: required, max 10000 chars
- `description`: optional

**Response 201:**
```json
{
  "status": "success",
  "message": "Prompt created",
  "data": {
    "id": "uuid",
    "name": "...",
    "type": "...",
    "content": "...",
    "version": 1,
    "createdBy": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### Update Prompt

**Endpoint:** `PUT /api/v1/admin/prompts/:id`

**Behavior:** Creates new version (immutable design)

**Request Body:**
```json
{
  "content": "Updated prompt content...",
  "description": "What changed in this version"
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Prompt updated",
  "data": {
    "id": "uuid",
    "name": "...",
    "type": "...",
    "content": "Updated...",
    "version": 2,  // Incremented
    "createdBy": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### Get Prompt Versions

**Endpoint:** `GET /api/v1/admin/prompts/:id/versions`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "versions": [
      {
        "version": 2,
        "content": "Current version",
        "updatedAt": "2026-08-06T16:00:00Z"
      },
      {
        "version": 1,
        "content": "Previous version",
        "updatedAt": "2026-08-06T15:00:00Z"
      }
    ]
  }
}
```

---

## User Management Endpoints

### List Users

**Endpoint:** `GET /api/v1/admin/users`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  role?: 'all' | 'user' | 'admin' | 'moderator';
  status?: 'all' | 'active' | 'inactive' | 'suspended';
  search?: string;  // Email or name
}
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "status": "active",
      "createdAt": "2026-01-15T10:00:00Z",
      "lastLogin": "2026-08-06T14:30:00Z",
      "conversationCount": 42
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### Update User

**Endpoint:** `PUT /api/v1/admin/users/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin",
  "status": "active"
}
```

**Validation:**
- `role`: enum (user, admin, moderator)
- `status`: enum (active, inactive, suspended)

**Response 200:**
```json
{
  "status": "success",
  "message": "User updated",
  "data": { /* updated user */ }
}
```

---

### Reset User Password

**Endpoint:** `POST /api/v1/admin/users/:id/reset-password`

**Request Body:**
```json
{
  "newPassword": "SecurePassword123!"
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

---

## Conversation Monitoring Endpoints

### List Conversations

**Endpoint:** `GET /api/v1/admin/conversations`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'completed' | 'archived';
  agentId?: string;
  search?: string;  // Search by topic or user
  startDate?: string;  // ISO format
  endDate?: string;
}
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "agentId": "uuid",
      "agentName": "Support Bot",
      "status": "completed",
      "messageCount": 8,
      "duration": 300,  // seconds
      "startedAt": "2026-08-06T10:00:00Z",
      "endedAt": "2026-08-06T10:05:00Z",
      "sentimentScore": 0.8
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### Get Conversation Detail

**Endpoint:** `GET /api/v1/admin/conversations/:id`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "agentId": "uuid",
    "status": "completed",
    "messages": [
      {
        "sequence": 1,
        "role": "user",
        "content": "Hello, I need help...",
        "timestamp": "2026-08-06T10:00:00Z"
      },
      {
        "sequence": 2,
        "role": "agent",
        "content": "I'd be happy to help...",
        "timestamp": "2026-08-06T10:00:10Z"
      }
    ],
    "memory": [
      {
        "type": "entity",
        "content": { "name": "John", "issue": "billing" }
      }
    ],
    "metadata": { /* custom data */ }
  }
}
```

---

## Session Monitoring Endpoints

### List Active Sessions

**Endpoint:** `GET /api/v1/admin/sessions?active=true`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "deviceType": "desktop",
      "browser": "Chrome 120",
      "ipAddress": "192.168.1.100",
      "location": "New York, US",
      "startedAt": "2026-08-06T10:00:00Z",
      "lastActivityAt": "2026-08-06T15:30:00Z",
      "durationSeconds": 19800
    }
  ]
}
```

---

### Terminate Session

**Endpoint:** `POST /api/v1/admin/sessions/:id/terminate`

**Response 204:** No content

---

## System Logs Endpoints

### List Logs

**Endpoint:** `GET /api/v1/admin/logs`

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  level?: 'all' | 'info' | 'warning' | 'error' | 'success';
  service?: string;  // auth, api, db, queue, etc.
  search?: string;   // Search message
  startDate?: string;
  endDate?: string;
}
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "timestamp": "2026-08-06T15:30:00Z",
      "level": "error",
      "service": "api",
      "message": "Failed to create agent",
      "details": { "reason": "Duplicate name" },
      "stackTrace": "..."
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## Analytics Endpoints

### Get Analytics Overview

**Endpoint:** `GET /api/v1/admin/analytics`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "metrics": {
      "totalUsers": 1250,
      "activeUsers": 234,
      "totalConversations": 5820,
      "averageSentiment": 0.78,
      "systemUptime": 99.8
    },
    "charts": {
      "userGrowth": { /* timeseries */ },
      "conversationVolume": { /* timeseries */ },
      "agentAccuracy": { /* top 5 agents */ }
    }
  }
}
```

---

## Settings Endpoints

### Get Settings

**Endpoint:** `GET /api/v1/admin/settings`

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "general": {
      "platformName": "Aura",
      "supportEmail": "support@aura.ai",
      "supportPhone": "+1-555-0000"
    },
    "api": {
      "rateLimit": 1000,
      "webhookUrl": "https://webhook.example.com"
    },
    "features": {
      "maintenanceMode": false,
      "analyticsTracking": true,
      "betaFeatures": false
    }
  }
}
```

---

### Update Settings

**Endpoint:** `PUT /api/v1/admin/settings`

**Request Body:**
```json
{
  "general": {
    "platformName": "Aura Platform",
    "supportEmail": "support@aura.ai"
  },
  "api": {
    "rateLimit": 2000
  },
  "features": {
    "maintenanceMode": true
  }
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "Settings updated",
  "data": { /* updated settings */ }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "status": "error",
  "message": "Human-readable error message",
  "data": null,
  "errors": [
    {
      "code": "error_code",
      "message": "Specific error detail",
      "path": "field.name"  // For validation errors
    }
  ],
  "meta": null
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No content (delete)
- `400` - Bad request (validation)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate)
- `500` - Server error
