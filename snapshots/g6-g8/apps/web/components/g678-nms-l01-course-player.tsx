'use client';

import {useEffect, useRef, useState, type ComponentProps} from 'react';
import type {LessonRuntimeAdapterProps} from '../lib/lesson-runtime-adapter';
import {SourceLessonCandidatePlayerV1} from './source-lesson-candidate-player-v1.generated';
import {NMS_L1_REGISTERED_RUNTIME_ADAPTERS} from './g678-nms-l01-p047-lesson';
import {ContinuousSourceClockRuntime} from './continuous-source-clock-runtime';

const P047_ID = 'shared-nms002-l01-p047';
const P047Runtime = NMS_L1_REGISTERED_RUNTIME_ADAPTERS.find(adapter => adapter.animationId === P047_ID)!.Component;

function P047CourseFrameRuntime(props: LessonRuntimeAdapterProps) {
  const stage = useRef<HTMLDivElement>(null);
  const identity = `${props.animationId}:${props.query.frameDomain}:${props.query.scenario}:${props.query.lang}:${props.query.seed}`;
  const [pending, setPending] = useState<{identity: string; frame: number} | null>(null);
  const [painted, setPainted] = useState<typeof pending>(null);
  useEffect(() => {
    // The source session reports before React commits its quiz snapshot. Expose
    // its frame only after the real quiz presentation exists, never on loading UI.
    if (pending?.identity === identity && stage.current?.querySelector(
      '[data-source-quiz-runtime] section[data-p047-phase]',
    )) setPainted(pending);
  }, [identity, pending]);
  return <div ref={stage} data-flash-frame={painted?.identity === identity ? painted.frame : undefined}>
    <P047Runtime {...props} onPlaybackStateChange={state => {
      if (state.frameDomain === 'sprite-1024' && Number.isInteger(state.frame) && state.frame > 0) {
        setPending(previous => previous?.identity === identity && previous.frame === state.frame
          ? previous : {identity, frame: state.frame});
      }
      props.onPlaybackStateChange?.(state);
    }}/>
  </div>;
}

// Reuse the lesson's maintained source runtimes on the full course route.
// The introduction's existing source clock is separate from the later page adapters.
const adapters = Object.freeze([
  Object.freeze({
    animationId: 'shared-nms002-l01-p001',
    audioEnabled: true,
    Component: ContinuousSourceClockRuntime,
  }),
  ...NMS_L1_REGISTERED_RUNTIME_ADAPTERS.map(adapter => adapter.animationId === P047_ID
    ? Object.freeze({...adapter, Component: P047CourseFrameRuntime}) : adapter),
]);

export function G678NmsL1CoursePlayer(
  props: Omit<ComponentProps<typeof SourceLessonCandidatePlayerV1>,
    'privateRuntimeAdapter' | 'privateRuntimeAdapters' | 'registeredPagePresentation' | 'unregisteredCandidateCount'>,
) {
  return <SourceLessonCandidatePlayerV1 {...props}
    privateRuntimeAdapters={adapters}
    registeredPagePresentation="registered"
    unregisteredCandidateCount={0}
  />;
}
