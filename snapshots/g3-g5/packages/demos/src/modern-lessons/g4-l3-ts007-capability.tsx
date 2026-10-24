'use client';

import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L03Ts007Renderer, getCourseG04L03Ts007FrameState} from '../modules/course-g04-l03-ts-007';
import {TS007_BINDING, getTs007TextSnapshot} from './g4-l3-ts007-text';

export {TS007_BINDING, getTs007TextSnapshot} from './g4-l3-ts007-text';

export function Ts007NativeRenderer(props: AnimationRendererProps) {
  const state = props.state ?? getCourseG04L03Ts007FrameState(props.frame, props);
  const snapshot = getTs007TextSnapshot(state, {...props, frameDomain: props.frameDomain ?? 'sprite-441'});
  if (snapshot.status !== 'ready') return <CourseG04L03Ts007Renderer {...props} state={state}/>;
  return <CourseG04L03Ts007Renderer {...props} state={state} modernText={true}/>;
}

/** Native intro1..234 and modern reducer at held235; completion is distinct
 * from the original696 clock. Unsupported source contexts retain fallback. */
export const TS007_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: TS007_BINDING, Renderer: Ts007NativeRenderer,
  getSnapshot: getTs007TextSnapshot, playbackMode: 'once',
  playbackEndFrameByDomain: {'sprite-441': 235},
  reducedMotionFrameByDomain: {'sprite-441': 235},
  completion: {id: 'g4-l3-ts007-terminal', frameDomain: 'sprite-441', frames: [235]},
};
