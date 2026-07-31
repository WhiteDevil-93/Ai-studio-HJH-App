import hjhSourceMap from '../../clinical-sources/source-map.json';
import rmmchSourceMap from '../../clinical-sources/source-map-rmmch.json';
import cmjahSourceMap from '../../clinical-sources/source-map-cmjah.json';
import type { SourceReference } from './types';

const normalize = (value: string) => value.trim().toLocaleLowerCase();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsPhrase = (title: string, phrase: string): boolean => {
  const escaped = escapeRegExp(phrase);
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(title);
};

interface SourceMap {
  sourceId: string;
  sections: Array<{match: string; pages: number[]}>;
}

function findMatch(title: string, map: SourceMap): SourceReference | undefined {
  const normalizedTitle = normalize(title);
  const section = map.sections.find(s => {
    const normalizedMatch = normalize(s.match);
    return normalizedTitle === normalizedMatch ||
      containsPhrase(normalizedTitle, normalizedMatch);
  });
  if (!section) return undefined;
  return {
    sourceId: map.sourceId,
    pdfPages: section.pages,
    sectionTitle: section.match,
    transformation: 'condensed',
  };
}

export function sourceReferencesFor(title: string): SourceReference[] {
  const ref = findMatch(title, hjhSourceMap) ?? findMatch(title, rmmchSourceMap) ?? findMatch(title, cmjahSourceMap);

  if (!ref) {
    return [{
      sourceId: 'source-unresolved',
      pdfPages: [],
      sectionTitle: 'Source mapping required',
      transformation: 'combined',
    }];
  }

  return [ref];
}
