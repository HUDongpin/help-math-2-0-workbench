'use client';

import React from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextBlockBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';
import {CourseG04L03Ts006Renderer, getCourseG04L03Ts006FrameState} from '../modules/course-g04-l03-ts-006';
import {COURSE_G04_L03_TS_006_SOURCE} from '../timelines/course-g04-l03-ts-006';
import source from './generated/g4-l3-ts006-text.json';
import {G4L3Ts006Scene, getTs006SceneState} from './g4-l3-ts006-scene';

const ID = 'course-g04-l03-ts-006';
const DOMAIN = 'sprite-23';
const VERSION = 'g04-l03-placement-034-native-text-candidate-v1';
const runIds = (character: number) => source.texts[String(character) as keyof typeof source.texts]
  .runs.map((_, index) => `character-${character}/run-${index}`);
const steps = [
  {number: 15, duplicate: 6, copy: 16},
  {number: 12, duplicate: 7, copy: 18},
  {number: 13, duplicate: 8, copy: 20},
  {number: 14, duplicate: 9, copy: 22},
] as const;

export const TS006_BINDING: LessonTextBinding = {
  schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-034', animationId: ID,
  sourceSwfSha256: COURSE_G04_L03_TS_006_SOURCE.swfSha256, template: 'explanation',
  blocks: ([
    {id: 'title', sourceTextIds: runIds(2), role: 'title', readingOrder: 0},
    ...steps.map((step, index) => ({id: `step-${index + 1}`,
      sourceTextIds: [...runIds(step.number), ...runIds(11), ...runIds(step.duplicate), ...runIds(step.copy)],
      role: 'body' as const, readingOrder: (index + 1) * 10})),
  ] satisfies readonly Omit<LessonTextBlockBinding, 'language' | 'valueSource'>[])
    .map(block => ({...block, language: 'en' as const, valueSource: 'source-static' as const})),
};

export function getTs006TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
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
  const scene = ready ? getTs006SceneState(state.frame) : null;
  const values: Record<string, string> = scene ? {title: scene.title,
    ...Object.fromEntries(scene.steps.map((step, index) =>
      [`step-${index + 1}`, `${step.number} ${step.copy}`]))} : {};
  return {
    schemaVersion: 1, animationId: ID, bindingVersion: VERSION, sourceSwfSha256: source.sourceSwfSha256,
    status: ready ? 'ready' : 'blocked', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
      scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: ready ? TS006_BINDING.blocks.map(block => ({id: block.id, text: values[block.id] ?? '',
      visible: true, role: block.role, language: block.language,
      readingOrder: block.readingOrder})) : [],
  };
}

export function Ts006NativeRenderer(props: AnimationRendererProps) {
  const state = (props.state ?? getCourseG04L03Ts006FrameState(props.frame, props)) as SourceStaticCanvasFrameState;
  const snapshot = getTs006TextSnapshot(state, {...props, frameDomain: props.frameDomain ?? DOMAIN});
  if (snapshot.status !== 'ready') return <CourseG04L03Ts006Renderer {...props} state={state}/>;
  return <G4L3Ts006Scene frame={state.frame}/>;
}

const audio = G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[ID].audioCues[0];
if (audio.sha256 !== COURSE_G04_L03_TS_006_SOURCE.embeddedAudioSha256 ||
    audio.frame !== 1 || audio.endFrame !== 129 || audio.frameDomain !== DOMAIN) {
  throw new Error('TS006 source main audio drift');
}

export const TS006_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: TS006_BINDING, Renderer: Ts006NativeRenderer,
  getSnapshot: getTs006TextSnapshot, playbackMode: 'once',
  playbackEndFrameByDomain: {[DOMAIN]: 128}, reducedMotionFrameByDomain: {[DOMAIN]: 128},
  sourceTimelineAudioCues: [{...audio, sha256: audio.sha256}],
};
