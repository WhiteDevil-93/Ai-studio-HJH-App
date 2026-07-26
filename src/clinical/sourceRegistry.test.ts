import {describe, expect, it} from 'vitest';
import {sourceReferencesFor} from './sourceRegistry';

describe('clinical source registry', () => {
  it('maps complete source phrases within longer application titles', () => {
    expect(sourceReferencesFor('Acute Coronary Syndrome (ACS) Algorithm')[0])
      .toMatchObject({sourceId: 'hjh-ed-2026-v1', pdfPages: [9, 10, 11]});
  });

  it('does not map partial drug-name substrings', () => {
    expect(sourceReferencesFor('Noradrenaline')[0].sourceId)
      .toBe('source-unresolved');
  });

  it('does not infer a source from a short title contained inside a source heading', () => {
    expect(sourceReferencesFor('RR')[0].sourceId)
      .toBe('source-unresolved');
  });
});
