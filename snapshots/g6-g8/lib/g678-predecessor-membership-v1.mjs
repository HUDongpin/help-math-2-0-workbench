/** Exact scoped predecessor membership after the caller has read the real
 * source order, registry transaction and any added page proofs. This module
 * performs no I/O. A proof witness is trusted only when supplied from the
 * separately verified readPageProof/verifyAdmission path; its `validation`
 * field is a binding record, not a substitute for that physical verification. */
import assert from 'node:assert/strict';

const SHA=/^[a-f0-9]{64}$/u;
const KEY=/^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u;
const PATH=/^[A-Za-z0-9._/-]+$/u;

function object(value,label){
 assert(value!==null&&typeof value==='object'&&!Array.isArray(value),label);
}
function pin(value,label){
 object(value,label);
 assert(typeof value.path==='string'&&PATH.test(value.path)&&
  value.path.split('/').every(part=>part&&part!=='.'&&part!=='..'),
  `${label}: bounded path`);
 assert(Number.isSafeInteger(value.bytes)&&value.bytes>0,`${label}: bytes`);
 assert(typeof value.sha256==='string'&&SHA.test(value.sha256),`${label}: sha256`);
}
function member(value,prefix,label){
 object(value,label);
 assert(typeof value.key==='string'&&KEY.test(value.key)&&value.key.startsWith(prefix),
  `${label}: scoped key`);
 object(value.registration,`${label}: registration`);
 assert(typeof value.registration.calibrationId==='string'&&
  /^[a-z0-9-]+$/u.test(value.registration.calibrationId),`${label}: calibration`);
 assert.equal(value.registration.deploymentScope,'local-only',`${label}: local scope`);
 pin(value.registration.freezeManifest,`${label}: freeze manifest`);
 object(value.registration.entry,`${label}: entry`);
 assert.equal(value.registration.entry.key,value.key,`${label}: entry key`);
 assert(typeof value.registration.entry.module==='string'&&
  /^\.\/modules\/[a-z0-9-]+$/u.test(value.registration.entry.module),
  `${label}: bounded module`);
 assert.equal(value.registration.entry.maturity,'private-current-js',`${label}: maturity`);
 object(value.registration.entry.artifacts,`${label}: artifacts`);
 pin(value.registration.entry.artifacts.module,`${label}: module pin`);
 pin(value.registration.entry.artifacts.timeline,`${label}: timeline pin`);
 object(value.source,`${label}: source`);
 pin({path:value.source.path,bytes:value.source.bytes,sha256:value.source.sha256},
  `${label}: source pin`);
 assert.equal(value.source.assetId,`swf-${value.source.sha256}`,`${label}: asset identity`);
 assert(Number.isSafeInteger(value.source.sourceOccurrence)&&value.source.sourceOccurrence>0,
  `${label}: source occurrence`);
 assert(typeof value.source.sourceXmlSha256==='string'&&SHA.test(value.source.sourceXmlSha256),
  `${label}: XML identity`);
}
function witness(value,memberValue,seenProofs,admission){
 object(value,'admitted proof witness');
 assert.equal(value.kind,'g678-validated-page-proof-witness-v1');
 assert.equal(value.validation,'readPageProof-v1');
 pin(value.proofPin,'admitted proof pin');
 pin(value.hostPin,'admitted host pin');
 assert.deepEqual(value.hostPin,admission.hostPin,'admitted host identity');
 assert(admission.pageProofPins.some(pinValue=>
  pinValue.path===value.proofPin.path&&pinValue.bytes===value.proofPin.bytes&&
  pinValue.sha256===value.proofPin.sha256),'proof appears in verified admission index');
 assert(!seenProofs.has(value.proofPin.path),'duplicate admitted proof path');
 seenProofs.add(value.proofPin.path);
 assert.equal(value.animationId,memberValue.key,'admitted page identity');
 assert.deepEqual(value.registration,memberValue.registration,'admitted registration binding');
 assert.deepEqual(value.source,memberValue.source,'admitted source binding');
 object(value.packet,'admitted packet');
 assert.equal(value.packet.calibrationId,memberValue.registration.calibrationId,
  'admitted calibration identity');
 assert.deepEqual(value.packet.entry,memberValue.registration.entry,'admitted entry');
 assert.equal(value.packet.selectedPages?.length,1,'one admitted source occurrence');
 const page=value.packet.selectedPages[0],source=memberValue.source;
 assert.equal(page.animationId,memberValue.key,'admitted selected page');
 assert.equal(page.sourceSha256,source.sha256,'admitted source SHA');
 assert.equal(page.assetId,source.assetId,'admitted asset identity');
 assert.equal(page.sourceOccurrence,source.sourceOccurrence,'admitted source order');
 assert.deepEqual(value.packet.source,{path:source.path,bytes:source.bytes,
  sha256:source.sha256},'admitted physical source pin');
 assert.equal(value.packet.sourceXml?.sha256,source.sourceXmlSha256,
  'admitted lesson XML');
}

/** `requiredMembers` come from the preserved predecessor snapshot and its
 * independently verified source identities. `currentMembers` are the scoped
 * current transaction projected into the same normalized shape. Additional
 * members are possible only with one separately verified page-proof witness
 * per key. No total count is embedded in this contract.
 * @param {{keyPrefix:string,requiredMembers:any[],currentMembers:any[],
 * validatedAdmission?:any,admittedProofWitnesses?:any[]}} input */
export function assertG678PredecessorMembership({keyPrefix,requiredMembers,
 currentMembers,validatedAdmission=null,admittedProofWitnesses=[]}){
 assert(typeof keyPrefix==='string'&&
  /^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-$/u.test(keyPrefix),
  'bounded lesson prefix');
 assert(Array.isArray(requiredMembers)&&requiredMembers.length>0,'required members');
 assert(Array.isArray(currentMembers),'current members');
 assert(Array.isArray(admittedProofWitnesses),'admitted proof witnesses');
 const required=new Map(),current=new Map(),proofs=new Map();
 for(const value of requiredMembers){
  member(value,keyPrefix,'required member');
  assert(!required.has(value.key),`duplicate required member: ${value.key}`);
  required.set(value.key,value);
 }
 for(const value of currentMembers){
  member(value,keyPrefix,'current member');
  assert(!current.has(value.key),`duplicate current member: ${value.key}`);
  current.set(value.key,value);
 }
 for(const [key,value] of required){
  assert(current.has(key),`missing required member: ${key}`);
  assert.deepEqual(current.get(key),value,`changed required registration/source: ${key}`);
 }
 const extraKeys=[...current.keys()].filter(key=>!required.has(key)).sort();
 if(extraKeys.length||admittedProofWitnesses.length){
  object(validatedAdmission,'validated admission index');
  assert.equal(validatedAdmission.kind,'g678-verified-admission-index-v1');
  pin(validatedAdmission.hostPin,'verified admission host pin');
  assert(Array.isArray(validatedAdmission.pageProofPins)&&
   validatedAdmission.pageProofPins.length>0,'verified admission page proofs');
  const indexedProofs=new Set();
  for(const proofPin of validatedAdmission.pageProofPins){
   pin(proofPin,'verified admission proof pin');
   assert(!indexedProofs.has(proofPin.path),'duplicate admission proof path');
   indexedProofs.add(proofPin.path);
  }
 }
 const seenProofs=new Set();
 for(const value of admittedProofWitnesses){
  object(value,'admitted proof witness');
  assert(typeof value.animationId==='string'&&extraKeys.includes(value.animationId),
   'witness must name an added member');
  assert(!proofs.has(value.animationId),`duplicate admitted witness: ${value.animationId}`);
  witness(value,current.get(value.animationId),seenProofs,validatedAdmission);
  proofs.set(value.animationId,value);
 }
 for(const key of extraKeys)assert(proofs.has(key),`unadmitted extra member: ${key}`);
 assert.equal(proofs.size,extraKeys.length,'only exact added members are admitted');
 return Object.freeze({requiredKeys:Object.freeze([...required.keys()].sort()),
  admittedKeys:Object.freeze(extraKeys),memberKeys:Object.freeze([...current.keys()].sort())});
}
