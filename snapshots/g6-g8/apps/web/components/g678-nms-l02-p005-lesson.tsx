'use client';
import type {ComponentProps} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {DescriptorDrivenWholeLessonPlayer} from './descriptor-driven-whole-lesson-player';
import {G678TerminalSourceRuntimeV1} from './g678-terminal-source-runtime-v1';
const heading = Object.freeze({en:'Distance walked',es:'Distancia recorrida'});
function Runtime(props:LessonRuntimeAdapterProps) {return <G678TerminalSourceRuntimeV1 {...props} readingHeading={heading}/>;}
const adapter = Object.freeze({animationId:'shared-nms002-l02-p005',audioEnabled:true,Component:Runtime});
export function G678NmsL2P005Lesson(props:Omit<ComponentProps<typeof DescriptorDrivenWholeLessonPlayer>,'privateRuntimeAdapter'>) {
  return <DescriptorDrivenWholeLessonPlayer {...props} privateRuntimeAdapter={adapter}/>;
}
