#!/usr/bin/env node
// Retain the first candidate and adopt one reviewed TypeScript narrowing repair.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p005-generator-v1.mjs';
export {ROOT,encode,pin,readBound};
export const ID='shared-nms002-l01-p005',CALIBRATION='g678-nms-l01-p005-current-js-v2';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
const PREVIOUS={path:'catalog/product-bridge-calibrations/g678-nms-l01-p005-current-js-v1.json',bytes:28982,sha256:'2dc6391309ebb564695a1af6f56336d3b89f0201edc2e89fa63dec1f084d68d8'};
const COMPONENT='apps/web/components/nms-l01-p005-source-runtime-v1.tsx';
const BACKUP='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p005-runtime-before-type-fix.tsx';
export async function build({check=false}={}){
  const old=JSON.parse((await readBound(PREVIOUS.path,PREVIOUS)).bytes);
  assert.equal(old.calibrationId,'g678-nms-l01-p005-current-js-v1');assert.equal(old.entry.key,ID);
  const inputs=[];
  for(const b of old.inputs){
    if(b.path===COMPONENT){
      const archived={...b,path:BACKUP};const previous=await readBound(BACKUP,archived),current=await readBound(COMPONENT);
      const from="clock=attachment.clockKind==='continuous'?new ContinuousSourceStreamClockCandidate(attachment.PLAN,{commitHeldFrame:paint}):new SourceStreamRunsClockV1(attachment.PLAN,{commitHeldFrame:paint});clockRef.current=clock;";
      const to='clock=new ContinuousSourceStreamClockCandidate(attachment.PLAN,{commitHeldFrame:paint});clockRef.current=clock;';
      const source=previous.bytes.toString();assert.equal(source.split(from).length,2);assert.equal(current.bytes.toString(),source.replace(from,to));
      inputs.push(archived,current.binding);
    }else{await readBound(b.path,b);inputs.push(b);}
  }
  for(const b of old.outputs)await readBound(b.path,b);
  inputs.push(PREVIOUS,(await readBound('scripts/build-g678-nms-l01-p005-v2.mjs')).binding);
  const packet={...old,calibrationId:CALIBRATION,inputs,predecessor:PREVIOUS,
    repair:{kind:'remove-unreachable-audio-constructor-branch',component:COMPONENT,archivedPreviousComponent:BACKUP,
      explanation:'The exact-page guard admits only continuous audio. Remove the unreachable runs constructor so TypeScript narrowing remains valid. The source MP3, Canvas asset, generated module, canonical timeline and child-phase state are byte-identical.',
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
