from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings
from app.security import decode_token

_optional_bearer = HTTPBearer(auto_error=False)


async def catalog_feed_access(
    token: Annotated[str | None, Query(alias="token")] = None,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_optional_bearer)] = None,
) -> None:
    """Permite JWT (agentes/frontend) ou `?token=` quando `CATALOG_FEED_TOKEN` está definido."""

    s = get_settings()
    bearer_ok = False
    if creds is not None and creds.scheme.lower() == "bearer":
        try:
            decode_token(creds.credentials)
            bearer_ok = True
        except ValueError:
            bearer_ok = False
    if bearer_ok:
        return
    if s.catalog_feed_token and token == s.catalog_feed_token:
        return
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autorizado para o feed de catálogo")
