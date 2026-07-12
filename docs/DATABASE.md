# Database Schema Documentation

## Overview

The AI-Powered Code Review Assistant uses a polyglot persistence strategy:

| Store       | Technology   | Purpose                                    |
|-------------|-------------|--------------------------------------------|
| Primary DB  | PostgreSQL 16 | Relational data, transactions, ACID        |
| Document DB | MongoDB 7    | Audit logs, raw event payloads             |
| Vector DB   | Qdrant       | Semantic search, similarity matching       |
| Cache/Broker| Redis 7      | Caching, Celery broker, session store      |

---

## PostgreSQL Schema

### Entity-Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    users      │       │   organizations   │       │  org_members     │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)          │──┐    │ id (PK)          │
│ email        │  │    │ name             │  │    │ user_id (FK)     │
│ name         │  │    │ github_id        │  │    │ org_id (FK)      │
│ avatar_url   │  │    │ plan             │  │    │ role             │
│ github_id    │  │    │ created_at       │  │    │ joined_at        │
│ github_token │  │    │ updated_at       │  │    └──────────────────┘
│ role         │  │    └──────────────────┘  │
│ created_at   │  │                          │
│ updated_at   │  │                          │
└──────┬───────┘  │                          │
       │          │                          │
       │          ▼                          ▼
       │    ┌──────────────────┐    ┌──────────────────┐
       │    │   repositories   │    │  org_members     │
       │    ├──────────────────┤    │  (see above)     │
       │    │ id (PK)          │    └──────────────────┘
       │    │ org_id (FK)      │
       │    │ github_id        │
       │    │ full_name        │
       │    │ name             │
       │    │ owner            │
       │    │ language         │
       │    │ default_branch   │
       │    │ is_private       │
       │    │ app_installed    │
       │    │ last_analyzed_at │
       │    │ created_at       │
       │    │ updated_at       │
       │    └──────┬───────────┘
       │           │
       │           ▼
       │    ┌──────────────────┐
       │    │  pull_requests   │
       │    ├──────────────────┤
       │    │ id (PK)          │
       │    │ repo_id (FK)     │
       │    │ github_id        │
       │    │ number           │
       │    │ title            │
       │    │ state            │
       │    │ author_login     │
       │    │ base_branch      │
       │    │ head_branch      │
       │    │ additions        │
       │    │ deletions        │
       │    │ changed_files    │
       │    │ created_at       │
       │    │ updated_at       │
       │    └──────┬───────────┘
       │           │
       │           ▼
       │    ┌──────────────────┐       ┌──────────────────┐
       │    │    reviews       │       │    findings       │
       │    ├──────────────────┤       ├──────────────────┤
       │    │ id (PK)          │───┐   │ id (PK)          │
       │    │ pr_id (FK)       │   │   │ review_id (FK)   │
       │    │ triggered_by(FK) │   │   │ severity         │
       │    │ status           │   └──►│ category         │
       │    │ model            │       │ file_path        │
       │    │ overall_score    │       │ line_start       │
       │    │ summary          │       │ line_end         │
       │    │ config_snapshot  │       │ title            │
       │    │ token_usage      │       │ description      │
       │    │ duration_ms      │       │ suggestion       │
       │    │ github_comment_id│       │ code_snippet     │
       │    │ created_at       │       │ is_dismissed     │
       │    │ completed_at     │       │ dismissed_reason │
       │    └──────────────────┘       │ created_at       │
       │                               └──────────────────┘
       │
       │    ┌──────────────────┐       ┌──────────────────┐
       │    │  repo_settings   │       │  api_tokens       │
       │    ├──────────────────┤       ├──────────────────┤
       │    │ id (PK)          │       │ id (PK)          │
       │    │ repo_id (FK)     │       │ user_id (FK)     │
       │    │ auto_review      │       │ name             │
       │    │ review_on_open   │       │ token_hash       │
       │    │ review_on_push   │       │ scopes           │
       │    │ default_model    │       │ last_used_at     │
       │    │ severity_thresh  │       │ expires_at       │
       │    │ ignored_patterns │       │ created_at       │
       │    │ notification_cfg │       └──────────────────┘
       │    │ created_at       │
       │    │ updated_at       │       ┌──────────────────┐
       │    └──────────────────┘       │  refresh_tokens   │
       │                               ├──────────────────┤
       └──────────────────────────────►│ id (PK)          │
                                       │ user_id (FK)     │
                                       │ token_hash       │
                                       │ expires_at       │
                                       │ created_at       │
                                       └──────────────────┘
```

---

### Table Definitions

#### `users`

| Column        | Type                     | Constraints              | Description                        |
|--------------|--------------------------|--------------------------|------------------------------------|
| `id`         | UUID                     | PK, default gen          | Internal user identifier           |
| `email`      | VARCHAR(255)             | NOT NULL, UNIQUE         | User email address                 |
| `name`       | VARCHAR(255)             | NOT NULL                 | Display name                       |
| `avatar_url` | TEXT                     |                          | GitHub avatar URL                  |
| `github_id`  | INTEGER                  | UNIQUE                   | GitHub user ID                     |
| `github_username` | VARCHAR(100)        |                          | GitHub username                    |
| `github_token` | TEXT                   | ENCRYPTED                | GitHub OAuth access token (encrypted) |
| `role`       | ENUM(viewer, user, maintainer, admin) | DEFAULT 'user' | Application role                   |
| `created_at` | TIMESTAMPTZ              | DEFAULT NOW()            | Account creation timestamp         |
| `updated_at` | TIMESTAMPTZ              | DEFAULT NOW()            | Last update timestamp              |

**Indexes:**
- `idx_users_email` ON `email`
- `idx_users_github_id` ON `github_id`

---

#### `organizations`

| Column       | Type                     | Constraints              | Description                        |
|-------------|--------------------------|--------------------------|------------------------------------|
| `id`        | UUID                     | PK, default gen          | Internal org identifier            |
| `name`      | VARCHAR(255)             | NOT NULL                 | Organization name                  |
| `github_id` | INTEGER                  | UNIQUE                   | GitHub organization ID             |
| `plan`      | ENUM(free, pro, enterprise) | DEFAULT 'free'        | Subscription plan                  |
| `created_at`| TIMESTAMPTZ              | DEFAULT NOW()            | Creation timestamp                 |
| `updated_at`| TIMESTAMPTZ              | DEFAULT NOW()            | Last update timestamp              |

---

#### `org_members`

| Column     | Type                     | Constraints              | Description                        |
|-----------|--------------------------|--------------------------|------------------------------------|
| `id`      | UUID                     | PK, default gen          | Membership identifier              |
| `user_id` | UUID                     | FK → users.id, NOT NULL  | Reference to user                  |
| `org_id`  | UUID                     | FK → organizations.id, NOT NULL | Reference to organization   |
| `role`    | ENUM(member, maintainer, admin) | DEFAULT 'member' | Organization role                  |
| `joined_at`| TIMESTAMPTZ             | DEFAULT NOW()            | Join timestamp                     |

**Indexes:**
- `idx_org_members_user_org` UNIQUE ON `(user_id, org_id)`

---

#### `repositories`

| Column           | Type                     | Constraints              | Description                        |
|-----------------|--------------------------|--------------------------|------------------------------------|
| `id`            | UUID                     | PK, default gen          | Internal repo identifier           |
| `org_id`        | UUID                     | FK → organizations.id    | Owning organization                |
| `github_id`     | INTEGER                  | NOT NULL, UNIQUE         | GitHub repository ID               |
| `full_name`     | VARCHAR(500)             | NOT NULL                 | `owner/repo` format                |
| `name`          | VARCHAR(255)             | NOT NULL                 | Repository name                    |
| `owner`         | VARCHAR(255)             | NOT NULL                 | Owner (user or org)                |
| `language`      | VARCHAR(50)              |                          | Primary language                   |
| `default_branch`| VARCHAR(255)             | DEFAULT 'main'           | Default branch name                |
| `is_private`    | BOOLEAN                  | DEFAULT FALSE            | Whether repo is private            |
| `app_installed` | BOOLEAN                  | DEFAULT FALSE            | GitHub App installation status     |
| `last_analyzed_at` | TIMESTAMPTZ           |                          | Timestamp of last analysis         |
| `created_at`    | TIMESTAMPTZ              | DEFAULT NOW()            | Creation timestamp                 |
| `updated_at`    | TIMESTAMPTZ              | DEFAULT NOW()            | Last update timestamp              |

**Indexes:**
- `idx_repos_github_id` ON `github_id`
- `idx_repos_full_name` ON `full_name`
- `idx_repos_org_id` ON `org_id`
- `idx_repos_app_installed` ON `app_installed` WHERE `app_installed = TRUE`

---

#### `pull_requests`

| Column          | Type                     | Constraints              | Description                        |
|----------------|--------------------------|--------------------------|------------------------------------|
| `id`           | UUID                     | PK, default gen          | Internal PR identifier             |
| `repo_id`      | UUID                     | FK → repositories.id, NOT NULL | Parent repository            |
| `github_id`    | INTEGER                  | NOT NULL                 | GitHub PR ID                       |
| `number`       | INTEGER                  | NOT NULL                 | PR number within repo              |
| `title`        | TEXT                     | NOT NULL                 | PR title                           |
| `state`        | ENUM(open, closed, merged) | DEFAULT 'open'         | PR state                           |
| `author_login` | VARCHAR(100)             |                          | PR author GitHub username          |
| `base_branch`  | VARCHAR(255)             | NOT NULL                 | Target branch                      |
| `head_branch`  | VARCHAR(255)             | NOT NULL                 | Source branch                      |
| `additions`    | INTEGER                  | DEFAULT 0                | Lines added                        |
| `deletions`    | INTEGER                  | DEFAULT 0                | Lines removed                      |
| `changed_files`| INTEGER                  | DEFAULT 0                | Number of changed files            |
| `created_at`   | TIMESTAMPTZ              | DEFAULT NOW()            | Creation timestamp                 |
| `updated_at`   | TIMESTAMPTZ              | DEFAULT NOW()            | Last update timestamp              |

**Indexes:**
- `idx_pr_repo_number` UNIQUE ON `(repo_id, number)`
- `idx_pr_state` ON `state`
- `idx_pr_updated_at` ON `updated_at`

---

#### `reviews`

| Column              | Type                     | Constraints              | Description                        |
|---------------------|--------------------------|--------------------------|------------------------------------|
| `id`               | UUID                     | PK, default gen          | Review identifier                  |
| `pr_id`            | UUID                     | FK → pull_requests.id, NOT NULL | Parent pull request          |
| `triggered_by`     | UUID                     | FK → users.id            | User who triggered review          |
| `status`           | ENUM(queued, in_progress, completed, failed) | DEFAULT 'queued' | Review status        |
| `model`            | VARCHAR(100)             | NOT NULL                 | LLM model used                    |
| `overall_score`    | DECIMAL(3,1)             |                          | Overall quality score (0.0–10.0)   |
| `summary`          | TEXT                     |                          | AI-generated summary              |
| `config_snapshot`  | JSONB                    |                          | Review config at execution time    |
| `token_usage`      | JSONB                    |                          | Token consumption details          |
| `duration_ms`      | INTEGER                  |                          | Total processing time (ms)         |
| `github_comment_id`| INTEGER                  |                          | GitHub review comment ID           |
| `created_at`       | TIMESTAMPTZ              | DEFAULT NOW()            | Creation timestamp                 |
| `completed_at`     | TIMESTAMPTZ              |                          | Completion timestamp               |

**Indexes:**
- `idx_reviews_pr_id` ON `pr_id`
- `idx_reviews_status` ON `status`
- `idx_reviews_created_at` ON `created_at`
- `idx_reviews_triggered_by` ON `triggered_by`

---

#### `findings`

| Column            | Type                     | Constraints              | Description                        |
|-------------------|--------------------------|--------------------------|------------------------------------|
| `id`             | UUID                     | PK, default gen          | Finding identifier                 |
| `review_id`      | UUID                     | FK → reviews.id, NOT NULL | Parent review                     |
| `severity`       | ENUM(critical, high, medium, low, info) | NOT NULL   | Finding severity                  |
| `category`       | VARCHAR(50)              | NOT NULL                 | Category: security, performance, style, bug, etc. |
| `file_path`      | TEXT                     | NOT NULL                 | File path relative to repo root   |
| `line_start`     | INTEGER                  |                          | Start line number                  |
| `line_end`       | INTEGER                  |                          | End line number                    |
| `title`          | TEXT                     | NOT NULL                 | Short finding title                |
| `description`    | TEXT                     | NOT NULL                 | Detailed explanation               |
| `suggestion`     | TEXT                     |                          | Suggested fix (code)               |
| `code_snippet`   | TEXT                     |                          | Original code snippet              |
| `is_dismissed`   | BOOLEAN                  | DEFAULT FALSE            | Whether user dismissed finding     |
| `dismissed_reason`| TEXT                    |                          | Reason for dismissal               |
| `created_at`     | TIMESTAMPTZ              | DEFAULT NOW()            | Creation timestamp                 |

**Indexes:**
- `idx_findings_review_id` ON `review_id`
- `idx_findings_severity` ON `severity`
- `idx_findings_category` ON `category`
- `idx_findings_file_path` ON `file_path`

---

#### `repo_settings`

| Column             | Type                     | Constraints              | Description                        |
|-------------------|--------------------------|--------------------------|------------------------------------|
| `id`              | UUID                     | PK, default gen          | Settings identifier                |
| `repo_id`         | UUID                     | FK → repositories.id, UNIQUE | One setting per repo           |
| `auto_review`     | BOOLEAN                  | DEFAULT TRUE             | Auto-review on PR events           |
| `review_on_open`  | BOOLEAN                  | DEFAULT TRUE             | Review when PR is opened           |
| `review_on_push`  | BOOLEAN                  | DEFAULT FALSE            | Review on new pushes               |
| `default_model`   | VARCHAR(100)             | DEFAULT 'gpt-4-turbo-preview' | Default LLM model            |
| `severity_threshold`| ENUM(critical, high, medium, low) | DEFAULT 'medium' | Min severity to report        |
| `ignored_patterns`| JSONB                    | DEFAULT '[]'             | Glob patterns to ignore            |
| `notification_cfg`| JSONB                    | DEFAULT '{}'             | Notification preferences           |
| `created_at`      | TIMESTAMPTZ              | DEFAULT NOW()            | Creation timestamp                 |
| `updated_at`      | TIMESTAMPTZ              | DEFAULT NOW()            | Last update timestamp              |

---

#### `api_tokens`

| Column        | Type                     | Constraints              | Description                        |
|--------------|--------------------------|--------------------------|------------------------------------|
| `id`         | UUID                     | PK, default gen          | Token identifier                   |
| `user_id`    | UUID                     | FK → users.id, NOT NULL  | Owning user                        |
| `name`       | VARCHAR(100)             | NOT NULL                 | Human-readable token name          |
| `token_hash` | VARCHAR(128)             | NOT NULL, UNIQUE         | SHA-256 hash of the token          |
| `scopes`     | JSONB                    | DEFAULT '["read"]'       | Granted permission scopes          |
| `last_used_at`| TIMESTAMPTZ             |                          | Last authentication timestamp      |
| `expires_at` | TIMESTAMPTZ              |                          | Token expiration (null = never)    |
| `created_at` | TIMESTAMPTZ              | DEFAULT NOW()            | Creation timestamp                 |

---

#### `refresh_tokens`

| Column        | Type                     | Constraints              | Description                        |
|--------------|--------------------------|--------------------------|------------------------------------|
| `id`         | UUID                     | PK, default gen          | Token identifier                   |
| `user_id`    | UUID                     | FK → users.id, NOT NULL  | Owning user                        |
| `token_hash` | VARCHAR(128)             | NOT NULL, UNIQUE         | SHA-256 hash of refresh token      |
| `expires_at` | TIMESTAMPTZ              | NOT NULL                 | Token expiration                   |
| `created_at` | TIMESTAMPTZ              | DEFAULT NOW()            | Creation timestamp                 |

---

## MongoDB Collections

### `audit_logs`

```json
{
  "_id": ObjectId,
  "timestamp": ISODate,
  "user_id": "usr_abc123",
  "action": "review.triggered",
  "resource_type": "pull_request",
  "resource_id": "pr_xyz789",
  "details": {
    "model": "gpt-4-turbo-preview",
    "repository": "org/my-project",
    "pr_number": 42
  },
  "ip_address": "10.0.1.15",
  "user_agent": "Mozilla/5.0 ...",
  "request_id": "req_123456"
}
```

**Indexes:** `{ timestamp: -1 }`, `{ user_id: 1, timestamp: -1 }`, `{ action: 1 }`

### `llm_logs`

```json
{
  "_id": ObjectId,
  "timestamp": ISODate,
  "review_id": "rev_abc123",
  "model": "gpt-4-turbo-preview",
  "provider": "openai",
  "prompt_tokens": 12450,
  "completion_tokens": 2300,
  "total_tokens": 14750,
  "latency_ms": 8523,
  "request_id": "req_llm_001",
  "status": "success"
}
```

**Indexes:** `{ review_id: 1 }`, `{ timestamp: -1 }`, `{ model: 1 }`

### `webhook_events`

```json
{
  "_id": ObjectId,
  "timestamp": ISODate,
  "event": "pull_request",
  "action": "opened",
  "delivery_id": "abc-def-123",
  "repository": "org/my-project",
  "payload": { /* raw GitHub webhook payload */ },
  "processing_result": "enqueued",
  "task_id": "celery_task_456"
}
```

**Indexes:** `{ event: 1, action: 1 }`, `{ timestamp: -1 }`, `{ delivery_id: 1 }`

---

## Qdrant Collections

### `code_embeddings`

| Field              | Type      | Description                              |
|-------------------|-----------|------------------------------------------|
| `id`              | UUID      | Unique vector ID                         |
| `vector`          | float[3072] | Embedding from text-embedding-3-large  |
| `payload.repo_id` | string    | Repository reference                     |
| `payload.file_path`| string   | Source file path                         |
| `payload.content_hash`| string | SHA-256 of the code snippet           |
| `payload.language`| string    | Programming language                     |
| `payload.category`| string    | Category: snippet, pattern, finding      |

**Distance:** Cosine

---

## Migrations

Migrations are managed with Alembic and stored in `backend/alembic/versions/`. Key commands:

```bash
# Generate a new migration
alembic revision --autogenerate -m "description"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current migration state
alembic current
```

Migrations run automatically as part of the CI/CD deployment pipeline before rolling out new application code.
