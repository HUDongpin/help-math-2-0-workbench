/** Maintained p044 product bridge mechanics. No timers, DOM, audio or registry writes. */
import {P044_CONFIG, createP044State, queryP044, reduceP044, type P044Event, type P044State, type P044Transition, type P044Mode} from './g678-nms-l01-p044-controller';
import type {AnimationInteractiveStop, AnimationInteractiveStopResolutionIntent} from './contract';

export const P044_PRODUCT_STOPS: readonly AnimationInteractiveStop[] = Object.freeze(P044_CONFIG.stops.map(stop => Object.freeze({
  id: stop.id, frameDomain: P044_CONFIG.mainFrameDomain, stopFrame: stop.frame, resumeFrame: stop.resumeFrame,
  resolution: stop.frame === 737 ? 'explicit-source-feedback-finished' as const : 'explicit-source-control-finished' as const,
  completionDisposition: 'blocked-while-unresolved' as const, rendererStateOnResume: 'preserve' as const,
  requiresHostInteractiveStop: true as const, strictAcceptanceEffect: 'none' as const,
})));

/** The first renderer observation is already host-authoritative, even when the
 * host is paused or uses its reduced-motion stop. Observe it before applying
 * the pause flag; never flash source1 after the host has supplied source312. */
export function createP044ObservedProductEntry(options:{frame:number;seed:number;epoch:number;paused:boolean;mode:P044Mode}):P044State{
  let state=createP044State({seed:options.seed,epoch:options.epoch,mode:options.mode});
  if(options.frame>1){const observed=reduceP044(state,{type:'main-frame',epoch:state.epoch,clockToken:state.clockToken,frame:options.frame});if(observed.accepted)state=observed.state;}
  if(options.paused)state=reduceP044(state,{type:'pause',epoch:state.epoch,paused:true}).state;
  return state;
}

/** A void host callback is a dispatched request, not a playhead acknowledgement. */
export function resolveP044ProductTransition(state: P044State, event: P044Event, hostCanResolve: boolean): P044Transition {
  const transition = reduceP044(state, event);
  if (!hostCanResolve && transition.intents.some(intent => intent.kind === 'resolve-main-stop')) {
    return Object.freeze({state, intents: Object.freeze([]), accepted: false, reason: 'missing-product-interactive-stop-consumer'});
  }
  return transition;
}

export function p044ProductResolution(transition: P044Transition): AnimationInteractiveStopResolutionIntent | null {
  const intent = transition.intents.find(intent => intent.kind === 'resolve-main-stop');
  if (!transition.accepted || !intent || intent.kind !== 'resolve-main-stop') return null;
  const stop = P044_PRODUCT_STOPS.find(stop => stop.id === intent.stopId);
  if (!stop || stop.stopFrame !== intent.stopFrame || stop.resumeFrame !== intent.resumeFrame ||
    (intent.cause === 'source-feedback-terminal') !== (stop.stopFrame === 737)) throw new Error('Invalid p044 product stop resolution');
  return Object.freeze({stopId: stop.id, frameDomain: stop.frameDomain, resolution: stop.resolution,
    source: 'maintained-source-derived-interaction'});
}

export interface P044NestedClock {
  readonly identity: string | null;
  readonly epoch: number;
  readonly observedFrame: number;
  readonly remainderMs: number;
  readonly lastTimeMs: number | null;
}
export const createP044NestedClock = (): P044NestedClock => Object.freeze({identity: null, epoch: -1,
  observedFrame: 0, remainderMs: 0, lastTimeMs: null});

/** One source nested clock at 12 fps. Fractional time survives pause/glossary,
 * but never leaks into a new opening/closing/feedback or Replay epoch. The
 * caller supplies RAF timestamps and publishes the returned event only once.
 * Before changing pause/glossary state, flush once at the event timestamp with
 * the PRE-hold state; then apply the hold and clear the anchor. Otherwise the
 * final RAF-to-control interval would be lost. */
export function tickP044NestedClock(clock: P044NestedClock, state: P044State, nowMs: number): Readonly<{
  clock: P044NestedClock; event: P044Event | null;
}> {
  if (!Number.isFinite(nowMs) || nowMs < 0 || (clock.lastTimeMs !== null && nowMs < clock.lastTimeMs))
    throw new Error('Invalid p044 monotonic nested clock');
  if (!Number.isFinite(clock.remainderMs) || clock.remainderMs < 0 || clock.remainderMs >= 1000 / 12 + 1e-8)
    throw new Error('Invalid p044 fractional remainder');
  const query = queryP044(state), active = query.activeNestedFrames[0];
  const phase = state.phase;
  const identity = active && ['feedback', 'explanation-opening', 'explanation-closing'].includes(phase)
    ? `${state.epoch}:${phase}:${active.instanceKey}` : null;
  if (!identity || !active) return Object.freeze({clock: Object.freeze({identity: null, epoch: state.epoch,
    observedFrame: 0, remainderMs: 0, lastTimeMs: null}), event: null});
  const same = clock.identity === identity && clock.epoch === state.epoch && clock.observedFrame === active.frame;
  const previous = same ? clock : {identity, epoch: state.epoch, observedFrame: active.frame, remainderMs: 0, lastTimeMs: null};
  if (!query.nestedPlaying) return Object.freeze({clock: Object.freeze({...previous, lastTimeMs: null}), event: null});
  const box = P044_CONFIG.explanations.find(box => box.sourceObjectId === active.sourceObjectId);
  const feedback = P044_CONFIG.feedback.find(feedback => feedback.sourceObjectId === active.sourceObjectId);
  const terminal = phase === 'feedback' ? feedback?.terminalFrame : phase === 'explanation-opening' ? box?.heldFrame : box?.closeTerminalFrame;
  if (!terminal) throw new Error('Unbound p044 nested terminal');
  const elapsed = previous.lastTimeMs === null ? 0 : nowMs - previous.lastTimeMs;
  const accumulated = previous.remainderMs + elapsed;
  const frames = state.mode === 'reduced-motion' ? terminal - active.frame : Math.floor((accumulated + 1e-9) * 12 / 1000);
  const frame = Math.min(terminal, active.frame + frames);
  const remainderMs = frame === terminal ? 0 : Math.max(0, accumulated - frames * 1000 / 12);
  const next = Object.freeze({identity, epoch: state.epoch, observedFrame: frame, remainderMs, lastTimeMs: nowMs});
  return Object.freeze({clock: next, event: frame > active.frame ? Object.freeze({type: 'nested-frame',
    epoch: state.epoch, clockToken: state.clockToken, sourceObjectId: active.sourceObjectId, frame}) : null});
}
