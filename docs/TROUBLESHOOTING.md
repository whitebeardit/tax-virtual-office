# Troubleshooting - Agents SDK

## Erro: "Invalid schema for function 'web': 'uri' is not a valid format"

### Problema
O OpenAI Agents SDK não aceita o formato `uri` no JSON Schema gerado pelo Zod quando usa `.url()`.

### Solução
Remover `.url()` do schema Zod e fazer validação manual no `execute`:

```typescript
// ❌ NÃO FUNCIONA
parameters: z.object({
  url: z.string().url(), // Gera formato 'uri' que não é aceito
}),

// ✅ FUNCIONA
parameters: z.object({
  url: z.string().min(1).describe("URL completa..."),
}),
async execute({ url }) {
  // Validar manualmente
  try {
    new URL(url);
  } catch {
    return "Erro: URL inválida";
  }
  // ... resto da validação
}
```

### Status
✅ Corrigido em `src/agents/tools.ts`

## Erro: "Zod field uses `.optional()` without `.nullable()`"

### Problema
O Agents SDK requer que campos opcionais usem `.nullable().optional()`.

### Solução
```typescript
// ❌ NÃO FUNCIONA
query: z.string().optional(),

// ✅ FUNCIONA
query: z.string().nullable().optional(),
```

### Status
✅ Corrigido em `src/agents/tools.ts`

## Erro: "Invalid schema for function 'logger': schema must have a 'type' key"

### Problema
O OpenAI Agents SDK não aceita `z.record(z.any())` porque gera um schema JSON inválido sem `type` explícito no `additionalProperties`.

### Solução
Usar `z.record(z.string(), z.unknown())` ao invés de `z.record(z.any())`:

```typescript
// ❌ NÃO FUNCIONA
metadata: z.record(z.any()).nullable().optional(),

// ✅ FUNCIONA
metadata: z.record(z.string(), z.unknown()).nullable().optional(),
```

### Status
✅ Corrigido em `src/agents/tools.ts`
