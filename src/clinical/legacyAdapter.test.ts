import {describe, expect, it} from 'vitest';
import {clinicalData} from './legacyAdapter';
import preMigrationIds from './__fixtures__/pre-migration-ids.json';

function collectIds(): string[] {
  const ids: string[] = [];
  for (const [categoryId, category] of Object.entries(clinicalData)) {
    if (categoryId === '16_score_calculators') continue;
    for (const value of Object.values(category)) {
      for (const record of Array.isArray(value) ? value : [value]) {
        if (record._meta?.id) ids.push(record._meta.id);
      }
    }
  }
  return ids;
}

describe('legacy clinical data normalization', () => {
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

  it('preserves pre-migration entry IDs', () => {
    // Snapshot taken before the data.json -> per-entry-file migration. Every
    // ID here is a localStorage key for a user's favourites/recently-viewed
    // (see getEntryKey in App.tsx) — losing one silently loses their saved
    // state, so this must stay a subset check across the migration.
    const currentIds = new Set(collectIds());
    const missing = preMigrationIds.filter(id => !currentIds.has(id));
    expect(missing).toEqual([]);
  });

  it('derives sourceGroup from the entry file, not the category', () => {
    // An EDL entry filed under 8_cardiovascular (alongside Bara-sourced
    // content, since that's where it clinically belongs) must still report
    // its real provenance rather than being swept into the 'bara_icu'
    // fallback just because of its category placement.
    const cardiovascular = clinicalData['8_cardiovascular'] as Record<string, unknown[]>;
    const edlEntry = Object.values(cardiovascular)
      .flat()
      .find((record: any) => record?._meta?.sourceGroup === 'edl_phc');
    expect(edlEntry).toBeDefined();
  });

  it('leaves score calculators unannotated', () => {
    const gcs = (clinicalData['16_score_calculators'] as Record<string, unknown>).gcs as any;
    expect(gcs._meta).toBeUndefined();
    expect(gcs.name).toBe('Glasgow Coma Scale');
    expect(Array.isArray(gcs.components)).toBe(true);
  });
});
