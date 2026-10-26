'use client';
import {DatL05RegisteredAudioRuntime} from './dat-l05-registered-audio-runtime';
import type {ComponentProps} from 'react';
import {DescriptorDrivenWholeLessonPlayer} from './descriptor-driven-whole-lesson-player';
import {NmsL11RegisteredAudioRuntime} from './nms-l11-registered-audio-runtime';
import {NmsL2RegisteredAudioRuntime} from './nms-l02-registered-audio-runtime';
import {ContinuousSourceClockRuntime} from './continuous-source-clock-runtime';
import {FROZEN_CONTINUOUS_SOURCE_MEMBERS} from '../../../packages/demos/src/frozen-continuous-source-scope';
const adapters=[...FROZEN_CONTINUOUS_SOURCE_MEMBERS.map(({animationId})=>Object.freeze({animationId,audioEnabled:true,Component:animationId==='shared-nms002-l02-p020'?NmsL2RegisteredAudioRuntime:ContinuousSourceClockRuntime})),Object.freeze({animationId:'shared-nms002-l11-p030',audioEnabled:true,Component:NmsL11RegisteredAudioRuntime}),Object.freeze({animationId:'shared-dat001-l05-p040',audioEnabled:true,Component:DatL05RegisteredAudioRuntime})];
export function ContinuousSourceClockLessonPilot(props:Omit<ComponentProps<typeof DescriptorDrivenWholeLessonPlayer>,'privateRuntimeAdapter'>){
  const adapter=adapters.find(a=>props.descriptor.pages.some(p=>p.animationId===a.animationId));
  return <DescriptorDrivenWholeLessonPlayer {...props} privateRuntimeAdapter={adapter}/>;
}
