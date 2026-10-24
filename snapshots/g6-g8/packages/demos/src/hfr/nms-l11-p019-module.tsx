import type {PageFactory} from './types';
import {createHfrAnimationModule} from './module';
import {P019_META} from './nms-l11-p019-meta';
import {P019_NATIVE_BINDING,p019NativeSnapshot} from './nms-l11-p019-native';
/** Source factory bytes remain generated; this maintained wrapper supplies the
 * exact nested native/current-frame and silent question97 presentation policy. */
export function createP019AnimationModule(page:PageFactory){
 const base=createHfrAnimationModule(P019_META,page);
 return Object.freeze({...base,textPresentation:Object.freeze({schemaVersion:1 as const,binding:P019_NATIVE_BINDING,Renderer:base.Renderer,reducedMotionFrameByDomain:Object.freeze({'sprite-245':97}),getSnapshot:p019NativeSnapshot})});
}
