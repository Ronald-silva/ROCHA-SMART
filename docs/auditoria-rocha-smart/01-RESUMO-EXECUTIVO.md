# Auditoria Rocha Smart — Resumo executivo

**Data da auditoria:** 13 de julho de 2026  
**Escopo:** estado atual do worktree, incluindo alterações locais ainda não commitadas  
**Classificação:** **2 — pronto apenas para demonstração interna**  
**Nota geral:** **4,2/10**

### Método de pontuação e prontidão

As 25 dimensões têm peso igual; a nota geral é a média aritmética, arredondada a uma casa decimal. Escala: 0–1 inexistente; >1–3 inicial/demonstração; >3–5 parcial; >5–7 funcional com lacunas; >7–9 madura; >9 comprovada em escala. As notas são qualitativas, baseadas em código, testes e inspeção local — não em tráfego, receita ou pesquisa. **Potencial comercial 8,0 é hipótese estratégica**, não performance comprovada. A classificação 1–6 segue as opções do briefing; “2” significa demonstração interna, independentemente da média.

## Visão geral

A Rocha Smart já demonstra uma proposta de marca coerente: um magazine de tecnologia e casa inteligente que explica produtos e direciona a compra a terceiros. Há uma home editorial responsiva, uma ficha de produto visualmente consistente, CTA externo com disclosure, SEO básico, analytics client-side e uma assistente chamada Sara conectada a um backend real.

O projeto ainda não sustenta um piloto comercial confiável. A camada visível parece mais madura que a operação: preço, disponibilidade, loja, vendedor, fonte e data de verificação não são governados; “site oficial” pode ser qualquer URL HTTP cadastrada; a curadoria não possui método, evidência ou revisão; a Sara não tem proteção de custo nem memória real; e campanhas, fornecedores, worker, pedidos e analytics de vendas são scaffolds ou código não integrado ao modelo afiliado.

## Estado atual por nível de maturidade

- **Implementado:** home, página de produto, privacidade, galeria, ficha técnica baseada em JSON, CTA externo, disclosure, captura de click IDs, GA4/Meta básicos, sitemap, robots, CRUD autenticado de produtos, feed de catálogo, chat Sara com três tools de catálogo e MCP operacional básico.
- **Parcial:** SEO, acessibilidade, autenticação, afiliados, analytics, fornecedor, webhooks, conteúdo editorial, observabilidade e hardening de produção.
- **Mock/scaffold:** descoberta de tendências por SKUs fixos, conectores com endpoints genéricos, worker em loop vazio e análise Google Ads a partir de JSON fornecido.
- **Não integrado:** `Campaign`/`CampaignProduct`, `Order`/`OrderItem` e `trackPurchase` no contexto real de afiliados.
- **Ausente:** painel administrativo, workflow editorial, RBAC humano, migrations versionadas, busca, filtros, comparador, alertas, Rocha Score, fontes editoriais, histórico de preço, consent manager, atribuição de comissão, RAG, memória da Sara, rate limit e CI/CD.

## Principais qualidades

1. Proposta central memorável e bem alinhada ao nicho.
2. Identidade visual editorial coesa em desktop e mobile.
3. Separação correta do JWT da Sara no proxy server-side.
4. Prompt da Sara orientado a não inventar especificações e a remeter pós-venda ao parceiro.
5. Stack convencional, pequena e compreensível; não exige reescrita completa.
6. Build, lint, typecheck, schema Prisma e testes atuais passam.

## Maiores problemas

1. **Oferta não confiável:** `Product` tem um preço estático e um link, sem entidade de loja/oferta, fonte, validade ou última verificação.
2. **Alegação de destino incorreta:** qualquer URL aceita pode ser exibida como “site oficial”. O seed usa Amazon marketplace.
3. **Sara exposta a abuso:** endpoint público sem rate limit, quota, timeout, orçamento ou CAPTCHA; cada chamada pode executar até 8 ciclos de modelo.
4. **Curadoria declarada, não demonstrada:** não há método, fontes, autoria, revisor, datas ou conflitos de interesse por conteúdo.
5. **Operação editorial ausente:** não existe painel, rascunho, aprovação, publicação, expiração ou audit log.
6. **Medição incompleta:** mede visita e início de checkout, mas não saída persistida, conversão, comissão, EPC ou margem.
7. **Governança de dados frágil:** dois ORMs compartilham schema sem migrations versionadas nem controle de drift.
8. **Cobertura de testes mínima:** cinco testes unitários; nenhum teste de rota, banco, autenticação, webhooks, CTA ou E2E versionado.
9. **LGPD incompleta:** pixels podem carregar sem consentimento técnico prévio.
10. **Dependências com alertas:** `npm audit --omit=dev` reportou 5 vulnerabilidades transitivas; correção automática sugerida é inadequada e precisa de atualização controlada.

## Riscos principais

Escala qualitativa 3×3: probabilidade baixa/média/alta × impacto baixo/médio/alto. Owners, datas e risco residual devem ser atribuídos no kickoff porque a capacidade da equipe não foi informada. Exceção exige responsável, prazo, controle compensatório e aceite formal.

| Risco | Probabilidade | Impacto | Tratamento |
|---|---:|---:|---|
| Preço/estoque/link incorreto induzir compra errada | Alta | Alto | Modelar oferta, validade, loja e bloqueio de CTA |
| Abuso da Sara gerar custo ou indisponibilidade | Alta | Alto | Rate limit, quotas, timeout e kill switch |
| Conteúdo factual sem fonte prejudicar confiança | Alta | Alto | Workflow editorial e evidências obrigatórias |
| Token sem escopo permitir operação privilegiada indevida | Média | Alto | RBAC/scopes e tokens separados |
| Pixels sem consentimento criar risco LGPD | Alta | Alto | CMP e consent mode |
| Sync não configurado zerar estoque | Média | Alto | Validação, dry-run e transação |
| Drift Prisma/SQLAlchemy quebrar produção | Média | Alto | Migrations e CI de drift |
| Campanha otimizada por sinal incompleto queimar verba | Alta | Alto | Não lançar mídia antes de atribuição e guardrails |

## Score completo

| Dimensão | Nota | Justificativa/evidência | Fator limitante | Ação mais importante |
|---|---:|---|---|---|
| Posicionamento | 6,0 | Claim forte e consistente na home | Curadoria não é provada | Política editorial pública |
| Produto | 4,0 | Home e ficha existem | Busca, comparação, alertas e governança ausentes | Contrato editorial/oferta completo |
| UX | 5,0 | Jornada básica funciona | Descoberta linear e sem alternativas | Resumo decisório e navegação por intenção |
| UI | 7,0 | Visual coeso e responsivo | Poucos estados e componentes decisórios | Componentes de confiança e decisão |
| Acessibilidade | 4,0 | Semântica parcial boa | Foco, chat, contraste e reduced motion | Auditoria WCAG 2.2 AA automatizada/manual |
| Frontend | 7,0 | Next 16, TS e build verdes | SSR excessivo e estados operacionais expostos | Cache/ISR e estados públicos corretos |
| Backend | 5,5 | API organizada, async e validada | Sem RBAC, rate limit e contratos reais de fornecedor | Hardening e integração testada |
| Banco de dados | 4,0 | PostgreSQL compartilhado funciona | Sem migrations; modelo comercial insuficiente | Baseline versionada e entidades normalizadas |
| Arquitetura | 5,0 | Componentes separados e simples | Domínio legado misturado ao afiliado | Separar conteúdo, oferta, tracking e legado |
| Qualidade de código | 6,0 | Legível, tipado e modular | JSON editorial frouxo e pouca observabilidade | Schemas/serviços de domínio incrementais |
| Testes | 2,0 | Cinco unitários passam | Nenhuma cobertura de integração/E2E | Pirâmide orientada a risco |
| Segurança | 3,5 | ORM, Bearer e comparação segura | Sem rate limit, RBAC, CSP e HMAC | Fechar P0/P1 de abuso e autorização |
| Performance | 5,0 | Build rápido e página simples | `force-dynamic`, imagens unoptimized, sem CWV | ISR, imagens e RUM |
| SEO | 4,0 | Metadata, sitemap e robots | Sem schema, slugs, E-E-A-T ou hubs | Modelo editorial + JSON-LD validado |
| Conteúdo | 4,0 | Ficha visualmente rica | Promocional, sem contraponto e fontes | Template crítico e evidenciado |
| IA | 3,5 | Anthropic e tools reais | Sem RAG, controle de custo ou evidências | Gateway econômico em camadas |
| Sara | 3,0 | Responde uma pergunta sobre catálogo | Stateless e sem descoberta consultiva | Sessão estruturada + método R.O.C.H.A. |
| Automação | 1,5 | Há MCP e preview/persist | Worker e tendências são scaffolds | Pipeline assistido com aprovação |
| Analytics | 3,0 | Page view e begin checkout | Sem saída server-side/conversão/receita | Event collector + partner conversion |
| Afiliados | 3,5 | Link e disclosure existem | Parceiro/seller/atribuição não modelados | Offer/Partner/TrackingLink |
| Conversão | 3,5 | CTA visível e funcional | Tardio, sem oferta válida e alternativas | CTA contextual com oferta verificada |
| Escalabilidade | 3,5 | Stack pode crescer | N chamadas/commits, SSR e ausência de filas | Jobs idempotentes e cache |
| Observabilidade | 1,0 | Apenas logs básicos | Sem métricas, tracing, custos ou readiness | Logs JSON, request ID, OTel/Sentry |
| Prontidão para lançamento | 3,0 | Avaliação qualitativa: demonstração completa | Sem piloto/receita e com riscos comerciais/legais | Executar Fase 0 e Fase 1 |
| Potencial comercial | 8,0 | Hipótese: nicho, dor e marca fortes | Sem pesquisa, tráfego ou receita para validar | Provar curadoria e medir receita real |

## Recomendação de continuidade

**Continuar, sem reescrever.** A fundação técnica é suficiente para evolução incremental. Suspender mídia paga e lançamento público até concluir os P0: oferta confiável, proteção da Sara, consentimento, workflow editorial mínimo, migrations e prevenção de sync destrutivo.

### Primeiro passo recomendado

Fazer kickoff de Fase 0, atribuir owner/prazo aos P0 e iniciar **RS-001, RS-002, RS-005, RS-006 e RS-007**. Primeiro gate: em homologação, reproduzir o banco por migration, rejeitar domínio inválido, demonstrar 429/kill switch da Sara, provar que sync inválido não escreve e que pixels ficam bloqueados sem consentimento.

## Conclusão executiva

A Rocha Smart é uma boa demonstração de produto com potencial comercial alto, mas ainda não é uma operação editorial/afiliada confiável. O passo correto não é adicionar mais agentes ou campanhas; é transformar confiança declarada em dados verificáveis, governança e medição. Após Fase 0 e Fase 1, o projeto poderá avançar para piloto controlado.

## Rastreabilidade dos entregáveis

| Requisito | Documento |
|---|---|
| Resumo, score e prontidão | `01-RESUMO-EXECUTIVO.md` |
| Arquitetura/fluxos | `02-ARQUITETURA-ATUAL.md` |
| Estado funcional | `03-MATRIZ-DE-FUNCIONALIDADES.md` |
| Técnica/segurança/performance/testes | `04-AUDITORIA-TECNICA.md` |
| Produto/UX/CRO/afiliados | `05-AUDITORIA-PRODUTO-UX-CONVERSAO.md` |
| Sara/IA/RAG/custos/método | `06-AUDITORIA-IA-SARA.md` |
| SEO/E-E-A-T/conteúdo | `07-AUDITORIA-SEO-CONTEUDO.md` |
| Automação/campanhas | `08-AUTOMACAO-E-CAMPANHAS.md` |
| Eventos/funil/KPIs/receita | `09-ANALYTICS-E-MONETIZACAO.md` |
| Backlog/testes essenciais | `10-BACKLOG-PRIORIZADO.md` |
| Fases/gates | `11-ROADMAP.md` |
| Estratégia/princípios | `12-ROCHA-SMART-BLUEPRINT.md` |
