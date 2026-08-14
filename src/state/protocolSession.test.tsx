// @vitest-environment happy-dom
import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  ProtocolSessionProvider,
  ProtocolSessionRegistry,
  createEmptySession,
  useProtocolSession,
  type UseProtocolSessionResult,
} from './protocolSession';

// ---------------------------------------------------------------------------
// Pure registry / store / factory tests (no React renderer needed)
// ---------------------------------------------------------------------------

describe('createEmptySession', () => {
  it('returns a fresh, deeply independent session on every call', () => {
    const first = createEmptySession();
    const second = createEmptySession();
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    first.weight = '72';
    first.calculatorInputs['qsofa'] = {hr: '120'};
    expect(second.weight).toBe('');
    expect(second.calculatorInputs).toEqual({});
  });
});

describe('ProtocolSessionRegistry lifecycle', () => {
  let registry: ProtocolSessionRegistry;

  beforeEach(() => {
    registry = new ProtocolSessionRegistry();
  });

  it('creates a session on open and discards it on close', () => {
    expect(registry.has('hjh:asthma')).toBe(false);
    registry.create('hjh:asthma');
    expect(registry.has('hjh:asthma')).toBe(true);
    expect(registry.getSession('hjh:asthma')).toEqual(createEmptySession());
    expect(registry.listContexts()).toEqual(['hjh:asthma']);

    registry.close('hjh:asthma');
    expect(registry.has('hjh:asthma')).toBe(false);
    expect(registry.get('hjh:asthma')).toBeUndefined();
    expect(registry.getSession('hjh:asthma')).toBeUndefined();
    expect(registry.listContexts()).toEqual([]);
  });

  it('keeps an existing session when create is called again on the same context', () => {
    registry.create('hjh:asthma');
    const store = registry.get('hjh:asthma')!;
    store.update(prev => ({...prev, weight: '64'}));

    const again = registry.create('hjh:asthma');
    expect(again).toBe(store);
    expect(registry.getSession('hjh:asthma')?.weight).toBe('64');
  });

  it('starts a fresh empty session after close + re-open (no residue across sessions)', () => {
    registry.create('hjh:asthma');
    registry.get('hjh:asthma')!.update(prev => ({...prev, weight: '90'}));
    registry.close('hjh:asthma');

    registry.create('hjh:asthma');
    expect(registry.getSession('hjh:asthma')).toEqual(createEmptySession());
  });

  it('stores notify subscribers on update and drop them on unsubscribe', () => {
    const store = registry.create('hjh:asthma');
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.update(prev => ({...prev, weight: '70'}));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.update(prev => ({...prev, weight: '71'}));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reset returns the session to a pristine empty state', () => {
    const store = registry.create('hjh:asthma');
    store.update(prev => ({
      ...prev,
      weight: '88',
      calculatorInputs: {qsofa: {hr: '110'}},
    }));
    store.reset();
    expect(store.getState()).toEqual(createEmptySession());
  });
});

describe('ProtocolSessionRegistry isolation between concurrent contexts', () => {
  let registry: ProtocolSessionRegistry;

  beforeEach(() => {
    registry = new ProtocolSessionRegistry();
  });

  it('keeps sessions of concurrently open contexts fully separate', () => {
    registry.create('hjh:asthma');
    registry.create('cmjah:overdose');

    const asthma = registry.get('hjh:asthma')!;
    const overdose = registry.get('cmjah:overdose')!;

    asthma.update(prev => ({
      ...prev,
      weight: '58',
      calculatorInputs: {qsofa: {hr: '96'}},
      flowchartProgress: {hypertension: {currentNodeId: 'n2', history: ['n1']}},
      checklistSelections: {alvarado: {rlq_tenderness: 'yes'}},
    }));

    expect(registry.getSession('cmjah:overdose')).toEqual(createEmptySession());
    expect(overdose.getState()).not.toBe(asthma.getState());

    overdose.update(prev => ({...prev, weight: '75'}));
    expect(registry.getSession('hjh:asthma')?.weight).toBe('58');
    expect(registry.getSession('cmjah:overdose')?.weight).toBe('75');
  });

  it('does not share nested object references between contexts', () => {
    const first = registry.create('hjh:asthma');
    const second = registry.create('cmjah:overdose');
    first.update(prev => ({
      ...prev,
      calculatorInputs: {qsofa: {hr: '96'}},
    }));
    const firstInputs = first.getState().calculatorInputs['qsofa'];
    expect(second.getState().calculatorInputs['qsofa']).toBeUndefined();
    firstInputs['hr'] = '120';
    expect(second.getState().calculatorInputs).toEqual({});
  });
});

describe('session state is never persisted', () => {
  let registry: ProtocolSessionRegistry;

  beforeEach(() => {
    registry = new ProtocolSessionRegistry();
  });

  it('never touches localStorage across a full create/write/close lifecycle', () => {
    const setItem = vi.spyOn(localStorage, 'setItem');
    const removeItem = vi.spyOn(localStorage, 'removeItem');
    const getItem = vi.spyOn(localStorage, 'getItem');

    registry.create('hjh:asthma');
    const store = registry.get('hjh:asthma')!;
    store.update(prev => ({
      ...prev,
      weight: '62',
      calculatorInputs: {alvarado: {migration: 'yes'}},
      flowchartProgress: {hypertension: {currentNodeId: 'n3', history: ['n1', 'n2']}},
      checklistSelections: {qsofa: {sbp: 'yes'}},
    }));
    store.reset();
    registry.close('hjh:asthma');
    registry.create('hjh:asthma');
    registry.close('hjh:asthma');

    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();

    setItem.mockRestore();
    removeItem.mockRestore();
    getItem.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Hook tests (happy-dom + react-dom/client)
// ---------------------------------------------------------------------------

interface ProbeProps {
  contextId?: string | null;
  registry: ProtocolSessionRegistry;
  onApi?: (api: UseProtocolSessionResult) => void;
}

function SessionProbe({contextId, registry, onApi}: ProbeProps) {
  const api = useProtocolSession({contextId, registry});
  onApi?.(api);
  return (
    <div data-testid="session-probe">
      <span data-testid="weight">{api.session.weight}</span>
      <span data-testid="inputs">
        {JSON.stringify(api.session.calculatorInputs)}
      </span>
      <span data-testid="flowcharts">
        {JSON.stringify(api.session.flowchartProgress)}
      </span>
      <span data-testid="checklists">
        {JSON.stringify(api.session.checklistSelections)}
      </span>
    </div>
  );
}

function ProviderProbe({
  registry,
  onApi,
}: {
  registry: ProtocolSessionRegistry;
  onApi?: (api: UseProtocolSessionResult) => void;
}) {
  return (
    <ProtocolSessionProvider contextId="hjh:asthma" registry={registry}>
      <SessionProbe registry={registry} onApi={onApi} />
    </ProtocolSessionProvider>
  );
}

describe('useProtocolSession', () => {
  let container: HTMLDivElement;
  let root: Root;
  let registry: ProtocolSessionRegistry;

  beforeEach(() => {
    (globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    registry = new ProtocolSessionRegistry();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('returns an empty session with no-op writes when no context is active', async () => {
    let api: UseProtocolSessionResult | undefined;
    await act(async () => {
      root.render(
        <SessionProbe contextId={null} registry={registry} onApi={a => (api = a)} />,
      );
    });
    expect(api?.session).toEqual(createEmptySession());
    await act(async () => {
      api?.setWeight('99');
      api?.setCalculatorInput('qsofa', 'hr', '110');
    });
    expect(api?.session.weight).toBe('');
    expect(registry.listContexts()).toEqual([]);
  });

  it('holds state per context and reacts to setters', async () => {
    let api: UseProtocolSessionResult | undefined;
    await act(async () => {
      root.render(
        <SessionProbe contextId="hjh:asthma" registry={registry} onApi={a => (api = a)} />,
      );
    });
    expect(api?.session).toEqual(createEmptySession());

    await act(async () => {
      api?.setWeight('67');
      api?.setCalculatorInput('qsofa', 'hr', '104');
      api?.setFlowchartProgress('hypertension', {
        currentNodeId: 'n2',
        history: ['n1'],
      });
      api?.setChecklistSelection('alvarado', 'migration', 'yes');
    });

    expect(api?.session.weight).toBe('67');
    expect(api?.session.calculatorInputs).toEqual({qsofa: {hr: '104'}});
    expect(api?.session.flowchartProgress).toEqual({
      hypertension: {currentNodeId: 'n2', history: ['n1']},
    });
    expect(api?.session.checklistSelections).toEqual({
      alvarado: {migration: 'yes'},
    });
  });

  it('does not leak state between two mounted contexts', async () => {
    let apiA: UseProtocolSessionResult | undefined;
    let apiB: UseProtocolSessionResult | undefined;
    await act(async () => {
      root.render(
        <div>
          <SessionProbe contextId="hjh:asthma" registry={registry} onApi={a => (apiA = a)} />
          <SessionProbe contextId="cmjah:overdose" registry={registry} onApi={a => (apiB = a)} />
        </div>,
      );
    });

    await act(async () => {
      apiA?.setWeight('52');
      apiA?.setCalculatorInput('qsofa', 'hr', '98');
    });

    expect(apiA?.session.weight).toBe('52');
    expect(apiB?.session.weight).toBe('');
    expect(apiB?.session.calculatorInputs).toEqual({});
  });

  it('reset clears the current session only', async () => {
    let apiA: UseProtocolSessionResult | undefined;
    let apiB: UseProtocolSessionResult | undefined;
    await act(async () => {
      root.render(
        <div>
          <SessionProbe contextId="hjh:asthma" registry={registry} onApi={a => (apiA = a)} />
          <SessionProbe contextId="cmjah:overdose" registry={registry} onApi={a => (apiB = a)} />
        </div>,
      );
    });
    await act(async () => {
      apiA?.setWeight('52');
      apiB?.setWeight('81');
    });
    await act(async () => {
      apiA?.reset();
    });
    expect(apiA?.session.weight).toBe('');
    expect(apiB?.session.weight).toBe('81');
  });

  it('bulk setters replace the whole bucket for the context', async () => {
    let api: UseProtocolSessionResult | undefined;
    await act(async () => {
      root.render(
        <SessionProbe contextId="hjh:asthma" registry={registry} onApi={a => (api = a)} />,
      );
    });
    await act(async () => {
      api?.setCalculatorInputs({qsofa: {hr: '100'}});
      api?.setChecklistSelections({alvarado: {migration: 'yes'}});
    });
    expect(api?.session.calculatorInputs).toEqual({qsofa: {hr: '100'}});
    expect(api?.session.checklistSelections).toEqual({
      alvarado: {migration: 'yes'},
    });
  });
});

describe('ProtocolSessionProvider', () => {
  let container: HTMLDivElement;
  let root: Root;
  let registry: ProtocolSessionRegistry;

  beforeEach(() => {
    (globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    registry = new ProtocolSessionRegistry();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('creates the session while the context is open and discards it on close', async () => {
    let api: UseProtocolSessionResult | undefined;
    await act(async () => {
      root.render(<ProviderProbe registry={registry} onApi={a => (api = a)} />);
    });
    expect(registry.has('hjh:asthma')).toBe(true);
    await act(async () => {
      api?.setWeight('73');
    });
    expect(registry.getSession('hjh:asthma')?.weight).toBe('73');

    await act(async () => {
      root.unmount();
    });
    expect(registry.has('hjh:asthma')).toBe(false);
    expect(registry.getSession('hjh:asthma')).toBeUndefined();
  });

  it('switching the context id discards the old session and starts a fresh one', async () => {
    let api: UseProtocolSessionResult | undefined;
    const harness = ({contextId}: {contextId: string | null}) => (
      <ProtocolSessionProvider contextId={contextId} registry={registry}>
        <SessionProbe registry={registry} onApi={a => (api = a)} />
      </ProtocolSessionProvider>
    );

    await act(async () => {
      root.render(harness({contextId: 'hjh:asthma'}));
    });
    await act(async () => {
      api?.setWeight('73');
    });
    expect(registry.has('hjh:asthma')).toBe(true);

    await act(async () => {
      root.render(harness({contextId: 'cmjah:overdose'}));
    });
    expect(registry.has('hjh:asthma')).toBe(false);
    expect(registry.has('cmjah:overdose')).toBe(true);
    expect(registry.getSession('cmjah:overdose')).toEqual(createEmptySession());
    expect(api?.session.weight).toBe('');

    await act(async () => {
      root.render(harness({contextId: null}));
    });
    expect(registry.listContexts()).toEqual([]);
  });
});
