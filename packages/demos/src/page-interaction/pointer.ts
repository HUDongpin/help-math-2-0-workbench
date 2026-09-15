import type {PointerLifecyclePolicy} from './contract';

export type PointerPhase = 'down' | 'move' | 'up' | 'cancel';

export type PointerSession = Readonly<{
  pointerId: number;
  tokenId: string;
  startedInside: boolean;
  captured: boolean;
}>;

export type PointerInput = Readonly<{
  phase: PointerPhase;
  pointerId: number;
  pointerType: string;
  button: number;
  buttons: number;
  isPrimary: boolean;
  insideToken: boolean;
  hitTargetId: string | null;
}>;

export type PointerDecision =
  | Readonly<{action: 'ignore'}>
  | Readonly<{action: 'start'; session: PointerSession}>
  | Readonly<{action: 'keep'; session: PointerSession}>
  | Readonly<{action: 'drop'; tokenId: string; targetId: string}>
  | Readonly<{action: 'cancel'}>;

function isPrimaryPress(input: PointerInput, policy: PointerLifecyclePolicy): boolean {
  if (policy.primaryPointerOnly && !input.isPrimary) return false;
  if (policy.primaryButtonOnly && input.button !== 0 && input.phase === 'down') return false;
  if (input.pointerType === 'mouse' && input.phase === 'down' && input.buttons !== 1) return false;
  return true;
}

export function reducePointer(
  policy: PointerLifecyclePolicy,
  session: PointerSession | null,
  tokenId: string | null,
  input: PointerInput
): {session: PointerSession | null; decision: PointerDecision} {
  switch (input.phase) {
    case 'down': {
      if (!tokenId || !isPrimaryPress(input, policy)) {
        return {session, decision: {action: 'ignore'}};
      }
      if (policy.pressMustStartInside && !input.insideToken) {
        return {session: null, decision: {action: 'ignore'}};
      }
      const next: PointerSession = {
        pointerId: input.pointerId,
        tokenId,
        startedInside: input.insideToken,
        captured: policy.captureRequiredForPress
      };
      return {session: next, decision: {action: 'start', session: next}};
    }
    case 'move':
      if (!session || session.pointerId !== input.pointerId) {
        return {session, decision: {action: 'ignore'}};
      }
      return {session, decision: {action: 'keep', session}};
    case 'cancel':
      if (!session || session.pointerId !== input.pointerId) {
        return {session, decision: {action: 'ignore'}};
      }
      return {session: null, decision: {action: 'cancel'}};
    case 'up': {
      if (!session || session.pointerId !== input.pointerId) {
        return {session, decision: {action: 'ignore'}};
      }
      if (policy.releaseMustEndInside && !input.hitTargetId) {
        return {session: null, decision: {action: 'cancel'}};
      }
      if (input.hitTargetId) {
        return {
          session: null,
          decision: {action: 'drop', tokenId: session.tokenId, targetId: input.hitTargetId}
        };
      }
      return {session: null, decision: {action: 'cancel'}};
    }
    default: {
      const exhaustive: never = input.phase;
      throw new Error(`Unhandled pointer phase: ${String(exhaustive)}`);
    }
  }
}
