from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import dispose_engine
from app.routers import ai, auth, catalog, integrations, products, sdr, webhooks


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await dispose_engine()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Rocha Smart API", version="0.2.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list(),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/auth")
    app.include_router(products.router, prefix="/api/products")
    app.include_router(integrations.router)
    app.include_router(webhooks.router, prefix="/webhooks")
    app.include_router(catalog.router, prefix="/catalog")
    app.include_router(ai.router)
    app.include_router(sdr.router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "rocha-smart-api"}

    return app


app = create_app()
