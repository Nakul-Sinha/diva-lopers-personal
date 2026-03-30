defmodule Scheduler.JobStorePhase1Test do
  use ExUnit.Case, async: false

  alias Scheduler.JobStore
  alias Scheduler.JobStore.InMemoryAdapter

  setup do
    name = String.to_atom("job_store_adapter_#{System.unique_integer([:positive])}")
    {:ok, _pid} = InMemoryAdapter.start_link(name: name)

    [adapter: InMemoryAdapter, name: name]
  end

  test "idempotency insert + duplicate + get", ctx do
    opts = [adapter: ctx.adapter, name: ctx.name]

    assert {:ok, record} =
             JobStore.put_idempotency("public", "idem-1", "job-1", 1_999_999_999, opts)

    assert record.job_id == "job-1"

    assert {:error, :duplicate} =
             JobStore.put_idempotency("public", "idem-1", "job-1", 1_999_999_999, opts)

    assert {:ok, found} = JobStore.get_idempotency("public", "idem-1", opts)
    assert found.job_id == "job-1"
  end

  test "valid full lifecycle: SCHEDULED -> DISPATCHED -> RUNNING -> TERMINAL", ctx do
    opts = [adapter: ctx.adapter, name: ctx.name]

    assert {:ok, _} =
             JobStore.put_new_job(%{
               job_id: "job-lifecycle",
               state: "SCHEDULED",
               tenant_id: "public",
               idempotency_key: "idem-life"
             }, opts)

    assert {:ok, claimed} = JobStore.claim_for_dispatch("job-lifecycle", "node-a", 60_000, opts)
    assert claimed.state == "DISPATCHED"

    assert {:ok, running} = JobStore.mark_running("job-lifecycle", "node-a", 60_000, opts)
    assert running.state == "RUNNING"

    assert {:ok, terminal} =
             JobStore.mark_terminal_success("job-lifecycle", "node-a", %{bucket: "results", key: "x"}, opts)

    assert terminal.state == "TERMINAL"
  end

  test "cannot claim when already claimed by non-expired lease", ctx do
    opts = [adapter: ctx.adapter, name: ctx.name]

    assert {:ok, _} =
             JobStore.put_new_job(%{
               job_id: "job-claimed",
               state: "SCHEDULED",
               lease_expires_at: System.system_time(:millisecond) + 120_000
             }, opts)

    assert {:error, :already_claimed} =
             JobStore.claim_for_dispatch("job-claimed", "node-a", 60_000, opts)
  end

  test "lease reaper requeues expired running job", ctx do
    opts = [adapter: ctx.adapter, name: ctx.name]

    now = System.system_time(:millisecond)

    assert {:ok, _} =
             JobStore.put_new_job(%{
               job_id: "job-expired",
               state: "RUNNING",
               assigned_node: "node-a",
               lease_expires_at: now - 1_000,
               retry_count: 0
             }, opts)

    assert {:ok, requeued} =
             JobStore.requeue_expired_lease("job-expired", "node-a", 2_000, opts)

    assert requeued.state == "SCHEDULED"
    assert requeued.retry_count == 1
    assert is_integer(requeued.next_attempt_at)
  end

  test "adversarial claim race: 10 claimers, 1 winner; repeated 1000 times", ctx do
    opts = [adapter: ctx.adapter, name: ctx.name]

    Enum.each(1..1_000, fn i ->
      job_id = "job-race-#{i}"

      assert {:ok, _} = JobStore.put_new_job(%{job_id: job_id, state: "SCHEDULED"}, opts)

      results =
        1..10
        |> Task.async_stream(
          fn n -> JobStore.claim_for_dispatch(job_id, "node-#{n}", 30_000, opts) end,
          max_concurrency: 10,
          timeout: 10_000,
          ordered: false
        )
        |> Enum.map(fn {:ok, result} -> result end)

      winners = Enum.count(results, &match?({:ok, _}, &1))
      losers = Enum.count(results, &match?({:error, _}, &1))

      assert winners == 1
      assert losers == 9
    end)
  end
end
