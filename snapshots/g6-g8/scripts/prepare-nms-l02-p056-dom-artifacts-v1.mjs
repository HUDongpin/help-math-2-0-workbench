#!/usr/bin/env node
/** Exact, unregistered P056 maintained-DOM run/member artifacts. The source
 * generators are checked, never rerun in write mode. No freeze or registry
 * transaction is made here. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const SCRIPT=fileURLToPath(import.meta.url);
const ROOT=path.resolve(path.dirname(SCRIPT),'..');
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID='shared-nms002-l02-p056';
const CALIBRATION='g678-nms-l02-p056-conditional-host-current-js-v1';
const RUN_ROOT=`work/g678-shared-page-factory/${CALIBRATION}`;
const RUN=`${RUN_ROOT}/run-manifest.json`;
const MEMBER=`${RUN_ROOT}/members/${ID}/member-manifest.json`;
const MODULE=`packages/demos/src/modules/${ID}.tsx`;
const TIMELINE=`packages/demos/src/timelines/${ID}.ts`;
const SOURCE=Object.freeze({path:'G6-G8-shared/NMS002/L2/TS/L2TS03.swf',bytes:100959,
 sha256:'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be'});
const XML=Object.freeze({path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'});
const SOURCE_INPUTS=Object.freeze([
 MODULE,TIMELINE,
 'packages/demos/src/nms-l02-p056-product-module-v1.tsx',
 'packages/demos/src/nms-l02-p056-product-renderer-v1.tsx',
 'packages/demos/src/nms-l02-p056-product-text-v1.ts',
 'packages/demos/src/nms-l02-p056-semantic-view-v1.tsx',
 'packages/demos/src/nms-l02-p056-semantic-view-v1.css',
 'packages/demos/src/nms-l02-p056-product-controls-v1.ts',
 'packages/demos/src/generated/nms-l02-p056-display-list-v1.ts',
 'packages/demos/src/generated/nms-l02-p056-symbol-art-v1.ts',
 'packages/demos/src/generated/nms-l02-p056-audio-blocks-v1.ts',
 'packages/demos/src/generated/nms-l02-p056-terms-v1.ts',
 'packages/demos/src/timelines/shared-nms002-l02-p056-source-behavior.ts',
 'packages/demos/src/timelines/shared-nms002-l02-p056-display-list.ts',
 'packages/demos/src/timelines/shared-nms002-l02-p056-svg.ts',
 'migrations/shared-nms002-l02-p056/audit/ffdec-26.2.1/scripts/DefineButton2_16/BUTTONCONDACTION on(release).as',
 'migrations/shared-nms002-l02-p056/audit/ffdec-26.2.1/scripts/DefineButton2_17/BUTTONCONDACTION on(release).as',
 'migrations/shared-nms002-l02-p056/audit/SOURCE_INTAKE_V1.md',
 'migrations/shared-nms002-l02-p056/audit/DISPLAY_LIST_SOURCE_V1.md',
 'migrations/shared-nms002-l02-p056/audit/BUTTON_REVEAL_SOURCE_V1.md',
 'migrations/shared-nms002-l02-p056/audit/STATIC_ART_SOURCE_V1.md',
 'migrations/shared-nms002-l02-p056/audit/embedded-source-stream-v1.mp3',
 'output/nms-l02-p056-source-intake-20260927/source-intake.json',
 'output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-l1-host-bank.json',
 'output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-glossary-receipt.json',
 'output/nms-l02-p056-product-20260927/native/product-source-receipt.json',
 'scripts/build-nms-l02-p056-display-list-v1.mjs',
 'scripts/build-nms-l02-p056-symbol-art-v1.mjs',
 'scripts/build-nms-l02-p056-audio-blocks-v1.mjs',
 'scripts/generate-nms-l02-p056-conditional-glossary-v1.mjs',
 'scripts/prepare-nms-l02-p056-product.mjs',
 'scripts/prepare-nms-l02-p056-dom-artifacts-v1.mjs',
 'scripts/prepare-nms-l02-p056-dom-artifacts-v1.test.mjs',
 'packages/demos/tests/nms-l02-p056-canonical-dom.test.ts',
]);
const GENERATED=Object.freeze([
 'packages/demos/src/generated/nms-l02-p056-display-list-v1.ts',
 'packages/demos/src/generated/nms-l02-p056-symbol-art-v1.ts',
 'packages/demos/src/generated/nms-l02-p056-audio-blocks-v1.ts',
 'packages/demos/src/generated/nms-l02-p056-terms-v1.ts',
 'packages/demos/src/nms-l02-p056-product-controls-v1.ts',
 'output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-l1-host-bank.json',
 'output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-glossary-receipt.json',
 'output/nms-l02-p056-product-20260927/native/product-source-receipt.json',
 MODULE,TIMELINE,
]);
const CHECKS=Object.freeze([
 ['scripts/build-nms-l02-p056-display-list-v1.mjs','packages/demos/src/generated/nms-l02-p056-display-list-v1.ts'],
 ['scripts/build-nms-l02-p056-symbol-art-v1.mjs','packages/demos/src/generated/nms-l02-p056-symbol-art-v1.ts'],
 ['scripts/build-nms-l02-p056-audio-blocks-v1.mjs','packages/demos/src/generated/nms-l02-p056-audio-blocks-v1.ts'],
 ['scripts/generate-nms-l02-p056-conditional-glossary-v1.mjs','packages/demos/src/generated/nms-l02-p056-terms-v1.ts'],
 ['scripts/prepare-nms-l02-p056-product.mjs','output/nms-l02-p056-product-20260927/native/product-source-receipt.json'],
]);
const SHA=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>Buffer.from(`${JSON.stringify(value,null,2)}\n`);
const pinBytes=(name,bytes)=>({path:name,bytes:bytes.length,sha256:SHA(bytes)});
function physicalPin(root,relative){
 assert(typeof relative==='string'&&!path.isAbsolute(relative)&&
  relative.split('/').every(part=>part&&part!=='.'&&part!=='..'),'bounded pin path');
 const file=path.join(root,relative);
 assert.equal(fs.realpathSync(file),file,`physical ${relative}`);
 const before=fs.lstatSync(file,{bigint:true});
 assert(before.isFile()&&before.nlink===1n&&before.size<=64n*1024n*1024n,`ordinary ${relative}`);
 const bytes=fs.readFileSync(file),after=fs.lstatSync(file,{bigint:true});
 assert(['dev','ino','mode','size','mtimeNs','ctimeNs','nlink'].every(key=>before[key]===after[key]),
  `stable ${relative}`);
 return pinBytes(relative,bytes);
}
const sortedUnique=pins=>{
 assert.equal(new Set(pins.map(pin=>pin.path)).size,pins.length,'unique inputs');
 return [...pins].sort((a,b)=>a.path.localeCompare(b.path));
};
function sourceBoundary(){
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,SOURCE_ROOT,'exact real source root');
 assert.equal(fs.realpathSync(SOURCE_ROOT),SOURCE_ROOT,'physical source root');
 assert(fs.lstatSync(SOURCE_ROOT).isDirectory(),'source directory');
 assert.deepStrictEqual(physicalPin(SOURCE_ROOT,SOURCE.path),SOURCE,'exact P056 SWF');
 assert.deepStrictEqual(physicalPin(SOURCE_ROOT,XML.path),XML,'exact lesson XML');
}
function checkedGenerators(root){
 return CHECKS.map(([producer,output])=>{
  const result=spawnSync(process.execPath,[path.join(root,producer),'--check'],{
   cwd:root,env:{...process.env,HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT},encoding:'utf8',timeout:120000,
   maxBuffer:1024*1024,
  });
  assert.equal(result.status,0,`${producer} --check: ${(result.stderr??result.error??'').toString().slice(0,1500)}`);
  return {producer:physicalPin(root,producer),output:physicalPin(root,output),mode:'--check',exitCode:0};
 });
}
function projectRegistryShape(root,artifacts){
 const registry=JSON.parse(fs.readFileSync(path.join(root,'packages/demos/private-current-js-registry.json'),'utf8'));
 const registrations=registry.calibrations.flatMap(c=>(c.entries??[])
  .filter(e=>e.key===ID).map(e=>({calibrationId:c.calibrationId,entry:e})));
 if(registrations.length){
  assert.equal(registrations.length,1,'one P056 registration');
  assert.equal(registrations[0].calibrationId,CALIBRATION,'exact P056 calibration');
  assert.deepStrictEqual(registrations[0].entry.artifacts,artifacts,'exact registered DOM artifacts');
  return true;
 }
 const entry={key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
  complexityLane:'behavior-heavy',artifacts};
 // This throwaway fragment is used only to invoke the real structural validator.
 // It is never serialized or installed as a freeze or registration.
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:`catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  freezeManifestBytes:1,freezeManifestSha256:'0'.repeat(64),entries:[entry]};
 const projected=upsertPrivateCurrentJsCalibration(registry,fragment);
 assert(projected.calibrations.some(row=>row.calibrationId===CALIBRATION),'DOM branch structural projection');
 return true;
}
export function buildP056DomArtifactPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV,
  'local engineering only');
 sourceBoundary();
 const inputs=sortedUnique(SOURCE_INPUTS.map(relative=>physicalPin(root,relative)));
 const outputs=sortedUnique(GENERATED.map(relative=>{
  const pin=inputs.find(item=>item.path===relative);
  assert(pin,`generated output in input inventory: ${relative}`);
  return pin;
 }));
 const checks=checkedGenerators(root);
 for(const check of checks){
  assert.deepStrictEqual(inputs.find(pin=>pin.path===check.producer.path),check.producer);
  assert.deepStrictEqual(outputs.find(pin=>pin.path===check.output.path),check.output);
 }
 const runManifest={schemaVersion:1,kind:'nms-l02-p056-maintained-dom-source-run-v1',
  animationId:ID,method:'source-locked-public-tool-IR-and-maintained-DOM-integration',
  sourceRoot:SOURCE_ROOT,source:SOURCE,sourceXml:XML,
  sourceStructure:{stage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,
   frameDomain:'sprite-24',frameCount:234,sourceChildTerminalStopPresent:false,
   productPlaybackMode:'once',productPlaybackEndFrame:234,originalRuntimeParityEstablished:false},
  generatorChecks:checks,inputs,outputs,
  productCalibrationPassed:false,scaleOutAuthorized:false,
  acceptanceEffects:{originalRuntimeFidelity:false,audioAccepted:false,humanReviewed:false,
   ownerAccepted:false,strictComplete:false,published:false}};
 const runBytes=json(runManifest),runPin=pinBytes(RUN,runBytes);
 const canonicalModule=inputs.find(pin=>pin.path===MODULE),timeline=inputs.find(pin=>pin.path===TIMELINE);
 const memberManifest={schemaVersion:1,kind:'nms-l02-p056-maintained-dom-member-v1',
  animationId:ID,rendererBindingKind:'maintained-dom-module-v1',
  source:SOURCE,sourceXml:XML,sourceRun:runPin,module:canonicalModule,timeline,
  inputs,outputs,productCalibrationPassed:false,scaleOutAuthorized:false,
  acceptanceEffects:runManifest.acceptanceEffects};
 const memberBytes=json(memberManifest),memberPin=pinBytes(MEMBER,memberBytes);
 const artifacts={kind:'maintained-dom-module-v1',module:canonicalModule,timeline,
  memberManifest:memberPin,sourceRun:runPin};
 const registryShapeAccepted=projectRegistryShape(root,artifacts);
 return {root,runManifest,memberManifest,runPin,memberPin,artifacts,registryShapeAccepted,
  outputs:[{path:RUN,bytes:runBytes},{path:MEMBER,bytes:memberBytes}]};
}
export function prepareP056DomArtifacts(plan){
 assert(plan.outputs.every(item=>!fs.existsSync(path.join(plan.root,item.path))),
  'immutable DOM artifacts already exist; use --check');
 for(const item of plan.outputs){
  const file=path.join(plan.root,item.path);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,item.bytes,{flag:'wx'});
  assert.deepStrictEqual(physicalPin(plan.root,item.path),pinBytes(item.path,item.bytes));
 }
 return {status:'P056_DOM_ARTIFACTS_PREPARED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
export function checkP056DomArtifacts(plan){
 for(const item of plan.outputs)
  assert.deepStrictEqual(fs.readFileSync(path.join(plan.root,item.path)),item.bytes,
   `${item.path} manifest drift`);
 return {status:'P056_DOM_ARTIFACTS_CHECKED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT){
 try{
  assert(process.argv.length===3&&['--dry-run','--prepare','--check'].includes(process.argv[2]),
   'use --dry-run, --prepare or --check');
  const plan=buildP056DomArtifactPlan();
  const result=process.argv[2]==='--prepare'?prepareP056DomArtifacts(plan):
   process.argv[2]==='--check'?checkP056DomArtifacts(plan):
    {status:'P056_DOM_ARTIFACTS_DRY_RUN_UNREGISTERED',artifacts:plan.artifacts,
     registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
  process.stdout.write(`${JSON.stringify(result)}\n`);
 }catch(error){process.stderr.write(`${error.stack??error}\n`);process.exitCode=1;}
}
