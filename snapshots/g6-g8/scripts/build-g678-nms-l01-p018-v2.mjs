#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p018-generator-v1.mjs';
export {ROOT,encode,pin,readBound};
export const ID='shared-nms002-l01-p018',CALIBRATION='g678-nms-l01-p018-current-js-v2';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
const PREVIOUS={"path": "catalog/product-bridge-calibrations/g678-nms-l01-p018-current-js-v1.json", "bytes": 97579, "sha256": "f5126681055c47b53601ebb84517d03a8763aa63e209fc6192ca8bc4f813393a"}, COMPONENT="apps/web/components/nms-l01-p018-source-runtime-v1.tsx", BACKUP="/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p018-before-runtime-fix-v2/apps/web/components/nms-l01-p018-source-runtime-v1.tsx", PATCH={"path": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p018-before-runtime-fix-v2/reviewed-edits.json", "bytes": 364, "sha256": "f8918acd85c517c743c8237d1bebe9bd18cf7e375ce42d03da584644dff7ed54"};
export async function build({check=false}={}){
 const old=JSON.parse((await readBound(PREVIOUS.path,PREVIOUS)).bytes);assert.equal(old.calibrationId,'g678-nms-l01-p018-current-js-v1');assert.equal(old.entry.key,ID);let changed=0;const inputs=[];
 for(const b of old.inputs){if(b.path===COMPONENT){changed++;const archived={...b,path:BACKUP},previous=await readBound(BACKUP,archived),current=await readBound(COMPONENT);const edits=JSON.parse((await readBound(PATCH.path,PATCH)).bytes);let expected=previous.bytes.toString();for(const[from,to]of edits){assert.equal(expected.split(from).length,2);expected=expected.replace(from,to);}assert.equal(current.bytes.toString(),expected);inputs.push(PATCH,archived,current.binding);}else{await readBound(b.path,b);inputs.push(b);}}
 assert.equal(changed,1);for(const b of old.outputs)await readBound(b.path,b);inputs.push(PREVIOUS,(await readBound('scripts/build-g678-nms-l01-p018-v2.mjs')).binding);
 const packet={...old,calibrationId:CALIBRATION,inputs,predecessor:PREVIOUS,repair:{kind:'source-hotspot-focus-and-explicit-inspection',component:COMPONENT,archivedPreviousComponent:BACKUP,explanation:'Keep source glossary buttons mounted and disabled while the dialog is open, so focus returns to the same source button. Explicit frame inspection bypasses reduced-motion animation holds. Source drawing, audio payloads, clock and all other pages stay byte-identical.',changedRegisteredDrawingArtifacts:0}};
 const bytes=encode(packet),freeze=pin(FREEZE,bytes),fragment={schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[packet.entry]}};
 for(const[file,content]of[[FREEZE,bytes],[FRAGMENT,encode(fragment)],[`${RUN}/run-manifest.json`,encode({schemaVersion:1,animationId:ID,predecessor:PREVIOUS,freeze,inputs,outputs:packet.outputs,repair:packet.repair,registrationChanged:false})]]){const full=path.join(ROOT,file),existing=await readFile(full).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(check||existing)assert(existing&&existing.equals(Buffer.from(content)),`repaired candidate drift:${file}`);if(!check&&!existing){await mkdir(path.dirname(full),{recursive:true});await writeFile(full,content,{flag:'wx'});}}
 return{check,freeze,drawingArtifactsChanged:0,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');console.log(encode(await build({check:process.argv[2]==='--check'})));}
