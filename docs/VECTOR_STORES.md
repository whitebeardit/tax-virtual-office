# Vector Stores

Este documento descreve os vector stores utilizados pelo Tax Virtual Office para armazenar e recuperar conhecimento sobre documentos fiscais e legislação tributária.

## Visão Geral

Vector stores são repositórios de conhecimento especializados que utilizam embeddings para busca semântica. Cada vector store é otimizado para um tipo específico de conteúdo e é consultado via `file-search` pelos agentes.

A estrutura atual organiza os vector stores por:
- **Tabelas** (compartilhadas e específicas)
- **Normas Técnicas** (por documento)
- **Manuais** (por documento)
- **Informes Técnicos** (por documento)
- **Schemas XML** (por documento)
- **Ajustes SINIEF** (por documento)
- **CONFAZ** (convênios e atos)
- **Legislação** (nacional e estadual)
- **Jurisprudência**

## Configuração

Os vector stores são definidos em `agents/vectorstores.yaml` e consultados pelo `tax-document-classifier` para decidir onde armazenar novos documentos.

## Vector Stores por Categoria

### TABELAS (Compartilhadas)

#### `tabelas-cfop`
**Descrição**: Tabela CFOP (Código Fiscal de Operações e Prestações) compartilhada entre NF-e, NFC-e e CT-e.

**Conteúdo Esperado**:
- Tabela CFOP oficial
- Atualizações e revisões
- Orientações de uso

**Agentes que Consultam**: Todos os especialistas (nfe, nfce, cte)

#### `tabelas-ncm`
**Descrição**: Tabela NCM (Nomenclatura Comum do Mercosul) compartilhada entre NF-e, NFC-e e CT-e.

**Conteúdo Esperado**:
- Tabela NCM oficial
- Atualizações e revisões
- Orientações de uso

**Agentes que Consultam**: Todos os especialistas (nfe, nfce, cte)

#### `tabelas-meios-pagamento`
**Descrição**: Tabelas de meios de pagamento utilizadas em NF-e e NFC-e.

**Conteúdo Esperado**:
- Códigos de meios de pagamento
- Formas de pagamento aceitas
- Regras de uso

**Agentes que Consultam**: `specialist-nfe`, `specialist-nfce`

#### `tabelas-aliquotas`
**Descrição**: Tabelas de alíquotas por UF para ICMS, ISS e outros tributos.

**Conteúdo Esperado**:
- Alíquotas por estado
- Regras de aplicação
- Atualizações periódicas

**Agentes que Consultam**: Todos os especialistas

#### `tabelas-codigos`
**Descrição**: Tabelas de códigos diversos: CST, CSOSN, códigos ANP, códigos de situação tributária, etc.

**Conteúdo Esperado**:
- Códigos de situação tributária (CST, CSOSN)
- Códigos ANP (combustíveis)
- Outros códigos fiscais

**Agentes que Consultam**: Todos os especialistas

#### `tabelas-ibc-cbs`
**Descrição**: Tabelas relacionadas à reforma tributária (IBC, CBS, IBS) - alíquotas, códigos de transição, etc.

**Conteúdo Esperado**:
- Tabelas de alíquotas IBS/CBS
- Códigos de transição
- Regras de aplicação

**Agentes que Consultam**: `legislacao-ibs-cbs`, especialistas quando envolver reforma

### TABELAS (Específicas)

#### `tabelas-nfe-especificas`
**Descrição**: Tabelas específicas da NF-e (modelo 55) não compartilhadas com outros documentos.

**Agentes que Consultam**: `specialist-nfe`

#### `tabelas-nfce-especificas`
**Descrição**: Tabelas específicas da NFC-e (modelo 65) não compartilhadas com outros documentos.

**Agentes que Consultam**: `specialist-nfce`

### NORMAS TÉCNICAS (Por Documento)

#### `normas-tecnicas-nfe`
**Descrição**: Notas Técnicas (NT) oficiais da NF-e (modelo 55), incluindo NTs do Projeto NF-e.

**Conteúdo Esperado**:
- Notas Técnicas oficiais
- Atualizações de layout
- Regras de validação

**Agentes que Consultam**: `specialist-nfe` (primário), `coordinator` (secundário)

#### `normas-tecnicas-nfce`
**Descrição**: Notas Técnicas (NT) oficiais da NFC-e (modelo 65), incluindo NTs da ENCAT e CONFAZ.

**Conteúdo Esperado**:
- Notas Técnicas oficiais
- Orientações sobre CSC, QR Code
- Regras de contingência

**Agentes que Consultam**: `specialist-nfce` (primário), `coordinator` (secundário)

#### `normas-tecnicas-cte`
**Descrição**: Notas Técnicas (NT) oficiais do CT-e (modelo 57), CT-e OS (modelo 67) e MDF-e.

**Conteúdo Esperado**:
- Notas Técnicas oficiais
- Regras por modal de transporte
- Eventos e validações

**Agentes que Consultam**: `specialist-cte` (primário), `coordinator` (secundário)

### MANUAIS (Por Documento)

#### `manuais-nfe`
**Descrição**: Manuais oficiais da NF-e: Manual de Orientação do Contribuinte (MOC), manuais de integração, guias de implementação.

**Agentes que Consultam**: `specialist-nfe` (primário)

#### `manuais-nfce`
**Descrição**: Manuais oficiais da NFC-e: manuais de orientação, guias de implementação, documentação da ENCAT.

**Agentes que Consultam**: `specialist-nfce` (primário)

#### `manuais-cte`
**Descrição**: Manuais oficiais do CT-e/MDF-e: manuais de orientação, guias de implementação.

**Agentes que Consultam**: `specialist-cte` (primário)

### INFORMES TÉCNICOS (Por Documento)

#### `informes-tecnicos-nfe`
**Descrição**: Informes técnicos, comunicados e FAQs oficiais sobre NF-e (modelo 55).

**Agentes que Consultam**: `specialist-nfe` (primário)

#### `informes-tecnicos-nfce`
**Descrição**: Informes técnicos, comunicados e FAQs oficiais sobre NFC-e (modelo 65).

**Agentes que Consultam**: `specialist-nfce` (primário)

#### `informes-tecnicos-cte`
**Descrição**: Informes técnicos, comunicados e FAQs oficiais sobre CT-e/MDF-e.

**Agentes que Consultam**: `specialist-cte` (primário)

### SCHEMAS XML (Por Documento)

#### `esquemas-xml-nfe`
**Descrição**: Schemas XSD oficiais da NF-e (modelo 55), XMLs de exemplo e guias de estrutura XML.

**Agentes que Consultam**: `specialist-nfe` (primário)

#### `esquemas-xml-nfce`
**Descrição**: Schemas XSD oficiais da NFC-e (modelo 65), XMLs de exemplo e guias de estrutura XML.

**Agentes que Consultam**: `specialist-nfce` (primário)

#### `esquemas-xml-cte`
**Descrição**: Schemas XSD oficiais do CT-e/MDF-e, XMLs de exemplo e guias de estrutura XML.

**Agentes que Consultam**: `specialist-cte` (primário)

### AJUSTES SINIEF

#### `ajustes-sinief-nfe`
**Descrição**: Ajustes SINIEF específicos da NF-e (modelo 55).

**Agentes que Consultam**: `specialist-nfe` (secundário)

#### `ajustes-sinief-nfce`
**Descrição**: Ajustes SINIEF específicos da NFC-e (modelo 65).

**Agentes que Consultam**: `specialist-nfce` (secundário)

#### `ajustes-sinief-geral`
**Descrição**: Ajustes SINIEF gerais aplicáveis a múltiplos documentos fiscais eletrônicos.

**Agentes que Consultam**: Todos os especialistas (secundário)

### CONFAZ

#### `convenios-icms`
**Descrição**: Convênios ICMS do CONFAZ (Conselho Nacional de Política Fazendária).

**Agentes que Consultam**: `coordinator`, `legislacao-ibs-cbs`, especialistas quando envolver ICMS

#### `atos-cotepe`
**Descrição**: Atos COTEPE (Comissão Técnica Permanente) do CONFAZ.

**Agentes que Consultam**: `coordinator`, `legislacao-ibs-cbs`

### LEGISLAÇÃO

#### `legislacao-nacional-ibs-cbs-is`
**Descrição**: Leis complementares, emendas constitucionais, decretos e regulamentos sobre IBS (Imposto sobre Bens e Serviços), CBS (Contribuição sobre Bens e Serviços) e IS (Imposto Seletivo) em âmbito nacional.

**Conteúdo Esperado**:
- Emenda Constitucional 132/2023 (Reforma Tributária)
- Lei Complementar 214/2025 (IBS/CBS/IS)
- Decretos regulamentadores
- Portarias e instruções normativas
- Cronograma de transição 2026-2033

**Agentes que Consultam**: `coordinator` (prioritário), `legislacao-ibs-cbs` (especialista), especialistas quando envolver reforma

#### `documentos-estaduais-ibc-cbs`
**Descrição**: Normas estaduais sobre IBS/CBS/IS vinculadas aos documentos eletrônicos, incluindo regulamentações específicas de cada estado.

**Agentes que Consultam**: `coordinator` (secundário), `legislacao-ibs-cbs` (secundário), especialistas quando envolver regras estaduais

### JURISPRUDÊNCIA

#### `jurisprudencia-tributaria`
**Descrição**: Jurisprudência, pareceres, soluções de consulta, acórdãos e decisões relevantes à reforma tributária e documentos fiscais eletrônicos.

**Agentes que Consultam**: `coordinator` (secundário), `legislacao-ibs-cbs` (secundário), especialistas quando necessário

## Classificação de Documentos

O `tax-document-classifier` usa um agente LLM para classificar documentos, priorizando metadados do crawler quando disponíveis.

### Metadados do Crawler

Quando disponíveis, os seguintes metadados são usados para classificação precisa:

- `domain` ('nfe', 'nfce', 'cte', 'confaz'): Indica o documento fiscal principal
- `natureza` ('NOTA_TECNICA', 'MANUAL', 'TABELA', 'INFORME_TECNICO', 'SCHEMA_XML', 'AJUSTE_SINIEF', 'CONVENIO', 'LEI', 'DECRETO'): Tipo de documento
- `assuntos` (array): Temas abordados (ex: ['REFORMA_TRIBUTARIA', 'IBS', 'CBS'])
- `fileName`: Nome do arquivo pode indicar tipo de tabela (ex: "CFOP", "NCM")
- `modelo` ('55', '65', '57', '67'): Modelo do documento fiscal

### Mapeamento de Natureza para Vector Stores

O classifier mapeia a natureza do documento para o vector store apropriado:

- **NOTA_TECNICA** → `normas-tecnicas-{domain}` (nfe/nfce/cte)
- **MANUAL** → `manuais-{domain}` (nfe/nfce/cte)
- **TABELA** → `tabelas-{tipo}` (cfop, ncm, meios-pagamento, etc.)
- **INFORME_TECNICO** → `informes-tecnicos-{domain}` (nfe/nfce/cte)
- **SCHEMA_XML** → `esquemas-xml-{domain}` (nfe/nfce/cte)
- **AJUSTE_SINIEF** → `ajustes-sinief-{domain}` ou `ajustes-sinief-geral`
- **CONVENIO** → `convenios-icms` ou `atos-cotepe`
- **LEI/DECRETO** → `legislacao-nacional-ibs-cbs-is` ou `documentos-estaduais-ibc-cbs`
- **JURISPRUDENCIA** → `jurisprudencia-tributaria`

### Heurísticas de Fallback

Quando metadados do crawler não estão disponíveis, o classifier usa heurísticas baseadas em:
- Título do documento
- URL
- Portal de origem
- Padrões de texto

## Consulta via file-search

Os agentes consultam vector stores via ferramenta `file-search`:

### Uso pelo Coordinator

O coordinator consulta vector stores prioritários organizados por categoria conforme a pergunta do usuário.

### Uso pelos Especialistas

Cada especialista consulta seus vector stores primários:

- **specialist-nfe**: `normas-tecnicas-nfe`, `manuais-nfe`, `informes-tecnicos-nfe`, `esquemas-xml-nfe`, `tabelas-*`
- **specialist-nfce**: `normas-tecnicas-nfce`, `manuais-nfce`, `informes-tecnicos-nfce`, `esquemas-xml-nfce`, `tabelas-*`
- **specialist-cte**: `normas-tecnicas-cte`, `manuais-cte`, `informes-tecnicos-cte`, `esquemas-xml-cte`, `tabelas-cfop`, `tabelas-ncm`
- **legislacao-ibs-cbs**: `legislacao-nacional-ibs-cbs-is`, `tabelas-ibc-cbs`, `documentos-estaduais-ibc-cbs`, `jurisprudencia-tributaria`

## Adicionar Novo Vector Store

Para adicionar um novo vector store:

1. **Edite `agents/vectorstores.yaml`**:
```yaml
vectorStores:
  - id: novo-vector-store
    description: "Descrição do propósito e conteúdo esperado"
```

2. **Atualize o prompt do classifier** (`agents/prompts/tax-document-classifier.system.md`):
   - Adicione regras de mapeamento de natureza
   - Adicione heurísticas de fallback

3. **Atualize documentação**:
   - Adicione entrada neste arquivo
   - Documente conteúdo esperado e uso

4. **Atualize prompts dos especialistas** (se aplicável):
   - Adicione referência ao novo store nos prompts relevantes

5. **Teste classificação**:
   - Execute varredura de portais
   - Verifique se documentos são classificados corretamente

## Referências

- **Configuração**: `agents/vectorstores.yaml`
- **Classificação**: `src/agents/maintenance.ts` (função `classifyDocument`)
- **Tool de Metadados**: `src/mcp/vectorStoresMetadataTool.ts`
- **Prompt do Classifier**: `agents/prompts/tax-document-classifier.system.md`
- **Documentação de Agentes**: `docs/AGENTS.md`
- **Documentação de Workflows**: `docs/WORKFLOWS.md`
