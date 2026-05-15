import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Proxy seguro para o agente SDR no FastAPI (JWT só no servidor).
 */
export async function POST(req: Request) {
  const base = process.env.INTERNAL_API_BASE_URL?.replace(/\/$/, "");
  const token = process.env.INTERNAL_API_JWT?.trim();
  if (!base || !token) {
    return NextResponse.json(
      {
        detail:
          "SDR não configurado: defina INTERNAL_API_BASE_URL e INTERNAL_API_JWT no servidor Next (variáveis de ambiente).",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "JSON inválido" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${base}/agents/sdr/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (e) {
    return NextResponse.json({ detail: `Falha ao contatar API: ${String(e)}` }, { status: 502 });
  }
}
