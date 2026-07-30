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
});
