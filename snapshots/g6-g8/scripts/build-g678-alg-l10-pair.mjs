#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,encode,pin,readBound} from './lib/g678-terminal-source-generator-v6.mjs';
import * as first from './build-g678-alg-l10-p005.mjs';
import * as second from './build-g678-alg-l10-p006.mjs';
import {buildMultiPagePlayer,MANIFEST as HOST_MANIFEST,OUTPUT as HOST} from './build-g678-multi-page-lesson-player-v1.mjs';
export {ROOT,encode,pin,readBound};
export const IDS=Object.freeze([first.ID,second.ID]);
export const CALIBRATION='g678-alg-l10-p005-p006-current-js-v1';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
export const RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export async function build({check=false}={}) {
 await buildMultiPagePlayer({check:true});await first.build({check:true});await second.build({check:true});
 const packets=[],inputs=new Map();
 for(const builder of [first,second]){
  const source=await readBound(builder.FREEZE),packet=JSON.parse(source.bytes);inputs.set(builder.FREEZE,source.binding);
  assert.equal(packet.selectedPages.length,1);assert.equal(packet.selectedPages[0].animationId,builder.ID);
  for(const p of [...packet.inputs,...packet.outputs]){await readBound(p.path,p);const existing=inputs.get(p.path);if(existing)assert.deepEqual(existing,p);inputs.set(p.path,p);}
  packets.push({...packet,sourceFreeze:source.binding});
 }
 assert.deepEqual(packets[0].sourceXml,packets[1].sourceXml);assert.deepEqual(packets[0].sourceCatalog,packets[1].sourceCatalog);
 for(const file of ['scripts/build-g678-alg-l10-pair.mjs',HOST,HOST_MANIFEST,'apps/web/lib/g678-private-runtime-adapters-v1.ts',
  'apps/web/components/g678-alg-l10-pair-lesson.tsx','apps/web/components/g678-terminal-source-runtime-v1.tsx','apps/web/components/g678-source-reading-v1.tsx'])inputs.set(file,(await readBound(file)).binding);
 const selectedPages=packets.flatMap(p=>p.selectedPages),entries=packets.map(p=>p.entry);
 assert.deepEqual(selectedPages.map(p=>p.animationId),IDS);assert.deepEqual(selectedPages.map(p=>p.globalPageOrdinal),[5,6]);
 const outputs=[...new Map(packets.flatMap(p=>p.outputs).map(p=>[p.path,p])).values()];
 const manifest={schemaVersion:1,calibrationId:CALIBRATION,deploymentScope:'local-only',selectedPages,entries,
  sourceCatalog:packets[0].sourceCatalog,sourceXml:packets[0].sourceXml,members:packets.map(p=>({animationId:p.entry.key,source:p.source,sourceSpec:p.sourceSpec,sourceFreeze:p.sourceFreeze,audioPlan:p.audioPlan,entry:p.entry})),
  inputs:[...inputs.values()],outputs,productHost:{module:HOST,runtimeAdapters:IDS},productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects:packets[0].acceptanceEffects};
 const freezeBytes=encode(manifest),freezePin=pin(FREEZE,freezeBytes);
 const fragment={schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,entries}};
 for(const [file,bytes] of [[FREEZE,freezeBytes],[FRAGMENT,encode(fragment)],[`${RUN}/run-manifest.json`,encode({schemaVersion:1,sourceMembers:manifest.members,inputs:manifest.inputs,outputs:manifest.outputs,freeze:freezePin,registrationChanged:false,scaleOutAuthorized:false})]]){
  const full=path.join(ROOT,file),existing=await readFile(full).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  if(check||existing)assert(existing&&existing.equals(Buffer.from(bytes)),`pair artifact drift: ${file}`);
  if(!check&&!existing){await mkdir(path.dirname(full),{recursive:true});await writeFile(full,bytes,{flag:'wx'});}
 }
 return {check,freeze:freezePin,entries:IDS,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(encode(await build({check:process.argv[2]==='--check'})));}
