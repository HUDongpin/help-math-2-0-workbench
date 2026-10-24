import type {PageFactory} from './types';
import {createHfrAnimationModule} from './module';
import {P020_META} from './nms-l11-p020-meta';
import {P020_NATIVE_BINDING,p020NativeSnapshot} from './nms-l11-p020-native';
/** Source factory bytes remain generated; this maintained wrapper supplies the
 * exact nested native/current-frame and silent question102 presentation policy. */
export function createP020AnimationModule(page:PageFactory){
 const base=createHfrAnimationModule(P020_META,page);
 return Object.freeze({...base,textPresentation:Object.freeze({schemaVersion:1 as const,binding:P020_NATIVE_BINDING,Renderer:base.Renderer,reducedMotionFrameByDomain:Object.freeze({'sprite-219':102}),getSnapshot:p020NativeSnapshot})});
}
