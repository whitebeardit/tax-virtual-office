# Como Rodar e Testar o Projeto Localmente

## 1. Preparar o Ambiente

```bash
# Certifique-se de que as dependências estão instaladas
npm install

# Compile o projeto TypeScript
npm run build
```

## 2. Verificar Configuração

Certifique-se de que o arquivo `.env` existe e contém:

```bash
APP_MODE=api
PORT=3000
OPENAI_API_KEY=sk-sua-chave-aqui
```

## 3. Iniciar o Servidor

Em um terminal, execute:

```bash
npm start
```

Você deve ver:
```
HTTP server running on port 3000
```

**OU** para desenvolvimento com rebuild automático:

```bash
npm run dev
```

## 4. Testar com CURL

Agora você pode testar os endpoints em outro terminal. 

**📋 Veja todas as rotas disponíveis em: [ROTAS_DISPONIVEIS.md](ROTAS_DISPONIVEIS.md)**

Aqui estão os comandos básicos:

### Teste 1: Health Check (Básico)

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{"ok":true}
```

### Teste 2: Consulta Simples

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é uma NF-e?",
    "context": "Teste básico"
  }'
```

### Teste 3: Consulta sobre Prazo de Cancelamento de NF-e

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o prazo para cancelar uma NF-e?",
    "context": "Empresa precisa cancelar nota emitida há 2 dias"
  }'
```

### Teste 4: Consulta sobre NFC-e

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Como funciona a emissão de NFC-e?",
    "context": "Dúvida sobre NFC-e"
  }'
```

### Teste 5: Consulta sobre Reforma Tributária (IBS/CBS)

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Como funciona o IBS na reforma tributária?",
    "context": "Consulta sobre reforma tributária"
  }'
```

### Teste 6: Varredura de Portais (Admin)

```bash
curl -X POST http://localhost:3000/admin/run-daily
```

**Nota:** Este endpoint pode demorar alguns minutos.

## 5. Ver Resposta Formatada (Opcional)

Para ver a resposta JSON formatada, use `jq`:

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

## Estrutura da Resposta

A resposta do endpoint `/query` tem esta estrutura:

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

## Troubleshooting

### Servidor não inicia

- Verifique se a porta 3000 está livre: `lsof -i :3000`
- Verifique se o arquivo `.env` existe e tem `OPENAI_API_KEY`
- Verifique os logs de erro no console

### Erro 500 na resposta

- Verifique os logs do servidor para detalhes do erro
- Verifique se a chave da API OpenAI é válida
- Verifique se há créditos na conta OpenAI

### Resposta vazia ou sem conteúdo

- Os agentes podem estar consultando vector stores vazios
- Verifique os logs para ver quais ferramentas foram chamadas
- Pode ser necessário configurar vector stores primeiro

## Próximos Passos

Após validar que está funcionando:

1. Configure vector stores com documentos fiscais
2. Configure portais em `agents/portals.yaml`
3. Teste consultas mais complexas
4. Monitore os logs para entender o fluxo dos agentes
