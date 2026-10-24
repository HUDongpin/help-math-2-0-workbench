import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {PageFactory} from './types';
import {createHfrAnimationModule} from './module';
import {P027_META} from './nms-l11-p027-meta';
import {P027Renderer} from './nms-l11-p027-renderer';
import {P027_NATIVE_BINDING,p027NativeSnapshot} from './nms-l11-p027-native';
/** The page uses a maintained direct renderer binding; no shared renderer switch
 * is needed. The original generated factory owns all source drag outcomes. */
export function createP027AnimationModule(page:PageFactory){
 const base=createHfrAnimationModule(P027_META,page);
 function Renderer(props:AnimationRendererProps){return <P027Renderer {...props} meta={P027_META} page={page}/>;}
 Renderer.displayName='P027SourceDragPractice';
 return Object.freeze({...base,Renderer,textPresentation:Object.freeze({schemaVersion:1 as const,binding:P027_NATIVE_BINDING,Renderer,reducedMotionFrameByDomain:Object.freeze({'sprite-142':278}),getSnapshot:p027NativeSnapshot})});
}
