'use client';
import type {ComponentProps} from 'react';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v3.generated';
import {NmsL1P002SourceRuntimeV1} from './nms-l01-p002-source-runtime-v1';
import {NmsL1P005SourceRuntimeV1} from './nms-l01-p005-source-runtime-v1';
import {NmsL1P007SourceRuntimeV1} from './nms-l01-p007-source-runtime-v1';
import {G678SourceStoryRuntimeV1} from './g678-source-story-runtime-v1';
import {NmsL1P008HostTerminalRuntimeV1} from './nms-l01-p008-host-terminal-runtime-v1';
import {NmsL1P009SourceRuntimeV1} from './nms-l01-p009-source-runtime-v1';
import {NmsL1P010SourceRuntimeV1} from './nms-l01-p010-source-runtime-v1';
import {NmsL1P011SourceRuntimeV1} from './nms-l01-p011-source-runtime-v1';
import {NmsL1P013SourceRuntimeV1} from './nms-l01-p013-source-runtime-v1';
import {NmsL1P015SourceRuntimeV1} from './nms-l01-p015-source-runtime-v1';
import {NmsL1P016SourceRuntimeV1} from './nms-l01-p016-source-runtime-v1';
import {NmsL1P017SourceRuntimeV2} from './nms-l01-p017-source-runtime-v2';
const adapters=Object.freeze([
 Object.freeze({animationId:'shared-nms002-l01-p017',audioEnabled:true,Component:NmsL1P017SourceRuntimeV2}),
 Object.freeze({animationId:'shared-nms002-l01-p016',audioEnabled:true,Component:NmsL1P016SourceRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p015',audioEnabled:true,Component:NmsL1P015SourceRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p013',audioEnabled:true,Component:NmsL1P013SourceRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p011',audioEnabled:true,Component:NmsL1P011SourceRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p010',audioEnabled:true,Component:NmsL1P010SourceRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p009',audioEnabled:true,Component:NmsL1P009SourceRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p008',audioEnabled:true,Component:NmsL1P008HostTerminalRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p007',audioEnabled:true,Component:NmsL1P007SourceRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p005',audioEnabled:true,Component:NmsL1P005SourceRuntimeV1}),
 Object.freeze({animationId:'shared-nms002-l01-p002',audioEnabled:true,Component:NmsL1P002SourceRuntimeV1}),
 ...['shared-nms002-l01-p003','shared-nms002-l01-p004'].map(animationId=>Object.freeze({animationId,audioEnabled:true,Component:G678SourceStoryRuntimeV1})),
]);
export function G678NmsL1P017LayoutV2Lesson(props:Omit<ComponentProps<typeof G678MultiPageLessonPlayer>,'privateRuntimeAdapter'|'privateRuntimeAdapters'>){return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapters={adapters}/>;}
