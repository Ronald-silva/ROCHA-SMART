from __future__ import annotations

import json
from typing import Any

from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.crud import products as product_crud
from app.schemas.product import product_to_read

SDR_SYSTEM = """Você é a assistente virtual da Rocha Smart (curadoria em casa inteligente), em português do Brasil.
Seu papel é ajudar em **pré-compra** com base **somente** nos dados do **nosso catálogo** (nome, descrição, ai_metadata, preço e estoque exibidos aqui): compatibilidade, protocolos, voltagem, uso típico etc.
Use **sempre** as ferramentas para consultar o produto antes de afirmar especificações — não invente ficha técnica.
Informe estoque quando a consulta por SKU/ID trouxer esse dado; lembre que o fechamento da compra é no **site do vendedor oficial** (preço final, cupom e parcelamento podem divergir).
Para **garantia, troca, nota fiscal, entrega, rastreio ou suporte após a compra**, deixe explícito que isso é **exclusivamente** com o **fabricante ou loja oficial** onde o cliente compra — a Rocha Smart **não** controla nem agenda funcionários ou atendimento dessas empresas.
Não prometa “atendimento humano”, retorno de ligação ou escalação para pessoas de terceiros. Se o cliente precisar de suporte oficial, oriente a canal próprio do vendedor (site/app/SAC indicado por eles).
Para concluir a compra, reforce o **link/botão para o site oficial** na página da Rocha Smart.
Seja objetiva, cordial e curta. Se faltar dado no catálogo, diga o que falta (ex.: SKU) e sugira confirmar no site do vendedor oficial para a informação definitiva."""


def _tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "listar_produtos",
            "description": "Lista produtos do catálogo (paginação). Use para sugerir opções ou achar SKU.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "limite": {"type": "integer", "description": "Máximo de itens (1-50)", "default": 15},
                },
            },
        },
        {
            "name": "consultar_produto_por_sku",
            "description": "Busca um produto pelo SKU e devolve preço, estoque e metadados técnicos (ai_metadata).",
            "input_schema": {
                "type": "object",
                "properties": {"sku": {"type": "string"}},
                "required": ["sku"],
            },
        },
        {
            "name": "consultar_produto_por_id",
            "description": "Busca produto pelo ID interno (cuid).",
            "input_schema": {
                "type": "object",
                "properties": {"product_id": {"type": "string"}},
                "required": ["product_id"],
            },
        },
    ]


async def _tool_listar_produtos(session: AsyncSession, limite: int) -> str:
    limite = max(1, min(50, int(limite or 15)))
    rows = await product_crud.list_products(session, skip=0, limit=limite)
    data = [product_to_read(p).model_dump(mode="json") for p in rows]
    return json.dumps(data, ensure_ascii=False)


async def _tool_sku(session: AsyncSession, sku: str) -> str:
    row = await product_crud.get_product_by_sku(session, sku.strip())
    if row is None:
        return json.dumps({"erro": "SKU não encontrado", "sku": sku}, ensure_ascii=False)
    return json.dumps(product_to_read(row).model_dump(mode="json"), ensure_ascii=False)


async def _tool_id(session: AsyncSession, product_id: str) -> str:
    row = await product_crud.get_product(session, product_id.strip())
    if row is None:
        return json.dumps({"erro": "Produto não encontrado", "id": product_id}, ensure_ascii=False)
    return json.dumps(product_to_read(row).model_dump(mode="json"), ensure_ascii=False)


async def _dispatch_tool(session: AsyncSession, name: str, inp: dict[str, Any]) -> str:
    if name == "listar_produtos":
        return await _tool_listar_produtos(session, int(inp.get("limite") or 15))
    if name == "consultar_produto_por_sku":
        return await _tool_sku(session, str(inp.get("sku") or ""))
    if name == "consultar_produto_por_id":
        return await _tool_id(session, str(inp.get("product_id") or ""))
    return json.dumps({"erro": f"Tool desconhecida: {name}"}, ensure_ascii=False)


async def run_sdr_chat(
    session: AsyncSession,
    *,
    user_message: str,
    persona: str = "sara",
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY não configurada no backend")

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    nome = "Sara" if persona.lower() == "sara" else "Camila" if persona.lower() == "camila" else persona
    system = SDR_SYSTEM + f"\nSeu nome de atendimento: {nome}."

    messages: list[dict[str, Any]] = [{"role": "user", "content": user_message}]
    max_loops = settings.sdr_max_tool_cycles + 1

    for _ in range(max_loops):
        msg = await client.messages.create(
            model=settings.sdr_model,
            max_tokens=settings.sdr_max_output_tokens,
            system=system,
            tools=_tools(),
            messages=messages,
        )

        if msg.stop_reason == "end_turn":
            text_parts: list[str] = []
            for b in msg.content:
                if b.type == "text":
                    text_parts.append(b.text)
            return {"resposta": "\n".join(text_parts).strip(), "persona": nome}

        if msg.stop_reason != "tool_use":
            text_parts = []
            for b in msg.content:
                if b.type == "text":
                    text_parts.append(b.text)
            return {
                "resposta": "\n".join(text_parts).strip(),
                "persona": nome,
                "aviso": f"stop_reason={msg.stop_reason}",
            }

        assistant_content: list[dict[str, Any]] = []
        tool_results: list[dict[str, Any]] = []
        for block in msg.content:
            if block.type == "text":
                assistant_content.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                assistant_content.append(
                    {"type": "tool_use", "id": block.id, "name": block.name, "input": block.input}
                )
                out = await _dispatch_tool(session, block.name, block.input)
                tool_results.append({"type": "tool_result", "tool_use_id": block.id, "content": out})

        if not tool_results:
            text_parts = [b.text for b in msg.content if b.type == "text"]
            return {
                "resposta": "\n".join(text_parts).strip() or "(sem resposta textual)",
                "persona": nome,
                "aviso": "stop_reason=tool_use sem blocos tool_use",
            }

        messages.append({"role": "assistant", "content": assistant_content})
        messages.append({"role": "user", "content": tool_results})

    return {"resposta": "Limite de passos do agente atingido; tente simplificar a pergunta.", "persona": nome}
