import {describe, expect, it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ProtocolLandingPage} from './ProtocolLandingPage';
import {findHospitalProtocol} from '../clinical/hospitalProtocols';

const protocol = findHospitalProtocol('hjh', 'hyperkalaemia');

const render = (searchQuery: string, extras: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    createElement(ProtocolLandingPage, {
      protocol: protocol!,
      onBack: () => undefined,
      onOpenProtocol: () => undefined,
      weight: '70',
      setWeight: () => undefined,
      searchQuery,
      onClearSearch: () => undefined,
      onSearchAllProtocols: () => undefined,
      onOpenCalculator: () => undefined,
      ...extras,
    }),
  );

const markCount = (html: string): number =>
  html.split('data-search-match').length - 1;

describe('protocol-scoped search', () => {
  it('has a protocol to exercise', () => {
    expect(protocol).toBeDefined();
  });

  it('says plainly that the search is limited to this protocol', () => {
    const html = render('calcium');
    expect(html).toContain('This protocol only');
    expect(html).toContain('Search all HJH protocols');
  });

  it('marks every hit inside the protocol so the find bar can step through them', () => {
    const html = render('calcium');
    expect(markCount(html)).toBeGreaterThan(0);
  });

  it('shows no find bar at all until something is typed', () => {
    const html = render('');
    expect(html).not.toContain('This protocol only');
    expect(markCount(html)).toBe(0);
  });

  it('reports a miss instead of silently showing the whole protocol', () => {
    const html = render('zzzznotinthisprotocol');
    expect(html).toContain('No matches');
    expect(markCount(html)).toBe(0);
  });

  it('still offers formulas and scores, which are never scoped to a protocol', () => {
    // Nothing in the hyperkalaemia protocol is titled GCS, so the only way this
    // can appear is the deliberately global calculator lane.
    const html = render('gcs');
    expect(html).toContain('Formulas &amp; scores');
    expect(html).toContain('Glasgow Coma Scale');
    expect(html).toContain('Always searched globally');
  });

  it('leaves the calculator lane out when the query matches no calculator', () => {
    const html = render('zzzznotinthisprotocol');
    expect(html).not.toContain('Formulas &amp; scores');
  });
});
