export type AgentId =
  | "coordinator"
  | "triage-router"
  | "source-planner"
  | "spec-mercadorias"
  | "spec-transporte"
  | "legislacao-ibs-cbs"
  | "tax-portal-watcher"
  | "tax-document-classifier"
  | "tax-document-uploader";

export interface AgentInvocation {
  id: AgentId;
  input: Record<string, unknown>;
}

export interface UserQueryRequest {
  question: string;
  context?: string;
  metadata?: Record<string, string>;
  /** Contexto já recuperado por retrieval (triage → planner → retrieval). Preenchendo evita coordinator fazer file-search redundante. */
  preRetrievedContext?: string;
  /** Resultado do triage; usado para enriquecer plan/sources. */
  triageResult?: TriageResult;
  /** Vector stores consultados no retrieval; usado para sources. */
  storesQueried?: string[];
}

export interface UserQueryResponse {
  answer: string;
  sources?: string[];
  plan?: string[];
  agentTraces?: AgentTraceExample[];
}

export interface AgentTraceExample {
  agentId: AgentId;
  calledTools: string[];
  sample: string;
  note?: string;
}

export interface PortalDocument {
  portalId: string;
  portalType?: string;
  title: string;
  url: string;
  publishedAt?: string;
  detectedAt?: string;
  contentHash?: string;
  externalId?: string;
  sourceListing?: string;
  // Campos opcionais do crawler (metadados enriquecidos)
  domain?: string; // 'nfe', 'nfce', 'cte', 'confaz'
  natureza?: string; // 'NOTA_TECNICA', 'MANUAL', 'TABELA', 'INFORME_TECNICO', 'SCHEMA_XML', 'AJUSTE_SINIEF', 'CONVENIO', 'LEI', 'DECRETO', etc.
  assuntos?: string[]; // ['REFORMA_TRIBUTARIA', 'IBS', 'CBS', 'IS', etc.]
  fileName?: string; // Nome do arquivo (útil para classificação de tabelas)
  modelo?: string; // '55' (NF-e), '65' (NFC-e), '57' (CT-e), '67' (CT-e OS), etc.
  normalizedTextSample?: string; // Amostra resumida do texto normalizado (markdown, CSV, etc.)
}

export interface PortalDefinition {
  id: string;
  name: string;
  baseUrl: string;
  listingPath: string;
  type: string;
}

export interface VectorStoreDefinition {
  id: string;
  description: string;
}

export interface ClassifiedDocument {
  vectorStoreId: string;
  tags: string[];
  rationale?: string;
  score?: number;
  confidenceScore?: number; // 0.0 a 1.0 - grau de confiança da classificação
  alternativeStores?: string[]; // Vector stores alternativos caso o principal não seja adequado
}

/** Trilha de intenção da pergunta (triage). */
export type TriageTrail =
  | "Documento"
  | "Integracao"
  | "Validacao"
  | "Evento"
  | "Legislacao"
  | "Operacao"
  | "Historico"
  | "Calculo";

/** Família de documento fiscal. */
export type TriageFamily =
  | "mercadorias"
  | "transporte"
  | "utilities"
  | "declaracoes"
  | "plataformas";

/** Tipo de documento (modelo). */
export type TriageDocType =
  | "nfe"
  | "nfce"
  | "cte"
  | "mdfe"
  | "bpe"
  | "nf3e"
  | "nfcom"
  | "dce"
  | "nff"
  | "pes"
  | "cff"
  | "one"
  | "difal"
  | "nfeab";

/** Resultado do triage (classificação determinística da pergunta). */
export interface TriageResult {
  trail: TriageTrail;
  family?: TriageFamily;
  doc_type?: TriageDocType;
  uf?: string;
}
