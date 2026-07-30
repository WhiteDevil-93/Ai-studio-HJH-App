import {describe, expect, it} from 'vitest';
import {findFlowchartForProtocol, BUILTIN_FLOWCHARTS} from './flowcharts';

describe('flowcharts', () => {
  it('retrieves built-in hypertension flowchart', () => {
    const flowchart = findFlowchartForProtocol('hypertension_flowchart');
    expect(flowchart).toBeDefined();
    expect(flowchart?.id).toBe('hypertension_flowchart');
    expect(flowchart?.initialNodeId).toBe('assess_tod');
    expect(flowchart?.nodes['assess_tod'].options).toHaveLength(2);
  });

  it('retrieves all built-in clinical flowcharts', () => {
    const builtins = [
      'hypertension_flowchart',
      'hyperglycaemia_flowchart',
      'status_epilepticus_algorithm',
      'pe_algorithm',
      'jaundice_flowchart',
    ];

    builtins.forEach(id => {
      const flowchart = findFlowchartForProtocol(id);
      expect(flowchart).toBeDefined();
      expect(flowchart?.nodes).toBeDefined();
      expect(Object.keys(flowchart?.nodes ?? {}).length).toBeGreaterThan(1);
    });
  });

  it('generates dynamic flowchart from management steps when no built-in exists', () => {
    const mockBody = {
      item: 'Anaphylaxis Algorithm',
      management_steps: [
        {step_number: '1', action: 'Assess Airway & Breathing', details: 'Check for stridor or severe wheeze.'},
        {step_number: '2', action: 'Give STAT Adrenaline', details: 'Give Adrenaline 0.5mg IM stat.'},
        {step_number: '3', action: 'IV Fluid Resuscitation', details: '1-2L Ringers Lactate.'},
      ],
    };

    const flowchart = findFlowchartForProtocol('anaphylaxis_algorithm', mockBody);
    expect(flowchart).toBeDefined();
    expect(flowchart?.title).toContain('Anaphylaxis Algorithm');
    expect(flowchart?.initialNodeId).toBe('step_1');
    expect(flowchart?.nodes['step_1'].title).toBe('Assess Airway & Breathing');
    expect(flowchart?.nodes['step_2'].title).toBe('Give STAT Adrenaline');
  });

  it('returns undefined when no steps or text exist', () => {
    const flowchart = findFlowchartForProtocol('empty_protocol', {});
    expect(flowchart).toBeUndefined();
  });
});
