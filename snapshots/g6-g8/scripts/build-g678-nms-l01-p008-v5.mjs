#!/usr/bin/env node
import assert from 'node:assert/strict';import {mkdir,readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p008-generator-v1.mjs';
export {ROOT,encode,pin,readBound};
export const ID='shared-nms002-l01-p008',CALIBRATION='g678-nms-l01-p008-current-js-v5';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
const CANDIDATE={path:'catalog/product-bridge-calibrations/g678-nms-l01-p008-current-js-v4.json',bytes:52765,sha256:'872588de308eaf52d7d201acdec5b38197a0450c80ba9046630ea3435cd1859f'};
export async function build({check=false}={}){
 const candidate=JSON.parse((await readBound(CANDIDATE.path,CANDIDATE)).bytes);assert.equal(candidate.calibrationId,'g678-nms-l01-p008-current-js-v4');
 const previous=JSON.parse((await readBound(candidate.predecessor.path,candidate.predecessor)).bytes);assert.equal(previous.calibrationId,'g678-nms-l01-p008-current-js-v3');
 const inputs=[CANDIDATE,...candidate.inputs,...candidate.outputs];for(const b of inputs)await readBound(b.path,b);
 const sourceTimeline=previous.entry.artifacts.timeline;await readBound(sourceTimeline.path,sourceTimeline);assert.equal(sourceTimeline.path,`packages/demos/src/timelines/${ID}.ts`);
 // The canonical source drawing timeline is unchanged. The generated finite host
 // plan is a separate, fully hash-bound adapter dependency imported by the new module.
 const entry={...candidate.entry,artifacts:{...candidate.entry.artifacts,timeline:sourceTimeline}};
 const outputs=Object.values(entry.artifacts);inputs.push((await readBound('scripts/build-g678-nms-l01-p008-v5.mjs')).binding);
 const packet={...candidate,calibrationId:CALIBRATION,inputs,outputs,entry,unadmittedPredecessorCandidate:CANDIDATE,
  hostClockPlanHelper:candidate.entry.artifacts.timeline,canonicalSourceTimeline:sourceTimeline,
  registrationBindingDisposition:'Retain the exact canonical page drawing timeline. The separately generated host-terminal plan is an additional bound module dependency; no registry contract is weakened.',
  repair:{...candidate.repair,changedCanonicalSourceTimeline:false,changedRegisteredModuleAndTimeline:false,changedRegisteredModule:true}};
 const bytes=encode(packet),freeze=pin(FREEZE,bytes),fragment={schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[entry]}};
 const files=[[FREEZE,bytes],[FRAGMENT,encode(fragment)],[`${RUN}/run-manifest.json`,encode({schemaVersion:1,animationId:ID,sourceCandidate:CANDIDATE,freeze,inputs,outputs,registrationChanged:false})]];
 for(const[file,content]of files){const full=path.join(ROOT,file),existing=await readFile(full).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(check||existing)assert(existing&&existing.equals(Buffer.from(content)),`host-terminal binding drift: ${file}`);if(!check&&!existing){await mkdir(path.dirname(full),{recursive:true});await writeFile(full,content,{flag:'wx'});}}
 return{check,freeze,canonicalDrawingAndTimelineChanged:false,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(encode(await build({check:process.argv.includes('--check')})));}
