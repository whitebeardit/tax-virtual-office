# Domínios Permitidos para Web Tool

## Configuração Centralizada

Os domínios permitidos para consulta via `web` tool são definidos em **`config/document-sources.json`**.

Esta configuração centralizada garante:
- ✅ Consistência entre diferentes partes do sistema
- ✅ Fácil manutenção e atualização
- ✅ Documentação clara dos domínios oficiais
- ✅ Validação automática de URLs

## Domínios Permitidos

### Domínios Genéricos

1. **`*.gov.br`**
   - Todos os domínios do governo brasileiro
   - Exemplos: `www.fazenda.gov.br`, `www.receita.fazenda.gov.br`

2. **`*.fazenda.gov.br`**
   - Domínios do Ministério da Fazenda
   - Exemplos: `www.nfe.fazenda.gov.br`, `www.confaz.fazenda.gov.br`

3. **`*.fazenda.sp.gov.br`**
   - Domínios da SEFAZ de São Paulo
   - Exemplo: `portal.fazenda.sp.gov.br`

4. **`*.fazenda.mg.gov.br`**
   - Domínios da SEFAZ de Minas Gerais
   - Exemplo: `portal.fazenda.mg.gov.br`

### Domínios Específicos

5. **`dfe-portal.svrs.rs.gov.br`**
   - **SVRS (SEFAZ Virtual Rio Grande do Sul)**
   - Autorizador compartilhado usado por aproximadamente **metade das Unidades Federativas**
   - Portal organiza informações por documento fiscal e tipo de conteúdo:
     - **NF-e**: `/Nfe/Noticias`, `/Nfe/Documentos`, `/Nfe/Legislacao`
     - **NFC-e**: `/Nfce/Noticias`, `/Nfce/Documentos`, `/Nfce/Legislacao`
     - **CT-e**: `/Cte/Noticias`, `/Cte/Documentos`, `/Cte/Legislacao`
     - **MDF-e**: `/Mdfe/Noticias`, `/Mdfe/Documentos`, `/Mdfe/Legislacao`

6. **`encat.org.br`**
   - **ENCAT** (Entidade Nacional de Coordenação e Acompanhamento da NFC-e)
   - Portal com documentação técnica sobre NFC-e
   - Exemplo: `www.encat.org.br`

7. **`confaz.fazenda.gov.br`**
   - **CONFAZ** (Conselho Nacional de Política Fazendária)
   - Portal com ajustes SINIEF e legislação tributária
   - Exemplo: `www.confaz.fazenda.gov.br`

## Portais Principais

| Portal | URL Base | Domínio | Tipo |
|--------|----------|---------|------|
| NF-e | https://www.nfe.fazenda.gov.br/portal | nfe.fazenda.gov.br | Nacional |
| NF-e SVRS | https://dfe-portal.svrs.rs.gov.br | dfe-portal.svrs.rs.gov.br | Nacional |
| NFC-e SVRS | https://dfe-portal.svrs.rs.gov.br | dfe-portal.svrs.rs.gov.br | Nacional |
| MDF-e SVRS | https://dfe-portal.svrs.rs.gov.br | dfe-portal.svrs.rs.gov.br | Nacional |
| CONFAZ | https://www.confaz.fazenda.gov.br | confaz.fazenda.gov.br | Nacional |

## Uso no Web Tool

O `web` tool valida automaticamente se a URL pertence a um domínio permitido:

```typescript
import { validateUrl } from "../config/allowed-domains.js";

const validation = validateUrl(url);
if (!validation.valid) {
  return validation.error; // Retorna mensagem de erro
}
```

## Adicionar Novo Domínio

Para adicionar um novo domínio permitido:

1. **Editar `config/document-sources.json`**:
   ```json
   {
     "allowedDomains": {
       "domains": [
         {
           "pattern": "novo-dominio.gov.br",
           "description": "Descrição do domínio",
           "examples": ["www.novo-dominio.gov.br"]
         }
       ]
     }
   }
   ```

   **Nota**: O código em `src/config/allowed-domains.ts` lê automaticamente do JSON. Não é necessário editar o código TypeScript manualmente. O padrão será validado automaticamente pela função `isAllowedDomain()` que verifica os padrões definidos no JSON.

2. **Atualizar documentação**:
   - Adicionar entrada nesta documentação
   - Atualizar descrição do `web` tool em `src/agents/tools.ts` (se necessário)

## Validação

A validação é feita em tempo de execução:

- ✅ Verifica formato da URL
- ✅ Verifica se o domínio está na lista permitida
- ✅ Retorna mensagem de erro clara se não permitido
- ✅ Loga tentativas de acesso a domínios não permitidos

## Referências

- `config/document-sources.json` - Configuração centralizada
- `src/config/allowed-domains.ts` - Lógica de validação
- `src/agents/tools.ts` - Implementação do web tool
- `agents/portals.yaml` - Lista completa de portais monitorados
- `docs/PORTAIS.md` - Documentação detalhada dos portais
