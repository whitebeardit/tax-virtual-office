import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runUserQueryWorkflow } from '../../workflows/user-query.js';
import { UserQueryRequest, UserQueryResponse } from '../../agents/types.js';
import type { RetrievalResult } from '../../workflows/retrieval.js';

const mockInvokeCoordinator = jest.fn<(request: UserQueryRequest) => Promise<UserQueryResponse>>();
jest.mock('../../agents/coordinator.js', () => ({
  invokeCoordinator: (request: UserQueryRequest) => mockInvokeCoordinator(request),
}));

const mockInvokeEnricher = jest.fn();
jest.mock('../../agents/enricher.js', () => ({
  invokeTrustedSourcesEnricher: (...args: unknown[]) => mockInvokeEnricher(...args),
}));

jest.mock('../../agents/registry.js', () => ({
  getAgentDefinition: jest.fn((id: string) => ({
    id,
    name: `Test ${id}`,
    model: 'gpt-4o',
    instructions: 'Test instructions',
    tools: ['file-search', 'logger'],
  })),
}));

const mockRunRetrieval = jest.fn();
jest.mock('../../workflows/retrieval.js', () => ({
  runRetrieval: (...args: unknown[]) => mockRunRetrieval(...args),
}));

/** Helper para tipar o mock de runRetrieval (evita inferência 'never' pelo jest.mock). */
const setRetrievalResult = (result: RetrievalResult) => {
  (mockRunRetrieval as unknown as { mockResolvedValue: (v: RetrievalResult) => void }).mockResolvedValue(result);
};

describe('User Query Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setRetrievalResult({
      byStore: new Map(),
      errors: new Map(),
      storesQueried: ['vs_tabelas_fiscais'],
    });
  });

  it('should process a valid query request', async () => {
    mockInvokeCoordinator.mockResolvedValue({
      answer: 'Test answer',
      plan: ['Step 1', 'Step 2'],
      agentTraces: [],
      sources: ['source1'],
    });
    (mockInvokeEnricher as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      answer: 'Enriched answer',
      sources: ['enricherSource'],
    });

    const request: UserQueryRequest = {
      question: 'What is the ICMS rate?',
    };

    const result = await runUserQueryWorkflow(request);

    expect(result).toBeDefined();
    expect(result.answer).toBe('Test answer');
    expect(result.plan).toBeDefined();
    expect(result.sources).toBeDefined();
    expect(mockInvokeCoordinator).toHaveBeenCalled();
    expect(mockInvokeEnricher).not.toHaveBeenCalled();
    const coordinatorArg = mockInvokeCoordinator.mock.calls[0][0];
    expect(coordinatorArg.question).toBe(request.question);
    expect(coordinatorArg.triageResult).toBeDefined();
    expect(coordinatorArg.storesQueried).toEqual(['vs_tabelas_fiscais']);
  });

  it('should include context in the request', async () => {
    mockInvokeCoordinator.mockResolvedValue({
      answer: 'Test answer',
      plan: [],
      agentTraces: [],
      sources: [],
    });

    const request: UserQueryRequest = {
      question: 'What is the ICMS rate?',
      context: 'Client is in São Paulo',
    };

    await runUserQueryWorkflow(request);

    expect(mockInvokeCoordinator).toHaveBeenCalledWith(
      expect.objectContaining({ question: request.question, context: request.context })
    );
  });

  it('should pick spec-mercadorias for NFC-e question', async () => {
    mockInvokeCoordinator.mockResolvedValue({
      answer: 'Test answer',
      plan: [],
      agentTraces: [],
      sources: [],
    });

    const result = await runUserQueryWorkflow({
      question: 'How to handle NFC-e documents?',
    });

    const planString = result.plan?.join(' ') || '';
    expect(planString).toContain('spec-mercadorias');
  });

  it('should plan only vs_* stores (técnico)', async () => {
    setRetrievalResult({
      byStore: new Map([['vs_specs_mercadorias', ['doc1']]]),
      errors: new Map(),
      storesQueried: ['vs_specs_mercadorias', 'vs_schemas_xsd'],
    });
    mockInvokeCoordinator.mockResolvedValue({
      answer: 'Answer',
      plan: [],
      agentTraces: [],
      sources: [],
    });

    await runUserQueryWorkflow({
      question: 'Como preencher o campo cProd na NF-e v4.00?',
    });

    expect(mockRunRetrieval).toHaveBeenCalled();
    const [, storeIds] = mockRunRetrieval.mock.calls[0] as [string, string[]];
    storeIds.forEach((id: string) => {
      expect(id).toMatch(/^vs_/);
      expect(id).not.toMatch(/normas-tecnicas-nfe|tabelas-cfop|legislacao-nacional/);
    });
  });

  it('should plan vs_* stores for reforma (IBS/CBS)', async () => {
    setRetrievalResult({
      byStore: new Map([['vs_legal_federal', ['lc214']]]),
      errors: new Map(),
      storesQueried: ['vs_legal_federal', 'vs_tabelas_fiscais'],
    });
    mockInvokeCoordinator.mockResolvedValue({
      answer: 'Answer',
      plan: [],
      agentTraces: [],
      sources: [],
    });
    (mockInvokeEnricher as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      answer: 'Enriched',
      sources: ['agents/prompts/trusted-sources-enricher.system.md'],
    });

    const result = await runUserQueryWorkflow({
      question: 'Qual a alíquota do IBS para medicamentos em 2027?',
    });

    const [, storeIds] = mockRunRetrieval.mock.calls[0] as [string, string[]];
    expect(storeIds.some((id: string) => id === 'vs_legal_federal' || id === 'vs_tabelas_fiscais')).toBe(true);
    storeIds.forEach((id: string) => expect(id).toMatch(/^vs_/));
    expect(mockInvokeEnricher).toHaveBeenCalled();
    expect(result.answer).toBe('Enriched');
  });

  it('should plan vs_tabelas_fiscais for cálculo', async () => {
    setRetrievalResult({
      byStore: new Map([['vs_tabelas_fiscais', ['cfop']]]),
      errors: new Map(),
      storesQueried: ['vs_tabelas_fiscais'],
    });
    mockInvokeCoordinator.mockResolvedValue({
      answer: 'Answer',
      plan: [],
      agentTraces: [],
      sources: [],
    });

    await runUserQueryWorkflow({
      question: 'Qual o CFOP para venda de produto no estado?',
    });

    const [, storeIds] = mockRunRetrieval.mock.calls[0] as [string, string[]];
    expect(storeIds).toContain('vs_tabelas_fiscais');
    storeIds.forEach((id: string) => expect(id).toMatch(/^vs_/));
  });
});
