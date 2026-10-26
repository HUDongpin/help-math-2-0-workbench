'use client';
import type {ComponentProps} from 'react';
import dynamic from 'next/dynamic';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v3.generated';

const Introduction = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p001-lesson-audio-successor-v1').then(m => m.NmsL2P001LessonAudioSuccessorV1), {ssr: false});
const RealWorld = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p002-source-runtime-v1').then(m => m.NmsL2P002SourceRuntimeV1), {ssr: false});
const Fruit = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p003-source-runtime-v1').then(m => m.NmsL2P003SourceRuntimeV1), {ssr: false});
const Donkeys = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p004-source-runtime-v1').then(m => m.NmsL2P004SourceRuntimeV1), {ssr: false});
const DecimalPointQuestion = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p010-source-runtime-v1').then(m => m.NmsL2P010SourceRuntimeV1), {ssr: false});
const DecimalPointVocabulary = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p009-source-runtime-v1').then(m => m.NmsL2P009SourceRuntimeV1), {ssr: false});
const DecimalVocabulary = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p008-source-runtime-v1').then(m => m.NmsL2P008SourceRuntimeV1), {ssr: false});
const Vocabulary = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p007-source-runtime-v1').then(m => m.NmsL2P007SourceRuntimeV1), {ssr: false});
const EssentialQuestion = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p006-source-runtime-v1').then(m => m.NmsL2P006SourceRuntimeV1), {ssr: false});
const Distance = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./g678-terminal-source-runtime-v1').then(m => {
    const Runtime = (props: LessonRuntimeAdapterProps) => <m.G678TerminalSourceRuntimeV1 {...props}
      readingHeading={{en: 'Distance walked', es: 'Distancia recorrida'}}/>;
    return Runtime;
  }), {ssr: false});
const EquivalentVocabulary = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p011-source-runtime-v1').then(m => m.NmsL2P011SourceRuntimeV1), {ssr: false});
const EquivalentFractionVocabulary = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p012-source-runtime-v1').then(m => m.NmsL2P012SourceRuntimeV1), {ssr: false});
const adapters = Object.freeze([
  Object.freeze({animationId: 'shared-nms002-l02-p012', audioEnabled: true, Component: EquivalentFractionVocabulary}),
  Object.freeze({animationId: 'shared-nms002-l02-p011', audioEnabled: true, Component: EquivalentVocabulary}),
  Object.freeze({animationId: 'shared-nms002-l02-p010', audioEnabled: true, Component: DecimalPointQuestion}),
  Object.freeze({animationId: 'shared-nms002-l02-p009', audioEnabled: true, Component: DecimalPointVocabulary}),
  Object.freeze({animationId: 'shared-nms002-l02-p008', audioEnabled: true, Component: DecimalVocabulary}),
  Object.freeze({animationId: 'shared-nms002-l02-p007', audioEnabled: true, Component: Vocabulary}),
  Object.freeze({animationId: 'shared-nms002-l02-p006', audioEnabled: true, Component: EssentialQuestion}),
  Object.freeze({animationId: 'shared-nms002-l02-p004', audioEnabled: true, Component: Donkeys}),
  Object.freeze({animationId: 'shared-nms002-l02-p003', audioEnabled: true, Component: Fruit}),
  Object.freeze({animationId: 'shared-nms002-l02-p002', audioEnabled: true, Component: RealWorld}),
  Object.freeze({animationId: 'shared-nms002-l02-p001', audioEnabled: true, Component: Introduction}),
  Object.freeze({animationId: 'shared-nms002-l02-p005', audioEnabled: true, Component: Distance}),
]);
export function G678NmsL2P012Lesson(props: Omit<ComponentProps<typeof G678MultiPageLessonPlayer>, 'privateRuntimeAdapter' | 'privateRuntimeAdapters'>) {
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapters={adapters}/>;
}
