#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import * as predecessor from './build-g678-nms-l01-p003.mjs';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-followup-generator-v1.mjs';
import {correctNmsL1P003PositionLabel} from './lib/g678-nms-l01-p003-position-label-v1.mjs';
export {ROOT,encode,pin,readBound};
export const ID=predecessor.ID,CALIBRATION='g678-nms-l01-p003-source-candidate-v2';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
const CORRECTION={path:'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p003-position-label-correction-v1.json',bytes:5282,sha256:'5c0f3ea1c1553cf3a6512fc4decd6a7d9c632ed0c68f063f4a21599d14327d02'};
export async function build({check=false}={}){
  await predecessor.build({check:true});
  const oldFile=await readBound(predecessor.FREEZE),old=JSON.parse(oldFile.bytes),correction=JSON.parse((await readBound(CORRECTION.path,CORRECTION)).bytes);
  const runtimeOld=(await readBound(old.entry.artifacts.runtime.path,old.entry.artifacts.runtime)).bytes.toString(),runtime=correctNmsL1P003PositionLabel(runtimeOld,correction);new Script(runtime);
  const runtimePath=`${RUN}/members/${ID}/canvas-renderer.js`,runtimePin=pin(runtimePath,runtime);
  const timelinePath=`packages/demos/src/timelines/${ID}-v2.ts`,modulePath='packages/demos/src/modules/g678-nms-l01-p003-v2.tsx';
  let timeline=(await readBound(old.entry.artifacts.timeline.path,old.entry.artifacts.timeline)).bytes.toString();
  assert.equal(timeline.split(old.entry.artifacts.runtime.sha256).length,2);timeline=timeline.replace(old.entry.artifacts.runtime.sha256,runtimePin.sha256);
  let module=(await readBound(old.entry.artifacts.module.path,old.entry.artifacts.module)).bytes.toString();
  const from=`'../timelines/${ID}'`;assert.equal(module.split(from).length,2);module=module.replace(from,`'../timelines/${ID}-v2'`);
  assert.equal(module.split('nestedSprites:Object.freeze').length,2);
  module=module.replace('nestedSprites:Object.freeze',"positionMarkerLabel:eligible&&frame>=533&&frame<=782?'+15':null,nestedSprites:Object.freeze");
  const header='// Derived by build-g678-nms-l01-p003-v2.mjs: source position label +5 is corrected to +15 using source font14 glyphs.\n';module=header+module;timeline=header+timeline;
  const entry={...old.entry,module:'./modules/g678-nms-l01-p003-v2',artifacts:{module:pin(modulePath,module),timeline:pin(timelinePath,timeline),runtime:runtimePin}};
  const outputs=new Map([[runtimePath,runtime],[timelinePath,timeline],[modulePath,module]]);
  const inputs=new Map([...old.inputs,...old.outputs,oldFile.binding,CORRECTION].map(p=>[p.path,p]));
  for(const p of [correction.sourceXml,correction.authoredExpressionAudit,...correction.rawTexts]){await readBound(p.path,p);inputs.set(p.path,p);}
  for(const file of ['scripts/build-g678-nms-l01-p003-v2.mjs','scripts/lib/g678-nms-l01-p003-position-label-v1.mjs'])inputs.set(file,(await readBound(file)).binding);
  const manifest={...old,calibrationId:CALIBRATION,sourceCandidatePredecessor:oldFile.binding,sourceCorrections:[CORRECTION],
    selectedPages:old.selectedPages.map(p=>({...p,runtime:{...p.runtime,canvasRenderer:{...p.runtime.canvasRenderer,...runtimePin}},modernSourceCorrection:'Source position +5 replaced by +15, consistent with source marker location and20 – 5 = 15.'})),
    inputs:[...inputs.values()],outputs:[...outputs].map(([file,bytes])=>pin(file,bytes)),entry};
  const frozen=encode(manifest),freeze=pin(FREEZE,frozen);outputs.set(FREEZE,frozen);
  outputs.set(FRAGMENT,encode({schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[entry]}}));
  outputs.set(`${RUN}/run-manifest.json`,encode({schemaVersion:1,animationId:ID,source:manifest.source,sourceCorrections:[CORRECTION],inputs:manifest.inputs,outputs:manifest.outputs,freeze,registrationChanged:false,scaleOutAuthorized:false}));
  for(const [file,bytes]of outputs){const p=path.join(ROOT,file),prior=await readFile(p).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(check||prior)assert(prior&&prior.equals(Buffer.from(bytes)),`corrected source output drift: ${file}`);if(!check&&!prior){await mkdir(path.dirname(p),{recursive:true});await writeFile(p,bytes,{flag:'wx'});}}
  return {check,freeze,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(encode(await build({check:process.argv[2]==='--check'})));}
