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

interface DocumentSourcesConfig {
  allowedDomains: {
    domains: DomainConfig[];
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
