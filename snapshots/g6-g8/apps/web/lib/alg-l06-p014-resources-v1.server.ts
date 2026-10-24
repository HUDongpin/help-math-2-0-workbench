import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P014CandidateDescriptor} from './alg-l06-p014-candidate-v1.server';
import {algL6P014FormalDescriptor} from './alg-l06-p014-formal-admission-v1.server';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {readBoundG678LocalRuntimeAsset} from './g678-local-runtime-asset.server';
import {P014_RESOURCE_PINS,type P014Resource} from './alg-l06-p014-local-request-v1';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const OWN='shared-alg001-l06-p014';
const AUDIO={path:'migrations/shared-alg001-l06-p014/audit/audio-v1/audio-source-audit-v1.json',
  bytes:209282,sha256:'21430358709c5d2d5c3668774482a6981e34355605d50fbd2c5fa3c6e4bc63f8'};
const OWN_TOKENS=new Set(['canvas-renderer.js','main-1','main-2','sprite-28','sprite-83',
  'sprite-115','sprite-148','sprite-156','sprite-173','sprite-187','optional-spanish-audio-v1']);
function demand(ok:unknown,reason:string):asserts ok{
  if(!ok)throw Error(`P014_RESOURCE_INVALID: ${reason}`);
}
function resourceAnimationId(token:string){
  if(OWN_TOKENS.has(token))return OWN;
  if(token.startsWith('p013'))return 'shared-alg001-l06-p013';
  if(token.startsWith('p010'))return 'shared-alg001-l06-p010';
  if(token.startsWith('p008'))return 'shared-alg001-l06-p008';
  if(token.startsWith('p004'))return 'shared-alg001-l06-p004';
  if(token.startsWith('p003'))return 'shared-alg001-l06-p003';
  return token;
}
function checkOwnAudio(token:string,row:{path:string;bytes:number;sha256:string},
  audit:{streams:Array<{domain:string;extractedMp3:{path:string;bytes:number;sha256:string};
    contiguousRanges?:Array<{extractedMp3?:{path:string;bytes:number;sha256:string}}>}>;
    separateSa:{copy:{path:string;bytes:number;sha256:string}}}){
  if(token==='canvas-renderer.js')return;
  const main=audit.streams.find(stream=>stream.domain==='sprite-227');
  const expected=token==='optional-spanish-audio-v1'?audit.separateSa.copy:
    token==='main-1'?main?.contiguousRanges?.[0]?.extractedMp3:
    token==='main-2'?main?.contiguousRanges?.[1]?.extractedMp3:
    audit.streams.find(stream=>stream.domain===token)?.extractedMp3;
  demand(expected&&expected.path===row.path&&expected.bytes===row.bytes&&
    expected.sha256===row.sha256,`source audio asset ${token}`);
}

/** Revalidate the unregistered P014 candidate, admitted predecessor and exact
 * physical bytes for each local request. Formal membership additionally requires
 * the current exact P014 proof; it cannot fall back to a candidate on failure. */
export async function readP014Resource(token:P014Resource):Promise<Buffer>{
  demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
    process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT&&
    ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
  demand(Object.hasOwn(P014_RESOURCE_PINS,token),'unknown resource');
  const registered=Boolean(localOnlyAnimationModuleRegistration(OWN));
  const row=P014_RESOURCE_PINS[token],candidate=registered
    ?algL6P014FormalDescriptor():algL6P014CandidateDescriptor();
  demand(candidate.productBridge.registeredAnimationCount===25&&
    candidate.pages.length===60&&candidate.pages[13].animationId===OWN,
    'exact P014 local projection');
  const id=resourceAnimationId(token);
  if(id!==OWN){
    const matches=candidate.pages.filter(page=>page.animationId===id);
    demand(matches.length===1&&matches[0].rendererAvailability.kind==='registered'&&
      matches[0].rendererAvailability.moduleKey===id&&
      candidate.productBridge.selectedAnimationIds.includes(id),
      'formal registered predecessor placement');
  }
  const root=getWorkspaceRoot();
  if(id===OWN){
    checkOwnAudio(token,row,readJsonPin(root,AUDIO));
  }else if(row.contentType.startsWith('text/javascript')){
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
