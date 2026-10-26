'use client';
import type {ComponentProps} from 'react';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v3.generated';
import {NmsL1P002SourceRuntimeV1} from './nms-l01-p002-source-runtime-v1';
import {NmsL1P005SourceRuntimeV1} from './nms-l01-p005-source-runtime-v1';
import {G678SourceStoryRuntimeV1} from './g678-source-story-runtime-v1';
const adapters=Object.freeze([
  Object.freeze({animationId:'shared-nms002-l01-p005',audioEnabled:true,Component:NmsL1P005SourceRuntimeV1}),
  Object.freeze({animationId:'shared-nms002-l01-p002',audioEnabled:true,Component:NmsL1P002SourceRuntimeV1}),
  ...['shared-nms002-l01-p003','shared-nms002-l01-p004'].map(animationId=>Object.freeze({animationId,audioEnabled:true,Component:G678SourceStoryRuntimeV1})),
]);
export function G678NmsL1P005Lesson(props:Omit<ComponentProps<typeof G678MultiPageLessonPlayer>,'privateRuntimeAdapter'|'privateRuntimeAdapters'>){
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapters={adapters}/>;
}
