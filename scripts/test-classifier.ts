#!/usr/bin/env ts-node

/**
 * Script de teste manual para o tax-document-classifier
 * 
 * Testa a classificação de documentos com diferentes cenários:
 * - Documentos com metadados do crawler
 * - Documentos sem metadados (fallback)
 * - Diferentes tipos de documentos (NT, manual, tabela, etc.)
 */

import { classifyDocument } from "../src/agents/maintenance.js";
import { PortalDocument } from "../src/agents/types.js";
import { logger } from "../src/utils/logger.js";

interface TestCase {
  name: string;
  document: PortalDocument;
  expectedStore?: string;
  description: string;
}

const testCases: TestCase[] = [
  // Testes com metadados do crawler
  {
    name: "NT NF-e com metadados",
    document: {
      portalId: "portal-nacional-nfe",
      portalType: "nacional",
      title: "Nota Técnica 2025.001 - Atualização do Layout NF-e",
      url: "https://www.nfe.fazenda.gov.br/nt/2025-001",
      publishedAt: "2025-01-15T10:00:00Z",
      detectedAt: new Date().toISOString(),
      domain: "nfe",
      natureza: "NOTA_TECNICA",
      modelo: "55",
    },
    expectedStore: "normas-tecnicas-nfe",
    description: "Nota técnica de NF-e com metadados completos",
  },
  {
    name: "Manual NFC-e com metadados",
    document: {
      portalId: "svrs-nfce-documentos",
      portalType: "nacional",
      title: "Manual de Orientação do Contribuinte NFC-e",
      url: "https://dfe-portal.svrs.rs.gov.br/Nfce/Documentos/manual-nfce",
      publishedAt: "2025-01-10T10:00:00Z",
      detectedAt: new Date().toISOString(),
      domain: "nfce",
      natureza: "MANUAL",
      modelo: "65",
    },
    expectedStore: "manuais-nfce",
    description: "Manual de NFC-e com metadados",
  },
  {
    name: "Tabela CFOP com metadados",
    document: {
      portalId: "sefaz-sp",
      portalType: "estadual",
      title: "Tabela CFOP - Código Fiscal de Operações e Prestações",
      url: "https://www.fazenda.sp.gov.br/tabelas/cfop.xlsx",
      publishedAt: "2025-01-01T00:00:00Z",
      detectedAt: new Date().toISOString(),
      domain: "nfe",
      natureza: "TABELA",
      fileName: "tabela-cfop-2025.xlsx",
    },
    expectedStore: "tabelas-cfop",
    description: "Tabela CFOP identificada pelo fileName",
  },
  {
    name: "Schema XML CT-e com metadados",
    document: {
      portalId: "portal-cte",
      portalType: "nacional",
      title: "Schema XSD CT-e versão 4.00",
      url: "https://www.cte.fazenda.gov.br/schemas/cte_v4.00.xsd",
      publishedAt: "2025-01-05T10:00:00Z",
      detectedAt: new Date().toISOString(),
      domain: "cte",
      natureza: "SCHEMA_XML",
      modelo: "57",
    },
    expectedStore: "esquemas-xml-cte",
    description: "Schema XML de CT-e",
  },
  {
    name: "Ajuste SINIEF NF-e com metadados",
    document: {
      portalId: "confaz-ajustes-sinief",
      portalType: "nacional",
      title: "Ajuste SINIEF 09/2025 - NF-e",
      url: "https://www.confaz.fazenda.gov.br/ajustes/09-2025",
      publishedAt: "2025-01-20T10:00:00Z",
      detectedAt: new Date().toISOString(),
      domain: "nfe",
      natureza: "AJUSTE_SINIEF",
    },
    expectedStore: "ajustes-sinief-nfe",
    description: "Ajuste SINIEF específico de NF-e",
  },
  {
    name: "Legislação IBS/CBS com metadados",
    document: {
      portalId: "portal-nacional",
      portalType: "nacional",
      title: "Lei Complementar 214/2025 - IBS e CBS",
      url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm",
      publishedAt: "2025-01-01T00:00:00Z",
      detectedAt: new Date().toISOString(),
      natureza: "LEI",
      assuntos: ["REFORMA_TRIBUTARIA", "IBS", "CBS"],
    },
    expectedStore: "legislacao-nacional-ibs-cbs-is",
    description: "Lei sobre reforma tributária",
  },
  
  // Testes sem metadados (fallback para heurísticas)
  {
    name: "NT NF-e sem metadados (fallback)",
    document: {
      portalId: "portal-nacional-nfe",
      portalType: "nacional",
      title: "Nota Técnica 2025.002 - NF-e modelo 55",
      url: "https://www.nfe.fazenda.gov.br/nt/2025-002",
      publishedAt: "2025-01-20T10:00:00Z",
      detectedAt: new Date().toISOString(),
    },
    expectedStore: "normas-tecnicas-nfe",
    description: "Nota técnica detectada pelo título (sem metadados)",
  },
  {
    name: "Manual NFC-e sem metadados (fallback)",
    document: {
      portalId: "svrs-nfce-documentos",
      portalType: "nacional",
      title: "Manual de Orientação do Contribuinte - NFC-e modelo 65",
      url: "https://dfe-portal.svrs.rs.gov.br/Nfce/Documentos/manual",
      publishedAt: "2025-01-10T10:00:00Z",
      detectedAt: new Date().toISOString(),
    },
    expectedStore: "manuais-nfce",
    description: "Manual detectado pelo título (sem metadados)",
  },
  {
    name: "Tabela NCM sem metadados (fallback)",
    document: {
      portalId: "sefaz-mg",
      portalType: "estadual",
      title: "Tabela NCM - Nomenclatura Comum do Mercosul",
      url: "https://www.fazenda.mg.gov.br/tabelas/ncm.pdf",
      publishedAt: "2025-01-01T00:00:00Z",
      detectedAt: new Date().toISOString(),
    },
    expectedStore: "tabelas-ncm",
    description: "Tabela NCM detectada pelo título",
  },
  {
    name: "Jurisprudência sem metadados (fallback)",
    document: {
      portalId: "carf",
      portalType: "nacional",
      title: "Parecer CARF sobre aplicação de IBS",
      url: "https://www.carf.fazenda.gov.br/pareceres/2025-001",
      publishedAt: "2025-01-15T10:00:00Z",
      detectedAt: new Date().toISOString(),
    },
    expectedStore: "jurisprudencia-tributaria",
    description: "Parecer detectado pelo título",
  },
];

async function runTest(testCase: TestCase): Promise<"pass" | "fail" | "error"> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Teste: ${testCase.name}`);
  console.log(`Descrição: ${testCase.description}`);
  console.log(`Documento: ${testCase.document.title}`);
  console.log(`URL: ${testCase.document.url}`);
  if (testCase.document.domain) {
    console.log(`Metadados: domain=${testCase.document.domain}, natureza=${testCase.document.natureza}`);
  } else {
    console.log(`Metadados: Nenhum (usando fallback)`);
  }
  console.log(`-`.repeat(80));

  try {
    const startTime = Date.now();
    const classification = await classifyDocument(testCase.document);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Classificação concluída em ${duration}ms`);
    console.log(`Vector Store: ${classification.vectorStoreId}`);
    console.log(`Tags: ${classification.tags?.join(", ") || "N/A"}`);
    console.log(`Confidence Score: ${classification.confidenceScore?.toFixed(2) || "N/A"}`);
    console.log(`Score: ${classification.score || "N/A"}`);
    console.log(`Rationale: ${classification.rationale || "N/A"}`);

    let testResult: "pass" | "fail" | "error" = "error";
    if (testCase.expectedStore) {
      if (classification.vectorStoreId === testCase.expectedStore) {
        console.log(`\n✅ PASS: Vector store esperado (${testCase.expectedStore})`);
        testResult = "pass";
      } else {
        console.log(`\n❌ FAIL: Esperado ${testCase.expectedStore}, obtido ${classification.vectorStoreId}`);
        testResult = "fail";
      }
    } else {
      console.log(`\n⚠️  Sem expectativa definida - verificar manualmente`);
      testResult = "pass"; // Considera pass se não há expectativa
    }
    
    return testResult;
  } catch (error) {
    console.error(`\n❌ ERRO: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    return "error";
  }
}

async function main() {
  console.log("🧪 Teste do Tax Document Classifier");
  console.log(`Total de testes: ${testCases.length}`);
  console.log(`\nCertifique-se de que OPENAI_API_KEY está configurada!`);

  let passed = 0;
  let failed = 0;
  let errors = 0;

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    
    if (result === "pass") passed++;
    else if (result === "fail") failed++;
    else errors++;
    
    // Pequeno delay entre testes para não sobrecarregar a API
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`Resumo:`);
  console.log(`- Total: ${testCases.length}`);
  console.log(`- Passou: ${passed}`);
  console.log(`- Falhou: ${failed}`);
  console.log(`- Erros: ${errors}`);
  console.log(`${"=".repeat(80)}\n`);
}

main().catch((err) => {
  logger.error({ error: err }, "Erro fatal no teste");
  process.exit(1);
});
