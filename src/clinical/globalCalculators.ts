/**
 * Formulas, score calculators and infusion calculators are bedside tools that
 * belong to no single facility, so they stay searchable from every view -
 * including while the search box is scoped to one protocol. Everything else is
 * scoped to whatever the reader is currently looking at.
 */
import {clinicalData} from './legacyAdapter';
import {INFUSION_DEFINITIONS} from './calculations/infusions';
import {legacyTitle, type LegacyClinicalRecord} from './entryNormalize';

export type GlobalCalculatorKind = 'score' | 'formula' | 'infusion';

export const SCORE_CATEGORY_ID = '16_score_calculators';
export const FORMULA_CATEGORY_ID = '7_useful_formulae';

export interface GlobalCalculator {
  id: string;
  kind: GlobalCalculatorKind;
  /** Category view that renders the tool, used to navigate to it. */
  categoryId: string;
  name: string;
  /** One-line supporting text shown under the name on a result chip. */
  detail: string;
  /** Extra terms a clinician is likely to type: acronyms, slugs, aliases. */
  keywords: string[];
  /** Whole-record text, so a symptom or criterion also finds the tool. */
  searchText: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalise = (value: string): string => value.trim().toLocaleLowerCase();

const asText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

// Only connectives are dropped: "Glasgow Coma Scale" has to yield "gcs", so
// words like Scale/Score/Rule must keep contributing their initial.
const ACRONYM_STOP_WORDS = new Set(['of', 'the', 'and', 'for', 'in', 'to', 'a', 'an']);

const acronymOf = (name: string): string => {
  const words = name
    .replace(/\([^)]*\)/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter(word => word.length > 0 && !ACRONYM_STOP_WORDS.has(word.toLocaleLowerCase()));
  if (words.length < 2) return '';
  return words.map(word => word[0]).join('').toLocaleLowerCase();
};

/** `Modified Early Warning Score (MEWS)` also answers to `MEWS`. */
const parentheticalsOf = (name: string): string[] =>
  [...name.matchAll(/\(([^)]+)\)/g)]
    .map(match => normalise(match[1]))
    .filter(Boolean);

const keywordsFor = (name: string, key: string): string[] => {
  const slug = normalise(key);
  const spacedSlug = slug.replace(/[_-]+/g, ' ');
  return [
    ...new Set(
      [slug, spacedSlug, acronymOf(name), ...parentheticalsOf(name)].filter(Boolean),
    ),
  ];
};

const labelFromKey = (key: string): string =>
  key.replace(/[_-]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase());

const searchTextFor = (name: string, keywords: string[], record: unknown): string =>
  normalise([name, keywords.join(' '), JSON.stringify(record) ?? ''].join(' '));

const scoreCalculators = (): GlobalCalculator[] => {
  const category = (clinicalData as Record<string, unknown>)[SCORE_CATEGORY_ID];
  if (!isRecord(category)) return [];

  return Object.entries(category).flatMap(([key, value]) => {
    if (!isRecord(value)) return [];
    const name = asText(value.name) || labelFromKey(key);
    const keywords = keywordsFor(name, key);
    const isFormula = asText(value.calculator_type) === 'formula';
    return [
      {
        id: `score:${key}`,
        kind: isFormula ? ('formula' as const) : ('score' as const),
        categoryId: SCORE_CATEGORY_ID,
        name,
        detail: asText(value.formula) || labelFromKey(asText(value.category)),
        keywords,
        searchText: searchTextFor(name, keywords, value),
      },
    ];
  });
};

const formulaEntries = (): GlobalCalculator[] => {
  const category = (clinicalData as Record<string, unknown>)[FORMULA_CATEGORY_ID];
  if (!isRecord(category)) return [];

  return Object.values(category).flatMap(subcategory => {
    const records: LegacyClinicalRecord[] = Array.isArray(subcategory)
      ? subcategory.filter(isRecord)
      : isRecord(subcategory)
        ? [subcategory]
        : [];

    return records.flatMap(record => {
      const name = legacyTitle(record);
      if (!name) return [];
      const key = record._meta?.id ?? name;
      const keywords = keywordsFor(name, key);
      return [
        {
          id: `formula:${key}`,
          kind: 'formula' as const,
          categoryId: FORMULA_CATEGORY_ID,
          name,
          detail: asText(record.formula) || asText(record.standard_dilutions),
          keywords,
          searchText: searchTextFor(name, keywords, record),
        },
      ];
    });
  });
};

const infusionCalculators = (): GlobalCalculator[] =>
  Object.entries(INFUSION_DEFINITIONS).map(([key, definition]) => {
    const keywords = keywordsFor(definition.title, key);
    return {
      id: `infusion:${key}`,
      kind: 'infusion' as const,
      // Infusion widgets are rendered inside the useful-formulae view.
      categoryId: FORMULA_CATEGORY_ID,
      name: definition.title,
      detail: definition.preparation,
      keywords,
      searchText: searchTextFor(definition.title, keywords, definition),
    };
  });

/**
 * Scores are indexed first so that a topic carried by both an interactive score
 * calculator and a static formulae card (anion gap, corrected sodium, free
 * water deficit) resolves to the interactive one.
 */
const dedupeByName = (calculators: GlobalCalculator[]): GlobalCalculator[] => {
  const seen = new Set<string>();
  return calculators.filter(calculator => {
    const name = normalise(calculator.name);
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
};

export const GLOBAL_CALCULATORS: GlobalCalculator[] = dedupeByName([
  ...scoreCalculators(),
  ...formulaEntries(),
  ...infusionCalculators(),
]);

const MINIMUM_QUERY_LENGTH = 2;
// Whole-record text matches only once the query is specific enough to be worth
// showing; two letters would match almost every calculator's body text.
const CONTENT_MATCH_MINIMUM_LENGTH = 4;

export const DEFAULT_GLOBAL_CALCULATOR_LIMIT = 6;

/**
 * Ranked lookup across every formula, score and infusion calculator, ordered
 * name-first so typing `gcs` or `wells` puts the obvious tool at the front.
 */
export function searchGlobalCalculators(
  query: string,
  limit: number = DEFAULT_GLOBAL_CALCULATOR_LIMIT,
): GlobalCalculator[] {
  const needle = normalise(query);
  if (needle.length < MINIMUM_QUERY_LENGTH) return [];

  const ranked: Array<{calculator: GlobalCalculator; rank: number}> = [];

  for (const calculator of GLOBAL_CALCULATORS) {
    const name = normalise(calculator.name);
    let rank = 0;

    if (name === needle || calculator.keywords.includes(needle)) {
      rank = 4;
    } else if (
      name.startsWith(needle) ||
      calculator.keywords.some(keyword => keyword.startsWith(needle))
    ) {
      rank = 3;
    } else if (name.includes(needle)) {
      rank = 2;
    } else if (
      needle.length >= CONTENT_MATCH_MINIMUM_LENGTH &&
      calculator.searchText.includes(needle)
    ) {
      rank = 1;
    }

    if (rank > 0) ranked.push({calculator, rank});
  }

  return ranked
    .sort(
      (left, right) =>
        right.rank - left.rank ||
        left.calculator.name.localeCompare(right.calculator.name),
    )
    .slice(0, Math.max(0, limit))
    .map(entry => entry.calculator);
}
