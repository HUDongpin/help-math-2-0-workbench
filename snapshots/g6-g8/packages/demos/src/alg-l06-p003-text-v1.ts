import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from './source-static-canvas-candidate';

/** Source words remain English on both routes; this is not a translation. */
export const ALG_L06_P003_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1,
  version: 'alg-l06-p003-source-readable-v1',
  placementId: 'shared-alg001-l06-p003',
  animationId: 'shared-alg001-l06-p003',
  sourceSwfSha256: 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766',
  template: 'explanation',
  blocks: Object.freeze([
    {id: 'title', sourceTextIds: ['character-156/run-0'], role: 'title', language: 'en', readingOrder: 0, valueSource: 'source-static'},
    {id: 'orange', sourceTextIds: ['character-18/run-0'], role: 'label', language: 'en', readingOrder: 1, valueSource: 'source-static'},
    {id: 'lemon', sourceTextIds: ['character-20/run-0'], role: 'label', language: 'en', readingOrder: 2, valueSource: 'source-static'},
    {id: 'lemonade-price', sourceTextIds: ['character-24/run-0', 'character-25/run-0'], role: 'body', language: 'en', readingOrder: 3, valueSource: 'source-static'},
    {id: 'orange-juice-price', sourceTextIds: ['character-27/run-0', 'character-28/run-0'], role: 'body', language: 'en', readingOrder: 4, valueSource: 'source-static'},
    {id: 'equation-build', sourceTextIds: ['character-119/run-0', 'character-118/run-0', 'character-117/run-0', 'character-114/run-0', 'character-116/run-0', 'character-115/run-0', 'character-121/run-0', 'character-113/run-0'], role: 'answer', language: 'en', readingOrder: 5, valueSource: 'maintained-page-state'},
    {id: 'equation', sourceTextIds: ['character-125/run-0'], role: 'answer', language: 'en', readingOrder: 6, valueSource: 'maintained-page-state'},
  ] as const),
});

/** The source places every separate equation glyph at nested frame 520, then
 * scales them together through 530. At 531 it moves those glyph placements
 * and adds the full text object. The companion switches source wording at
 * that boundary; it does not reproduce the tween or prove visibility parity. */
export function algL06P003TextSnapshot(state: SourceStaticCanvasFrameState, replay = 0) {
  const sourceReady = state.animationId === ALG_L06_P003_TEXT_BINDING.animationId &&
    state.sourceSwfSha256 === ALG_L06_P003_TEXT_BINDING.sourceSwfSha256 &&
    state.frameDomain === 'sprite-154' && state.scenario === 'source-static-frame' &&
    state.status === 'ready' && state.language === 'en';
  return buildLessonTextSnapshot(ALG_L06_P003_TEXT_BINDING, {
    frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
    scenario: state.scenario, lang: 'en', seed: state.seed, replay,
  }, sourceReady ? {
    title: {text: 'Understanding Functions: Real World Activity', visible: true},
    orange: {text: 'Orange', visible: true},
    lemon: {text: 'lemon', visible: true},
    'lemonade-price': {text: 'Lemonade: 50¢ per cup', visible: true},
    'orange-juice-price': {text: 'orange juice: 75¢ per cup', visible: true},
    'equation-build': {text: 'M = $0.50 x C', visible: state.frame >= 520 && state.frame <= 530},
    equation: {text: 'M = $0.50 ∙ C', visible: state.frame >= 531},
  } : {});
}
