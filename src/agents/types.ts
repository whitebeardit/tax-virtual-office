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
}

export interface PortalDocument {
  portalId: string;
  title: string;
  url: string;
  publishedAt?: string;
}

export interface ClassifiedDocument {
  vectorStoreId: string;
  tags: string[];
  rationale?: string;
}
