# Guia de Testes - Tax Virtual Office

Este documento descreve como testar o projeto localmente e verificar se está funcionando corretamente.

## Pré-requisitos

1. **Node.js 20+** instalado
2. **Variáveis de ambiente** configuradas no arquivo `.env`:
   - `OPENAI_API_KEY`: Chave da API OpenAI (obrigatória)
   - `APP_MODE`: `api` (padrão) ou `daily-portals-scan`
   - `PORT`: Porta do servidor HTTP (padrão: 3000)

## Passo 1: Verificar Configuração

```bash
# Verificar se as dependências estão instaladas
npm list --depth=0

# Verificar se o arquivo .env existe e tem a chave da API
cat .env | grep OPENAI_API_KEY

# Compilar o projeto TypeScript (se necessário)
npm run build
```

## Passo 2: Iniciar o Servidor

### Modo API (Recomendado para testes)

```bash
# Iniciar o servidor em modo desenvolvimento
npm run dev

# Ou iniciar o servidor compilado
npm start
```

O servidor deve iniciar na porta 3000 (ou a porta configurada em `PORT`).

Você deve ver a mensagem:
```
HTTP server running on port 3000
```

## Passo 3: Testar Endpoints

### 3.1. Health Check (Teste Básico)

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{"ok": true}
```

### 3.2. Teste de Consulta Simples

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "O que é uma NF-e?",
    "context": "Teste básico de funcionamento"
  }'
```

**Resposta esperada:**
```json
{
  "answer": "...",
  "plan": [...],
  "sources": [...],
  "agentTraces": [...]
}
```

### 3.3. Teste de Consulta Específica (NF-e)

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o prazo para cancelar uma NF-e?",
    "context": "Empresa precisa cancelar nota emitida há 2 dias"
  }'
```

### 3.4. Teste de Consulta sobre Reforma Tributária

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Como funciona o IBS na reforma tributária?",
    "context": "Consulta sobre reforma tributária"
  }'
```

## Passo 4: Testar Varredura de Portais (Opcional)

```bash
curl -X POST http://localhost:3000/admin/run-daily
```

**Nota:** Este endpoint pode demorar alguns minutos, pois faz fetch de múltiplos portais fiscais.

## Passo 5: Verificar Logs

Durante os testes, observe os logs do console para verificar:

1. **Inicialização do servidor**: `HTTP server running on port 3000`
2. **Chamadas de agentes**: Logs do coordinator e especialistas
3. **Chamadas de ferramentas**: Logs de `file-search`, `logger`, etc.
4. **Erros**: Qualquer erro deve aparecer no console

## Testes Automatizados (Script)

Execute o script de teste:

```bash
chmod +x scripts/test-local.sh
./scripts/test-local.sh
```

Ou use o script Node.js:

```bash
node scripts/test-local.js
```

## Checklist de Validação

- [ ] Servidor inicia sem erros
- [ ] Endpoint `/health` retorna `{"ok": true}`
- [ ] Endpoint `/query` responde com estrutura JSON válida
- [ ] Resposta contém campo `answer` não vazio
- [ ] Resposta contém campo `sources` (pode estar vazio inicialmente)
- [ ] Resposta contém campo `plan` (pode estar vazio inicialmente)
- [ ] Logs mostram chamadas aos agentes
- [ ] Não há erros no console

## Problemas Comuns

### Erro: "OPENAI_API_KEY is not set"

**Solução:** Verifique se o arquivo `.env` existe e contém `OPENAI_API_KEY=sk-...`

### Erro: "Cannot find module"

**Solução:** 
```bash
npm install
npm run build
```

### Erro: "Port 3000 already in use"

**Solução:** 
- Altere a porta no `.env`: `PORT=3001`
- Ou pare o processo que está usando a porta 3000

### Resposta vazia ou erro 500

**Possíveis causas:**
1. Chave da API OpenAI inválida ou sem créditos
2. Problema de conexão com a API OpenAI
3. Erro no código dos agentes

**Solução:**
- Verifique os logs do console para detalhes do erro
- Teste a chave da API diretamente com a OpenAI
- Verifique se há erros de compilação TypeScript

## Próximos Passos

Após validar que o projeto está funcionando:

1. **Configurar Vector Stores**: Adicionar documentos fiscais aos vector stores
2. **Configurar Portais**: Adicionar portais fiscais em `agents/portals.yaml`
3. **Monitorar Logs**: Configurar sistema de logging estruturado
4. **Adicionar Testes Unitários**: Criar testes automatizados para componentes críticos

## Referências

- [Documentação de Agentes](docs/AGENTS.md)
- [Documentação de Workflows](docs/WORKFLOWS.md)
- [README Principal](README.md)
