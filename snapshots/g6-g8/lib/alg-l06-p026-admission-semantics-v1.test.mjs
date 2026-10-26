import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,uniquePins} from './g678-admission-proof.mjs';
import {ACCEPTANCE,ARTIFACT_PATHS,BINDING,BINDING_PATH,CALIBRATION,
 ENGINEERING_RECEIPT_PATH,FREEZE_PATH,
 ID,PROOF_PATH,SA,SOURCE,SOURCE_ROOT,XML,p026ContinuousSource,
 p026GlossaryActions,p026NativeTextSource,p026OptionalSpanishAudio,
 p026ProposedEntry,p026Runtime,readP026CanonicalSource,readP026SourceEvidence,
 validateP026EngineeringRaw,validateP026EngineeringReceipt,validateP026Page,
 validateP026SourceEvidence,
 validateP026SourcePacket}
 from './alg-l06-p026-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=readP026SourceEvidence(root);
const copy=()=>structuredClone(source);
const raw=()=>{
 const base='output/playwright/alg-l06-p026-candidate-host-v1/',
  read=name=>JSON.parse(readFileSync(path.join(root,base,name)));
 return {nativeMainEn:read('native-final-en.json'),
  nativeMainEs:read('native-final-v2-es.json'),
  controls:read('native-controls-v3.json'),
  navigation:read('native-navigation.json'),
  http:read('http-boundary-v2.json'),responsive:read('responsive-es.json')};
};
function sourceFixture(){
 const canonical=readP026CanonicalSource(root),entry=p026ProposedEntry(root,canonical);
 const freezeManifest={path:FREEZE_PATH,bytes:100,sha256:'a'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:SOURCE,sourceXml:XML,
  selectedPages:[{animationId:ID,placementId:ID,assetId:'swf-'+SOURCE.sha256,
   sourceSha256:SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:26,sourceOccurrence:26,sectionCode:'VB',
   sectionPageOrdinal:16,complexityLane:'interactive-understood',
   runtime:p026Runtime(entry.artifacts)}],entry,
  continuousSource:p026ContinuousSource(canonical),
  optionalSpanishAudio:p026OptionalSpanishAudio(canonical),
  nativeTextSource:p026NativeTextSource(canonical),
  glossaryActions:p026GlossaryActions(canonical),
  integrity:{completeTransitiveClosure:false,
   files:uniquePins([canonical.bindingPin,...canonical.binding.files,
    ...Object.values(entry.artifacts)])},
  acceptanceEffects:ACCEPTANCE,productCalibrationPassed:false,
  scaleOutAuthorized:false,freezeManifest};
 const registration={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:100,
  freezeManifestSha256:'a'.repeat(64),entries:[entry]};
 return {canonical,packet,registration};
}

test('P026 physical source and independent renderer/audio assets have exact pins',()=>{
 assert.equal(ID,'shared-alg001-l06-p026');
 assert.equal(CALIBRATION,'g678-alg-l06-p026-current-js-20261001-v3');
 assert.equal(PROOF_PATH,'work/g678-workflow/candidates/'+ID+'-proof-v3.json');
 assert.equal(BINDING_PATH,
  'output/alg-l06-p026-product-integration-v1/candidate-source-binding-v4.json');
 assert.equal(readPin(SOURCE_ROOT,SOURCE).length,114936);
 assert.equal(readPin(SOURCE_ROOT,XML).length,13926);
 assert.equal(readPin(SOURCE_ROOT,SA).length,120960);
 assert.equal(source.assetPins.canvas.sha256,
  '5f7b9b0cc37cb536113280c5fd35236cc67c9445b9802c86fce354801a742382');
 assert.equal(source.assetPins.main1.sha256,
  'ef1eac21881278a8ad30a2c17fef520f820940bc0941aea533493c4307b5a670');
 assert.equal(source.assetPins.main2.sha256,
  'c2ee52ab31a0ada790a4ac8659c0b703e999d830d6bc5c6b734f57d399c0f4dd');
 assert.equal(source.assetPins.sa.sha256,SA.sha256);
 assert.equal(validateP026SourceEvidence(source),true);
 assert.equal(ARTIFACT_PATHS.module,'packages/demos/src/modules/'+ID+'.tsx');
 assert.equal(ARTIFACT_PATHS.timeline,'packages/demos/src/timelines/'+ID+'.ts');
});

test('root/title/main, 47 text placements, 20 buttons and two masks agree per instance',()=>{
 assert.deepEqual(source.audit.frameDomains.map(row=>[row.id,row.frames]),
  [['root',10],['sprite-2',1],['sprite-55',389]]);
 assert.equal(source.displayList.sprite55.instances.filter(row=>row.kind==='text').length,47);
 assert.equal(source.displayList.sprite55.instances.filter(row=>row.kind==='button').length,20);
 assert.equal(source.native.nativeTextInstanceIds.length,10);
 assert.equal(source.native.canvasFallbackTextInstanceIds.length,37);
 assert.deepEqual(source.canvas.sourceClipMasks.map(row=>
  [row.frame,row.characterId,row.depth,row.clipDepth]),
  [[31,18,15,24],[81,18,25,30]]);
 assert.equal(source.native.glossary.length,20);
 assert.deepEqual(Object.keys(p026GlossaryActions({...source,binding:{native:{}}})),
  ['Independent variable','Function','Input variable','Domain',
   'Dependent variable','Output variable','Range']);
});

test('two main runs, 37-frame visual gap and optional SA remain separate',()=>{
 const binding={audit:source.evidencePins.audit,audioPlan:source.evidencePins.audioPlan,
  browserDecode:source.evidencePins.browserDecode,native:source.evidencePins.native};
 const s={...source,binding};
 const continuous=p026ContinuousSource(s),sa=p026OptionalSpanishAudio(s),
  native=p026NativeTextSource(s);
 assert.deepEqual(continuous.mainRuns.map(row=>row.blockFrameRange),
  [[31,158],[196,389]]);
 assert.deepEqual(continuous.mainRuns.map(row=>row.browserDecodedSamples),
  [232704,356544]);
 assert.deepEqual(continuous.gapFrames,[159,195]);
 assert.deepEqual(continuous.emptyNegativeSeekMarker,
  {frame:158,seekSamples:-2267,payloadBytes:0});
 assert.equal(continuous.concatenated,false);
 assert.equal(sa.trigger,'explicit-user-only');
 assert.equal(sa.localeAutoplay,false);
 assert.equal(sa.mainStreamSpliced,false);
 assert.equal(native.nativeInstanceCount,10);
 assert.deepEqual(native.suppressibleTextIds,[6,12,15,17,20,23,26,27,28,30]);
 assert(Object.values(ACCEPTANCE).every(value=>value===false));
});

test('source evidence rejects altered placement, instance, audio and dictionary semantics',()=>{
 for(const [name,mutate] of [
  ['root placement',e=>{e.audit.frameDomains[0].entryInstances[1].depth=2;}],
  ['text count',e=>{e.audit.text.instances.pop();}],
  ['button instance',e=>{e.native.glossary.pop();}],
  ['native text owner',e=>{e.native.nativeTextInstanceIds.pop();}],
  ['mask clip',e=>{e.native.instances.find(row=>row.objectId===18).clipDepth=23;}],
  ['source key',e=>{e.audit.glossary[6].keyAttribute='Other';}],
  ['button action',e=>{e.native.glossary[0].sourceActionSha256='0'.repeat(64);}],
  ['run gap',e=>{e.audioPlan.gap.frames=[158,195];}],
  ['main asset',e=>{e.audioPlan.mainRanges[1].sourceMp3.sha256='0'.repeat(64);}],
  ['Chrome PCM',e=>{e.browserDecode.results[0].pcmSha256='0'.repeat(64);}],
  ['SA autoplay',e=>{e.audioPlan.optionalSpanishAudio.localeAutoplay=true;}],
  ['dictionary key',e=>{e.crosswalk.entries[0].sourceKeyAttribute='Other';}],
 ]){
  const altered=copy();mutate(altered);
  assert.throws(()=>validateP026SourceEvidence(altered),undefined,name);
 }
});

test('frozen 163-file packet binds staged runtime and the exact five physical sources',()=>{
 const canonical=readP026CanonicalSource(root);
 assert.deepEqual(canonical.bindingPin,BINDING);
 assert.equal(canonical.binding.files.length,163);
 assert.equal(canonical.binding.external.length,5);
 assert.equal(canonical.binding.artifacts.runtime.sha256,source.assetPins.canvas.sha256);
 assert.equal(canonical.binding.acceptanceEffects.published,false);
});

test('source-only proof accepts two-run planning but cannot pass final admission',()=>{
 const {canonical,packet,registration}=sourceFixture();
 assert.equal(validateP026SourcePacket(packet,registration,root,canonical),true);
 assert.throws(()=>validateP026Page(packet,registration,root));
});

test('source packet rejects run, ownership, registration and acceptance drift',()=>{
 const {canonical,packet,registration}=sourceFixture();
 for(const [name,mutate] of [
  ['root domain',p=>{p.selectedPages[0].runtime.rootFrameCount=389;}],
  ['silent gap',p=>{p.continuousSource.gapFrames=[159,194];}],
  ['main stream splice',p=>{p.continuousSource.concatenated=true;}],
  ['Chrome sample pin',p=>{p.continuousSource.mainRuns[1].browserPcmSha256='0'.repeat(64);}],
  ['SA autoplay',p=>{p.optionalSpanishAudio.localeAutoplay=true;}],
  ['text owner',p=>{p.nativeTextSource.nativeInstanceCount=9;}],
  ['missing button instance',p=>{p.glossaryActions.Range.buttonInstanceIds.pop();}],
  ['listening claim',p=>{p.acceptanceEffects.listeningAccepted=true;}],
  ['missing bound input',p=>{p.integrity.files=p.integrity.files.filter(row=>
   row.path!==BINDING.path);}],
  ['registry input',p=>{p.integrity.files.push({path:'packages/demos/private-current-js-registry.json',
   bytes:1,sha256:'0'.repeat(64)});}],
 ]){
  const altered=structuredClone(packet);mutate(altered);
  assert.throws(()=>validateP026SourcePacket(altered,registration,root,canonical),
   undefined,name);
 }
 const changed=structuredClone(registration);
 changed.entries[0].artifacts.runtime.sha256='0'.repeat(64);
 assert.throws(()=>validateP026SourcePacket(packet,changed,root,canonical));
});

test('P026 reader replays real EN/ES main, controls, navigation, HTTP and responsive raw evidence',()=>{
 const canonical=readP026CanonicalSource(root);
 assert.equal(validateP026EngineeringRaw(raw(),canonical),true);
 for(const [name,change] of [
  ['silent gap absent',r=>{r.nativeMainEn.final.audio.trace=
    r.nativeMainEn.final.audio.trace.filter(row=>row.frame!==159);}],
  ['Spanish autoplay',r=>{r.nativeMainEs.initial.saRequests=1;}],
  ['main node manually stopped',r=>{r.nativeMainEn.final.audio.nodes[1].stops.push({});}],
  ['glossary wrong key',r=>{r.controls.glossary[0].key='Other';}],
  ['Return wrong cursor',r=>{r.controls.returned.dataset.p026PlayerFrame='1';}],
  ['navigation context leaked',r=>{r.navigation.previous.events=
    r.navigation.previous.events.filter(event=>event.state!=='closed');}],
  ['HTTP leaked bad request',r=>{r.http.requests[14].status=200;}],
  ['mobile overflow',r=>{r.responsive.layout.documentWidth=391;}],
 ]){
  const changed=raw();change(changed);
  assert.throws(()=>validateP026EngineeringRaw(changed,canonical),undefined,name);
 }
});

test('P026 receipt binds raw files, source-applicability and six stable candidates',()=>{
 const receipt=JSON.parse(readFileSync(path.join(root,ENGINEERING_RECEIPT_PATH))),
  source=readP026CanonicalSource(root),
  checked=validateP026EngineeringReceipt(receipt,root,source);
 assert.equal(checked.artifacts.length,35);
 assert.equal(checked.candidates.length,6);
 assert.deepEqual(pinFile(root,BINDING_PATH),BINDING);
 assert(checked.raw.nativeMainEn.final.audio.trace.some(row=>row.frame===195));
 const claimed=structuredClone(receipt);claimed.cases.nativeMainEs=false;
 assert.throws(()=>validateP026EngineeringReceipt(claimed,root,source));
 const wrongRaw=structuredClone(receipt);
 wrongRaw.raw.nativeMainEs=wrongRaw.raw.nativeMainEn;
 assert.throws(()=>validateP026EngineeringReceipt(wrongRaw,root,source));
 const missingArtifact=structuredClone(receipt);
 missingArtifact.artifacts=missingArtifact.artifacts.filter(pin=>
  pin.path!==receipt.raw.http);
 assert.throws(()=>validateP026EngineeringReceipt(missingArtifact,root,source));
 const wrongStable=structuredClone(receipt);
 wrongStable.stableRuns.navigation.sha256='0'.repeat(64);
 assert.throws(()=>validateP026EngineeringReceipt(wrongStable,root,source));
});
