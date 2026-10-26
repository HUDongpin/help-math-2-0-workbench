'use client';
import {useMemo, type ComponentProps} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {ALG_L6_P003_ID} from '@/lib/g678-alg-l06-p003-probe-access';
import {G678NmsL02CandidatePlayer} from './g678-nms-l02-candidate-player.generated';
import {G678AlgL6P003ContinuousRuntimeV2} from '@/components/g678-alg-l06-p003-continuous-runtime-v2';

export function G678AlgL6P003ContinuousHostLessonV2(props:
  Omit<ComponentProps<typeof G678NmsL02CandidatePlayer>, 'privateRuntimeAdapter'>) {
  const adapter = useMemo(() => ({
    animationId: ALG_L6_P003_ID, audioEnabled: true,
    Component: (runtimeProps: LessonRuntimeAdapterProps) =>
      <G678AlgL6P003ContinuousRuntimeV2 {...runtimeProps}/>,
  }), []);
  return <G678NmsL02CandidatePlayer {...props} privateRuntimeAdapter={adapter}/>;
}
