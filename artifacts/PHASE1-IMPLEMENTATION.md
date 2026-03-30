# Phase 1 Implementation (Completed)

This folder contains the full Phase 1 Job State Machine implementation.

## Implemented Files

- `lib/scheduler/job_store.ex`
- `lib/scheduler/job_store/adapter.ex`
- `lib/scheduler/job_store/in_memory_adapter.ex`
- `lib/scheduler/job_store/exaws_adapter.ex` *(placeholder for external integration)*
- `test/scheduler/job_store_phase_1_test.exs`

## What is Fully Implemented

- Atomic transition logic in `Scheduler.JobStore`:
  - `SCHEDULED -> DISPATCHED`
  - `DISPATCHED -> RUNNING`
  - `RUNNING -> TERMINAL`
  - `RUNNING -> SCHEDULED` (lease-expired requeue)
- Idempotency behavior:
  - first insert succeeds
  - duplicates fail with `:duplicate`
- Adversarial race test:
  - 10 concurrent claimers
  - exactly 1 winner
  - repeated 1000 times

## Clearly Marked Integration Placeholders

`lib/scheduler/job_store/exaws_adapter.ex` has TODO markers where another project should wire:

- ExAws configuration and credentials
- DynamoDB serialization/deserialization
- Conditional check error normalization
- table names / env config ownership

## Run (once Elixir is installed)

```powershell
cd C:\Users\ludic\diva-lopers\apps\scheduler
mix test
```
