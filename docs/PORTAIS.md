# Portais Fiscais Monitorados

Este documento descreve os portais fiscais monitorados pelo sistema Tax Virtual Office para detecção automática de novos documentos e atualizações.

## Resumo

O sistema monitora **60+ portais fiscais** organizados em:

- **Portais Nacionais**:
  - Portal Nacional NF-e
  - CONFAZ Ajustes SINIEF
  - **SVRS (16 documentos fiscais)** – 48 seções (3 por documento): Notícias, Documentos, Legislação

- **2 Portais Estaduais**:
  - SEFAZ-SP NFC-e
  - SEFAZ-MG NF-e

**Política: preferir SVRS** – Quando existir mais de um portal cobrindo o mesmo assunto, utilizar preferencialmente o da SVRS.

**Nota sobre SVRS**: A SEFAZ Virtual do Rio Grande do Sul (SVRS) é um autorizador compartilhado utilizado por aproximadamente **metade das Unidades Federativas**. O portal SVRS organiza as informações **por assunto/documento fiscal e por tipo de conteúdo**, com três seções para cada documento:
- **Notícias** (`/{Documento}/Noticias`): Avisos, comunicados e atualizações
- **Documentos** (`/{Documento}/Documentos`): Manuais técnicos, notas técnicas, schemas
- **Legislação** (`/{Documento}/Legislacao`): Leis, decretos e regulamentações

Por isso, configuramos portais separados para cada seção de cada documento fiscal da SVRS.

### 16 Documentos SVRS Monitorados

| Documento | Path | IDs dos portais |
|------------|------|-----------------|
| NFe | /Nfe | svrs-nfe-noticias, svrs-nfe-documentos, svrs-nfe-legislacao |
| NFCe | /Nfce | svrs-nfce-* |
| CTe | /Cte | svrs-cte-* |
| MDFe | /Mdfe | svrs-mdfe-* |
| BPe | /Bpe | svrs-bpe-* |
| NF3e | /Nf3e | svrs-nf3e-* |
| DCe | /Dce | svrs-dce-* |
| NFGas | /Nfgas | svrs-nfgas-* |
| CFF | /Cff | svrs-cff-* |
| NFF | /Nff | svrs-nff-* |
| NFAg | /Nfag | svrs-nfag-* |
| PES | /Pes | svrs-pes-* |
| NFCom | /Nfcom | svrs-nfcom-* |
| ONE | /One | svrs-one-* |
| NFeAB | /Nfabi | svrs-nfeab-* |
| DIFAL | /Difal | svrs-difal-* |

## Configuração

Os portais são configurados em `agents/portals.yaml` e processados pelo agente `tax-portal-watcher` durante a execução diária (`/admin/run-daily` ou via cron).

## Portais Nacionais

### 1. ENCAT NFC-e

- **ID**: `encat-nfce`
- **Nome**: ENCAT NFC-e
- **URL Base**: `https://www.encat.org.br`
- **Caminho de Listagem**: `/nfce-documentos`
- **Tipo**: `nacional`
- **Descrição**: Portal da ENCAT (Entidade Nacional de Coordenação e Acompanhamento da Nota Fiscal de Consumidor Eletrônica) com documentação técnica, notas técnicas e atualizações sobre NFC-e.

**Documentos Esperados**:
- Notas técnicas sobre NFC-e
- Manuais de integração
- Atualizações de layout
- Comunicados oficiais

### 2. Portal Nacional NF-e

- **ID**: `portal-nacional-nfe`
- **Nome**: Portal Nacional NF-e
- **URL Base**: `https://www.nfe.fazenda.gov.br`
- **Caminho de Listagem**: `/portal/listaNoticia.aspx?tipoConteudo=1`
- **Tipo**: `nacional`
- **Descrição**: Portal oficial do Ministério da Fazenda para Nota Fiscal Eletrônica (NF-e modelo 55).

**Documentos Esperados**:
- Notas técnicas oficiais
- Atualizações de layout
- Comunicados e avisos
- Manuais de orientação

### 3. CONFAZ Ajustes SINIEF

- **ID**: `confaz-ajustes-sinief`
- **Nome**: CONFAZ Ajustes SINIEF
- **URL Base**: `https://www.confaz.fazenda.gov.br`
- **Caminho de Listagem**: `/legislacao/ajustes`
- **Tipo**: `nacional`
- **Descrição**: Portal do CONFAZ (Conselho Nacional de Política Fazendária) com ajustes do SINIEF (Sistema Integrado de Informações sobre Operações Interestaduais com Mercadorias e Serviços).

**Documentos Esperados**:
- Ajustes SINIEF
- Convênios ICMS
- Legislação tributária nacional
- Regulamentações sobre documentos fiscais

### 4. SVRS NF-e (SEFAZ Virtual RS)

A SVRS é um **autorizador compartilhado** utilizado por aproximadamente **metade das Unidades Federativas** para autorização de NF-e. O portal organiza as informações em três seções:

#### 4.1. SVRS NF-e Notícias

- **ID**: `svrs-nfe-noticias`
- **Nome**: SVRS NF-e Notícias (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Nfe/Noticias`
- **Tipo**: `nacional`
- **Descrição**: Seção de notícias e avisos sobre NF-e no portal SVRS.

**Documentos Esperados**:
- Avisos e comunicados oficiais
- Atualizações de layout e versões
- Informações sobre Reforma Tributária (IBS/CBS)
- Novidades e mudanças no sistema

**Referência**: [SVRS NF-e Notícias](https://dfe-portal.svrs.rs.gov.br/Nfe/Noticias)

#### 4.2. SVRS NF-e Documentos

- **ID**: `svrs-nfe-documentos`
- **Nome**: SVRS NF-e Documentos (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Nfe/Documentos`
- **Tipo**: `nacional`
- **Descrição**: Seção de documentação técnica sobre NF-e no portal SVRS.

**Documentos Esperados**:
- Notas técnicas (NT) oficiais
- Manuais do contribuinte e de integração
- Schemas XSD oficiais
- Tabelas de validação e códigos
- Guias de implementação
- FAQs e orientações técnicas

**Referência**: [SVRS NF-e Documentos](https://dfe-portal.svrs.rs.gov.br/Nfe/Documentos)

#### 4.3. SVRS NF-e Legislação

- **ID**: `svrs-nfe-legislacao`
- **Nome**: SVRS NF-e Legislação (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Nfe/Legislacao`
- **Tipo**: `nacional`
- **Descrição**: Seção de legislação relacionada a NF-e no portal SVRS.

**Documentos Esperados**:
- Leis e decretos relacionados a NF-e
- Instruções normativas
- Portarias e regulamentações
- Ajustes SINIEF aplicáveis
- Legislação sobre Reforma Tributária (IBS/CBS) relacionada a NF-e

**Referência**: [SVRS NF-e Legislação](https://dfe-portal.svrs.rs.gov.br/Nfe/Legislacao)

**UFs que Utilizam SVRS** (exemplos):
- Rio Grande do Sul (RS)
- Santa Catarina (SC)
- Paraná (PR)
- E outras UFs que optaram pelo autorizador compartilhado

### 5. SVRS NFC-e (SEFAZ Virtual RS)

A SVRS também atua como autorizador compartilhado para NFC-e. O portal organiza as informações em três seções:

#### 5.1. SVRS NFC-e Notícias

- **ID**: `svrs-nfce-noticias`
- **Nome**: SVRS NFC-e Notícias (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Nfce/Noticias`
- **Tipo**: `nacional`
- **Referência**: [SVRS NFC-e Notícias](https://dfe-portal.svrs.rs.gov.br/Nfce/Noticias)

#### 5.2. SVRS NFC-e Documentos

- **ID**: `svrs-nfce-documentos`
- **Nome**: SVRS NFC-e Documentos (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Nfce/Documentos`
- **Tipo**: `nacional`
- **Referência**: [SVRS NFC-e Documentos](https://dfe-portal.svrs.rs.gov.br/Nfce/Documentos)

#### 5.3. SVRS NFC-e Legislação

- **ID**: `svrs-nfce-legislacao`
- **Nome**: SVRS NFC-e Legislação (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Nfce/Legislacao`
- **Tipo**: `nacional`
- **Referência**: [SVRS NFC-e Legislação](https://dfe-portal.svrs.rs.gov.br/Nfce/Legislacao)

### 6. SVRS CT-e (SEFAZ Virtual RS)

A SVRS também atua como autorizador compartilhado para CT-e. O portal organiza as informações em três seções:

#### 6.1. SVRS CT-e Notícias

- **ID**: `svrs-cte-noticias`
- **Nome**: SVRS CT-e Notícias (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Cte/Noticias`
- **Tipo**: `nacional`
- **Referência**: [SVRS CT-e Notícias](https://dfe-portal.svrs.rs.gov.br/Cte/Noticias)

#### 6.2. SVRS CT-e Documentos

- **ID**: `svrs-cte-documentos`
- **Nome**: SVRS CT-e Documentos (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Cte/Documentos`
- **Tipo**: `nacional`
- **Referência**: [SVRS CT-e Documentos](https://dfe-portal.svrs.rs.gov.br/Cte/Documentos)

#### 6.3. SVRS CT-e Legislação

- **ID**: `svrs-cte-legislacao`
- **Nome**: SVRS CT-e Legislação (SEFAZ Virtual RS)
- **URL Base**: `https://dfe-portal.svrs.rs.gov.br`
- **Caminho de Listagem**: `/Cte/Legislacao`
- **Tipo**: `nacional`
- **Referência**: [SVRS CT-e Legislação](https://dfe-portal.svrs.rs.gov.br/Cte/Legislacao)

## Portais Estaduais

### 7. SEFAZ-SP NFC-e

- **ID**: `sefaz-sp-nfc`
- **Nome**: SEFAZ-SP NFC-e
- **URL Base**: `https://portal.fazenda.sp.gov.br`
- **Caminho de Listagem**: `/noticias`
- **Tipo**: `estadual`
- **Descrição**: Portal da Secretaria da Fazenda do Estado de São Paulo com notícias e atualizações sobre NFC-e.

**Documentos Esperados**:
- Notícias sobre NFC-e em SP
- Atualizações específicas do estado
- Orientações para contribuintes de SP

### 8. SEFAZ-MG NF-e

- **ID**: `sefaz-mg-nfe`
- **Nome**: SEFAZ-MG NF-e
- **URL Base**: `https://portal.fazenda.mg.gov.br`
- **Caminho de Listagem**: `/empresas/nfe/noticias`
- **Tipo**: `estadual`
- **Descrição**: Portal da Secretaria de Estado de Fazenda de Minas Gerais com notícias e atualizações sobre NF-e.

**Documentos Esperados**:
- Notícias sobre NF-e em MG
- Atualizações específicas do estado
- Orientações para contribuintes de MG

## Processamento

### Fluxo de Monitoramento

1. **Execução Diária**: O `tax-portal-watcher` é executado diariamente via cron ou manualmente via `POST /admin/run-daily`
2. **Fetch de Páginas**: Para cada portal, faz fetch da página de listagem via `http-fetch`
3. **Extração de Links**: Extrai links e metadados usando regex HTML (`parsePortalListing`)
4. **Deduplicação**: Compara com estado anterior em `agents/.cache/portal-state.json` usando `contentHash`
5. **Classificação**: Novos documentos são classificados pelo `tax-document-classifier`
6. **Upload**: Documentos são baixados e armazenados pelo `tax-document-uploader`

### Metadados Extraídos

Cada documento detectado inclui:
- `portalId`: ID do portal de origem
- `portalType`: `nacional` ou `estadual`
- `title`: Título do documento
- `url`: URL completa do documento
- `publishedAt`: Data de publicação (se disponível)
- `detectedAt`: Timestamp de detecção
- `contentHash`: Hash SHA256 para deduplicação

### Estado de Processamento

O estado é persistido em `agents/.cache/portal-state.json`:
```json
{
  "lastRun": "2025-01-16T08:30:00Z",
  "seen": {
    "encat-nfce": ["hash1", "hash2", ...],
    "portal-nacional-nfe": ["hash3", "hash4", ...]
  }
}
```

## Adicionar Novo Portal

Para adicionar um novo portal:

1. Edite `agents/portals.yaml`:
```yaml
portals:
  - id: novo-portal-id
    name: Nome do Portal
    baseUrl: "https://exemplo.gov.br"
    listingPath: "/caminho/para/listagem"
    type: "nacional|estadual"
```

2. O portal será automaticamente incluído no próximo ciclo de varredura

3. Verifique os logs para confirmar processamento:
```bash
# Ver logs do watcher
docker logs tax-virtual-office-watcher

# Ou em desenvolvimento
npm run dev  # e observar logs do runDailyPortalsScan
```

## Limitações Conhecidas

- **Parsing HTML**: Usa regex simples que pode falhar com HTML complexo ou JavaScript dinâmico
- **Deduplicação**: Baseada em hash de `portalId:url:title` - títulos diferentes podem processar o mesmo documento
- **Frequência**: Varredura diária pode não capturar atualizações em tempo real

## Troubleshooting

### Portal não está retornando documentos

1. Verifique se a URL está acessível:
```bash
curl https://exemplo.gov.br/caminho/listagem
```

2. Verifique logs do watcher:
```bash
# Procurar por erros específicos do portal
grep "novo-portal-id" logs/portal-watcher.log
```

3. Verifique se o HTML mudou (regex pode não estar mais funcionando)

### Documentos duplicados

1. Verifique `agents/.cache/portal-state.json`:
```bash
cat agents/.cache/portal-state.json | jq '.seen["portal-id"]'
```

2. Se necessário, limpe o estado:
```bash
# CUIDADO: Isso fará reprocessar todos os documentos
rm agents/.cache/portal-state.json
```

### Portal retorna muitos documentos antigos

- Isso é esperado na primeira execução
- Documentos antigos serão processados uma vez e depois deduplicados
- Apenas documentos novos serão processados nas execuções seguintes

## Referências

- **Configuração**: `agents/portals.yaml`
- **Código**: `src/agents/maintenance.ts` (função `watchPortals`)
- **Workflow**: `src/workflows/daily-portals-scan.ts`
- **Documentação de Agentes**: `docs/AGENTS.md`
