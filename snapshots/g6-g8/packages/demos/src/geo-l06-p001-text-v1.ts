import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {GeoL06P001FrameState} from './geo-l06-p001-timeline-v1';

export const GEO_L06_P001_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1,
  version: 'geo-l06-p001-source-title-v1',
  placementId: 'shared-geo001-l06-p001',
  animationId: 'shared-geo001-l06-p001',
  sourceSwfSha256: '8997176bb8c1f3e68a8011ee98f132ece217c881b2407b90b42ea4067de49c58',
  template: 'explanation',
  blocks: Object.freeze([{id: 'lesson-title', sourceTextIds: Object.freeze(['character-140/run-0', 'character-141/run-0']),
    role: 'title', language: 'en', readingOrder: 0, valueSource: 'source-static'}] as const),
});

export function geoL06P001TextSnapshot(state: GeoL06P001FrameState) {
  return buildLessonTextSnapshot(GEO_L06_P001_TEXT_BINDING, {
    frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
    scenario: state.scenario, lang: state.language, seed: state.seed, replay: state.replay,
  }, {'lesson-title': {text: state.title, visible: state.sourceTextIds.includes(141)}});
}
