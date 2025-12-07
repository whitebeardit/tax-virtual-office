import { describe, it, expect, beforeEach } from '@jest/globals';
import { getAgentDefinition } from '../../agents/registry.js';
import { AgentId } from '../../agents/types.js';

describe('Agent Registry', () => {
  beforeEach(() => {
    // Clear any potential cache between tests
  });

  it('should load coordinator agent definition', () => {
    const definition = getAgentDefinition('coordinator' as AgentId);
    
    expect(definition).toBeDefined();
    expect(definition.id).toBe('coordinator');
    expect(definition.name).toBe('Tax Virtual Office Coordinator');
    expect(definition.model).toBeDefined();
    expect(definition.instructions).toBeDefined();
    expect(definition.instructions.length).toBeGreaterThan(0);
  });

  it('should load specialist agent definitions', () => {
    const specialistIds: AgentId[] = [
      'specialist-nfce',
      'specialist-nfe',
      'specialist-cte',
      'legislacao-ibs-cbs',
    ];

    specialistIds.forEach((id) => {
      const definition = getAgentDefinition(id);
      expect(definition).toBeDefined();
      expect(definition.id).toBe(id);
      expect(definition.name).toBeDefined();
      expect(definition.model).toBeDefined();
      expect(definition.instructions).toBeDefined();
    });
  });

  it('should throw error for invalid agent id', () => {
    expect(() => {
      getAgentDefinition('invalid-agent' as AgentId);
    }).toThrow('Agent definition not found');
  });

  it('should cache agent definitions', () => {
    const definition1 = getAgentDefinition('coordinator' as AgentId);
    const definition2 = getAgentDefinition('coordinator' as AgentId);
    
    // Should return the same instance (cached)
    expect(definition1).toBe(definition2);
  });
});
