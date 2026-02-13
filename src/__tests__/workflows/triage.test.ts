import { describe, it, expect } from '@jest/globals';
import { classifyQuestion } from '../../workflows/triage.js';

describe('Triage', () => {
  it('classifies cálculo trail for alíquota/CFOP/NCM', () => {
    const r = classifyQuestion('Qual a alíquota de ICMS para SP?');
    expect(r.trail).toBe('Calculo');
  });

  it('classifies Legislação trail for IBS/CBS', () => {
    const r = classifyQuestion('O que diz a LC 214/2025 sobre IBS?');
    expect(r.trail).toBe('Legislacao');
  });

  it('classifies Documento trail for schema/XML', () => {
    const r = classifyQuestion('Estrutura XML do campo cProd na NF-e');
    expect(r.trail).toBe('Documento');
  });

  it('sets family mercadorias and doc_type nfe for NF-e question', () => {
    const r = classifyQuestion('Como cancelar uma NF-e modelo 55?');
    expect(r.family).toBe('mercadorias');
    expect(r.doc_type).toBe('nfe');
  });

  it('sets family transporte and doc_type cte for CT-e question', () => {
    const r = classifyQuestion('Prazo para evento no CT-e');
    expect(r.family).toBe('transporte');
    expect(r.doc_type).toBe('cte');
  });

  it('detects UF in question', () => {
    const r = classifyQuestion('Alíquota de ICMS em SP');
    expect(r.uf).toBe('SP');
  });
});
