from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Protocol

from sqlalchemy import and_, delete, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings
from app.models import SdrUsageBucket


class SdrUsageLimitError(RuntimeError):
    pass


class SdrUsageStoreError(RuntimeError):
    pass


@dataclass(frozen=True)
class UsageReservation:
    session_hash: str
    ip_hash: str
    estimated_tokens: int
    estimated_cost_usd: Decimal


class SdrUsageStore(Protocol):
    async def reserve(self, usage: UsageReservation, settings: Settings) -> None: ...
    async def get_usage(self, subject_hash: str) -> list[dict]: ...
    async def reset(self, subject_hash: str) -> int: ...


def _windows(now: datetime) -> tuple[datetime, datetime, datetime]:
    clean = now.astimezone(timezone.utc).replace(tzinfo=None)
    return clean.replace(second=0, microsecond=0), clean.replace(hour=0, minute=0, second=0, microsecond=0), clean.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


class InMemorySdrUsageStore:
    def __init__(self, now=lambda: datetime.now(timezone.utc)) -> None:
        self._now = now
        self._lock = asyncio.Lock()
        self._rows: dict[tuple[str, str, str, datetime], dict] = {}

    async def reserve(self, usage: UsageReservation, settings: Settings) -> None:
        now = self._now()
        minute, day, month = _windows(now)
        specs = _bucket_specs(usage, settings, minute, day, month)
        async with self._lock:
            self._rows = {k: v for k, v in self._rows.items() if v["expires_at"] > now.replace(tzinfo=None)}
            _assert_limits(self._rows, specs)
            for key, requests, tokens, cost, expires_at, _request_limit, _cost_limit in specs:
                row = self._rows.setdefault(key, {"requests": 0, "tokens": 0, "cost": Decimal("0"), "expires_at": expires_at})
                row["requests"] += requests; row["tokens"] += tokens; row["cost"] += cost

    async def get_usage(self, subject_hash: str) -> list[dict]:
        return [dict(key=k, **v) for k, v in self._rows.items() if k[0] == subject_hash]

    async def reset(self, subject_hash: str) -> int:
        keys = [key for key in self._rows if key[0] == subject_hash]
        for key in keys: del self._rows[key]
        return len(keys)


class PostgresSdrUsageStore:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession], now=lambda: datetime.now(timezone.utc)) -> None:
        self._session_factory = session_factory
        self._now = now

    async def reserve(self, usage: UsageReservation, settings: Settings) -> None:
        now = self._now()
        minute, day, month = _windows(now)
        specs = _bucket_specs(usage, settings, minute, day, month)
        try:
            async with self._session_factory() as session:
                async with session.begin():
                    # Piloto de baixo volume: lock transacional serializa a checagem + incremento e impede estouro concorrente.
                    await session.execute(text("SELECT pg_advisory_xact_lock(hashtext('rocha_sdr_usage'))"))
                    await session.execute(delete(SdrUsageBucket).where(SdrUsageBucket.expiresAt <= now.replace(tzinfo=None)))
                    current: dict[tuple[str, str, str, datetime], dict] = {}
                    for key, *_rest in specs:
                        row = (await session.execute(select(SdrUsageBucket).where(and_(SdrUsageBucket.subjectHash == key[0], SdrUsageBucket.subjectKind == key[1], SdrUsageBucket.windowKind == key[2], SdrUsageBucket.windowStart == key[3])))).scalar_one_or_none()
                        if row:
                            current[key] = {"requests": row.requestCount, "tokens": row.tokenCount, "cost": Decimal(row.costUsd)}
                    _assert_limits(current, specs)
                    for key, requests, tokens, cost, expires_at, _request_limit, _cost_limit in specs:
                        statement = insert(SdrUsageBucket).values(subjectHash=key[0], subjectKind=key[1], windowKind=key[2], windowStart=key[3], requestCount=requests, tokenCount=tokens, costUsd=cost, expiresAt=expires_at, updatedAt=now.replace(tzinfo=None))
                        statement = statement.on_conflict_do_update(index_elements=["subjectHash", "subjectKind", "windowKind", "windowStart"], set_={"requestCount": SdrUsageBucket.requestCount + requests, "tokenCount": SdrUsageBucket.tokenCount + tokens, "costUsd": SdrUsageBucket.costUsd + cost, "expiresAt": expires_at, "updatedAt": now.replace(tzinfo=None)})
                        await session.execute(statement)
        except SdrUsageLimitError:
            raise
        except Exception as exc:
            raise SdrUsageStoreError("usage_store_unavailable") from exc

    async def get_usage(self, subject_hash: str) -> list[dict]:
        async with self._session_factory() as session:
            rows = (await session.execute(select(SdrUsageBucket).where(SdrUsageBucket.subjectHash == subject_hash))).scalars().all()
            return [{"subject_kind": r.subjectKind, "window_kind": r.windowKind, "window_start": r.windowStart, "requests": r.requestCount, "tokens": r.tokenCount, "cost": str(r.costUsd)} for r in rows]

    async def reset(self, subject_hash: str) -> int:
        async with self._session_factory() as session:
            result = await session.execute(delete(SdrUsageBucket).where(SdrUsageBucket.subjectHash == subject_hash))
            await session.commit()
            return int(result.rowcount or 0)


def _bucket_specs(usage: UsageReservation, settings: Settings, minute: datetime, day: datetime, month: datetime):
    minute_exp = minute + timedelta(minutes=2); day_exp = day + timedelta(days=2); month_exp = (month.replace(day=28) + timedelta(days=5)).replace(day=1) + timedelta(days=2)
    cost = usage.estimated_cost_usd
    return [
        ((usage.session_hash, "session", "minute", minute), 1, usage.estimated_tokens, cost, minute_exp, settings.sdr_rate_limit_per_minute, None),
        ((usage.ip_hash, "ip", "minute", minute), 1, usage.estimated_tokens, cost, minute_exp, settings.sdr_rate_limit_per_minute, None),
        ((usage.session_hash, "session", "day", day), 1, usage.estimated_tokens, cost, day_exp, settings.sdr_daily_quota, None),
        ((usage.ip_hash, "ip", "day", day), 1, usage.estimated_tokens, cost, day_exp, settings.sdr_daily_quota, None),
        (("global", "global", "month", month), 1, usage.estimated_tokens, cost, month_exp, None, Decimal(str(settings.sdr_monthly_budget_usd))),
    ]


def _assert_limits(current: dict, specs) -> None:
    for key, requests, _tokens, cost, _expires, request_limit, cost_limit in specs:
        row = current.get(key, {"requests": 0, "cost": Decimal("0")})
        if request_limit is not None and row["requests"] + requests > request_limit:
            raise SdrUsageLimitError("rate_limit" if key[2] == "minute" else "daily_quota")
        if cost_limit is not None and Decimal(row["cost"]) + cost > cost_limit:
            raise SdrUsageLimitError("monthly_budget")
