import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {GlobalReferenceDocumentPage} from './GlobalReferenceDocumentPage';

describe('GlobalReferenceDocumentPage', () => {
  it('presents the guideline directory without internal filenames or audit banners', () => {
    const markup = renderToStaticMarkup(createElement(GlobalReferenceDocumentPage, {
      documentId: 'guidelines',
      searchQuery: '',
    }));

    expect(markup).toContain('International Clinical Guidelines');
    expect(markup).toContain('43 of 43 entries');
    expect(markup).not.toContain('clinical-guidelines-reference-v3.md');
    expect(markup).not.toContain('Audit required');
    expect(markup).not.toContain('Supplied global reference document');
  });

  it('presents pocket-reference content with professional reader-facing labels', () => {
    const markup = renderToStaticMarkup(createElement(GlobalReferenceDocumentPage, {
      documentId: 'pocket',
      searchQuery: '',
    }));

    expect(markup).toContain('Emergency Medicine Pocket Guides');
    expect(markup).toContain('9 of 9 entries');
    expect(markup).toContain('Landmark trial summaries');
    expect(markup).toContain('Adapted clinical protocols');
    expect(markup).toContain('Clinical bibliography');
    expect(markup).toContain('Clinical interpretation');
    expect(markup).not.toContain('Mobile-Optimised Clinical Cheatsheet');
    expect(markup).not.toContain('The Killer Stat');
    expect(markup).not.toContain('30-SECOND ROUNDING PITCHES');
    expect(markup).not.toContain('30-Second Rounding Pitch');
  });
});
