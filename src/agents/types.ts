export type AgentId =
  | "coordinator"
  | "specialist-nfce"
  | "specialist-nfe"
  | "specialist-cte"
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
