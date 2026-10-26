import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {build,ID,CALIBRATION} from './build-g678-nms-l01-p034.mjs';
import {ROOT,readBound,pin,encode} from './lib/g678-nms-l01-p034-generator-v1.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';
import {GENERATED_OUTPUTS,expectedScopedRegistryOutputs} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
const PRESERVED=TASK+'/nms-l01-p034-before-glossary-scope-repair-v1';
const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),SERVER='apps/web/lib/g678-nms-l01-p034.server.ts',UI='apps/web/components/nms-l01-p034-source-runtime-v1.tsx',REGISTRY='packages/demos/private-current-js-registry.json';
const RECEIPT=`catalog/product-bridge-calibrations/${CALIBRATION}.glossary-scope-repair-v1.json`;
assert(process.argv.length===3&&['--plan','--write','--check'].includes(process.argv[2]));
await build({check:true});
const frozen=await readBound(FREEZE),current=JSON.parse(frozen.bytes),oldFile=await readBound(PRESERVED+'/'+FREEZE),old=JSON.parse(oldFile.bytes);
assert.equal(oldFile.binding.sha256,'f358a8fd07088c0e7d4c7f97b6675ae7f60d8d6eaf83cf2f7c6fd52ba4cb82e5');
assert.equal(frozen.binding.sha256,'d3cbc208951b92d457f217b18294c2110beb1280c559cc9526cd54315a65955a');
const {inputs:oldInputs,...oldBody}=old,{inputs:newInputs,...newBody}=current;assert.deepEqual(oldBody,newBody,'only UI input binding may change in the prepared candidate');
assert.equal(oldInputs.length,newInputs.length);const changed=oldInputs.flatMap((p,i)=>JSON.stringify(p)===JSON.stringify(newInputs[i])?[]:[{before:p,after:newInputs[i]}]);assert.equal(changed.length,1);assert.equal(changed[0].before.path,UI);assert.equal(changed[0].after.path,UI);
const oldUi=await readBound(PRESERVED+'/'+UI),newUi=await readBound(UI);assert.equal(oldUi.binding.sha256,changed[0].before.sha256);assert.equal(newUi.binding.sha256,changed[0].after.sha256);
assert.equal(newUi.bytes.toString(),oldUi.bytes.toString().replace('a.PRACTICE.glossary.length !== 2','a.PRACTICE.glossary.length !== 3'));
const fragmentFile=await readBound(FRAGMENT),fragment=JSON.parse(fragmentFile.bytes),registryFile=await readBound(REGISTRY),registry=JSON.parse(registryFile.bytes),outputs=Object.fromEntries(await Promise.all(Object.entries(GENERATED_OUTPUTS).map(async([k,p])=>[k,(await readBound(p)).bytes])));
const verify=async()=>{await readBound(FREEZE,frozen.binding);await readBound(FRAGMENT,fragmentFile.binding);await readBound(UI,newUi.binding);await build({check:true});};
if(process.argv[2]==='--check'){
 const receipt=JSON.parse((await readBound(RECEIPT)).bytes);assert.equal(receipt.status,'local-glossary-scope-repaired-product-qa-pending');assert.deepEqual(receipt.changedIds,[ID]);assert.equal(receipt.preservedOtherPages,417);for(const b of receipt.after)await readBound(b.path,b);
 assert.deepEqual(registry.calibrations.find(c=>c.calibrationId===CALIBRATION),fragment.calibration);const generated=await buildRegistrySources();for(const[k,b]of Object.entries(outputs))assert.equal(b.toString(),generated[k]);await verify();console.log(encode({checked:true,registered:418,preservedOtherPages:417,changedExistingModuleArtifacts:0,publicFilesWritten:0,receipt:RECEIPT}));
}else{
 assert.equal(registryFile.binding.sha256,'e50ee20747e1359798256a805e5c5a518ee2ca6b10bbecb566117dd387fb3e92');assert.equal(registry.calibrations.flatMap(c=>c.entries).filter(e=>e.key.startsWith('shared-')).length,418);
 const oldCal=registry.calibrations.find(c=>c.calibrationId===CALIBRATION);assert.deepEqual(oldCal.entries,fragment.calibration.entries);assert.equal(oldCal.freezeManifestSha256,oldFile.binding.sha256);
 const next=upsertPrivateCurrentJsCalibration(registry,fragment.calibration);assert.deepEqual(next.calibrations.filter(c=>c.calibrationId!==CALIBRATION),registry.calibrations.filter(c=>c.calibrationId!==CALIBRATION));
 const oldServer=await readBound(SERVER);assert.equal(oldServer.bytes.toString(),(await readFile(PRESERVED+'/'+SERVER)).toString());const server=oldServer.bytes.toString().replace(oldFile.binding.sha256,frozen.binding.sha256);assert.notEqual(server,oldServer.bytes.toString());
 const nextOutputs=expectedScopedRegistryOutputs(next,outputs),before=new Map([[REGISTRY,registryFile.bytes],...Object.entries(GENERATED_OUTPUTS).map(([k,p])=>[p,outputs[k]]),[SERVER,oldServer.bytes]]),after=new Map([[REGISTRY,Buffer.from(encode(next))],...Object.entries(GENERATED_OUTPUTS).map(([k,p])=>[p,nextOutputs[k]]),[SERVER,Buffer.from(server)]]);
 const summary={beforeRegistry:registryFile.binding,after:[...after].map(([p,b])=>pin(p,b)),changedIds:[ID],preservedOtherPages:417,changedExistingModuleArtifacts:0,publicFilesWritten:0,oldCandidate:oldFile.binding,currentCandidate:frozen.binding,changedInput:changed[0],reason:'P034 has3 source glossary terms. The inherited UI guard required2; correct only that maintained UI count and its frozen binding.'};
 if(process.argv[2]==='--plan')console.log(encode({...summary,planOnly:true,writes:0}));
 else{
  const postflight=async()=>{const generated=await buildRegistrySources();for(const[k,b]of Object.entries(nextOutputs))assert.equal(b.toString(),generated[k]);};
  const transaction=await guardedReplacement({root:ROOT,before,after,targets:[REGISTRY,GENERATED_OUTPUTS.localOnly,GENERATED_OUTPUTS.localOnlyMetadata,SERVER],recovery:`work/g678-shared-page-factory/${CALIBRATION}-glossary-scope-repair-v1`,verify,postflight});
  await writeFile(path.join(ROOT,RECEIPT),encode({schemaVersion:1,checkedAt:new Date().toISOString(),status:'local-glossary-scope-repaired-product-qa-pending',...summary,transaction,productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false}),{flag:'wx'});console.log(encode({repaired:true,registered:418,receipt:RECEIPT}));
 }
}
