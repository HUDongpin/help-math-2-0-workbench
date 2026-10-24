'use client';

import {useMemo, type ComponentProps} from 'react';
import {G678AlgL6P004FormalPlayer} from './g678-alg-l06-p004-formal-player-v1.generated';
import {G678AlgL6P021CandidatePlayer} from './g678-alg-l06-p021-candidate-player-v1.generated';
import {G678AlgL6P010RuntimeV1} from './g678-alg-l06-p010-runtime-v1';
import {G678AlgL6P020RuntimeV1} from './g678-alg-l06-p020-runtime-v1';
import {G678AlgL6P021RuntimeV1} from './g678-alg-l06-p021-runtime-v1';
import {G678AlgL6P019RuntimeV1} from './g678-alg-l06-p019-runtime-v1';
import {G678AlgL6P018RuntimeV1} from './g678-alg-l06-p018-runtime-v1';
import {G678AlgL6P017RuntimeV1} from './g678-alg-l06-p017-runtime-v1';
import {G678AlgL6P016RuntimeV1} from './g678-alg-l06-p016-runtime-v1';
import {G678AlgL6P015RuntimeV1} from './g678-alg-l06-p015-runtime-v1';
import {G678AlgL6P014RuntimeV1} from './g678-alg-l06-p014-runtime-v1';
import {G678AlgL6P013RuntimeV1} from './g678-alg-l06-p013-runtime-v1';
import {G678AlgL6P008RuntimeV1} from './g678-alg-l06-p008-runtime-v1';
import {G678AlgL6P004RuntimeV1} from './g678-alg-l06-p004-runtime-v1';
import {G678AlgL6P003ContinuousRuntimeV2} from './g678-alg-l06-p003-continuous-runtime-v2';

/** The same real My Lesson player, with exact adapters for its thirteen maintained source-clock pages. */
export function G678AlgL6P021HostLessonV1(
  props: Omit<ComponentProps<typeof G678AlgL6P021CandidatePlayer>, 'privateRuntimeAdapter' | 'privateRuntimeAdapters'> & {formal?: boolean},
) {
  const adapters = useMemo(() => [
    {animationId: 'shared-alg001-l06-p020', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P020RuntimeV1},
    {animationId: 'shared-alg001-l06-p021', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P021RuntimeV1},
    {animationId: 'shared-alg001-l06-p019', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P019RuntimeV1},
    {animationId: 'shared-alg001-l06-p018', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P018RuntimeV1},
    {animationId: 'shared-alg001-l06-p017', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P017RuntimeV1},
    {animationId: 'shared-alg001-l06-p016', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P016RuntimeV1},
    {animationId: 'shared-alg001-l06-p015', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P015RuntimeV1},
    {animationId: 'shared-alg001-l06-p014', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P014RuntimeV1},
    {animationId: 'shared-alg001-l06-p013', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P013RuntimeV1},
    {animationId: 'shared-alg001-l06-p010', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const, Component: G678AlgL6P010RuntimeV1},
    {animationId: 'shared-alg001-l06-p008', audioEnabled: true, Component: G678AlgL6P008RuntimeV1},
    {animationId: 'shared-alg001-l06-p004', audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const,
      Component: G678AlgL6P004RuntimeV1},
    {animationId: 'shared-alg001-l06-p003', audioEnabled: true, Component: G678AlgL6P003ContinuousRuntimeV2},
  ], []);
  const {formal=false,...playerProps}=props;
  const Player=formal?G678AlgL6P004FormalPlayer:G678AlgL6P021CandidatePlayer;
  return <Player {...playerProps} privateRuntimeAdapters={adapters}/>;
}
