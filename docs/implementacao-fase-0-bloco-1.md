# Implementação — Fase 0, bloco 1

Data: 2026-07-13. Escopo: RS-001, RS-002, RS-003, RS-005, RS-006, RS-009 e RS-030. Nenhuma migration foi aplicada, nenhum deploy foi executado e nenhum modelo pago foi chamado.

## Resultado por item

| Item | Estado | Evidência | Limite restante |
|---|---|---|---|
| RS-001 | Parcial | Baseline `20260713000000_baseline`, migration aditiva `20260713001000_offer_foundation`, `prisma validate`, teste de paridade Prisma/SQLAlchemy e comando `db:drift` | Aplicação em PostgreSQL vazio e drift contra homologação exigem bancos temporários não disponíveis nesta execução |
| RS-002 | Parcial | `Partner`, `Merchant`, `Offer`; domínio normalizado, HTTPS em produção, allowlist de parceiro e merchant; CTA usa apenas oferta validada | Falta CRUD administrativo/autorizado de ofertas |
| RS-003 | Parcial | `PriceSnapshot`, fonte, `verifiedAt`, `validUntil`, seller, disponibilidade e copy pública; legado preservado e seed convertido como oferta pausada | Rotina automática de reverificação não pertence a este bloco |
| RS-005 | Parcial | Limites server-side, identidade HMAC, rate/quota/budget, kill switch, timeout, circuit breaker, payload/token/tool limits e logs sem prompt | Contadores são locais ao processo; antes de múltiplas instâncias devem migrar para Redis/PostgreSQL atômico |
| RS-006 | Concluído no contrato atual | Dry-run padrão, recusa não configurado/parcial/inválido, transação única, idempotência, limite de alterações e bloqueio de preço anormal | Conectores reais ainda precisam de testes de contrato com fixtures dos fornecedores |
| RS-009 | Parcial | Configuração única em `web/vercel.json`, Root Directory documentado e smoke read-only | Smoke pós-build precisa de servidor local/preview ativo; deploy não foi autorizado |
| RS-030 | Concluído | Home, produto e proxy Sara não expõem env, tabela, seed ou instruções administrativas; erros ficam em log interno | Ampliar a regra a novas páginas futuras |

## Decisões arquiteturais

1. Prisma em `web/prisma` é a única fonte oficial de migrations. SQLAlchemy apenas mapeia o mesmo schema; não cria nem altera tabelas.
2. O baseline representa o schema legado. Em banco existente previamente conferido, marque-o com `npx prisma migrate resolve --applied 20260713000000_baseline`; nunca o execute manualmente sobre tabelas existentes.
3. Oferta é a única fonte de CTA. `Product.price`, `stockQuantity` e links em `ai_metadata` continuam disponíveis durante a transição, mas não autorizam saída pública.
4. Domínio precisa pertencer simultaneamente à allowlist do Partner e ao Merchant. Credenciais em URL e protocolos não HTTP(S) são recusados; produção exige HTTPS.
5. O seed migra o link legado como `paused`, `unknown` e fonte `legacy_seed_unverified`. Ele só pode virar ativo após verificação explícita.
6. A identidade da Sara é criada em cookie HttpOnly pelo Next e assinada com HMAC. Headers inventados pelo cliente não passam na API.
7. Sync persiste todo o lote em um único commit. Payload parcial nunca converte ausência de informação em zero.

## Migrations e ambientes

### Desenvolvimento novo

Use um PostgreSQL local descartável, configure `DATABASE_URL`, `DIRECT_URL` e execute em `web`: `npm run db:deploy`. O comando aplica baseline e migration aditiva.

### Banco existente / homologação

1. Faça backup e confirme que não é produção.
2. Compare o schema real com a baseline por `prisma migrate diff --from-url <URL_HOMOLOG> --to-schema-datamodel prisma/schema.prisma`.
3. Se as tabelas legadas forem equivalentes, execute `npx prisma migrate resolve --applied 20260713000000_baseline`.
4. Rode `npm run db:status`, revise o SQL aditivo e só então `npm run db:deploy`.
5. Configure um PostgreSQL vazio em `SHADOW_DATABASE_URL` e rode `npm run db:drift`.

### Produção

Repita primeiro em homologação com backup e aprovação. Use `prisma migrate deploy`, nunca `migrate dev`, `db push` ou reset. Valide contagens antes/depois e smoke read-only. Este trabalho não aplicou qualquer migration.

## Variáveis novas

API: `SDR_ENABLED`, `SDR_GATEWAY_SECRET`, `SDR_RATE_LIMIT_PER_MINUTE`, `SDR_DAILY_QUOTA`, `SDR_MONTHLY_BUDGET_USD`, `SDR_MAX_MESSAGE_CHARS`, `SDR_MAX_HISTORY_MESSAGES`, `SDR_MAX_OUTPUT_TOKENS`, `SDR_MAX_TOOL_CYCLES`, `SDR_TIMEOUT_SECONDS`, `SUPPLIER_SYNC_MAX_CHANGES`, `SUPPLIER_SYNC_MAX_PRICE_CHANGE_PCT`, `SUPPLIER_SYNC_MAX_STOCK_DELTA`.

Web: `SDR_GATEWAY_SECRET` (server-only, mesmo valor da API). Validação de drift: `SHADOW_DATABASE_URL`, somente no ambiente do comando. Smoke: `SMOKE_BASE_URL`, opcional.

Em produção, `SDR_GATEWAY_SECRET` precisa ter ao menos 32 caracteres. `SDR_ENABLED=false` é o kill switch.

## Testes executados

- `npx prisma format`, `npx prisma validate`, `npx prisma generate`: aprovados.
- `npm run lint`, `npm run typecheck`: aprovados.
- `npm run build`: aprovado fora do sandbox; a primeira tentativa falhou porque o sandbox proibiu a porta local usada pelo Turbopack/PostCSS.
- `npm test`: lint, typecheck e 26 testes da API aprovados (um aviso de depreciação interno de `python-jose`).
- `git diff --check`: aprovado antes das alterações documentais finais; reexecutar na entrega.
- Banco vazio, drift contra banco e smoke HTTP: não executados por ausência de PostgreSQL descartável/servidor ativo. O banco configurado não foi usado.

Os testes não fazem chamada Anthropic. Cobrem allowlist/HTTPS, configuração segura, rate limit, quota/budget, kill switch, payload, circuito, fornecedor não configurado, vazio/parcial/inválido, rollback e idempotência.

## Implantação Vercel

Configure o projeto com Root Directory `web`. A única configuração é `web/vercel.json`. Defina as variáveis descritas em `web/.env.example`, rode build e então `SMOKE_BASE_URL=<preview> npm run smoke`. Não configure Output Directory manualmente.

## Rollback

1. Aplicação: reverta o release para a versão anterior; o schema aditivo não interfere nas colunas legadas.
2. Sara: use `SDR_ENABLED=false` imediatamente. Se necessário, remova apenas `SDR_GATEWAY_SECRET` do web/API após o rollback do código.
3. Sync: não chame `persist=true`; o padrão continua dry-run.
4. Banco: não faça `migrate down`. As novas tabelas são aditivas. Preserve-as durante o rollback da aplicação e remova somente em janela aprovada, após backup e comprovação de ausência de dados úteis.
5. Oferta: pausar uma oferta (`status=paused`) remove o CTA sem apagar histórico.

## Riscos restantes e próximo bloco

Antes de piloto público: validar migrations em PostgreSQL efêmero e homologação; trocar o contador local da Sara por store compartilhado atômico; criar CRUD mínimo de ofertas com autorização; executar smoke/E2E com ofertas válida, expirada, ausente e domínio bloqueado. Não iniciar campanhas, RAG, alertas ou automação avançada antes dessas evidências.

> Atualização de 2026-07-13: PostgreSQL efêmero, legado, drift, store distribuído, sync real, E2E e smoke foram validados no Bloco 2. Consulte `docs/implementacao-fase-0-bloco-2.md`. Este registro histórico do Bloco 1 foi mantido.
