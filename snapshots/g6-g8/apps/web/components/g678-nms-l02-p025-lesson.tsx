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
const SixthsExercise = process.env.NODE_ENV === 'production' ? () => null
 : dynamic(() => import('./nms-l02-p013-source-runtime-v1').then(m => m.NmsL2P013SourceRuntimeV1), {ssr: false});
const EquivalentDecimalVocabulary = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p014-source-runtime-v1').then(m => m.NmsL2P014SourceRuntimeV1), {ssr: false});
const PercentVocabulary = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p015-source-runtime-v1').then(m => m.NmsL2P015SourceRuntimeV1), {ssr: false});
const PercentExercise = process.env.NODE_ENV === 'production' ? () => null
 : dynamic(() => import('./nms-l02-p016-source-runtime-v1').then(m => m.NmsL2P016SourceRuntimeV1), {ssr: false});
const FractionsInstruction = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p017-source-runtime-v1').then(m => m.NmsL2P017SourceRuntimeV1), {ssr: false});
const FractionHalves = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p018-source-runtime-v1').then(m => m.NmsL2P018SourceRuntimeV1), {ssr: false});
const NamingFractions = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p021-source-runtime-v1').then(m => m.NmsL2P021SourceRuntimeV1), {ssr: false});
const FractionQuestion = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p022-source-runtime-v1').then(m => m.NmsL2P022SourceRuntimeV1), {ssr: false});
const NumberLine = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p023-source-runtime-v1').then(m => m.NmsL2P023SourceRuntimeV1), {ssr: false});
const BalloonDrag = process.env.NODE_ENV === 'production' ? () => null
 : dynamic(() => import('./nms-l02-p024-source-runtime-v1').then(m => m.NmsL2P024SourceRuntimeV1), {ssr: false});
const EquivalentFractions = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p025-source-runtime-v1').then(m => m.NmsL2P025SourceRuntimeV1), {ssr: false});
const adapters = Object.freeze([
  Object.freeze({animationId: 'shared-nms002-l02-p025', audioEnabled: true, Component: EquivalentFractions}),
 Object.freeze({animationId: 'shared-nms002-l02-p024', audioEnabled: true, Component: BalloonDrag}),
  Object.freeze({animationId: 'shared-nms002-l02-p023', audioEnabled: true, Component: NumberLine}),
  Object.freeze({animationId: 'shared-nms002-l02-p022', audioEnabled: true, Component: FractionQuestion}),
  Object.freeze({animationId: 'shared-nms002-l02-p021', audioEnabled: true, Component: NamingFractions}),
  Object.freeze({animationId: 'shared-nms002-l02-p018', audioEnabled: true, Component: FractionHalves}),
  Object.freeze({animationId: 'shared-nms002-l02-p017', audioEnabled: true, Component: FractionsInstruction}),
 Object.freeze({animationId: 'shared-nms002-l02-p016', audioEnabled: true, Component: PercentExercise}),
  Object.freeze({animationId: 'shared-nms002-l02-p015', audioEnabled: true, Component: PercentVocabulary}),
  Object.freeze({animationId: 'shared-nms002-l02-p014', audioEnabled: true, Component: EquivalentDecimalVocabulary}),
 Object.freeze({animationId: 'shared-nms002-l02-p013', audioEnabled: true, Component: SixthsExercise}),
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
export function G678NmsL2P025Lesson(props: Omit<ComponentProps<typeof G678MultiPageLessonPlayer>, 'privateRuntimeAdapter' | 'privateRuntimeAdapters'>) {
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapters={adapters}/>;
}
