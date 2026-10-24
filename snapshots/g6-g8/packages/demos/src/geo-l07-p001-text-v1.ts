import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {GeoL07P001FrameState} from './geo-l07-p001-timeline-v1';

export const GEO_L07_P001_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1,
  version: 'geo-l07-p001-source-title-v1',
  placementId: 'shared-geo001-l07-p001',
  animationId: 'shared-geo001-l07-p001',
  sourceSwfSha256: '9aafb8a470b5e67f4254b671696940c6fd53be258f517dd6b97abfa511e76430',
  template: 'explanation',
  blocks: Object.freeze([{id: 'lesson-title', sourceTextIds: Object.freeze(['character-140/run-0', 'character-141/run-0']),
    role: 'title', language: 'en', readingOrder: 0, valueSource: 'source-static'}] as const),
});

export function geoL07P001TextSnapshot(state: GeoL07P001FrameState) {
  return buildLessonTextSnapshot(GEO_L07_P001_TEXT_BINDING, {
    frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
    scenario: state.scenario, lang: state.language, seed: state.seed, replay: state.replay,
  }, {'lesson-title': {text: state.title, visible: state.sourceTextIds.includes(141)}});
}
