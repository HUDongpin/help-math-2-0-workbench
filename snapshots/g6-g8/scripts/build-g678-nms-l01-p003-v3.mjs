#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-followup-generator-v1.mjs';
export {ROOT,encode,pin,readBound};
export const ID='shared-nms002-l01-p003',CALIBRATION='g678-nms-l01-p003-source-candidate-v3';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
const PREDECESSOR={path:'catalog/product-bridge-calibrations/g678-nms-l01-p003-source-candidate-v2.json',bytes:38669,sha256:'999c1b607276bb516ff5a4a5cfcb74962b197c726a03f4c59d59ed0fb9d40177'};
const CANONICAL=`packages/demos/src/timelines/${ID}.ts`;
const ARCHIVE='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p003-original-canonical-timeline-before-correction.ts';
export async function build({check=false}={}){
  // The rejected unregistered V2 used a versioned timeline filename. Reuse its
  // verified bytes and retain the original canonical file before adoption.
  const previous=JSON.parse((await readBound(PREDECESSOR.path,PREDECESSOR)).bytes);
  const original=previous.inputs.find(b=>b.path===CANONICAL);assert(original);
  let archived=await readFile(ARCHIVE).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  if(!archived){assert(!check,'canonical predecessor archive required');archived=(await readBound(CANONICAL,original)).bytes;await writeFile(ARCHIVE,archived,{flag:'wx'});}
  const archivePin={...original,path:ARCHIVE};await readBound(ARCHIVE,archivePin);
  const inputs=new Map([[PREDECESSOR.path,PREDECESSOR],[ARCHIVE,archivePin]]);
  for(const b of [...previous.inputs,...previous.outputs]){
    const current=b.path===CANONICAL?archivePin:b;await readBound(current.path,current);const old=inputs.get(current.path);if(old)assert.deepEqual(old,current);inputs.set(current.path,current);
  }
  const timeline=(await readBound(previous.entry.artifacts.timeline.path,previous.entry.artifacts.timeline)).bytes;
  let module=(await readBound(previous.entry.artifacts.module.path,previous.entry.artifacts.module)).bytes.toString();
  const oldImport=`'../timelines/${ID}-v2'`;assert.equal(module.split(oldImport).length,2);module=module.replace(oldImport,`'../timelines/${ID}'`);
  module='// Canonical timeline adoption by build-g678-nms-l01-p003-v3.mjs.\n'+module;
  const modulePath='packages/demos/src/modules/g678-nms-l01-p003-v3.tsx';
  const entry={...previous.entry,module:'./modules/g678-nms-l01-p003-v3',artifacts:{module:pin(modulePath,module),timeline:pin(CANONICAL,timeline),runtime:previous.entry.artifacts.runtime}};
  const artifacts=new Map([[CANONICAL,timeline],[modulePath,Buffer.from(module)]]);
  inputs.set('scripts/build-g678-nms-l01-p003-v3.mjs',(await readBound('scripts/build-g678-nms-l01-p003-v3.mjs')).binding);
  const manifest={...previous,calibrationId:CALIBRATION,sourceCandidatePredecessor:PREDECESSOR,
    canonicalTimelineAdoption:{sourcePath:CANONICAL,originalBinding:original,preservedOriginal:archivePin,correctedSource:previous.entry.artifacts.timeline,canonicalResult:entry.artifacts.timeline},
    inputs:[...inputs.values()],outputs:[entry.artifacts.runtime,...[...artifacts].map(([file,bytes])=>pin(file,bytes))],entry};
  const frozen=encode(manifest),freeze=pin(FREEZE,frozen);
  const generated=new Map([[FREEZE,Buffer.from(frozen)],[FRAGMENT,Buffer.from(encode({schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[entry]}}))],[`${RUN}/run-manifest.json`,Buffer.from(encode({schemaVersion:1,canonicalTimelineAdoption:manifest.canonicalTimelineAdoption,inputs:manifest.inputs,outputs:manifest.outputs,freeze,registrationChanged:false,scaleOutAuthorized:false}))]]);
  for(const [file,bytes]of [...artifacts,...generated]){
    const old=await readFile(path.join(ROOT,file)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if(check){assert(old&&old.equals(bytes),`canonical source artifact drift: ${file}`);continue;}
    if(old&&!old.equals(bytes)){assert.equal(file,CANONICAL,'only the declared canonical timeline can be replaced');assert(old.equals(archived),'unexpected canonical timeline changes');}
  }
  if(!check){
    for(const [file,bytes]of [...artifacts,...generated]){
      const full=path.join(ROOT,file),old=await readFile(full).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(old?.equals(bytes))continue;
      await mkdir(path.dirname(full),{recursive:true});
      if(file===CANONICAL&&old){await readBound(CANONICAL,original);const temp=full+'.nms-source-correction-v3.tmp';await writeFile(temp,bytes,{flag:'wx'});await readBound(CANONICAL,original);await rename(temp,full);}
      else await writeFile(full,bytes,{flag:'wx'});
    }
  }
  for(const b of manifest.outputs)await readBound(b.path,b);
  return {check,freeze,canonicalTimeline:entry.artifacts.timeline,preservedOriginal:archivePin,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(encode(await build({check:process.argv[2]==='--check'})));}
