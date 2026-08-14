import {describe, expect, it} from 'vitest';
import {
  entryIdAliases,
  rankCategorySearch,
  type CategorySearchItem,
} from './categorySearch';

interface Sample extends CategorySearchItem {
  id: string;
}

const samples: Sample[] = [
  {
    id: 'asthma-pefr',
    name: 'Asthma PEFR Protocol',
    category: 'Airway',
    body: 'Peak expiratory flow measurement and serial readings.',
  },
  {
    id: 'appendicitis',
    name: 'Acute Appendicitis',
    category: 'Surgery',
    body: 'Alvarado score, appendicectomy timing.',
  },
  {
    id: 'hyperkalaemia',
    name: 'Hyperkalaemia',
    category: 'Metabolic',
    body: 'Calcium gluconate, insulin-dextrose infusion.',
  },
  {
    id: 'sepsis',
    name: 'Sepsis Six',
    category: 'Infection',
    body: 'Lactate, blood cultures, IV antibiotics.',
  },
  {
    id: 'warfarin',
    name: 'Warfarin Reversal',
    category: 'Haematology',
    aliases: ['coumadin'],
    body: 'Vitamin K and prothrombin complex concentrate.',
  },
];

const namesOf = (query: string) => rankCategorySearch(samples, query).map(r => r.item.name);

describe('rankCategorySearch', () => {
  it('returns every item for an empty query, in its original order', () => {
    const results = rankCategorySearch(samples, '');
    expect(results).toHaveLength(samples.length);
    expect(results.map(r => r.item.id)).toEqual(samples.map(s => s.id));
  });

  it('does not let a short query hit mid-word noise', () => {
    // "pe" starts a word in "PEFR" but sits mid-word in "appendicitis" and
    // "hyperkalaemia"; matching those would put the whole library on screen.
    const names = namesOf('pe');
    expect(names).toContain('Asthma PEFR Protocol');
    expect(names).not.toContain('Acute Appendicitis');
    expect(names).not.toContain('Hyperkalaemia');
  });

  it('still matches mid-word once the query is specific enough', () => {
    expect(namesOf('kalaemia')).toContain('Hyperkalaemia');
  });

  it('ranks title matches above body mentions', () => {
    const titleAndBodySamples: Sample[] = [
      {id: 'sepsis', name: 'Sepsis Six', body: 'Lactate, blood cultures, IV antibiotics.'},
      {id: 'trauma', name: 'Major Trauma', body: 'Sepsis screening in penetrating trauma.'},
    ];
    const results = rankCategorySearch(titleAndBodySamples, 'sepsis');
    expect(results[0].item.id).toBe('sepsis');
    expect(results[0].kind).toBe('title');
    expect(results[1].item.id).toBe('trauma');
    expect(results[1].kind).toBe('body');
  });

  it('ranks an exact name above a word-start title above category matches', () => {
    const results = rankCategorySearch(samples, 'sepsis');
    expect(results.map(r => r.item.id)).toEqual(['sepsis']);
  });

  it('matches a category label at the category tier', () => {
    const results = rankCategorySearch(samples, 'metabolic');
    expect(results).toHaveLength(1);
    expect(results[0].item.id).toBe('hyperkalaemia');
    expect(results[0].kind).toBe('category');
  });

  it('matches entry aliases at the category tier', () => {
    const results = rankCategorySearch(samples, 'coumadin');
    expect(results).toHaveLength(1);
    expect(results[0].item.id).toBe('warfarin');
    expect(results[0].kind).toBe('category');
  });

  it('does not search body text for queries shorter than 3 characters', () => {
    // "iv" appears in "IV antibiotics" but the body tier is length-gated.
    expect(namesOf('iv')).not.toContain('Sepsis Six');
  });

  it('matches structured body text once the query is long enough', () => {
    const results = rankCategorySearch(samples, 'prothrombin');
    expect(results.map(r => r.item.id)).toEqual(['warfarin']);
    expect(results[0].kind).toBe('body');
  });

  it('finds nothing for a query in no item at all', () => {
    expect(rankCategorySearch(samples, 'zzzznotanitem')).toEqual([]);
  });
});

describe('entryIdAliases', () => {
  it('returns the removed ids merged into a canonical entry', () => {
    const aliases = entryIdAliases('11_ed_medical_emergencies.protocols.asthma-pefr');
    expect(aliases).toContain('11_ed_medical_emergencies.protocols.asthma-pefr-hjh');
  });

  it('returns nothing for unknown ids', () => {
    expect(entryIdAliases(undefined)).toEqual([]);
    expect(entryIdAliases('not.an.entry')).toEqual([]);
  });

  it('feeds the entry alias map into ranked search', () => {
    const canonical = '11_ed_medical_emergencies.protocols.asthma-pefr';
    const items = [{name: 'Asthma PEFR', aliases: entryIdAliases(canonical)}];
    const results = rankCategorySearch(items, 'pefr-hjh');
    expect(results.map(r => r.item)).toEqual(items);
  });
});
