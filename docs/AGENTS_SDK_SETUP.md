# Setup do OpenAI Agents SDK - Guia Rápido

## Instalação

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará o pacote `@openai/agents` adicionado ao `package.json`.

### 2. Verificar Variáveis de Ambiente

Certifique-se de que `OPENAI_API_KEY` está configurado:

```bash
# No arquivo .env
OPENAI_API_KEY=sk-...
```

### 3. Compilar o Projeto

```bash
npm run build
```

## Verificação

### 1. Testar Localmente

```bash
npm run dev
```

### 2. Fazer uma Query de Teste

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o prazo de cancelamento de NF-e?",
    "context": "Teste de tracing"
  }'
```

### 3. Verificar Traces no Dashboard

1. Acesse: https://platform.openai.com/logs
2. Faça login com sua conta OpenAI
3. Você deve ver os traces da execução

**Nota**: Pode levar alguns segundos para os traces aparecerem.

## Troubleshooting

### Erro: "Cannot find module '@openai/agents'"

```bash
npm install @openai/agents
```

### Erro: "OPENAI_API_KEY is not set"

Verifique se a variável está configurada:

```bash
echo $OPENAI_API_KEY
```

Ou no arquivo `.env`:

```bash
cat .env | grep OPENAI_API_KEY
```

### Traces não aparecem no dashboard

1. **Verificar permissões:**
   - Você precisa ser owner da organização ou ter acesso ao Traces dashboard
   - Settings → Data Controls → Verificar permissões

2. **Verificar se tracing está desabilitado:**
   ```bash
   echo $OPENAI_AGENTS_DISABLE_TRACING
   # Não deve ser "1"
   ```

3. **Aguardar alguns segundos:**
   - Traces podem levar alguns segundos para aparecer

4. **Verificar se a API key está correta:**
   - A API key deve estar associada à conta que você está usando para acessar o dashboard

### Erro de Compilação TypeScript

Se houver erros de tipo, verifique:

1. Versão do TypeScript:
   ```bash
   npx tsc --version
   # Deve ser >= 5.0
   ```

2. Limpar e recompilar:
   ```bash
   rm -rf dist node_modules
   npm install
   npm run build
   ```

## Estrutura de Traces

Cada execução de agente cria um trace que inclui:

- **Input**: Prompt completo enviado ao agente
- **Output**: Resposta final do agente
- **Model**: Modelo usado (ex: `gpt-4o`)
- **Tokens**: Tokens de input e output
- **Latency**: Tempo de execução
- **Metadata**: Informações adicionais

## Próximos Passos

1. ✅ Instalar dependências
2. ✅ Compilar projeto
3. ✅ Testar localmente
4. ✅ Verificar traces no dashboard
5. ⏭️ Migrar outros agentes (opcional)
6. ⏭️ Configurar alertas/monitoramento (opcional)

## Referências

- [Documentação do Agents SDK](https://openai.github.io/openai-agents-js/)
- [Guia de Tracing](https://openai.github.io/openai-agents-python/tracing/)
- [Dashboard de Traces](https://platform.openai.com/logs)
