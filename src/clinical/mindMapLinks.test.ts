import {describe, expect, it} from 'vitest';
import {MIND_MAPS_DATABASE} from '../components/MindMapViewer';
import {QUICK_RESUS_ALGORITHMS} from '../components/HomePage';
import {PROTOCOL_MINDMAP_LINKS} from '../App';

// Every mind-map link in the app must resolve to a real entry in
// MIND_MAPS_DATABASE. The viewer used to fall back to the adult cardiac
// arrest algorithm for unknown IDs, which both presented the WRONG algorithm
// and masked the broken link (the "Status Epilepticus" protocol links pointed
// at a non-existent id for exactly this reason). The fallback is gone; this
// test keeps every link honest at CI time.

describe('mind-map link integrity', () => {
  it('every protocol-title link resolves to a real mind map', () => {
    const unresolved = Object.entries(PROTOCOL_MINDMAP_LINKS)
      .filter(([, mindMapId]) => !MIND_MAPS_DATABASE[mindMapId])
      .map(([title, mindMapId]) => `${title} -> ${mindMapId}`);
    expect(unresolved).toEqual([]);
  });

  it('every Home quick-resus tile resolves to a real mind map', () => {
    const unresolved = QUICK_RESUS_ALGORITHMS
      .filter(algorithm => !MIND_MAPS_DATABASE[algorithm.id])
      .map(algorithm => algorithm.id);
    expect(unresolved).toEqual([]);
  });

  it('does not map an asthma protocol to the croup pathway', () => {
    for (const [title, mindMapId] of Object.entries(PROTOCOL_MINDMAP_LINKS)) {
      if (/asthma/i.test(title)) {
        expect(mindMapId, title).not.toBe('croup_algorithm');
      }
    }
  });
});
