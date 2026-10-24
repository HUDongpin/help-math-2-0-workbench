import type {RuntimeContext} from '../contract';
import {initialP012Lesson, reduceP012Lesson, type P012LessonState} from '../alg-l12-p012-lesson';
import {P012_SOURCE} from '../alg-l12-p012-state';
import typography from '../../../../migrations/shared-alg001-l12-p012/typography-v1/runtime-meta.json';

export const SHARED_ALG001_L12_P012_SOURCE = Object.freeze({
  animationId: P012_SOURCE.animationId,
  source: {path: 'G6-G8-shared/ALG001/L12/VB/L12VB07.swf', sha256: P012_SOURCE.swfSha256},
  deploymentScope: 'local-only', complexityLane: 'behavior-heavy',
  typographySha256: typography.runtimeSha256,
  sourceAudioOwner: 'private-p012-lesson-adapter',
  sourceStopFrame: 119, stoppedTimelineRetainsInteraction: true,
  spanishTextPolicy: 'english-source-fallback-translation-pending',
  productCalibrationPassed: false, strictAcceptanceEffect: 'none',
} as const);

export const P012_TYPOGRAPHY_ASSETS = Object.freeze([Object.freeze({
  name: 'typography.js', sha256: typography.runtimeSha256,
  bytes: typography.runtimeBytes, contentType: 'text/javascript',
})]);

export const SHARED_ALG001_L12_P012_RUNTIME = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}), fps: 12,
  frameCount: 10, durationMs: 10 / 12 * 1000,
  defaultFrameDomain: 'sprite-86',
  frameDomains: Object.freeze([Object.freeze({id: 'sprite-86', frameCount: 119, fps: 12, rootFrame: 6})]),
});

/** Deterministic entry state for a requested source frame. Subsequent user
 * actions are resolved only by the same maintained lesson reducer as My Lesson;
 * seeking a frame never invents an interaction history. */
export function p012FrameState(frame: number, context: RuntimeContext): Readonly<{
  status: 'ready' | 'blocked'; blocker: string | null; frame: number;
  frameDomain: string; rootFrame: number; sourceSha256: string;
  scenario: string; language: string; seed: number;
  context: RuntimeContext; lesson: P012LessonState | null;
}> {
  const valid = frame === context.frame && Number.isInteger(frame) && frame >= 1 && frame <= 119 &&
    context.frameDomain === 'sprite-86' && (context.rootFrame === undefined || context.rootFrame === 6) &&
    context.scenario === 'ordered-pairs-interaction' && context.lang === 'en' && Number.isSafeInteger(context.seed);
  let lesson: P012LessonState | null = null;
  if (valid) {
    lesson = reduceP012Lesson(initialP012Lesson(context.seed), {kind: 'play'});
    while (lesson.frame < frame) lesson = reduceP012Lesson(lesson, {kind: 'tick'});
  }
  return Object.freeze({status: valid ? 'ready' : 'blocked',
    blocker: valid ? null : 'unsupported-p012-source-context', frame,
    frameDomain: context.frameDomain ?? 'unresolved', rootFrame: context.rootFrame ?? 6,
    scenario: context.scenario, language: context.lang, seed: context.seed,
    sourceSha256: P012_SOURCE.swfSha256, context: Object.freeze({...context}), lesson});
}
