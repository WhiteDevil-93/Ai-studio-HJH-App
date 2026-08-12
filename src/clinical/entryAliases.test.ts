import {describe, expect, it} from 'vitest';
import {ENTRY_ALIASES, resolveEntryAlias} from './entryAliases';
import {clinicalData} from './legacyAdapter';
import type {LegacyClinicalRecord} from './entryNormalize';

// Deduplication removed 122 entry files whose clinical payload was byte-identical
// to a surviving entry. A clinician's saved favourite or recently-viewed item may
// still reference a removed ID, so every alias must resolve to an entry that
// actually exists — otherwise a saved item silently vanishes.

const runtimeEntryIds = new Set<string>();
for (const [categoryId, category] of Object.entries(clinicalData)) {
  for (const [subcategoryId, value] of Object.entries(category)) {
    if (categoryId === '16_score_calculators') {
      runtimeEntryIds.add(subcategoryId);
      continue;
    }
    for (const record of (Array.isArray(value) ? value : [value]) as LegacyClinicalRecord[]) {
      const id = record._meta?.id;
      if (id) runtimeEntryIds.add(id);
    }
  }
}

describe('entry alias map', () => {
  it('records an alias for every deduplicated entry', () => {
    expect(Object.keys(ENTRY_ALIASES).length).toBeGreaterThanOrEqual(122);
  });

  it('every alias target is a live entry in the runtime tree', () => {
    const dangling = Object.entries(ENTRY_ALIASES)
      .filter(([, canonicalId]) => !runtimeEntryIds.has(canonicalId))
      .map(([from, to]) => `${from} -> ${to}`);
    expect(dangling).toEqual([]);
  });

  it('no alias source still exists as a live entry', () => {
    // A removed ID must not also be present, or the duplicate is still shipping.
    const stillPresent = Object.keys(ENTRY_ALIASES).filter(id => runtimeEntryIds.has(id));
    expect(stillPresent).toEqual([]);
  });

  it('aliases are fully collapsed (no chains)', () => {
    for (const target of Object.values(ENTRY_ALIASES)) {
      expect(ENTRY_ALIASES[target], `${target} is itself aliased`).toBeUndefined();
    }
  });

  it('resolves removed IDs and passes unknown IDs through unchanged', () => {
    const [removedId, canonicalId] = Object.entries(ENTRY_ALIASES)[0];
    expect(resolveEntryAlias(removedId)).toBe(canonicalId);
    expect(resolveEntryAlias(canonicalId)).toBe(canonicalId);
    expect(resolveEntryAlias('not.an.entry')).toBe('not.an.entry');
  });
});

describe('runtime tree is free of exact duplicate payloads', () => {
  it('no two entries share an identical clinical payload', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const [categoryId, category] of Object.entries(clinicalData)) {
      if (categoryId === '16_score_calculators') continue;
      for (const value of Object.values(category)) {
        for (const record of (Array.isArray(value) ? value : [value]) as LegacyClinicalRecord[]) {
          const {_meta, ...body} = record;
          const id = _meta?.id;
          if (!id) continue;
          const digest = JSON.stringify(body);
          const previous = seen.get(digest);
          if (previous) collisions.push(`${previous} == ${id}`);
          else seen.set(digest, id);
        }
      }
    }
    expect(collisions).toEqual([]);
  });
});
