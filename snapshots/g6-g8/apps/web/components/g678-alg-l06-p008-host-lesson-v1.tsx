'use client';

import {useMemo, type ComponentProps} from 'react';
import {G678AlgL6P004FormalPlayer} from './g678-alg-l06-p004-formal-player-v1.generated';
import {G678AlgL6P008RuntimeV1} from './g678-alg-l06-p008-runtime-v1';
import {G678AlgL6P004RuntimeV1} from './g678-alg-l06-p004-runtime-v1';
import {G678AlgL6P003ContinuousRuntimeV2} from './g678-alg-l06-p003-continuous-runtime-v2';

/** The same real My Lesson player, with exact adapters for its three source-clock pages. */
export function G678AlgL6P008HostLessonV1(
  props: Omit<ComponentProps<typeof G678AlgL6P004FormalPlayer>, 'privateRuntimeAdapter' | 'privateRuntimeAdapters'>,
) {
  const adapters = useMemo(() => [
    {animationId: 'shared-alg001-l06-p008', audioEnabled: true, Component: G678AlgL6P008RuntimeV1},
    {animationId: 'shared-alg001-l06-p004', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const,
      Component: G678AlgL6P004RuntimeV1},
    {animationId: 'shared-alg001-l06-p003', audioEnabled: true, Component: G678AlgL6P003ContinuousRuntimeV2},
  ], []);
  return <G678AlgL6P004FormalPlayer {...props} privateRuntimeAdapters={adapters}/>;
}
