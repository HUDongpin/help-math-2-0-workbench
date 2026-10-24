import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P013FormalDescriptor} from './alg-l06-p013-formal-admission-v1.server';
import {readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {readBoundG678LocalRuntimeAsset} from './g678-local-runtime-asset.server';
import {algL6P013CandidateDescriptor} from './alg-l06-p013-candidate-v1.server';
import {P013_RESOURCE_PINS,type P013Resource} from './alg-l06-p013-local-request-v1';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const OWN='shared-alg001-l06-p013';
function demand(ok:unknown,reason:string):asserts ok{
  if(!ok)throw Error(`P013_RESOURCE_INVALID: ${reason}`);
}

/** Revalidate the exact candidate, registered predecessor and physical bytes
 * on every local request. This reader grants no admission or acceptance. */
export async function readP013Resource(token:P013Resource):Promise<Buffer>{
  demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
    process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT&&
    ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
  demand(Object.hasOwn(P013_RESOURCE_PINS,token),'unknown resource');
  const row=P013_RESOURCE_PINS[token];
  const candidate=localOnlyAnimationModuleRegistration(OWN)?algL6P013FormalDescriptor():algL6P013CandidateDescriptor();
  demand(candidate.productBridge.registeredAnimationCount===24&&
    candidate.pages.length===60&&candidate.pages[12].animationId===OWN,
    'exact P013 candidate');
  const id=token.startsWith('shared-alg001-l06-')?token:
    token.startsWith('p010')?'shared-alg001-l06-p010':
    token.startsWith('p008')?'shared-alg001-l06-p008':
    token.startsWith('p004')?'shared-alg001-l06-p004':
    token.startsWith('p003')?'shared-alg001-l06-p003':OWN;
  if(id!==OWN){
    const matches=candidate.pages.filter(page=>page.animationId===id);
    demand(matches.length===1&&matches[0].rendererAvailability.kind==='registered'&&
      matches[0].rendererAvailability.moduleKey===id&&
      candidate.productBridge.selectedAnimationIds.includes(id),
      'formal registered predecessor placement');
  }
  const root=getWorkspaceRoot();
  if(id!==OWN&&row.contentType.startsWith('text/javascript')){
    const transaction=readRegistryTransaction(root);
    const entries=transaction.registry.calibrations.flatMap((calibration:{
      deploymentScope:string;entries:Array<{key:string;maturity:string;
        artifacts:{runtime?:{path:string;bytes:number;sha256:string}}}>})=>
      calibration.entries.filter(entry=>entry.key===id).map(entry=>({calibration,entry})));
    demand(entries.length===1,'unique current registry entry');
    const {calibration,entry}=entries[0];
    demand(calibration.deploymentScope==='local-only'&&entry.maturity==='private-current-js'&&
      entry.artifacts.runtime?.path===row.path&&entry.artifacts.runtime.bytes===row.bytes&&
      entry.artifacts.runtime.sha256===row.sha256,'exact current Canvas runtime pin');
  }
  const bytes=readPin(row.root==='source'?SOURCE_ROOT:root,
    {path:row.path,bytes:row.bytes,sha256:row.sha256});
  if(id!==OWN&&row.contentType.startsWith('text/javascript')&&
    row.path.startsWith('work/g678-shared-page-factory/')){
    const bound=await readBoundG678LocalRuntimeAsset({workspaceRoot:root,
      binding:{animationId:id,path:row.path,bytes:row.bytes,sha256:row.sha256,
        url:row.originalPath}});
    demand(bound&&bound.sha256===row.sha256&&bound.bytes.equals(bytes),
      'realpath/nlink/stable bound runtime bytes');
  }
  return bytes;
}
