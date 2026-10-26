/** Independently executed predecessor, current host transitions, and registry
 * transactions stay separate. A closure inventory alone cannot admit a page. */
import assert from 'node:assert/strict';
import path from 'node:path';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {readPin,readJsonPin,readRegistryTransaction,uniquePins,sha256,registrySources,REGISTRY,DISPATCH} from './g678-admission-proof.mjs';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const EXTERNAL_ROOTS=[SOURCE_ROOT,
 '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',
 '/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1/objects/sha256'];
const GLOSSARY_ROOT='/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
function readSourcePin(root,pin){
 if(!path.isAbsolute(pin.path))return readPin(root,pin);
 if(pin.path.startsWith(root+'/'))return readPin(root,{...pin,path:path.relative(root,pin.path)});
 const anchor=EXTERNAL_ROOTS.find(dir=>pin.path.startsWith(dir+'/'));
 if(anchor)return readPin(anchor,{...pin,path:path.relative(anchor,pin.path)});
 assert(['L1KTE01.xml','L1KTS01.xml'].some(name=>pin.path===`${GLOSSARY_ROOT}/${name}`),'exact external dictionary');
 return readPin(GLOSSARY_ROOT,{...pin,path:path.basename(pin.path)});
}
function sameBytes(a,b){return a.bytes===b.bytes&&a.sha256===b.sha256;}

// Only called with members of the exact reviewed 1,776-pin base closure. The
// largest member is the pinned 121 MB Node executable used by original tooling.
function readExactBasePin(root,pin){
 const file=pin.path.startsWith('G6-G8-shared/')?path.resolve(SOURCE_ROOT,pin.path):path.resolve(root,pin.path);
 assert(realpathSync(file)===file,'physical effective base input');
 const before=lstatSync(file,{bigint:true});
 assert(before.isFile()&&before.nlink===1n&&before.size<=128n*1024n*1024n,'bounded effective base file');
 const bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 assert(['dev','ino','mode','size','mtimeNs','ctimeNs','nlink'].every(key=>before[key]===after[key]),'stable effective base read');
 assert(bytes.length===pin.bytes&&sha256(bytes)===pin.sha256,`effective base pin: ${pin.path}`);
 return bytes;
}
function verifyBaseWitness(root,pin,transaction){
 assert(pin.sha256==='0da30031642bba4aec395369c671a55f8186371e294b2a9bed11a8386215ac62','reviewed actual base execution');
 const base=readJsonPin(root,pin);
 assert(base.kind==='nms-l02-live-base-descriptor-witness-v3'&&base.execution.method==='unmodified-live-root-reader'&&
  base.execution.root===root&&base.execution.sourceRoot===SOURCE_ROOT,'actual base root and source');
 for(const p of [base.predecessorWitness,base.execution.script,base.execution.reader,base.baseFreeze,
  base.snapshot,base.descriptor,base.undefinedOwnProperties])readPin(root,p);
 assert(base.closure.sha256==='9345ccfbd0250d13bb7bddce7b3d03a139d0d8098d2afd7b61e48a20dc77ce9a','reviewed base closure');
 const closure=readJsonPin(root,base.closure);
 assert(closure.pins.length===1776&&closure.conflicts.length===0,'complete effective base inputs');
 const snapshots=readJsonPin(root,{path:'output/nms-l02-host-successor-20260927/registry-predecessor/snapshots.json',
  bytes:1364,sha256:'a1ce7f2326cd12ed366177fda8e0b25b3d2584818857d73bb8f4427c9168ef2a'});
 assert.deepEqual(snapshots.map(row=>row.original.path),[REGISTRY,...DISPATCH],'exact three registry inputs');
 const historical=new Map();
 for(const row of snapshots){
  assert.deepEqual(closure.pins.find(p=>p.path===row.original.path),row.original,'registry input was in actual base');
  assert(sameBytes(row.original,row.snapshot),'original registration bytes preserved');
  historical.set(row.original.path,readPin(root,row.snapshot));
 }
 const originalRegistry=JSON.parse(historical.get(REGISTRY).toString());
 registrySources(originalRegistry).forEach((source,index)=>assert.equal(source,historical.get(DISPATCH[index]).toString(),
  'historical dispatch is canonical'));
 for(const original of originalRegistry.calibrations){
  const matches=transaction.registry.calibrations.filter(row=>row.calibrationId===original.calibrationId);
  assert(matches.length===1,'all original registrations retained');
  assert.deepEqual(matches[0],original,'registry additions cannot rewrite predecessor evidence');
 }
 for(const p of closure.pins)if(!historical.has(p.path))readExactBasePin(root,p);
 const snapshot=readJsonPin(root,base.snapshot),compact=Buffer.from(JSON.stringify(snapshot));
 assert(compact.length===base.fullSnapshot.bytes&&sha256(compact)===base.fullSnapshot.sha256&&
  snapshot.status==='ready'&&snapshot.descriptors.length===44&&snapshot.registeredPlacementCount===379,
  'complete witnessed base snapshot');
 assert(Object.values(base.acceptanceEffects).every(value=>value===false),'base grants no acceptance');
 return base;
}

export function verifyNmsL02Predecessor(root,witnessPin,hostPin){
 const witness=readJsonPin(root,witnessPin),host=readJsonPin(root,hostPin);
 assert(witness.schemaVersion===1&&witness.kind==='nms-l02-predecessor-descriptor-witness-v1','executed predecessor witness required');
 assert(host.schemaVersion===1&&host.kind==='nms-l02-successor-host-v1','reviewed current host required');
 assert.deepEqual(host.predecessor,witnessPin,'host binds exact predecessor witness');
 const closure=readJsonPin(root,witness.closure);
 assert(closure.schemaVersion===1&&closure.kind==='nms-l02-predecessor-closure-v2'&&
  closure.animationId==='shared-nms002-l02-p052'&&closure.sourceRoot===SOURCE_ROOT,'exact predecessor closure');
 assert.deepEqual(closure.unresolved,[],'all original pinned bytes recovered');
 assert.deepEqual(closure.mixedVersionPaths,[],'one original version per path');
 assert(closure.packetChain.length===49&&closure.unionPins.length===14333,'complete predecessor chain');
 assert.deepEqual(uniquePins(closure.unionPins),closure.unionPins,'canonical complete pin union');
 for(const packet of closure.packetChain)readSourcePin(root,packet.packet);
 const originals=new Map(closure.unionPins.map(pin=>[pin.path,pin]));
 const transitions=new Map();
 assert(Array.isArray(host.transitions)&&Array.isArray(host.files)&&host.files.length>0,'explicit host inputs');
 for(const transition of host.transitions){
  assert(!transitions.has(transition.original.path),'unique reviewed transition');
  assert.deepEqual(originals.get(transition.original.path),transition.original,'transition is an exact original input');
  assert(transition.current.path===transition.original.path&&sameBytes(transition.original,transition.snapshot),
   'transition preserves original identity');
  readPin(root,transition.snapshot);
  readSourcePin(root,transition.current);
  assert(typeof transition.reason==='string'&&transition.reason.length>0,'reviewed transition reason');
  transitions.set(transition.original.path,transition);
 }
 for(const pin of closure.unionPins){
  const transition=transitions.get(pin.path);
  if(!transition)readSourcePin(root,pin);
 }
 assert.deepEqual(uniquePins(host.files),host.files,'canonical current host inputs');
 for(const pin of host.files)readPin(root,pin);
 readPin(root,witness.originalReader);
 const readerPin=originals.get(witness.originalReader.path);
 assert(readerPin&&sameBytes(readerPin,witness.originalReader),'original reader is source-bound');
 assert(witness.execution?.method==='physical-isolated-copy-reviewed-two-stage'&&witness.execution.readerExitCode===0,
  'actual descriptor execution with reviewed two-stage base');
 assert(witness.execution.providerManifest?.sha256==='99901ef53e015aef61c7dd3cac84554acc59c0200ac4d187eb733220fbd6c9de',
  'exact independently reviewed provider and relocation');
 const relocation=readJsonPin(root,witness.execution.providerManifest);
 assert(relocation.kind==='nms-l02-p005-two-stage-provider-v2'&&relocation.exactReplacements.length===2,
  'two reviewed compile-only changes');
 let transformed=readPin(root,relocation.originalReader).toString();
 for(const replacement of relocation.exactReplacements){
  assert(replacement.count===1&&transformed.split(replacement.before).length===2,'single exact replacement');
  transformed=transformed.replace(replacement.before,replacement.after);
 }
 assert.equal(transformed,readPin(root,relocation.transformedReader).toString(),'all other original reader bytes unchanged');
 for(const p of [relocation.bundle,relocation.helper,relocation.priorRelocation,relocation.predecessorManifest,
  witness.execution.producerScript,witness.execution.runnerScript])readPin(root,p);
 assert.deepEqual(witness.execution.readerBundle,relocation.bundle,'executed reviewed bundle');
 assert.deepEqual(witness.execution.helper,relocation.helper,'executed reviewed provider');
 for(const support of witness.execution.support)readPin(root,support);
 const transaction=readRegistryTransaction(root);
 verifyBaseWitness(root,relocation.baseWitness,transaction);
 assert(witness.acceptanceEffects&&Object.values(witness.acceptanceEffects).every(value=>value===false),
  'execution does not grant acceptance');
 const descriptor=witness.descriptor;
 assert.deepEqual(readJsonPin(root,witness.descriptorFile),descriptor,'exact executed descriptor output');
 assert(descriptor?.course.moduleCode==='NMS002'&&descriptor.course.lesson===2&&
  descriptor.course.activePageCount===64&&descriptor.course.courseShellCount===0&&descriptor.pages.length===64,
  'complete source lesson descriptor');
 const selected=descriptor.pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 assert(selected.length===54&&new Set(selected).size===54&&descriptor.productBridge.registeredAnimationCount===54,
  'exact predecessor renderer membership');
 assert.deepEqual(descriptor.productBridge.selectedAnimationIds,selected,'descriptor membership order');
 const subset=readJsonPin(root,closure.registration.subset);
 assert(subset.length===54&&new Set(subset.map(row=>row.entry.key)).size===54,'exact registry subset');
 assert.deepEqual([...selected].sort(),subset.map(row=>row.entry.key).sort(),'descriptor and registration membership');
 assert.deepEqual(uniquePins(witness.registrationFreezePins),witness.registrationFreezePins,'canonical registration freeze pins');
 assert.deepEqual(witness.registrationFreezePins.map(pin=>pin.path).sort(),
  [...new Set(subset.map(row=>row.freezeManifest))].sort(),'all predecessor registration freezes included');
 for(const pin of witness.registrationFreezePins)readPin(root,pin);
 for(const previous of subset){
  const calibrations=transaction.registry.calibrations.filter(row=>row.calibrationId===previous.calibrationId);
  assert(calibrations.length===1,'predecessor calibration retained');
  const calibration=calibrations[0],entries=calibration.entries.filter(entry=>entry.key===previous.entry.key);
  assert(entries.length===1,'predecessor entry retained');
  assert.deepEqual(entries[0],previous.entry,'exact predecessor registration');
  assert.equal(calibration.freezeManifest,previous.freezeManifest,'predecessor freeze retained');
  assert(calibration.deploymentScope==='local-only','predecessor remains local only');
  const freeze=witness.registrationFreezePins.find(pin=>pin.path===calibration.freezeManifest);
  assert(freeze&&freeze.sha256===calibration.freezeManifestSha256,'registered freeze matches original evidence');
 }
 return {descriptor,closure,witness,host,transaction};
}

export function verifyNmsL02PageProof(root,proofPin,predecessor,validateSemantics,validateClosure){
 assert(typeof validateSemantics==='function','source-specific semantic validation required');
 assert(typeof validateClosure==='function','source-specific complete closure validation required');
 const proof=readJsonPin(root,proofPin);
 validateClosure(proof);
 assert(proof.schemaVersion===1&&proof.kind==='nms-l02-page-proof-v1'&&
  proof.hostContract===predecessor.host.contract,'independent NMS page proof');
 assert.deepEqual(uniquePins(proof.files),proof.files,'canonical page input closure');
 for(const pin of proof.files)readPin(root,pin);
 for(const item of proof.external){
  assert(!path.isAbsolute(item.pin.path)&&!item.pin.path.split('/').includes('..'),'relative external source pin');
  readSourcePin(root,{...item.pin,path:path.join(item.root,item.pin.path)});
 }
 const packet=readJsonPin(root,proof.freeze);
 assert.deepEqual(proof.packet,packet,'exact immutable page packet');
 const files=new Map(proof.files.map(pin=>[pin.path,pin]));
 for(const pin of [...packet.integrity.files,...Object.values(packet.entry.artifacts).filter(value=>
  value&&typeof value==='object'&&typeof value.path==='string')]){
  assert.deepEqual(files.get(pin.path),pin,'all own packet inputs remain pinned');
 }
 assert(packet.sourceRoot===SOURCE_ROOT,'source custody root');
 for(const pin of [packet.source,packet.sourceXml])assert(proof.external.some(item=>
  item.root===SOURCE_ROOT&&item.pin.path===pin.path&&sameBytes(item.pin,pin)),'exact external source binding');
 const registration=proof.registration;
 const fragment=proof.files.find(pin=>pin.path===proof.freeze.path.replace(/\.json$/u,'.fragment.json'));
 assert(fragment,'exact registration fragment present');
 assert.deepEqual(readJsonPin(root,fragment),registration,'registration fragment matches projected or real transaction');
 assert(registration.entries.length===1&&registration.entries[0].key===proof.animationId,'one new page');
 assert(registration.freezeManifest===proof.freeze.path&&registration.freezeManifestSha256===proof.freeze.sha256,
  'page registration binds its own packet');
 const actual=predecessor.transaction.registry.calibrations.filter(row=>row.calibrationId===registration.calibrationId);
 assert(actual.length===1,'page registration exists');
 assert.deepEqual(actual[0],registration,'exact page registration transaction');
 assert(!predecessor.descriptor.productBridge.selectedAnimationIds.includes(proof.animationId),'new predecessor member only');
 validateSemantics({...packet,freezeManifest:proof.freeze},registration);
 return proof;
}
