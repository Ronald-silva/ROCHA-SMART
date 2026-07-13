const base = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const product = process.env.SMOKE_PRODUCT_ID;
const invalidProduct = process.env.SMOKE_INVALID_PRODUCT_ID;
const paths = ["/", "/robots.txt", "/sitemap.xml", ...(product ? [`/p/${product}`] : []), ...(invalidProduct ? [`/p/${invalidProduct}`] : [])];
for (const path of paths) {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  if (response.status < 200 || response.status >= 400) throw new Error(`${path}: HTTP ${response.status}`);
  console.log(`ok ${path} ${response.status}`);
}

const sara = await fetch(`${base}/api/sdr/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "smoke", persona: "sara" }) });
if (sara.status !== 503) throw new Error(`Sara desativada: esperado 503, recebido ${sara.status}`);
console.log("ok Sara bloqueada 503");

const api = process.env.SMOKE_API_BASE_URL?.replace(/\/$/, "");
if (api) {
  for (const path of ["/health", "/health/ready"]) {
    const response = await fetch(`${api}${path}`); if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    console.log(`ok API ${path} ${response.status}`);
  }
  const auth = await fetch(`${api}/auth/token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: process.env.SMOKE_API_CLIENT_ID, client_secret: process.env.SMOKE_API_CLIENT_SECRET }) });
  if (!auth.ok) throw new Error(`auth smoke: HTTP ${auth.status}`);
  const { access_token: token } = await auth.json();
  const sync = await fetch(`${api}/api/suppliers/sync/aliexpress`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ skus: ["SMOKE-NO-REMOTE"] }) });
  if (!sync.ok) throw new Error(`sync dry-run: HTTP ${sync.status}`);
  const payload = await sync.json(); if (payload.mode !== "dry-run" || payload.changed !== 0) throw new Error("sync smoke não ficou em dry-run seguro");
  console.log("ok API supplier dry-run sem chamada externa");
}
