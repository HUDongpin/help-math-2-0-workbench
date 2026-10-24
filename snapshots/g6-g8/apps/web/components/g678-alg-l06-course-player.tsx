'use client';

import type {ComponentProps} from 'react';
import type {LessonRuntimeAdapterProps} from '../lib/lesson-runtime-adapter';
import {SourceLessonCandidatePlayerV1} from './source-lesson-candidate-player-v1.generated';
import {ALG_L6_REGISTERED_RUNTIME_ADAPTERS} from './g678-alg-l06-p060-host-lesson-v1';
import {G678TerminalSourceRuntimeV1} from './g678-terminal-source-runtime-v1';
import {ContinuousSourceClockRuntime} from './continuous-source-clock-runtime';

const heading = Object.freeze({en: 'Prices per cup', es: 'Precios por vaso'});
function P002Runtime(props: LessonRuntimeAdapterProps) {
  return <G678TerminalSourceRuntimeV1 {...props} readingHeading={heading}/>;
}

// Reuse the existing native course adapters. P060's current registered module
// owns its renderer session; the older private P060 host expects a different
// scenario and must not override that registered DOM successor. HFR pages and
// other registered source-canvas pages retain the ordinary registered renderer.
export const ALG_L6_COURSE_RUNTIME_ADAPTERS = Object.freeze([
  ...ALG_L6_REGISTERED_RUNTIME_ADAPTERS.filter(adapter => adapter.animationId !== 'shared-alg001-l06-p060'),
  Object.freeze({animationId: 'shared-alg001-l06-p002', audioEnabled: true, Component: P002Runtime}),
  Object.freeze({animationId: 'shared-alg001-l06-p040', audioEnabled: true, Component: ContinuousSourceClockRuntime}),
]);

export function G678AlgL6CoursePlayer(
  props: Omit<ComponentProps<typeof SourceLessonCandidatePlayerV1>,
    'privateRuntimeAdapter' | 'privateRuntimeAdapters' | 'registeredPagePresentation' | 'unregisteredCandidateCount'>,
) {
  return <SourceLessonCandidatePlayerV1 {...props}
    audioEnabled
    privateRuntimeAdapters={ALG_L6_COURSE_RUNTIME_ADAPTERS}
    registeredPagePresentation="registered"
    unregisteredCandidateCount={0}
  />;
}
