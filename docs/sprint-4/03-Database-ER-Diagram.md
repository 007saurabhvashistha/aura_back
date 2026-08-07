# Sprint 4: Database ER Diagram

## Entity Relationships

```
                                    ┌─────────────┐
                                    │   users     │
                                    ├─────────────┤
                                    │ id (PK)     │
                                    │ email       │
                                    │ password... │
                                    │ name        │
                                    │ role        │◄────┐
                                    │ created_at  │     │
                                    └─────────────┘     │
                                          │             │
                        ┌─────────────────┼─────────────┼────────────┐
                        │                 │             │            │
                        ▼                 ▼             │            ▼
            ┌─────────────────────┐  ┌─────────────┐   │  ┌──────────────────┐
            │  user_profiles      │  │    roles    │   │  │  admin_sessions  │
            ├─────────────────────┤  ├─────────────┤   │  ├──────────────────┤
            │ id (PK)             │  │ id (PK)     │   │  │ id (PK)          │
            │ user_id (FK)     ───┼──┼─► name      │   │  │ user_id (FK)  ───┼─────┐
            │ display_name        │  │ description │   │  │ ip_address       │     │
            │ bio                 │  │             │   │  │ user_agent       │     │
            │ avatar_url          │  └─────────────┘   │  │ logged_in_at     │     │
            │ preferences (JSONB) │                    │  │ last_activity_at │     │
            │ created_at          │                    │  │ logged_out_at    │     │
            └─────────────────────┘                    │  └──────────────────┘     │
                                                       │                           │
                        ┌──────────────────────────────┘                           │
                        │                                                          │
                        ▼                                                          │
            ┌─────────────────────────────────────┐                              │
            │  permissions                         │                              │
            ├─────────────────────────────────────┤                              │
            │ id (PK)                             │                              │
            │ role_id (FK) ──┐                    │                              │
            │ resource (module, action)           │ ◄─── users (admin_sessions)  │
            │ action (read/write/delete/admin)    │
            │ created_at                          │
            └─────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   agents    │
                                    ├─────────────┤
                                    │ id (PK)     │
                                    │ name        │
                                    │ description │
                                    │ model       │
                                    │ status      │◄────────────┐
                                    │ accuracy    │             │
                                    │ conv_count  │             │
                                    │ created_by  │ (FK to users)
                                    │ metadata    │
                                    │ created_at  │
                                    │ updated_at  │
                                    │ deleted_at  │
                                    └─────────────┘
                                          │
                        ┌─────────────────┴─────────────┐
                        │                               │
                        ▼                               ▼
            ┌─────────────────────┐      ┌─────────────────────────┐
            │     prompts         │      │  agent_prompt_mappings  │
            ├─────────────────────┤      ├─────────────────────────┤
            │ id (PK)             │      │ id (PK)                 │
            │ name                │◄─────┤ agent_id (FK)           │
            │ type                │      │ prompt_id (FK)          │
            │ (system/persona/..) │      │ prompt_type             │
            │ content             │      │ (system/persona/context)│
            │ version             │      │ position/order          │
            │ created_by          │      │ created_at              │
            │ created_at          │      └─────────────────────────┘
            │ updated_at          │
            │ deleted_at          │
            └─────────────────────┘
                     │
                     ▼
            ┌─────────────────────┐
            │  prompt_versions    │
            ├─────────────────────┤
            │ id (PK)             │
            │ prompt_id (FK)      │
            │ version_number      │
            │ content             │
            │ change_log          │
            │ created_by          │
            │ created_at          │
            └─────────────────────┘

                                    ┌─────────────────────┐
                                    │  conversations      │
                                    ├─────────────────────┤
                                    │ id (PK)             │
                                    │ user_id (FK)        │
                                    │ agent_id (FK)       │
                                    │ status              │
                                    │ started_at          │
                                    │ ended_at            │
                                    │ duration_seconds    │
                                    │ message_count       │
                                    │ sentiment_score     │
                                    │ metadata (JSONB)    │
                                    │ created_at          │
                                    └─────────────────────┘
                                          │
                        ┌─────────────────┴──────────────────┐
                        │                                    │
                        ▼                                    ▼
            ┌─────────────────────────┐      ┌─────────────────────────┐
            │  conversation_messages  │      │   conversation_memory   │
            ├─────────────────────────┤      ├─────────────────────────┤
            │ id (PK)                 │      │ id (PK)                 │
            │ conversation_id (FK)    │      │ conversation_id (FK)    │
            │ role (user/agent)       │      │ memory_type             │
            │ content                 │      │ (entities/context/...)  │
            │ sequence                │      │ content (JSONB)         │
            │ created_at              │      │ salience_score          │
            └─────────────────────────┘      │ created_at              │
                                             └─────────────────────────┘

                                    ┌─────────────┐
                                    │   sessions  │
                                    ├─────────────┤
                                    │ id (PK)     │
                                    │ user_id (FK)│
                                    │ device_type │
                                    │ browser     │
                                    │ ip_address  │
                                    │ location    │
                                    │ started_at  │
                                    │ ended_at    │
                                    │ last_seen   │
                                    │ user_agent  │
                                    │ created_at  │
                                    └─────────────┘

                                    ┌─────────────┐
                                    │   audit_log │
                                    ├─────────────┤
                                    │ id (PK)     │
                                    │ user_id (FK)│
                                    │ action      │
                                    │ resource    │
                                    │ resource_id │
                                    │ old_value   │
                                    │ new_value   │
                                    │ ip_address  │
                                    │ user_agent  │
                                    │ timestamp   │
                                    └─────────────┘

                                    ┌─────────────┐
                                    │    logs     │
                                    ├─────────────┤
                                    │ id (PK)     │
                                    │ level       │
                                    │ (info/warn/)│
                                    │ service     │
                                    │ message     │
                                    │ details     │
                                    │ stack_trace │
                                    │ timestamp   │
                                    │ request_id  │
                                    └─────────────┘

                                    ┌──────────────────────┐
                                    │  feature_flags       │
                                    ├──────────────────────┤
                                    │ id (PK)              │
                                    │ name (UNIQUE)        │
                                    │ enabled (BOOLEAN)    │
                                    │ description          │
                                    │ percentage           │
                                    │ (A/B test, 0-100)    │
                                    │ roles_allowed[]      │
                                    │ config (JSONB)       │
                                    │ created_by (FK)      │
                                    │ created_at           │
                                    │ updated_at           │
                                    │ deleted_at           │
                                    └──────────────────────┘

                                    ┌──────────────────────┐
                                    │  system_settings     │
                                    ├──────────────────────┤
                                    │ id (PK)              │
                                    │ setting_key (UNIQUE) │
                                    │ setting_value(JSONB) │
                                    │ category             │
                                    │ description          │
                                    │ updated_by (FK)      │
                                    │ updated_at           │
                                    └──────────────────────┘

        ┌──────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
        │  daily_metrics   │  │  user_cohorts       │  │  feature_usage       │
        ├──────────────────┤  ├─────────────────────┤  ├──────────────────────┤
        │ id (PK)          │  │ id (PK)             │  │ id (PK)              │
        │ date (DATE)      │  │ cohort_name         │  │ date (DATE)          │
        │ agent_id (FK)    │  │ created_date        │  │ feature_name         │
        │ metric_name      │  │ cohort_type         │  │ usage_count          │
        │ metric_value     │  │ (new_user/churn)    │  │ unique_users         │
        │ dimension_ctx    │  │ user_count          │  │ avg_duration_sec     │
        │ (JSONB)          │  │ revenue             │  │ context (JSONB)      │
        │ created_at       │  │ retention_rate      │  │ created_at           │
        │                  │  │ metadata (JSONB)    │  └──────────────────────┘
        │ UNIQUE(date,     │  │ created_at          │
        │  agent_id,       │  │ updated_at          │
        │  metric_name)    │  └─────────────────────┘
        └──────────────────┘
```

---

## Key Relationships

### User Management
- **users → roles** (1:1) - Each user has one role
- **users → permissions** (1:N via roles) - Permissions defined per role
- **users → agents** (1:N) - User can create/manage multiple agents
- **users → prompts** (1:N) - User can create/manage multiple prompts
- **users → admin_sessions** (1:N) - User has multiple admin sessions
- **users → system_settings** (1:N) - Users can update settings

### Agent Ecosystem
- **agents → prompts** (N:N via agent_prompt_mappings)
  - One agent can have system prompt + persona prompt + context prompts
  - One prompt can be reused across agents
- **agents → conversations** (1:N) - Agent appears in multiple conversations
- **agents → audit_log** (1:N) - All agent changes logged
- **agents → daily_metrics** (1:N) - Daily metrics per agent

### Conversation Data
- **conversations → messages** (1:N) - One conversation has multiple messages
- **conversations → memory** (1:N) - Multiple memory entries per conversation
- **conversations → audit_log** (1:N) - All conversation updates logged

### Tracking & Compliance
- **users → sessions** (1:N) - User has multiple sessions
- **users → audit_log** (1:N) - All user actions logged
- **audit_log → resources** - Tracks changes to any resource

### Configuration & Feature Management
- **feature_flags** table - Platform-wide feature flags
  - Links to users via created_by
  - Can specify roles_allowed for gradual rollout
- **system_settings** table - Platform configuration
  - Links to users via updated_by
  - Organized by category

### Analytics & Insights
- **daily_metrics** table - Time-series daily metrics
  - Per-agent metrics: accuracy, response time, conversation count
  - System metrics: API response time, database performance
  - Indexed by agent_id and date for efficient queries
- **user_cohorts** table - Cohort analysis
  - Tracks retention and churn by cohort
  - Organized by cohort_type (signup_month, segment, etc.)
- **feature_usage** table - Feature adoption tracking
  - Tracks usage by feature, date, and user segment
  - Includes error counts and duration metrics

---

## Complete Table Schemas

### feature_flags Table

**Purpose:** Control feature rollout and A/B testing

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  percentage INTEGER CHECK (percentage >= 0 AND percentage <= 100) DEFAULT 100,
  roles_allowed TEXT[] DEFAULT NULL,  -- NULL means all roles, ['admin','operator'] means only these
  config JSONB DEFAULT '{}'::JSONB,   -- Additional config (A/B test groups, etc.)
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL  -- Soft delete field
);

CREATE UNIQUE INDEX idx_feature_flags_name_active ON feature_flags(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_created_by ON feature_flags(created_by);
```

**Usage Example:**
```json
{
  "name": "new-conversation-ui",
  "enabled": true,
  "percentage": 50,
  "roles_allowed": ["operator", "analyst"],
  "config": {
    "variantA": { "theme": "dark" },
    "variantB": { "theme": "light" }
  }
}
```

---

### system_settings Table

**Purpose:** Store platform-wide configuration

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL,  -- 'general', 'api', 'email', 'system', 'features'
  description TEXT,
  updated_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON system_settings(setting_key);
CREATE INDEX idx_settings_category ON system_settings(category);
CREATE INDEX idx_settings_updated_by ON system_settings(updated_by);
```

**Settings Categories:**
```
general:
  - platform_name
  - support_email
  - support_url
  - deployment_environment (dev/staging/prod)

api:
  - rate_limit_requests_per_minute
  - rate_limit_burst_size
  - max_api_key_expiry_days
  - webhook_max_retries
  - webhook_timeout_seconds

email:
  - smtp_host
  - smtp_port
  - smtp_user
  - smtp_password
  - from_address
  - from_name

system:
  - max_concurrent_sessions_per_user
  - session_timeout_minutes
  - password_min_length
  - password_require_special_chars

features:
  - enable_webhooks
  - enable_exports
  - enable_multi_agent_conversations
  - enable_voice_input
```

---

### daily_metrics Table

**Purpose:** Time-series metrics aggregated per day

```sql
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  agent_id UUID REFERENCES agents(id),
  metric_name TEXT NOT NULL,  -- 'accuracy', 'conversation_count', 'avg_response_time', 'error_rate'
  metric_value FLOAT NOT NULL,
  dimension_context JSONB DEFAULT '{}'::JSONB,  -- { "user_segment": "premium", "region": "us" }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, agent_id, metric_name)
);

CREATE INDEX idx_daily_metrics_agent_date ON daily_metrics(agent_id, date DESC);
CREATE INDEX idx_daily_metrics_metric_date ON daily_metrics(metric_name, date DESC);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);
```

**Metric Types:**
```
Agent Metrics:
  - accuracy (0-100)
  - conversation_count (integer)
  - avg_response_time_ms (float)
  - error_rate (0-100)
  - user_satisfaction_score (0-5)

System Metrics:
  - active_conversations (count)
  - active_users (count)
  - api_response_time_p95_ms (float)
  - database_query_time_p95_ms (float)
```

---

### user_cohorts Table

**Purpose:** Track user cohort analysis for retention and churn metrics

```sql
CREATE TABLE user_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_name TEXT NOT NULL,
  cohort_type TEXT NOT NULL,  -- 'signup_week', 'signup_month', 'product_segment', 'revenue_tier'
  created_date DATE NOT NULL,
  user_count INTEGER NOT NULL DEFAULT 0,
  active_users_7d INTEGER DEFAULT 0,
  active_users_30d INTEGER DEFAULT 0,
  retention_rate_7d FLOAT DEFAULT NULL,    -- 0-1 (0% - 100%)
  retention_rate_30d FLOAT DEFAULT NULL,
  revenue DECIMAL(15, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,     -- { "segment": "free", "region": "us" }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cohorts_type_date ON user_cohorts(cohort_type, created_date);
CREATE INDEX idx_cohorts_created_date ON user_cohorts(created_date);
```

**Cohort Analysis Example:**
```json
{
  "cohort_name": "2026-08 Signups",
  "cohort_type": "signup_month",
  "created_date": "2026-08-01",
  "user_count": 2500,
  "active_users_7d": 2100,
  "retention_rate_7d": 0.84,
  "retention_rate_30d": 0.72
}
```

---

### feature_usage Table

**Purpose:** Track feature adoption and usage patterns

```sql
CREATE TABLE feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  feature_name TEXT NOT NULL,  -- 'voice_input', 'agent_search', 'conversation_export', 'memory_recall'
  usage_count INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  avg_duration_seconds FLOAT DEFAULT NULL,
  error_count INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}'::JSONB,  -- { "user_segment": "premium", "platform": "ios" }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, feature_name)
);

CREATE INDEX idx_feature_usage_date ON feature_usage(date);
CREATE INDEX idx_feature_usage_feature_date ON feature_usage(feature_name, date DESC);
```

---

## Indexing Strategy (Comprehensive)

```sql
-- Performance-critical indexes

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Agent queries
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_created_by ON agents(created_by);
CREATE INDEX idx_agents_deleted_at ON agents(deleted_at);

-- Prompt queries
CREATE INDEX idx_prompts_type ON prompts(type);
CREATE INDEX idx_prompts_deleted_at ON prompts(deleted_at);

-- Conversation searches
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);

-- Message queries
CREATE INDEX idx_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON conversation_messages(created_at);

-- Session tracking
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_ended_at ON sessions(ended_at);

-- Audit trail
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource, resource_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Logging
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_service ON logs(service);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);

-- Analytics (Daily Metrics)
CREATE INDEX idx_daily_metrics_agent_date ON daily_metrics(agent_id, date DESC);
CREATE INDEX idx_daily_metrics_metric_date ON daily_metrics(metric_name, date DESC);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);

-- Cohorts
CREATE INDEX idx_cohorts_type_date ON user_cohorts(cohort_type, created_date);
CREATE INDEX idx_cohorts_created_date ON user_cohorts(created_date);

-- Feature Usage
CREATE INDEX idx_feature_usage_date ON feature_usage(date);
CREATE INDEX idx_feature_usage_feature_date ON feature_usage(feature_name, date DESC);

-- Feature Flags
CREATE UNIQUE INDEX idx_feature_flags_name_active ON feature_flags(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_created_by ON feature_flags(created_by);

-- Settings
CREATE INDEX idx_settings_key ON system_settings(setting_key);
CREATE INDEX idx_settings_category ON system_settings(category);
CREATE INDEX idx_settings_updated_by ON system_settings(updated_by);
```

---

## Data Retention

| Table | Retention | Policy |
|-------|-----------|--------|
| users | Forever | Keep permanently |
| user_profiles | Forever | Keep permanently |
| agents | Soft delete | Keep (never hard delete) |
| prompts | Soft delete + Versions | Keep all versions (immutable) |
| prompt_versions | Forever | Keep all versions for history |
| conversations | 90 days | Archive after 90 days |
| conversation_messages | 90 days | Archive after 90 days |
| conversation_memory | 90 days | Archive after 90 days |
| sessions | 30 days | Hard delete after 30 days |
| audit_log | 1 year | Keep for compliance (GDPR) |
| logs | 30 days | Archive/delete after 30 days |
| daily_metrics | Forever | Keep for historical analysis |
| user_cohorts | Forever | Keep for historical analysis |
| feature_usage | 1 year | Keep for trend analysis |
| feature_flags | Soft delete | Keep all historical flags |
| system_settings | Forever | Keep all settings |
| admin_sessions | 30 days | Archive after 30 days |
| permissions | Forever | Keep for audit trail |
| roles | Forever | Keep for audit trail |

**Retention Policy Notes:**
- Soft deletes: Records are marked with `deleted_at` timestamp but never hard deleted
- Archive: Move to cold storage (S3/backup) after retention period
- Hard delete: Permanently remove from database (only for sessions/logs)
- Compliance: Audit logs kept for 1 year to meet GDPR requirements
- Analytics: All metrics kept forever for trend analysis and historical comparison
