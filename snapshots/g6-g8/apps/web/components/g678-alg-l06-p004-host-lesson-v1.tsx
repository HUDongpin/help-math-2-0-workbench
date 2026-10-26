'use client';
import {useMemo,type ComponentProps} from 'react';
import {G678AlgL6P004CandidatePlayer} from './g678-alg-l06-p004-candidate-player-v1.generated';
import {G678AlgL6P004RuntimeV1} from './g678-alg-l06-p004-runtime-v1';
import {G678AlgL6P003ContinuousRuntimeV2} from './g678-alg-l06-p003-continuous-runtime-v2';

export function G678AlgL6P004HostLessonV1(props:Omit<ComponentProps<typeof G678AlgL6P004CandidatePlayer>,'privateRuntimeAdapter'|'privateRuntimeAdapters'>){
 const adapters=useMemo(()=>[
  {animationId:'shared-alg001-l06-p004',audioEnabled:true,glossaryClosePolicy:'stay-paused' as const,Component:G678AlgL6P004RuntimeV1},
  {animationId:'shared-alg001-l06-p003',audioEnabled:true,Component:G678AlgL6P003ContinuousRuntimeV2},
 ],[]);
 return <G678AlgL6P004CandidatePlayer {...props} privateRuntimeAdapters={adapters}/>;
}
