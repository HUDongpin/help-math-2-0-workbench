/** Preserve frozen v3 producers; reject mutable activation in new page evidence
 * before the writer preflight or any candidate artifact is created. Browser
 * stability checks must still bind the current activation and registry. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import {preflightRegistration} from './g678-registration-preflight-v1.mjs';
import {DISPATCH,REGISTRY,admissionArtifactPins,pinFile,readPin,readPageProof,uniquePins,verifyHostVersion} from '../../lib/g678-admission-proof.mjs';

export function assertImmutablePageEvidence({packet,implementationFiles}) {
 const pins=[...packet.integrity.files,...admissionArtifactPins(packet.entry),
  packet.freezeManifest,...implementationFiles];
 assert(!pins.some(pin=>pin.path==='apps/web/lib/g678-admission-activation.ts'),
  'mutable admission activation is not fixed page evidence; retain it in browser stability inputs');
}

/** Current inputs take precedence over older versions at the same path.
 * A historical input requires one exact, physically verified host witness. */
export function verifyCandidateHostInputs(root,host,inputs) {
 for(const pin of inputs) {
  const current=host.files.filter(file=>file.path===pin.path);
  assert(current.length<=1,'unique current candidate host input');
  if(current.length===0||exact(current[0],pin)){readPin(root,pin);continue;}
  const transitions=[...(host.legacyInputTransitions??[]),...(host.legacyPageHostPromotions??[])]
   .filter(item=>exact(item.original,pin));
  const historical=(host.historicalRoutes??[]).filter(item=>exact(item.original,pin));
  assert(transitions.length+historical.length===1,'one exact candidate host transition');
  const transition=transitions[0]??historical[0];
  if(transitions.length)assert.deepEqual(transition.current,current[0],'exact current candidate host target');
  else assert(host.replacedRoutes.includes(pin.path),'explicit historical candidate host path');
  assert(transition.snapshot.path!==pin.path&&transition.snapshot.bytes===pin.bytes&&transition.snapshot.sha256===pin.sha256,
   'exact retained candidate host bytes');
  readPin(root,current[0]);readPin(root,transition.snapshot);
 }
}

export async function prepareAdmissionCandidate({root,output,animationId,packet,registration,implementationFiles,external,
 hostPin,transaction,validateSemantics}) {
 assertImmutablePageEvidence({packet,implementationFiles});
 assert(typeof validateSemantics==='function','a source-family semantic validator is mandatory');
 const registrationPreflight=await preflightRegistration({root,fragment:registration,transaction,exact:true});
 const host=verifyHostVersion(root,hostPin);
 assert(registration.entries.length===1&&registration.entries[0].key===animationId,'one-page candidate');
 assert(!transaction.registry.calibrations.some(c=>c.calibrationId===registration.calibrationId),'new calibration only');
 const legacyInputs=uniquePins([...packet.integrity.files,...admissionArtifactPins(packet.entry),packet.freezeManifest,...implementationFiles]);
 assert(!legacyInputs.some(pin=>DISPATCH.includes(pin.path)||pin.path===REGISTRY),'registry transaction is not page evidence');
 verifyCandidateHostInputs(root,host,legacyInputs);
 for(const item of external)readPin(item.root,item.pin);
 const shared=new Set(host.files.map(pin=>pin.path));
 const proof={schemaVersion:1,kind:'g678-page-proof-v1',hostContract:host.contract,animationId,packet,registration,
  legacyInputs,files:legacyInputs.filter(pin=>!shared.has(pin.path)),external};
 assert(output.startsWith('work/g678-workflow/candidates/')&&!output.split('/').includes('..'),'candidate output boundary');
 const target=path.join(root,output);fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
 const proofPin=pinFile(root,output);
 const projected={...transaction,registry:{...transaction.registry,calibrations:[...transaction.registry.calibrations,registration]}};
 const readBack=readPageProof(root,proofPin,host,projected);
 validateSemantics(readBack,registration);
 return {registrationPreflight,proof:proofPin,host:hostPin,status:'candidate-roundtrip-passed',registered:false,
  note:'Run real host integration and commit the independent registry transaction before activating this proof.'};
}
