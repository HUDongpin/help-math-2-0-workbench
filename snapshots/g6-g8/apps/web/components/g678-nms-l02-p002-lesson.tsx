'use client';
import type {ComponentProps} from 'react';
import dynamic from 'next/dynamic';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v3.generated';

const Introduction = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p001-lesson-audio-successor-v1').then(m => m.NmsL2P001LessonAudioSuccessorV1), {ssr: false});
const RealWorld = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./nms-l02-p002-source-runtime-v1').then(m => m.NmsL2P002SourceRuntimeV1), {ssr: false});
const Distance = process.env.NODE_ENV === 'production' ? () => null
  : dynamic(() => import('./g678-terminal-source-runtime-v1').then(m => {
    const Runtime = (props: LessonRuntimeAdapterProps) => <m.G678TerminalSourceRuntimeV1 {...props}
      readingHeading={{en: 'Distance walked', es: 'Distancia recorrida'}}/>;
    return Runtime;
  }), {ssr: false});
const adapters = Object.freeze([
  Object.freeze({animationId: 'shared-nms002-l02-p002', audioEnabled: true, Component: RealWorld}),
  Object.freeze({animationId: 'shared-nms002-l02-p001', audioEnabled: true, Component: Introduction}),
  Object.freeze({animationId: 'shared-nms002-l02-p005', audioEnabled: true, Component: Distance}),
]);
export function G678NmsL2P002Lesson(props: Omit<ComponentProps<typeof G678MultiPageLessonPlayer>, 'privateRuntimeAdapter' | 'privateRuntimeAdapters'>) {
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapters={adapters}/>;
}
