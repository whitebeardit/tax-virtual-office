# Vector Stores

Este documento descreve os vector stores utilizados pelo Tax Virtual Office, alinhados ao **tax-agent-hub** (topologia por **capacidade + família**).

## Visão Geral

Vector stores são repositórios de conhecimento com embeddings para busca semântica. A topologia atual usa **12 stores estáveis** definidos em `agents/vectorstores.yaml` e resolvidos pelo hub via `/api/upload-status/mappings`.

## Os 12 Vector Stores

| Store ID                 | Capacidade / Família |
| ------------------------ | -------------------- |
| `vs_specs_mercadorias`   | NF-e, NFC-e: MOC, NT, manuais, regras técnicas |
| `vs_specs_transporte`    | CT-e, MDF-e, BP-e |
| `vs_specs_utilities`     | NF3-e, NFCom, NF-Gás, NFAg |
| `vs_specs_plataformas`   | NFF, PES, CFF, ONE, DIFAL |
| `vs_specs_declaracoes`   | DC-e |
| `vs_schemas_xsd`         | Todos XSDs, exemplos XML (transversal) |
| `vs_legal_federal`       | LC/leis/decretos, Reforma IBS/CBS/IS |
| `vs_legal_confaz`        | Ajustes SINIEF, Convênios ICMS, Atos COTEPE |
| `vs_legal_estados`       | Normas por UF |
| `vs_jurisprudencia`      | Jurisprudência, pareceres, soluções de consulta |
| `vs_tabelas_fiscais`     | CFOP, NCM, meios pagamento, códigos, alíquotas (transversal) |
| `vs_changelog_normativo` | Diffs, timelines, prazos (futuro) |

## Fluxo Coordinator → Triage → Source Planner → Especialistas

1. **Coordinator** recebe a pergunta e pode acionar **Triage/Router** para classificar intenção (trilha), família e doc_type.
2. **Source Planner** indica quais dos 12 stores consultar e em que ordem (primário → secundário).
3. **Especialistas por capacidade** consultam os stores:
   - **spec-mercadorias**: `vs_specs_mercadorias`, `vs_schemas_xsd`, `vs_tabelas_fiscais`, (opcional `vs_legal_confaz`)
   - **spec-transporte**: `vs_specs_transporte`, `vs_schemas_xsd`, `vs_tabelas_fiscais`, `vs_legal_confaz`
   - **legislacao-ibs-cbs**: `vs_legal_federal`, `vs_legal_confaz`, `vs_legal_estados`, `vs_jurisprudencia`

## Classificação de Documentos

O `tax-document-classifier` retorna **apenas um dos 12 store ids**. Heurísticas e mapeamento legado (ids antigos → novos) estão em `src/agents/maintenance.ts` (`LEGACY_TO_NEW_STORE_ID`, `tryMapInvalidVectorStoreId`).

## Consulta via file-search

Os agentes usam a ferramenta `file-search` com um único `vectorStoreId` por chamada. Para consultar vários stores, o especialista faz múltiplas chamadas (ordem sugerida nos prompts).

## Referências

- **Configuração**: `agents/vectorstores.yaml`
- **Mapeamento real (OpenAI)**: API do hub `GET /api/upload-status/mappings`
- **Resolução de id**: `src/mcp/vectorStoreMapping.ts`
- **Classifier e heurísticas**: `src/agents/maintenance.ts`
- **Documentação de Agentes**: [docs/AGENTS.md](AGENTS.md)
