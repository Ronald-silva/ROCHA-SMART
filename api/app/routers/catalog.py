from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from xml.sax.saxutils import escape

from app.config import get_settings
from app.crud import products as product_crud
from app.database import get_session
from app.routers.deps_catalog import catalog_feed_access
from app.services.suppliers.sync import get_connector

router = APIRouter(dependencies=[Depends(catalog_feed_access)])


def _availability(stock: int) -> str:
    return "in stock" if stock > 0 else "out of stock"


@router.get("/feed.xml")
async def merchant_feed_xml(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    settings = get_settings()
    base = settings.catalog_site_url.rstrip("/")
    rows = await product_crud.list_products(session, skip=0, limit=5000)
    parts: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
        "<channel>",
        f"<title>{escape('Rocha Smart')}</title>",
        f"<link>{escape(base)}</link>",
        f"<description>{escape('Catálogo Rocha Smart — Google Merchant Center')}</description>",
    ]
    for p in rows:
        price = f"{p.price} BRL"
        link = f"{base}/p/{p.id}"
        image = p.imageUrl or f"{base}/og.png"
        brand = p.brand or "Rocha Smart"
        parts.append("<item>")
        parts.append(f"<g:id>{escape(p.id)}</g:id>")
        parts.append(f"<g:title>{escape(p.name)}</g:title>")
        parts.append(f"<g:description>{escape(p.description or '')}</g:description>")
        parts.append(f"<g:link>{escape(link)}</g:link>")
        parts.append(f"<g:image_link>{escape(image)}</g:image_link>")
        parts.append(f"<g:availability>{_availability(p.stockQuantity)}</g:availability>")
        parts.append(f"<g:price>{escape(price)}</g:price>")
        parts.append(f"<g:brand>{escape(brand)}</g:brand>")
        if p.sku:
            parts.append(f"<g:mpn>{escape(p.sku)}</g:mpn>")
            parts.append(f"<g:identifier_exists>yes</g:identifier_exists>")
        parts.append("</item>")
    parts.extend(["</channel>", "</rss>"])
    return Response(content="\n".join(parts), media_type="application/xml; charset=utf-8")


@router.get("/feed.json")
async def meta_catalog_feed_json(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """Lista de itens compatível com importação em catálogos dinâmicos (ex.: Meta)."""

    settings = get_settings()
    base = settings.catalog_site_url.rstrip("/")
    rows = await product_crud.list_products(session, skip=0, limit=5000)
    products = []
    for p in rows:
        products.append(
            {
                "id": p.id,
                "title": p.name,
                "description": p.description or "",
                "availability": _availability(p.stockQuantity),
                "price": f"{p.price} BRL",
                "link": f"{base}/p/{p.id}",
                "image_link": p.imageUrl or f"{base}/og.png",
                "brand": p.brand or "Rocha Smart",
                "item_group_id": p.sku or p.id,
            }
        )
    return {"channel": "Rocha Smart", "site_url": base, "products": products}
