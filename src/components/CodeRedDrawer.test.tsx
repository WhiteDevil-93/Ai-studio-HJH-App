import {describe, expect, it} from 'vitest';
import {EMERGENCY_ACTIONS, getCodeRedAction} from './CodeRedDrawer';
import {MIND_MAPS_DATABASE} from '../clinical/mindMaps';

describe('Code Red derives from canonical mind-map sources', () => {
  it('every emergency action references a mind map in the canonical registry', () => {
    const unresolved = EMERGENCY_ACTIONS
      .filter(action => !MIND_MAPS_DATABASE[action.sourceId])
      .map(action => action.sourceId);
    expect(unresolved).toEqual([]);
  });

  it('does not duplicate clinical strings in the action references', () => {
    for (const action of EMERGENCY_ACTIONS) {
      expect(action, action.id).not.toHaveProperty('title');
      expect(action, action.id).not.toHaveProperty('subtitle');
      expect(action, action.id).not.toHaveProperty('dosage');
      expect(action, action.id).not.toHaveProperty('details');
    }
  });

  it('renders title and subtitle from the canonical source', () => {
    for (const actionRef of EMERGENCY_ACTIONS) {
      const source = MIND_MAPS_DATABASE[actionRef.sourceId];
      const resolved = getCodeRedAction(actionRef);
      expect(resolved).not.toBeNull();
      expect(resolved!.title).toBe(source.title);
      expect(resolved!.subtitle).toBe(source.subtitle);
    }
  });

  it('propagates a change in the canonical source to the resolved action', () => {
    const actionRef = EMERGENCY_ACTIONS[0];
    const customDatabase = {
      [actionRef.sourceId]: {
        ...MIND_MAPS_DATABASE[actionRef.sourceId],
        title: 'Canonical title updated',
        subtitle: 'Canonical subtitle updated',
      },
    };
    const resolved = getCodeRedAction(actionRef, customDatabase);
    expect(resolved!.title).toBe('Canonical title updated');
    expect(resolved!.subtitle).toBe('Canonical subtitle updated');
  });
});
