import {describe, expect, it} from 'vitest';
import {clinicalData, legacyTitle} from './legacyAdapter';

describe('legacy clinical data normalization', () => {
  it('promotes the richer nested ED categories', () => {
    expect((clinicalData['12_ed_toxicology'].protocols as unknown[]).length).toBe(13);
    expect((clinicalData['13_ed_trauma_surgical'].protocols as unknown[]).length).toBe(9);
    expect((clinicalData['14_ed_metabolic'].protocols as unknown[]).length).toBe(5);
    expect((clinicalData['15_ed_procedures'].protocols as unknown[]).length).toBe(8);
  });

  it('removes anonymous nested category wrappers', () => {
    for (const value of Object.values(clinicalData['11_ed_medical_emergencies'])) {
      for (const record of Array.isArray(value) ? value : [value]) {
        expect(legacyTitle(record)).not.toBe('');
      }
    }
  });

  it('assigns stable unique IDs', () => {
    const ids: string[] = [];
    for (const [categoryId, category] of Object.entries(clinicalData)) {
      if (categoryId === '16_score_calculators') continue;
      for (const value of Object.values(category)) {
        for (const record of Array.isArray(value) ? value : [value]) {
          ids.push(record._meta?.id ?? '');
        }
      }
    }
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
