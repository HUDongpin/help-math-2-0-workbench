/** Private DOM gesture policy; source graphics are authoritative, Flash event parity is not. */
export type Vb036CloseVisualState = 'up' | 'over' | 'down';
export type Vb036CloseInstance = 'wrong-1' | 'wrong-2' | 'wrong-3';
export type Vb036ClosePointerState = Readonly<{
  instanceKey: Vb036CloseInstance | null;
  pointerId: number | null;
  inside: boolean;
}>;
type Hit = Readonly<{instanceKey: Vb036CloseInstance | null; inside: boolean}>;
type Pointer = Hit & Readonly<{pointerId: number; isPrimary: boolean; canHover: boolean}>;
export type Vb036ClosePointerEvent =
  | Readonly<{type: 'reset'}>
  | (Hit & Readonly<{type: 'reconcile'}>)
  | (Pointer & Readonly<{type: 'move'; primaryButtonDown: boolean}>)
  | (Pointer & Readonly<{type: 'down'; button: number; captureGranted: boolean}>)
  | (Pointer & Readonly<{type: 'up'; button: number}>)
  | Readonly<{type: 'cancel'; pointerId: number}>;

const EMPTY: Vb036ClosePointerState = Object.freeze({instanceKey: null, pointerId: null, inside: false});
export function createVb036ClosePointerState(): Vb036ClosePointerState {return EMPTY;}
export function vb036CloseVisualState(state: Vb036ClosePointerState): Vb036CloseVisualState {
  return state.instanceKey && state.inside ? (state.pointerId === null ? 'over' : 'down') : 'up';
}

export const VB036_CLOSE_POINTER_POLICY = Object.freeze({
  contractId: 'g4-l12-vb036-private-close-pointer-policy-v1',
  primaryPointerOnly: true,
  primaryButtonOnly: true,
  captureRequiredForPress: true,
  pressMustStartInside: true,
  releaseMustEndInside: true,
  movingPolygonRechecked: true,
  ownedDragOutVisual: 'up',
  ownedDragInVisual: 'down',
  hitStateIsDiagnosticOnly: true,
  sourceButtonDownAudioScheduled: false,
  originalFlashPointerLifecycleEstablished: false,
  originalRuntimeAccepted: false,
} as const);

/** Activate is a one-event result, never persistent state that an effect can replay. */
export function reduceVb036ClosePointer(state: Vb036ClosePointerState, event: Vb036ClosePointerEvent) {
  const finish = (next: Vb036ClosePointerState, activate = false) => {
    const unchanged = state.instanceKey === next.instanceKey && state.pointerId === next.pointerId && state.inside === next.inside;
    return Object.freeze({state: unchanged ? state : Object.freeze(next), activate,
      releasePointerId: state.pointerId !== null && state.pointerId !== next.pointerId ? state.pointerId : null});
  };
  if (event.type === 'reset') return finish(EMPTY);
  if (event.type === 'cancel') {
    return event.pointerId === state.pointerId
      ? finish({instanceKey: state.instanceKey, pointerId: null, inside: false}) : finish(state);
  }
  if (![null, 'wrong-1', 'wrong-2', 'wrong-3'].includes(event.instanceKey) || typeof event.inside !== 'boolean') {
    throw new Error('VB036 Close requires an exact current wrong-popup hit.');
  }
  if (event.type === 'reconcile') {
    if (event.instanceKey === null) return finish(EMPTY);
    if (event.instanceKey !== state.instanceKey) return finish({instanceKey: event.instanceKey, pointerId: null, inside: false});
    return finish({...state, inside: event.inside});
  }
  if (!Number.isInteger(event.pointerId) || event.pointerId < 0 || !event.isPrimary) return finish(state);
  if (state.pointerId !== null && event.pointerId !== state.pointerId) return finish(state);
  if (state.pointerId !== null && event.instanceKey !== state.instanceKey) {
    return finish({instanceKey: event.instanceKey, pointerId: null, inside: false});
  }
  if (event.instanceKey === null) return finish(EMPTY);
  const current = event.instanceKey === state.instanceKey
    ? state : {instanceKey: event.instanceKey, pointerId: null, inside: false};
  if (event.type === 'down') {
    if (event.button !== 0 || current.pointerId !== null) return finish(current);
    return finish({instanceKey: event.instanceKey,
      pointerId: event.inside && event.captureGranted ? event.pointerId : null,
      inside: event.inside && (event.captureGranted || event.canHover)});
  }
  if (event.type === 'move') {
    if (current.pointerId !== null && !event.primaryButtonDown) {
      return finish({instanceKey: event.instanceKey, pointerId: null, inside: event.inside && event.canHover});
    }
    return finish({...current, inside: event.inside && (current.pointerId !== null || event.canHover)});
  }
  if (event.type === 'up') {
    if (event.button !== 0 || current.pointerId !== event.pointerId) return finish(current);
    return finish({instanceKey: event.instanceKey, pointerId: null, inside: event.inside && event.canHover}, event.inside);
  }
  throw new Error('Unsupported VB036 Close pointer event.');
}
