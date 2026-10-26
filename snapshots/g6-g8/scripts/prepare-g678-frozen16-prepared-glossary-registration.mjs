import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const REGISTRY='packages/demos/private-current-js-registry.json';
export const PRIOR_FREEZE='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.json';
export const NEXT_FREEZE='catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v5.json';
export const NEXT_FRAGMENT=NEXT_FREEZE.replace('.json','.fragment.json');
export const WITNESS='catalog/product-bridge-calibrations/g678-current-js-379-v2-frozen-glossary-registry-witness.json';
export const BRIDGE_WITNESS='catalog/product-bridge-calibrations/g678-current-js-379-v2-frozen-glossary-bridge-witness.ts';
export const CANDIDATES='work/g678-shared-page-factory/frozen16-glossary-candidates-v3/manifest.json';
export const IDS=Object.freeze(['shared-alg001-l05-p030','shared-alg001-l08-p025','shared-dat001-l03-p030','shared-dat001-l07-p025',
  'shared-geo001-l02-p020','shared-geo001-l07-p040','shared-geo001-l11-p030','shared-nms002-l05-p040']);
export const encode=x=>JSON.stringify(x,null,2)+'\n';
export const bind=(p,b)=>({path:p,bytes:Buffer.byteLength(b),sha256:createHash('sha256').update(b).digest('hex')});
export async function read(p){const b=await readFile(path.join(ROOT,p));return {...bind(p,b),buffer:b,value:p.endsWith('.json')?JSON.parse(b):undefined};}
export function changedPage(prior,entry){
  assert.equal(prior.animationId,entry.key);assert.equal(prior.sourceSha256,entry.source.sha256);
  assert.equal(prior.adapterFamily,'linear-glossary-source-static');assert.deepEqual(prior.runtime,entry.runtime);
  return {...structuredClone(prior),presentation:entry.presentation,glossaryEntries:entry.glossaryEntries,
    implementation:{...prior.implementation,sourceBoundGlossaryControlsImplemented:true,sourceAlphaVisibilityRangesImplemented:true},
    productBlockers:prior.productBlockers.filter(b=>b!=='glossary-host-bridge-not-reconstructed').concat(['frozen16-glossary-actual-my-lesson-calibration-pending']),
    frozenGlossarySuccessor:{controls:entry.controls,sourceHostRouting:'canonical-indexMI-frame50-fixed-L1',registeredProductQaPassed:false,modulePreparation:entry.modulePreparation}};
}
export async function prepare({check=false}={}){
  const verified=spawnSync(process.execPath,['scripts/build-g678-frozen16-prepared-glossary-candidates.mjs','--check'],{cwd:ROOT,encoding:'utf8'});assert.equal(verified.status,0,verified.stderr);
  const old=await read(PRIOR_FREEZE),candidate=await read(CANDIDATES);
  const active=await read('catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v4.json');
  const activeRegistry=await read('catalog/product-bridge-calibrations/g678-current-js-379-v4-prepared-glossary-registry-witness.json');
  assert.equal(active.sha256,'d255d5b96f8442c3ab096a0c92c3b52676d68030ca43be267f273f398373ce07');
  assert.equal(activeRegistry.sha256,'0eef87a29464939825af86b680b67946489d22478c9bce8a093d1ccec7871da6');
  assert.equal(old.sha256,'949572a4abc466d30d6bb7ffd52ab3b61f57f7f7dd7497ed5c224b931a88af4d');
  assert.deepEqual(candidate.value.entries.map(e=>e.key),IDS);
  const witness=await read(WITNESS);
  assert.equal(witness.sha256,'8a9d076d3b8c781e3255163216666e644488f159bbb2eaff41b479a8802b9c0e');
  const byId=new Map(candidate.value.entries.map(e=>[e.key,e]));
  const freeze=structuredClone(old.value);
  freeze.selectedPages=old.value.selectedPages.map(p=>byId.has(p.animationId)?changedPage(p,byId.get(p.animationId)):structuredClone(p));
  freeze.inputs.frozenGlossaryActivePredecessor=bind(active.path,active.buffer);
  freeze.inputs.frozenGlossaryActiveRegistry=bind(activeRegistry.path,activeRegistry.buffer);
  freeze.inputs.frozenGlossaryPredecessor=bind(PRIOR_FREEZE,old.buffer);
  freeze.inputs.frozenGlossaryCandidates=bind(CANDIDATES,candidate.buffer);
  freeze.inputs.frozenGlossaryRegistryWitness=bind(WITNESS,witness.buffer);
  freeze.productHostCalibration={...freeze.productHostCalibration,frozenGlossaryControlPages:8,frozenGlossaryRegisteredQaPassed:false};
  const freezeBytes=encode(freeze),freezeBinding=bind(NEXT_FREEZE,freezeBytes);
  const registry=structuredClone(witness.value);
  const calibration=registry.calibrations.find(c=>c.calibrationId==='g678-16-page-product-calibration-v1');
  assert(calibration);assert.equal(calibration.entries.length,379);
  calibration.freezeManifest=NEXT_FREEZE;calibration.freezeManifestBytes=freezeBinding.bytes;calibration.freezeManifestSha256=freezeBinding.sha256;
  calibration.entries=calibration.entries.map(e=>byId.has(e.key)?{...e,module:byId.get(e.key).module,artifacts:byId.get(e.key).artifacts}:e);
  const activeCalibration=activeRegistry.value.calibrations.find(c=>c.calibrationId===calibration.calibrationId);
  assert.deepEqual(calibration.entries.filter(e=>!IDS.includes(e.key)),activeCalibration.entries.filter(e=>!IDS.includes(e.key)));
  assert.deepEqual(registry.calibrations.filter(c=>c!==calibration),activeRegistry.value.calibrations.filter(c=>c!==activeCalibration));
  for(const p of freeze.selectedPages.filter(p=>IDS.includes(p.animationId))){const before=active.value.selectedPages.find(a=>a.animationId===p.animationId);assert.deepEqual(p.runtime,before.runtime);assert.deepEqual(p.glossaryEntries,before.glossaryEntries);assert.deepEqual(p.frozenGlossarySuccessor.controls,before.frozenGlossarySuccessor.controls);}
  const registryBytes=encode(registry);
  const fragment={schemaVersion:1,artifactType:'g678-frozen16-glossary-registration-fragment-v1',calibration,
    predecessorFreeze:bind(PRIOR_FREEZE,old.buffer),predecessorRegistry:bind(WITNESS,witness.buffer),candidate:bind(CANDIDATES,candidate.buffer),
    proposedRegistry:bind(REGISTRY,registryBytes),changedIds:IDS,preservedPageCount:371,
    acceptanceEffects:{productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false}};
  if(check){assert.equal((await read(NEXT_FREEZE)).buffer.toString(),freezeBytes);assert.equal((await read(NEXT_FRAGMENT)).buffer.toString(),encode(fragment));}
  else{
    await writeFile(path.join(ROOT,NEXT_FREEZE),freezeBytes,{flag:'wx'});
    await writeFile(path.join(ROOT,NEXT_FRAGMENT),encode(fragment),{flag:'wx'});
  }
  return {freezeBinding,fragment,registryBytes,registry};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');
  prepare({check:process.argv[2]==='--check'}).then(r=>console.log(encode({freeze:r.freezeBinding,registry:r.fragment.proposedRegistry,changedIds:IDS,activated:false}))).catch(e=>{console.error(e);process.exitCode=1;});
}
