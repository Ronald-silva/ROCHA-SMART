# Contexto do projeto — Rocha Smart

Use este arquivo no início de sessões (Cursor, VS Code, outra IDE ou outro modelo) para alinhar **negócio**, **stack** e **pendências**. O detalhe operacional continua no [`README.md`](README.md) e em [`web/.env.example`](web/.env.example).

---

## 1. O que é a Rocha Smart

- **Magazine digital de tech & casa inteligente**: vitrine de produtos, ficha/review na prática, tom editorial (“capa”, “matéria”, “vitrine”).
- **Modelo de receita**: afiliado / ponte — **não** há carrinho próprio; o visitante **fecha compra no site oficial** do fabricante ou loja autorizada.
- **O que não somos** (deixar claro em copy): **não** fazemos projeto, instalação nem automação residencial **como serviço**. Evitar linguagem que pareça integradora de obra.
- **Idioma**: português **brasileiro** (pt-BR).

---

## 2. Monorepo (o que é cada pasta)

| Pasta | Função |
|--------|--------|
| `web/` | Next.js (App Router): home, `/p/[id]`, Prisma + Neon, analytics (Meta / GA4 / Ads), proxy `POST /api/sdr/chat` → FastAPI |
| `api/` | FastAPI: auth JWT, CRUD `/api/products`, agente SDR `POST /agents/sdr/chat`, webhooks, catálogo, etc. — **mesmo Postgres** que o Prisma |
| `mcp-server/` | MCP Python (`python3 -m rocha_smart_mcp`, cwd `mcp-server`) para operar API / criar produtos via agente |
| `mcp.json` | Exemplo de configuração MCP (ajustar env) |

Scripts na **raiz**: `npm run dev|build|start|lint` delegam para `web/`.

---

## 3. Decisões de produto e copy já consolidadas

- Posicionamento **magazine tech** (hero, rodapé, FAQ “Tira-dúvidas”, vitrine, etc.).
- **Sara (SDR)**: prompt em `api/app/agents/sdr.py` — **pré-compra** com dados do catálogo (tools); **não** prometer atendimento humano nem agendamento com **funcionários de terceiros**; compra/garantia/pós no **vendedor oficial**.
- **Disclosure de afiliado**: perto do CTA na ficha + coluna “Parcerias” no rodapé.
- **Header**: desktop links horizontais; mobile **menu hamburger** com drawer e ícone SVG (X centralizado).

---

## 4. Domínio e DNS (produção)

- **Domínio oficial**: `https://rochasmart.com.br` (constante em `web/src/lib/site-url.ts`; fallback em produção se `NEXT_PUBLIC_SITE_URL` estiver vazio).
- **Cloudflare** (grátis): NS no Registro.br → proxy laranja → Vercel.
- **Vercel** (monorepo): **Root Directory = `web`** (obrigatório no painel). Não usar `vercel.json` na raiz — quebra detecção do Next.js. Domains → `rochasmart.com.br`.
- **Railway** (API): subdomínio opcional `api.rochasmart.com.br` → `INTERNAL_API_BASE_URL` no Vercel.
- **SEO no código**: `app/robots.ts`, `app/sitemap.ts` (home + `/p/[id]` do Prisma); `metadataBase` no `layout.tsx`.
- **Pixels first-party**: GA4 com `cookie_domain` `.rochasmart.com.br` quando URL não é localhost; Meta — validar domínio no Events Manager.

## 5. Variáveis e integrações (check rápido)

Referência completa: `web/.env.example`.

- **Obrigatório para site + catálogo**: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL` (produção: `https://rochasmart.com.br`)
- **Afiliado / CTA**: por produto em `ai_metadata` (ex. `affiliate.checkout_url`) ou `NEXT_PUBLIC_DEFAULT_AFFILIATE_URL` / `NEXT_PUBLIC_AFFILIATE_LINK_TEMPLATE`
- **Mídia**: `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID` (opcionais até ligar ads)
- **Sara**: `INTERNAL_API_BASE_URL`, `INTERNAL_API_JWT` no Next; na API `ANTHROPIC_API_KEY` + JWT válido

Neon: URL do **pooler** com `pgbouncer=true` recomendado. Erros `connection Closed` no dev são comuns com idle — `web/src/lib/db.ts` tem **retry** em queries.

---

## 6. O que já está implementado (alto nível)

- Landing + ficha produto `/p/[id]` + CTA `InitiateCheckout` / dataLayer / click ids (`fbclid`, `gclid`).
- Prisma: `Product` + `ai_metadata`; modelos `Campaign` / `CampaignProduct` existem no **schema**, **sem UI** ainda.
- FastAPI: produtos, SDR, webhooks, etc. (ver README tabela de rotas).
- MCP: listar/criar produto via API, entre outras ferramentas.

---

## 7. O que falta para “funcionar e fazer dinheiro” (prioridade)

1. **Produção**: deploy `web/` + domínio HTTPS; Neon com schema aplicado; `NEXT_PUBLIC_SITE_URL` correto.
2. **Catálogo real**: produtos com foto, texto, specs (`smart_home` / `ai_metadata`), **SKU** e **URL de checkout** do parceiro.
3. **Programas de afiliado** aprovados + teste de clique até o parceiro (UTM/subid se exigido).
4. **Pixels** configurados e testados em produção.
5. **API + Sara** em produção se quiser widget ativo (JWT + CORS).
6. **Legal**: política de privacidade (link hoje “em breve”); cookies/LGPD conforme orientação jurídica.
7. **Purchase / ROI**: planejar atribuição além de `InitiateCheckout` (postback, offline conversion, etc.) — não vem automático só pela ponte.

Detalhamento: ver conversa / checklist que o time já alinhou; pode duplicar bullets no README se fizer sentido.

---

## 8. Próximos passos técnicos sugeridos (backlog)

- UI ou rotas para **campanhas** usando `Campaign` / `CampaignProduct`.
- Campo explícito na API para `affiliate.checkout_url` (hoje pode precisar edição manual de JSON).
- Páginas legais estáticas (`/privacidade`, etc.).
- Testes E2E críticos (CTA + redirect, home com produtos).

---

## 9. Comandos úteis

```bash
# Dev (raiz)
npm run dev

# Banco (dentro de web/)
cd web && npx prisma db push && npm run dev
```

---

*Última intenção documentada: operar como **magazine tech + afiliado**, stack estável, próximo foco em **go-live**, **catálogo com link de parceiro** e **medição de mídia**.*
