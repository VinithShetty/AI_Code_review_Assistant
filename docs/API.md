# API Documentation

> Base URL: `http://localhost:8000/api/v1`
> OpenAPI spec available at `/openapi.json`, interactive docs at `/docs` (Swagger) and `/redoc`.

---

## Authentication

All authenticated endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via the GitHub OAuth flow or email/password login.

---

## Health Check

### `GET /health`

Returns service health status.

**Response `200 OK`:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 42389
}
```

---

## Authentication Endpoints

### `POST /api/v1/auth/github`

Initiate GitHub OAuth flow.

**Request Body:**

```json
{
  "code": "github-oauth-authorization-code",
  "redirect_uri": "http://localhost:3000/auth/callback"
}
```

**Response `200 OK`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "usr_abc123",
    "email": "dev@example.com",
    "name": "Jane Developer",
    "avatar_url": "https://avatars.githubusercontent.com/u/12345",
    "github_username": "janedev"
  }
}
```

### `POST /api/v1/auth/refresh`

Refresh an expired access token.

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response `200 OK`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### `POST /api/v1/auth/logout`

Invalidate the current session.

**Headers:** `Authorization: Bearer <token>`

**Response `204 No Content`**

---

## Repository Endpoints

### `GET /api/v1/repositories`

List all repositories the authenticated user has access to.

**Query Parameters:**

| Parameter    | Type   | Default | Description                        |
|-------------|--------|---------|------------------------------------|
| `page`      | int    | 1       | Page number                        |
| `per_page`  | int    | 20      | Results per page (max 100)         |
| `sort`      | string | updated | Sort field: `updated`, `name`      |
| `direction` | string | desc    | Sort direction: `asc`, `desc`      |
| `installed` | bool   | null    | Filter by app installation status  |

**Response `200 OK`:**

```json
{
  "repositories": [
    {
      "id": "repo_abc123",
      "github_id": 12345678,
      "full_name": "org/my-project",
      "name": "my-project",
      "owner": "org",
      "private": false,
      "language": "TypeScript",
      "default_branch": "main",
      "app_installed": true,
      "last_analyzed_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

### `POST /api/v1/repositories/{repo_id}/install`

Install the Code Review Assistant on a repository.

**Response `200 OK`:**

```json
{
  "id": "repo_abc123",
  "app_installed": true,
  "webhook_configured": true
}
```

### `DELETE /api/v1/repositories/{repo_id}/install`

Uninstall the Code Review Assistant from a repository.

**Response `204 No Content`**

---

## Pull Request Endpoints

### `GET /api/v1/repositories/{repo_id}/pull-requests`

List pull requests for a repository.

**Query Parameters:**

| Parameter | Type   | Default | Description                                  |
|-----------|--------|---------|----------------------------------------------|
| `state`   | string | open    | PR state: `open`, `closed`, `all`            |
| `page`    | int    | 1       | Page number                                  |
| `per_page`| int    | 20      | Results per page (max 100)                   |

**Response `200 OK`:**

```json
{
  "pull_requests": [
    {
      "id": "pr_xyz789",
      "github_id": 98765,
      "number": 42,
      "title": "feat: add user authentication",
      "state": "open",
      "author": "janedev",
      "base_branch": "main",
      "head_branch": "feature/auth",
      "additions": 342,
      "deletions": 89,
      "changed_files": 12,
      "review_status": "completed",
      "created_at": "2024-01-14T08:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 7,
  "page": 1,
  "per_page": 20
}
```

### `POST /api/v1/repositories/{repo_id}/pull-requests/{pr_number}/review`

Trigger an AI-powered code review on a pull request.

**Request Body (optional overrides):**

```json
{
  "model": "gpt-4-turbo-preview",
  "focus_areas": ["security", "performance"],
  "severity_threshold": "medium",
  "include_suggestions": true
}
```

**Response `202 Accepted`:**

```json
{
  "review_id": "rev_abc123",
  "status": "in_progress",
  "estimated_completion_seconds": 45
}
```

### `GET /api/v1/repositories/{repo_id}/pull-requests/{pr_number}/review`

Get the review result for a pull request.

**Response `200 OK`:**

```json
{
  "review_id": "rev_abc123",
  "status": "completed",
  "model": "gpt-4-turbo-preview",
  "summary": "The PR implements user authentication with JWT tokens. Overall quality is good with a few security considerations.",
  "overall_score": 7.5,
  "findings": [
    {
      "id": "find_001",
      "severity": "high",
      "category": "security",
      "file": "src/auth/login.ts",
      "line_start": 42,
      "line_end": 45,
      "title": "Potential timing attack on password comparison",
      "description": "Using `===` for password comparison is vulnerable to timing attacks. Use a constant-time comparison function instead.",
      "suggestion": "import { timingSafeEqual } from 'crypto';\n// ...\nconst isValid = timingSafeEqual(Buffer.from(hashedInput), Buffer.from(storedHash));",
      "code_snippet": "if (password === storedHash) { ... }"
    }
  ],
  "metrics": {
    "total_findings": 5,
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 2,
    "files_analyzed": 12,
    "lines_analyzed": 342,
    "analysis_duration_seconds": 38
  },
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:30:38Z"
}
```

---

## Review History & Analytics

### `GET /api/v1/reviews`

List all reviews across repositories.

**Query Parameters:**

| Parameter    | Type   | Default | Description                                    |
|-------------|--------|---------|------------------------------------------------|
| `repo_id`   | string | null    | Filter by repository ID                        |
| `status`    | string | null    | Filter by status: `in_progress`, `completed`, `failed` |
| `severity`  | string | null    | Filter by min severity: `critical`, `high`, `medium`, `low` |
| `page`      | int    | 1       | Page number                                    |
| `per_page`  | int    | 20      | Results per page (max 100)                     |

**Response `200 OK`:**

```json
{
  "reviews": [
    {
      "review_id": "rev_abc123",
      "repository": "org/my-project",
      "pr_number": 42,
      "status": "completed",
      "overall_score": 7.5,
      "total_findings": 5,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 128,
  "page": 1,
  "per_page": 20
}
```

### `GET /api/v1/analytics/dashboard`

Get aggregated analytics for the authenticated user/organization.

**Query Parameters:**

| Parameter | Type | Default  | Description                     |
|-----------|------|----------|---------------------------------|
| `from`    | date | 30d ago  | Start date (ISO 8601)           |
| `to`      | date | today    | End date (ISO 8601)             |
| `repo_id` | string | null   | Filter by repository            |

**Response `200 OK`:**

```json
{
  "period": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "totals": {
    "reviews_completed": 156,
    "pull_requests_analyzed": 203,
    "findings_total": 892,
    "findings_critical": 12,
    "findings_high": 89,
    "findings_medium": 342,
    "findings_low": 449
  },
  "trends": {
    "daily_reviews": [
      { "date": "2024-01-15", "count": 8, "avg_score": 7.2 }
    ],
    "severity_distribution": {
      "critical": 1.3,
      "high": 10.0,
      "medium": 38.3,
      "low": 50.3
    }
  },
  "top_repositories": [
    {
      "repository": "org/my-project",
      "reviews": 42,
      "avg_score": 7.8,
      "findings": 189
    }
  ]
}
```

---

## Settings

### `GET /api/v1/settings`

Get user/organization settings.

**Response `200 OK`:**

```json
{
  "default_model": "gpt-4-turbo-preview",
  "default_severity_threshold": "medium",
  "auto_review_enabled": true,
  "auto_review_on_pr_open": true,
  "auto_review_on_push": false,
  "notification_preferences": {
    "email_on_critical": true,
    "email_on_review_complete": false,
    "slack_integration_enabled": false
  },
  "ignored_patterns": [
    "*.lock",
    "package-lock.json",
    "yarn.lock"
  ]
}
```

### `PATCH /api/v1/settings`

Update user/organization settings.

**Request Body:** (partial update)

```json
{
  "auto_review_enabled": false,
  "default_severity_threshold": "high"
}
```

**Response `200 OK`:** Returns the full updated settings object.

---

## Webhook Endpoint

### `POST /webhook/github`

Receives GitHub webhook events. This endpoint is called by GitHub and does not require JWT authentication. It validates the `X-Hub-Signature-256` header instead.

**Supported Events:**

| Event                  | Action                |
|------------------------|-----------------------|
| `pull_request`         | opened, synchronize   |
| `pull_request_review`  | submitted             |
| `installation`         | created, deleted      |
| `installation_repos`   | added, removed        |

**Response `202 Accepted`:**

```json
{
  "event": "pull_request",
  "action": "opened",
  "processing": true
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "severity_threshold",
        "message": "Must be one of: critical, high, medium, low"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Meaning                        |
|------|--------------------------------|
| 400  | Bad Request / Validation Error |
| 401  | Unauthorized                   |
| 403  | Forbidden                      |
| 404  | Not Found                      |
| 409  | Conflict                       |
| 422  | Unprocessable Entity           |
| 429  | Rate Limited                   |
| 500  | Internal Server Error          |
| 503  | Service Unavailable            |

### Rate Limiting

API requests are rate-limited to 30 requests per minute per user. Rate limit headers are included in every response:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1705312800
```
