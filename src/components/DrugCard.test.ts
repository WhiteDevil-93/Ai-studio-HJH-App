import {describe, expect, it} from 'vitest';
import {
  formatCalculatedDose,
  getEntryKey,
  sourceGroupFallbackFromCategory,
} from './DrugCard';

describe('formatCalculatedDose', () => {
  it('uses integer display at 100 and above', () => {
    expect(formatCalculatedDose(100)).toBe('100');
    expect(formatCalculatedDose(350)).toBe('350');
  });

  it('keeps one decimal between 10 and 100, dropping trailing .0', () => {
    expect(formatCalculatedDose(10)).toBe('10');
    expect(formatCalculatedDose(12.5)).toBe('12.5');
  });

  it('keeps two decimals below 10, dropping trailing zeros', () => {
    expect(formatCalculatedDose(3.5)).toBe('3.5');
    expect(formatCalculatedDose(0.9)).toBe('0.9');
    expect(formatCalculatedDose(1)).toBe('1');
  });
});

describe('getEntryKey', () => {
  it('prefers the canonical _meta.id when present', () => {
    expect(getEntryKey({_meta: {id: 'drug.adrenaline'}, item: 'Adrenaline'}, '2_emergency_drugs'))
      .toBe('drug.adrenaline');
  });

  it('falls back to category::name for legacy records', () => {
    expect(getEntryKey({item: 'Ketamine'}, '2_emergency_drugs'))
      .toBe('2_emergency_drugs::Ketamine');
    expect(getEntryKey({drug: 'Phenytoin'}, '3_anticonvulsants'))
      .toBe('3_anticonvulsants::Phenytoin');
  });
});

describe('sourceGroupFallbackFromCategory', () => {
  it('maps facility pillars to their short labels', () => {
    expect(sourceGroupFallbackFromCategory('helen_guidelines')).toBe('HJH');
    expect(sourceGroupFallbackFromCategory('cmjah_guidelines')).toBe('CMJAH');
    expect(sourceGroupFallbackFromCategory('rmmch_guidelines')).toBe('RMMCH');
  });

  it('leaves non-facility categories without a fallback', () => {
    expect(sourceGroupFallbackFromCategory('2_emergency_drugs')).toBeUndefined();
    expect(sourceGroupFallbackFromCategory('favourites')).toBeUndefined();
  });
});
