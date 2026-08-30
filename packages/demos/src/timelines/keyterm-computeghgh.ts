import type {RuntimeContext} from '../contract';

export const COMPUTEGHGH_MOVIE = Object.freeze({
  stage: Object.freeze({width: 225, height: 225}),
  fps: 12,
  frameCount: 35,
  durationMs: (35 * 1_000) / 12
});

export const COMPUTEGHGH_SOURCE = Object.freeze({
  swfSha256: 'fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8',
  visibleTitle: 'Common Sense / Computar',
  replayAction: 'gotoAndPlay(1)',
  terminalAction: 'stop()'
});

export type ReplayButtonState = 'up' | 'over' | 'down';
export type ReplayButtonEvent =
  | 'pointer-enter'
  | 'pointer-leave'
  | 'pointer-down'
  | 'pointer-up'
  | 'activate'
  | 'blur';

export interface ReplayButtonTransition {
  readonly buttonState: ReplayButtonState;
  readonly replayRequested: boolean;
}

export interface ComputeghghFrameState {
  readonly frame: number;
  readonly sceneAsset: string;
  readonly buttonAsset: string;
  readonly buttonState: ReplayButtonState;
  readonly language: 'en' | 'es';
  readonly accessibleTitle: string;
  readonly stopped: boolean;
}

export function normalizeComputeghghFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COMPUTEGHGH_MOVIE.frameCount, Math.max(1, Math.trunc(frame)));
}

export function replayButtonStateForScenario(scenario: string): ReplayButtonState {
  if (scenario === 'replay-hover') return 'over';
  if (scenario === 'replay-pressed') return 'down';
  return 'up';
}

export function transitionReplayButton(
  current: ReplayButtonState,
  event: ReplayButtonEvent
): ReplayButtonTransition {
  switch (event) {
    case 'pointer-enter':
    case 'pointer-up':
      return Object.freeze({buttonState: 'over', replayRequested: false});
    case 'pointer-down':
      return Object.freeze({buttonState: 'down', replayRequested: false});
    case 'activate':
      return Object.freeze({buttonState: 'over', replayRequested: true});
    case 'pointer-leave':
    case 'blur':
      return Object.freeze({buttonState: 'up', replayRequested: false});
    default:
      return Object.freeze({buttonState: current, replayRequested: false});
  }
}

export function getComputeghghFrameState(
  frame: number,
  context: Pick<RuntimeContext, 'lang' | 'scenario'>
): ComputeghghFrameState {
  const normalized = normalizeComputeghghFrame(frame);
  const buttonState = replayButtonStateForScenario(context.scenario);
  return Object.freeze({
    frame: normalized,
    sceneAsset: '/flash-assets/keyterms/computeghgh/frame.png',
    buttonAsset: `/flash-assets/keyterms/computeghgh/buttons/${buttonState}.svg`,
    buttonState,
    language: context.lang,
    accessibleTitle:
      context.lang === 'es' ? 'Sentido común: animación de Computar' : 'Common Sense / Computar animation',
    stopped: normalized === COMPUTEGHGH_MOVIE.frameCount
  });
}

