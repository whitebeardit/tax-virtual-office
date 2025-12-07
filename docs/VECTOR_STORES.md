# Vector Stores

Este documento descreve os vector stores utilizados pelo Tax Virtual Office para armazenar e recuperar conhecimento sobre documentos fiscais e legislação tributária.

## Visão Geral

Vector stores são repositórios de conhecimento especializados que utilizam embeddings para busca semântica. Cada vector store é otimizado para um tipo específico de conteúdo e é consultado via `file-search` pelos agentes.

## Configuração

Os vector stores são definidos em `agents/vectorstores.yaml` e consultados pelo `tax-document-classifier` para decidir onde armazenar novos documentos.

## Vector Stores Disponíveis

### 1. `legislacao-nacional-ibs-cbs-is`

**Descrição**: Leis complementares, emendas constitucionais, decretos e regulamentos sobre IBS (Imposto sobre Bens e Serviços), CBS (Contribuição sobre Bens e Serviços) e IS (Imposto Seletivo) em âmbito nacional.

**Conteúdo Esperado**:
- Emenda Constitucional 132/2023 (Reforma Tributária)
- Lei Complementar 214/2025 (IBS/CBS/IS)
- Decretos regulamentadores
- Portarias e instruções normativas
- Cronograma de transição 2026-2033

**Uso**:
- Consultas sobre reforma tributária
- Questões sobre IBS, CBS e IS
- Impactos da transição tributária
- Regulamentações federais

**Agentes que Consultam**:
- `coordinator` (prioritário)
- `legislacao-ibs-cbs` (especialista)
- `specialist-nfe`, `specialist-nfce`, `specialist-cte` (quando envolver reforma)

**Exemplos de Queries**:
- "Como funciona o cálculo de IBS?"
- "Qual o cronograma de transição para CBS?"
- "Impactos da EC 132/2023 sobre documentos fiscais"

### 2. `normas-tecnicas-nfe-nfce-cte`

**Descrição**: Notas técnicas, manuais de orientação, esquemas XML, FAQs oficiais e documentação técnica sobre NF-e (modelo 55), NFC-e (modelo 65), CT-e (Conhecimento de Transporte Eletrônico) e MDF-e (Manifesto de Documentos Fiscais Eletrônicos).

**Conteúdo Esperado**:
- Notas Técnicas (NT) oficiais
- Manual de Orientação do Contribuinte (MOC)
- Manual de Integração
- Schemas XSD oficiais
- FAQs e comunicados técnicos
- Guias de implementação

**Uso**:
- Questões técnicas sobre documentos fiscais eletrônicos
- Estrutura XML e validações
- Web services SEFAZ
- Regras de preenchimento
- Códigos de rejeição e tratamento de erros

**Agentes que Consultam**:
- `coordinator` (prioritário)
- `specialist-nfe` (primário)
- `specialist-nfce` (primário)
- `specialist-cte` (primário)

**Exemplos de Queries**:
- "Qual o tamanho máximo do campo cProd na NF-e?"
- "Como funciona o cancelamento de NFC-e?"
- "Quais os códigos de rejeição do CT-e?"

### 3. `documentos-estaduais-ibc-cbs`

**Descrição**: Normas estaduais sobre IBS/CBS/IS vinculadas aos documentos eletrônicos, incluindo regulamentações específicas de cada estado.

**Conteúdo Esperado**:
- Decretos estaduais sobre IBS/CBS
- Instruções normativas estaduais
- Convênios ICMS relacionados à reforma
- Regulamentações específicas por UF
- Orientações de SEFAZs estaduais

**Uso**:
- Regras específicas de estados
- Variações estaduais na implementação
- Convênios e acordos interestaduais
- Orientações de SEFAZs específicas

**Agentes que Consultam**:
- `coordinator` (secundário)
- `legislacao-ibs-cbs` (secundário)
- `specialist-nfe`, `specialist-nfce`, `specialist-cte` (quando envolver regras estaduais)

**Exemplos de Queries**:
- "Como SP está implementando a transição para IBS?"
- "Regras de NFC-e específicas de MG"
- "Convênios ICMS sobre reforma tributária"

### 4. `jurisprudencia-tributaria`

**Descrição**: Jurisprudência, pareceres, soluções de consulta, acórdãos e decisões relevantes à reforma tributária e documentos fiscais eletrônicos.

**Conteúdo Esperado**:
- Pareceres de órgãos competentes
- Soluções de Consulta (SOLIC)
- Acórdãos de tribunais
- Decisões administrativas
- Interpretações oficiais

**Uso**:
- Interpretações de legislação
- Casos práticos e precedentes
- Orientações sobre aplicação de normas
- Resolução de dúvidas específicas

**Agentes que Consultam**:
- `coordinator` (secundário)
- `legislacao-ibs-cbs` (secundário)
- Especialistas (quando necessário para interpretação)

**Exemplos de Queries**:
- "Como foi interpretado o art. X da LC 214/2025?"
- "Parecer sobre aplicação de IBS em caso específico"
- "Precedentes sobre cancelamento de NF-e"

### 5. `legis-nfe-exemplos-xml`

**Descrição**: XMLs de exemplo, esquemas XSD, guias de implementação e referências técnicas específicas de NF-e.

**Conteúdo Esperado**:
- XMLs de exemplo oficiais
- Schemas XSD (nfe_v4.00.xsd e correlatos)
- Guias de implementação
- Exemplos de preenchimento
- Casos de uso práticos

**Uso**:
- Referências técnicas e exemplos práticos
- Validação de estrutura XML
- Guias de implementação
- Casos de uso específicos

**Agentes que Consultam**:
- `specialist-nfe` (primário)
- `specialist-nfce` (secundário)
- `coordinator` (quando necessário para exemplos)

**Exemplos de Queries**:
- "Exemplo de XML de NF-e com múltiplos produtos"
- "Como preencher tag X na NF-e?"
- "Estrutura XML para cancelamento"

## Classificação de Documentos

O `tax-document-classifier` usa heurísticas para decidir qual vector store receberá cada documento detectado:

### Heurísticas de Classificação

| Padrão no Título/URL | Vector Store Priorizado | Score |
|----------------------|------------------------|-------|
| "NT", "Nota Técnica", "Manual" | `normas-tecnicas-nfe-nfce-cte` | +4 |
| "schema", "XML", "XSD" | `legis-nfe-exemplos-xml` | +4 |
| "Lei Complementar", "LC", "Decreto" (nacional) | `legislacao-nacional-ibs-cbs-is` | +3 |
| Portal estadual | `documentos-estaduais-ibc-cbs` | +3 |
| "Ajuste", "SINIEF", "CONFAZ" | `legislacao-nacional-ibs-cbs-is` | +3 |
| "Parecer", "Solução de Consulta", "Acórdão" | `jurisprudencia-tributaria` | +3 |
| "NF-e", "NFE" no título | `normas-tecnicas-nfe-nfce-cte` | +2 |
| "NFC-e", "NFCE" no título | `normas-tecnicas-nfe-nfce-cte` | +2 |

### Processo de Classificação

1. **Análise de Metadados**: Título, portal, URL, tipo
2. **Consulta ao Catálogo**: Lê `agents/vectorstores.yaml`
3. **Cálculo de Scores**: Aplica heurísticas para cada vector store
4. **Seleção**: Escolhe o vector store com maior score
5. **Geração de Tags**: Cria tags baseadas em portal, tipo, ano
6. **Confidence Score**: Calcula confiança (0.0 a 1.0)

### Exemplo de Classificação

**Input**:
```json
{
  "portalId": "encat-nfce",
  "title": "Nota Técnica 2025.001 - Atualização do Layout NFC-e",
  "url": "https://www.encat.org.br/nfce-documentos/nt-2025-001"
}
```

**Scores Calculados**:
- `normas-tecnicas-nfe-nfce-cte`: +4 (NT) + +2 (NFC-e) = **6**
- `legislacao-nacional-ibs-cbs-is`: 0
- Outros: 0

**Output**:
```json
{
  "targetVectorStoreId": "normas-tecnicas-nfe-nfce-cte",
  "tags": ["portal:encat-nfce", "tipo:nota-tecnica", "ano:2025"],
  "confidenceScore": 0.85,
  "rationale": "Título menciona 'Nota Técnica' e 'NFC-e'; portal especializado."
}
```

## Consulta via file-search

Os agentes consultam vector stores via ferramenta `file-search`:

### Uso pelo Coordinator

```typescript
// O coordinator consulta vector stores prioritários
const vectorStores = [
  "legislacao-nacional-ibs-cbs-is",
  "normas-tecnicas-nfe-nfce-cte",
  "documentos-estaduais-ibc-cbs",
  "jurisprudencia-tributaria",
  "legis-nfe-exemplos-xml"
];

// Query exemplo
fileSearch({
  query: "prazo cancelamento NF-e",
  vectorStores: ["normas-tecnicas-nfe-nfce-cte"]
});
```

### Uso pelos Especialistas

Cada especialista consulta seus vector stores primários:

- **specialist-nfe**: `normas-tecnicas-nfe-nfce-cte`, `legis-nfe-exemplos-xml`
- **specialist-nfce**: `normas-tecnicas-nfe-nfce-cte`
- **specialist-cte**: `normas-tecnicas-nfe-nfce-cte`
- **legislacao-ibs-cbs**: `legislacao-nacional-ibs-cbs-is`, `documentos-estaduais-ibc-cbs`

## Adicionar Novo Vector Store

Para adicionar um novo vector store:

1. **Edite `agents/vectorstores.yaml`**:
```yaml
vectorStores:
  - id: novo-vector-store
    description: "Descrição do propósito e conteúdo esperado"
```

2. **Atualize heurísticas** (se necessário):
   - Edite `src/agents/maintenance.ts:286-341`
   - Adicione padrões de classificação

3. **Atualize documentação**:
   - Adicione entrada neste arquivo
   - Documente conteúdo esperado e uso

4. **Teste classificação**:
   - Execute varredura de portais
   - Verifique se documentos são classificados corretamente

## Manutenção

### Verificar Conteúdo

Para verificar quais documentos estão em cada vector store:
- Consulte o sistema de File Search
- Verifique logs de classificação
- Analise tags dos documentos processados

### Limpeza

Vector stores podem acumular documentos desatualizados:
- Implementar política de retenção
- Marcar documentos como obsoletos
- Remover documentos duplicados

## Referências

- **Configuração**: `agents/vectorstores.yaml`
- **Classificação**: `src/agents/maintenance.ts` (função `classifyDocument`)
- **Heurísticas**: `src/agents/maintenance.ts:286-341` (função `scoreVectorStores`)
- **Documentação de Agentes**: `docs/AGENTS.md`
- **Documentação de Workflows**: `docs/WORKFLOWS.md`
