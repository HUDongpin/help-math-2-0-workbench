import 'server-only';
import {readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {readBoundG678LocalRuntimeAsset} from './g678-local-runtime-asset.server';
import {p001LocalDevelopment} from './alg-l08-p001-preview-policy-v1';
import {L8_LESSON_CANVAS_RESOURCES,type L8LessonCanvasId} from './alg-l08-lesson-canvas-request-v1';
/** Each read binds the exact existing registry entry and physical runtime bytes. */
export async function readL8LessonCanvasResource(id:L8LessonCanvasId):Promise<Buffer>{
 if(!p001LocalDevelopment()||!Object.hasOwn(L8_LESSON_CANVAS_RESOURCES,id))throw Error('L8_CANVAS_SCOPE');
 const root=getWorkspaceRoot(),pin=L8_LESSON_CANVAS_RESOURCES[id],tx=readRegistryTransaction(root);
 const matches=tx.registry.calibrations.flatMap((c:{deploymentScope:string;entries:Array<{key:string;maturity:string;artifacts:{runtime?:{path:string;bytes:number;sha256:string}}}>})=>c.entries.filter(e=>e.key===id).map(e=>({c,e})));
 if(matches.length!==1)throw Error('L8_CANVAS_REGISTRATION');
 const {c,e}=matches[0],runtime=e.artifacts.runtime;
 if(c.deploymentScope!=='local-only'||e.maturity!=='private-current-js'||runtime?.path!==pin.path||runtime.bytes!==pin.bytes||runtime.sha256!==pin.sha256)throw Error('L8_CANVAS_PIN');
 const physical=readPin(root,{path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
 const bound=await readBoundG678LocalRuntimeAsset({workspaceRoot:root,binding:{animationId:id,path:pin.path,bytes:pin.bytes,sha256:pin.sha256,url:pin.originalPath}});
 if(!bound||bound.sha256!==pin.sha256||!bound.bytes.equals(physical))throw Error('L8_CANVAS_PHYSICAL_BINDING');
 return bound.bytes;
}
