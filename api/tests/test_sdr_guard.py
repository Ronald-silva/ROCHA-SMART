import asyncio
import hashlib
import hmac
from datetime import datetime, timedelta, timezone

import pytest

from app.config import Settings
from app.services.sdr_guard import SdrGuard, SdrLimitError
from app.services.sdr_usage_store import InMemorySdrUsageStore, SdrUsageStoreError


def settings(**overrides):
    return Settings(**{"DATABASE_URL": "postgresql://test:test@localhost/test", "SDR_GATEWAY_SECRET": "x" * 32, **overrides})


def identity(session="00000000-0000-0000-0000-000000000001", ip="1"):
    ip_hash = hashlib.sha256(ip.encode()).hexdigest(); payload = f"{session}:{ip_hash}"
    return f"{payload}.{hmac.new(('x' * 32).encode(), payload.encode(), hashlib.sha256).hexdigest()}"


def reserve(guard, header, cfg, store=None, message="oi", history=0):
    return asyncio.run(guard.reserve(header, message, history, cfg, store or InMemorySdrUsageStore()))


def test_rejects_forged_identity_without_consuming_model():
    with pytest.raises(SdrLimitError, match="invalid_identity"): reserve(SdrGuard(), "forged.value", settings())


def test_two_guard_instances_share_rate_limit_store():
    store = InMemorySdrUsageStore(); cfg = settings(SDR_RATE_LIMIT_PER_MINUTE=1)
    reserve(SdrGuard(), identity(), cfg, store)
    with pytest.raises(SdrLimitError, match="rate_limit"): reserve(SdrGuard(), identity(), cfg, store)


def test_ip_quota_is_shared_across_sessions():
    store = InMemorySdrUsageStore(); cfg = settings(SDR_RATE_LIMIT_PER_MINUTE=1)
    reserve(SdrGuard(), identity(session="a", ip="same"), cfg, store)
    with pytest.raises(SdrLimitError, match="rate_limit"): reserve(SdrGuard(), identity(session="b", ip="same"), cfg, store)


def test_different_sessions_and_ips_have_independent_rate_quota():
    store = InMemorySdrUsageStore(); cfg = settings(SDR_RATE_LIMIT_PER_MINUTE=1)
    reserve(SdrGuard(), identity(session="a", ip="one"), cfg, store)
    reserve(SdrGuard(), identity(session="b", ip="two"), cfg, store)


def test_daily_quota_is_enforced_after_minute_limit():
    store = InMemorySdrUsageStore(); cfg = settings(SDR_RATE_LIMIT_PER_MINUTE=10, SDR_DAILY_QUOTA=1)
    reserve(SdrGuard(), identity(), cfg, store)
    with pytest.raises(SdrLimitError, match="daily_quota"): reserve(SdrGuard(), identity(), cfg, store)


@pytest.mark.parametrize("override,message,history,error", [
    ({"SDR_ENABLED": False}, "oi", 0, "disabled"),
    ({"SDR_MAX_MESSAGE_CHARS": 100}, "x" * 101, 0, "payload_too_large"),
    ({"SDR_MAX_HISTORY_MESSAGES": 1}, "oi", 2, "payload_too_large"),
    ({"SDR_MONTHLY_BUDGET_USD": 0.000001}, "x" * 100, 0, "monthly_budget"),
])
def test_blocks_before_model(override, message, history, error):
    with pytest.raises(SdrLimitError, match=error): reserve(SdrGuard(), identity(), settings(**override), message=message, history=history)


def test_circuit_breaker_opens_after_three_failures():
    guard = SdrGuard()
    for _ in range(3): guard.failure()
    with pytest.raises(SdrLimitError, match="circuit_open"): reserve(guard, identity(), settings())


def test_store_failure_is_fail_closed():
    class Broken:
        async def reserve(self, *_): raise SdrUsageStoreError("down")
    with pytest.raises(SdrLimitError, match="store_unavailable"): reserve(SdrGuard(), identity(), settings(), Broken())


def test_expired_window_is_cleaned():
    current = [datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc)]
    store = InMemorySdrUsageStore(now=lambda: current[0]); cfg = settings(SDR_RATE_LIMIT_PER_MINUTE=1)
    reserve(SdrGuard(), identity(), cfg, store)
    current[0] += timedelta(minutes=3)
    reserve(SdrGuard(), identity(), cfg, store)
