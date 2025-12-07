import { z } from "zod";
import { tool } from "@openai/agents";
import { fileSearch, FileSearchQuery } from "../mcp/fileSearchTool.js";
import { logInfo, logError } from "../mcp/loggerTool.js";
import { httpFetch } from "../mcp/httpFetchTool.js";
import { httpDownload } from "../mcp/httpDownloadTool.js";
import { kvGet, kvSet } from "../mcp/kvStateTool.js";

/**
 * File Search Tool - Busca em vector stores
 */
export const fileSearchTool = tool({
  name: "file-search",
  description: "Busca em vector stores e arquivos locais. Fonte primária de informação para consultas tributárias.",
  parameters: z.object({
    vectorStoreId: z.string().describe("ID do vector store a consultar"),
    query: z.string().describe("Query de busca"),
  }),
  execute: async (input) => {
    const query: FileSearchQuery = {
      vectorStoreId: input.vectorStoreId,
      query: input.query,
    };
    const results = await fileSearch(query);
    logInfo("file-search executado", { vectorStoreId: input.vectorStoreId, resultsCount: results.length });
    return results.length > 0 ? results.join("\n\n") : "Nenhum resultado encontrado.";
  },
});

/**
 * Web Search Tool - Consultas a sites oficiais
 */
export const webTool = tool({
  name: "web",
  description: "Consulta a sites oficiais (.gov.br, .fazenda.gov.br). Use apenas para dados objetivos (datas, números de lei, URLs oficiais).",
  parameters: z.object({
    url: z.string().url().describe("URL do site oficial a consultar"),
    query: z.string().optional().describe("Query opcional para busca"),
  }),
  execute: async (input) => {
    try {
      const content = await httpFetch(input.url);
      logInfo("web consultado", { url: input.url });
      return content.substring(0, 5000); // Limita tamanho da resposta
    } catch (error) {
      logError("web falhou", { url: input.url, error: (error as Error).message });
      throw error;
    }
  },
});

/**
 * Logger Tool - Registra decisões e traces
 */
export const loggerTool = tool({
  name: "logger",
  description: "Registra decisões, chamadas de ferramentas e traces para auditoria do fluxo de consulta.",
  parameters: z.object({
    level: z.enum(["info", "error"]).default("info"),
    message: z.string().describe("Mensagem a registrar"),
    payload: z.record(z.unknown()).optional().describe("Dados adicionais"),
  }),
  execute: async (input) => {
    if (input.level === "error") {
      logError(input.message, input.payload);
    } else {
      logInfo(input.message, input.payload);
    }
    return `Log registrado: ${input.message}`;
  },
});

/**
 * HTTP Fetch Tool - Obter HTML de páginas
 */
export const httpFetchTool = tool({
  name: "http-fetch",
  description: "Obter HTML de páginas de portais fiscais.",
  parameters: z.object({
    url: z.string().url().describe("URL da página a buscar"),
  }),
  execute: async (input) => {
    const content = await httpFetch(input.url);
    logInfo("http-fetch executado", { url: input.url, contentLength: content.length });
    return content;
  },
});

/**
 * HTTP Download Tool - Baixar arquivos
 */
export const httpDownloadTool = tool({
  name: "http-download",
  description: "Baixar arquivos de documentos fiscais.",
  parameters: z.object({
    url: z.string().url().describe("URL do arquivo a baixar"),
    outputDir: z.string().describe("Diretório de destino"),
  }),
  execute: async (input) => {
    const filename = await httpDownload(input.url, input.outputDir);
    logInfo("http-download concluído", { url: input.url, filename });
    return `Arquivo baixado: ${filename}`;
  },
});

/**
 * KV State Tool - Armazenar estado
 */
export const kvStateTool = tool({
  name: "kv-state",
  description: "Armazenar e recuperar estado de documentos já processados (deduplicação).",
  parameters: z.object({
    operation: z.enum(["get", "set"]).describe("Operação a realizar"),
    key: z.string().describe("Chave do estado"),
    value: z.string().optional().describe("Valor a armazenar (apenas para 'set')"),
  }),
  execute: async (input) => {
    if (input.operation === "get") {
      const value = kvGet(input.key);
      return value || "";
    } else {
      if (!input.value) {
        throw new Error("Value é obrigatório para operação 'set'");
      }
      kvSet(input.key, input.value);
      return `Estado armazenado para chave: ${input.key}`;
    }
  },
});
