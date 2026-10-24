import type {LessonTextBinding} from '../lesson-text-contract';
import type {HfrReducedMotionState} from './reduced-motion';
import type {RuntimeContext} from '../contract';
import {isHfrNativeTextFrameCurrent, type HfrNativeTextFrame, type HfrTextSourceCatalog, type HfrSourceTextDecisions} from './hfr-native-text';

export interface HfrNativeTextOptions {
  readonly binding: LessonTextBinding;
  readonly sourceCatalog: HfrTextSourceCatalog;
  readonly sourceDecisions?: HfrSourceTextDecisions;
  readonly frameDomain: string;
  readonly reducedMotionState?: HfrReducedMotionState;
  /** The producer may verify exact catalog/asset hashes before mounting the clock. */
  readonly prepare?: () => Promise<void>;
}

/** The old getFrameState placeholder is not a live HFR snapshot. */
export function hfrLiveTextSnapshot(state: unknown, context: RuntimeContext, options: HfrNativeTextOptions) {
  const frame = state as HfrNativeTextFrame | undefined;
  const snapshot = frame?.snapshot;
  if (!frame || !snapshot || snapshot.animationId !== options.binding.animationId ||
      snapshot.sourceSwfSha256 !== options.binding.sourceSwfSha256 || snapshot.bindingVersion !== options.binding.version ||
      snapshot.identity.frameDomain !== options.frameDomain || snapshot.identity.frame !== context.frame ||
      snapshot.identity.frameDomain !== (context.frameDomain ?? 'root') || snapshot.identity.scenario !== context.scenario ||
      snapshot.identity.language !== context.lang || snapshot.identity.seed !== context.seed ||
      snapshot.identity.replay !== (context.replay ?? 0) ||
      !isHfrNativeTextFrameCurrent(frame, frame.runtime, {lang: context.lang, scenario: context.scenario, seed: context.seed, replay: context.replay ?? 0})) {
    throw new Error('HFR_LIVE_NATIVE_TEXT_SNAPSHOT_REQUIRED');
  }
  return snapshot;
}
