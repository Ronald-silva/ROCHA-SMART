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

### Deploy na Vercel

**Passo 1 — obrigatório no painel**

**Settings → General → Root Directory** → digite exatamente: `web` → **Save**

Sem isso o log mostra `npm run build --prefix web` na raiz, **sem** instalar dependências em `web/` → erro `prisma: command not found`.

**Passo 2 — após mudar o Root Directory**

| Campo | Valor |
|--------|--------|
| Root Directory | `web` |
| Framework | Next.js (automático) |
| Build / Output | padrão (usa `web/package.json`) |

Faça **Redeploy** (e, se quiser, **Clear build cache** na primeira vez).

**Passo 3 — variáveis de ambiente** (Production)

Copie de `web/.env.example`: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL=https://rochasmart.com.br`, pixels, `INTERNAL_*` se usar Sara.

Existe uma única configuração: defina obrigatoriamente o **Root Directory como `web`**. A Vercel então usa `web/vercel.json`; não há fallback na raiz.

### Scripts na raiz

| Comando | Efeito |
|---------|--------|
| `npm run dev` | `next dev` em `web/` |
| `npm run build` | build de produção em `web/` |
| `npm run start` | `next start` em `web/` |
| `npm run lint` | ESLint em `web/` |
| `npm run typecheck` | Verificação TypeScript sem gerar arquivos |
| `npm test` | Lint + TypeScript + testes unitários da API |

### Banco de dados (Prisma)

- Schema: `web/prisma/schema.prisma`
- Comandos úteis (sempre dentro de `web/`): `npm run db:push`, `npm run db:studio`, `npm run db:migrate`
- O site (`web/`) e a API (`api/`) usam as **mesmas tabelas** no Neon (ex.: `Product`) — dá para cadastrar pelo Prisma ou pela API/MCP.
- **Campanhas**: existem modelos `Campaign` / `CampaignProduct` no schema para evolução futura; a home hoje lista os últimos produtos, **sem** filtro por campanha na UI.

### Fundação em PostgreSQL descartável

Os comandos abaixo usam exclusivamente o container `rocha-smart-pg-test`, imagem `postgres:16-alpine`, porta local `127.0.0.1:55432`, credenciais fictícias e nenhum volume. Docker precisa estar disponível.

| Comando | Finalidade |
|---|---|
| `npm run db:test:up` | Inicia/reutiliza o PostgreSQL isolado |
| `npm run db:test:down` | Para e remove o container (`--rm`) |
| `npm run db:test:reset` | Recria o ambiente do zero |
| `npm run db:migrate:test` | Aplica migrations e confere status |
| `npm run db:drift:test` | Compara migrations, Prisma e banco descartável |
| `npm run test:integration` | Valida banco vazio, legado, Prisma/SQLAlchemy, sync e quota |
| `npm run test:e2e` | Executa build, Playwright e smoke isolados |
| `npm run verify:foundation` | Executa toda a fundação em sequência e falha no primeiro erro |

Finalize com `npm run db:test:down`. Esses scripts nunca leem `web/.env` para escolher o banco: constroem uma URL exclusiva apontando para a porta de teste.

Para preparar um executor novo para o E2E: `python3 -m pip install -r web/e2e/requirements.txt` e `python3 -m playwright install chromium`. O teste sempre usa Chromium headless.

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

- **Build offline**: a tipografia usa pilhas locais do sistema; o build não depende do Google Fonts.
- **API em produção**: defina `APP_ENV=production`, um `JWT_SECRET_KEY` com pelo menos 32 caracteres, credenciais próprias em `AUTH_CLIENTS_JSON` e origens explícitas em `CORS_ORIGINS`. A API recusa defaults de desenvolvimento nesse ambiente.
- **Watchers (ENOSPC)**: em alguns discos/configurações, aumentar `fs.inotify` no Linux ajuda se o dev server reclamar de limite de arquivos observados.
- **Neon + dev**: no plano gratuito o banco pode **suspender após idle**; o Prisma às vezes loga `connection: Closed` ao reaproveitar socket morto. O cliente em `web/src/lib/db.ts` **repete a query** algumas vezes nesses casos; use `DATABASE_URL` com **pooler** e `pgbouncer=true` (ver `web/.env.example`). Se persistir, confira o projeto no painel Neon ou reinicie `npm run dev`.

Resumo do pacote front: [`web/README.md`](web/README.md).
