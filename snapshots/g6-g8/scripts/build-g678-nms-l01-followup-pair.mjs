#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-followup-generator-v1.mjs';
import * as first from './build-g678-nms-l01-p003-v2.mjs';
import * as second from './build-g678-nms-l01-p004.mjs';
import {build as buildP002} from './build-g678-nms-l01-p002.mjs';
import {buildMultiPagePlayer,MANIFEST as HOST_MANIFEST,OUTPUT as HOST} from './build-g678-multi-page-lesson-player-v3.mjs';
export {ROOT,encode,pin,readBound};
export const IDS=Object.freeze([first.ID,second.ID]),STORY_IDS=Object.freeze(['shared-nms002-l01-p002',...IDS]);
export const CALIBRATION='g678-nms-l01-p003-p004-current-js-v1',FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const BASE_FREEZE={path:'catalog/product-bridge-calibrations/g678-nms-l01-p002-current-js-v1.json',bytes:26041,sha256:'be9ec599948011cb8d6f2073cd687db8ce87fe5d553ddce132b67301cac67cf9'};
export async function build({check=false}={}){
 await buildMultiPagePlayer({check:true});await buildP002({check:true});await first.build({check:true});await second.build({check:true});
 const base=JSON.parse((await readBound(BASE_FREEZE.path,BASE_FREEZE)).bytes),packets=[],inputs=new Map([[BASE_FREEZE.path,BASE_FREEZE]]);
 for(const b of [...base.inputs,...base.outputs]){await readBound(b.path,b);inputs.set(b.path,b);}
 for(const builder of [first,second]){
  const file=await readBound(builder.FREEZE),packet=JSON.parse(file.bytes);inputs.set(builder.FREEZE,file.binding);
  assert.equal(packet.selectedPages.length,1);assert.equal(packet.selectedPages[0].animationId,builder.ID);
  for(const b of [...packet.inputs,...packet.outputs]){await readBound(b.path,b);const old=inputs.get(b.path);if(old)assert.deepEqual(old,b);inputs.set(b.path,b);}
  packets.push({...packet,sourceFreeze:file.binding});
 }
 assert.deepEqual(packets[0].sourceXml,packets[1].sourceXml);assert.deepEqual(base.sourceXml,packets[0].sourceXml);assert.deepEqual(packets[0].sourceCatalog,packets[1].sourceCatalog);
 for(const file of ['scripts/build-g678-nms-l01-followup-pair.mjs',HOST,HOST_MANIFEST,'apps/web/lib/g678-private-runtime-adapters-v1.ts','apps/web/lib/g678-preview-entry-v1.ts',
  'apps/web/components/g678-nms-l01-story-lesson.tsx','apps/web/lib/g678-nms-l01-p002.server.ts','apps/web/components/private-audio-glossary-portal.tsx','apps/web/lib/descriptor-driven-glossary-pause.ts'])inputs.set(file,(await readBound(file)).binding);
 const selectedPages=packets.flatMap(p=>p.selectedPages),entries=packets.map(p=>p.entry);assert.deepEqual(selectedPages.map(p=>p.animationId),IDS);assert.deepEqual(selectedPages.map(p=>p.globalPageOrdinal),[3,4]);
 const outputs=[...new Map(packets.flatMap(p=>p.outputs).map(b=>[b.path,b])).values()];
 const manifest={schemaVersion:1,calibrationId:CALIBRATION,deploymentScope:'local-only',selectedPages,entries,baseProductCandidate:BASE_FREEZE,baseEntry:base.entry,
  sourceCatalog:packets[0].sourceCatalog,sourceXml:packets[0].sourceXml,members:packets.map(p=>({animationId:p.entry.key,source:p.source,sourceSpec:p.sourceSpec,sourceFreeze:p.sourceFreeze,audioPlan:p.audioPlan,sourceGlossary:p.sourceGlossary,sourceCorrections:p.sourceCorrections??[],entry:p.entry})),
  inputs:[...inputs.values()],outputs,productHost:{module:HOST,runtimeAdapters:STORY_IDS,newlyRegisteredAdapters:IDS},productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects:packets[0].acceptanceEffects};
 const freezeBytes=encode(manifest),freeze=pin(FREEZE,freezeBytes),fragment={schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries}};
 for(const [file,bytes]of [[FREEZE,freezeBytes],[FRAGMENT,encode(fragment)],[`${RUN}/run-manifest.json`,encode({schemaVersion:1,baseProductCandidate:BASE_FREEZE,sourceMembers:manifest.members,inputs:manifest.inputs,outputs:manifest.outputs,freeze,registrationChanged:false,scaleOutAuthorized:false})]]){
  const full=path.join(ROOT,file),old=await readFile(full).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(check||old)assert(old&&old.equals(Buffer.from(bytes)),`source story artifact drift: ${file}`);if(!check&&!old){await mkdir(path.dirname(full),{recursive:true});await writeFile(full,bytes,{flag:'wx'});}
 }
 return {check,freeze,entries:IDS,preservedStoryMember:STORY_IDS[0],registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(encode(await build({check:process.argv[2]==='--check'})));}
