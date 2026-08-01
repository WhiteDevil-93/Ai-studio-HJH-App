/**
 * Ranking for a facility protocol library search.
 *
 * `HospitalProtocol.searchText` covers the whole transcription, so a plain
 * substring filter answers "asthma" with the ACS and STEMI protocols - they
 * mention the word once in passing. Ranking separates the protocols a query is
 * *about* from the ones that merely mention it, so the caller can show the
 * first group as results and keep the second group out of the way.
 */
import type {HospitalProtocol} from './hospitalProtocols';

export type ProtocolMatchKind = 'title' | 'category' | 'body';

export interface ProtocolSearchResult {
  protocol: HospitalProtocol;
  kind: ProtocolMatchKind;
  rank: number;
}

const normalise = (value: string): string => value.trim().toLocaleLowerCase();

/** True when `needle` starts a word in `haystack`, so "pe" misses "appendix". */
const hasWordStart = (haystack: string, needle: string): boolean => {
  for (let from = 0; from <= haystack.length; ) {
    const index = haystack.indexOf(needle, from);
    if (index < 0) return false;
    const preceding = index === 0 ? '' : haystack[index - 1];
    if (!/[a-z0-9]/i.test(preceding)) return true;
    from = index + 1;
  }
  return false;
};

const TITLE_EXACT = 4;
const TITLE_WORD = 3;
const TITLE_PARTIAL = 2;
const CATEGORY = 1;
const BODY = 0;

// A two-letter query matching mid-word puts every protocol on screen: "pe"
// otherwise "matches" appendicitis and hyperkalaemia. Short queries therefore
// only count where they start a word in the title.
const MID_WORD_MINIMUM_LENGTH = 4;
const BODY_MINIMUM_LENGTH = 3;

const kindForRank = (rank: number): ProtocolMatchKind =>
  rank >= TITLE_PARTIAL ? 'title' : rank === CATEGORY ? 'category' : 'body';

/**
 * Ranked protocol matches, strongest first. An empty query returns every
 * protocol in its original order so the caller can render the full library.
 */
export function rankProtocolSearch(
  protocols: readonly HospitalProtocol[],
  query: string,
): ProtocolSearchResult[] {
  const needle = normalise(query);
  if (!needle) {
    return protocols.map(protocol => ({protocol, kind: 'title', rank: TITLE_EXACT}));
  }

  const allowMidWord = needle.length >= MID_WORD_MINIMUM_LENGTH;
  const allowBody = needle.length >= BODY_MINIMUM_LENGTH;
  const matches: ProtocolSearchResult[] = [];

  for (const protocol of protocols) {
    const title = normalise(protocol.title);
    const categoryLabel = normalise(protocol.categoryLabel);
    let rank: number | undefined;

    if (title === needle) rank = TITLE_EXACT;
    else if (hasWordStart(title, needle)) rank = TITLE_WORD;
    else if (allowMidWord && title.includes(needle)) rank = TITLE_PARTIAL;
    else if (hasWordStart(categoryLabel, needle)) rank = CATEGORY;
    else if (allowMidWord && categoryLabel.includes(needle)) rank = CATEGORY;
    else if (allowBody && protocol.searchText.includes(needle)) rank = BODY;

    if (rank === undefined) continue;
    matches.push({protocol, kind: kindForRank(rank), rank});
  }

  return matches.sort(
    (left, right) =>
      right.rank - left.rank ||
      left.protocol.title.localeCompare(right.protocol.title),
  );
}
