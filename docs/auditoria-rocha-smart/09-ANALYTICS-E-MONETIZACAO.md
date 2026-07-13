# Analytics e monetização

## Estado atual

### Eventos existentes

- `page_view` no dataLayer, GA4 e Meta;
- `begin_checkout`/`initiate_checkout` no CTA;
- `Purchase` definido, mas não chamado;
- captura de `fbclid`, `gclid`, `wbraid`, `gbraid` em sessionStorage.

Risco de duplicidade: `gtag('config')` pode enviar page view automático e o listener envia outro explicitamente. Validar no DebugView e configurar `send_page_view` de forma consistente.

### Eventos ausentes

- product/content impression;
- `product_view`;
- `content_start`, progresso e conclusão;
- `partner_click` persistido;
- Sara open/question/response/recommendation;
- comparação;
- alerta;
- compartilhamento;
- broken link/error;
- retorno/cohort;
- conversão e comissão confirmada.

## Funil recomendado

```text
impression
→ page_view
→ content_start
→ content_complete
→ sara_open / comparison
→ recommendation_generated
→ partner_click
→ partner_conversion
→ commission_confirmed
```

Todo evento deve conter `event_id`, `occurred_at`, `anonymous_session_id`, `schema_version`, consent state e IDs de produto/conteúdo/campanha/variante/parceiro quando aplicáveis. Não enviar texto bruto da Sara.

## Arquitetura de eventos

1. Client coleta interação com consentimento.
2. Endpoint first-party valida schema, deduplica e grava.
3. `/go/{tracking_id}` registra saída e redireciona.
4. Import/postback do parceiro grava conversão idempotente.
5. Commission ledger reconcilia pendente/aprovada/cancelada/paga.
6. Jobs agregam métricas; raw events permanecem imutáveis com retenção definida.

## KPIs principais

| KPI | Fórmula |
|---|---|
| Outbound CTR | `partner_click / product_view` |
| CVR reportada | `partner_conversion / partner_click` |
| EPC | `soma da comissão confirmada na moeda-base / partner_clicks elegíveis`, na mesma janela |
| RPM | `(comissão + ads revenue) × 1000 / sessões` |
| Receita por produto | Comissão confirmada atribuída ao produto |
| AI cost/conversation | Custo tokens + infra / conversas |
| AI-assisted EPC | Comissão de sessões com Sara / clicks dessas sessões |
| Margem de contribuição | Receita − mídia − IA − infra variável |
| Recommendation acceptance | Click/recomendação apresentada |
| Freshness SLA | Ofertas verificadas dentro da janela / ofertas ativas |
| Broken-link rate | Links inválidos / links checados |
| Return rate | Sessões recorrentes / usuários anônimos consentidos |

## Afiliados e atribuição

O modelo `Order` não deve ser usado como verdade de afiliado. Criar:

- `Partner` e termos do programa;
- `AffiliateLink`/`TrackingLink` versionado;
- `OutboundClick`;
- `PartnerConversion` idempotente;
- `Commission` com status e moeda;
- `ReconciliationRun`.

Preservar modelos distintos:

- **atribuição de comissão:** regra real do parceiro;
- **atribuição analítica:** first touch, last touch e assistências;
- **incrementalidade:** somente com experimento apropriado.

## Monetização

### Viável no MVP

- afiliados com parceiros aprovados;
- conteúdo patrocinado identificado;
- publicidade consentida, sem comprometer performance.

### Posterior

- alertas premium;
- comparadores;
- serviços/consultoria com escopo e responsabilidade próprios.

Rocha Score nunca inclui comissão na nota editorial. Comissão pode formar um `CommercialScore` separado e servir apenas como desempate entre itens editorialmente equivalentes.

## Dashboard recomendado

1. **Executivo:** receita, margem, mídia, IA e tendência.
2. **Aquisição:** canal, campanha, UTM, CAC quando aplicável.
3. **Conteúdo/SEO:** sessões, conclusão, outbound CTR e refresh.
4. **Produto/oferta:** interesse, EPC, disponibilidade, freshness.
5. **Sara:** uso, custo, latência, abstenção, recomendação e EPC assistido.
6. **Parceiros:** conversões, comissão pendente/aprovada/paga e divergências.
7. **Qualidade de dados:** eventos inválidos, duplicados, links quebrados e atrasos.

## Privacidade e consentimento

- CMP antes de tags não essenciais;
- Consent Mode quando aplicável;
- preferências revogáveis;
- retenção e minimização documentadas;
- separar analytics anônimo de advertising IDs;
- validar juridicamente o repasse de click IDs a cada parceiro;
- nunca armazenar chat bruto em ferramenta de marketing.

## Critérios de aceite

1. Taxonomia e schemas versionados.
2. Eventos deduplicados por `event_id`.
3. Saída registrada server-side.
4. Conversão importada sem duplicidade.
5. Comissão reconciliada por status.
6. Dashboard fecha clicks → conversões → receita.
7. Custo da Sara entra na margem.
8. Nenhum pixel de marketing antes do consentimento aplicável.
