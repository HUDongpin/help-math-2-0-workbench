'use client';
import React from 'react';
export {in012NativeBlockers} from './g4-l3-in012-text';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getCourseG04L03In012FrameState} from '../modules/course-g04-l03-in-012';
import {getIn012HostSnapshot} from './g4-l3-in012-host-snapshot';
import {createCourseG04L03In012OwingDragState} from '../timelines/course-g04-l03-in-012-owing-drag-interaction';
import type {AnimationRendererProps} from '../contract';
import source from './generated/g4-l3-in012-native-inputs.json';
import {In012Introduction} from './g4-l3-in012-introduction';
import {In012HostInteraction} from './g4-l3-in012-host-interaction';

const ID = 'course-g04-l03-in-012';
export const IN012_KEY_TERMS = {...source.keyTerms, indexLanguage: 'en' as const};
/** Registered native candidate: source intro and host-driven held interaction. */
export function In012Renderer(props: AnimationRendererProps) {
  const sourceState = (props.state ?? getCourseG04L03In012FrameState(props.frame,props)) as SourceStaticCanvasFrameState;
  // Preflight checks source identity; actual question snapshot is made below from live state.
  const preflight = getIn012HostSnapshot(sourceState,props,createCourseG04L03In012OwingDragState());
  // The live session, not this source-identity preflight, owns completion state.
  const blockers = preflight.blockers.filter(blocker => blocker !== 'completed-interaction-required');
  if (blockers.length) return <div data-in012-native-status="blocked" data-in012-blockers={blockers.join(',')}/>;
  const openTerm = props.onLessonHostRequest ? (entryId: string, trigger: HTMLButtonElement) => {
    if (!IN012_KEY_TERMS.entryIds.includes(entryId)) throw new Error('Unknown IN012 glossary entry');
    props.onLessonHostRequest?.({type: 'open-keyterm', entryId, sourceAnimationId: ID,
      playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger, keyTermIndexLanguage: 'en'});
  } : undefined;
  const title = source.texts.find(text => text.characterId === 4)!.text;
  return <section lang="en" data-modern-text-page={ID} data-in012-native-status="ready" data-flash-frame={props.frame} data-runtime-replay={props.replay ?? 0} data-lesson-activities={JSON.stringify(props.lessonActivities ?? [])}>
    <h2 data-lesson-text-block="title" style={{fontFamily: 'var(--lesson-text-font-heading,system-ui,sans-serif)', fontSize: '1.75rem', lineHeight: 1.25, overflowWrap: 'anywhere'}}>{title}</h2>
    {props.frame < 174 ? <In012Introduction frame={props.frame} onKeyTerm={openTerm}/> :
      <In012HostInteraction runtime={props} sourceState={sourceState} onKeyTerm={openTerm}/>}
  </section>;
}
