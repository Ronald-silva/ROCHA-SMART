# Matriz de funcionalidades

Estados usados: **concluída**, **parcial**, **mock**, **não integrada**, **ausente**, **quebrada**, **não foi possível validar**.

| Área | Funcionalidade | Estado | Evidência | Arquivo | Risco | Pri. | Recomendação |
|---|---|---|---|---|---|---|---|
| Web | Home editorial | concluída | HTTP 200 desktop/mobile | `web/src/app/page.tsx` | Baixo | P2 | Reordenar por intenção |
| Web | Vitrine | parcial | Só 6 mais recentes | `page.tsx:27` | Médio | P1 | Categoria, status e paginação |
| Web | Página de produto | parcial | HTTP 200; ficha renderizada | `app/p/[id]/page.tsx` | Alto | P0 | Oferta e conteúdo confiáveis |
| Web | Galeria | concluída | Navegação e thumbs | `ProductImageGallery.tsx` | Médio | P2 | Otimização e a11y |
| Web | Busca/filtros | ausente | Sem rota/componente | — | Médio | P2 | Busca por necessidade/compatibilidade |
| Web | Comparador | ausente | Sem modelo/UI | — | Médio | P3 | Após normalizar atributos |
| Web | Alertas | ausente | Sem modelo/UI | — | Médio | P3 | Consentimento e histórico primeiro |
| Conteúdo | Prós/contras | ausente | Não modelado/renderizado | — | Alto | P1 | Obrigatório no template |
| Conteúdo | Fontes/autoria/revisão | ausente | Não modelado | — | Alto | P0 | Bloquear publicação sem evidência |
| Conteúdo | Protocolos na Lupa | parcial | Tabela fixa condicional | `ProtocolosNaLupaSection.tsx` | Médio | P1 | Tornar factual por produto |
| Afiliados | CTA externo client-side | concluída | Abre URL resolvida após delay | `product-bridge.ts`, `AffiliateCTA.tsx` | Alto | P0 | Redirecionador first-party allowlisted |
| Afiliados | Disclosure | concluída | CTA, footer, privacidade | `ProductBridgeView.tsx:152` | Médio | P1 | Distinguir patrocínio/parceria |
| Afiliados | Loja/seller | ausente | Um URL informal | `schema.prisma:14-26` | Alto | P0 | Merchant/Offer/Seller |
| Afiliados | Atribuição de receita | ausente | Sem postback/ledger | — | Alto | P0 | Click e commission ledger |
| Analytics | Page view | concluída | dataLayer/GA4/Meta | `analytics.ts:46-78` | Médio | P1 | Evitar possível duplicidade |
| Analytics | Begin checkout | concluída | Evento antes da saída | `analytics.ts:80-117` | Médio | P1 | Renomear/registrar partner_click |
| Analytics | Purchase | não integrada | Função sem chamadas | `analytics.ts:119-158` | Médio | P1 | Conversão do parceiro |
| Analytics | Funil editorial/Sara | ausente | Eventos não existem | — | Médio | P1 | Taxonomia versionada |
| Sara | Widget | parcial | Apenas página produto | `SaraWidget.tsx` | Médio | P1 | A11y, sessão e feedback |
| Sara | Consulta catálogo | concluída | Tools ID/SKU/lista | `api/app/agents/sdr.py:23-84` | Médio | P1 | Evidências estruturadas |
| Sara | Memória/contexto | ausente | Backend recebe só turno atual | `SaraWidget.tsx:27-33` | Alto | P1 | Sessão curta e consentida |
| Sara | Método consultivo | ausente | Sem fluxo diagnóstico | — | Alto | P1 | Método R.O.C.H.A. |
| Sara | RAG/fontes | ausente | Apenas Product JSON | — | Alto | P2 | Híbrido sobre conteúdo aprovado |
| Sara | Controle de custo | ausente | Sem quotas/telemetria | `sdr.py:101-107` | Crítico | P0 | Gateway, limites e kill switch |
| API | CRUD produtos | concluída | 5 rotas autenticadas | `routers/products.py` | Médio | P1 | RBAC e testes |
| API | Auth JWT | parcial | `sub`/`exp`, sem scopes | `security.py` | Alto | P1 | Roles/scopes/rotação |
| API | Feed catálogo | concluída | XML/JSON | `routers/catalog.py` | Médio | P2 | Paginar/stream e token em header |
| API | Webhooks | parcial | Segredo simples | `routers/webhooks.py` | Alto | P1 | HMAC, replay e idempotência |
| Fornecedor | Status/preview | parcial | Conectores genéricos | `services/suppliers` | Alto | P0 | Contratos reais e validação |
| Fornecedor | Sync persistente | parcial | Pode atualizar preço/estoque | `sync.py:40-56` | Crítico | P0 | Nunca persistir snapshot inválido |
| Worker | Processamento assíncrono | mock | Loop com `sleep(60)` | `api/agents/worker.py` | Médio | P2 | Fila/scheduler real |
| MCP | CRUD/analytics | parcial | Tools chamam API | `mcp-server/.../server.py` | Alto | P1 | Scopes, aprovação e audit log |
| MCP | Tendências | mock | SKUs fixos | `server.py:21-27` | Médio | P2 | Ingestão real |
| MCP | Google Ads | mock | Analisa JSON fornecido | `server.py:190-214` | Médio | P3 | Adapter read-only primeiro |
| Campanhas | Modelos | não integrada | Apenas Prisma | `schema.prisma:55-74` | Médio | P2 | Domínio e workflow |
| Campanhas | Execução | ausente | Sem adapters/orçamento | — | Alto | P3 | Após atribuição confiável |
| Admin | Painel editorial | ausente | Sem UI/auth humana | — | Alto | P1 | Draft/review/publish |
| Banco | Schema | parcial | Prisma válido | `schema.prisma` | Alto | P0 | Migrations versionadas |
| Banco | Migrations | ausente | Diretório inexistente | — | Crítico | P0 | Baseline e drift check |
| Segurança | Defaults prod | concluída | Validador no worktree | `api/app/config.py:66-76` | Médio | P1 | Testar no CI |
| Segurança | Rate limit | ausente | Nenhum middleware | — | Crítico | P0 | Auth, Sara e webhooks |
| Segurança | CSP/headers | ausente | `next.config.ts` sem headers | — | Alto | P1 | Política com nonce/hash |
| Privacidade | Política | parcial | Página existe, data antiga | `privacidade/page.tsx` | Alto | P0 | Atualizar e validar juridicamente |
| Privacidade | CMP/consentimento | ausente | Pixels carregam por env | `GlobalAnalytics.tsx` | Alto | P0 | Consent-first |
| SEO | Metadata | parcial | Global e produto | `layout.tsx`, produto | Médio | P1 | Corrigir title/canonical/OG |
| SEO | Sitemap/robots | concluída | HTTP 200 | `sitemap.ts`, `robots.ts` | Médio | P2 | Datas reais e falha observável |
| SEO | Dados estruturados | ausente | 0 scripts JSON-LD | — | Alto | P1 | Organization/Article/Breadcrumb |
| SEO | Arquitetura editorial | ausente | Só home/produto/legal | — | Alto | P2 | Hubs curados |
| Testes | Unitários | parcial | 5 testes passam | `api/tests/test_core.py` | Alto | P1 | Cobrir domínio e rotas |
| Testes | Integração/E2E | ausente | Nenhum versionado | — | Alto | P1 | API+DB e Playwright |
| Build | Produção | concluída | `npm run build` passou | `web/package.json` | Baixo | P1 | Executar em CI |
| Dependências | Auditoria npm | parcial | 5 alertas online | lockfile | Alto | P0 | Atualização controlada |
| Observabilidade | Health | parcial | Sempre retorna OK | `api/app/main.py:36-38` | Alto | P1 | Readiness de DB/IA |
| Observabilidade | Logs/métricas/tracing | ausente | Sem stack dedicada | — | Alto | P1 | OTel/Sentry e custos IA |
| Deploy | Vercel/Railway | não foi possível validar | Config existe; sem deploy | configs | Alto | P0 | Resolver root e smoke test |
| CI/CD | Pipeline | ausente | Sem `.github/workflows` | — | Alto | P1 | Checks e scans obrigatórios |
