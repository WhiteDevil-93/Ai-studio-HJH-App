import {describe, expect, it} from 'vitest';
import {
  FORMULA_CATEGORY_ID,
  GLOBAL_CALCULATORS,
  SCORE_CATEGORY_ID,
  searchGlobalCalculators,
} from './globalCalculators';

const names = () => GLOBAL_CALCULATORS.map(calculator => calculator.name);

describe('global calculator index', () => {
  it('indexes score calculators, formulae and infusion calculators', () => {
    const kinds = new Set(GLOBAL_CALCULATORS.map(calculator => calculator.kind));
    expect(kinds.has('score')).toBe(true);
    expect(kinds.has('formula')).toBe(true);
    expect(kinds.has('infusion')).toBe(true);
    expect(GLOBAL_CALCULATORS.length).toBeGreaterThan(50);
  });

  it('gives every tool a stable id and a category view to open', () => {
    const ids = GLOBAL_CALCULATORS.map(calculator => calculator.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const calculator of GLOBAL_CALCULATORS) {
      expect(calculator.name.length).toBeGreaterThan(0);
      expect([SCORE_CATEGORY_ID, FORMULA_CATEGORY_ID]).toContain(calculator.categoryId);
    }
  });

  it('keeps one entry per tool name, preferring the interactive calculator', () => {
    const normalised = names().map(name => name.toLocaleLowerCase());
    expect(new Set(normalised).size).toBe(normalised.length);

    // Free water deficit ships both as an interactive score-page calculator and
    // as a static formulae card; the interactive one has to win.
    const freeWaterDeficit = GLOBAL_CALCULATORS.find(
      calculator => calculator.name.toLocaleLowerCase() === 'free water deficit',
    );
    expect(freeWaterDeficit?.categoryId).toBe(SCORE_CATEGORY_ID);
  });
});

describe('searchGlobalCalculators', () => {
  it('resolves acronyms a clinician actually types', () => {
    expect(searchGlobalCalculators('gcs')[0]?.name).toBe('Glasgow Coma Scale');
    expect(searchGlobalCalculators('mews')[0]?.name).toContain('MEWS');
    expect(searchGlobalCalculators('curb')[0]?.name).toContain('CURB');
  });

  it('ranks a name match above a body-text match', () => {
    const results = searchGlobalCalculators('wells');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.toLocaleLowerCase()).toContain('wells');
  });

  it('finds a tool by its clinical content, not just its title', () => {
    // Neither score is named after sepsis, but both are what a reader typing
    // "sepsis" inside a protocol is reaching for.
    const sepsis = searchGlobalCalculators('sepsis').map(result => result.name);
    expect(sepsis).toContain('qSOFA Score');
    expect(sepsis).toContain('SIRS Criteria');

    const troponin = searchGlobalCalculators('troponin').map(result => result.name);
    expect(troponin).toContain('HEART Score');
  });

  it('reaches the infusion calculators as well as the reference formulae', () => {
    const kinds = new Set(
      searchGlobalCalculators('noradrenaline').map(result => result.kind),
    );
    expect(kinds.has('infusion')).toBe(true);
    expect(kinds.has('formula')).toBe(true);
  });

  it('ignores queries too short to be meaningful', () => {
    expect(searchGlobalCalculators('')).toEqual([]);
    expect(searchGlobalCalculators('  ')).toEqual([]);
    expect(searchGlobalCalculators('g')).toEqual([]);
  });

  it('caps how many suggestions a scoped view has to render', () => {
    expect(searchGlobalCalculators('score', 3).length).toBeLessThanOrEqual(3);
    expect(searchGlobalCalculators('score').length).toBeLessThanOrEqual(6);
  });
});
