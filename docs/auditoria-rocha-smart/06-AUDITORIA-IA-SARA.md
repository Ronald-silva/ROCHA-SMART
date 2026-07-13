# Auditoria de IA e Sara

## Estado atual

A Sara é um chat de turno único, disponível somente na ficha do produto. O widget mantém mensagens visualmente no React, mas envia ao backend apenas a pergunta atual com `productId` e nome concatenados. Portanto, a interface sugere continuidade que o modelo não recebe.

### Implementado

- Widget e proxy server-side: `SaraWidget.tsx`, `app/api/sdr/chat/route.ts`.
- Endpoint autenticado: `POST /agents/sdr/chat`.
- Anthropic configurável e tool calling.
- Tools: listar produtos, consultar SKU, consultar ID.
- Prompt instrui consulta ao catálogo, abstenção quando falta dado e limites de pós-venda.

### Parcial

- Explicação técnica depende do modelo, não de base aprovada.
- Recomendação pode listar catálogo, mas não há ranking ou regra de compatibilidade.
- “Não inventar” está no prompt, mas não há garantia programática.
- Erro público é mascarado, mas faltam fallback e telemetria.

### Ausente

- memória/conversation ID;
- perfil e consentimento;
- descoberta consultiva;
- RAG/embeddings/fontes;
- citações e confidence;
- cache semântico;
- moderação e prompt-injection defense;
- rate limit/quota/token budget;
- timeout/cancelamento;
- streaming;
- custo e latência por conversa;
- orçamento diário/mensal;
- feedback e auditoria de recomendação.

## Limitações funcionais

| Capacidade | Avaliação atual |
|---|---|
| Responder sobre produto | Parcial, se catálogo contém o dado |
| Explicar termos | Possível pelo modelo, sem fonte |
| Reconhecer desconhecimento | Instruído, não garantido |
| Pedir contexto | O modelo pode, sem método |
| Recomendar/comparar | Parcial e não auditável |
| Respeitar orçamento | Apenas no turno atual |
| Garantir compatibilidade | Não |
| Complementares | Não estruturado |
| Link correto | Não é tool segura da Sara; UI resolve separadamente |
| Motivo persistido | Não |

## Riscos

1. **Abuso/custo:** endpoint público sem limite; até 8 loops × 2.048 tokens.
2. **Prompt injection:** mensagem e dados de catálogo entram como texto/dados não confiáveis.
3. **Alucinação:** catálogo é incompleto e sem proveniência.
4. **Preço/link desatualizado:** não há freshness.
5. **Compatibilidade errada:** protocolos não formam engine determinística.
6. **Falsa memória:** UI mostra histórico que o modelo não conhece.
7. **Privacidade futura:** residência, orçamento e rotina podem virar dados sensíveis por contexto.
8. **Auditoria impossível:** sem log estruturado de evidências, modelo, tokens e recomendação.

## Arquitetura econômica em camadas

### Camada 1 — Conteúdo pré-gerado

FAQs, resumos, perguntas sugeridas e comparações frequentes versionadas por produto. Matching exato responde sem LLM. Conteúdo só é publicado após revisão e fica associado à versão das fontes.

### Camada 2 — Busca e recuperação

Busca híbrida em documentos aprovados + filtros estruturados de produto/oferta. Regras determinísticas tratam voltagem, protocolo, ecossistema e requisitos. Recuperação retorna IDs, campos, fontes e datas; baixa cobertura gera abstenção.

### Camada 3 — Modelo econômico

Modelo pequeno sintetiza somente o contexto recuperado. Saída segue schema: diagnóstico, recomendações, razões, riscos, alternativas e fontes. URLs nunca são geradas; o servidor resolve `offer_id` allowlisted.

### Camada 4 — Modelo avançado

Roteador escala somente para ambiguidade ou decisão complexa, registrando o motivo. Não usar modelo avançado para FAQ, definição ou consulta simples.

### Controles obrigatórios

Os números abaixo são **defaults conservadores para piloto**, não limites definitivos. Torná-los configuração versionada; calibrar com custo-alvo por conversa, latência, qualidade e abuso observados. Owner de FinOps aprova mudanças e registra moeda, período e teto.

- rate limit por IP/sessão;
- 3–5 mensagens anônimas/dia inicialmente;
- input ~1.500 caracteres, output 400–700 tokens;
- 1–2 loops de tool;
- timeout e cancelamento;
- budget kill switch diário/mensal;
- cache por produto, versão e intenção;
- logs de tokens/custo/latência sem prompt bruto;
- retenção curta e anonimização;
- fallback cache → FAQ → busca → mensagem segura;
- recusa sem dados suficientes;
- CAPTCHA progressivo e detecção de abuso.

## Método consultivo R.O.C.H.A.

### R — Resultado e rotina

Descobrir o Job to Be Done: “o que você quer que fique mais fácil/seguro/econômico?”. Aproveitar contexto da página antes de perguntar.

### O — Obstáculo atual

Pergunta SPIN de maior valor: o que falha hoje e qual impacto real? Evitar lista de perguntas.

### C — Compatibilidade e contexto

Coletar apenas o que muda a decisão: ecossistema, rede, voltagem, dispositivo, ambiente e restrições.

### H — Hierarquia de restrições

Ordenar orçamento, urgência, instalação, privacidade, acessibilidade e manutenção.

### A — Ação recomendada

Entregar prioridade, produto, justificativa, compatibilidade, alternativa, custo estimado, riscos, evidências e link oficial/partner resolvido pelo servidor.

## Fluxo de conversa

1. Inferir produto e intenção da página.
2. Fazer uma pergunta de maior ganho de informação.
3. No máximo três perguntas antes de uma primeira orientação.
4. Recuperar catálogo e evidências.
5. Aplicar regras de compatibilidade.
6. Responder com opção principal, alternativa e “não recomendo se”.
7. Pedir confirmação antes de aprofundar/coletar mais contexto.
8. Registrar decisão estruturada sem texto pessoal desnecessário.

Perguntas sobre casa, crianças, idosos ou animais só devem ocorrer quando mudarem segurança/adequação. Nunca perguntar metragem, renda ou rotina por padrão.

## Memória e privacidade

- Memória efêmera por sessão, TTL curto.
- Perfil persistente somente opt-in, editável e apagável.
- Guardar atributos normalizados, não conversa bruta.
- Nunca enviar texto do chat a analytics.
- Separar identificador anônimo de click IDs publicitários.
- Definir finalidade e base legal com jurídico antes de persistir contexto residencial.

## RAG e segurança

- Ingerir somente fontes aprovadas e registrar proveniência.
- Delimitar documentos como dados não confiáveis.
- Bloquear instruções presentes em conteúdo recuperado.
- Allowlist de tools e argumentos tipados.
- Compatibilidade crítica calculada por código, não pelo LLM.
- Respostas devem citar fonte e data.
- Testes adversariais para injection, exfiltração, jailbreak e recomendação insegura.

## Custos e indicadores

Registrar por conversa: modelo, tokens entrada/saída/cache, loops, tools, latência, custo estimado, fallback, recomendação e aceitação. KPIs: custo/conversa, custo/recomendação aceita, cache hit, abstenção correta, taxa de escalada, AI-assisted EPC e margem após IA.

## Critérios de aceite antes de piloto

1. 429 e quotas testadas.
2. Budget kill switch comprovado.
3. Nenhuma URL inventada.
4. Compatibilidade vem de regra/evidência.
5. Resposta com fonte/data ou abstenção.
6. Histórico real ou UI não sugere memória.
7. Telemetria de custo sem PII.
8. Fallback sem Anthropic funcional.
