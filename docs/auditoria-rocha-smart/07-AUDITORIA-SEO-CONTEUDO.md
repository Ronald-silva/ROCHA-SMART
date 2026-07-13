# Auditoria de SEO e conteúdo

## SEO técnico atual

### Implementado

- `lang="pt-BR"` e `metadataBase`.
- Title template, description, Open Graph e Twitter globais.
- Metadata dinâmica e canonical por produto.
- `robots.txt` bloqueando `/api/`.
- Sitemap dinâmico com home, privacidade e produtos.
- Breadcrumb visual e `article` na ficha.

Playwright confirmou HTTP 200 em `/`, produto, `/privacidade`, `/robots.txt` e `/sitemap.xml`. Nenhum JSON-LD foi encontrado.

## Problemas técnicos

1. URLs `/p/{cuid}` não são descritivas nem estáveis editorialmente.
2. Privacidade produziu título duplicado: `Política de Privacidade | Rocha Smart | Rocha Smart`.
3. Layout define canonical `/`; validar/definir canonical próprio em privacidade.
4. Home não define imagem social explícita.
5. Twitter do produto não inclui imagem.
6. Sitemap usa `now()` para home mesmo sem alteração real.
7. Falha DB pode remover produtos do sitemap silenciosamente.
8. `force-dynamic` no produto invalida a intenção de `revalidate=120`.
9. Breadcrumb contém “Catálogo” sem link/rota correspondente.
10. Não há paginação, páginas de categoria ou hubs.
11. Não há dados estruturados.
12. Política declara atualização em maio de 2025, desatualizada na auditoria de julho de 2026.

## Dados estruturados recomendados

| Schema | Uso | Condição |
|---|---|---|
| `Organization` | Identidade/editorial/políticas | Logo, URL e dados reais |
| `WebSite` | Home | Sem `SearchAction` até existir busca real |
| `BreadcrumbList` | Produto/conteúdo | Breadcrumb visível e links reais |
| `Article` | Matéria/review editorial | Autor, datas e imagem reais |
| `Product` | Identidade do produto | Dados coerentes e visíveis |
| `Offer` | Oferta | Preço, moeda, seller, estoque e validade confiáveis |
| `Review` | Avaliação editorial | Método e score editorial reais |
| `ItemList` | Rankings/comparativos | Ordem e itens visíveis |
| `FAQPage` | FAQ | Somente quando elegível e conteúdo visível; sem expectativa de rich result |

Nunca marcar como `Offer` um preço sem freshness/seller. Não criar `SearchAction` antes de uma busca funcional.

## E-E-A-T e autoridade

Faltam autoria, experiência do revisor, política editorial, fontes, datas de publicação/revisão, metodologia de testes, correções e independência comercial. Claims do seed como “60% mais área”, “graves 2×” e “privacidade garantida” não apresentam atribuição.

Para cada matéria:

- autor e revisor técnico;
- publicado/revisado em;
- fontes primárias com data;
- como avaliamos;
- status testado/pesquisado/patrocinado;
- correções e changelog;
- disclosure comercial;
- limites e incertezas.

## Arquitetura de informação proposta

```text
/
├── produtos/{slug}
├── materias/{slug}
├── comparativos/{slug}
├── melhores/{tema}
├── guias/{slug}
├── glossario/{termo}
├── ambientes/{sala|quarto|cozinha|...}
├── objetivos/{seguranca|economia|acessibilidade|...}
├── ecossistemas/{alexa|google-home|apple-home}
├── protocolos/{matter|thread|zigbee|wifi}
├── marcas/{slug}
└── como-avaliamos / politica-editorial / afiliados
```

Hubs só devem ser indexados quando houver conteúdo único, curadoria humana, links úteis e volume suficiente. Filtros combinatórios ficam `noindex` por padrão para evitar páginas finas.

## Plano de conteúdo

### Pilar 1 — Decisão de compra

- para quem serve/não serve;
- principais limitações;
- custo total e requisitos;
- alternativas;
- oferta verificada.

### Pilar 2 — Compatibilidade

- “funciona com meu ecossistema?”;
- protocolo versus ecossistema;
- roteador/rede necessários;
- voltagem e instalação;
- matriz de compatibilidade evidenciada.

### Pilar 3 — Problemas reais

- segurança, energia, rotina, idosos, acessibilidade e pets;
- guias por Job to Be Done, não por keyword isolada.

### Pilar 4 — Educação

- glossário Matter/Thread/Zigbee/Wi-Fi;
- guias de compra errada e devolução;
- privacidade e segurança de IoT.

### Pilar 5 — Comparação e atualização

- comparativos com atributos normalizados;
- rankings com metodologia/versionamento;
- refresh quando preço, firmware ou disponibilidade mudar.

## Conteúdo gerado por IA

IA pode gerar rascunho, resumo e variações; não deve publicar claims, notas ou recomendações sem fonte e revisão. Registrar modelo, prompt/versionamento e revisor internamente. Conteúdo final deve acrescentar análise e contexto, não parafrasear fabricante.

## Links internos

Produto deve ligar a protocolo, ambiente, ecossistema, guia e alternativas. Hubs devem retornar a produtos e conteúdos. Evitar páginas órfãs e breadcrumb para entidades inexistentes.

## Critérios de aceite SEO P1

1. Slug canônico e 301 do ID antigo.
2. Canonical e title únicos por rota.
3. Author/date/source visíveis.
4. Organization, Article e Breadcrumb válidos.
5. Product/Offer somente com dados confiáveis.
6. Sitemap com datas reais e alertas de falha.
7. Nenhuma página indexável sem conteúdo mínimo e revisão.
8. Core Web Vitals monitorados em dados reais.
