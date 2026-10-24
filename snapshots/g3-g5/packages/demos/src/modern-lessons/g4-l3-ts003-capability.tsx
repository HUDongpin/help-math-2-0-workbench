'use client';

import React from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextBlockBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';
import {CourseG04L03Ts003Renderer, getCourseG04L03Ts003FrameState} from '../modules/course-g04-l03-ts-003';
import {COURSE_G04_L03_TS_003_SOURCE} from '../timelines/course-g04-l03-ts-003';
import source from './generated/g4-l3-ts003-text.json';
import {G4L3Ts003Scene, getTs003SceneState} from './g4-l3-ts003-scene';

const ID = 'course-g04-l03-ts-003';
const DOMAIN = 'sprite-25';
const VERSION = 'g04-l03-placement-031-native-text-v1';
const runIds = (character: number) => source.texts[String(character) as keyof typeof source.texts]
  .runs.map((_, index) => `character-${character}/run-${index}`);

export const TS003_BINDING: LessonTextBinding = {
  schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-031', animationId: ID,
  sourceSwfSha256: COURSE_G04_L03_TS_003_SOURCE.swfSha256, template: 'explanation',
  blocks: ([
    {id: 'title', sourceTextIds: runIds(2), role: 'title', readingOrder: 0},
    {id: 'step-1', sourceTextIds: [...runIds(10), ...runIds(6)], role: 'label', readingOrder: 10},
    {id: 'step-one', sourceTextIds: runIds(11), role: 'body', readingOrder: 11},
    {id: 'step-2', sourceTextIds: [...runIds(7), ...runIds(6)], role: 'label', readingOrder: 20},
    {id: 'step-two', sourceTextIds: runIds(13), role: 'body', readingOrder: 21},
    {id: 'step-3', sourceTextIds: [...runIds(8), ...runIds(6)], role: 'label', readingOrder: 30},
    {id: 'step-4', sourceTextIds: [...runIds(9), ...runIds(6)], role: 'label', readingOrder: 40},
    {id: 'step-heading', sourceTextIds: [...runIds(15), ...runIds(19), ...runIds(20)], role: 'heading', readingOrder: 50},
    {id: 'first-bullet', sourceTextIds: runIds(21), role: 'body', readingOrder: 60},
    {id: 'second-bullet', sourceTextIds: runIds(23), role: 'body', readingOrder: 70},
  ] satisfies readonly Omit<LessonTextBlockBinding, 'language' | 'valueSource'>[])
    .map(block => ({...block, language: 'en' as const, valueSource: 'source-static' as const})),
};

export function getTs003TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
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
  const teaching = ready ? getTs003SceneState(state.frame) : null;
  const values: Record<string, string | null> = teaching ? {
    title: teaching.title,
    'step-1': teaching.numbers[0], 'step-one': teaching.stepOne,
    'step-2': teaching.numbers[1], 'step-two': teaching.stepTwo,
    'step-3': teaching.numbers[2], 'step-4': teaching.numbers[3],
    'step-heading': teaching.heading, 'first-bullet': teaching.firstBullet,
    'second-bullet': teaching.secondBullet,
  } : {};
  return {
    schemaVersion: 1, animationId: ID, bindingVersion: VERSION, sourceSwfSha256: source.sourceSwfSha256,
    status: ready ? 'ready' : 'blocked', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
      scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: ready ? TS003_BINDING.blocks.map(block => ({id: block.id, text: values[block.id] ?? '',
      visible: values[block.id] !== null, role: block.role, language: block.language,
      readingOrder: block.readingOrder})) : [],
  };
}

export function Ts003NativeRenderer(props: AnimationRendererProps) {
  const state = (props.state ?? getCourseG04L03Ts003FrameState(props.frame, props)) as SourceStaticCanvasFrameState;
  const snapshot = getTs003TextSnapshot(state, {...props, frameDomain: props.frameDomain ?? DOMAIN});
  if (snapshot.status !== 'ready') return <CourseG04L03Ts003Renderer {...props} state={state}/>;
  return <G4L3Ts003Scene frame={state.frame} reducedMotion={props.reducedMotion}
    onOpenKeyTerm={props.onLessonHostRequest ? (name, trigger) => {
      const glossary = source.glossary.find(item => item.term === name);
      if (!glossary) return;
      props.onLessonHostRequest?.({type: 'open-keyterm', entryId: glossary.entryId, sourceAnimationId: ID,
        playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'},
      {trigger, keyTermIndexLanguage: 'en'});
    } : undefined}/>;
}

const audio = G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[ID].audioCues[0];
if (audio.sha256 !== COURSE_G04_L03_TS_003_SOURCE.embeddedAudioStreamSha256 ||
    audio.frame !== 6 || audio.endFrame !== 242 || audio.frameDomain !== DOMAIN) {
  throw new Error('TS003 source main audio drift');
}

export const TS003_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: TS003_BINDING, Renderer: Ts003NativeRenderer,
  getSnapshot: getTs003TextSnapshot, playbackMode: 'once',
  playbackEndFrameByDomain: {[DOMAIN]: 241}, reducedMotionFrameByDomain: {[DOMAIN]: 241},
  sourceTimelineAudioCues: [{...audio, sha256: audio.sha256}],
  keyTerms: {indexLanguage: 'en', sourceAssetId: 'ELKTEG4.xml',
    sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    entryIds: source.glossary.map(item => item.entryId)},
};
