# Auditoria de produto, UX e conversão

## Posicionamento

“Tech que mora na sua casa — sem comprar no escuro” é claro, memorável e comunica a dor. “Magazine digital de tecnologia e casa inteligente” explica o formato. A home também esclarece que checkout e pós-venda ficam com o parceiro.

O problema é a distância entre promessa e prova. A interface fala em “coluna técnica séria”, “curadoria” e “decisão baseada em dados”, mas não mostra metodologia, fontes, autoria, correções, testes, data ou independência comercial. Expressões como “capa que vende a história”, “bater o tchan” e “te empurra pro link” enfraquecem a postura consultiva.

## Público e problema

Público inferido: consumidor brasileiro não especialista, interessado em gadgets e smart home, inseguro sobre compatibilidade e compra errada. O problema é relevante, mas não está modelado em jornadas por ambiente, ecossistema, orçamento ou objetivo.

## Jornada real validada

```text
Origem → home institucional → como funciona → vitrine dos 6 recentes
→ /p/{cuid} → benefícios → ficha → protocolos → CTA único
→ espera 1,2 s → parceiro na mesma aba
```

Ausentes na jornada desejada: Sara na home, busca, filtros, comparação, alternativas, alerta, compartilhamento, retorno, confirmação de conversão e receita.

## UX/UI

### Pontos positivos

- Identidade dark/editorial coerente.
- Responsividade funcional em 390 px e 1440 px.
- H1 e hierarquia visual claros.
- Menu mobile abre corretamente.
- Ficha usa `article`, `dl` e tabela semântica.
- CTA e disclosure são visíveis no fim da matéria.

### Fricções

1. A home exige rolagem por conteúdo institucional antes da vitrine.
2. Não há entrada por “o que você quer resolver?”.
3. O preço aparece no topo sem CTA adjacente; CTA só no final.
4. Sara diz usar botão “acima”, embora ele possa estar abaixo.
5. Estado vazio manda o visitante “cadastrar produtos”.
6. Estado sem oferta mostra nomes internos de configuração.
7. Parceiro abre na mesma aba e não há estratégia de retorno.
8. Produto enfatiza benefícios sem bloco equivalente de limitações.

## Acessibilidade

Revisão baseada nas Web Interface Guidelines e inspeção de código, sem axe automatizado:

- falta skip link;
- animação não respeita `prefers-reduced-motion`;
- chat não tem label, diálogo, foco, Escape ou live region;
- menu com `aria-modal` não faz focus trap/restauração;
- setas da galeria ficam invisíveis até hover, inclusive para teclado;
- dots têm alvo pequeno;
- textos `zinc-500/600` precisam de medição de contraste;
- Sara fixa pode cobrir conteúdo em mobile;
- inputs precisam de `name`, `autocomplete` apropriado e label.

Critério de aceite P1: WCAG 2.2 AA, axe sem violações críticas/sérias nas rotas principais, fluxo completo apenas por teclado e teste manual com leitor de tela.

## Conversão e afiliados

### Estado atual

- CTA “Ver oferta no site oficial”.
- Disclosure próximo ao CTA.
- Captura e repasse de click IDs.
- `InitiateCheckout`/`begin_checkout` disparado client-side.

### Problemas críticos

- Seed usa Amazon, mas interface chama genericamente de site oficial.
- URL não tem allowlist, merchant ou seller.
- Preço não tem fonte, validade ou verificação.
- `stockQuantity=0` não impede CTA.
- Link do seed não mostra tag afiliada visível; monetização real não foi validada.
- Não há endpoint first-party `/go`, click ledger, postback ou reconciliação.
- Delay não mostra “Abrindo…” nem impede duplo clique.

### Respostas que a ficha ainda não oferece

| Pergunta | Estado |
|---|---|
| Por que comprar? | Parcial, em features |
| Por que não comprar? | Ausente |
| Para quem serve/não serve? | Ausente |
| Alternativa mais barata/melhor? | Ausente |
| Complementares? | Ausente |
| Compatibilidade? | Parcial, specs livres |
| Risco de compra errada? | Ausente |
| Onde comprar com segurança? | Parcial e não verificável |

## Confiança editorial

Criar páginas e políticas visíveis:

1. Como avaliamos;
2. Política editorial e de correções;
3. Política de afiliados/patrocínios;
4. Autores/revisores e experiência;
5. Metodologia Rocha Score;
6. Fontes e data de verificação por afirmação/oferta.

Patrocínio deve ser identificado acima da dobra e não alterar Rocha Score. Oferta afiliada deve exibir loja, tipo de vínculo, última verificação e condições sujeitas ao parceiro.

### Spot-check técnico do produto publicado

A documentação oficial da Amazon lista o **Echo Show 11 (lançamento 2025)** entre dispositivos com hub Zigbee, portanto o modelo e essa capacidade geral são plausíveis. Contudo, a página oficial de especificações encontrada não detalhou esse modelo e o ASIN do seed não foi confirmado pela busca. Claims específicos do seed — resolução, CPU, dimensões, peso, “graves 2×”, zoom, certificação Brasil e garantia — permanecem **não validados nesta auditoria** e exigem fonte primária por claim. Referências: [Amazon Zigbee Support](https://www.developer.amazon.com/en-US/docs/alexa/smarthome/zigbee-support.html) e [Amazon Device Specifications](https://www.developer.amazon.com/docs/device-specs/device-specifications-echo-show.html).

O link Amazon do seed também não contém tag de associado visível. A própria ajuda oficial orienta que links simples qualificados usem o identificador `tag`; confirmar formato e políticas na conta antes de monetizar: [Portal de Associados Amazon](https://associados.amazon.com.br/help/node/topic/GP38PJ6EUR6PFBEC).

## Estrutura de produto — cobertura

| Campo/capacidade | Estado atual |
|---|---|
| Nome, marca, SKU, descrição, preço, estoque, imagem | Estruturado |
| Headline, intro, galeria, features, specs | JSONB e renderização parcial |
| Voltagem/protocolos/conectividade/garantia | JSONB parcialmente validado |
| Modelo, slug, categoria | Ausente |
| Problema/benefício/público indicado/não indicado | Ausente como estrutura |
| Prós/contras/requisitos/instalação | Ausente |
| Ecossistemas/compatibilidade normalizada | Ausente |
| Preço anterior/histórico/moeda | Ausente |
| Loja/seller/tipo de link | Ausente |
| Fonte/verificação/validade | Ausente |
| Cupom/parcelamento | Ausente |
| Vídeo | Ausente |
| Nota/custo-benefício/inovação/qualidade | Ausente |
| Alternativas/complementares | Ausente |
| Autoria/publicação/revisão | Ausente |
| Patrocínio | Ausente |

JSON arbitrário não equivale a funcionalidade: sem validação, workflow, UI e consulta, é apenas possibilidade técnica.

## Modelo de dados recomendado

- `Product`: identidade técnica estável.
- `ProductCompatibility`: protocolo, ecossistema, requisito e evidência.
- `Content`/`ContentRevision`: matéria, autor, revisor, status e datas.
- `Evidence`: fonte, claim, URL, timestamp, confiança e hash.
- `Partner`/`Merchant`/`Offer`: loja, seller, preço, estoque, validade e link.
- `PriceSnapshot`: histórico.
- `EditorialAssessment`: indicado/não indicado, prós, contras, riscos.
- `ProductRelation`: alternativa/complementar.
- `RochaScoreVersion`: nota, pesos, confiança e aprovação.

Isso habilita fichas, matérias, comparativos, guias, rankings, kits, recomendações, alertas, campanhas e SEO programático controlado.

## Melhorias de CRO ético

1. Resumo “vale para você?” acima da dobra.
2. CTA próximo ao preço com loja e validade; repetir após análise.
3. Sticky mobile discreto somente com oferta válida.
4. “Não compre se…” com o mesmo destaque dos benefícios.
5. Alternativa econômica e superior com justificativa.
6. Sara sugerindo uma pergunta contextual, não popup agressivo.
7. Alerta de preço opt-in sem escassez falsa.
8. Redirecionador first-party rápido e acessível.
9. Testes A/B somente após instrumentação, amostra e guardrails.

## Critério de lançamento dessa frente

Antes do piloto: oferta validada, preço/data/loja exibidos, claims com fonte, template crítico completo, consentimento, CTA confiável, acessibilidade P1 e política editorial pública.
