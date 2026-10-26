'use client';
import type {ComponentProps} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v2.generated';
import {G678TerminalSourceRuntimeV1} from './g678-terminal-source-runtime-v1';
const heading=Object.freeze({en:'Rumor growth',es:'Cómo se propaga el rumor'});
function Runtime(props:LessonRuntimeAdapterProps){return <G678TerminalSourceRuntimeV1 {...props} readingHeading={heading}/>;}
const adapters=Object.freeze(['shared-alg001-l10-p005','shared-alg001-l10-p006'].map(animationId=>Object.freeze({animationId,audioEnabled:true,Component:Runtime})));
export function G678AlgL10PairLesson(props:Omit<ComponentProps<typeof G678MultiPageLessonPlayer>,'privateRuntimeAdapter'|'privateRuntimeAdapters'>){
 return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapters={adapters}/>;
}
