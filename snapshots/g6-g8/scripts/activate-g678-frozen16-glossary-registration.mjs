import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,REGISTRY,NEXT_FREEZE,NEXT_FRAGMENT,WITNESS,CANDIDATES,IDS,prepare,read,bind,encode} from './prepare-g678-frozen16-glossary-registration.mjs';
import {GENERATED_OUTPUTS,expectedScopedRegistryOutputs,readBoundActivationFile} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';

export const RECEIPT='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v4.activation.json';
const BASE='work/g678-shared-page-factory/frozen16-glossary-registration-activation-v2';
const TARGETS=[REGISTRY,GENERATED_OUTPUTS.localOnly,GENERATED_OUTPUTS.localOnlyMetadata];
const EFFECTS={productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
const descriptor=({path,bytes,sha256})=>({path,bytes,sha256});
async function exact(root,states){for(const[file,bytes]of states)assert((await readBoundActivationFile(root,file)).buffer.equals(bytes),`Concurrent target drift: ${file}`);}

/** Testable file transaction; production CLI supplies only the fixed three targets. */
export async function guardedReplacement({root,before,after,targets,recovery,verify,postflight,replace=rename}){
  const current=new Map(before),completed=[],backups=[];
  await exact(root,before);await verify();
  await mkdir(path.join(root,recovery));
  await writeFile(path.join(root,recovery,'lock.json'),encode({targets,initial:[...before].map(([p,b])=>bind(p,b))}),{flag:'wx',mode:0o444});
  for(const[file,bytes]of before){const backup=`${recovery}/before-${path.basename(file)}`;
    await writeFile(path.join(root,backup),bytes,{flag:'wx',mode:0o444});backups.push({target:file,backup:bind(backup,bytes)});}
  for(const file of targets)await writeFile(path.join(root,recovery,`after-${path.basename(file)}`),after.get(file),{flag:'wx'});
  try{
    for(const file of targets){await exact(root,current);await verify();
      await replace(path.join(root,recovery,`after-${path.basename(file)}`),path.join(root,file));
      completed.push(file);current.set(file,after.get(file));}
    await exact(root,after);await postflight();await verify();
    return {backups,completed,rollback:false};
  }catch(error){
    let rollback=false,rollbackError=null;
    try{
      await exact(root,current);
      for(const file of completed.toReversed()){
        const target=path.join(root,recovery,`rollback-${path.basename(file)}`);
        await writeFile(target,before.get(file),{flag:'wx'});await rename(target,path.join(root,file));
      }
      await exact(root,before);rollback=true;
    }catch(e){rollbackError=e.message;}
    await writeFile(path.join(root,recovery,'failure.json'),encode({message:error.message,completed,backups,rollback,rollbackError}),{flag:'wx'});
    error.rollback=rollback;throw error;
  }
}

export async function activate({check=false}={}){
  const plan=await prepare({check:true});
  const files=[NEXT_FREEZE,NEXT_FRAGMENT,CANDIDATES,WITNESS,
    'apps/web/lib/g678-frozen16-glossary-authority.server.ts','apps/web/lib/g678-calibration-product-bridge.server.ts',
    'packages/demos/src/frozen-calibration-glossary-candidate.tsx','scripts/prepare-g678-frozen16-glossary-registration.mjs',
    'scripts/activate-g678-frozen16-glossary-registration.mjs'];
  const pins=await Promise.all(files.map(async f=>descriptor(await readBoundActivationFile(ROOT,f))));
  const verify=async()=>{for(const p of pins)await readBoundActivationFile(ROOT,p.path,p);await prepare({check:true});};
  const currentRegistry=await readBoundActivationFile(ROOT,REGISTRY);
  const outputs=Object.fromEntries(await Promise.all(Object.entries(GENERATED_OUTPUTS).map(async([k,p])=>[k,(await readBoundActivationFile(ROOT,p)).buffer])));
  if(check){
    assert(currentRegistry.buffer.equals(Buffer.from(plan.registryBytes)),'Registry not the exact prepared successor');
    const generated=await buildRegistrySources();
    for(const[k,b]of Object.entries(outputs))assert.equal(b.toString(),generated[k]);
    const receipt=await read(RECEIPT);assert.deepEqual(receipt.value.changedIds,IDS);await verify();
    return{checked:true,registered:379,changed:8,publicFilesWritten:0};
  }
  assert.equal(currentRegistry.sha256,'8a9d076d3b8c781e3255163216666e644488f159bbb2eaff41b479a8802b9c0e');
  const prior=JSON.parse(currentRegistry.buffer);
  assert.deepEqual(outputs,expectedScopedRegistryOutputs(prior,outputs));
  const proposed=expectedScopedRegistryOutputs(plan.registry,outputs);
  const before=new Map([[REGISTRY,currentRegistry.buffer],...Object.entries(GENERATED_OUTPUTS).map(([k,p])=>[p,outputs[k]])]);
  const after=new Map([[REGISTRY,Buffer.from(plan.registryBytes)],...Object.entries(GENERATED_OUTPUTS).map(([k,p])=>[p,proposed[k]])]);
  assert.equal(prior.calibrations.length,plan.registry.calibrations.length);
  const old=prior.calibrations.find(c=>c.calibrationId==='g678-16-page-product-calibration-v1');
  const changed=plan.fragment.calibration.entries.filter(e=>JSON.stringify(e)!==JSON.stringify(old.entries.find(p=>p.key===e.key))).map(e=>e.key).sort();
  assert.deepEqual(changed,IDS);
  assert.deepEqual(prior.calibrations.filter(c=>c!==old),plan.registry.calibrations.filter(c=>c.calibrationId!==old.calibrationId));
  const postflight=async()=>{const generated=await buildRegistrySources();for(const[k,b]of Object.entries(proposed))assert.equal(b.toString(),generated[k]);};
  const transaction=await guardedReplacement({root:ROOT,before,after,targets:TARGETS,recovery:BASE,verify,postflight});
  const receipt={schemaVersion:1,status:'local-frozen-eight-glossary-registered-product-calibration-pending',createdAt:new Date().toISOString(),
    registrationCount:379,changedIds:IDS,preservedPageCount:371,otherCalibrationsUnchanged:true,publicFilesWritten:0,inputBindings:pins,
    proposed:[...after].map(([p,b])=>bind(p,b)),transaction,acceptanceEffects:EFFECTS,
    limitations:['Replacements are recoverable and drift-checked; this is not filesystem content-CAS against uncoordinated writers.','Actual My Lesson browser calibration and source audio remain separate.']};
  await writeFile(path.join(ROOT,RECEIPT),encode(receipt),{flag:'wx'});
  return{registered:379,changed:8,preserved:371,receipt:bind(RECEIPT,encode(receipt)),publicFilesWritten:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert(process.argv.length===3&&['--write','--check'].includes(process.argv[2]));
  activate({check:process.argv[2]==='--check'}).then(r=>console.log(encode(r))).catch(e=>{console.error(e);process.exitCode=1;});
}
