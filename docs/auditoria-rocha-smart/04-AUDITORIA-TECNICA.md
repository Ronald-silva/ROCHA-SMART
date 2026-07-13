# Auditoria técnica

## Metodologia e limites

A auditoria foi somente leitura, exceto pela criação destes relatórios. Não houve migração, escrita no banco, deploy, chamada Anthropic, clique em parceiro ou campanha. O build consultou o banco configurado apenas para leitura das páginas dinâmicas. Valores de `.env` não foram exibidos.

## Comandos executados

| Comando | Resultado | Observação/impacto |
|---|---|---|
| `npm test` | Passou | ESLint, TypeScript e 5 unittest Python |
| `npx prisma validate` | Passou | Schema sintaticamente válido |
| `npx prisma generate` | Passou | Client 6.19.0 gerado |
| `api/.venv/bin/python -m pip check` | Passou | Sem requisitos quebrados; não é scan CVE |
| `python -m compileall` | Passou | API, worker e testes compilam |
| Import FastAPI/enumeração | Passou | API 0.2.0, 20 rotas |
| `npm ls --depth=0` | Passou com observação | Dependências opcionais/transitivas aparecem como extraneous |
| `npm audit --offline --omit=dev` | Passou | 0 no cache offline; evidência limitada |
| `npm audit --omit=dev` | Falhou | 5 vulnerabilidades: 3 altas, 2 moderadas |
| `git diff --check` | Passou | Sem whitespace errors |
| `npm run build` | Passou | 8 rotas geradas; Turbopack e TS verdes |
| Playwright desktop/mobile | Passou parcialmente | Rotas 200 e console limpo; não substitui axe/Lighthouse |

Não foram executados por inexistência de script/ferramenta versionada: coverage, integração DB isolada, E2E do repositório, Lighthouse, axe, bundle analyzer, carga, SAST, DAST, secret scanner dedicado, `pip-audit`, SBOM e migration drift.

### Evidência do teste de navegador

- Build local em `http://localhost:3002`, 13/07/2026.
- Produto: `/p/cmp7wnyxq00007x6rlgwslnqy` no banco configurado.
- Script Playwright temporário: `/tmp/audit_rocha_web.py`.
- Resultado: home desktop/mobile, produto e privacidade HTTP 200; robots/sitemap 200; menu mobile abriu; 0 erros de console; 0 imagens sem `alt`; 0 JSON-LD; título da privacidade duplicado.
- Screenshots temporárias: `/tmp/rocha-home-desktop.png`, `/tmp/rocha-home-mobile.png`, `/tmp/rocha-product-desktop.png`.

Os artefatos `/tmp` não são versionados; reproduzir o teste em CI é P1. Commit base: `4e8ab9a`, com worktree local modificado.

## Frontend

### Pontos positivos

- App Router organizado por responsabilidade.
- Componentes pequenos e tipados.
- Metadata, robots e sitemap nativos.
- Proxy da Sara evita expor JWT ao browser.
- Estados básicos de ausência de produto e URL existem.
- Build, lint e typecheck passam.

### Problemas

1. Home usa `force-dynamic` e consulta o banco a cada request (`app/page.tsx`).
2. Produto define `revalidate=120` e `force-dynamic` simultaneamente; o segundo torna ISR inefetivo (`app/p/[id]/page.tsx:8-10`).
3. Metadata e página podem consultar o mesmo produto separadamente; usar cache por request.
4. Erro de banco vira vitrine vazia, embora agora seja logado; visitante vê “Cadastre os produtos”.
5. Produto sem link expõe nomes de env/schema ao visitante.
6. Galeria usa `next/image` com `unoptimized`, eliminando parte do benefício.
7. CTA é `button` dependente de JS, espera 1,2 s, permite clique repetido e não tem fallback.
8. Não existem `loading.tsx`/`error.tsx` globais.

## Backend e APIs

### Pontos positivos

- SQLAlchemy assíncrono, pool pre-ping e queries parametrizadas.
- Pydantic valida payloads e limites básicos.
- CRUD separado dos routers.
- Segredos de webhook comparados em tempo constante.
- Defaults frágeis de produção são rejeitados no worktree atual.

### Problemas

- Todos os JWTs têm o mesmo privilégio.
- `/auth/token` e Sara não têm rate limit.
- JWT só contém `sub`/`exp`; sem `iss`, `aud`, `jti`, scope ou revogação.
- `/health` não testa DB nem dependências.
- Webhook não assina raw body, não tem timestamp, replay protection ou idempotência.
- Status de pedido é string livre.
- Feed carrega até 5 mil produtos em memória.
- Connectors fazem chamadas sequenciais por SKU e podem produzir N commits.
- `persist=true` pode persistir zero de fornecedor não configurado.

## Banco e modelagem

### Estado

O mesmo PostgreSQL é acessado diretamente pelo Next/Prisma e pela API/SQLAlchemy. Prisma possui cinco modelos; SQLAlchemy cobre somente três. Não há migrations versionadas.

### Riscos

- drift silencioso entre ORMs;
- ambiente novo não reproduzível;
- `ai_metadata` sem validação editorial abrangente;
- ausência de slug, categoria, offer, partner, source e revision;
- `Order`/`OrderItem` contradizem o modelo sem checkout;
- `Campaign` não está integrado.

Recomendação incremental: criar baseline de migration, CI de drift e entidades novas sem remover legado antes de confirmar uso.

## Dependências

`npm audit` online reportou advisories; severidade do advisory não prova explorabilidade no runtime:

- vulnerabilidade alta em `effect <3.20.0`, transitiva por `@prisma/config`/Prisma;
- vulnerabilidade moderada em `postcss <8.5.10`, transitiva pelo Next;
- total agregado: 5 ocorrências (3 altas, 2 moderadas).

O comando sugeriu `--force` com versões inadequadas/quebráveis; **não aplicar automaticamente**. Fazer triagem P0 com SLA curto e manter remediação P0 se o caminho for explorável. Criar branch controlada, atualizar patch do Prisma e versão corrigida do Next quando disponível, repetir build/E2E e revisar GHSA-38f7-945m-qr2g e GHSA-qx2v-qp2m-jg93.

Python está consistente (`pip check`), mas não houve scanner de CVEs. Adicionar `pip-audit` ou OSV Scanner no CI.

## Segurança

### P0

1. Sara pública pode consumir orçamento Anthropic sem limitação.
2. Sync persistente pode alterar estoque/preço com snapshot inválido.
3. Oferta aceita domínio HTTP(S) arbitrário e pode direcionar phishing se uma credencial editorial for comprometida.
4. Migrations ausentes dificultam recuperação e reprodução segura.
5. Dependências possuem advisories altos ainda não triados quanto à aplicabilidade.

### P1

- RBAC/scopes ausentes.
- CSP, `frame-ancestors`, HSTS, Referrer-Policy e Permissions-Policy não configurados no app.
- Pixels sem consent gate.
- Webhooks vulneráveis a replay.
- Base URL de fornecedor configurável requer allowlist/egress contra SSRF.
- Query token do feed pode vazar em logs/histórico; preferir header.
- MCP não possui escopo por ferramenta, aprovação ou audit trail.

### Ameaças de baixo risco atual

- SQL injection: ORM parametrizado reduz risco.
- XSS editorial: React escapa strings; não há `dangerouslySetInnerHTML` no fluxo auditado.
- CSRF: APIs usam Bearer e CORS sem credenciais; ainda testar endpoints futuros com cookies.

## Privacidade

O projeto captura click IDs em `sessionStorage` e os anexa ao parceiro. Pixels Meta/Google carregam quando env está configurada, sem CMP. O chat não é persistido atualmente, mas a visão futura pretende coletar contexto residencial e orçamento; isso exige finalidade, minimização, consentimento quando aplicável, TTL, direitos do titular, anonimização e DPIA/RIPD conforme avaliação jurídica.

Uma busca manual por padrões comuns nos arquivos rastreados não encontrou segredos reais; isso **não é conclusivo** nem substitui secret scanner. Foram buscadas chaves conhecidas, private keys e URLs PostgreSQL com credencial, excluindo lockfiles; os matches eram placeholders em `.env.example`. `.env` locais não rastreados não foram exibidos.

### Inventário de dados atual

| Dado | Estado observado |
|---|---|
| Nome, e-mail, telefone | Não coletados pela UI atual |
| Cookies/sessão própria | Não há autenticação do visitante; terceiros podem criar cookies |
| Click IDs publicitários | Capturados em `sessionStorage` e anexados ao parceiro |
| Histórico de chat | Apenas memória React da aba; não persistido no backend |
| Preferências/contexto residencial/orçamento | Não modelados nem persistidos atualmente |
| IP/user agent | Processados normalmente por infraestrutura/logs; retenção não documentada |
| Eventos de analytics | Enviados a Meta/Google quando IDs estão configurados |

Antes de adicionar perfil, alertas ou newsletter: mapear controlador/operadores, finalidade, base legal, retenção, compartilhamento, direitos, segurança, consentimento e exclusão.

## Painel administrativo

Não existe painel. API/MCP/Prisma Studio não substituem autenticação humana nem governança editorial. O painel mínimo precisa cobrir: produtos/ofertas/preços/links; conteúdos/categorias/tags/FAQs; fontes e claims; draft/review/publish/schedule/expire; parceiros/cupons/patrocínios; campanhas/UTMs/criativos; prompts/FAQ/cache da Sara; custos/logs/analytics; usuários, roles, approvals e audit log. Alterações de preço, link, score, prompt, publicação e orçamento exigem histórico e rollback.

## Performance

- Build compilou em ~3 s no ambiente e gerou 8 rotas.
- Home e produto são SSR dinâmicos e dependem do Neon por visita.
- Prisma tem retry de até 3 tentativas; a abstração deve ser restrita a leituras/idempotentes.
- Imagens externas/galeria não são otimizadas.
- Fontes agora usam stack local e não bloqueiam build.
- Sem RUM/Core Web Vitals, Lighthouse ou budget de bundle; performance percebida não foi quantificada.
- Mobile visualmente funcional, mas há bastante conteúdo antes e dentro da ficha.

Critérios recomendados: LCP p75 <2,5 s, INP p75 <200 ms, CLS p75 <0,1 em mobile real; imagens responsivas AVIF/WebP; cache/CDN para conteúdo publicado; database timeout e connection budgets.

## Observabilidade

Estado: quase ausente. Há logs do Next/Prisma e logging básico do worker. Não há logs JSON, request ID, tracing, métricas, error tracker, audit log, custos de IA, alertas de link/preço, ou readiness.

Implementar:

1. request/correlation ID do Next à API;
2. logs estruturados sem prompt/PII bruto;
3. Sentry ou OpenTelemetry;
4. métricas HTTP/DB/Anthropic e custos;
5. `/health/live` e `/health/ready`;
6. alertas de erro, latência, gasto e freshness.

## Qualidade de código

Não é necessária reescrita. A prioridade é extrair regras de domínio do JSON e dos componentes:

- `OfferService` e validação de parceiro;
- `ContentRevision`/workflow editorial;
- `CompatibilityService` determinístico;
- gateway Sara com políticas;
- event collector server-side;
- adapters reais de fornecedores.

## CI/CD recomendado

Pipeline mínimo em PR:

1. secret scan;
2. lint + typecheck;
3. unitários;
4. integração PostgreSQL efêmero;
5. Prisma validate + migration drift;
6. build;
7. Playwright smoke/a11y;
8. npm/pip/OSV audit;
9. preview deployment;
10. smoke pós-deploy sem escrita.
