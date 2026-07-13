# Plano de go-live e receita — Rocha Smart

**Objetivo:** colocar a Rocha Smart em produção com ofertas afiliadas válidas, atribuição de cliques e capacidade de reconciliar comissões. Este plano assume uma operação enxuta e prioriza receita confiável antes de mídia paga.

**Definição de pronto para faturar:** uma pessoa encontra uma ficha pública, clica em uma oferta válida, chega ao parceiro com identificador de atribuição quando suportado e a comissão posterior pode ser ligada ao produto e à origem do clique.

## Princípios de lançamento

- A Rocha Smart é curadoria: pagamento, nota fiscal, garantia e suporte são do parceiro.
- Uma `Offer` válida é a única fonte de CTA público. Dados legados de `Product` não autorizam saída.
- Preço, disponibilidade, loja, vendedor, fonte e data de verificação precisam ser conhecidos antes de publicar.
- Não iniciar mídia paga antes de provar a atribuição clique → comissão.
- Produção é aplicada por migration versionada; nunca por `db push` ou `migrate dev`.

## Fase A — preparar a operação comercial

| Ação | Responsável sugerido | Critério de aceite |
|---|---|---|
| Selecionar os primeiros programas/parceiros | Negócio | Comissão, janela, regras de marca, deep links, `subid`/UTM e método de relatório/postback documentados. |
| Criar os primeiros parceiros, lojas e ofertas | Catálogo | Pelo menos 5 produtos com `Partner`, `Merchant` e `Offer` ativos, domínio permitido, preço, disponibilidade, fonte, verificação e validade. |
| Produzir fichas editoriais | Conteúdo | Cada produto tem imagem, descrição, prós/contras, compatibilidade, SKU quando disponível e disclosure. |
| Definir rotina de freshness | Catálogo | Dono e periodicidade definidos; no lançamento, revisar ofertas diariamente ou conforme SLA do parceiro. |
| Estabelecer regra de pausa | Operação | Oferta expirada, sem estoque, sem fonte ou com domínio divergente é pausada e perde CTA imediatamente. |

### Dados mínimos por oferta

- Parceiro e loja/merchant identificáveis;
- vendedor, quando for marketplace;
- URL HTTPS compatível com a allowlist;
- preço e moeda;
- disponibilidade;
- fonte e instante da verificação;
- data de expiração;
- relação comercial e metadados de afiliado permitidos pelo parceiro.

## Fase B — homologação e produção

1. Criar PostgreSQL de homologação separado da produção.
2. Fazer backup e comparar o schema existente com a baseline Prisma.
3. Aplicar migrations com `npm run db:deploy` dentro de `web/` ou `npx prisma migrate deploy`.
4. Configurar Vercel com **Root Directory = `web`** e Railway para `api/`.
5. Configurar domínio, HTTPS, Cloudflare e `NEXT_PUBLIC_SITE_URL=https://rochasmart.com.br`.
6. Validar em homologação e depois produção: home, produto válido, produto sem oferta, CTA, sitemap, robots, `/health` e `/health/ready`.
7. Executar smoke pós-deploy usando `SMOKE_BASE_URL=<url> npm run smoke`.

### Variáveis obrigatórias

**Web/Vercel:** `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`, `INTERNAL_API_BASE_URL`, `INTERNAL_API_JWT`, `SDR_GATEWAY_SECRET`.

**API/Railway:** `APP_ENV=production`, `DATABASE_URL`, `JWT_SECRET_KEY`, `AUTH_CLIENTS_JSON`, `CORS_ORIGINS`, `SDR_GATEWAY_SECRET`, `SDR_IDENTITY_HASH_SALT`, `SDR_USAGE_STORE=postgres` e `SDR_STORE_FAILURE_POLICY=closed`.

Use segredos longos, distintos e fora do Git. A Sara pode iniciar desligada (`SDR_ENABLED=false`), pois não é um pré-requisito de comissão.

## Fase C — fechar atribuição e receita

### Implementações necessárias

1. Criar uma rota first-party `/go/[offerId]`.
2. Validar a oferta antes de redirecionar; oferta inválida não redireciona.
3. Registrar um `OutboundClick` com oferta, produto, data, UTMs, click IDs e identificador de atribuição permitido. Não persistir dados pessoais além do necessário.
4. Adicionar `subid`/UTM ao destino quando o programa de afiliado permitir.
5. Alterar os CTAs para apontar para `/go/[offerId]`, não diretamente ao parceiro.
6. Importar relatórios do parceiro ou receber postbacks e gravar uma comissão com status `pending`, `approved`, `cancelled` ou `paid`.
7. Criar uma visão operacional com visitas, páginas de produto, saídas, comissões, receita e EPC por parceiro/produto/origem.

### Correção necessária antes de ativar feeds

`api/app/routers/catalog.py` ainda monta feeds a partir de `Product.price` e `stockQuantity`, enquanto o site usa `Offer`. Ajustar o feed para selecionar apenas ofertas ativas, disponíveis, verificadas e dentro da validade — ou desativá-lo até confirmar que o parceiro permite feeds afiliados em Merchant Center/Meta.

## Fase D — confiança, legal e operação

- Implementar consentimento antes de carregar GA4, Meta Pixel e Google Ads.
- Publicar/revisar política de privacidade, cookies, disclosure de afiliados e política editorial.
- Validar obrigações tributárias, LGPD e publicidade com contador e assessoria jurídica.
- Adicionar monitoramento de erros, indisponibilidade, 5xx e falhas de redirecionamento.
- Criar CI para lint, typecheck, testes API, migrations/drift e smoke.
- Documentar rollback: pausar oferta, desligar Sara, reverter aplicação; nunca editar migration já aplicada.

## Ordem de execução

| Ordem | Entrega | Bloqueia |
|---:|---|---|
| 1 | Programas afiliados e 5–20 ofertas verificadas | Todo lançamento comercial |
| 2 | Homologação, migrations e deploy | Publicação confiável |
| 3 | Rota `/go`, eventos de saída e parâmetros de atribuição | Medição de receita |
| 4 | Relatório/postback e ledger de comissão | Reconciliar faturamento |
| 5 | Consentimento, políticas e monitoramento | Lançamento público seguro |
| 6 | SEO e distribuição orgânica | Aquisição inicial |
| 7 | Mídia paga | Escala, somente após EPC real |

## Checklist de lançamento

- [ ] Programas de afiliado aprovados e regras de tracking confirmadas.
- [ ] Ofertas reais verificadas e válidas; nenhuma CTA usa URL legada.
- [ ] Banco de homologação testado; migrations aplicadas em produção por deploy.
- [ ] Vercel aponta para `web`; API está acessível apenas nas origens autorizadas.
- [ ] Domínio, HTTPS, sitemap, robots e metadata canônica confirmados.
- [ ] Produto válido tem CTA; produto sem/expirada/pausada não tem CTA.
- [ ] `/go/[offerId]` registra saída e redireciona uma única vez.
- [ ] Pelo menos uma comissão de teste ou relatório de parceiro foi reconciliado.
- [ ] Pixels dependem de consentimento.
- [ ] Alertas e procedimento de rollback existem.
- [ ] Smoke e testes de qualidade estão verdes no commit publicado.

## Após o lançamento

Revise diariamente os links e ofertas na primeira semana. Acompanhe taxa de saída, rejeições/erros de redirecionamento, comissão pendente, EPC e páginas com tráfego sem cliques. Só aumente aquisição paga quando a atribuição estiver estável e houver margem comprovada.
