# Phase 1 — Job State Machine Implementation Plan

This starts Phase 1 from the Distributed Scheduler plan.

## Scope

Implement `JobStore` with atomic conditional writes for job lifecycle transitions:

- `SCHEDULED -> DISPATCHED` (claim)
- `DISPATCHED -> RUNNING` (worker start)
- `RUNNING -> TERMINAL` (complete)
- `RUNNING -> SCHEDULED` (lease reaper reclaim)
- idempotency insert/get behavior

## Canonical Schema Source

Use [infra/dynamodb/schema.yaml](../infra/dynamodb/schema.yaml) as the canonical schema definition.

## Module Contract (Elixir)

```elixir
defmodule Scheduler.JobStore do
  @type job_id :: String.t()
  @type node_id :: String.t()

  @spec put_new_job(map()) :: {:ok, map()} | {:error, :already_exists | term()}
  @spec put_idempotency(String.t(), String.t(), String.t(), non_neg_integer()) :: {:ok, map()} | {:error, :duplicate | term()}
  @spec get_idempotency(String.t(), String.t()) :: {:ok, map()} | {:error, :not_found | term()}

  @spec claim_for_dispatch(job_id(), node_id(), non_neg_integer()) :: {:ok, map()} | {:error, :already_claimed | :invalid_state | term()}
  @spec mark_running(job_id(), node_id(), non_neg_integer()) :: {:ok, map()} | {:error, :invalid_state | term()}
  @spec mark_terminal_success(job_id(), node_id(), map()) :: {:ok, map()} | {:error, :invalid_state | term()}
  @spec mark_terminal_failure(job_id(), node_id(), map()) :: {:ok, map()} | {:error, :invalid_state | term()}

  @spec requeue_expired_lease(job_id(), node_id(), non_neg_integer()) :: {:ok, map()} | {:error, :stale_lease | :invalid_state | term()}
end
```

## Required Condition Expressions

### Claim (`SCHEDULED -> DISPATCHED`)

```text
state = :scheduled AND (attribute_not_exists(lease_expires_at) OR lease_expires_at < :now)
```

### Start (`DISPATCHED -> RUNNING`)

```text
state = :dispatched AND assigned_node = :node_id
```

### Complete (`RUNNING -> TERMINAL`)

```text
state = :running AND assigned_node = :node_id
```

### Requeue Expired Lease (`RUNNING -> SCHEDULED`)

```text
state = :running AND lease_expires_at < :now
```

## Concurrency Test (must pass before Phase 2)

- Create one `SCHEDULED` job.
- Spawn 10 claimers concurrently.
- Exactly 1 `claim_for_dispatch/3` succeeds.
- 9 fail with `:already_claimed`.
- Repeat 1000 iterations.

## Deliverables for Phase 1 Done

1. `JobStore` module compiled and used by scheduler.
2. All transitions implemented as conditional writes.
3. Concurrency test green.
4. Lease reclaim path green.
5. Idempotency duplicate behavior green.

## Next Phase Gate

Do not start SQS consumer (Phase 2) until all above pass.
