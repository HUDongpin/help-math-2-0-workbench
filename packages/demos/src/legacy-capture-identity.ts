import type {AnimationLanguage, RuntimeContext} from './contract';

export type LegacyRenderState = 'ready' | 'error' | 'blocked';

export interface LegacyCaptureIdentityInput {
  readonly animationId: string;
  readonly frame: number;
  readonly renderedFrame: number;
  readonly frameDomain?: string;
  readonly rootFrame?: number;
  readonly requirementId?: string;
  readonly traceId?: string;
  readonly entryStateSha256?: string;
  readonly scenario: string;
  readonly lang: AnimationLanguage;
  readonly renderedLanguage?: AnimationLanguage;
  readonly seed: number;
  readonly renderState?: LegacyRenderState;
}

export interface LegacyFrameStateIdentity {
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: LegacyRenderState;
  readonly blocker: string | null;
}

/**
 * Bind the same fail-closed identity to the pure timeline state that the
 * capture-stage adapter exposes in the DOM. This keeps renderer probes honest:
 * identity comes from getFrameState itself instead of being inferred by an
 * audit wrapper.
 */
export function bindLegacyFrameStateIdentity<T extends Readonly<{frame: number}>>(
  state: T,
  requestedFrame: number,
  context: RuntimeContext
): T & LegacyFrameStateIdentity {
  const frameDomain = context.frameDomain?.trim() || 'root';
  const rootFrame = context.rootFrame ?? requestedFrame;
  const runtimeSupported =
    frameDomain === 'root' &&
    context.scenario === 'default' &&
    (context.lang === 'en' || context.lang === 'es') &&
    Number.isSafeInteger(context.seed) &&
    Number.isSafeInteger(requestedFrame) &&
    requestedFrame >= 1 &&
    state.frame === requestedFrame &&
    Number.isSafeInteger(rootFrame) &&
    rootFrame === requestedFrame;
  const blocker = runtimeSupported
    ? null
    : 'Unsupported legacy frame-domain, scenario, language, seed, root-frame, or rendered-frame identity.';

  return Object.freeze({
    ...state,
    frameDomain,
    rootFrame,
    scenario: context.scenario,
    language: context.lang,
    seed: context.seed,
    status: runtimeSupported ? 'ready' : 'blocked',
    blocker
  });
}

/**
 * The first six prototype renderers predate the strict capture selector. This
 * adapter adds only capture identity; it does not change their visual state or
 * promote their source authority.
 *
 * Their current coverage-v2 specifications declare exactly one supported
 * runtime context: the root frame domain and the default scenario. Unsupported
 * direct renderer calls remain useful engineering previews, but fail closed as
 * deterministic evidence.
 */
export function buildLegacyCaptureAttributes(input: LegacyCaptureIdentityInput) {
  const frameDomain = input.frameDomain?.trim() || 'root';
  const rootFrame = input.rootFrame ?? input.frame;
  const requestedState = input.renderState ?? 'ready';
  const runtimeSupported =
    frameDomain === 'root' &&
    input.scenario === 'default' &&
    (input.lang === 'en' || input.lang === 'es') &&
    Number.isSafeInteger(input.seed) &&
    Number.isSafeInteger(input.frame) &&
    input.frame >= 1 &&
    Number.isSafeInteger(input.renderedFrame) &&
    input.renderedFrame === input.frame &&
    Number.isSafeInteger(rootFrame) &&
    rootFrame === input.frame &&
    (input.renderedLanguage === undefined || input.renderedLanguage === input.lang);
  const renderState: LegacyRenderState =
    requestedState === 'ready' && !runtimeSupported ? 'blocked' : requestedState;
  const identityComplete = Boolean(
    input.animationId.trim() &&
      input.requirementId?.trim() &&
      input.traceId?.trim() &&
      /^[a-f0-9]{64}$/.test(input.entryStateSha256 ?? '')
  );

  const identity = {
    'data-animation-id': input.animationId,
    'data-flash-entry-state-sha256': input.entryStateSha256 || undefined,
    'data-flash-frame': input.renderedFrame,
    'data-flash-frame-domain': frameDomain,
    'data-flash-lang': input.lang,
    'data-flash-requirement-id': input.requirementId || undefined,
    'data-flash-root-frame': rootFrame,
    'data-flash-scenario': input.scenario,
    'data-flash-seed': input.seed,
    'data-flash-trace-id': input.traceId || undefined,
    'data-runtime-language': input.lang,
    'data-runtime-scenario': input.scenario,
    'data-runtime-seed': input.seed
  } as const;

  return Object.freeze({
    stage: Object.freeze({
      ...identity,
      'data-capture-stage':
        renderState === 'ready' && identityComplete ? 'true' : undefined,
      'data-render-state': renderState
    }),
    visual: Object.freeze({
      ...identity,
      'data-render-state': renderState,
      'data-render-visual': renderState === 'ready' ? 'true' : undefined
    })
  });
}
