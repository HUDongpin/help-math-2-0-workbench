#!/usr/bin/env node
// Retain the first candidate and bind the source-modal focus return repair.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p008-generator-v1.mjs';
export {ROOT,encode,pin,readBound};
export const ID='shared-nms002-l01-p008',CALIBRATION='g678-nms-l01-p008-current-js-v2';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
const PREVIOUS={path:'catalog/product-bridge-calibrations/g678-nms-l01-p008-current-js-v1.json',bytes:45590,sha256:'291e5751c5f7e636b54e3fac9bcb88ff9ced9345df2b130d3d3a78ac27663624'};
const COMPONENT='apps/web/components/nms-l01-p008-source-runtime-v1.tsx';
const BACKUP='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p008-runtime-before-hotspot-focus-v1.tsx';
export async function build({check=false}={}){
  const old=JSON.parse((await readBound(PREVIOUS.path,PREVIOUS)).bytes);
  assert.equal(old.calibrationId,'g678-nms-l01-p008-current-js-v1');assert.equal(old.entry.key,ID);
  const inputs=[];
  for(const b of old.inputs){
    if(b.path===COMPONENT){
      const archived={...b,path:BACKUP};const previous=await readBound(BACKUP,archived),current=await readBound(COMPONENT);
      const patchBinding={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p008-hotspot-focus-edits-v1.json", "bytes": 1584, "sha256": "3c899bbb5198d2002d1c0f9c5b119a11d4f9fd873cb0c00961fa56e5c693c6f0"};
      const edits=JSON.parse((await readBound(patchBinding.path,patchBinding)).bytes);let expected=previous.bytes.toString();
      for(const[from,to]of edits){assert.equal(expected.split(from).length,2);expected=expected.replace(from,to);}
      assert.equal(current.bytes.toString(),expected);inputs.push(patchBinding);
      inputs.push(archived,current.binding);
    }else{await readBound(b.path,b);inputs.push(b);}
  }
  for(const b of old.outputs)await readBound(b.path,b);
  inputs.push(PREVIOUS,(await readBound('scripts/build-g678-nms-l01-p008-v2.mjs')).binding);
  const packet={...old,calibrationId:CALIBRATION,inputs,predecessor:PREVIOUS,
    repair:{kind:'restore-source-hotspot-focus-after-glossary-close',component:COMPONENT,archivedPreviousComponent:BACKUP,
      explanation:'Keep the clicked source hotspot as the focus return target and center the source glossary dialog; stop observer on Replay and unmount. Original source/audio and generated drawing artifacts remain unchanged',
      changedRegisteredDrawingArtifacts:0}};
  const bytes=encode(packet),freeze=pin(FREEZE,bytes);
  const fragment={schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[packet.entry]}};
  const files=[[FREEZE,bytes],[FRAGMENT,encode(fragment)],[`${RUN}/run-manifest.json`,encode({schemaVersion:1,animationId:ID,predecessor:PREVIOUS,freeze,inputs,outputs:packet.outputs,repair:packet.repair,registrationChanged:false})]];
  for(const [file,content]of files){
    const full=path.join(ROOT,file),existing=await readFile(full).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if(check||existing)assert(existing&&existing.equals(Buffer.from(content)),`repaired candidate drift: ${file}`);
    if(!check&&!existing){await mkdir(path.dirname(full),{recursive:true});await writeFile(full,content,{flag:'wx'});}
  }
  return {check,freeze,drawingArtifactsChanged:0,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(encode(await build({check:process.argv[2]==='--check'})));
}
