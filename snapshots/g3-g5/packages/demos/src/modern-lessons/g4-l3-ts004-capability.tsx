'use client';

import React from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonHostRequest} from '../lesson-host-contract';
import type {LessonTextBinding, LessonTextBlockBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';
import {CourseG04L03Ts004Renderer, getCourseG04L03Ts004FrameState} from '../modules/course-g04-l03-ts-004';
import {COURSE_G04_L03_TS_004_SOURCE} from '../timelines/course-g04-l03-ts-004';
import glossaryTargets from '../../../../scripts/inputs/typography-v1/g4-l3-ts004/glossary-target-disposition.json';
import source from './generated/g4-l3-ts004-text.json';
import {G4L3Ts004Scene, getTs004SceneState} from './g4-l3-ts004-scene';

const ID = 'course-g04-l03-ts-004';
const DOMAIN = 'sprite-70';
const VERSION = 'g04-l03-placement-032-native-text-candidate-v2';
const runIds = (character: number) => source.texts[String(character) as keyof typeof source.texts]
  .runs.map((_, index) => `character-${character}/run-${index}`);
const sourceLetterFrame = source.frames[104].placements;
const strategyState = getTs004SceneState(111);
const leftIds = strategyState.left.map(item => item.depths.map(depth => {
  const placement = sourceLetterFrame.find(sourceItem => sourceItem.depth === depth);
  if (!placement) throw new Error(`TS004 strategy depth ${depth} has no source placement`);
  return runIds(placement.characterId)[0];
}));
const rightIds = strategyState.right.map(item => source.texts['62'].runs
  .flatMap((run, index) => item.id === `right-${run.y}` ? [`character-62/run-${index}`] : []));
const safeTerms = glossaryTargets.buttons.flatMap(target => {
  if (!target.nativeTarget) return [];
  const sourceTerm = source.glossary.find(item => item.buttonId === target.buttonId);
  if (!sourceTerm || sourceTerm.sourceKey !== target.sourceKey) {
    throw new Error(`TS004 source glossary target ${target.buttonId} changed`);
  }
  if ('sourceKeyLookup' in target && target.sourceKeyLookup) return [];
  if (!sourceTerm.entryId) throw new Error(`TS004 glossary target ${target.buttonId} has no exact entry`);
  return [sourceTerm];
});

export function getTs004KeyTermRequest(buttonId: number, frame: number): LessonHostRequest {
  const term = getTs004SceneState(frame).buttons.find(item => item.buttonId === buttonId);
  if (!term) throw new Error(`TS004 glossary ${buttonId} is not active at frame ${frame}`);
  const playbackDisposition = 'source-stop-timeline-and-audio-until-explicit-resume' as const;
  return term.lookup === 'source-key'
    ? {type: 'open-keyterm-by-source-key', sourceKey: term.sourceKey,
      sourceButtonId: term.buttonId, frame, frameDomain: DOMAIN,
      sourceAnimationId: ID, playbackDisposition}
    : {type: 'open-keyterm', entryId: term.entryId, sourceAnimationId: ID, playbackDisposition};
}

export const TS004_BINDING: LessonTextBinding = {
  schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-032', animationId: ID,
  sourceSwfSha256: COURSE_G04_L03_TS_004_SOURCE.swfSha256, template: 'explanation',
  blocks: ([
    {id: 'title', sourceTextIds: runIds(2), role: 'title', readingOrder: 0},
    {id: 'active-step', sourceTextIds: [...runIds(16), ...runIds(15), ...runIds(21), ...runIds(22)], role: 'heading', readingOrder: 10},
    {id: 'step-1-number', sourceTextIds: [...runIds(10), ...runIds(6)], role: 'label', readingOrder: 20},
    {id: 'step-1', sourceTextIds: runIds(11), role: 'body', readingOrder: 21},
    {id: 'step-2-number', sourceTextIds: [...runIds(7), ...runIds(6)], role: 'label', readingOrder: 30},
    {id: 'step-2', sourceTextIds: runIds(13), role: 'body', readingOrder: 31},
    {id: 'step-3-number', sourceTextIds: [...runIds(8), ...runIds(6)], role: 'label', readingOrder: 40},
    {id: 'step-3', sourceTextIds: runIds(17), role: 'body', readingOrder: 41},
    {id: 'step-4-number', sourceTextIds: [...runIds(9), ...runIds(6)], role: 'label', readingOrder: 50},
    {id: 'strategies-heading', sourceTextIds: runIds(24), role: 'heading', readingOrder: 60},
    ...strategyState.left.map((item, index) => ({id: item.id, sourceTextIds: leftIds[index],
      role: 'body' as const, readingOrder: 70 + index})),
    ...strategyState.right.map((item, index) => ({id: item.id, sourceTextIds: rightIds[index],
      role: 'body' as const, readingOrder: 80 + index})),
    {id: 'final-instruction', sourceTextIds: runIds(68), role: 'body', readingOrder: 90},
  ] satisfies readonly Omit<LessonTextBlockBinding, 'language' | 'valueSource'>[])
    .map(block => ({...block, language: 'en' as const, valueSource: 'source-static' as const})),
};

export function getTs004TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state.animationId !== ID || state.sourceSwfSha256 !== source.sourceSwfSha256) blockers.push('source-identity-mismatch');
  if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
  if (state.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN) blockers.push('unsupported-frame-domain');
  if (state.rootFrame !== 6 || (context.rootFrame !== undefined && context.rootFrame !== 6)) blockers.push('unsupported-root-context');
  if (state.scenario !== 'source-static-frame' || context.scenario !== state.scenario) blockers.push('unsupported-scenario');
  if (state.language !== 'en' || context.lang !== 'en') blockers.push('spanish-text-not-source-verified');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > source.frameCount || state.frame !== context.frame) blockers.push('source-frame-mismatch');
  if (state.seed !== (context.seed >>> 0)) blockers.push('source-seed-mismatch');
  if (context.entryStateSha256) blockers.push('capture-uses-source-canvas');
  const ready = blockers.length === 0;
  const scene = ready ? getTs004SceneState(state.frame) : null;
  const values: Record<string, string | null> = scene ? {
    title: scene.title, 'active-step': scene.activeStep,
    ...Object.fromEntries(scene.planNumbers.map((number, index) => [`step-${index + 1}-number`, number])),
    'step-1': scene.plan[0], 'step-2': scene.plan[1], 'step-3': scene.plan[2],
    'strategies-heading': scene.strategiesHeading,
    ...Object.fromEntries([...scene.left, ...scene.right].map(item => [item.id, item.opacity > 0 ? item.text : null])),
    'final-instruction': scene.finalInstruction,
  } : {};
  return {
    schemaVersion: 1, animationId: ID, bindingVersion: VERSION, sourceSwfSha256: source.sourceSwfSha256,
    status: ready ? 'ready' : 'blocked', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
      scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: ready ? TS004_BINDING.blocks.map(block => ({id: block.id, text: values[block.id] ?? '',
      visible: values[block.id] !== null, role: block.role, language: block.language,
      readingOrder: block.readingOrder})) : [],
  };
}

export function Ts004NativeRenderer(props: AnimationRendererProps) {
  const state = (props.state ?? getCourseG04L03Ts004FrameState(props.frame, props)) as SourceStaticCanvasFrameState;
  const snapshot = getTs004TextSnapshot(state, {...props, frameDomain: props.frameDomain ?? DOMAIN});
  if (snapshot.status !== 'ready') return <CourseG04L03Ts004Renderer {...props} state={state}/>;
  return <G4L3Ts004Scene frame={state.frame} reducedMotion={props.reducedMotion}
    onOpenKeyTerm={props.onLessonHostRequest ? (term, trigger) => {
      props.onLessonHostRequest?.(getTs004KeyTermRequest(term.buttonId, state.frame),
      {trigger, keyTermIndexLanguage: 'en'});
    } : undefined}/>;
}

const audio = G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[ID].audioCues[0];
if (audio.sha256 !== COURSE_G04_L03_TS_004_SOURCE.embeddedAudioStreamSha256 ||
    audio.frame !== 6 || audio.endFrame !== 337 || audio.frameDomain !== DOMAIN) {
  throw new Error('TS004 source main audio drift');
}

export const TS004_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: TS004_BINDING, Renderer: Ts004NativeRenderer,
  getSnapshot: getTs004TextSnapshot, playbackMode: 'once',
  playbackEndFrameByDomain: {[DOMAIN]: 336}, reducedMotionFrameByDomain: {[DOMAIN]: 336},
  sourceTimelineAudioCues: [{...audio, sha256: audio.sha256}],
  keyTerms: {indexLanguage: 'en', sourceAssetId: 'ELKTEG4.xml',
    sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    entryIds: [...new Set(safeTerms.map(item => item.entryId))],
    sourceKeyBindings: glossaryTargets.buttons.flatMap(target =>
      'sourceKeyLookup' in target && target.sourceKeyLookup
        ? target.sourceWindows.map(([startFrame, endFrame]) => ({
          sourceButtonId: target.buttonId, sourceKey: target.sourceKey,
          frameDomain: DOMAIN, startFrame, endFrame})) : [])},
};
