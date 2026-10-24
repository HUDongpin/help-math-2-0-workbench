// Source-bound text/state projection for the unregistered P003 candidate.
// The mask steps are SWF facts; readable prefixes were checked in the local
// Canvas candidate. Neither establishes original-runtime or typography parity.
import type {RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextInstance} from
  '../lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId} from
  '../lesson-text-snapshot';
import type {NmsL09P003ClockState} from
  './shared-nms002-l09-p003-source-clock';
import {NMS_L09_P003_SOURCE} from
  './shared-nms002-l09-p003-source-clock';

function sourceInstance(depth: number, characterId: number,
  generation = 1, root = false): LessonTextInstance {
  const path = root ? [{timelineId: 'root', depth, generation, characterId}] : [
    {timelineId: 'root', depth: 1, generation: 1, characterId: 246},
    {timelineId: 'sprite-246', depth, generation, characterId},
  ];
  return {id: lessonTextInstanceId(path), path};
}

export const NMS_L09_P003_TEXT_BINDING = Object.freeze({
  schemaVersion: 1,
  version: 'nms-l09-p003-source-text-projection-v1',
  placementId: NMS_L09_P003_SOURCE.animationId,
  animationId: NMS_L09_P003_SOURCE.animationId,
  sourceSwfSha256: NMS_L09_P003_SOURCE.swfSha256,
  template: 'complex-figure',
  blocks: [
    {id: 'page-title', sourceTextIds: ['character-247/run-0'],
      sourceShapeIds: [248],
      role: 'title', language: 'en', readingOrder: 0,
      instance: sourceInstance(297, 247, 1, true), valueSource: 'source-static'},
    {id: 'schedule-heading', sourceTextIds: ['character-110/run-0'],
      role: 'heading', language: 'en', readingOrder: 1,
      instance: sourceInstance(247, 110), valueSource: 'source-static'},
    {id: 'schedule-heading-second-layer',
      sourceTextIds: ['character-111/run-0'],
      role: 'heading', language: 'en', readingOrder: 2,
      instance: sourceInstance(248, 111), valueSource: 'source-static'},
    {id: 'tank-one', sourceTextIds: ['character-105/run-0'],
      sourceShapeIds: [227],
      role: 'body', language: 'en', readingOrder: 3,
      instance: sourceInstance(241, 105), valueSource: 'source-static'},
    {id: 'addend-one', sourceTextIds: ['character-106/run-0'],
      sourceShapeIds: [238],
      role: 'body', language: 'en', readingOrder: 4,
      instance: sourceInstance(242, 106), valueSource: 'source-static'},
    {id: 'addend-two', sourceTextIds: ['character-106/run-0'],
      role: 'body', language: 'en', readingOrder: 5,
      instance: sourceInstance(243, 106), valueSource: 'source-static'},
    {id: 'addend-three', sourceTextIds: ['character-106/run-0'],
      role: 'body', language: 'en', readingOrder: 6,
      instance: sourceInstance(244, 106), valueSource: 'source-static'},
    {id: 'total', sourceTextIds: ['character-107/run-0'],
      role: 'body', language: 'en', readingOrder: 7,
      instance: sourceInstance(245, 107), valueSource: 'source-static'},
    {id: 'expression', sourceTextIds: [
      'character-232/run-0', 'character-232/run-1',
      'character-232/run-2', 'character-232/run-3',
      'character-232/run-4',
    ], role: 'body', language: 'en', readingOrder: 8,
    instance: sourceInstance(283, 232, 2),
    valueSource: 'maintained-page-state'},
    {id: 'tank-emphasis-copy-590', sourceTextIds: ['character-228/run-0'],
      role: 'body', language: 'en', readingOrder: 9,
      instance: sourceInstance(283, 228), valueSource: 'source-static'},
    {id: 'tank-emphasis-copy-592', sourceTextIds: ['character-228/run-0'],
      role: 'body', language: 'en', readingOrder: 10,
      instance: sourceInstance(286, 228), valueSource: 'source-static'},
    {id: 'tank-emphasis-copy-594', sourceTextIds: ['character-228/run-0'],
      role: 'body', language: 'en', readingOrder: 11,
      instance: sourceInstance(286, 228, 2), valueSource: 'source-static'},
    {id: 'addend-emphasis-copy-615', sourceTextIds: ['character-239/run-0'],
      role: 'body', language: 'en', readingOrder: 12,
      instance: sourceInstance(286, 239, 3), valueSource: 'source-static'},
    {id: 'addend-emphasis-copy-617', sourceTextIds: ['character-239/run-0'],
      role: 'body', language: 'en', readingOrder: 13,
      instance: sourceInstance(286, 239, 4), valueSource: 'source-static'},
    {id: 'addend-emphasis-copy-619', sourceTextIds: ['character-239/run-0'],
      role: 'body', language: 'en', readingOrder: 14,
      instance: sourceInstance(286, 239, 5), valueSource: 'source-static'},
  ],
} as const satisfies LessonTextBinding);

const REVEAL_FRAMES = [591, 599, 605, 612, 616] as const;
const EXPRESSION_PREFIXES = [
  '', '5', '5 +', '5 + 3', '5 + 3 ×', '5 + 3 × 2',
] as const;

export const NMS_L09_P003_TEXT_OPEN = Object.freeze([
  'Source character 155 labels eleven bags; candidate retains these packaging marks as graphics, pending host accessibility and visual review.',
  'Source characters 228/239 and shapes 227/238 flash row emphasis; a private exact-suppression candidate exists, but native styling remains open.',
  'Title outline shape 248 has a private exact-suppression candidate; other shape/bitmap lettering and mask appearance still need review.',
  'A fixed 800x600 native-layout candidate exists; actual My Lesson responsive review, audio, and product admission remain open.',
]);

export function projectNmsL09P003Text(clock: NmsL09P003ClockState,
  context: RuntimeContext) {
  if (!Object.isFrozen(clock) || clock.frameDomain !== 'sprite-246' ||
      clock.rootFrame !== 6 || !Number.isSafeInteger(clock.frame) ||
      clock.frame < 1 || clock.frame > 635 ||
      clock.audioEnabled !== false ||
      !Number.isSafeInteger(clock.revision) || clock.revision < 0 ||
      context.frame !== clock.frame || context.frameDomain !== clock.frameDomain ||
      context.rootFrame !== clock.rootFrame ||
      context.scenario !== 'source-static-frame' || context.seed !== 0 ||
      (context.lang !== 'en' && context.lang !== 'es') ||
      context.replay !== clock.revision) {
    throw new Error('P003 text projection requires the exact frozen source clock');
  }
  const revealCount = REVEAL_FRAMES.filter(frame => clock.frame >= frame).length;
  const emphasisRow = [590, 592, 594].includes(clock.frame) ? 'tank-one' :
    [615, 617, 619].includes(clock.frame) ? 'addend-one' : null;
  const snapshot = buildLessonTextSnapshot(NMS_L09_P003_TEXT_BINDING,
    context, {
      'page-title': {text: 'Properties of Operations: Real World Activity',
        visible: true},
      'schedule-heading': {text: 'Daily Fish Feeding Schedule', visible: true},
      'schedule-heading-second-layer': {
        text: 'Daily Fish Feeding Schedule', visible: false},
      'tank-one': {text: 'Tank 1 = 5 bags of food', visible: true},
      'addend-one': {text: '+ 2 bags of food', visible: true},
      'addend-two': {text: '+ 2 bags of food', visible: true},
      'addend-three': {text: '+ 2 bags of food', visible: true},
      'total': {text: 'Total: 11 bags of food', visible: true},
      'expression': {text: EXPRESSION_PREFIXES[revealCount],
        visible: revealCount > 0},
      'tank-emphasis-copy-590': {
        text: 'Tank 1 = 5 bags of food', visible: false},
      'tank-emphasis-copy-592': {
        text: 'Tank 1 = 5 bags of food', visible: false},
      'tank-emphasis-copy-594': {
        text: 'Tank 1 = 5 bags of food', visible: false},
      'addend-emphasis-copy-615': {
        text: '+ 2 bags of food', visible: false},
      'addend-emphasis-copy-617': {
        text: '+ 2 bags of food', visible: false},
      'addend-emphasis-copy-619': {
        text: '+ 2 bags of food', visible: false},
    });
  return Object.freeze({snapshot, emphasisRow,
    formulaRevealStep: revealCount,
    sourceLanguagePolicy: context.lang === 'es' ? 'source-fallback' : 'source',
    claimBoundary: 'unregistered native-layout candidate; local suppression and spot review do not establish host, audio, or typography acceptance'});
}
