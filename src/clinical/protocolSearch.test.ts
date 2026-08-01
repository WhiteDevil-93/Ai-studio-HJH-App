import {describe, expect, it} from 'vitest';
import {rankProtocolSearch} from './protocolSearch';
import {HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY} from './hospitalProtocols';

const hjh = HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY.hjh;

const titlesOf = (query: string, kind?: string) =>
  rankProtocolSearch(hjh, query)
    .filter(result => !kind || result.kind === kind)
    .map(result => result.protocol.title);

describe('rankProtocolSearch', () => {
  it('returns the whole library for an empty query, in its original order', () => {
    const results = rankProtocolSearch(hjh, '');
    expect(results).toHaveLength(hjh.length);
    expect(results.map(result => result.protocol.id)).toEqual(
      hjh.map(protocol => protocol.id),
    );
  });

  it('puts the protocol the query is about ahead of one that merely mentions it', () => {
    const results = rankProtocolSearch(hjh, 'asthma');
    expect(results.length).toBeGreaterThan(1);
    expect(results[0].kind).toBe('title');
    expect(results[0].protocol.title.toLocaleLowerCase()).toContain('asthma');

    // The ACS and STEMI protocols mention asthma in passing; they must not be
    // able to outrank the asthma protocol itself.
    const passingMentions = results.filter(result => result.kind === 'body');
    expect(passingMentions.length).toBeGreaterThan(0);
    for (const mention of passingMentions) {
      expect(mention.protocol.title.toLocaleLowerCase()).not.toContain('asthma');
    }
  });

  it('classifies every match as title, category or body', () => {
    for (const result of rankProtocolSearch(hjh, 'sepsis')) {
      expect(['title', 'category', 'body']).toContain(result.kind);
    }
  });

  it('matches a short query on word starts, not on letters buried inside a word', () => {
    const titles = titlesOf('pe', 'title');
    expect(titles.some(title => /PEFR/i.test(title))).toBe(true);
    // "appendicitis" and "hyperkalaemia" both contain "pe" mid-word; a
    // two-letter query that matched those would return the whole library.
    expect(titles.some(title => /appendicitis|hyperkalaemia/i.test(title))).toBe(false);
    expect(rankProtocolSearch(hjh, 'pe').length).toBeLessThan(10);
  });

  it('still matches mid-word once the query is specific enough', () => {
    expect(titlesOf('kalaemia', 'title')).toContain('Hypokalaemia');
  });

  it('groups a whole specialty when the query names its category', () => {
    const toxicology = rankProtocolSearch(hjh, 'toxicology').filter(
      result => result.kind === 'category',
    );
    expect(toxicology.length).toBeGreaterThan(1);
  });

  it('finds nothing for a query in no protocol at all', () => {
    expect(rankProtocolSearch(hjh, 'zzzznotaprotocol')).toEqual([]);
  });
});
