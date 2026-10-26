'use client';
import {useMemo, type ComponentProps} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {ALG_L6_P003_ID} from '@/lib/g678-alg-l06-p003-probe-access';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v3.generated';
import {G678AlgL6P003HostRuntime} from '@/components/g678-alg-l06-p003-host-runtime';

export function G678AlgL6P003HostLesson(props:
  Omit<ComponentProps<typeof G678MultiPageLessonPlayer>, 'privateRuntimeAdapter'>) {
  const adapter = useMemo(() => ({
    animationId: ALG_L6_P003_ID, audioEnabled: true,
    Component: (runtimeProps: LessonRuntimeAdapterProps) =>
      <G678AlgL6P003HostRuntime {...runtimeProps}/>,
  }), []);
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapter={adapter}/>;
}
