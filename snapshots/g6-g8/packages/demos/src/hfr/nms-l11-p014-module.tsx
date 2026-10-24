import type {RuntimeContext} from '../contract';
import type {PageFactory} from './types';
import {createHfrAnimationModule} from './module';
import {P014_META} from './nms-l11-p014-meta';
import {P014_NATIVE_BINDING,type P014NativeFrame} from './nms-l11-p014-native';
import {P014Product} from './nms-l11-p014-product';
/** The stage producer supplies the exact generated, hash-bound P014 factory. */
export function createP014AnimationModule(page:PageFactory){
 const base=createHfrAnimationModule(P014_META,page);
 return Object.freeze({...base,textPresentation:Object.freeze({schemaVersion:1 as const,binding:P014_NATIVE_BINDING,Renderer:base.Renderer,reducedMotionFrameByDomain:Object.freeze({'sprite-237':228}),getSnapshot(state:unknown,context:RuntimeContext){
  const value=state as {product?:P014Product;native?:P014NativeFrame};
  if(!(value?.product instanceof P014Product)||!value.native||value.native.snapshot.identity.frameDomain!=='sprite-237'||value.native.snapshot.identity.rootFrame!==6||(context.frameDomain!==undefined&&context.frameDomain!==value.native.snapshot.identity.frameDomain)||(context.rootFrame!==undefined&&context.rootFrame!==value.native.snapshot.identity.rootFrame)||value.native.snapshot.identity.frame!==context.frame||!value.product.isNativeCurrent(value.native,{lang:context.lang,scenario:context.scenario,seed:context.seed,replay:context.replay??0}))throw Error('P014_CURRENT_OWNED_NATIVE_FRAME_REQUIRED');
  return value.native.snapshot;
 }})});
}
