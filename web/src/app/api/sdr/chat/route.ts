import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, randomUUID } from "node:crypto";

export const runtime = "nodejs";

/**
 * Proxy seguro para o agente SDR no FastAPI (JWT só no servidor).
 */
export async function POST(req: Request) {
  const base = process.env.INTERNAL_API_BASE_URL?.replace(/\/$/, "");
  const token = process.env.INTERNAL_API_JWT?.trim();
  const gatewaySecret = process.env.SDR_GATEWAY_SECRET?.trim();
  const identitySalt = process.env.SDR_IDENTITY_HASH_SALT?.trim();
  if (!base || !token || !gatewaySecret || !identitySalt) {
    return NextResponse.json(
      {
        detail: "A Sara está temporariamente indisponível. Tente novamente mais tarde.",
      },
      { status: 503 },
    );
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get("rs_sdr_session")?.value;
  const sessionId = existing && /^[a-f0-9-]{36}$/.test(existing) ? existing : randomUUID();
  const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHmac("sha256", identitySalt).update(forwardedIp).digest("hex");
  const identityPayload = `${sessionId}:${ipHash}`;
  const signature = createHmac("sha256", gatewaySecret).update(identityPayload).digest("hex");

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
        "X-Rocha-Sdr-Identity": `${identityPayload}.${signature}`,
      },
      body: JSON.stringify(body),
    });
    const text = await upstream.text();
    const response = new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
    if (!existing) response.cookies.set("rs_sdr_session", sessionId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return response;
  } catch {
    return NextResponse.json({ detail: "Serviço de atendimento temporariamente indisponível." }, { status: 502 });
  }
}
