import React, {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react';

/**
 * Protocol-scoped session state.
 *
 * Patient/encounter state (weight, calculator inputs, flowchart progress,
 * checklist selections) is scoped to a single protocol context. A session is
 * created when a protocol context opens and discarded when it closes — nothing
 * crosses protocol or session boundaries, and nothing in a session is ever
 * written to localStorage (or any other persistent store).
 *
 * Persistent state is deliberately limited to UI/user preferences:
 *
 *   - 'tr_theme'   — theme preference (dark/light)
 *   - 'tr_f'       — favourite entries (by canonical entry key)
 *   - 'tr_rv'      — recently viewed entries (most recent 15)
 *
 * 'tr_w' (persisted patient weight) is a legacy key that leaked patient state
 * across sessions; it is removed from the persistent surface by a follow-up
 * bead. No session field below may be persisted.
 */

export type ProtocolContextId = string;

export interface FlowchartProgress {
  currentNodeId: string;
  history: string[];
}

/**
 * All patient/encounter state belonging to one protocol context. Keys are
 * generic across facilities: a context id (e.g. `'hjh:asthma'`) bounds the
 * session, and facility protocols never read another context's session.
 */
export interface ProtocolSession {
  /** Patient weight as typed by the clinician, scoped to this protocol. */
  weight: string;
  /** Calculator/formula inputs keyed by calculator key, then field key. */
  calculatorInputs: Record<string, Record<string, string>>;
  /** Interactive flowchart position keyed by flowchart id. */
  flowchartProgress: Record<string, FlowchartProgress>;
  /** Checklist-style selections keyed by checklist key, then field key. */
  checklistSelections: Record<string, Record<string, unknown>>;
}

export function createEmptySession(): ProtocolSession {
  return {
    weight: '',
    calculatorInputs: {},
    flowchartProgress: {},
    checklistSelections: {},
  };
}

/**
 * Stable empty snapshot for the hook when no protocol context is active.
 * Frozen so a component cannot accidentally mutate the shared fallback; the
 * registry never sees it.
 */
const EMPTY_SESSION: ProtocolSession = Object.freeze({
  weight: '',
  calculatorInputs: Object.freeze({}),
  flowchartProgress: Object.freeze({}),
  checklistSelections: Object.freeze({}),
});

type SessionUpdater = (prev: ProtocolSession) => ProtocolSession;
type Listener = () => void;

class ProtocolSessionStore {
  private state: ProtocolSession;
  private readonly listeners = new Set<Listener>();

  constructor() {
    this.state = createEmptySession();
  }

  getState(): ProtocolSession {
    return this.state;
  }

  update(updater: SessionUpdater): void {
    this.state = updater(this.state);
    for (const listener of this.listeners) listener();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  reset(): void {
    this.update(() => createEmptySession());
  }
}

/**
 * In-memory registry of sessions keyed by protocol context id. Session
 * lifecycle is managed through the registry: `create` when a context opens,
 * `close` when it closes. The registry holds no reference to any persistent
 * store — sessions exist only in memory for as long as their context is open.
 */
export class ProtocolSessionRegistry {
  private readonly stores = new Map<ProtocolContextId, ProtocolSessionStore>();

  create(contextId: ProtocolContextId): ProtocolSessionStore {
    const existing = this.stores.get(contextId);
    if (existing) return existing;
    const store = new ProtocolSessionStore();
    this.stores.set(contextId, store);
    return store;
  }

  close(contextId: ProtocolContextId): void {
    this.stores.delete(contextId);
  }

  get(contextId: ProtocolContextId): ProtocolSessionStore | undefined {
    return this.stores.get(contextId);
  }

  has(contextId: ProtocolContextId): boolean {
    return this.stores.has(contextId);
  }

  getSession(contextId: ProtocolContextId): ProtocolSession | undefined {
    return this.stores.get(contextId)?.getState();
  }

  listContexts(): ProtocolContextId[] {
    return [...this.stores.keys()];
  }
}

/** Shared registry for the app; tests may construct their own instances. */
export const protocolSessionRegistry = new ProtocolSessionRegistry();

const ProtocolSessionContext = createContext<ProtocolContextId | null>(null);

export interface ProtocolSessionProviderProps {
  contextId: ProtocolContextId | null;
  children: React.ReactNode;
  /** Optional registry for tests. Defaults to the shared registry. */
  registry?: ProtocolSessionRegistry;
}

/**
 * Binds a protocol context to a session for the subtree. The session is
 * created when the context id appears, discarded when it disappears or
 * changes. With `contextId={null}` no session exists — reads return empty
 * state and writes are no-ops, so a provider can wrap the whole app while a
 * protocol is only ever active in part of the tree.
 */
export function ProtocolSessionProvider({
  contextId,
  children,
  registry: registryProp,
}: ProtocolSessionProviderProps): React.JSX.Element {
  const registry = registryProp ?? protocolSessionRegistry;

  useEffect(() => {
    if (!contextId) return;
    registry.create(contextId);
    return () => {
      registry.close(contextId);
    };
  }, [contextId, registry]);

  return createElement(
    ProtocolSessionContext.Provider,
    {value: contextId},
    children,
  );
}

export interface UseProtocolSessionOptions {
  /** Explicit context id. Defaults to the nearest ProtocolSessionProvider. */
  contextId?: ProtocolContextId | null;
  /** Optional registry for tests. Defaults to the shared registry. */
  registry?: ProtocolSessionRegistry;
}

export interface UseProtocolSessionResult {
  /** Current session state for the protocol context. */
  session: ProtocolSession;
  /** Replace the whole session with a fresh empty one (e.g. 'Clear patient'). */
  reset: () => void;
  /** Set patient weight for this protocol context only. */
  setWeight: (weight: string) => void;
  /** Set one calculator input field for this protocol context only. */
  setCalculatorInput: (calculatorKey: string, field: string, value: string) => void;
  /** Replace all calculator inputs for this protocol context. */
  setCalculatorInputs: (inputs: Record<string, Record<string, string>>) => void;
  /** Set flowchart position for this protocol context only. */
  setFlowchartProgress: (flowchartId: string, progress: FlowchartProgress) => void;
  /** Set one checklist selection field for this protocol context only. */
  setChecklistSelection: (checklistKey: string, field: string, value: unknown) => void;
  /** Replace all checklist selections for this protocol context. */
  setChecklistSelections: (selections: Record<string, Record<string, unknown>>) => void;
}

/**
 * Hook-based access to the session for one protocol context. Components call
 * this instead of reading or writing global/persisted patient state; the
 * returned session is never persisted and never shared with other contexts.
 *
 * The result mirrors the state shapes existing callers already use (weight as
 * string, calculator inputs as `Record<key, Record<field, string>>`, etc.) so
 * existing callers can be migrated to it without reshaping their data.
 */
export function useProtocolSession(
  options: UseProtocolSessionOptions = {},
): UseProtocolSessionResult {
  const inherited = useContext(ProtocolSessionContext);
  const contextId = options.contextId !== undefined ? options.contextId : inherited;
  const registry = options.registry ?? protocolSessionRegistry;

  const getSnapshot = useCallback(
    () => (contextId ? registry.get(contextId)?.getState() : undefined),
    [registry, contextId],
  );

  const subscribe = useCallback(
    (listener: Listener) => {
      if (!contextId) return () => {};
      const store = registry.create(contextId);
      return store.subscribe(listener);
    },
    [registry, contextId],
  );

  const state = useSyncExternalStore(
    subscribe,
    () => getSnapshot() ?? EMPTY_SESSION,
    () => EMPTY_SESSION,
  );

  const update = useCallback(
    (updater: SessionUpdater) => {
      if (!contextId) return;
      registry.create(contextId).update(updater);
    },
    [registry, contextId],
  );

  const reset = useCallback(() => {
    if (!contextId) return;
    registry.create(contextId).reset();
  }, [registry, contextId]);

  const setWeight = useCallback(
    (weight: string) => update(prev => ({...prev, weight})),
    [update],
  );

  const setCalculatorInput = useCallback(
    (calculatorKey: string, field: string, value: string) =>
      update(prev => ({
        ...prev,
        calculatorInputs: {
          ...prev.calculatorInputs,
          [calculatorKey]: {
            ...prev.calculatorInputs[calculatorKey],
            [field]: value,
          },
        },
      })),
    [update],
  );

  const setCalculatorInputs = useCallback(
    (calculatorInputs: Record<string, Record<string, string>>) =>
      update(prev => ({...prev, calculatorInputs})),
    [update],
  );

  const setFlowchartProgress = useCallback(
    (flowchartId: string, progress: FlowchartProgress) =>
      update(prev => ({
        ...prev,
        flowchartProgress: {
          ...prev.flowchartProgress,
          [flowchartId]: progress,
        },
      })),
    [update],
  );

  const setChecklistSelection = useCallback(
    (checklistKey: string, field: string, value: unknown) =>
      update(prev => ({
        ...prev,
        checklistSelections: {
          ...prev.checklistSelections,
          [checklistKey]: {
            ...prev.checklistSelections[checklistKey],
            [field]: value,
          },
        },
      })),
    [update],
  );

  const setChecklistSelections = useCallback(
    (checklistSelections: Record<string, Record<string, unknown>>) =>
      update(prev => ({...prev, checklistSelections})),
    [update],
  );

  return {
    session: state,
    reset,
    setWeight,
    setCalculatorInput,
    setCalculatorInputs,
    setFlowchartProgress,
    setChecklistSelection,
    setChecklistSelections,
  };
}
