from __future__ import annotations

import json
import os
from typing import Any

import httpx
from anthropic import AsyncAnthropic
from mcp.server.fastmcp import FastMCP

from rocha_smart_mcp import backend

mcp = FastMCP(
    "Rocha Smart",
    instructions=(
        "Servidor MCP da Rocha Smart: opera o backend (JWT), pesquisa tendências em fornecedores, "
        "gera copy com Claude e apoia análise de Ads. Responda sempre em português do Brasil."
    ),
)

# SKUs de exemplo para preview de fornecedor (substitua por SKUs reais do seu catálogo/logística).
_TENDENCIAS_SKUS: dict[str, list[str]] = {
    "casa inteligente": ["SMART-HUB-01", "SMART-SENSOR-01", "SMART-BULB-RGB-01"],
    "interruptor": ["SMART-SW-1G-01", "SMART-SW-2G-01"],
    "sensor": ["SMART-PIR-01", "SMART-DOOR-01"],
    "iluminacao": ["SMART-BULB-RGB-01", "SMART-LED-STRIP-01"],
}


@mcp.tool()
async def listar_produtos_via_api(limite: int = 20) -> str:
    """Lista produtos do catálogo via API Rocha Smart (Bearer ROCHA_SMART_JWT)."""
    try:
        data = await backend.api_get("/api/products", params={"limit": min(max(limite, 1), 50)})
        return backend.dumps(data)
    except Exception as e:
        return backend.api_error_message(e)


@mcp.tool()
async def obter_produto_por_id(product_id: str) -> str:
    """Obtém um produto pelo ID (cuid) incluindo ai_metadata."""
    try:
        data = await backend.api_get(f"/api/products/{product_id.strip()}")
        return backend.dumps(data)
    except Exception as e:
        return backend.api_error_message(e)


@mcp.tool()
async def criar_produto_via_api(
    nome: str,
    preco: float,
    sku: str | None = None,
    descricao: str | None = None,
    voltagem: str | None = None,
    conectividade: str = "",
    protocolos: str = "",
    url_afiliado: str | None = None,
) -> str:
    """Cria produto completo. conectividade/protocolos: listas separadas por vírgula."""
    conn = [x.strip() for x in conectividade.split(",") if x.strip()]
    prot = [x.strip() for x in protocolos.split(",") if x.strip()]
    body: dict[str, Any] = {
        "name": nome.strip(),
        "price": preco,
        "sku": sku.strip() if sku else None,
        "description": descricao.strip() if descricao else None,
        "affiliate_url": url_afiliado.strip() if url_afiliado else None,
        "stock_quantity": 0,
        "smart_specs": {
            "voltage": voltagem.strip() if voltagem else None,
            "connectivity": conn,
            "protocols": prot,
            "extra": {},
        },
    }
    try:
        data = await backend.api_post("/api/products", body)
        return backend.dumps(data)
    except Exception as e:
        return backend.api_error_message(e)


@mcp.tool()
async def analytics_vendas_via_api() -> str:
    """Resumo de vendas (GET /analytics/sales no backend)."""
    try:
        data = await backend.api_get("/analytics/sales")
        return backend.dumps(data)
    except Exception as e:
        return backend.api_error_message(e)


@mcp.tool()
async def pesquisar_tendencias(
    categoria: str = "casa inteligente",
    provedor: str = "zendrop",
) -> str:
    """
    Busca produtos com alto potencial em Casa Inteligente via preview de sincronização do fornecedor.
    provedor: zendrop | aliexpress
    """
    key = categoria.strip().lower()
    skus = _TENDENCIAS_SKUS.get(key) or _TENDENCIAS_SKUS["casa inteligente"]
    prov = provedor.strip().lower()
    if prov not in ("zendrop", "aliexpress"):
        return "provedor deve ser zendrop ou aliexpress"
    try:
        data = await backend.api_post(f"/api/suppliers/sync/{prov}", {"skus": skus})
        return backend.dumps({"categoria_solicitada": categoria, "skus_usados": skus, "resultado": data})
    except Exception as e:
        return backend.api_error_message(e)


@mcp.tool()
async def gerar_descricao_otimizada(product_id: str) -> str:
    """
    Gera copy de vendas em PT-BR com foco em SEO a partir dos metadados técnicos (ai_metadata).
    Requer ANTHROPIC_API_KEY no ambiente do servidor MCP.
    """
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        return (
            "Defina ANTHROPIC_API_KEY no ambiente do MCP para gerar descrição. "
            "Sem isso, apenas consulte o produto com obter_produto_por_id e redija manualmente."
        )
    try:
        prod = await backend.api_get(f"/api/products/{product_id.strip()}")
    except Exception as e:
        return backend.api_error_message(e)

    client = AsyncAnthropic(api_key=key)
    prompt = (
        "Você é copywriter de e-commerce em português do Brasil.\n"
        "Gere: (1) título curto SEO, (2) descrição com bullets, (3) 8 keywords.\n"
        "Use só fatos compatíveis com o JSON do produto; não invente certificações.\n\n"
        f"PRODUTO_JSON:\n{json.dumps(prod, ensure_ascii=False, default=str)}"
    )
    try:
        msg = await client.messages.create(
            model=os.environ.get("MCP_COPY_MODEL", "claude-3-5-haiku-latest"),
            max_tokens=1200,
            messages=[{"role": "user", "content": prompt}],
        )
        parts = [b.text for b in msg.content if getattr(b, "type", None) == "text"]
        return "\n".join(parts).strip()
    except Exception as e:
        return f"Erro Anthropic: {e!s}"


@mcp.tool()
async def meta_ads_consultar_roas_cpc(
    periodo_dias: int = 7,
) -> str:
    """
    Consulta métricas de campanha (spend, impressions, clicks, CPC; ROAS quando disponível) via Marketing API.
    Requer META_ACCESS_TOKEN e META_AD_ACCOUNT_ID (formato act_XXXX) no ambiente.
    Para o ecossistema completo da Meta, adicione também o MCP oficial da Meta no cliente (mcp.facebook.com/ads).
    """
    token = os.environ.get("META_ACCESS_TOKEN", "").strip()
    acct = os.environ.get("META_AD_ACCOUNT_ID", "").strip()
    if not token or not acct:
        return (
            "Sem META_ACCESS_TOKEN / META_AD_ACCOUNT_ID configurados.\n"
            "No Cursor, adicione o servidor remoto oficial: https://mcp.facebook.com/ads (Meta Ads MCP) "
            "para consultar ROAS/CPC com a conta autenticada da Meta.\n"
            "Opcionalmente configure as variáveis acima neste processo MCP para chamadas diretas à Graph API."
        )
    if not acct.startswith("act_"):
        acct = f"act_{acct.replace('act_', '')}"
    url = f"https://graph.facebook.com/v21.0/{acct}/insights"
    dias = min(max(periodo_dias, 1), 90)
    preset = "last_7d" if dias <= 7 else "last_14d" if dias <= 14 else "last_30d" if dias <= 30 else "last_90d"
    params = {
        "access_token": token,
        "date_preset": preset,
        "level": "account",
        "fields": "spend,impressions,clicks,cpc,ctr,actions",
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            return backend.dumps(r.json())
    except Exception as e:
        return backend.api_error_message(e)


@mcp.tool()
async def google_ads_sugerir_ajustes_lances(relatorio_desempenho_json: str) -> str:
    """
    Sugere ajustes de lances com base em performance (JSON livre: campanhas, CPA, CTR, conversões).
    Usa Claude (ANTHROPIC_API_KEY) para raciocínio; não chama a Google Ads API diretamente.
    """
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        return "Defina ANTHROPIC_API_KEY para gerar sugestões de lances com Claude."
    client = AsyncAnthropic(api_key=key)
    prompt = (
        "Você é especialista em Google Ads (pt-BR). Analise o JSON de desempenho e sugira ajustes de lances "
        "(max CPC / estratégia / pausas) de forma conservadora e acionável. Use bullets.\n\n"
        f"DADOS:\n{relatorio_desempenho_json[:12000]}"
    )
    try:
        msg = await client.messages.create(
            model=os.environ.get("MCP_ADS_MODEL", "claude-3-5-haiku-latest"),
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        parts = [b.text for b in msg.content if getattr(b, "type", None) == "text"]
        return "\n".join(parts).strip()
    except Exception as e:
        return f"Erro Anthropic: {e!s}"
