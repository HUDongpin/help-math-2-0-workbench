'use client';
import {useMemo,type ComponentProps} from 'react';
import {SourceLessonCandidatePlayerV1} from './source-lesson-candidate-player-v1.generated';
import {G678AlgL07P001RuntimeV1} from './g678-alg-l07-p001-runtime-v1';

export function G678AlgL07P001HostLessonV1(
 props:Omit<ComponentProps<typeof SourceLessonCandidatePlayerV1>,
  'privateRuntimeAdapter'|'privateRuntimeAdapters'>){
 const adapters=useMemo(()=>[{animationId:'shared-alg001-l07-p001',audioEnabled:true,
  Component:G678AlgL07P001RuntimeV1}],[]);
 return <SourceLessonCandidatePlayerV1 {...props} privateRuntimeAdapters={adapters}/>;
}
