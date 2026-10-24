import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {assertG678PredecessorMembership} from '../lib/g678-predecessor-membership-v1.mjs';

// Synthetic normalized records model the 17 preserved source registrations
// plus the separately admitted P001/P002/P003 set. They are not source pins.
const PREFIX='shared-alg001-l06-';
const PREDECESSOR_ORDINALS=[5,6,7,9,11,12,30,36,37,39,40,51,52,53,54,55,59,1,2,3];
const sha=value=>createHash('sha256').update(value).digest('hex');
const pin=(path,seed)=>({path,bytes:seed.length+1,sha256:sha(seed)});
const clone=value=>structuredClone(value);
function member(ordinal){
 const number=String(ordinal).padStart(3,'0'),key=`${PREFIX}p${number}`;
 const swfSha=sha(`source:${number}`);
 return {key,registration:{calibrationId:`test-calibration-${number}`,
  deploymentScope:'local-only',freezeManifest:pin(`proofs/${number}.json`,`freeze:${number}`),
  entry:{key,module:ordinal===1?'./modules/g678-alg-l06-source-title-p001':
   ordinal===2?'./modules/g678-alg-l06-p002-decoder-v3':`./modules/${key}`,
   maturity:'private-current-js',
   artifacts:{module:pin(`modules/${number}.tsx`,`module:${number}`),
    timeline:pin(`timelines/${number}.ts`,`timeline:${number}`)}}},
  source:{path:`G6-G8-shared/ALG001/L6/RW/L6RW${number}.swf`,bytes:1234,
   sha256:swfSha,assetId:`swf-${swfSha}`,sourceOccurrence:ordinal,
   sourceXmlSha256:sha('G6-G8-shared/ALG001/L6/index.xml')}};
}
function proofWitness(value){
 return {kind:'g678-validated-page-proof-witness-v1',validation:'readPageProof-v1',
  animationId:value.key,proofPin:pin(`catalog/g678-admission-v1/${value.key}.json`,value.key),
  hostPin:pin('catalog/g678-admission-v1/host-v20.json','host-v20'),
  registration:clone(value.registration),source:clone(value.source),
  packet:{calibrationId:value.registration.calibrationId,
   entry:clone(value.registration.entry),
   source:{path:value.source.path,bytes:value.source.bytes,sha256:value.source.sha256},
   sourceXml:{sha256:value.source.sourceXmlSha256},
   selectedPages:[{animationId:value.key,sourceSha256:value.source.sha256,
    assetId:value.source.assetId,sourceOccurrence:value.source.sourceOccurrence}]}};
}
const OLD=PREDECESSOR_ORDINALS.map(member);
const admission=witnesses=>({kind:'g678-verified-admission-index-v1',
 hostPin:clone(witnesses[0].hostPin),pageProofPins:witnesses.map(value=>clone(value.proofPin))});
const args=(currentMembers,admittedProofWitnesses=[],validatedAdmission=
 admittedProofWitnesses.length?admission(admittedProofWitnesses):null)=>({keyPrefix:PREFIX,
 requiredMembers:clone(OLD),currentMembers,validatedAdmission,admittedProofWitnesses});

test('exact preserved predecessor set remains valid without a hardcoded count',()=>{
 const result=assertG678PredecessorMembership(args(clone(OLD)));
 assert.equal(result.requiredKeys.length,OLD.length);
 assert.equal(result.memberKeys.length,OLD.length);
 assert.deepEqual(result.admittedKeys,[]);
 assert.throws(()=>assertG678PredecessorMembership({keyPrefix:PREFIX,
  requiredMembers:[OLD[0]],currentMembers:[],admittedProofWitnesses:[]}),/missing required member/);
});

test('P004 can be added only with its separately validated exact page witness',()=>{
 const p004=member(4),current=[...clone(OLD),p004],proof=proofWitness(p004);
 const result=assertG678PredecessorMembership(args(current,[proof]));
 assert.deepEqual(result.admittedKeys,[p004.key]);
 assert.equal(result.memberKeys.length,OLD.length+1);
 assert.throws(()=>assertG678PredecessorMembership(args(current)),/validated admission index/);
 assert.throws(()=>assertG678PredecessorMembership(args(current,[],admission([proof]))),
  /unadmitted extra member/);
 assert.throws(()=>assertG678PredecessorMembership(args(current,[{...proof,validation:'self-attested'}])),
  /readPageProof-v1/);
});

test('original registration and source binding cannot drift or disappear',()=>{
 for(const mutate of [
  value=>{value.registration.freezeManifest.sha256=sha('tampered freeze');},
  value=>{value.registration.entry.artifacts.module.sha256=sha('tampered module');},
  value=>{value.source.sha256=sha('tampered source');value.source.assetId=`swf-${value.source.sha256}`;},
  value=>{value.source.sourceOccurrence=999;},
 ]){
  const current=clone(OLD);mutate(current[0]);
  assert.throws(()=>assertG678PredecessorMembership(args(current)),
   /changed required registration\/source/);
 }
 const missing=clone(OLD);missing.splice(0,1);
 assert.throws(()=>assertG678PredecessorMembership(args(missing)),/missing required member/);
 const duplicated=clone(OLD);duplicated.push(clone(duplicated[0]));
 assert.throws(()=>assertG678PredecessorMembership(args(duplicated)),/duplicate current member/);
 const duplicateRequired=clone(OLD);duplicateRequired.push(clone(duplicateRequired[0]));
 assert.throws(()=>assertG678PredecessorMembership({keyPrefix:PREFIX,
  requiredMembers:duplicateRequired,currentMembers:clone(OLD)}),/duplicate required member/);
});

test('unexpected or malformed additions cannot use a loose proof claim',()=>{
 const p004=member(4),p008=member(8),current=[...clone(OLD),p004,p008],proof=proofWitness(p004);
 assert.throws(()=>assertG678PredecessorMembership(args(current,[proof])),/unadmitted extra member/);
 assert.throws(()=>assertG678PredecessorMembership(args([...clone(OLD),p004],
  [proofWitness(OLD[0])])),/witness must name an added member/);
 assert.throws(()=>assertG678PredecessorMembership(args([...clone(OLD),p004],
  [proof,{...proof}],admission([proof]))),/duplicate admitted witness/);
 const sourceTamper=proofWitness(p004);
 sourceTamper.packet.selectedPages[0].assetId=`swf-${sha('wrong')}`;
 assert.throws(()=>assertG678PredecessorMembership(args([...clone(OLD),p004],[sourceTamper])),
  /admitted asset identity/);
 const registrationTamper=proofWitness(p004);
 registrationTamper.packet.entry.artifacts.timeline.sha256=sha('wrong');
 assert.throws(()=>assertG678PredecessorMembership(args([...clone(OLD),p004],
  [registrationTamper])),/admitted entry/);
 const malformed=proofWitness(p004);malformed.proofPin.sha256='not-a-hash';
 assert.throws(()=>assertG678PredecessorMembership(args([...clone(OLD),p004],[malformed])),
  /verified admission proof pin: sha256/);
 const wrongIndex=admission([proof]);wrongIndex.pageProofPins[0].sha256=sha('another proof');
 assert.throws(()=>assertG678PredecessorMembership(args([...clone(OLD),p004],[proof],wrongIndex)),
  /proof appears in verified admission index/);
 const wrongHost=admission([proof]);wrongHost.hostPin.sha256=sha('another host');
 assert.throws(()=>assertG678PredecessorMembership(args([...clone(OLD),p004],[proof],wrongHost)),
  /admitted host identity/);
 const outside=member(4);outside.key='shared-geo001-l01-p004';
 assert.throws(()=>assertG678PredecessorMembership(args([...clone(OLD),outside])),/scoped key/);
});
