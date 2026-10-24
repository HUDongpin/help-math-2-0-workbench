import {MovieClip,type Runtime,type DisplayObject} from './display';
import {P014PracticeHost} from './nms-l11-p014-practice-host';
import {P014NativePresentation,type P014NativeFrame} from './nms-l11-p014-native';
import type {HfrTextIdentity} from './hfr-native-text';
/** Draft facade for one real page lease. Shared renderer/player dispatch is not
 * installed by this module. Source release decides correctness and movement. */
export class P014Product{
 readonly adapter:P014PracticeHost;
 private native:P014NativePresentation|null=null;
 private committed:P014NativeFrame|null=null;
 constructor(readonly runtime:Runtime,private readonly options:Readonly<{validatedDataSha256:string;isCurrent:()=>boolean}>){this.adapter=new P014PracticeHost(runtime,options);}
 async prepareNative(){const prepared=await P014NativePresentation.prepare(this.runtime,this.adapter,this.options.validatedDataSha256);if(!this.adapter.current())throw Error('P014_PRODUCT_STALE_LEASE');this.native=prepared;}
 view(identity:HfrTextIdentity){return Object.freeze({state:this.adapter.snapshot(),native:this.native?.capture(identity)??null,glossary:this.adapter.glossaryControls()});}
 /** The rendering layer calls this after this exact snapshot commits. Capturing
  * a snapshot alone never transfers text ownership from Canvas. */
 isNativeCurrent(frame:P014NativeFrame,identity:HfrTextIdentity):boolean{return Boolean(this.native?.current(frame,identity));}
 commitNative(frame:P014NativeFrame,identity:HfrTextIdentity):boolean{if(!this.native?.current(frame,identity)||frame.snapshot.status!=='ready')return false;this.committed=frame;return true;}
 shouldSuppressText(object:DisplayObject,identity:HfrTextIdentity):boolean{return Boolean(this.committed&&this.native?.current(this.committed,identity)&&this.committed.sourceObjects.includes(object));}
 canReleaseSourceDrag(clip:DisplayObject):clip is MovieClip{return this.adapter.current()&&clip instanceof MovieClip&&this.runtime.pressed===clip&&this.runtime.drag?.clip===clip&&this.adapter.snapshot().pairs.some(p=>p.source===clip);}
 /** Canvas/keyboard integration must pass the actual current pointerUp callback.
  * MovieClip drags deliberately do not call HfrPlayer.runSourceButtonRelease. */
 releaseSourceDrag(clip:DisplayObject,release:()=>void):boolean{if(!this.canReleaseSourceDrag(clip))return false;const errors=this.runtime.errors.length;release();if(!this.adapter.current()||this.runtime.errors.length!==errors||this.runtime.drag||this.runtime.pressed)throw Error('P014_SOURCE_POINTER_RELEASE_REQUIRED');return true;}
 dispose(){this.committed=null;this.native=null;this.adapter.dispose();}
}
