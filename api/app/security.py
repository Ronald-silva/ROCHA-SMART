from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config import Settings, get_settings


def create_access_token(*, subject: str, settings: Settings | None = None) -> str:
    settings = settings or get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str, settings: Settings | None = None) -> str:
    settings = settings or get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        sub = payload.get("sub")
        if not isinstance(sub, str) or not sub:
            raise JWTError("invalid subject")
        return sub
    except JWTError as e:
        raise ValueError("invalid token") from e


def verify_client_credentials(client_id: str, client_secret: str, settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    expected = settings.auth_clients().get(client_id)
    if expected is None:
        return False
    import hmac

    return hmac.compare_digest(expected, client_secret)
