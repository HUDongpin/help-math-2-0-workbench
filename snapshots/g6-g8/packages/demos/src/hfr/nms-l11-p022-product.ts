import {MovieClip,type Runtime,type DisplayObject} from './display';
import {P022PracticeHost} from './nms-l11-p022-practice-host';
import {P022NativePresentation,type P022NativeFrame} from './nms-l11-p022-native';
import type {HfrTextIdentity} from './hfr-native-text';
/** Draft facade for one real page lease. Shared renderer/player dispatch is not
 * installed by this module. Source release decides correctness and movement. */
export class P022Product{
 readonly adapter:P022PracticeHost;
 private native:P022NativePresentation|null=null;
 private committed:P022NativeFrame|null=null;
 constructor(readonly runtime:Runtime,private readonly options:Readonly<{validatedDataSha256:string;isCurrent:()=>boolean}>){this.adapter=new P022PracticeHost(runtime,options);}
 async prepareNative(){const prepared=await P022NativePresentation.prepare(this.runtime,this.adapter,this.options.validatedDataSha256);if(!this.adapter.current())throw Error('P022_PRODUCT_STALE_LEASE');this.native=prepared;}
 view(identity:HfrTextIdentity){return Object.freeze({state:this.adapter.snapshot(),native:this.native?.capture(identity)??null,glossary:this.adapter.glossaryControls()});}
 /** The rendering layer calls this after this exact snapshot commits. Capturing
  * a snapshot alone never transfers text ownership from Canvas. */
 isNativeCurrent(frame:P022NativeFrame,identity:HfrTextIdentity):boolean{return Boolean(this.native?.current(frame,identity));}
 commitNative(frame:P022NativeFrame,identity:HfrTextIdentity):boolean{if(!this.native?.current(frame,identity)||frame.snapshot.status!=='ready')return false;this.committed=frame;return true;}
 shouldSuppressText(object:DisplayObject,identity:HfrTextIdentity):boolean{return Boolean(this.committed&&this.native?.current(this.committed,identity)&&this.committed.sourceObjects.includes(object));}
 canReleaseSourceDrag(clip:DisplayObject):clip is MovieClip{return this.adapter.current()&&clip instanceof MovieClip&&this.runtime.pressed===clip&&this.runtime.drag?.clip===clip&&this.adapter.snapshot().pairs.some(p=>p.source===clip);}
 /** Canvas/keyboard integration must pass the actual current pointerUp callback.
  * MovieClip drags deliberately do not call HfrPlayer.runSourceButtonRelease. */
 releaseSourceDrag(clip:DisplayObject,release:()=>void):boolean{if(!this.canReleaseSourceDrag(clip))return false;const errors=this.runtime.errors.length;release();if(!this.adapter.current()||this.runtime.errors.length!==errors||this.runtime.drag||this.runtime.pressed)throw Error('P022_SOURCE_POINTER_RELEASE_REQUIRED');return true;}
 dispose(){this.committed=null;this.native=null;this.adapter.dispose();}
}
