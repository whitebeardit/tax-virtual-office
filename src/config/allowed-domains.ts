/**
 * Configuração de domínios permitidos para web tool
 * 
 * Baseado em config/document-sources.json e agents/portals.yaml
 */

import fs from "fs";
import path from "path";

interface DomainConfig {
  pattern: string;
  description: string;
  examples: string[];
}

interface PortalConfig {
  id: string;
  name: string;
  urlBase: string;
  domain: string;
  type: string;
  sections?: string[];
}

interface DocumentSourcesConfig {
  allowedDomains: {
    domains: DomainConfig[];
  };
  portals?: {
    list: PortalConfig[];
  };
}

let cachedConfig: DocumentSourcesConfig | null = null;

/**
 * Carrega a configuração de domínios permitidos
 */
function loadConfig(): DocumentSourcesConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.resolve(
    process.cwd(),
    "config",
    "document-sources.json"
  );

  if (!fs.existsSync(configPath)) {
    // Fallback para lista hardcoded se arquivo não existir
    console.warn(
      `[allowed-domains] Arquivo config/document-sources.json não encontrado. Usando lista padrão.`
    );
    return {
      allowedDomains: {
        domains: [
          {
            pattern: "*.gov.br",
            description: "Todos os domínios do governo brasileiro",
            examples: [],
          },
          {
            pattern: "*.fazenda.gov.br",
            description: "Domínios do Ministério da Fazenda",
            examples: [],
          },
          {
            pattern: "dfe-portal.svrs.rs.gov.br",
            description: "Portal SVRS (SEFAZ Virtual RS)",
            examples: [],
          },
          {
            pattern: "confaz.fazenda.gov.br",
            description: "Portal do CONFAZ",
            examples: [],
          },
        ],
      },
    };
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    cachedConfig = JSON.parse(content) as DocumentSourcesConfig;
    return cachedConfig;
  } catch (error) {
    console.error(
      `[allowed-domains] Erro ao carregar config: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

/**
 * Verifica se uma URL é de um domínio permitido
 */
export function isAllowedDomain(url: string): boolean {
  const config = loadConfig();
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

  // Lista de padrões permitidos (extraídos da config)
  const allowedPatterns = [
    // Padrões genéricos
    (host: string) => host.endsWith(".gov.br"),
    (host: string) => host.endsWith(".fazenda.gov.br"),
    (host: string) => host.endsWith(".fazenda.sp.gov.br"),
    (host: string) => host.endsWith(".fazenda.mg.gov.br"),
    
    // Domínios específicos
    (host: string) => host === "dfe-portal.svrs.rs.gov.br" || host.endsWith(".svrs.rs.gov.br"),
    // ENCAT removido - site não existe mais
    // (host: string) => host === "encat.org.br" || host.endsWith(".encat.org.br"),
    (host: string) => host === "confaz.fazenda.gov.br" || host.endsWith(".confaz.fazenda.gov.br"),
  ];

  return allowedPatterns.some((pattern) => pattern(hostname));
}

/**
 * Obtém a lista de domínios permitidos para exibição
 */
export function getAllowedDomains(): string[] {
  const config = loadConfig();
  return config.allowedDomains.domains.map((d) => d.pattern);
}

/**
 * Obtém descrição de um domínio permitido
 */
export function getDomainDescription(pattern: string): string | undefined {
  const config = loadConfig();
  const domain = config.allowedDomains.domains.find((d) => d.pattern === pattern);
  return domain?.description;
}

/**
 * Valida URL e retorna mensagem de erro se não for permitida
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    new URL(url); // Valida formato da URL
  } catch {
    return {
      valid: false,
      error: `URL inválida: "${url}"`,
    };
  }

  if (!isAllowedDomain(url)) {
    const allowed = getAllowedDomains().join(", ");
    return {
      valid: false,
      error: `URL '${url}' não é um domínio oficial permitido. Domínios permitidos: ${allowed}`,
    };
  }

  return { valid: true };
}

/**
 * Obtém a URL base do site oficial baseado no tipo de documento ou portal
 */
export function getOfficialSiteUrl(documentType?: string, portalId?: string): string | null {
  const config = loadConfig();
  
  // Se portalId fornecido, buscar na lista de portais
  if (portalId && config.portals) {
    const portal = config.portals.list.find((p) => p.id === portalId);
    if (portal) {
      return portal.urlBase;
    }
  }
  
  // Mapear tipo de documento para portal (preferir SVRS quando disponível)
  const documentTypeMap: Record<string, string> = {
    nfe: "nfe-svrs",
    nfce: "nfce-svrs",
    cte: "cte-svrs",
    mdfe: "mdfe-svrs",
    confaz: "confaz",
    bpe: "bpe-svrs",
    nf3e: "nf3e-svrs",
    dce: "dce-svrs",
    nfgas: "nfgas-svrs",
    cff: "cff-svrs",
    nff: "nff-svrs",
    nfag: "nfag-svrs",
    pes: "pes-svrs",
    nfcom: "nfcom-svrs",
    one: "one-svrs",
    nfeab: "nfeab-svrs",
    difal: "difal-svrs",
  };
  
  if (documentType) {
    const normalizedType = documentType.toLowerCase().replace(/[_-]/g, "");
    const mappedPortalId = documentTypeMap[normalizedType];
    if (mappedPortalId && config.portals) {
      const portal = config.portals.list.find((p) => p.id === mappedPortalId);
      if (portal) {
        return portal.urlBase;
      }
    }
  }
  
  // Fallback: retornar portal SVRS NF-e como padrão (preferir SVRS)
  if (config.portals) {
    const defaultPortal = config.portals.list.find((p) => p.id === "nfe-svrs");
    if (defaultPortal) {
      return defaultPortal.urlBase;
    }
  }
  
  return null;
}

/**
 * Extrai o tipo de documento ou portal de uma URL
 */
export function extractDocumentTypeFromUrl(url: string): { type?: string; portalId?: string } {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    
    // Detectar portal por hostname
    if (hostname.includes("nfe.fazenda.gov.br")) {
      return { type: "nfe", portalId: "nfe" };
    }
    if (hostname.includes("confaz.fazenda.gov.br")) {
      return { type: "confaz", portalId: "confaz" };
    }
    if (hostname.includes("svrs.rs.gov.br")) {
      // Detectar tipo pelo path (ordem: mais específicos primeiro)
      if (pathname.includes("/nfabi/")) {
        return { type: "nfeab", portalId: "nfeab-svrs" };
      }
      if (pathname.includes("/nfe/")) {
        return { type: "nfe", portalId: "nfe-svrs" };
      }
      if (pathname.includes("/nfce/")) {
        return { type: "nfce", portalId: "nfce-svrs" };
      }
      if (pathname.includes("/cte/")) {
        return { type: "cte", portalId: "cte-svrs" };
      }
      if (pathname.includes("/mdfe/")) {
        return { type: "mdfe", portalId: "mdfe-svrs" };
      }
      if (pathname.includes("/bpe/")) {
        return { type: "bpe", portalId: "bpe-svrs" };
      }
      if (pathname.includes("/nf3e/")) {
        return { type: "nf3e", portalId: "nf3e-svrs" };
      }
      if (pathname.includes("/dce/")) {
        return { type: "dce", portalId: "dce-svrs" };
      }
      if (pathname.includes("/nfgas/")) {
        return { type: "nfgas", portalId: "nfgas-svrs" };
      }
      if (pathname.includes("/cff/")) {
        return { type: "cff", portalId: "cff-svrs" };
      }
      if (pathname.includes("/nff/")) {
        return { type: "nff", portalId: "nff-svrs" };
      }
      if (pathname.includes("/nfag/")) {
        return { type: "nfag", portalId: "nfag-svrs" };
      }
      if (pathname.includes("/pes/")) {
        return { type: "pes", portalId: "pes-svrs" };
      }
      if (pathname.includes("/nfcom/")) {
        return { type: "nfcom", portalId: "nfcom-svrs" };
      }
      if (pathname.includes("/one/")) {
        return { type: "one", portalId: "one-svrs" };
      }
      if (pathname.includes("/difal/")) {
        return { type: "difal", portalId: "difal-svrs" };
      }
    }
    
    // Tentar detectar pelo path (ordem: mais específicos primeiro para evitar falsos positivos)
    if (pathname.includes("/nfabi") || pathname.includes("nfabi")) {
      return { type: "nfeab", portalId: "nfeab-svrs" };
    }
    if (pathname.includes("/nfce") || pathname.includes("nfce")) {
      return { type: "nfce" };
    }
    if (pathname.includes("/nf3e") || pathname.includes("nf3e")) {
      return { type: "nf3e", portalId: "nf3e-svrs" };
    }
    if (pathname.includes("/nfcom") || pathname.includes("nfcom")) {
      return { type: "nfcom", portalId: "nfcom-svrs" };
    }
    if (pathname.includes("/nfag") || pathname.includes("nfag")) {
      return { type: "nfag", portalId: "nfag-svrs" };
    }
    if (pathname.includes("/nfgas") || pathname.includes("nfgas")) {
      return { type: "nfgas", portalId: "nfgas-svrs" };
    }
    if (pathname.includes("/nff") || pathname.includes("nff")) {
      return { type: "nff", portalId: "nff-svrs" };
    }
    if (pathname.includes("/nfe") || pathname.includes("nfe")) {
      return { type: "nfe" };
    }
    if (pathname.includes("/cte") || pathname.includes("cte")) {
      return { type: "cte" };
    }
    if (pathname.includes("/mdfe") || pathname.includes("mdfe")) {
      return { type: "mdfe" };
    }
    if (pathname.includes("/bpe") || pathname.includes("bpe")) {
      return { type: "bpe", portalId: "bpe-svrs" };
    }
    if (pathname.includes("/dce") || pathname.includes("dce")) {
      return { type: "dce", portalId: "dce-svrs" };
    }
    if (pathname.includes("/cff") || pathname.includes("cff")) {
      return { type: "cff", portalId: "cff-svrs" };
    }
    if (pathname.includes("/pes") || pathname.includes("pes")) {
      return { type: "pes", portalId: "pes-svrs" };
    }
    if (pathname.includes("/one") || pathname.includes("one")) {
      return { type: "one", portalId: "one-svrs" };
    }
    if (pathname.includes("/difal") || pathname.includes("difal")) {
      return { type: "difal", portalId: "difal-svrs" };
    }
    if (pathname.includes("/confaz") || pathname.includes("confaz")) {
      return { type: "confaz", portalId: "confaz" };
    }
  } catch {
    // URL inválida, retornar vazio
  }
  
  return {};
}
