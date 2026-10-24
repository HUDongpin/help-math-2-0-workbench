'use client';

import React from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextBlockBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';
import {CourseG04L03Ts005Renderer, getCourseG04L03Ts005FrameState} from '../modules/course-g04-l03-ts-005';
import {COURSE_G04_L03_TS_005_SOURCE} from '../timelines/course-g04-l03-ts-005';
import source from './generated/g4-l3-ts005-text.json';
import {G4L3Ts005Scene, getTs005SceneState} from './g4-l3-ts005-scene';

const ID = 'course-g04-l03-ts-005';
const DOMAIN = 'sprite-40';
const VERSION = 'g04-l03-placement-033-native-text-candidate-v1';
const runIds = (character: number) => source.texts[String(character) as keyof typeof source.texts]
  .runs.map((_, index) => `character-${character}/run-${index}`);
const selectedRuns = (character: number, indices: readonly number[]) => indices
  .map(index => runIds(character)[index]);

export const TS005_BINDING: LessonTextBinding = {
  schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-033', animationId: ID,
  sourceSwfSha256: COURSE_G04_L03_TS_005_SOURCE.swfSha256, template: 'explanation',
  blocks: ([
    {id: 'title', sourceTextIds: runIds(2), role: 'title', readingOrder: 0},
    {id: 'active-step', sourceTextIds: runIds(18), role: 'heading', readingOrder: 10},
    {id: 'step-1-number', sourceTextIds: [...runIds(10), ...runIds(6)], role: 'label', readingOrder: 20},
    {id: 'step-1', sourceTextIds: runIds(11), role: 'body', readingOrder: 21},
    {id: 'step-2-number', sourceTextIds: [...runIds(7), ...runIds(6)], role: 'label', readingOrder: 30},
    {id: 'step-2', sourceTextIds: runIds(13), role: 'body', readingOrder: 31},
    {id: 'step-3-number', sourceTextIds: [...runIds(8), ...runIds(6)], role: 'label', readingOrder: 40},
    {id: 'step-3', sourceTextIds: runIds(15), role: 'body', readingOrder: 41},
    {id: 'step-4-number', sourceTextIds: [...runIds(9), ...runIds(6)], role: 'label', readingOrder: 50},
    {id: 'step-4', sourceTextIds: runIds(16), role: 'body', readingOrder: 51},
    {id: 'strategies-heading', sourceTextIds: runIds(20), role: 'heading', readingOrder: 60},
    {id: 'left-1', sourceTextIds: selectedRuns(27, [0, 1, 2, 3]), role: 'body', readingOrder: 70},
    {id: 'left-2', sourceTextIds: selectedRuns(27, [4]), role: 'body', readingOrder: 71},
    {id: 'left-3', sourceTextIds: selectedRuns(27, [5, 6]), role: 'body', readingOrder: 72},
    {id: 'left-4', sourceTextIds: selectedRuns(27, [7, 8, 9]), role: 'body', readingOrder: 73},
    {id: 'right-1', sourceTextIds: selectedRuns(25, [0]), role: 'body', readingOrder: 80},
    {id: 'right-2', sourceTextIds: selectedRuns(25, [1, 2, 3]), role: 'body', readingOrder: 81},
    {id: 'right-3', sourceTextIds: selectedRuns(25, [4, 5, 6]), role: 'body', readingOrder: 82},
    {id: 'right-4', sourceTextIds: selectedRuns(25, [7]), role: 'body', readingOrder: 83},
    {id: 'show-work', sourceTextIds: [...runIds(33), ...runIds(35)], role: 'body', readingOrder: 90},
  ] satisfies readonly Omit<LessonTextBlockBinding, 'language' | 'valueSource'>[])
    .map(block => ({...block, language: 'en' as const, valueSource: 'source-static' as const})),
};

export function getTs005TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
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
  const scene = ready ? getTs005SceneState(state.frame) : null;
  const values: Record<string, string | null> = scene ? {
    title: scene.title, 'active-step': scene.activeStep,
    ...Object.fromEntries(scene.numbers.map((number, index) => [`step-${index + 1}-number`, number])),
    ...Object.fromEntries(scene.plan.map((text, index) => [`step-${index + 1}`, text])),
    'strategies-heading': scene.strategiesHeading,
    ...Object.fromEntries([...scene.left, ...scene.right].map(item => [item.id, item.opacity > 0 ? item.text : null])),
    'show-work': scene.showWork,
  } : {};
  return {
    schemaVersion: 1, animationId: ID, bindingVersion: VERSION, sourceSwfSha256: source.sourceSwfSha256,
    status: ready ? 'ready' : 'blocked', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
      scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: ready ? TS005_BINDING.blocks.map(block => ({id: block.id, text: values[block.id] ?? '',
      visible: values[block.id] !== null, role: block.role, language: block.language,
      readingOrder: block.readingOrder})) : [],
  };
}

export function Ts005NativeRenderer(props: AnimationRendererProps) {
  const state = (props.state ?? getCourseG04L03Ts005FrameState(props.frame, props)) as SourceStaticCanvasFrameState;
  const snapshot = getTs005TextSnapshot(state, {...props, frameDomain: props.frameDomain ?? DOMAIN});
  if (snapshot.status !== 'ready') return <CourseG04L03Ts005Renderer {...props} state={state}/>;
  return <G4L3Ts005Scene frame={state.frame} reducedMotion={props.reducedMotion}
    onOpenKeyTerm={props.onLessonHostRequest ? (term, trigger) => {
      props.onLessonHostRequest?.({type: 'open-keyterm', entryId: term.entryId, sourceAnimationId: ID,
        playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'},
      {trigger, keyTermIndexLanguage: 'en'});
    } : undefined}/>;
}

const audio = G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[ID].audioCues[0];
if (audio.sha256 !== COURSE_G04_L03_TS_005_SOURCE.embeddedAudioStreamSha256 ||
    audio.frame !== 1 || audio.endFrame !== 276 || audio.frameDomain !== DOMAIN) {
  throw new Error('TS005 source main audio drift');
}

export const TS005_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: TS005_BINDING, Renderer: Ts005NativeRenderer,
  getSnapshot: getTs005TextSnapshot, playbackMode: 'once',
  playbackEndFrameByDomain: {[DOMAIN]: 275}, reducedMotionFrameByDomain: {[DOMAIN]: 275},
  sourceTimelineAudioCues: [{...audio, sha256: audio.sha256}],
  keyTerms: {indexLanguage: 'en', sourceAssetId: 'ELKTEG4.xml',
    sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    entryIds: [...new Set(source.glossary.map(item => item.entryId))]},
};
