import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {PageFactory} from './types';
import {createHfrAnimationModule} from './module';
import {P026_META} from './nms-l11-p026-meta';
import {P026Renderer} from './nms-l11-p026-renderer';
import {P026_NATIVE_BINDING,p026NativeSnapshot} from './nms-l11-p026-native';
/** The page uses a maintained direct renderer binding; no shared renderer switch
 * is needed. The original generated factory owns all source drag outcomes. */
export function createP026AnimationModule(page:PageFactory){
 const base=createHfrAnimationModule(P026_META,page);
 function Renderer(props:AnimationRendererProps){return <P026Renderer {...props} meta={P026_META} page={page}/>;}
 Renderer.displayName='P026SourceDragPractice';
 return Object.freeze({...base,Renderer,textPresentation:Object.freeze({schemaVersion:1 as const,binding:P026_NATIVE_BINDING,Renderer,reducedMotionFrameByDomain:Object.freeze({'sprite-114':427}),getSnapshot:p026NativeSnapshot})});
}
