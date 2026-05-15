# Rocha Smart

**Rocha Smart** é um **magazine digital de tech & casa inteligente** — pauta de produtos, ficha com compatibilidade e link para o checkout oficial. É **conteúdo e curadoria**, não projeto nem instalação; **compra e pós-venda** ficam com fabricante ou loja. Stack: vitrine **Next.js**, catálogo/API **FastAPI**, **Sara** (pré-compra) e integrações de mídia.

**Contexto para novas sessões (qualquer IDE):** [`CONTEXTO.md`](CONTEXTO.md).

## Estrutura do monorepo

| Pasta | Descrição |
|--------|-----------|
| `web/` | App **Next.js** (App Router): home, `/p/[id]`, Prisma + PostgreSQL (Neon), analytics (Meta / GA4 / Google Ads), proxy `api/sdr/chat` → FastAPI |
| `api/` | **FastAPI** (v0.2): JWT em `/auth`, CRUD em `/api/products`, criação assistida em `POST /products/create`, analytics em `GET /analytics/sales`, feed em `/catalog/feed.xml`, webhooks em `/webhooks`, integrações, agente SDR em `POST /agents/sdr/chat` — mesmo Postgres que o Prisma (`Product`, etc.). Worker opcional no `Procfile` |
| `mcp-server/` | Servidor **MCP** Python (`rocha_smart_mcp`) para uso no Cursor / agentes |
| `mcp.json` | Exemplo de configuração MCP na raiz (ajuste `env` e caminhos) |

## Pré-requisitos

- Node.js 20+ (recomendado)
- npm
- Python 3.12+ (para `api/` e `mcp-server/`)
- Conta [Neon](https://neon.tech) (ou outro Postgres compatível com Prisma)

## Primeiro run (do zero)

```bash
cp web/.env.example web/.env
# edite web/.env (Neon, NEXT_PUBLIC_SITE_URL, pixels opcionais, API interna se usar Sara)
cd web && npm install && npx prisma db push && cd ..
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Detalhes das variáveis: `web/.env.example`.

### Deploy na Vercel (obrigatório)

No painel: **Project → Settings → General → Root Directory** = `web`  
(Sem isso a Vercel procura `next` na raiz do monorepo e o build falha.)

| Campo | Valor |
|--------|--------|
| Root Directory | `web` |
| Framework | Next.js (detectado automaticamente) |
| Build / Output | padrão (`npm run build` → `.next`) |

**Environment Variables** (Production): copie de `web/.env.example` — `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL=https://rochasmart.com.br`, pixels, etc.

O app usa **Prisma 6** (já em `dependencies` do `web/package.json`).

### Scripts na raiz

| Comando | Efeito |
|---------|--------|
| `npm run dev` | `next dev` em `web/` |
| `npm run build` | build de produção em `web/` |
| `npm run start` | `next start` em `web/` |
| `npm run lint` | ESLint em `web/` |

### Banco de dados (Prisma)

- Schema: `web/prisma/schema.prisma`
- Comandos úteis (sempre dentro de `web/`): `npm run db:push`, `npm run db:studio`, `npm run db:migrate`
- O site (`web/`) e a API (`api/`) usam as **mesmas tabelas** no Neon (ex.: `Product`) — dá para cadastrar pelo Prisma ou pela API/MCP.
- **Campanhas**: existem modelos `Campaign` / `CampaignProduct` no schema para evolução futura; a home hoje lista os últimos produtos, **sem** filtro por campanha na UI.

## API interna (`api/`)

Usada pelo Next (por exemplo, rota `web/src/app/api/sdr/chat`) quando `INTERNAL_API_BASE_URL` e `INTERNAL_API_JWT` estão definidos em `web/.env`.

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Configure api/.env (ex.: mesma DATABASE_URL do Neon, se aplicável)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Deploy exemplo: **Railway** (`api/Procfile`, `api/railway.json`).

## MCP (`mcp-server/`)

1. `cd mcp-server && python3 -m venv .venv && source .venv/bin/activate`
2. `pip install -r requirements.txt`
3. Ajuste `mcp.json` na raiz (`ROCHA_SMART_API_BASE_URL`, `ROCHA_SMART_JWT`, etc.) ou variáveis do seu cliente MCP.
4. O servidor sobe como `python3 -m rocha_smart_mcp` com **cwd** em `mcp-server` (como no exemplo do `mcp.json`).

## Rotas principais (web)

- `/` — vitrine e conteúdo institucional
- `/p/[id]` — ficha do produto e CTA para o site oficial
- `POST /api/sdr/chat` — proxy server-side para o backend (não expor o JWT no browser)

## Variáveis de ambiente

Referência completa: **`web/.env.example`** (Neon, pixels, GA4, Google Ads, URLs de afiliado, API interna).

## Observações

- **Build**: `next/font` pode precisar acessar o Google Fonts durante `npm run build`; ambientes sem rede podem falhar nessa etapa.
- **Watchers (ENOSPC)**: em alguns discos/configurações, aumentar `fs.inotify` no Linux ajuda se o dev server reclamar de limite de arquivos observados.
- **Neon + dev**: no plano gratuito o banco pode **suspender após idle**; o Prisma às vezes loga `connection: Closed` ao reaproveitar socket morto. O cliente em `web/src/lib/db.ts` **repete a query** algumas vezes nesses casos; use `DATABASE_URL` com **pooler** e `pgbouncer=true` (ver `web/.env.example`). Se persistir, confira o projeto no painel Neon ou reinicie `npm run dev`.

Resumo do pacote front: [`web/README.md`](web/README.md).
