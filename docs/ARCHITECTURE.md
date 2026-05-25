# Architecture Documentation

## Overview

The AI-Powered Code Review Assistant is a microservices-based platform that automatically reviews pull requests using large language models. It integrates with GitHub via webhooks and OAuth, analyzes code diffs, and produces structured findings with severity ratings, explanations, and actionable suggestions.

---

## High-Level Architecture

```
                        ┌──────────────┐
                        │    GitHub     │
                        │  (Webhooks)   │
                        └──────┬───────┘
                               │ HTTPS (X-Hub-Signature-256)
                               ▼
                        ┌──────────────┐
                        │    Nginx      │
                        │  (Reverse     │
                        │   Proxy)      │
                        └──┬───────┬───┘
                           │       │
              ┌────────────┘       └──────────────┐
              ▼                                    ▼
     ┌─────────────────┐               ┌─────────────────┐
     │   Frontend       │               │   Webhook        │
     │   (Next.js)      │               │   Server         │
     │   :3000          │               │   (FastAPI)      │
     └────────┬────────┘               │   :8001          │
              │                         └────────┬────────┘
              │ API calls                        │
              ▼                                  │
     ┌─────────────────┐                         │
     │   Backend API    │◄────────────────────────┘
     │   (FastAPI)      │
     │   :8000          │
     └──┬──────┬───────┘
        │      │
        │      │ Celery tasks
        │      ▼
        │   ┌─────────────────┐     ┌──────────────────┐
        │   │   AI Worker      │────►│   AI Providers    │
        │   │   (Celery)       │     │   - OpenAI        │
        │   │                   │     │   - Anthropic     │
        │   └──────┬──────────┘     └──────────────────┘
        │          │
        ▼          ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ PostgreSQL│  │  Redis   │  │  Qdrant  │  │  MongoDB  │
  │  (Primary │  │ (Broker/ │  │ (Vector  │  │  (Audit   │
  │   DB)     │  │  Cache)  │  │  Store)  │  │  Logs)    │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## Service Descriptions

### Frontend (Next.js)

- **Runtime:** Node.js 20
- **Port:** 3000
- **Responsibility:** Web UI, user authentication (NextAuth.js), repository management dashboard, review display, settings pages
- **Key Technologies:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Communication:** REST API calls to the Backend API via Nginx reverse proxy

### Backend API (FastAPI)

- **Runtime:** Python 3.12, Uvicorn ASGI server
- **Port:** 8000
- **Responsibility:** Core REST API, authentication/authorization (JWT), repository CRUD, review orchestration, settings management, analytics aggregation
- **Key Technologies:** FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2
- **Communication:** PostgreSQL (async via asyncpg), Redis (via Celery), Qdrant (HTTP/gRPC), MongoDB (motor async driver)
- **Async Workers:** 4 Uvicorn workers in production

### Webhook Server (FastAPI)

- **Runtime:** Python 3.12, Uvicorn ASGI server
- **Port:** 8001
- **Responsibility:** Receives and validates GitHub webhook events (`pull_request`, `installation`), enqueues review tasks into Celery
- **Key Technologies:** FastAPI, PyGitHub, hmac signature verification
- **Security:** Validates `X-Hub-Signature-256` on every request; runs as a separate service for isolation and independent scaling

### AI Worker (Celery)

- **Runtime:** Python 3.12, Celery worker
- **Responsibility:** Asynchronous code review processing — fetches PR diffs from GitHub, constructs prompts, calls LLM providers, parses structured output, stores findings, posts review comments back to GitHub
- **Key Technologies:** Celery 5, OpenAI SDK, Anthropic SDK, tiktoken
- **Concurrency:** 4 workers per instance (prefork); GPU-enabled node group available for local model inference
- **Task Queue:** Redis (DB 1 for broker, DB 2 for result backend)

### Nginx (Reverse Proxy)

- **Runtime:** nginx 1.25 Alpine
- **Ports:** 80 (HTTP), 443 (HTTPS)
- **Responsibility:** TLS termination, request routing, rate limiting, gzip compression, security headers, static asset caching
- **Routing:**
  - `/` → Frontend (Next.js)
  - `/api/` → Backend API
  - `/webhook/github` → Webhook Server
  - `/_next/static/` → Frontend static assets (long cache)

---

## Data Stores

### PostgreSQL 16

**Role:** Primary relational database for structured application data.

**Contents:**
- Users and organizations
- Repository metadata
- Pull request records
- Review results and findings
- Settings and configurations
- OAuth tokens (encrypted)

**Migrations:** Managed via Alembic. Migration files are version-controlled and run as part of the CI/CD deployment pipeline.

### Redis 7

**Role:** Message broker, cache, and session store.

**Usage:**
- DB 0: Application cache (repository metadata, rate limit counters)
- DB 1: Celery broker (task queue)
- DB 2: Celery result backend (task status and return values)

### Qdrant

**Role:** Vector database for semantic code search and similarity.

**Usage:**
- Stores embeddings of code snippets, review patterns, and historical findings
- Enables "similar issues found before" feature in reviews
- Uses `text-embedding-3-large` model for embedding generation

### MongoDB 7

**Role:** Document store for audit logs and semi-structured data.

**Usage:**
- API request/response audit logs
- LLM prompt/completion logs (for debugging and improvement)
- Webhook event history (raw payloads)
- Performance metrics and trace data

---

## Authentication & Authorization

### GitHub OAuth Flow

1. User clicks "Sign in with GitHub" on the frontend
2. Frontend redirects to GitHub authorization URL
3. GitHub redirects back with an authorization code
4. Frontend sends code to `POST /api/v1/auth/github`
5. Backend exchanges code for GitHub access token
6. Backend creates/updates user record in PostgreSQL
7. Backend issues JWT access token (1 hour) and refresh token (7 days)

### JWT Token Structure

```json
{
  "sub": "usr_abc123",
  "email": "dev@example.com",
  "github_username": "janedev",
  "role": "user",
  "exp": 1705312800,
  "iat": 1705309200
}
```

### Permission Model

| Role        | Read Reviews | Trigger Reviews | Manage Repos | Admin Settings |
|-------------|:---:|:---:|:---:|:---:|
| viewer      | ✅  | ❌  | ❌  | ❌  |
| user        | ✅  | ✅  | ❌  | ❌  |
| maintainer  | ✅  | ✅  | ✅  | ❌  |
| admin       | ✅  | ✅  | ✅  | ✅  |

---

## Review Pipeline

The end-to-end code review process:

```
GitHub Webhook
     │
     ▼
Webhook Server ─── validate signature ─── enqueue Celery task
     │
     ▼
AI Worker picks up task
     │
     ├──► Fetch PR diff from GitHub API
     ├──► Chunk diff into manageable pieces (respecting token limits)
     ├──► Build structured prompt with context (repo info, previous reviews)
     ├──► Call LLM provider (OpenAI / Anthropic)
     ├──► Parse structured JSON response
     ├──► Enrich findings with vector similarity search (Qdrant)
     ├──► Store review results in PostgreSQL
     ├──► Post review comments on GitHub PR (optional, configurable)
     └──► Update review status → completed
```

### Token Budget Management

- Maximum context window: 128K tokens (GPT-4 Turbo)
- Reserved for system prompt + output: ~4K tokens
- Available for code diff: ~124K tokens
- Large diffs are chunked and reviewed in parallel, then findings are merged and deduplicated

---

## Deployment

### Docker Compose (Development/Staging)

```bash
# Start all services
docker compose -f infrastructure/docker/docker-compose.yml \
               -f infrastructure/docker/docker-compose.dev.yml up -d

# Production-like
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### Kubernetes (Production)

- Namespace: `code-review-assistant`
- Backend: 3 replicas with rolling updates (maxUnavailable: 1)
- AI Worker: 2–5 replicas (HPA based on Celery queue depth)
- Frontend: 2 replicas behind ClusterIP service
- Secrets managed via Kubernetes Secrets + External Secrets Operator

### Terraform (Infrastructure)

Infrastructure is defined in `infrastructure/terraform/` and provisions:
- AWS VPC with public/private subnets across 3 AZs
- EKS cluster with managed node groups (general + AI-worker with GPU)
- RDS PostgreSQL 16 (Multi-AZ in production)
- ElastiCache Redis 7
- ECR repositories for container images
- S3 bucket for uploads
- IAM roles and security groups

---

## Observability

### Logging

- Structured JSON logs emitted by all services
- Log aggregation via stdout → CloudWatch / Loki
- Request IDs propagated across service boundaries

### Metrics

- Prometheus metrics exposed at `/metrics` on backend (port 8000)
- Key metrics: review latency, LLM token usage, queue depth, error rates

### Tracing

- OpenTelemetry instrumentation on backend and AI worker
- Traces exported to Jaeger / AWS X-Ray

### Alerting

- Critical: Review failure rate > 5%, API error rate > 1%
- Warning: Queue depth > 50, review latency p99 > 120s
- Info: Daily review volume, token consumption

---

## Security

- All inter-service communication within the VPC (no public exposure)
- TLS termination at Nginx; internal traffic can be HTTP
- Secrets stored in AWS Secrets Manager / Kubernetes Secrets (never in code)
- GitHub webhook signature verification (`X-Hub-Signature-256`)
- JWT tokens with short expiry (1 hour) + refresh token rotation
- Rate limiting at Nginx level (per endpoint category)
- Security headers (CSP, X-Frame-Options, etc.) enforced by Nginx
- Container images scanned with Trivy in CI pipeline
- RDS encryption at rest; S3 bucket encrypted with KMS
