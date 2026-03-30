#!/usr/bin/env bash
set -euo pipefail

# Basic adversarial validation hooks for Person 1 isolation requirements.
# This script expects helper binaries/test jobs to already exist in the guest image.

fail() {
  echo "[FAIL] $*" >&2
  exit 1
}

pass() {
  echo "[PASS] $*"
}

require() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

require jq
require curl

VM_API_SOCKET="${VM_API_SOCKET:-/tmp/fc-slot-0.socket}"

[[ -S "${VM_API_SOCKET}" ]] || fail "VM API socket not found: ${VM_API_SOCKET}"
pass "API socket exists"

# Placeholder checks. Replace these with runtime-specific test jobs in Phase 2.
if [[ -f /sys/fs/cgroup/infinity-node/test/memory.max ]]; then
  pass "cgroup memory controller file present"
else
  echo "[WARN] cgroup test path missing; skipping memory assertion"
fi

if mount | grep -q cgroup2; then
  pass "cgroups v2 mounted"
else
  fail "cgroups v2 is required"
fi

echo "Isolation script scaffold completed. Implement guest workload assertions next."
