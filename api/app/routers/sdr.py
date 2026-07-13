from __future__ import annotations

from typing import Annotated, Literal
import asyncio
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.sdr import run_sdr_chat
from app.config import get_settings
from app.database import AsyncSessionLocal, get_session
from app.dependencies import CurrentSubject
from app.services.sdr_guard import SdrLimitError, sdr_guard
from app.services.sdr_usage_store import InMemorySdrUsageStore, PostgresSdrUsageStore, SdrUsageStore

router = APIRouter(prefix="/agents", tags=["agents-sdr"])
_memory_usage_store = InMemorySdrUsageStore()
_postgres_usage_store = PostgresSdrUsageStore(AsyncSessionLocal)


def get_sdr_usage_store() -> SdrUsageStore:
    return _postgres_usage_store if get_settings().sdr_usage_store == "postgres" else _memory_usage_store


class SdrChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    persona: Literal["sara", "camila"] = "sara"
    history: list[str] = Field(default_factory=list, max_length=20)


class SdrChatResponse(BaseModel):
    resposta: str
    persona: str
    aviso: str | None = None


@router.post("/sdr/chat", response_model=SdrChatResponse)
async def sdr_chat(
    body: SdrChatRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    _subject: CurrentSubject,
    usage_store: Annotated[SdrUsageStore, Depends(get_sdr_usage_store)],
    x_rocha_sdr_identity: Annotated[str | None, Header()] = None,
) -> SdrChatResponse:
    """Assistente de pré-compra: consulta catálogo (tools) e orienta; compra e suporte oficial ficam com o vendedor."""

    settings = get_settings()
    if not settings.sdr_enabled:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="A Sara está temporariamente indisponível. Tente novamente mais tarde.")
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="A Sara está temporariamente indisponível. Tente novamente mais tarde.")
    try:
        reservation = await sdr_guard.reserve(x_rocha_sdr_identity, body.message, len(body.history), settings, usage_store)
    except SdrLimitError as exc:
        code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE if str(exc) == "payload_too_large" else status.HTTP_429_TOO_MANY_REQUESTS
        if str(exc) in {"disabled", "circuit_open", "store_unavailable"}:
            code = status.HTTP_503_SERVICE_UNAVAILABLE
        raise HTTPException(status_code=code, detail="A Sara atingiu um limite temporário. Tente novamente mais tarde.") from exc
    try:
        async with asyncio.timeout(settings.sdr_timeout_seconds):
            out = await run_sdr_chat(session, user_message=body.message, persona=body.persona)
        sdr_guard.success()
        logging.info("sdr_usage", extra={"identity": reservation.identity_hash[:12], "estimated_tokens": reservation.estimated_tokens, "estimated_cost_usd": reservation.estimated_cost_usd})
    except TimeoutError as e:
        sdr_guard.failure()
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="A Sara demorou mais que o esperado. Tente novamente.") from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except Exception as e:
        sdr_guard.failure()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Serviço de IA temporariamente indisponível",
        ) from e
    return SdrChatResponse(**out)
