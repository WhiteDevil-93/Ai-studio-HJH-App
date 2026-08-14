import {describe, expect, it} from 'vitest';
import {parseProtocolBlocks} from './protocolBlocks';

describe('parseProtocolBlocks', () => {
  it('returns nothing for empty text', () => {
    expect(parseProtocolBlocks('')).toEqual([]);
    expect(parseProtocolBlocks('   \n \n')).toEqual([]);
  });

  it('keeps YES and NO as ordinary paragraph text', () => {
    expect(parseProtocolBlocks('YES\nNO\nYES TO ALL\nNO TO ANY')).toEqual([
      {kind: 'paragraph', text: 'YES', level: 0},
      {kind: 'paragraph', text: 'NO', level: 0},
      {kind: 'paragraph', text: 'YES TO ALL', level: 0},
      {kind: 'paragraph', text: 'NO TO ANY', level: 0},
    ]);
  });

  it('does not classify uppercase lines as headings', () => {
    expect(parseProtocolBlocks('MANAGEMENT\nRED FLAGS\nCONTRAINDICATIONS')).toEqual([
      {kind: 'paragraph', text: 'MANAGEMENT', level: 0},
      {kind: 'paragraph', text: 'RED FLAGS', level: 0},
      {kind: 'paragraph', text: 'CONTRAINDICATIONS', level: 0},
    ]);
  });

  it('preserves numbered markers in document order', () => {
    expect(
      parseProtocolBlocks(
        [
          '1. Anyone DIRECTLY EXPOSED TO THE PATIENT’S ORAL SECRETIONS',
          '2. HOUSEHOLD MEMBERS',
          '3. INSTITUTIONAL CONTACTS',
          '4. NURSERY SCHOOL or DAY CARE CENTRE CLOSE CONTACTS ONLY',
        ].join('\n'),
      ),
    ).toEqual([
      {
        kind: 'item',
        marker: '1.',
        text: 'Anyone DIRECTLY EXPOSED TO THE PATIENT’S ORAL SECRETIONS',
        level: 0,
      },
      {kind: 'item', marker: '2.', text: 'HOUSEHOLD MEMBERS', level: 0},
      {kind: 'item', marker: '3.', text: 'INSTITUTIONAL CONTACTS', level: 0},
      {
        kind: 'item',
        marker: '4.',
        text: 'NURSERY SCHOOL or DAY CARE CENTRE CLOSE CONTACTS ONLY',
        level: 0,
      },
    ]);
  });

  it('preserves lettered sub-markers and indent depth', () => {
    expect(
      parseProtocolBlocks(
        [
          '1. Anyone DIRECTLY EXPOSED',
          'a) Kissing',
          'b) Sharing of food or beverages or eating utensils',
          '    c) Mouth-to-mouth resuscitation',
        ].join('\n'),
      ),
    ).toEqual([
      {kind: 'item', marker: '1.', text: 'Anyone DIRECTLY EXPOSED', level: 0},
      {kind: 'item', marker: 'a)', text: 'Kissing', level: 0},
      {kind: 'item', marker: 'b)', text: 'Sharing of food or beverages or eating utensils', level: 0},
      {kind: 'item', marker: 'c)', text: 'Mouth-to-mouth resuscitation', level: 1},
    ]);
  });

  it('keeps bullet glyphs as markers rather than replacing them with checkmarks', () => {
    expect(
      parseProtocolBlocks(['• Age > 65', '* Diabetes', '- Shock/Dehydration'].join('\n')),
    ).toEqual([
      {kind: 'item', marker: '•', text: 'Age > 65', level: 0},
      {kind: 'item', marker: '*', text: 'Diabetes', level: 0},
      {kind: 'item', marker: '-', text: 'Shock/Dehydration', level: 0},
    ]);
  });

  it('does not treat a decimal dose as a numbered step', () => {
    expect(parseProtocolBlocks('1.5mg IV stat')).toEqual([
      {kind: 'paragraph', text: '1.5mg IV stat', level: 0},
    ]);
  });

  it('splits inline bullet separators without rewriting the wording', () => {
    expect(parseProtocolBlocks('First point • Second point')).toEqual([
      {kind: 'paragraph', text: 'First point', level: 0},
      {kind: 'item', marker: '•', text: 'Second point', level: 0},
    ]);
  });

  it('preserves warning and caution wording as plain content', () => {
    expect(
      parseProtocolBlocks(
        [
          'WARNING: Do not delay reperfusion',
          'ALL FEMALE PATIENTS MUST HAVE A PREGNANCY TEST DOCUMENTED',
          'NB: Recent history of head trauma?',
        ].join('\n'),
      ),
    ).toEqual([
      {kind: 'paragraph', text: 'WARNING: Do not delay reperfusion', level: 0},
      {
        kind: 'paragraph',
        text: 'ALL FEMALE PATIENTS MUST HAVE A PREGNANCY TEST DOCUMENTED',
        level: 0,
      },
      {kind: 'paragraph', text: 'NB: Recent history of head trauma?', level: 0},
    ]);
  });
});
