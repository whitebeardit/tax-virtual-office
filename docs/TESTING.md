# Guia de Testes - Tax Virtual Office

Este documento descreve como testar manualmente as funcionalidades do Tax Virtual Office, especialmente após a refatoração dos vector stores.

## Pré-requisitos

1. **Variáveis de Ambiente**:
   ```bash
   export OPENAI_API_KEY="sk-..."
   export PORT=3000  # opcional, padrão é 3000
   ```

2. **Build do Projeto**:
   ```bash
   npm run build
   ```

## Testes do Classifier

### 1. Teste via Script

Execute o script de teste automatizado:

```bash
npm run build
npx ts-node scripts/test-classifier.ts
```

Este script testa:
- Classificação com metadados do crawler
- Classificação sem metadados (fallback)
- Diferentes tipos de documentos (NT, manual, tabela, etc.)

### 2. Teste Manual via Código

Crie um arquivo `test-manual.ts`:

```typescript
import { classifyDocument } from "./src/agents/maintenance.js";
import { PortalDocument } from "./src/agents/types.js";

const document: PortalDocument = {
  portalId: "portal-nacional-nfe",
  portalType: "nacional",
  title: "Nota Técnica 2025.001 - Atualização do Layout NF-e",
  url: "https://www.nfe.fazenda.gov.br/nt/2025-001",
  publishedAt: "2025-01-15T10:00:00Z",
  detectedAt: new Date().toISOString(),
  domain: "nfe",
  natureza: "NOTA_TECNICA",
  modelo: "55",
};

const classification = await classifyDocument(document);
console.log(JSON.stringify(classification, null, 2));
```

Execute:
```bash
npx ts-node test-manual.ts
```

## Testes via HTTP API

### 1. Iniciar o Servidor

```bash
npm run build
npm start
# ou
APP_MODE=api npm start
```

O servidor estará disponível em `http://localhost:3000` (ou porta configurada).

### 2. Testar Endpoint de Query

#### Exemplo 1: Pergunta sobre NF-e

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o tamanho máximo do campo cProd na NF-e?",
    "context": "Estou implementando emissão de NF-e"
  }'
```

#### Exemplo 2: Pergunta sobre NFC-e

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Como funciona a contingência offline da NFC-e?",
    "context": "Preciso implementar contingência em PDV"
  }'
```

#### Exemplo 3: Pergunta sobre Reforma Tributária

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o cronograma de transição para IBS e CBS?",
    "context": "Preciso entender o impacto da reforma tributária"
  }'
```

#### Exemplo 4: Pergunta sobre Tabelas

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o CFOP para venda de produto no estado?",
    "context": "Operação dentro do mesmo estado"
  }'
```

### 3. Usar Swagger UI

Acesse `http://localhost:3000/api-docs` para interface interativa do Swagger.

## Testes do Watcher e Classifier (Fluxo Completo)

### 1. Executar Varredura de Portais

```bash
APP_MODE=daily-portals-scan npm start
```

Isso irá:
1. Varrear portais configurados em `agents/portals.yaml`
2. Detectar novos documentos
3. Classificar cada documento usando o classifier
4. Fazer upload (salvar localmente)

### 2. Verificar Logs

Os logs mostrarão:
- Documentos detectados
- Classificações realizadas
- Vector stores selecionados
- Tags geradas

### 3. Verificar Cache

Documentos baixados são salvos em:
```
agents/.cache/downloads/
```

## Testes Específicos por Cenário

### Cenário 1: Documento com Metadados do Crawler

**Objetivo**: Verificar que metadados do crawler são usados corretamente.

```typescript
const doc: PortalDocument = {
  portalId: "portal-nacional-nfe",
  title: "Nota Técnica 2025.001",
  url: "https://example.com/nt-001",
  domain: "nfe",
  natureza: "NOTA_TECNICA",
  modelo: "55",
};

const result = await classifyDocument(doc);
// Esperado: vectorStoreId === "normas-tecnicas-nfe"
```

### Cenário 2: Documento sem Metadados (Fallback)

**Objetivo**: Verificar que heurísticas funcionam quando metadados não estão disponíveis.

```typescript
const doc: PortalDocument = {
  portalId: "portal-nacional-nfe",
  title: "Nota Técnica 2025.002 - NF-e modelo 55",
  url: "https://example.com/nt-002",
  // Sem domain, natureza, modelo
};

const result = await classifyDocument(doc);
// Esperado: vectorStoreId === "normas-tecnicas-nfe" (detectado pelo título)
```

### Cenário 3: Tabela CFOP

**Objetivo**: Verificar classificação de tabelas compartilhadas.

```typescript
const doc: PortalDocument = {
  portalId: "sefaz-sp",
  title: "Tabela CFOP",
  url: "https://example.com/cfop.xlsx",
  natureza: "TABELA",
  fileName: "tabela-cfop-2025.xlsx",
};

const result = await classifyDocument(doc);
// Esperado: vectorStoreId === "tabelas-cfop"
```

### Cenário 4: Schema XML

**Objetivo**: Verificar classificação de schemas XML por documento.

```typescript
const doc: PortalDocument = {
  portalId: "portal-cte",
  title: "Schema XSD CT-e versão 4.00",
  url: "https://example.com/cte_v4.00.xsd",
  domain: "cte",
  natureza: "SCHEMA_XML",
};

const result = await classifyDocument(doc);
// Esperado: vectorStoreId === "esquemas-xml-cte"
```

### Cenário 5: Ajuste SINIEF

**Objetivo**: Verificar classificação de ajustes SINIEF por documento.

```typescript
const doc: PortalDocument = {
  portalId: "confaz-ajustes-sinief",
  title: "Ajuste SINIEF 09/2025 - NF-e",
  url: "https://example.com/ajuste-09-2025",
  domain: "nfe",
  natureza: "AJUSTE_SINIEF",
};

const result = await classifyDocument(doc);
// Esperado: vectorStoreId === "ajustes-sinief-nfe"
```

## Validações

### 1. Validar Vector Store ID

Verificar que o `vectorStoreId` retornado existe em `agents/vectorstores.yaml`:

```typescript
import { isValidVectorStoreId } from "./src/mcp/vectorStoresMetadataTool.js";

const classification = await classifyDocument(document);
if (!isValidVectorStoreId(classification.vectorStoreId)) {
  throw new Error(`Vector store inválido: ${classification.vectorStoreId}`);
}
```

### 2. Validar Confidence Score

Verificar que `confidenceScore` está entre 0.0 e 1.0:

```typescript
const classification = await classifyDocument(document);
if (classification.confidenceScore !== undefined) {
  if (classification.confidenceScore < 0 || classification.confidenceScore > 1) {
    throw new Error(`Confidence score inválido: ${classification.confidenceScore}`);
  }
}
```

### 3. Validar Tags

Verificar que tags foram geradas:

```typescript
const classification = await classifyDocument(document);
if (!classification.tags || classification.tags.length === 0) {
  throw new Error("Nenhuma tag foi gerada");
}
```

## Testes de Integração

### Fluxo Completo: Watcher → Classifier → Uploader

```bash
# 1. Executar varredura
APP_MODE=daily-portals-scan npm start

# 2. Verificar logs
# Procurar por:
# - "Portal varrido"
# - "Classificação concluída"
# - "Documento baixado"
# - "Upload concluído"

# 3. Verificar arquivos baixados
ls -la agents/.cache/downloads/
```

## Debugging

### 1. Habilitar Logs Detalhados

```typescript
import { logger } from "./src/utils/logger.js";

logger.level = "debug";
```

### 2. Verificar Resposta do Agente LLM

Adicione logs em `src/agents/maintenance.ts`:

```typescript
const result = await run(agent, userPrompt);
console.log("Resposta do agente:", result.finalOutput);
```

### 3. Verificar Metadados Extraídos

Adicione logs em `parsePortalListing`:

```typescript
const metadata = extractMetadataFromTitle(title, resolvedUrl, portal);
console.log("Metadados extraídos:", metadata);
```

## Troubleshooting

### Erro: "OPENAI_API_KEY is not set"

Solução: Configure a variável de ambiente:
```bash
export OPENAI_API_KEY="sk-..."
```

### Erro: "Vector store ID inválido"

Solução: Verifique que o vector store existe em `agents/vectorstores.yaml`

### Erro: "Resposta do agente não é um JSON válido"

Solução: O agente pode estar retornando texto em vez de JSON. Verifique o prompt do classifier.

### Classificação Incorreta

Solução:
1. Verifique os metadados do documento
2. Verifique o prompt do classifier
3. Verifique as heurísticas de fallback
4. Adicione mais exemplos ao prompt se necessário

## Próximos Passos

Após testes manuais bem-sucedidos:

1. **Criar testes unitários** usando Jest
2. **Criar testes de integração** para fluxo completo
3. **Configurar CI/CD** para executar testes automaticamente
4. **Monitorar métricas** de classificação (accuracy, confidence scores)










