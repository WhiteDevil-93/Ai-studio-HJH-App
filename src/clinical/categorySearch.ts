/**
 * Ranking for category-browse search (drugs, procedures, scores, landmark
 * studies, mind maps and policies).
 *
 * The naive alternatives scan every field with `includes()` - and often
 * `JSON.stringify` the structured fields - so a two-letter query like "pe"
 * surfaces appendicitis and hyperkalaemia. This module reuses the protocol
 * library's `normalise` / `hasWordStart` / length-gate ideas and ranks:
 * (1) exact title/name, (2) word-start title, (3) title partial (min length 4),
 * (4) category / drug-name aliases via entryAliases, (5) notes / structured
 * body (min length 3). An empty query returns every item in its original
 * order so the caller can render the full library.
 */
import {ENTRY_ALIASES} from './entryAliases';
import {hasWordStart, normalise} from './protocolSearch';

export type CategoryMatchKind = 'title' | 'category' | 'body';

export interface CategorySearchItem {
  name: string;
  category?: string;
  aliases?: readonly string[];
  notes?: string;
  body?: string;
}

export interface CategorySearchResult<T extends CategorySearchItem> {
  item: T;
  kind: CategoryMatchKind;
  rank: number;
}

const TITLE_EXACT = 4;
const TITLE_WORD = 3;
const TITLE_PARTIAL = 2;
const CATEGORY_OR_ALIAS = 1;
const BODY = 0;

// A two-letter query matching mid-word puts every entry on screen: "pe"
// otherwise "matches" appendicitis and hyperkalaemia. Short queries therefore
// only count where they start a word in the name.
const MID_WORD_MINIMUM_LENGTH = 4;
const BODY_MINIMUM_LENGTH = 3;

// Reverse of ENTRY_ALIASES: a surviving canonical entry id -> the removed ids
// that were merged into it. Removed slugs still carry the old names (e.g.
// "...asthma-pefr-hjh"), so they are searchable name aliases for the item.
const canonicalIdToRemoved = new Map<string, string[]>();
for (const [removedId, canonicalId] of Object.entries(ENTRY_ALIASES)) {
  const removed = canonicalIdToRemoved.get(canonicalId);
  if (removed) removed.push(removedId);
  else canonicalIdToRemoved.set(canonicalId, [removedId]);
}

/** Removed entry ids merged into `canonicalId`, usable as name aliases. */
export function entryIdAliases(canonicalId: string | undefined): readonly string[] {
  return canonicalId ? (canonicalIdToRemoved.get(canonicalId) ?? []) : [];
}

const kindForRank = (rank: number): CategoryMatchKind =>
  rank >= TITLE_PARTIAL ? 'title' : rank === CATEGORY_OR_ALIAS ? 'category' : 'body';

const matchesCategoryOrAlias = (
  item: CategorySearchItem,
  needle: string,
  allowMidWord: boolean,
): boolean => {
  const category = normalise(item.category ?? '');
  if (hasWordStart(category, needle)) return true;
  if (allowMidWord && category.includes(needle)) return true;
  for (const alias of item.aliases ?? []) {
    const aliasText = normalise(alias);
    if (hasWordStart(aliasText, needle)) return true;
    if (allowMidWord && aliasText.includes(needle)) return true;
  }
  return false;
};

const bodyText = (item: CategorySearchItem): string =>
  [item.notes, item.body]
    .filter((part): part is string => Boolean(part))
    .map(normalise)
    .join(' ');

/**
 * Ranked category matches, strongest first. An empty query returns every item
 * in its original order.
 */
export function rankCategorySearch<T extends CategorySearchItem>(
  items: readonly T[],
  query: string,
): CategorySearchResult<T>[] {
  const needle = normalise(query);
  if (!needle) {
    return items.map(item => ({item, kind: 'title', rank: TITLE_EXACT}));
  }

  const allowMidWord = needle.length >= MID_WORD_MINIMUM_LENGTH;
  const allowBody = needle.length >= BODY_MINIMUM_LENGTH;
  const matches: CategorySearchResult<T>[] = [];

  for (const item of items) {
    const name = normalise(item.name);
    let rank: number | undefined;

    if (name === needle) rank = TITLE_EXACT;
    else if (hasWordStart(name, needle)) rank = TITLE_WORD;
    else if (allowMidWord && name.includes(needle)) rank = TITLE_PARTIAL;
    else if (matchesCategoryOrAlias(item, needle, allowMidWord)) rank = CATEGORY_OR_ALIAS;
    else if (allowBody && bodyText(item).includes(needle)) rank = BODY;

    if (rank === undefined) continue;
    matches.push({item, kind: kindForRank(rank), rank});
  }

  // Stable: ties keep the original library order.
  return matches.sort((left, right) => right.rank - left.rank);
}
