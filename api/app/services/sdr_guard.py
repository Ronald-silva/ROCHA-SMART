from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
import hashlib
import hmac
import re
import threading
import time

from app.config import Settings
from app.services.sdr_usage_store import SdrUsageLimitError, SdrUsageStore, SdrUsageStoreError, UsageReservation


class SdrLimitError(RuntimeError): pass


@dataclass
class Reservation:
    identity_hash: str
    estimated_tokens: int
    estimated_cost_usd: float


class SdrGuard:
    def __init__(self) -> None:
        self._lock = threading.Lock(); self._failures = 0; self._open_until = 0.0

    @staticmethod
    def verify_identity(value: str | None, secret: str) -> tuple[str, str]:
        if not value or "." not in value: raise SdrLimitError("invalid_identity")
        payload, signature = value.rsplit(".", 1)
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected) or ":" not in payload: raise SdrLimitError("invalid_identity")
        session_id, ip_hash = payload.split(":", 1)
        if not session_id or not re.fullmatch(r"[a-f0-9]{64}", ip_hash): raise SdrLimitError("invalid_identity")
        return hashlib.sha256(session_id.encode()).hexdigest(), ip_hash

    async def reserve(self, identity_header: str | None, message: str, history_count: int, settings: Settings, store: SdrUsageStore) -> Reservation:
        if not settings.sdr_enabled: raise SdrLimitError("disabled")
        if len(message) > settings.sdr_max_message_chars or history_count > settings.sdr_max_history_messages: raise SdrLimitError("payload_too_large")
        with self._lock:
            if time.time() < self._open_until: raise SdrLimitError("circuit_open")
        session_hash, ip_hash = self.verify_identity(identity_header, settings.sdr_gateway_secret)
        estimated_tokens = max(1, len(message) // 4) + settings.sdr_max_output_tokens
        estimated_cost = Decimal(estimated_tokens) * Decimal("0.000001")
        try:
            await store.reserve(UsageReservation(session_hash, ip_hash, estimated_tokens, estimated_cost), settings)
        except SdrUsageLimitError as exc:
            raise SdrLimitError(str(exc)) from exc
        except SdrUsageStoreError as exc:
            # Fail-closed é obrigatório em produção e padrão do projeto.
            if settings.sdr_store_failure_policy == "closed": raise SdrLimitError("store_unavailable") from exc
        return Reservation(session_hash, estimated_tokens, float(estimated_cost))

    def success(self) -> None:
        with self._lock: self._failures = 0

    def failure(self) -> None:
        with self._lock:
            self._failures += 1
            if self._failures >= 3: self._open_until = time.time() + 60


sdr_guard = SdrGuard()
