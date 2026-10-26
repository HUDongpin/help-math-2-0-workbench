'use client';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {NmsL02P054LessonRuntimeV1} from './nms-l02-p054-lesson-runtime-v1';
import {p053HandoffLevel} from '../../../packages/demos/src/nms-l02-p053-host-navigation-v1';
/** Used only by the new P053 host; the registered P054 route stays immutable. */
export function NmsL02P053GameHandoffRuntimeV1(props:LessonRuntimeAdapterProps){
 let level:1|2|null;
 try{level=p053HandoffLevel(props.lessonHostNavigationHandoff,props.animationId);}
 catch{return <section role="alert" data-p053-handoff="blocked">The game level could not be verified.</section>;}
 return <NmsL02P054LessonRuntimeV1 key={`p053-level-${level??'default'}`} {...props}
  query={level===null?props.query:{...props.query,scenario:`source-matching-level-${level}`}}/>;
}
