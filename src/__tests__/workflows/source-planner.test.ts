import { describe, it, expect } from '@jest/globals';
import { planStores, MAX_STORES_PER_QUERY } from '../../workflows/source-planner.js';

describe('Source Planner', () => {
  it('returns only vs_* ids (no legacy)', () => {
    const stores = planStores({ trail: 'Documento', family: 'mercadorias', doc_type: 'nfe' });
    expect(stores.length).toBeLessThanOrEqual(MAX_STORES_PER_QUERY);
    stores.forEach((id) => {
      expect(id).toMatch(/^vs_/);
      expect(id).not.toMatch(/normas-tecnicas|tabelas-cfop|legislacao-nacional|manuais-nfe|documentos-estaduais|jurisprudencia-tributaria/);
    });
  });

  it('plans vs_tabelas_fiscais for Calculo trail', () => {
    const stores = planStores({ trail: 'Calculo' });
    expect(stores).toContain('vs_tabelas_fiscais');
    stores.forEach((id) => expect(id).toMatch(/^vs_/));
  });

  it('plans vs_legal_federal for Legislacao trail', () => {
    const stores = planStores({ trail: 'Legislacao' });
    expect(stores.some((s) => s.startsWith('vs_legal_'))).toBe(true);
    stores.forEach((id) => expect(id).toMatch(/^vs_/));
  });

  it('limits to MAX_STORES_PER_QUERY', () => {
    const stores = planStores({ trail: 'Documento' });
    expect(stores.length).toBeLessThanOrEqual(MAX_STORES_PER_QUERY);
  });
});
