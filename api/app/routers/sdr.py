from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.sdr import run_sdr_chat
from app.config import get_settings
from app.database import get_session
from app.dependencies import CurrentSubject

router = APIRouter(prefix="/agents", tags=["agents-sdr"])


class SdrChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    persona: Literal["sara", "camila"] = "sara"


class SdrChatResponse(BaseModel):
    resposta: str
    persona: str
    aviso: str | None = None


@router.post("/sdr/chat", response_model=SdrChatResponse)
async def sdr_chat(
    body: SdrChatRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    _subject: CurrentSubject,
) -> SdrChatResponse:
    """Assistente de pré-compra: consulta catálogo (tools) e orienta; compra e suporte oficial ficam com o vendedor."""

    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Configure ANTHROPIC_API_KEY no servidor para usar o agente SDR.",
        )
    try:
        out = await run_sdr_chat(session, user_message=body.message, persona=body.persona)
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Falha no modelo: {e!s}") from e
    return SdrChatResponse(**out)
