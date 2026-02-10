import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { runUserQueryWorkflow } from '../../workflows/user-query.js';
import { UserQueryRequest, UserQueryResponse } from '../../agents/types.js';

// Mock the coordinator
const mockInvokeCoordinator = jest.fn<(request: UserQueryRequest) => Promise<UserQueryResponse>>();
jest.mock('../../agents/coordinator.js', () => ({
  invokeCoordinator: (request: UserQueryRequest) => mockInvokeCoordinator(request),
}));

// Mock the registry
jest.mock('../../agents/registry.js', () => ({
  getAgentDefinition: jest.fn((id: string) => ({
    id,
    name: `Test ${id}`,
    model: 'gpt-4o',
    instructions: 'Test instructions',
    tools: ['file-search', 'logger'],
  })),
}));

describe('User Query Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a valid query request', async () => {
    mockInvokeCoordinator.mockResolvedValue({
      answer: 'Test answer',
      plan: ['Step 1', 'Step 2'],
      agentTraces: [],
      sources: ['source1'],
    });

    const request: UserQueryRequest = {
      question: 'What is the ICMS rate?',
    };

    const result = await runUserQueryWorkflow(request);

    expect(result).toBeDefined();
    expect(result.answer).toBe('Test answer');
    expect(result.plan).toBeDefined();
    expect(result.sources).toBeDefined();
    expect(mockInvokeCoordinator).toHaveBeenCalledWith(request);
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

    expect(mockInvokeCoordinator).toHaveBeenCalledWith(request);
  });

  it('should pick relevant specialists based on question keywords', async () => {
    mockInvokeCoordinator.mockResolvedValue({
      answer: 'Test answer',
      plan: [],
      agentTraces: [],
      sources: [],
    });

    const request: UserQueryRequest = {
      question: 'How to handle NFC-e documents?',
    };

    const result = await runUserQueryWorkflow(request);

    const planString = result.plan?.join(' ') || '';
    expect(planString).toContain('spec-mercadorias');
  });
});
