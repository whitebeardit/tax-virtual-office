# Plano de Migração: Vector Stores tax-virtual-office

## Objetivo

Migrar o projeto `tax-virtual-office` para usar a nova estrutura de vector stores organizados por documento e tipo de conteúdo, garantindo compatibilidade com o crawler `tax-agent-hub` e preparando o classifier para receber metadados do crawler.

## Estrutura de Vector Stores Proposta

### Tabelas (Compartilhadas)

- `tabelas-cfop` - CFOP compartilhado entre NF-e, NFC-e, CT-e
- `tabelas-ncm` - NCM compartilhado
- `tabelas-meios-pagamento` - Meios de pagamento (NF-e, NFC-e)
- `tabelas-aliquotas` - Alíquotas por UF
- `tabelas-codigos` - CST, CSOSN, códigos ANP, etc.
- `tabelas-ibc-cbs` - Tabelas de reforma tributária

### Tabelas (Específicas)

- `tabelas-nfe-especificas` - Tabelas específicas NF-e
- `tabelas-nfce-especificas` - Tabelas específicas NFC-e

### Normas Técnicas (por documento)

- `normas-tecnicas-nfe` - NTs NF-e
- `normas-tecnicas-nfce` - NTs NFC-e
- `normas-tecnicas-cte` - NTs CT-e/MDF-e

### Manuais (por documento)

- `manuais-nfe` - Manuais NF-e (MOC, etc.)
- `manuais-nfce` - Manuais NFC-e
- `manuais-cte` - Manuais CT-e/MDF-e

### Informes Técnicos (por documento)

- `informes-tecnicos-nfe` - Informes NF-e
- `informes-tecnicos-nfce` - Informes NFC-e
- `informes-tecnicos-cte` - Informes CT-e/MDF-e

### Schemas XML (por documento)

- `esquemas-xml-nfe` - Schemas XSD NF-e
- `esquemas-xml-nfce` - Schemas XSD NFC-e
- `esquemas-xml-cte` - Schemas XSD CT-e/MDF-e

### Ajustes SINIEF

- `ajustes-sinief-nfe` - Ajustes específicos NF-e
- `ajustes-sinief-nfce` - Ajustes específicos NFC-e
- `ajustes-sinief-geral` - Ajustes gerais

### CONFAZ

- `convenios-icms` - Convênios ICMS
- `atos-cotepe` - Atos COTEPE

### Legislação

- `legislacao-nacional-ibs-cbs-is` - Reforma tributária (cross-document)
- `documentos-estaduais-ibc-cbs` - Normas estaduais

### Jurisprudência

- `jurisprudencia-tributaria` - Pareceres e decisões

---

## Fase 1: Atualizar Configuração de Vector Stores

### 1.1. Atualizar `agents/vectorstores.yaml`

**Arquivo**: `tax-virtual-office/agents/vectorstores.yaml`

**Ação**: Substituir a lista atual de vector stores pela nova estrutura completa (30+ stores).

**Checklist**:

- [ ] Criar backup do arquivo atual
- [ ] Adicionar todos os stores de tabelas (8 stores)
- [ ] Adicionar stores de normas técnicas (3 stores)
- [ ] Adicionar stores de manuais (3 stores)
- [ ] Adicionar stores de informes técnicos (3 stores)
- [ ] Adicionar stores de schemas XML (3 stores)
- [ ] Adicionar stores de ajustes SINIEF (3 stores)
- [ ] Adicionar stores CONFAZ (2 stores)
- [ ] Adicionar campos opcionais: `domains`, `naturezas`, `tags` (se necessário para documentação)
- [ ] Validar sintaxe YAML

---

## Fase 2: Criar/Atualizar Ferramentas MCP

### 2.1. Criar Tool `vector-stores-metadata`

**Arquivo**: `tax-virtual-office/src/mcp/vectorStoresMetadataTool.ts` (NOVO)

**Ação**: Criar tool MCP que lê e retorna a configuração de vector stores do `agents/vectorstores.yaml`.

**Implementação**:

```typescript
// Tool que lê agents/vectorstores.yaml e retorna lista de stores disponíveis
// Usado pelo classifier para consultar stores disponíveis
```

**Checklist**:

- [ ] Criar arquivo `src/mcp/vectorStoresMetadataTool.ts`
- [ ] Implementar leitura de `agents/vectorstores.yaml`
- [ ] Retornar lista de stores com `id` e `description`
- [ ] Adicionar tratamento de erros
- [ ] Registrar tool em `src/agents/tools.ts` (se necessário)

### 2.2. Atualizar Tool `file-search`

**Arquivo**: `tax-virtual-office/src/agents/tools.ts`

**Ação**: Atualizar a descrição da tool para incluir todos os novos vector stores.

**Checklist**:

- [ ] Atualizar lista de vector stores na descrição
- [ ] Organizar por categoria (tabelas, normas técnicas, manuais, etc.)
- [ ] Manter exemplos de uso atualizados

---

## Fase 3: Atualizar Tipos TypeScript

### 3.1. Estender `PortalDocument` para suportar metadados do crawler

**Arquivo**: `tax-virtual-office/src/agents/types.ts`

**Ação**: Adicionar campos opcionais para metadados do crawler.

**Mudanças**:

```typescript
export interface PortalDocument {
  // ... campos existentes ...
  // NOVOS campos opcionais do crawler
  domain?: string;           // 'nfe', 'nfce', 'cte', 'confaz'
  natureza?: string;         // 'NOTA_TECNICA', 'MANUAL', 'TABELA', etc.
  assuntos?: string[];       // ['REFORMA_TRIBUTARIA', ...]
  fileName?: string;         // Nome do arquivo (para classificação de tabelas)
  modelo?: string;           // '55' (NF-e), '65' (NFC-e), etc.
}
```

**Checklist**:

- [ ] Adicionar campos opcionais em `PortalDocument`
- [ ] Documentar campos novos
- [ ] Manter compatibilidade com código existente

### 3.2. Estender `ClassifiedDocument` se necessário

**Arquivo**: `tax-virtual-office/src/agents/types.ts`

**Ação**: Verificar se `ClassifiedDocument` precisa de campos adicionais.

**Checklist**:

- [ ] Revisar interface `ClassifiedDocument`
- [ ] Adicionar campos se necessário (ex: `alternativeStores` para documentos que podem ir em múltiplos stores)

---

## Fase 4: Atualizar Classifier

### 4.1. Modificar `classifyDocument` para usar agente LLM

**Arquivo**: `tax-virtual-office/src/agents/maintenance.ts`

**Ação**: Substituir heurísticas por invocação do agente LLM `tax-document-classifier`.

**Mudanças**:

- Remover função `scoreVectorStores()` (ou mantê-la como fallback)
- Criar função `invokeClassifierAgent()` que invoca o agente LLM
- Modificar `classifyDocument()` para sempre usar o agente LLM
- Passar metadados completos (incluindo novos campos) para o agente

**Checklist**:

- [ ] Criar função `invokeClassifierAgent(document: PortalDocument): Promise<ClassifiedDocument>`
- [ ] Modificar `classifyDocument()` para usar o agente LLM
- [ ] Construir prompt do usuário com todos os metadados disponíveis
- [ ] Parsear resposta JSON do agente
- [ ] Validar resposta (vectorStoreId existe, confidenceScore válido)
- [ ] Adicionar tratamento de erros
- [ ] Manter fallback para heurísticas se agente falhar (opcional)

### 4.2. Atualizar Prompt do Classifier

**Arquivo**: `tax-virtual-office/agents/prompts/tax-document-classifier.system.md`

**Ação**: Atualizar prompt para:

- Reconhecer novos vector stores
- Usar metadados do crawler quando disponíveis (domain, natureza, assuntos)
- Classificar tabelas corretamente (CFOP, NCM, meios de pagamento, etc.)
- Retornar classificação precisa baseada em metadados

**Checklist**:

- [ ] Atualizar seção de vector stores disponíveis
- [ ] Adicionar regras de classificação para tabelas
- [ ] Adicionar regras para usar metadados do crawler (domain, natureza, assuntos)
- [ ] Atualizar exemplos de classificação
- [ ] Documentar como classificar documentos compartilhados (ex: tabelas CFOP)

### 4.3. Criar Tool `vector-stores-metadata` para o Classifier

**Arquivo**: `tax-virtual-office/src/agents/tools.ts` (ou arquivo separado)

**Ação**: Criar tool que o classifier pode usar para consultar stores disponíveis.

**Checklist**:

- [ ] Criar tool `vectorStoresMetadataTool`
- [ ] Registrar tool no `agents.yaml` para o classifier
- [ ] Implementar leitura de `agents/vectorstores.yaml`
- [ ] Retornar lista formatada de stores

---

## Fase 5: Atualizar Prompts dos Especialistas

### 5.1. Atualizar Prompt `specialist-nfe.system.md`

**Arquivo**: `tax-virtual-office/agents/prompts/specialist-nfe.system.md`

**Ação**: Atualizar seção de vector stores para usar os novos stores específicos.

**Mudanças**:

- Substituir `normas-tecnicas-nfe-nfce-cte` por `normas-tecnicas-nfe`
- Substituir `legis-nfe-exemplos-xml` por `esquemas-xml-nfe`
- Adicionar stores de tabelas: `tabelas-cfop`, `tabelas-ncm`, `tabelas-meios-pagamento`, `tabelas-aliquotas`, `tabelas-codigos`, `tabelas-nfe-especificas`
- Adicionar stores de manuais: `manuais-nfe`
- Adicionar stores de informes: `informes-tecnicos-nfe`
- Adicionar stores de ajustes: `ajustes-sinief-nfe`

**Checklist**:

- [ ] Atualizar seção "Vector stores (via `file-search`)"
- [ ] Organizar por PRIMÁRIAS e SECUNDÁRIAS
- [ ] Atualizar exemplos de queries
- [ ] Manter referências a stores compartilhados (legislacao-nacional-ibs-cbs-is, documentos-estaduais-ibc-cbs)

### 5.2. Atualizar Prompt `specialist-nfce.system.md`

**Arquivo**: `tax-virtual-office/agents/prompts/specialist-nfce.system.md`

**Ação**: Similar ao specialist-nfe, mas para NFC-e.

**Checklist**:

- [ ] Atualizar stores para NFC-e específicos
- [ ] Adicionar stores de tabelas relevantes para NFC-e
- [ ] Manter stores compartilhados

### 5.3. Atualizar Prompt `specialist-cte.system.md`

**Arquivo**: `tax-virtual-office/agents/prompts/specialist-cte.system.md`

**Ação**: Similar, mas para CT-e/MDF-e.

**Checklist**:

- [ ] Atualizar stores para CT-e específicos
- [ ] Adicionar stores de tabelas (CFOP, NCM são compartilhados)
- [ ] Manter stores compartilhados

### 5.4. Atualizar Prompt `legislacao-ibs-cbs.system.md`

**Arquivo**: `tax-virtual-office/agents/prompts/legislacao-ibs-cbs.system.md`

**Ação**: Adicionar referência a `tabelas-ibc-cbs` para tabelas de reforma tributária.

**Checklist**:

- [ ] Adicionar `tabelas-ibc-cbs` aos stores primários
- [ ] Manter stores existentes

### 5.5. Atualizar Prompt `coordinator.system.md`

**Arquivo**: `tax-virtual-office/agents/prompts/coordinator.system.md`

**Ação**: Atualizar lista de vector stores prioritários.

**Checklist**:

- [ ] Atualizar lista de stores prioritários
- [ ] Organizar por categoria
- [ ] Manter exemplos de uso

---

## Fase 6: Atualizar Watcher (Opcional - Extração de Metadados)

### 6.1. Melhorar Extração de Metadados no Watcher

**Arquivo**: `tax-virtual-office/src/agents/maintenance.ts` (função `parsePortalListing`)

**Ação**: Tentar extrair mais metadados do HTML/título quando possível (natureza, domínio, etc.).

**Checklist**:

- [ ] Adicionar heurísticas para detectar natureza do título (ex: "Nota Técnica" → NOTA_TECNICA)
- [ ] Adicionar heurísticas para detectar domínio (ex: "NF-e" → nfe)
- [ ] Adicionar heurísticas para detectar assuntos (ex: "IBS" → REFORMA_TRIBUTARIA)
- [ ] Preencher campos opcionais de `PortalDocument` quando detectados
- [ ] Manter compatibilidade com código existente

---

## Fase 7: Atualizar Documentação

### 7.1. Atualizar `docs/VECTOR_STORES.md`

**Arquivo**: `tax-virtual-office/docs/VECTOR_STORES.md`

**Ação**: Documentar todos os novos vector stores.

**Checklist**:

- [ ] Adicionar seção para cada categoria de stores
- [ ] Documentar stores de tabelas (compartilhadas e específicas)
- [ ] Documentar stores por documento (NTs, manuais, informes, schemas)
- [ ] Atualizar exemplos de classificação
- [ ] Atualizar heurísticas de classificação
- [ ] Atualizar exemplos de uso pelos agentes

### 7.2. Atualizar `docs/AGENTS.md`

**Arquivo**: `tax-virtual-office/docs/AGENTS.md`

**Ação**: Atualizar documentação dos agentes com novos stores.

**Checklist**:

- [ ] Atualizar seção de vector stores por especialista
- [ ] Atualizar exemplos de queries
- [ ] Documentar mudanças no classifier

### 7.3. Criar Documento de Planejamento

**Arquivo**: `tax-virtual-office/docs/PLANO_MIGRACAO_VECTOR_STORES.md` (NOVO)

**Ação**: Criar documento com este plano, incluindo checklists detalhados.

**Checklist**:

- [ ] Criar arquivo com estrutura completa do plano
- [ ] Incluir todos os checklists
- [ ] Adicionar seção de testes
- [ ] Adicionar seção de rollback
- [ ] Adicionar estimativas de tempo

---

## Fase 8: Testes e Validação

### 8.1. Testes Unitários

**Checklist**:

- [ ] Testar `classifyDocument()` com diferentes tipos de documentos
- [ ] Testar classificação de tabelas (CFOP, NCM, etc.)
- [ ] Testar classificação com metadados do crawler
- [ ] Testar classificação sem metadados (fallback)
- [ ] Validar que vectorStoreId retornado existe em `vectorstores.yaml`

### 8.2. Testes de Integração

**Checklist**:

- [ ] Testar fluxo completo: watcher → classifier → uploader
- [ ] Testar consultas dos especialistas nos novos stores
- [ ] Validar que agentes encontram documentos corretos
- [ ] Testar queries cross-document (ex: CFOP usado em NF-e e NFC-e)

### 8.3. Testes Manuais

**Checklist**:

- [ ] Executar varredura de portais
- [ ] Verificar classificação de documentos reais
- [ ] Testar consultas dos agentes
- [ ] Validar respostas dos especialistas

---

## Fase 9: Integração com Crawler (Preparação Futura)

### 9.1. Preparar Interface para Metadados do Crawler

**Arquivo**: `tax-virtual-office/src/agents/maintenance.ts`

**Ação**: Garantir que `classifyDocument()` aceita e usa metadados do crawler quando disponíveis.

**Checklist**:

- [ ] Validar que campos opcionais são processados corretamente
- [ ] Documentar formato esperado de metadados do crawler
- [ ] Criar exemplo de chamada com metadados completos

### 9.2. Documentar API do Classifier

**Arquivo**: `tax-virtual-office/docs/CLASSIFIER_API.md` (NOVO)

**Ação**: Documentar como o crawler pode chamar o classifier.

**Checklist**:

- [ ] Documentar interface de entrada (PortalDocument com metadados)
- [ ] Documentar formato de saída (ClassifiedDocument)
- [ ] Adicionar exemplos de uso
- [ ] Documentar como invocar via agente LLM

---

## Ordem de Execução Recomendada

1. **Fase 1**: Atualizar configuração (vectorstores.yaml)
2. **Fase 2**: Criar ferramentas MCP necessárias
3. **Fase 3**: Atualizar tipos TypeScript
4. **Fase 4**: Atualizar classifier (mais crítico)
5. **Fase 5**: Atualizar prompts dos especialistas
6. **Fase 6**: Melhorar watcher (opcional)
7. **Fase 7**: Atualizar documentação
8. **Fase 8**: Testes
9. **Fase 9**: Preparação para integração futura

---

## Riscos e Mitigações

### Risco 1: Classifier LLM pode ser lento/custoso

**Mitigação**:

- Implementar cache de classificações similares
- Considerar fallback para heurísticas em caso de erro
- Monitorar custos e latência

### Risco 2: Agente LLM pode retornar JSON inválido

**Mitigação**:

- Validar JSON retornado
- Implementar retry logic
- Fallback para heurísticas se agente falhar

### Risco 3: Prompts desatualizados podem causar confusão

**Mitigação**:

- Revisar todos os prompts cuidadosamente
- Testar cada especialista após atualização
- Validar que exemplos estão corretos

### Risco 4: Vector stores não existem no OpenAI

**Mitigação**:

- Validar que stores existem antes de classificar
- Criar stores automaticamente se necessário
- Documentar processo de criação de stores

---

## Estimativa de Esforço

- **Fase 1**: 1 hora
- **Fase 2**: 2-3 horas
- **Fase 3**: 1 hora
- **Fase 4**: 4-6 horas (mais complexa)
- **Fase 5**: 2-3 horas
- **Fase 6**: 1-2 horas (opcional)
- **Fase 7**: 2-3 horas
- **Fase 8**: 3-4 horas
- **Fase 9**: 1-2 horas

**Total Estimado**: 17-25 horas

---

## Próximos Passos Após Migração

1. Integrar classifier com crawler (quando crawler estiver pronto)
2. Criar stores no OpenAI File Search
3. Migrar documentos existentes para novos stores
4. Monitorar performance e ajustar conforme necessário
