'use client';
import type {ComponentProps} from 'react';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v3.generated';
import {NmsL1P002SourceRuntimeV1} from './nms-l01-p002-source-runtime-v1';
const adapters=Object.freeze([Object.freeze({animationId:'shared-nms002-l01-p002',audioEnabled:true,Component:NmsL1P002SourceRuntimeV1})]);
export function G678NmsL1P002Lesson(props:Omit<ComponentProps<typeof G678MultiPageLessonPlayer>,'privateRuntimeAdapter'|'privateRuntimeAdapters'>){
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapters={adapters}/>;
}
