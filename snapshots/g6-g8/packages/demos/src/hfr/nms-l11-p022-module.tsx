import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {PageFactory} from './types';
import {createHfrAnimationModule} from './module';
import {P022_META} from './nms-l11-p022-meta';
import {P022Renderer} from './nms-l11-p022-renderer';
import {P022_NATIVE_BINDING,p022NativeSnapshot} from './nms-l11-p022-native';
/** The page uses a maintained direct renderer binding; no shared renderer switch
 * is needed. The original generated factory owns all source drag outcomes. */
export function createP022AnimationModule(page:PageFactory){
 const base=createHfrAnimationModule(P022_META,page);
 function Renderer(props:AnimationRendererProps){return <P022Renderer {...props} meta={P022_META} page={page}/>;}
 Renderer.displayName='P022SourceDragPractice';
 return Object.freeze({...base,Renderer,textPresentation:Object.freeze({schemaVersion:1 as const,binding:P022_NATIVE_BINDING,Renderer,reducedMotionFrameByDomain:Object.freeze({'sprite-65':172}),getSnapshot:p022NativeSnapshot})});
}
