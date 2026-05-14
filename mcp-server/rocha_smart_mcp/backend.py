from __future__ import annotations

import json
import os
from typing import Any

import httpx


def api_base() -> str:
    return os.environ.get("ROCHA_SMART_API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")


def api_token() -> str:
    return os.environ.get("ROCHA_SMART_JWT", "").strip()


def _headers_json() -> dict[str, str]:
    h: dict[str, str] = {"Accept": "application/json", "Content-Type": "application/json"}
    t = api_token()
    if t:
        h["Authorization"] = f"Bearer {t}"
    return h


async def api_get(path: str, *, params: dict[str, Any] | None = None) -> Any:
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(f"{api_base()}{path}", headers=_headers_json(), params=params)
        r.raise_for_status()
        if not r.content:
            return None
        return r.json()


async def api_post(path: str, body: dict[str, Any]) -> Any:
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(f"{api_base()}{path}", headers=_headers_json(), json=body)
        r.raise_for_status()
        if not r.content:
            return None
        return r.json()


def api_error_message(exc: BaseException) -> str:
    if isinstance(exc, httpx.HTTPStatusError):
        try:
            return f"HTTP {exc.response.status_code}: {exc.response.text[:800]}"
        except Exception:
            return f"HTTP {exc.response.status_code}"
    return str(exc)


def dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2, default=str)
