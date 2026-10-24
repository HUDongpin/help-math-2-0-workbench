import 'server-only';
import {readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P008FormalDescriptor} from './alg-l06-p008-formal-admission-v1.server';
import {readBoundG678LocalRuntimeAsset} from './g678-local-runtime-asset.server';
import {P010_LESSON_CANVAS_RESOURCES,type P010LessonCanvasId}
  from './alg-l06-p010-lesson-canvas-request-v1';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
function localOnly(){
  return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
    process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT&&
    ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1';
}
function demand(ok:unknown,reason:string):asserts ok{
  if(!ok)throw Error(`P010_LESSON_CANVAS_RESOURCE: ${reason}`);
}

/** Independent P010-only reader for the exact Canvas subset of P008's formal
 * 22-page descriptor. This deliberately avoids the drifting global snapshot. */
export async function readP010LessonCanvasResource(id:P010LessonCanvasId):Promise<Buffer>{
  demand(localOnly(),'local development only');
  demand(Object.hasOwn(P010_LESSON_CANVAS_RESOURCES,id),'unknown resource');
  const pin=P010_LESSON_CANVAS_RESOURCES[id];
  const descriptor=algL6P008FormalDescriptor();
  demand(descriptor.course.moduleCode==='ALG001'&&descriptor.course.lesson===6&&
    descriptor.pages.length===60&&descriptor.productBridge.registeredAnimationCount===22&&
    descriptor.productBridge.selectedAnimationIds.length===22,'formal P008 descriptor');
  const pages=descriptor.pages.filter(page=>page.animationId===id);
  demand(pages.length===1&&pages[0].rendererAvailability.kind==='registered'&&
    pages[0].rendererAvailability.moduleKey===id&&
    descriptor.productBridge.selectedAnimationIds.includes(id),'formal registered placement');
  const root=getWorkspaceRoot();
  const transaction=readRegistryTransaction(root);
  const matches=transaction.registry.calibrations.flatMap((calibration:{
    calibrationId:string;deploymentScope:string;entries:Array<{key:string;maturity:string;
      artifacts:{runtime?:{path:string;bytes:number;sha256:string}}}>})=>
    calibration.entries.filter(entry=>entry.key===id).map(entry=>({calibration,entry})));
  demand(matches.length===1,'unique current registry entry');
  const {calibration,entry}=matches[0];
  const runtime=entry.artifacts.runtime;
  demand(calibration.deploymentScope==='local-only'&&entry.maturity==='private-current-js'&&
    runtime?.path===pin.path&&runtime.bytes===pin.bytes&&runtime.sha256===pin.sha256,
    'exact current Canvas runtime pin');
  const physicallyPinned=readPin(root,{path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
  const bound=await readBoundG678LocalRuntimeAsset({workspaceRoot:root,
    binding:{animationId:id,path:pin.path,bytes:pin.bytes,sha256:pin.sha256,
      url:pin.originalPath}});
  demand(bound&&bound.sha256===pin.sha256&&bound.bytes.equals(physicallyPinned),
    'realpath/nlink/stable bound runtime bytes');
  return bound.bytes;
}
