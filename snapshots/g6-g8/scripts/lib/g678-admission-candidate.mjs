/** Reusable preparation for the NEXT page. Does not touch earlier page proofs,
 * host versions, the registry, or the active index. Caller supplies the family's
 * maintained semantic validator, then tests the serialized artifact immediately. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {DISPATCH, REGISTRY, pinFile, readPin, readPageProof, uniquePins, verifyHostVersion} from '../../lib/g678-admission-proof.mjs';

export function prepareAdmissionCandidate({root,output,animationId,packet,registration,implementationFiles,external,
  hostPin,transaction,validateSemantics}) {
  assert(typeof validateSemantics==='function','a source-family semantic validator is mandatory');
  const host=verifyHostVersion(root,hostPin);
  assert(registration.entries.length===1 && registration.entries[0].key===animationId,'one-page candidate');
  assert(!transaction.registry.calibrations.some(c=>c.calibrationId===registration.calibrationId),'new calibration only');
  const legacyInputs=uniquePins([...packet.integrity.files,...Object.values(packet.entry.artifacts),packet.freezeManifest,...implementationFiles]);
  assert(!legacyInputs.some(p=>DISPATCH.includes(p.path)||p.path===REGISTRY),'registry transaction is not page evidence');
  for(const pin of legacyInputs) {
    const replaced=host.historicalRoutes?.find(item=>item.original.path===pin.path) ?? host.legacyInputTransitions?.find(item=>item.original.path===pin.path);
    if(replaced) assert.deepEqual(replaced.original,pin,'explicit reviewed route transition');
    else readPin(root,pin);
  }
  for(const item of external)readPin(item.root,item.pin);
  const shared=new Map(host.files.map(p=>[p.path,p]));
  for(const pin of legacyInputs)if(shared.has(pin.path) && !host.replacedRoutes.includes(pin.path) && !host.legacyInputTransitions?.some(t=>t.original.path===pin.path))assert.deepEqual(shared.get(pin.path),pin,'matching host contract');
  const proof={schemaVersion:1,kind:'g678-page-proof-v1',hostContract:host.contract,animationId,packet,registration,
    legacyInputs,files:legacyInputs.filter(p=>!shared.has(p.path)),external};
  assert(output.startsWith('work/g678-workflow/candidates/') && !output.split('/').includes('..'),'candidate output boundary');
  const target=path.join(root,output);fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
  const proofPin=pinFile(root,output);
  const projected={...transaction,registry:{...transaction.registry,calibrations:[...transaction.registry.calibrations,registration]}};
  // The reader consumes the written artifact, not the producer's in-memory value.
  const readBack=readPageProof(root,proofPin,host,projected);
  validateSemantics(readBack,registration);
  return {proof:proofPin,host:hostPin,status:'candidate-roundtrip-passed',registered:false,
    note:'Run real host integration and commit the independent registry transaction before activating this proof.'};
}
