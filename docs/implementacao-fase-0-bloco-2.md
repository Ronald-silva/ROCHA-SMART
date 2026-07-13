# Implementação — Fase 0, bloco 2

Data: 2026-07-13. Objetivo: validar a fundação do Bloco 1 em ambiente isolado, comprovar compatibilidade e remover a quota local da Sara. Nenhum banco externo, deploy, Anthropic, fornecedor, parceiro ou analytics real foi usado.

## Resultado executivo

| Frente | Estado | Evidência executada |
|---|---|---|
| PostgreSQL descartável | Concluída | PostgreSQL 16 em Docker, `127.0.0.1:55432`, usuário/banco exclusivos, `--rm`, sem volume |
| Migrations em banco vazio | Concluída | Três migrations aplicadas do zero e `migrate status` verde |
| Schema legado | Concluída | Baseline carregada, dois produtos fictícios preservados, baseline resolvida e migrations aditivas aplicadas |
| Drift | Concluída | migrations→Prisma e PostgreSQL→Prisma: `No difference detected` |
| Prisma/SQLAlchemy | Concluída | Prisma escreveu/SQLAlchemy leu; SQLAlchemy escreveu/Prisma leu; introspecção crítica verde |
| Ofertas | Concluída no escopo da fundação | Regras unitárias, integração de allowlist e E2E de todos os estados pedidos |
| Sync | Concluída no contrato atual | Testes reais PostgreSQL de dry-run, persistência, idempotência, bloqueios e rollback por limite |
| Quota Sara | Concluída para piloto | Store PostgreSQL atômico, store memory apenas dev/test, concorrência entre duas instâncias comprovada |
| E2E e smoke | Concluída localmente | Playwright headless e smoke web/API aprovados; sem preview/deploy por restrição |

## Infraestrutura descartável

Docker Compose não está instalado; o daemon Docker 29.1.3 e a imagem local `postgres:16-alpine` estavam disponíveis. A alternativa mais simples e reproduzível foi `docker run` por `scripts/test-db.sh`:

- container: `rocha-smart-pg-test`;
- bind: somente `127.0.0.1:55432`;
- database/user: `rocha_test`;
- senha: fixture pública exclusiva de teste;
- armazenamento: nenhum volume;
- cleanup: `--rm` e `npm run db:test:down`.

A prova de isolamento foi `docker inspect`: bind local, `AutoRemove=true`, env exclusiva e PostgreSQL aceitando conexão. Os scripts constroem a URL de teste e não reutilizam `DATABASE_URL` do projeto.

## Migrations e legado

Ordem aplicada no banco vazio:

1. `20260713000000_baseline`;
2. `20260713001000_offer_foundation`;
3. `20260713002000_sdr_usage_store`.

A migration de ofertas recebeu checks de status, destino, relacionamento comercial, disponibilidade e moeda antes de qualquer produção. A migration nova cria `SdrUsageBucket`, com chave composta, valores não negativos, tipos de janela/sujeito limitados e índice de expiração.

O teste legado cria outro database dentro do mesmo container, aplica apenas a baseline SQL, insere fixtures fictícias, marca a baseline com `migrate resolve` e aplica somente migrations aditivas. Evidências:

- produto e `ai_metadata` legados preservados;
- `stockQuantity`, SKU, preço e URL legada continuam legíveis;
- zero Offers antes do seed;
- URL legada não se torna CTA;
- seed atualiza o produto sem trocar seu ID;
- Offer criada pelo seed fica `paused`, `unknown` e `legacy_seed_unverified`.

## Drift e compatibilidade dos ORMs

Automático:

- migrations versus `schema.prisma`, usando shadow descartável;
- PostgreSQL migrado versus `schema.prisma`;
- existência das tabelas compartilhadas;
- colunas críticas, nullability, precisão/escala, BIGINT e timestamps;
- índices, checks e foreign keys da Offer;
- leitura cruzada Prisma→SQLAlchemy e escrita SQLAlchemy→Prisma.

SQLAlchemy foi alinhado ao `TIMESTAMP WITHOUT TIME ZONE` gerado pelo Prisma e `tokenCount` passou a `BigInteger`. `Campaign` permanece apenas Prisma porque não é usado pela API; alterações fora das entidades compartilhadas ainda exigem revisão na evolução futura.

## Oferta — integração e E2E

Fixtures determinísticas cobrem:

- válida: CTA, loja, vendedor, data, disclosure e preço;
- expirada, pausada e indisponível: CTA ausente e mensagem neutra;
- domínio não permitido: validação recusa ativação e renderização não expõe link;
- HTTP em produção: unitário rejeita;
- fabricante: texto “Ver no fabricante”;
- marketplace/vendedor terceiro: não é chamado de site oficial e seller aparece;
- legado sem Offer: URL em `ai_metadata` não é usada;
- produto inexistente: HTTP 404;
- home com e sem produtos;
- mobile 390×844;
- clique duplo: botão muda para “Abrindo oferta…”, desabilita e produz uma única navegação interceptada;
- banco indisponível: estado público controlado, sem configuração interna.

O domínio externo é `test.example`, fictício e aprovado apenas na fixture; Playwright intercepta a navegação. Pixels foram explicitamente desativados.

## Sync em PostgreSQL real

Os testes usam connector em memória, nunca rede. Foi comprovado:

- preview não grava;
- não configurado, timeout e vazio não gravam (unitário);
- parcial preserva valores e é classificado como ignorado;
- preço/estoque inválidos são bloqueados;
- anomalias de preço/estoque são bloqueadas;
- lote válido grava em um commit;
- repetição não altera novamente;
- limite de alterações dispara rollback e preserva todas as linhas;
- resultado diferencia `evaluated`, `ignored`, `blocked` e `persisted`.

Política de lote: item incompleto/ausente é ignorado; inválido/anômalo é bloqueado; erro que impede a operação ou excesso do limite aborta a transação inteira.

## Store compartilhado da Sara

Escolha: PostgreSQL. O piloto já depende dele, o volume esperado é baixo e Redis acrescentaria infraestrutura/custo sem benefício proporcional.

Implementações:

- `InMemorySdrUsageStore`: desenvolvimento e unitários;
- `PostgresSdrUsageStore`: produção/piloto;
- protocolo `SdrUsageStore`: `reserve`, `get_usage` e `reset` administrativo não exposto por rota.

Atomicidade: uma transação adquire `pg_advisory_xact_lock`, verifica sessão, IP minimizado e orçamento global, e faz upserts. Chamadas concorrentes não atravessam o limite. O teste criou duas instâncias do store, disparou 12 reservas simultâneas com limite 5 e exatamente 5 foram aceitas.

Privacidade: o Next calcula HMAC do IP com salt próprio; a API recebe apenas sessão + hash de IP assinados pelo gateway. Não persiste IP, prompt ou histórico. Janelas têm `expiresAt` e limpeza oportunística. Falha do store é fail-closed. Produção rejeita `memory`, salt curto ou política aberta.

Limitação: o advisory lock global serializa reservas. É adequado ao piloto; reavaliar lock particionado/Redis com métricas antes de volume alto.

## Smoke, readiness e E2E

Serviços isolados:

- API em `127.0.0.1:8100`;
- web com fixtures em `3100`;
- web com catálogo vazio em `3101`;
- web apontando para porta PostgreSQL inexistente em `3102`.

Passaram: `/`, robots, sitemap, produto válido, produto inválido, Sara 503 sem configuração/modelo, `/health`, `/health/ready` e sync de fornecedor não configurado em dry-run seguro. O readiness implementado é mínimo (`SELECT 1`); RS-028 continua parcial para métricas/alertas.

## Comandos e resultados

- `npm run test:integration`: aprovado; 4 testes PostgreSQL, migrations, drift e legado.
- `npm test`: aprovado; 31 unitários, 4 integrações corretamente skipped sem `TEST_DATABASE_URL`, lint e typecheck.
- `npm run test:e2e`: aprovado após ajustes de teste; build, Playwright e smoke.
- `npm run verify:foundation`: aprovado de ponta a ponta após eliminar uma corrida detectada na criação do shadow database.
- `git diff --check` e compileall: executar no fechamento final.

## Variáveis novas

- `SDR_USAGE_STORE=postgres|memory`;
- `SDR_STORE_FAILURE_POLICY=closed`;
- `SDR_IDENTITY_HASH_SALT` (segredo distinto, mínimo 32 em produção);
- `ROCHA_TEST_DB_PORT` opcional para alterar a porta local;
- variáveis `SMOKE_*` documentadas nos scripts, somente teste.

Em produção: `SDR_USAGE_STORE=postgres`, `SDR_STORE_FAILURE_POLICY=closed`, `SDR_GATEWAY_SECRET` e `SDR_IDENTITY_HASH_SALT` fortes e distintos.

## Rollback

1. Use `SDR_ENABLED=false` antes de qualquer rollback da Sara.
2. Reverta a aplicação; não execute down migration automática.
3. `SdrUsageBucket` é aditiva e pode permanecer sem consumidores.
4. Se remoção futura for aprovada, faça backup, confirme ausência de uso e remova em migration nova — nunca edite migration já aplicada em produção.
5. Sync continua seguro com `persist=false`; pausar ofertas remove CTAs sem apagar histórico.
6. Ambiente de teste: `npm run db:test:down` remove integralmente o container.

## Riscos restantes

- smoke de preview Vercel não foi executado porque deploy é proibido;
- store usa lock global, adequado ao piloto mas não comprovado em alta escala;
- CRUD autorizado de ofertas permanece para fase posterior/painel, fora deste bloco;
- RS-028 permanece parcial além do readiness mínimo;
- Playwright está fixado em `web/e2e/requirements.txt`; o executor ainda precisa instalar o browser Chromium correspondente.

## Evidências versionadas

- `scripts/test-db*.sh`, `scripts/verify-postgres-foundation.sh`;
- `api/tests/integration/test_postgres_foundation.py`;
- `tests/fixtures/legacy-schema.sql`;
- `web/scripts/foundation-fixtures.mjs`;
- `web/e2e/foundation.py`;
- `scripts/verify-foundation-e2e.sh` e `web/scripts/smoke.mjs`.
