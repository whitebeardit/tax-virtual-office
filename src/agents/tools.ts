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
import { validateUrl, getOfficialSiteUrl, extractDocumentTypeFromUrl } from "../config/allowed-domains.js";
import { getVectorStoresMetadata } from "../mcp/vectorStoresMetadataTool.js";
import { lookupSchema, findRelatedSchemas } from "../mcp/schemaLookupTool.js";
import { httpFetch } from "../mcp/httpFetchTool.js";

/**
 * Tool: file-search
 * Busca em vector stores e arquivos locais
 */
export const fileSearchTool = tool({
  name: "file_search",
  description: `Busca em vector stores e arquivos locais para encontrar informações relevantes.
  
IMPORTANTE: Os documentos armazenados contêm metadados com URLs originais (campo fonte_oficial).
Quando os resultados incluírem informações sobre documentos, SEMPRE inclua a URL original quando disponível nos metadados.
Se a URL não estiver explícita no resultado, mas você souber que o documento tem uma URL original armazenada, mencione que a URL está disponível nos metadados do documento.

Vector stores disponíveis (12 stores por capacidade + família):

ESPECIFICAÇÕES POR FAMÍLIA:
- vs_specs_mercadorias: NF-e, NFC-e (MOC, NT, manuais)
- vs_specs_transporte: CT-e, MDF-e, BP-e
- vs_specs_utilities: NF3-e, NFCom, NF-Gás, NFAg
- vs_specs_plataformas: NFF, PES, CFF, ONE, DIFAL
- vs_specs_declaracoes: DC-e

SCHEMAS E TABELAS (transversal):
- vs_schemas_xsd: Todos XSDs, exemplos XML
- vs_tabelas_fiscais: CFOP, NCM, meios pagamento, códigos, alíquotas, IBS/CBS

LEGAL:
- vs_legal_federal: LC/leis/decretos, Reforma IBS/CBS/IS
- vs_legal_confaz: Ajustes SINIEF, Convênios ICMS, Atos COTEPE
- vs_legal_estados: Normas por UF
- vs_jurisprudencia: Jurisprudência, pareceres

OUTROS:
- vs_changelog_normativo: Diffs, timelines, prazos

Use esta ferramenta PRIMEIRO antes de responder perguntas, especialmente para:
- Normas técnicas e legislação
- Documentos fiscais eletrônicos (NF-e, NFC-e, CT-e)
- Reforma tributária (IBS/CBS/IS)
- Tabelas e códigos fiscais

Ao apresentar resultados, SEMPRE inclua URLs dos documentos originais quando disponíveis nos metadados.`,
  parameters: z.object({
    vectorStoreId: z
      .string()
      .describe(
        "ID do vector store a consultar (ex: 'vs_specs_mercadorias', 'vs_schemas_xsd', 'vs_legal_confaz')"
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
 * Valida uma URL usando websearch (tentativa de acesso HTTP)
 * Retorna status de validação e URL alternativa do site oficial se inválida
 */
async function validateUrlWithWebSearch(url: string): Promise<{
  valid: boolean;
  accessible: boolean;
  alternativeUrl?: string;
  error?: string;
}> {
  // Primeiro, validar formato e domínio
  const domainValidation = validateUrl(url);
  if (!domainValidation.valid) {
    // Tentar obter URL alternativa do site oficial
    const urlInfo = extractDocumentTypeFromUrl(url);
    const alternativeUrl = getOfficialSiteUrl(urlInfo.type, urlInfo.portalId);
    
    return {
      valid: false,
      accessible: false,
      alternativeUrl: alternativeUrl || undefined,
      error: domainValidation.error,
    };
  }

  // Tentar acessar a URL para verificar se está disponível
  try {
    await httpFetch(url);
    return {
      valid: true,
      accessible: true,
    };
  } catch (error) {
    // URL não está acessível, mas é de domínio permitido
    // Retornar URL alternativa do site oficial
    const urlInfo = extractDocumentTypeFromUrl(url);
    const alternativeUrl = getOfficialSiteUrl(urlInfo.type, urlInfo.portalId);
    
    logger.warn(
      { url, error: error instanceof Error ? error.message : String(error) },
      "[validateUrlWithWebSearch] URL não acessível"
    );
    
    return {
      valid: true, // Domínio é válido
      accessible: false,
      alternativeUrl: alternativeUrl || undefined,
      error: `URL não está acessível: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function extractSnippetsFromContent(
  content: string,
  query: string,
  options?: { maxSnippets?: number; contextChars?: number; maxTotalChars?: number }
): { found: boolean; snippets: string[] } {
  const maxSnippets = options?.maxSnippets ?? 3;
  const contextChars = options?.contextChars ?? 240;
  const maxTotalChars = options?.maxTotalChars ?? 2000;

  const q = query.trim();
  if (!q) return { found: false, snippets: [] };

  const hay = content;
  const hayLower = hay.toLowerCase();
  const needleLower = q.toLowerCase();

  const snippets: string[] = [];
  let fromIndex = 0;
  let totalChars = 0;

  while (snippets.length < maxSnippets) {
    const idx = hayLower.indexOf(needleLower, fromIndex);
    if (idx === -1) break;

    const start = Math.max(0, idx - contextChars);
    const end = Math.min(hay.length, idx + needleLower.length + contextChars);

    let snippet = hay.slice(start, end).replace(/\s+/g, " ").trim();

    // Evitar explodir tamanho total
    if (snippet.length + totalChars > maxTotalChars) {
      const remaining = Math.max(0, maxTotalChars - totalChars);
      snippet = snippet.slice(0, remaining).trim();
    }

    if (snippet.length > 0) {
      const prefix = start > 0 ? "…" : "";
      const suffix = end < hay.length ? "…" : "";
      snippets.push(`${prefix}${snippet}${suffix}`);
      totalChars += snippet.length;
    }

    if (totalChars >= maxTotalChars) break;

    fromIndex = idx + needleLower.length;
  }

  return { found: snippets.length > 0, snippets };
}

/**
 * Tool: web
 * Consulta sites oficiais (domínios permitidos conforme config/document-sources.json)
 */
export const webTool = tool({
  name: "web",
  description: `Consulta sites oficiais para obter dados objetivos (datas, números de lei, URLs oficiais).
  
IMPORTANTE: Esta ferramenta valida URLs usando websearch antes de retornar ao usuário.
Se uma URL não estiver acessível, uma URL alternativa do site oficial será fornecida.

Domínios permitidos (conforme config/document-sources.json):
- *.gov.br (todos os domínios do governo brasileiro)
- *.cgibs.gov.br (CGIBS - Comitê Gestor do IBS)
- *.fazenda.gov.br (Ministério da Fazenda)
- *.fazenda.sp.gov.br (SEFAZ-SP)
- *.fazenda.mg.gov.br (SEFAZ-MG)
- dfe-portal.svrs.rs.gov.br (SVRS - SEFAZ Virtual Rio Grande do Sul, autorizador compartilhado)
- confaz.fazenda.gov.br (CONFAZ - Conselho Nacional de Política Fazendária)
- lookerstudio.google.com (somente relatório Pré-CGIBS; restrito por path)

Portais principais:
- Portal Nacional NF-e: https://www.nfe.fazenda.gov.br/portal
- SVRS NF-e/NFC-e/CT-e/MDF-e: https://dfe-portal.svrs.rs.gov.br
- CONFAZ: https://www.confaz.fazenda.gov.br

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
    // Validar e verificar acessibilidade da URL
    const validation = await validateUrlWithWebSearch(url);
    
    if (!validation.valid) {
      logger.warn({ url, error: validation.error }, "[web] URL não permitida");
      
      if (validation.alternativeUrl) {
        return `${validation.error}\n\nRecomendação: Acesse o site oficial diretamente: ${validation.alternativeUrl}`;
      }
      
      return validation.error || `URL '${url}' não é um domínio oficial permitido.`;
    }
    
    if (!validation.accessible) {
      logger.warn({ url, error: validation.error }, "[web] URL não acessível");
      
      if (validation.alternativeUrl) {
        return `A URL '${url}' não está acessível no momento.\n\nRecomendação: Acesse o site oficial diretamente: ${validation.alternativeUrl}`;
      }
      
      return `A URL '${url}' não está acessível: ${validation.error || "Erro desconhecido"}`;
    }

    logger.info({ url, query }, "[web] Consultando site oficial");

    try {
      // Fazer requisição real à URL
      const content = await httpFetch(url);
      
      // Se houver query, tentar buscar no conteúdo e retornar trechos curtos (snippets)
      if (query) {
        const { found, snippets } = extractSnippetsFromContent(content, query, {
          maxSnippets: 3,
          contextChars: 240,
          maxTotalChars: 2000,
        });

        if (!found) {
          return `Consulta ao site oficial '${url}' com query: "${query}".\n\nA query não foi encontrada no conteúdo da página. Verifique a URL ou tente termos diferentes.`;
        }

        const formatted = snippets.map((s, i) => `${i + 1}) ${s}`).join("\n\n");
        return `Consulta ao site oficial '${url}' com query: "${query}".\n\nTrechos encontrados (HTML/texto):\n\n${formatted}`;
      }
      
      return `Consulta ao site oficial '${url}' realizada com sucesso.\n\nConteúdo da página obtido. Use file-search para informações mais detalhadas dos documentos armazenados.`;
    } catch (error) {
      logger.error({ error, url, query }, "[web] Erro ao consultar");
      
      // Tentar fornecer URL alternativa
      const urlInfo = extractDocumentTypeFromUrl(url);
      const alternativeUrl = getOfficialSiteUrl(urlInfo.type, urlInfo.portalId);
      
      let errorMessage = `Erro ao consultar '${url}': ${error instanceof Error ? error.message : String(error)}`;
      
      if (alternativeUrl) {
        errorMessage += `\n\nRecomendação: Acesse o site oficial diretamente: ${alternativeUrl}`;
      }
      
      return errorMessage;
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
 * Tool: schema-lookup
 * Busca exata de schemas XSD por nome antes de usar busca semântica
 */
export const schemaLookupTool = tool({
  name: "schema_lookup",
  description: `Busca EXATA de schemas XSD por nome usando índice local.
  
Use esta ferramenta ANTES de file-search quando o usuário mencionar:
- Nomes específicos de schemas (ex: "consReciNFe_v4.00.xsd", "procNFe_v4.00.xsd")
- Estruturas XML específicas (ex: "consulta de recibo", "retorno de consulta")
- Elementos de schema (ex: "elemento consReciNFe", "campo nRec")

Esta tool faz busca exata por nome, muito mais rápida e precisa que busca semântica.
Se encontrar o schema, use as informações retornadas diretamente.
Se não encontrar, então use file-search para busca semântica.

Domínios disponíveis: nfe, nfce, confaz, mdfe, cte, bpe, nf3e, dce, nfgas, nff, nfag, nfcom, one, nfeab, pes, difal, other`,
  parameters: z.object({
    schemaName: z
      .string()
      .describe(
        "Nome do schema a buscar (ex: 'consReciNFe_v4.00', 'procNFe_v4.00', 'cancNFe_v2.00'). Pode ser nome completo ou parcial."
      ),
    domain: z
      .enum(["nfe", "nfce", "confaz", "mdfe", "cte", "bpe", "nf3e", "dce", "nfgas", "nff", "nfag", "nfcom", "one", "nfeab", "pes", "difal", "other"])
      .nullable()
      .optional()
      .describe("Domínio específico para limitar busca (opcional)"),
  }),
  async execute({ schemaName, domain }) {
    logger.info({ schemaName, domain }, "[schema-lookup] Buscando schema");

    try {
      const results = await lookupSchema(schemaName, domain || undefined);

      if (results.length === 0) {
        return `Nenhum schema encontrado com o nome "${schemaName}"${domain ? ` no domínio ${domain}` : ""}. Tente usar file-search para busca semântica.`;
      }

      // Formatar resultados
      const formatted = results.map((entry, index) => {
        let info = `${index + 1}. **${entry.schemaName}**\n`;
        info += `   - Arquivo: ${entry.fileName} (upload: ${entry.uploadFileName})\n`;
        info += `   - Caminho: ${entry.filePath}\n`;
        info += `   - Domínio: ${entry.domain}\n`;
        if (entry.namespace) {
          info += `   - Namespace: ${entry.namespace}\n`;
        }
        if (entry.version) {
          info += `   - Versão: ${entry.version}\n`;
        }
        if (entry.elementCount !== undefined) {
          info += `   - Elementos: ${entry.elementCount}\n`;
        }
        if (entry.rootElements && entry.rootElements.length > 0) {
          info += `   - Elementos raiz: ${entry.rootElements.join(", ")}\n`;
        }
        if (entry.keyElements && entry.keyElements.length > 0) {
          info += `   - Elementos importantes: ${entry.keyElements.join(", ")}\n`;
        }
        return info;
      }).join("\n\n");

      return `Encontrados ${results.length} schema(s) com o nome "${schemaName}":\n\n${formatted}\n\nUse file-search no vector store 'vs_schemas_xsd' para obter o conteúdo completo do schema.`;
    } catch (error) {
      logger.error({ error, schemaName, domain }, "[schema-lookup] Erro");
      return `Erro ao buscar schema "${schemaName}": ${error instanceof Error ? error.message : String(error)}`;
    }
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
export const coordinatorTools = [schemaLookupTool, fileSearchTool, webTool, loggerTool];

export const specialistTools = [schemaLookupTool, fileSearchTool, loggerTool];

export const classifierTools = [vectorStoresMetadataTool, loggerTool];

/** Tools para triage-router: metadados dos stores + logger */
export const triageRouterTools = [vectorStoresMetadataTool, loggerTool];

/** Tools para source-planner: apenas logger (retorno de store ids é via instruções/resposta) */
export const sourcePlannerTools = [loggerTool];
