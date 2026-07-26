import sourceMap from '../../clinical-sources/source-map.json';
import type { SourceReference } from './types';

const normalize = (value: string) => value.trim().toLocaleLowerCase();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsPhrase = (title: string, phrase: string): boolean => {
  const escaped = escapeRegExp(phrase);
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(title);
};

export function sourceReferencesFor(title: string): SourceReference[] {
  const normalizedTitle = normalize(title);
  const match = sourceMap.sections.find(section => {
    const normalizedMatch = normalize(section.match);
    return normalizedTitle === normalizedMatch ||
      containsPhrase(normalizedTitle, normalizedMatch);
  });

  if (!match) {
    return [{
      sourceId: 'source-unresolved',
      pdfPages: [],
      sectionTitle: 'Source mapping required',
      transformation: 'combined',
    }];
  }

  return [{
    sourceId: sourceMap.sourceId,
    pdfPages: match.pages,
    sectionTitle: match.match,
    transformation: 'condensed',
  }];
}
