'use client';
import type {ComponentProps} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {SourceLessonCandidatePlayerV1} from './source-lesson-candidate-player-v1.generated';
import {G678AlgL10P004RuntimeV1} from './g678-alg-l10-p004-runtime-v1';
import {G678TerminalSourceRuntimeV1} from './g678-terminal-source-runtime-v1';
const heading=Object.freeze({en:'Rumor growth',es:'Cómo se propaga el rumor'});
function RetainedPairRuntime(props:LessonRuntimeAdapterProps){return <G678TerminalSourceRuntimeV1 {...props} readingHeading={heading}/>;}
const adapters=Object.freeze([
 {animationId:'shared-alg001-l10-p004',audioEnabled:true,Component:G678AlgL10P004RuntimeV1},
 ...['shared-alg001-l10-p005','shared-alg001-l10-p006'].map(animationId=>({animationId,audioEnabled:true,Component:RetainedPairRuntime})),
]);
export function G678AlgL10P004HostLessonV1(props:Omit<ComponentProps<typeof SourceLessonCandidatePlayerV1>,
 'privateRuntimeAdapter'|'privateRuntimeAdapters'>){
 return <SourceLessonCandidatePlayerV1 {...props} privateRuntimeAdapters={adapters}/>;
}
