import fetch from "node-fetch";
import https from "https";
import http from "http";
import { URL } from "url";

/**
 * Domínios que precisam ter validação de certificado SSL desabilitada
 * devido a problemas com certificados autoassinados ou cadeias inválidas
 */
const DOMAINS_WITHOUT_SSL_VALIDATION = [
  "confaz.fazenda.gov.br",
  "www.confaz.fazenda.gov.br",
];

/**
 * Verifica se um domínio precisa ter validação SSL desabilitada
 */
function shouldDisableSSLValidation(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Verificar se o hostname corresponde a algum dos domínios configurados
    for (const domain of DOMAINS_WITHOUT_SSL_VALIDATION) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Faz requisição usando módulo nativo do Node.js (para casos com SSL problemático)
 */
function fetchWithUnsafeSSL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;
    
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: "GET",
    };

    // Desabilitar validação SSL apenas para HTTPS
    if (urlObj.protocol === "https:") {
      options.rejectUnauthorized = false;
    }

    const req = client.request(options, (res) => {
      let data = "";
      
      res.on("data", (chunk) => {
        data += chunk;
      });
      
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP fetch failed: ${res.statusCode}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    // Adicionar timeout
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

/**
 * Faz uma requisição HTTP/HTTPS
 * 
 * Para domínios com problemas de certificado SSL (como CONFAZ),
 * usa módulo nativo do Node.js com validação SSL desabilitada.
 */
export async function httpFetch(url: string): Promise<string> {
  // Para domínios com problemas de SSL, usar módulo nativo
  if (shouldDisableSSLValidation(url)) {
    return fetchWithUnsafeSSL(url);
  }

  // Para outros domínios, usar node-fetch normalmente
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP fetch failed: ${response.status}`);
  }
  return response.text();
}
