from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.schemas.auth import TokenRequest, TokenResponse
from app.security import create_access_token, verify_client_credentials

router = APIRouter()


@router.post("/token", response_model=TokenResponse)
async def login(req: TokenRequest) -> TokenResponse:
    if not verify_client_credentials(req.client_id, req.client_secret):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    settings = get_settings()
    token = create_access_token(subject=req.client_id, settings=settings)
    return TokenResponse(
        access_token=token,
        expires_in=settings.access_token_expire_minutes * 60,
    )
