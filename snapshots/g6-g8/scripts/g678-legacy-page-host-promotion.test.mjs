import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pinFile,readPageProof,verifyHostVersion,verifyLegacyPageHostPromotions,uniquePins,
 LEGACY_PAGE_HOST_PROMOTION_PATHS,LEGACY_PROJECT_EXTERNAL_HOST_PATHS,resolveLegacyPageHostInput} from '../lib/g678-admission-proof.mjs';
import {preservedHostTransitions,preservedPageHostPromotions} from './refresh-g678-admission-host.mjs';
import {proofBrowserInputs} from './lib/g678-stable-browser-candidate-v1.mjs';

const json=value=>JSON.stringify(value,null,2)+'\n';
function put(root,file,value) {
 fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
 fs.writeFileSync(path.join(root,file),typeof value==='string'?value:json(value));return pinFile(root,file);
}
function fixture(t,shared=LEGACY_PAGE_HOST_PROMOTION_PATHS[0]) {
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'g678-page-host-promotion-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const sourceRoot=path.join(root,'external');fs.mkdirSync(sourceRoot);
 const original=put(root,shared,'old maintained shared source');
 const snapshot=put(root,'retained/shared-before.tsx','old maintained shared source');
 const host={schemaVersion:1,kind:'g678-admission-host-v1',contract:'test-v1',
  files:[put(root,'existing-host.ts','host')],replacedRoutes:[]};
 const key='shared-nms002-l07-p007';
 const entry={key,module:`./modules/${key}`,maturity:'private-current-js',artifacts:{
  module:put(root,`packages/demos/src/modules/${key}.tsx`,'module'),
  timeline:put(root,`packages/demos/src/timelines/${key}.ts`,'timeline'),
  runtime:put(root,'work/runtime.js','runtime')}};
 const source=put(sourceRoot,'P007.swf','source'),sourceXml=put(sourceRoot,'index.xml','xml'),
  spanish=put(sourceRoot,'P007.mp3','spanish');
 const packet={schemaVersion:1,selectedPages:[{animationId:key}],entry,sourceRoot,source,sourceXml,
  optionalSpanishAudio:{source:spanish},integrity:{files:uniquePins([original,...Object.values(entry.artifacts)])},acceptanceEffects:{registered:false}};
 const freezeManifest=put(root,'catalog/freeze.json',packet);
 const registration={calibrationId:'fixture',entries:[entry]};
 const files=uniquePins([...packet.integrity.files,freezeManifest]);
 const proof={schemaVersion:1,kind:'g678-page-proof-v1',hostContract:host.contract,animationId:key,
  packet:{...packet,freezeManifest},registration,files,legacyInputs:files,
  external:[source,sourceXml,spanish].map(pin=>({root:sourceRoot,pin}))};
 const proofPin=put(root,'catalog/proof.json',proof),before=fs.readFileSync(path.join(root,proofPin.path));
 const current=put(root,shared,'new maintained shared source');
 return {root,shared,original,snapshot,current,host,entry,proof,proofPin,before,
  transaction:{registry:{calibrations:[registration]}}};
}
function successor(f) {
 const promotions=preservedPageHostPromotions(f.root,f.host,[f.proof],[],[f.shared],
  [{path:f.shared,snapshot:f.snapshot.path}]);
 const host={...f.host,files:uniquePins([...f.host.files,f.current]),legacyPageHostPromotions:promotions};
 return verifyHostVersion(f.root,put(f.root,'catalog/host.json',host));
}

for(const shared of LEGACY_PAGE_HOST_PROMOTION_PATHS) {
 test(`retains old proof bytes while promoting exact reviewed shared input: ${shared}`,t=>{
  const f=fixture(t,shared),host=successor(f);
  assert.deepEqual(readPageProof(f.root,f.proofPin,host,f.transaction),f.proof.packet);
  assert.deepEqual(fs.readFileSync(path.join(f.root,f.proofPin.path)),f.before);
  assert.deepEqual(host.legacyPageHostPromotions[0],{original:f.original,current:f.current,snapshot:f.snapshot});
 });
}
test('an unpromoted old proof cannot use changed shared bytes',t=>{
 const f=fixture(t);assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/current bytes/u);
});
test('missing preservation refuses the old page-owned overlap',t=>{
 const f=fixture(t);assert.throws(()=>preservedPageHostPromotions(f.root,f.host,[f.proof],[],[f.shared]),/exact preservation/u);
});
test('wrong retained bytes refuse host promotion',t=>{
 const f=fixture(t);put(f.root,f.snapshot.path,'wrong bytes');
 assert.throws(()=>successor(f),/exact page-owned bytes/u);
});
test('snapshot tampering is rejected by the direct real proof reader',t=>{
 const f=fixture(t),host=successor(f);put(f.root,f.snapshot.path,'tampered snapshot');
 assert.throws(()=>readPageProof(f.root,f.proofPin,host,f.transaction),/current bytes/u);
});
test('current target tampering is rejected by the direct real proof reader',t=>{
 const f=fixture(t),host=successor(f);put(f.root,f.shared,'tampered current');
 assert.throws(()=>readPageProof(f.root,f.proofPin,host,f.transaction),/current bytes/u);
});
test('promotion target must exactly equal verified host membership',t=>{
 const f=fixture(t),host=successor(f);host.legacyPageHostPromotions[0].current=f.original;
 assert.throws(()=>verifyLegacyPageHostPromotions(f.root,host),/exact promoted current host target/u);
});
test('two historical pins for one path are rejected before selecting a snapshot',t=>{
 const f=fixture(t),second=structuredClone(f.proof);
 second.files=second.files.map(pin=>pin.path===f.shared?{...pin,sha256:'f'.repeat(64)}:pin);
 assert.throws(()=>preservedPageHostPromotions(f.root,f.host,[f.proof,second],[],[f.shared],
  [{path:f.shared,snapshot:f.snapshot.path}]),/conflicting pins/u);
});
test('duplicate promotion entries are rejected',t=>{
 const f=fixture(t),host=successor(f);host.legacyPageHostPromotions.push(structuredClone(host.legacyPageHostPromotions[0]));
 assert.throws(()=>verifyLegacyPageHostPromotions(f.root,host),/one historical pin/u);
});
for(const shared of ['packages/demos/src/modules/arbitrary.tsx','work/source.swf','work/compiler/compile-page.mjs',
 'packages/demos/src/hfr/hfr-native-text.ts','apps/web/components/arbitrary-shared.tsx']) {
 test(`cannot promote an arbitrary source or artifact: ${shared}`,t=>{
  const f=fixture(t,shared);assert.throws(()=>successor(f),/reviewed legacy shared path only/u);
  const forged={...f.host,files:uniquePins([...f.host.files,f.current]),legacyPageHostPromotions:[
   {original:f.original,current:f.current,snapshot:f.snapshot}]};
  assert.throws(()=>verifyLegacyPageHostPromotions(f.root,forged),/reviewed legacy shared path only/u);
 });
}
for (const shared of LEGACY_PAGE_HOST_PROMOTION_PATHS) test(`a page artifact cannot masquerade as an allowlisted shared source: ${shared}`,t=>{
 const f=fixture(t,shared);f.proof.packet.entry.artifacts.module=f.original;
 assert.throws(()=>successor(f),/page artifacts cannot be promoted/u);
});
test('HFR files do not gain a legacy-page promotion exception',t=>{
 const f=fixture(t);f.proof.packet.entry.artifacts.kind='generated-typescript-hfr-v1';
 assert.throws(()=>successor(f),/HFR page inputs cannot use legacy page-host promotion/u);
});
test('proof file cannot substitute a different original pin under a valid host transition',t=>{
 const f=fixture(t),host=successor(f);
 f.proof.files=f.proof.files.map(pin=>pin.path===f.shared?{...pin,sha256:'f'.repeat(64)}:pin);
 const proofPin=put(f.root,f.proofPin.path,f.proof);
 assert.throws(()=>readPageProof(f.root,proofPin,host,f.transaction),/exact historical page-owned shared pin/u);
});
test('a later host refresh retains the original proof and snapshot while updating current target',t=>{
 const f=fixture(t),host=successor(f);put(f.root,f.shared,'next maintained shared source');
 const transitions=preservedPageHostPromotions(f.root,host,[f.proof],[f.shared],[]);
 assert.deepEqual(transitions[0].original,f.original);assert.deepEqual(transitions[0].snapshot,f.snapshot);
 const next={...host,files:uniquePins(host.files.map(pin=>pin.path===f.shared?pinFile(f.root,f.shared):pin)),legacyPageHostPromotions:transitions};
 assert.deepEqual(readPageProof(f.root,f.proofPin,next,f.transaction),f.proof.packet);
 assert.deepEqual(fs.readFileSync(path.join(f.root,f.proofPin.path)),f.before);
});

function externalFixture(t,file=LEGACY_PROJECT_EXTERNAL_HOST_PATHS[0]) {
 const f=fixture(t),host=successor(f),original=put(f.root,file,'old external workspace source'),
  snapshot=put(f.root,'retained/external-before.ts','old external workspace source'),
  current=put(f.root,file,'new external workspace source');
 const external={root:path.dirname(path.join(f.root,file)),pin:{...original,path:path.basename(file)}};
 f.proof.external.push(external);f.proofPin=put(f.root,f.proofPin.path,f.proof);f.before=fs.readFileSync(path.join(f.root,f.proofPin.path));
 host.files=uniquePins([...host.files,current]);host.legacyInputTransitions=[{original,current,snapshot}];
 return {...f,host,external,originalExternal:original,currentExternal:current,snapshotExternal:snapshot};
}
for(const file of LEGACY_PROJECT_EXTERNAL_HOST_PATHS) {
 test(`exact physical workspace external uses retained host transition: ${file}`,t=>{
  const f=externalFixture(t,file);
  assert.deepEqual(readPageProof(f.root,f.proofPin,f.host,f.transaction),f.proof.packet);
  assert.deepEqual(fs.readFileSync(path.join(f.root,f.proofPin.path)),f.before);
 });
}
test('workspace-root plus exact relative path also identifies the same physical shared source',t=>{
 const f=externalFixture(t);f.external.root=f.root;f.external.pin.path=f.originalExternal.path;
 f.proofPin=put(f.root,f.proofPin.path,f.proof);
 assert.deepEqual(readPageProof(f.root,f.proofPin,f.host,f.transaction),f.proof.packet);
});
test('an exact external shared source can use the dedicated page-host promotion',t=>{
 const f=externalFixture(t,'scripts/upsert-private-current-js-calibration.mjs');
 f.host.legacyPageHostPromotions.push(f.host.legacyInputTransitions[0]);f.host.legacyInputTransitions=[];
 assert.deepEqual(readPageProof(f.root,f.proofPin,f.host,f.transaction),f.proof.packet);
});
test('a missing external-host transition keeps changed workspace sources strict',t=>{
 const f=externalFixture(t);f.host.legacyInputTransitions=[];
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/exact historical external-host transition required/u);
});
test('descriptive role metadata preserves exact external file identity',t=>{
 const f=externalFixture(t,'packages/demos/src/decoded-source-stream-transport.ts');
 f.external.pin.role='shared-read-only';f.proofPin=put(f.root,f.proofPin.path,f.proof);
 const before=fs.readFileSync(path.join(f.root,f.proofPin.path));
 assert.deepEqual(readPageProof(f.root,f.proofPin,f.host,f.transaction),f.proof.packet);
 assert.deepEqual(fs.readFileSync(path.join(f.root,f.proofPin.path)),before);
 f.external.pin.sha256='f'.repeat(64);f.proofPin=put(f.root,f.proofPin.path,f.proof);
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/exact historical external-host transition required/u);
});
test('a shared-read-only label cannot authorize an arbitrary external path',t=>{
 const f=externalFixture(t,'packages/demos/src/extra.ts');
 f.external.pin.role='shared-read-only';f.proofPin=put(f.root,f.proofPin.path,f.proof);
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/current bytes: extra.ts/u);
});
test('a different external original pin cannot borrow a path-matching transition',t=>{
 const f=externalFixture(t);f.external.pin.sha256='f'.repeat(64);f.proofPin=put(f.root,f.proofPin.path,f.proof);
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/exact historical external-host transition required/u);
});
test('a forged current target fails external shared resolution',t=>{
 const f=externalFixture(t);f.host.legacyInputTransitions[0].current=f.originalExternal;
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/exact historical external current host target/u);
});
test('historical external snapshot bytes are actually read',t=>{
 const f=externalFixture(t);put(f.root,f.snapshotExternal.path,'tampered');
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/current bytes/u);
});
test('an arbitrary extra project-local path cannot use external-host resolution',t=>{
 const f=externalFixture(t,'packages/demos/src/extra.ts');
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/current bytes: extra.ts/u);
});
test('a same-named external source outside this workspace cannot borrow its transition',t=>{
 const f=externalFixture(t);const outside=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'g678-outside-source-')));
 t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));
 put(outside,'contract.ts','new external workspace source');f.external.root=outside;f.proofPin=put(f.root,f.proofPin.path,f.proof);
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/current bytes: contract.ts/u);
});
test('a traversal spelling of an allowlisted path is still rejected',t=>{
 const f=externalFixture(t);f.external.pin.path='../src/contract.ts';f.proofPin=put(f.root,f.proofPin.path,f.proof);
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/bounded relative path/u);
});
test('a symlink cannot stand in for the current shared source',t=>{
 const f=externalFixture(t),file=path.join(f.root,f.originalExternal.path);
 fs.renameSync(file,`${file}.actual`);fs.symlinkSync(`${file}.actual`,file);
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/physical path/u);
});
test('a symlink source root cannot gain the external-host exception',t=>{
 const f=externalFixture(t),link=path.join(f.root,'linked-src');fs.symlinkSync(f.external.root,link,'dir');
 f.external.root=link;f.proofPin=put(f.root,f.proofPin.path,f.proof);
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/physical path/u);
});
test('a duplicate exact transition is ambiguous and rejected',t=>{
 const f=externalFixture(t);f.host.legacyInputTransitions.push(structuredClone(f.host.legacyInputTransitions[0]));
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/exact historical external-host transition required/u);
});
test('a real SWF remains strict with an otherwise valid external-host transition',t=>{
 const f=externalFixture(t),source=f.proof.packet.source;put(f.proof.packet.sourceRoot,source.path,'changed SWF');
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/current bytes: P007.swf/u);
});

function generationsFixture(t) {
 const f=fixture(t),base=successor(f),file='shared-contract.js';
 const oldest=put(f.root,file,'oldest shared source'),firstSnapshot=put(f.root,'retained/first.js','oldest shared source');
 const middle=put(f.root,file,'intermediate shared source'),secondSnapshot=put(f.root,'retained/second.js','intermediate shared source');
 const predecessor={...base,files:uniquePins([...base.files,middle]),legacyInputTransitions:[{original:oldest,current:middle,snapshot:firstSnapshot}]};
 const current=put(f.root,file,'current shared source');
 const transitions=preservedHostTransitions(f.root,predecessor,[file],[{path:file,snapshot:secondSnapshot.path}]);
 const host={...predecessor,files:uniquePins(predecessor.files.map(pin=>pin.path===file?current:pin)),legacyInputTransitions:transitions};
 function proofAt(original,label) {
  const {freezeManifest:prior,...packet}=structuredClone(f.proof.packet);
  packet.integrity.files=uniquePins([...packet.integrity.files,original]);
  const freezeManifest=put(f.root,`catalog/freeze-${label}.json`,packet);
  const files=uniquePins([...f.proof.files.filter(pin=>pin.path!==prior.path),freezeManifest]);
  const proof={...f.proof,packet:{...packet,freezeManifest},files,legacyInputs:uniquePins([...files,original])};
  return put(f.root,`catalog/proof-${label}.json`,proof);
 }
 return {...f,host,predecessor,file,oldest,middle,current,firstSnapshot,secondSnapshot,
  oldestProof:proofAt(oldest,'oldest'),middleProof:proofAt(middle,'middle')};
}
function retainedHostFileFixture(t) {
 const f=externalFixture(t,'lib/g678-admission-proof.mjs');
 f.proof.files=uniquePins([...f.proof.files,f.originalExternal]);
 f.proof.legacyInputs=uniquePins([...f.proof.legacyInputs,f.originalExternal]);
 f.proofPin=put(f.root,f.proofPin.path,f.proof);return f;
}
test('already host-owned legacy file uses its exact retained transition in reader and browser watch',t=>{
 const f=retainedHostFileFixture(t),before=fs.readFileSync(path.join(f.root,f.proofPin.path));
 assert.deepEqual(readPageProof(f.root,f.proofPin,f.host,f.transaction),f.proof.packet);
 const watch=proofBrowserInputs(f.root,f.host,[f.proof]);
 assert(watch.files.some(p=>p.path===f.currentExternal.path&&p.sha256===f.currentExternal.sha256));
 assert(watch.files.some(p=>p.path===f.snapshotExternal.path&&p.sha256===f.originalExternal.sha256));
 assert(!watch.files.some(p=>p.path===f.originalExternal.path&&p.sha256===f.originalExternal.sha256));
 assert.deepEqual(fs.readFileSync(path.join(f.root,f.proofPin.path)),before);
});
test('already host-owned legacy file still requires an exact transition and untampered witness',t=>{
 const f=retainedHostFileFixture(t),transitions=f.host.legacyInputTransitions;
 f.host.legacyInputTransitions=[];
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/exact historical external-host transition required/u);
 f.host.legacyInputTransitions=transitions;put(f.root,f.snapshotExternal.path,'tampered');
 assert.throws(()=>readPageProof(f.root,f.proofPin,f.host,f.transaction),/current bytes/u);
});
test('a host-owned file spelling never exempts an actual artifact or HFR input',t=>{
 const f=retainedHostFileFixture(t),packet=structuredClone(f.proof.packet);
 packet.entry.artifacts.module=f.originalExternal;
 assert.throws(()=>resolveLegacyPageHostInput(f.root,f.originalExternal,new Map(),packet.entry,f.host,packet),/page artifacts cannot be promoted/u);
 packet.entry=f.proof.packet.entry;packet.entry={...packet.entry,artifacts:{...packet.entry.artifacts,kind:'generated-typescript-hfr-v1'}};
 assert.throws(()=>resolveLegacyPageHostInput(f.root,f.originalExternal,new Map(),packet.entry,f.host,packet),/HFR sources cannot use historical external-host repair|HFR/u);
});
test('oldest and intermediate proofs both use their exact retained host generation',t=>{
 const f=generationsFixture(t);assert.equal(f.host.legacyInputTransitions.length,2);
 for(const pin of [f.oldestProof,f.middleProof]) {
  const bytes=fs.readFileSync(path.join(f.root,pin.path));readPageProof(f.root,pin,f.host,f.transaction);
  assert.deepEqual(fs.readFileSync(path.join(f.root,pin.path)),bytes);
 }
 assert.deepEqual(f.host.legacyInputTransitions.map(t=>t.original),[f.oldest,f.middle]);
 assert(f.host.legacyInputTransitions.every(t=>t.current.sha256===f.current.sha256));
});
test('multi-generation current drift is rejected even by a direct reader',t=>{
 const f=generationsFixture(t);put(f.root,f.file,'tampered current');
 for(const pin of [f.oldestProof,f.middleProof])assert.throws(()=>readPageProof(f.root,pin,f.host,f.transaction),/current bytes: shared-contract.js/u);
});
test('each host generation requires its own real witness',t=>{
 const f=generationsFixture(t);put(f.root,f.secondSnapshot.path,'wrong intermediate witness');
 assert.throws(()=>readPageProof(f.root,f.middleProof,f.host,f.transaction),/current bytes: retained\/second.js/u);
 assert.throws(()=>preservedHostTransitions(f.root,f.host,[]),/current bytes: retained\/second.js/u);
});
test('duplicate exact host generations are rejected by reader and refresh',t=>{
 const f=generationsFixture(t);f.host.legacyInputTransitions.push(structuredClone(f.host.legacyInputTransitions[1]));
 assert.throws(()=>readPageProof(f.root,f.middleProof,f.host,f.transaction),/one exact reviewed legacy input transition/u);
 assert.throws(()=>preservedHostTransitions(f.root,f.host,[]),/one transition per exact historical host pin/u);
});
test('subsequent refresh updates every generation and appends only a new exact predecessor',t=>{
 const f=generationsFixture(t),thirdSnapshot=put(f.root,'retained/third.js','current shared source');
 put(f.root,f.file,'fourth shared source');
 const transitions=preservedHostTransitions(f.root,f.host,[f.file],[{path:f.file,snapshot:thirdSnapshot.path}]);
 assert.equal(transitions.length,3);assert.deepEqual(transitions.map(t=>t.original),[f.oldest,f.middle,f.current]);
 assert(transitions.every(t=>t.current.sha256===pinFile(f.root,f.file).sha256));
 const next={...f.host,files:uniquePins(f.host.files.map(pin=>pin.path===f.file?pinFile(f.root,f.file):pin)),legacyInputTransitions:transitions};
 assert.equal(preservedHostTransitions(f.root,next,[]).length,3);
});
test('an unchanged historical route transition is retained after its host membership ends',t=>{
 const f=generationsFixture(t),host={...f.host,files:f.host.files.filter(pin=>pin.path!==f.file)};
 assert.deepEqual(preservedHostTransitions(f.root,host,[]),f.host.legacyInputTransitions);
 assert.throws(()=>preservedHostTransitions(f.root,host,[f.file]),/changed transition belongs to predecessor host/u);
 put(f.root,f.secondSnapshot.path,'wrong historical route snapshot');
 assert.throws(()=>preservedHostTransitions(f.root,host,[]),/current bytes/u);
});
