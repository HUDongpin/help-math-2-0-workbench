#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p019-generator-v2.mjs';
import {build as buildSource} from './build-g678-nms-l01-p019-v2.mjs';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';
export const ID='shared-nms002-l01-p019',CALIBRATION='g678-nms-l01-p019-current-js-v3';
const PREVIOUS={"path": "catalog/product-bridge-calibrations/g678-nms-l01-p019-current-js-v2.json", "bytes": 58309, "sha256": "2a7d806dae0fbb13e72d5ff1657955707c4e2a943b13b1422989506fe240b431"},BEFORE={"path": "packages/demos/src/timelines/shared-nms002-l01-p019.ts", "bytes": 5843, "sha256": "be20f9a307b2f5d87e14272241c2b5de0ad35cf952250174b198cefbcc96c11b"};
const RUN=`work/g678-shared-page-factory/${CALIBRATION}`,FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
const RECOVERY=RUN+'-canonical-timeline',ARCHIVE=RECOVERY+'/before-'+path.basename(BEFORE.path),RECEIPT=RUN+'/canonical-timeline-activation.json';
export async function build({check=false}={}){
 await buildSource({check:true});const old=JSON.parse((await readBound(PREVIOUS.path,PREVIOUS)).bytes);assert.equal(old.entry.key,ID);assert.equal(old.calibrationId,'g678-nms-l01-p019-current-js-v2');
 const versioned=await readBound(old.entry.artifacts.timeline.path,old.entry.artifacts.timeline),target=await readBound(BEFORE.path),nextPin=pin(BEFORE.path,versioned.bytes);
 if(!target.bytes.equals(versioned.bytes)){
  assert(!check,'canonical generated timeline pending');assert.deepEqual(target.binding,BEFORE);
  const registry=await readBound('packages/demos/private-current-js-registry.json');assert.equal(registry.binding.sha256,'76ea3b88de9b6a976c8780493e77a685fa146e3ee3e6e6f7c869a8735a160e9e');
  assert(!JSON.parse(registry.bytes).calibrations.some(c=>c.entries.some(e=>e.key===ID)),'unregistered page only');
  const verify=async()=>{await buildSource({check:true});await readBound(PREVIOUS.path,PREVIOUS);await readBound(registry.binding.path,registry.binding);};
  const transaction=await guardedReplacement({root:ROOT,before:new Map([[BEFORE.path,target.bytes]]),after:new Map([[BEFORE.path,versioned.bytes]]),targets:[BEFORE.path],recovery:RECOVERY,verify,postflight:async()=>{await readBound(BEFORE.path,nextPin);}});
  await mkdir(path.join(ROOT,RUN),{recursive:true});await writeFile(path.join(ROOT,RECEIPT),encode({schemaVersion:1,before:BEFORE,after:nextPin,source:versioned.binding,transaction,registryChanged:false}),{flag:'wx'});
 }
 const archived=await readBound(ARCHIVE,{...BEFORE,path:ARCHIVE});const receipt=JSON.parse((await readBound(RECEIPT)).bytes);assert.deepEqual(receipt.before,BEFORE);assert.deepEqual(receipt.after,nextPin);await readBound(BEFORE.path,nextPin);
 const inputs=[...old.inputs,PREVIOUS,archived.binding,(await readBound(RECEIPT)).binding,(await readBound('scripts/build-g678-nms-l01-p019-v3.mjs')).binding];
 const entry={...old.entry,artifacts:{...old.entry.artifacts,timeline:nextPin}},outputs=[...old.outputs,nextPin];
 const packet={...old,calibrationId:CALIBRATION,entry,inputs,outputs,predecessor:PREVIOUS,canonicalTimeline:{path:BEFORE.path,versionedInput:versioned.binding,bytesIdentical:true,archivedPrevious:archived.binding,reason:'Generate canonical registry timeline from exact verified version2 bytes; retain version2 module import and its separately pinned timeline output.',drawingChanged:false}};
 const bytes=encode(packet),freeze=pin(FREEZE,bytes),fragment={schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[entry]}};
 for(const[file,content]of[[FREEZE,bytes],[FRAGMENT,encode(fragment)],[RUN+'/run-manifest.json',encode({schemaVersion:1,animationId:ID,predecessor:PREVIOUS,freeze,inputs,outputs,canonicalTimeline:packet.canonicalTimeline,registrationChanged:false})]]){
  const full=path.join(ROOT,file),existing=await readFile(full).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(check||existing)assert(existing&&existing.equals(Buffer.from(content)),`canonical candidate drift: ${file}`);if(!check&&!existing){await mkdir(path.dirname(full),{recursive:true});await writeFile(full,content,{flag:'wx'});}
 }
 return {check,freeze,drawingArtifactsChanged:0,canonicalTimelineGenerated:true,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(encode(await build({check:process.argv[2]==='--check'})));}
