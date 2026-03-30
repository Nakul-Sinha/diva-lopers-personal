# Infinity Node

A serverless function execution platform built with Elixir/OTP. Infinity Node provides a Phoenix-based REST API for registering functions, invoking them inside isolated Firecracker microVMs, and observing execution through a real-time metrics pipeline.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   API App    │────▶│  Scheduler   │────▶│   Worker     │
│  (Phoenix)   │     │  (Elixir)    │     │ (Firecracker)│
│  Port 4000   │     │  SQS + DDB   │     │  microVMs    │
└─────┬───────┘     └──────────────┘     └──────┬───────┘
      │                                          │
      │  ┌──────────────────────────────────────┘
      │  │  Telemetry: [:worker, :execution, :complete]
      ▼  ▼
┌─────────────────────────────────────────────────────┐
│              Observability Pipeline                  │
│  TelemetryHandler → OtelExporter → CloudWatch Logs   │
│  MetricsReporter  → CloudWatch Metrics (10s push)    │
│  LiveDashboard    → /dashboard (5 custom pages)      │
└─────────────────────────────────────────────────────┘
```

### Team Ownership

| Person | Responsibility | App |
|--------|---------------|-----|
| Person 1 | Worker — Firecracker VM management, execution, snapshots | `apps/worker` |
| Person 2 | Scheduler — Job queue, state machine, DynamoDB, SQS consumer | `apps/scheduler` |
| Person 3 | API — Phoenix REST, Observability, Infrastructure (Terraform) | `apps/api` + `infra/` |

## Prerequisites

- **Elixir** 1.16+ / **Erlang** 26+ (see `.tool-versions`)
- **Terraform** >= 1.5 (for infrastructure)
- **AWS CLI** configured with credentials (for AWS services)

## Quick Start

```bash
# 1. Install Elixir dependencies
mix deps.get

# 2. Start the API server (dev mode)
mix phx.server
# or
iex -S mix phx.server

# 3. Server runs at http://localhost:4000
```

## API Endpoints

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Health check (used by ALB) |

### Functions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/v1/functions` | API Key | Register a new function |
| `POST` | `/v1/functions/:id/upload-url` | API Key | Get presigned S3 upload URL |
| `POST` | `/v1/functions/:id/rotate-webhook-token` | API Key | Rotate webhook token |

### Invocations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/v1/functions/:id/invoke` | API Key | Synchronous invocation (polls for result) |
| `POST` | `/v1/functions/:id/invoke/async` | API Key | Asynchronous invocation (returns immediately) |

### Jobs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/v1/jobs/:job_id` | API Key | Get job result / status |

### Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/v1/webhooks/:function_id/:token` | Token | Webhook-triggered invocation |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/dashboard` | API Key | Phoenix LiveDashboard with 5 custom pages |

## Authentication

All API endpoints (except `/health` and webhooks) require the `x-api-key` header:

```bash
curl -H "x-api-key: your-api-key" http://localhost:4000/v1/functions
```

Set the API key via the `INFINITY_NODE_API_KEY` environment variable.

## Configuration

### Environment Variables

See [`.env.example`](.env.example) for all available variables. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `4000` | Phoenix HTTP port |
| `INFINITY_NODE_API_KEY` | (required) | Static API key for auth |
| `AWS_REGION` | `us-east-1` | AWS region |
| `SQS_QUEUE_URL` | — | SQS main job queue URL |
| `SQS_DLQ_URL` | — | SQS dead-letter queue URL |
| `ARTIFACTS_BUCKET` | — | S3 bucket for function artifacts |
| `LOGS_BUCKET` | — | S3 bucket for execution logs |
| `DYNAMODB_JOBS_TABLE` | `infinity-node-jobs-v1` | DynamoDB jobs table |
| `OTEL_ENDPOINT` | — | OpenTelemetry collector (optional) |

### Config Files

| File | Purpose |
|------|---------|
| `config/config.exs` | Shared defaults for all environments |
| `config/dev.exs` | Development overrides (debug logging, noop adapters) |
| `config/prod.exs` | Production overrides (info logging, jailer enabled) |
| `config/test.exs` | Test overrides (port 4002, server off) |
| `config/runtime.exs` | Runtime env var reads (all sensitive config) |

## Infrastructure (Terraform)

All AWS infrastructure is defined in `infra/terraform/`:

```bash
cd infra/terraform

# Preview changes
terraform init
terraform plan

# Provision resources
terraform apply

# Tear down
terraform destroy
```

### Resources Created

- **S3**: `infinity-node-artifacts` (versioned), `infinity-node-logs` (30-day expiry)
- **SQS**: Main job queue + DLQ (redrive at 3 failures)
- **SNS**: `infinity-node-alerts` topic with email subscription
- **IAM**: Task execution role + task role (SQS, DynamoDB, S3, CloudWatch)
- **ECS**: Cluster + API (Fargate) + Worker (EC2) task definitions
- **CloudWatch**: 3 log groups (14-day retention) + 4 alarms

### Not Yet Provisioned

- **ALB**: Requires VPC ID and subnet IDs (set in `variables.tf`)
- **Capacity Provider**: i3.metal instance type for Worker nodes

## LiveDashboard

Access at `http://localhost:4000/dashboard` (requires API key authentication).

### Custom Pages

| Page | What It Shows |
|------|--------------|
| **Cluster Overview** | Active workers, available slots, jobs/sec, uptime |
| **Queue State** | Main queue depth, DLQ depth, processing rate, drain time estimate |
| **Latency** | P50/P95/P99 execution latency with status indicators |
| **Job Explorer** | Last 100 jobs — sortable table with state, function, retries |
| **Failure Log** | Failed jobs with reason, category, retry count |

## Testing

```bash
# Run all tests
mix test

# Run API tests only
mix test apps/api/test
```

## Project Structure

```
├── apps/
│   ├── api/           # Person 3 — Phoenix API + Observability
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── controllers/    # Function, Invocation, Job, Health, Webhook
│   │   │   │   ├── plugs/          # AuthPlug, RateLimitPlug
│   │   │   │   ├── helpers/        # Response helpers
│   │   │   │   ├── live_dashboard/ # 5 custom dashboard pages
│   │   │   │   ├── endpoint.ex
│   │   │   │   ├── router.ex
│   │   │   │   └── telemetry.ex
│   │   │   ├── infinity_node/      # Shared schema (JobEnvelope, ResultEnvelope)
│   │   │   └── observability/      # TelemetryHandler, OtelExporter, MetricsReporter
│   │   └── test/
│   ├── scheduler/     # Person 2 — Job queue management
│   └── worker/        # Person 1 — Firecracker VM execution
├── config/            # Environment configs (dev, prod, test, runtime)
├── infra/
│   ├── dynamodb/      # DynamoDB schema + provisioning (Person 2)
│   └── terraform/     # Full IaC: S3, SQS, SNS, IAM, ECS, CloudWatch
├── rust/              # Rust components (Person 1)
├── scripts/           # Utility scripts
└── mix.exs            # Umbrella root
```
