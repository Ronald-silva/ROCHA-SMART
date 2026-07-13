# Backlog priorizado

Escala: **P0** bloqueia lançamento/segurança/funcionamento; **P1** necessário para MVP confiável; **P2** melhora conversão/automação/escala; **P3** evolução futura.

## Status da implementação — Fase 0, bloco 1 (2026-07-13)

| ID | Status | Evidência / pendência |
|---|---|---|
| RS-001 | parcial | Baseline e migration aditiva criados; validação estática/paridade verde. Falta PostgreSQL vazio e drift de homologação. |
| RS-002 | parcial | Modelos e allowlist integrados ao CTA; falta CRUD administrativo de ofertas. |
| RS-003 | parcial | Fonte, validade, snapshot, seller e estados públicos integrados; reverificação automática não iniciada. |
| RS-005 | parcial | Guardrails server-side e testes unitários; store de quota ainda é local ao processo. |
| RS-006 | concluído | Dry-run padrão, transação, validação, limites, rollback e idempotência cobertos no contrato atual. |
| RS-009 | parcial | Config única e smoke criado; preview/deploy e smoke remoto não executados. |
| RS-030 | concluído | Estados públicos revisados nas superfícies existentes e logging interno preservado. |
| Demais itens | não iniciado | Fora do escopo deste bloco. |

## Status após Fase 0, bloco 2 (2026-07-13)

| ID | Status | Evidência / pendência |
|---|---|---|
| RS-001 | concluído | Banco vazio e legado reproduzidos em PostgreSQL 16 descartável; drift migrations/Prisma/banco e introspecção SQLAlchemy verdes. |
| RS-002 | concluído no critério P0 | Allowlist recusa domínio/HTTP e E2E comprova copy por fabricante, marketplace e seller. CRUD administrativo segue fora deste bloco. |
| RS-003 | concluído no critério P0 | CTA somente para Offer válida; expirada/pausada/indisponível/legada bloqueadas em integração e E2E. |
| RS-005 | concluído no critério P0 | Store PostgreSQL atômico, sessão+IP minimizado, quota/budget/TTL/fail-closed e concorrência entre instâncias testados. |
| RS-006 | concluído | Sync comprovado em PostgreSQL real com transação, idempotência, bloqueios e rollback. |
| RS-009 | parcial | Build e smoke local verdes; preview Vercel não executado por restrição de não fazer deploy. |
| RS-026 | parcial | Cobertura crítica unitária, integração e E2E criada; ainda não é suíte completa do produto. |
| RS-027 | parcial | `verify:foundation` local criado; workflow CI remoto ainda ausente. |
| RS-028 | parcial | Readiness DB mínimo criado e testado; métricas, alertas e tracing ausentes. |
| RS-030 | concluído | Estados de catálogo/oferta/banco/Sara verificados em E2E sem exposição interna. |

| ID | Área | Problema | Ação | Impacto | Esforço | Risco | Dependências | Pri. | Fase | Critério de aceite |
|---|---|---|---|---|---|---|---|---|---|---|
| RS-001 | Banco | Sem migrations versionadas | Baseline Prisma + estratégia SQLAlchemy/drift | Alto | M | Alto | DB homologação | P0 | 0 | Banco vazio reproduz schema; drift CI verde |
| RS-002 | Oferta | URL arbitrária vira “site oficial” | Partner/Merchant/Offer + allowlist + copy por tipo | Alto | M | Alto | Modelo DB | P0 | 0 | Domínio não aprovado rejeitado; loja/tipo visíveis |
| RS-003 | Oferta | Preço/estoque sem fonte/validade | PriceSnapshot, `verifiedAt`, seller e expiração | Alto | M | Alto | RS-002 | P0 | 0 | CTA só com oferta válida; fonte/data exibidas |
| RS-004 | Conteúdo | Claims sem fonte/revisão | Evidence + workflow draft/review/publish | Alto | L | Alto | Painel mínimo | P0 | 0 | Publicação bloqueada sem fonte/revisor/data |
| RS-005 | Sara | Endpoint sem antiabuso/custo | Rate limit, quota, timeout, body/token limit, kill switch | Alto | M | Crítico | Store contador | P0 | 0 | 429/quota/timeout/budget testados |
| RS-006 | Fornecedor | Sync pode zerar estoque inválido | Dry-run, validação, transação e confirmação | Alto | M | Crítico | Contrato connector | P0 | 0 | Falha/não configurado nunca altera produto |
| RS-007 | Privacidade | Pixels sem consent gate | CMP, consent state e revogação | Alto | M | Alto | Jurídico/tags | P0 | 0 | Tags não essenciais bloqueadas antes da escolha |
| RS-008 | Dependências | 5 alertas sem triagem de aplicabilidade | Triar exposição; upgrade controlado se aplicável | Alto | M | Condicional | Branch/CI | P0 | 0 | High explorável remediado ou exceção formal; regressão verde |
| RS-009 | Deploy | Config raiz Vercel divergente | Definir única estratégia Root Directory | Alto | P | Alto | Acesso Vercel | P0 | 0 | Preview detecta Next e smoke passa |
| RS-010 | Legal | Política antiga/incompleta | Revisão jurídica LGPD/afiliados/cookies/Sara | Alto | M | Alto | Inventário dados | P0 | 0 | Política atual, consentimento e canal do titular |
| RS-011 | Auth | Sem RBAC/scopes | Tokens reader/editor/publisher/integration/admin | Alto | L | Alto | Identidade admin | P1 | 1 | Matriz de autorização coberta por testes |
| RS-012 | Auth | JWT mínimo | `iss/aud/jti`, TTL curto, rotação/revogação | Alto | M | Alto | RS-011 | P1 | 1 | Tokens inválidos/revogados rejeitados |
| RS-013 | Webhook | Sem HMAC/replay/idempotência | Assinar raw body + timestamp + event ID | Alto | M | Alto | Contrato partner | P1 | 1 | Replay/assinatura inválida bloqueados em testes |
| RS-014 | Segurança web | Sem CSP/headers | CSP nonce/hash, HSTS, frame/referrer/permissions | Alto | M | Médio | Inventário scripts | P1 | 1 | Scanner/headers e analytics funcionais |
| RS-015 | Admin | Painel ausente | Admin com auth humana, RBAC, preview e audit log | Alto | L | Alto | RS-011/004 | P1 | 1 | Draft→review→publish auditável |
| RS-016 | Produto | Template decisório incompleto | Indicado/não, prós/contras, requisitos, riscos | Alto | M | Médio | Modelo editorial | P1 | 1 | 100% dos publicados preenchem campos críticos |
| RS-017 | Editorial | Metodologia invisível | Como avaliamos, correções e independência | Alto | M | Médio | Rocha Score | P1 | 1 | Páginas globais linkadas e versionadas |
| RS-018 | Tracking | Sem saída persistida | Endpoint `/go`, signed click ID e OutboundClick | Alto | M | Alto | Partner/Offer | P1 | 1 | Click deduplicado e redirect <300 ms p95 excl. rede |
| RS-019 | Receita | Sem conversão/comissão | Import/postback + Commission ledger | Alto | L | Alto | RS-018/parceiro | P1 | 1 | Click→conversion→commission reconciliável |
| RS-020 | Analytics | Taxonomia incompleta | Schemas de funil e collector first-party | Alto | M | Médio | Consentimento | P1 | 1 | Eventos validados/deduplicados/versionados |
| RS-021 | Sara | Falsa continuidade | Enviar sessão/histórico resumido ou ajustar UI | Alto | M | Médio | Gateway IA | P1 | 1 | Teste multi-turno mantém contexto real |
| RS-022 | Sara | Sem evidência/compatibilidade | Retrieval aprovado + rules engine | Alto | L | Alto | Evidence/modelo | P1 | 1 | Recomendações citam fonte ou recusam |
| RS-023 | Sara | Sem fallback econômico | FAQ/cache/model routing | Alto | M | Médio | Conteúdo aprovado | P1 | 1 | Perguntas comuns respondem sem LLM |
| RS-024 | A11y | Chat/menu/foco/reduced motion | WCAG 2.2 AA e testes axe/teclado | Alto | M | Médio | Componentes atuais | P1 | 1 | Axe sem serious/critical; fluxo por teclado |
| RS-025 | SEO | Sem slug/schema/E-E-A-T | Slugs, 301, Article/Breadcrumb/Organization | Alto | M | Médio | Modelo editorial | P1 | 1 | Schema validado; canonical/title únicos |
| RS-026 | Testes | Só 5 unitários | Integração API/DB e E2E crítico | Alto | L | Alto | CI/DB efêmero | P1 | 1 | Suite cobre auth, produto, CTA, Sara e falhas |
| RS-027 | CI/CD | Ausente | Pipeline lint/test/build/drift/scans/E2E | Alto | M | Médio | RS-001/026 | P1 | 1 | Merge bloqueado por checks obrigatórios |
| RS-028 | Observabilidade | Health sempre OK | Readiness DB/IA + logs JSON/request ID/OTel | Alto | M | Médio | Plataforma observability | P1 | 1 | Alertas testados e PII excluída |
| RS-029 | UX | CTA tardio/sem estado | Resumo decisório, CTA contextual e estado opening | Médio | M | Baixo | Oferta válida | P1 | 1 | CTA acessível junto ao resumo e disclosure |
| RS-030 | Estados | Erro expõe admin/config | Estados público/operacional separados | Médio | P | Baixo | Observabilidade | P1 | 1 | Nenhuma env/schema/cadastro aparece ao público |
| RS-031 | Performance | SSR/cache contraditório | ISR por publicação, dedupe query, tags cache | Médio | M | Médio | Workflow publish | P2 | 3 | Conteúdo servido por CDN; freshness controlada |
| RS-032 | Imagens | `unoptimized` e assets sem pipeline | Loader/domains, formatos e dimensões | Médio | M | Baixo | Storage/CDN | P2 | 3 | LCP image otimizada; sem CLS |
| RS-033 | Descoberta | Sem busca/filtros/hubs | Busca por objetivo/ecossistema/protocolo | Médio | L | Médio | Taxonomia | P2 | 3 | Resultados relevantes, acessíveis e medidos |
| RS-034 | Conteúdo | Sem alternativas/complementares | ProductRelation editorial | Médio | M | Baixo | Template | P2 | 3 | Relações justificadas e com fontes |
| RS-035 | Rocha Score | Método ausente | Score versionado, confiança e bloqueios | Alto | L | Médio | Evidence/revisão | P2 | 3 | Score reproduzível e aprovado |
| RS-036 | Fornecedor | N requests/commits sequenciais | Concorrência limitada, retry, queue, idempotência | Médio | L | Médio | Connector real | P2 | 3 | Job retoma sem duplicar/alterar inválidos |
| RS-037 | Worker | Placeholder | Scheduler/queue com DLQ e métricas | Médio | L | Médio | RS-036 | P2 | 3 | Jobs observáveis, retry e DLQ |
| RS-038 | SEO | Arquitetura rasa | Hubs curados e links internos | Médio | L | Médio | Conteúdo/taxonomia | P2 | 3 | Sem páginas finas/órfãs; sitemap coerente |
| RS-039 | Alertas | Ausentes | Histórico + opt-in + canal/opt-out | Médio | L | Médio | Offer/consent | P3 | 3 | Alerta usa preço validado e cancelamento simples |
| RS-040 | Comparador | Ausente | Comparação normalizada e evidenciada | Médio | L | Médio | Taxonomia/compatibilidade | P3 | 3 | Diferenças/fontes/data visíveis |
| RS-041 | Campanhas | Schema não integrado | Campaign domain, variants, approvals, UTMs | Médio | L | Alto | Tracking/receita | P3 | 4 | Campanha versionada e auditável |
| RS-042 | Mídia | Sem guardrails | Budget policy, pause/scale e kill switch | Alto | L | Alto | RS-041/dados | P3 | 4 | Nenhum gasto fora de limites/aprovação |
| RS-043 | MCP | Sem scopes/aprovação | Tool scopes, idempotência e audit log | Médio | M | Alto | Auth/admin | P2 | 3 | Mutação exige escopo e aprovação registrada |
| RS-044 | Domínio | Orders legados | Decidir remover, segregar ou migrar | Médio | M | Médio | Partner ledger | P2 | 3 | Analytics não chama pedido de venda afiliada |

## Plano de testes essenciais

`P/M/L` são faixas relativas: P≈1–3 pessoa-dias, M≈4–10, L>10, sujeitas a discovery. No kickoff, cada item recebe owner, revisor e data-alvo. Ordem P0 sugerida: RS-001 → RS-002/003/004 em paralelo com RS-005/006/007/008 → RS-009/010.

| Tipo | Escopo prioritário | Critério |
|---|---|---|
| Unitário | URL/allowlist, offer freshness, Rocha Score, compatibilidade, UTMs, auth claims | Branches críticas e limites cobertos |
| Integração | API + PostgreSQL, migrations, CRUD, RBAC, webhook HMAC, event collector, sync | Banco efêmero; rollback/idempotência comprovados |
| Contrato | Fornecedores, Anthropic tools, partner conversion/postback, feeds | Fixtures versionadas e incompatibilidade detectada |
| E2E | Home, produto, busca, CTA `/go`, Sara fallback, admin publish, consentimento | Desktop/mobile; sem chamadas pagas |
| Acessibilidade | Axe + teclado + leitor de tela manual | WCAG 2.2 AA sem serious/critical |
| SEO | Canonical, sitemap, robots, JSON-LD, redirects, OG | Validators sem erro e HTML coerente |
| Segurança | RBAC/IDOR, rate limit, replay, SSRF, XSS, injection, secret scan | Casos adversariais bloqueados/logados |
| Carga | Home cache, API leitura, Sara gateway, collector, feed | SLO definido sem esgotar DB/orçamento |
| Resiliência | DB/IA/parceiro indisponível, timeout, circuit breaker, DLQ | Degradação segura e alertas |
| Regressão | Oferta, preço, links, analytics, responsividade | Rodar em todo PR/release |
| Smoke | Home, produto, health/readiness, `/go` dry-run | Pós-deploy automatizado e read-only |

### Cenários obrigatórios

- produto inexistente, sem imagem, sem oferta, oferta expirada e estoque zero;
- parceiro com domínio não permitido e redirect malicioso;
- Sara sem API, timeout, quota, prompt injection e pergunta incompatível;
- webhook duplicado, antigo e assinatura inválida;
- banco indisponível e catálogo vazio verdadeiro;
- pixel negado/aceito/revogado;
- mobile 320–430 px, teclado, zoom 200% e reduced motion;
- sitemap/SEO com falha DB;
- conversão duplicada/cancelada e reconciliação de comissão.
