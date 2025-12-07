# Rotas Disponíveis - Tax Virtual Office

## Rotas Disponíveis

### 1. **GET /health** - Health Check
Verifica se o servidor está funcionando.

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{"ok":true}
```

---

### 2. **POST /query** - Consulta ao Agente Coordenador
Endpoint principal para fazer consultas tributárias. O agente coordenador analisa a pergunta e pode acionar especialistas automaticamente.

**Formato da requisição:**
```json
{
  "question": "sua pergunta aqui",
  "context": "contexto opcional"
}
```

**Exemplos de CURL:**

#### Exemplo 1: Consulta Simples sobre NF-e
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é uma NF-e?",
    "context": "Preciso entender o conceito básico"
  }'
```

#### Exemplo 2: Consulta sobre Prazo de Cancelamento
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o prazo para cancelar uma NF-e?",
    "context": "Empresa precisa cancelar nota emitida há 2 dias"
  }'
```

#### Exemplo 3: Consulta sobre NFC-e
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Como funciona a emissão de NFC-e?",
    "context": "Dúvida sobre NFC-e"
  }'
```

#### Exemplo 4: Consulta sobre CT-e
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é um CT-e e quando devo emitir?",
    "context": "Consulta sobre transporte"
  }'
```

#### Exemplo 5: Consulta sobre Reforma Tributária (IBS/CBS)
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Como funciona o IBS na reforma tributária?",
    "context": "Consulta sobre reforma tributária"
  }'
```

#### Exemplo 6: Consulta sobre Cálculo de ICMS
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Como calcular o ICMS na NF-e?",
    "context": "Dúvida sobre cálculo tributário"
  }'
```

#### Exemplo 7: Consulta sobre Carta de Correção
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quando posso emitir uma Carta de Correção Eletrônica?",
    "context": "Nota fiscal com erro"
  }'
```

#### Exemplo 8: Consulta sobre Inutilização
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o prazo para inutilizar uma numeração de NF-e?",
    "context": "Sequência de notas não utilizada"
  }'
```

**Resposta esperada:**
```json
{
  "answer": "Resposta consolidada do agente...",
  "plan": [
    "Plano de execução...",
    "Especialistas disponíveis..."
  ],
  "sources": [
    "Fontes consultadas...",
    "docs/AGENTS.md"
  ],
  "agentTraces": [
    {
      "agentId": "coordinator",
      "calledTools": ["file-search", "logger"],
      "sample": "Exemplo de trace...",
      "note": "Observação..."
    }
  ]
}
```

---

### 3. **POST /admin/run-daily** - Varredura Diária de Portais
Dispara o fluxo de monitoramento de portais fiscais. Este endpoint pode demorar alguns minutos, pois faz fetch de múltiplos portais.

```bash
curl -X POST http://localhost:3000/admin/run-daily
```

**Resposta esperada:**
```json
{"status":"scheduled"}
```

**Nota:** Este endpoint:
- Faz fetch dos portais configurados em `agents/portals.yaml`
- Extrai novos documentos
- Classifica e armazena documentos
- Pode demorar 2-5 minutos dependendo do número de portais

---

## Ver Respostas Formatadas

Para ver as respostas JSON formatadas de forma legível, use `jq`:

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é uma NF-e?",
    "context": "Teste"
  }' | jq .
```

Ou salve em um arquivo:

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é uma NF-e?",
    "context": "Teste"
  }' > resposta.json

cat resposta.json | jq .
```

---

## Estrutura das Respostas

### Resposta do `/query`

```typescript
{
  answer: string;           // Resposta consolidada
  plan?: string[];         // Plano de execução
  sources?: string[];      // Fontes consultadas
  agentTraces?: Array<{    // Traces dos agentes
    agentId: string;
    calledTools: string[];
    sample: string;
    note: string;
  }>;
}
```

### Resposta do `/health`

```typescript
{
  ok: boolean;
}
```

### Resposta do `/admin/run-daily`

```typescript
{
  status: string;  // "scheduled"
}
```

---

## Dicas de Teste

1. **Comece com consultas simples** para verificar se o fluxo básico funciona
2. **Teste diferentes tipos de documentos** (NF-e, NFC-e, CT-e) para acionar diferentes especialistas
3. **Monitore os logs do servidor** para ver quais agentes e ferramentas foram acionados
4. **Use `jq` para formatar** as respostas JSON e facilitar a leitura
5. **Teste consultas sobre reforma tributária** para acionar o especialista de legislação

---

## Troubleshooting

### Erro 500 na resposta
- Verifique os logs do servidor para detalhes
- Verifique se a chave da API OpenAI é válida
- Verifique se há créditos na conta OpenAI

### Resposta vazia ou sem conteúdo
- Os agentes podem estar consultando vector stores vazios
- Verifique os logs para ver quais ferramentas foram chamadas
- Pode ser necessário configurar vector stores primeiro

### Timeout na resposta
- Consultas complexas podem demorar 30-60 segundos
- O agente pode estar fazendo múltiplas chamadas de ferramentas
- Verifique os logs para ver o progresso
