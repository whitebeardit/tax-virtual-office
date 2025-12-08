/**
 * Tools para o OpenAI Agents SDK
 * 
 * Define as ferramentas que os agentes podem usar, integrando
 * com as implementações MCP existentes.
 */

import { tool } from "@openai/agents";
import { z } from "zod";
import { fileSearch, type FileSearchQuery } from "../mcp/fileSearchTool.js";
import { logger } from "../utils/logger.js";
import { validateUrl } from "../config/allowed-domains.js";
import { getVectorStoresMetadata } from "../mcp/vectorStoresMetadataTool.js";

/**
 * Tool: file-search
 * Busca em vector stores e arquivos locais
 */
export const fileSearchTool = tool({
  name: "file_search",
  description: `Busca em vector stores e arquivos locais para encontrar informações relevantes.
  
Vector stores disponíveis organizados por categoria:

TABELAS (Compartilhadas):
- tabelas-cfop: CFOP compartilhado entre NF-e, NFC-e, CT-e
- tabelas-ncm: NCM compartilhado
- tabelas-meios-pagamento: Meios de pagamento (NF-e, NFC-e)
- tabelas-aliquotas: Alíquotas por UF
- tabelas-codigos: CST, CSOSN, códigos ANP, etc.
- tabelas-ibc-cbs: Tabelas de reforma tributária

TABELAS (Específicas):
- tabelas-nfe-especificas: Tabelas específicas NF-e
- tabelas-nfce-especificas: Tabelas específicas NFC-e

NORMAS TÉCNICAS (por documento):
- normas-tecnicas-nfe: NTs NF-e
- normas-tecnicas-nfce: NTs NFC-e
- normas-tecnicas-cte: NTs CT-e/MDF-e

MANUAIS (por documento):
- manuais-nfe: Manuais NF-e (MOC, etc.)
- manuais-nfce: Manuais NFC-e
- manuais-cte: Manuais CT-e/MDF-e

INFORMES TÉCNICOS (por documento):
- informes-tecnicos-nfe: Informes NF-e
- informes-tecnicos-nfce: Informes NFC-e
- informes-tecnicos-cte: Informes CT-e/MDF-e

SCHEMAS XML (por documento):
- esquemas-xml-nfe: Schemas XSD NF-e
- esquemas-xml-nfce: Schemas XSD NFC-e
- esquemas-xml-cte: Schemas XSD CT-e/MDF-e

AJUSTES SINIEF:
- ajustes-sinief-nfe: Ajustes específicos NF-e
- ajustes-sinief-nfce: Ajustes específicos NFC-e
- ajustes-sinief-geral: Ajustes gerais

CONFAZ:
- convenios-icms: Convênios ICMS
- atos-cotepe: Atos COTEPE

LEGISLAÇÃO:
- legislacao-nacional-ibs-cbs-is: IBS/CBS/IS, EC 132/2023, LC 214/2025
- documentos-estaduais-ibc-cbs: Normas estaduais

JURISPRUDÊNCIA:
- jurisprudencia-tributaria: Pareceres e decisões

Use esta ferramenta PRIMEIRO antes de responder perguntas, especialmente para:
- Normas técnicas e legislação
- Documentos fiscais eletrônicos (NF-e, NFC-e, CT-e)
- Reforma tributária (IBS/CBS/IS)
- Tabelas e códigos fiscais`,
  parameters: z.object({
    vectorStoreId: z
      .string()
      .describe(
        "ID do vector store a consultar (ex: 'legislacao-nacional-ibs-cbs-is', 'normas-tecnicas-nfe-nfce-cte')"
      ),
    query: z
      .string()
      .describe(
        "Query de busca. Seja específico e inclua termos relevantes (ex: 'Nota Técnica IBS CBS NF-e', 'LC 214/2025 artigos')"
      ),
  }),
  async execute({ vectorStoreId, query }) {
    logger.info(
      { vectorStoreId, query },
      "[file-search] Executando busca em vector store"
    );

    try {
      const results = await fileSearch({
        vectorStoreId,
        query,
      });

      if (results.length === 0) {
        return `Nenhum resultado encontrado no vector store '${vectorStoreId}' para a query: "${query}". Tente termos diferentes ou verifique se o vector store está correto.`;
      }

      return `Encontrados ${results.length} resultado(s) no vector store '${vectorStoreId}':\n\n${results.join("\n\n")}`;
    } catch (error) {
      logger.error({ error, vectorStoreId, query }, "[file-search] Erro");
      return `Erro ao buscar no vector store '${vectorStoreId}': ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Tool: web
 * Consulta sites oficiais (domínios permitidos conforme config/document-sources.json)
 */
export const webTool = tool({
  name: "web",
  description: `Consulta sites oficiais para obter dados objetivos (datas, números de lei, URLs oficiais).
  
Domínios permitidos (conforme config/document-sources.json):
- *.gov.br (todos os domínios do governo brasileiro)
- *.fazenda.gov.br (Ministério da Fazenda)
- *.fazenda.sp.gov.br (SEFAZ-SP)
- *.fazenda.mg.gov.br (SEFAZ-MG)
- dfe-portal.svrs.rs.gov.br (SVRS - SEFAZ Virtual Rio Grande do Sul, autorizador compartilhado)
- encat.org.br (ENCAT - Entidade Nacional de Coordenação e Acompanhamento da NFC-e)
- confaz.fazenda.gov.br (CONFAZ - Conselho Nacional de Política Fazendária)

Portais principais:
- Portal Nacional NF-e: www.nfe.fazenda.gov.br
- SVRS NF-e/NFC-e/CT-e/MDF-e: dfe-portal.svrs.rs.gov.br
- CONFAZ: www.confaz.fazenda.gov.br
- ENCAT: www.encat.org.br

Use APENAS para:
- Verificar datas de publicação
- Obter números de lei/NT
- Validar URLs oficiais
- Confirmar informações objetivas

NUNCA use para conteúdo interpretativo ou de blogs/consultorias privadas.`,
  parameters: z.object({
    url: z
      .string()
      .min(1)
      .describe(
        "URL completa do site oficial a consultar (deve começar com http:// ou https:// e ser um domínio permitido conforme config/document-sources.json). Exemplo: https://www.nfe.fazenda.gov.br/portal"
      ),
    query: z
      .string()
      .nullable()
      .optional()
      .describe("Query específica ou termo a buscar na página (opcional)"),
  }),
  async execute({ url, query }) {
    // Validar formato de URL primeiro
    try {
      new URL(url);
    } catch {
      return `Erro: URL inválida: "${url}". Forneça uma URL válida começando com http:// ou https://`;
    }

    // Validar domínio usando configuração centralizada
    const validation = validateUrl(url);
    if (!validation.valid) {
      logger.warn({ url, error: validation.error }, "[web] URL não permitida");
      return validation.error || `URL '${url}' não é um domínio oficial permitido.`;
    }

    logger.info({ url, query }, "[web] Consultando site oficial");

    try {
      // TODO: Implementar chamada real ao http-fetch quando disponível
      // Por enquanto, retorna placeholder
      return `Consulta ao site oficial '${url}'${query ? ` com query: "${query}"` : ""}. 
      
Nota: Implementação completa do web tool requer integração com http-fetch MCP tool.
Por enquanto, use file-search como fonte primária de informação.`;
    } catch (error) {
      logger.error({ error, url, query }, "[web] Erro");
      return `Erro ao consultar '${url}': ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Tool: logger
 * Registra decisões e informações importantes
 */
export const loggerTool = tool({
  name: "logger",
  description: `Registra decisões importantes, chamadas de ferramentas e informações para auditoria.
  
Use para:
- Registrar especialistas acionados
- Logar vector stores consultados
- Documentar decisões de encaminhamento
- Registrar ausência de base documental`,
  parameters: z.object({
    level: z
      .enum(["info", "warn", "error"])
      .default("info")
      .describe("Nível do log"),
    message: z.string().describe("Mensagem a registrar"),
    metadata: z
      .record(z.string(), z.string())
      .nullable()
      .optional()
      .describe(
        "Metadados adicionais em formato chave-valor (string -> string). Converta objetos complexos para JSON antes de enviar."
      ),
  }),
  async execute({ level, message, metadata }) {
    logger[level]({ metadata }, `[agent-logger] ${message}`);
    return `Log registrado: ${message}`;
  },
});

/**
 * Tool: vector-stores-metadata
 * Retorna a lista de vector stores disponíveis
 */
export const vectorStoresMetadataTool = tool({
  name: "vector-stores-metadata",
  description: `Retorna a lista completa de vector stores disponíveis configurados em agents/vectorstores.yaml.
  
Use esta ferramenta para consultar quais vector stores estão disponíveis antes de classificar um documento.
Retorna uma lista com id e description de cada vector store.`,
  parameters: z.object({}),
  async execute() {
    logger.info({}, "[vector-stores-metadata] Consultando vector stores disponíveis");

    try {
      const stores = getVectorStoresMetadata();
      
      if (stores.length === 0) {
        return "Nenhum vector store configurado em agents/vectorstores.yaml.";
      }

      const formatted = stores
        .map((store) => `- ${store.id}: ${store.description}`)
        .join("\n");

      return `Vector stores disponíveis (${stores.length}):\n\n${formatted}`;
    } catch (error) {
      logger.error({ error }, "[vector-stores-metadata] Erro");
      return `Erro ao consultar vector stores: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Lista de todas as tools disponíveis
 */
export const coordinatorTools = [fileSearchTool, webTool, loggerTool];

export const specialistTools = [fileSearchTool, loggerTool];

export const classifierTools = [vectorStoresMetadataTool, loggerTool];
