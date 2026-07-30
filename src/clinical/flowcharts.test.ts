import {describe, expect, it} from 'vitest';
import {findFlowchartForProtocol, HYPERTENSION_FLOWCHART_DATA} from './flowcharts';

describe('flowcharts', () => {
  it('retrieves built-in hypertension flowchart', () => {
    const flowchart = findFlowchartForProtocol('hypertension_flowchart');
    expect(flowchart).toBeDefined();
    expect(flowchart?.id).toBe('hypertension_flowchart');
    expect(flowchart?.initialNodeId).toBe('assess_tod');
    expect(flowchart?.nodes['assess_tod'].options).toHaveLength(2);
  });

  it('parses custom flowchart embedded in protocol body', () => {
    const customBody = {
      flowchart: {
        id: 'custom_flowchart',
        title: 'Custom Algorithm',
        initialNodeId: 'node_1',
        nodes: {
          node_1: {
            id: 'node_1',
            type: 'decision',
            title: 'Custom Decision',
          },
        },
      },
    };

    const flowchart = findFlowchartForProtocol('some_protocol', customBody);
    expect(flowchart).toBeDefined();
    expect(flowchart?.title).toBe('Custom Algorithm');
  });

  it('returns undefined when no flowchart exists', () => {
    const flowchart = findFlowchartForProtocol('unknown_protocol', {});
    expect(flowchart).toBeUndefined();
  });
});
