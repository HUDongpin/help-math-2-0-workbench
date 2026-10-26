// Portable maintained HFR contract tests. All data is synthetic and created
// under os.tmpdir(); no local workbench artifacts or source corpus are required.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, realpathSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {validateFragment, synchronizePrivateCurrentJsCalibration} from './upsert-private-current-js-calibration.mjs';
import {privateCurrentJsCalibrationDeploymentScope, upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {preflightRegistration} from './lib/g678-registration-preflight-v1.mjs';
import {registrySources, admissionArtifactPins, admissionSourcePins, readPageProof, verifyHostVersion, uniquePins} from '../lib/g678-admission-proof.mjs';
import {validateAdmissionBinding as validateV2} from './check-private-current-js-admission-registry-v2.mjs';
import {validateAdmissionBinding as validateV3} from './check-private-current-js-admission-registry-v3.mjs';
import * as renderer from '../packages/demos/scripts/generate-registry.mjs';
import {HFR_ARTIFACT_KIND, hfrRegistrationMetadata, validateHfrArtifactClosure} from './lib/hfr-artifact-binding-v1.mjs';
import {transformSync} from 'esbuild';
import {preservedHostTransitions} from './refresh-g678-admission-host.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const pin = (root, file) => {const bytes=readFileSync(path.join(root,file));return {path:file,bytes:bytes.length,sha256:sha256(bytes)};};
const put = (root, file, bytes) => {mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),bytes);return pin(root,file);};
const blankRegistry = {schemaVersion:2,registryScope:'private-engineering',calibrations:[]};
function oldCalibration() {
  const key='shared-alg001-l01-p001';
  return {calibrationId:'fixture-old-canvas',deploymentScope:'local-only',
    freezeManifest:'catalog/product-bridge-calibrations/fixture-old-canvas.json',
    freezeManifestBytes:10,freezeManifestSha256:'f'.repeat(64),entries:[{
      key,module:`./modules/${key}`,maturity:'private-current-js',complexityLane:'low',
      artifacts:{module:{path:`packages/demos/src/modules/${key}.tsx`,bytes:10,sha256:'a'.repeat(64)},
        timeline:{path:`packages/demos/src/timelines/${key}.ts`,bytes:10,sha256:'b'.repeat(64)},
        runtime:{path:`work/g678-shared-page-factory/old/members/${key}/canvas-renderer.js`,bytes:10,sha256:'c'.repeat(64)}}}]};
}
function fixture(t) {
  const base=realpathSync(mkdtempSync(path.join(os.tmpdir(),'hfr-artifact-contract-'))),root=path.join(base,'project'),sourceRoot=path.join(base,'source');
  mkdirSync(root,{recursive:true});mkdirSync(sourceRoot,{recursive:true});
  t.after(()=>rmSync(base,{recursive:true,force:true}));
  const key='shared-nms002-l07-p027',calibrationId='fixture-hfr-new';
  const pageRoot=`work/g678-shared-page-factory/hfr-ts-fixture-v1/members/${key}`;
  const source=put(sourceRoot,'NMS002/L7/IN/P027.swf','synthetic source bytes; not a converted page');
  const sourceXml=put(sourceRoot,'NMS002/L7/index.xml','<Lesson><Page file="IN/P027.swf"/></Lesson>');
  const spanish=put(sourceRoot,'NMS002/L7/SA/P027.mp3','synthetic Spanish bytes');
  const member={animationId:key,placementId:key,ordinal:27,sectionCode:'IN',releaseRole:'active-xml-referenced-page',
    source:{path:`HELP_COURSES/${source.path}`,sha256:source.sha256}};
  const catalog={schemaVersion:1,releases:[{moduleCode:'NMS002',moduleLesson:7,
    sourceLesson:{...sourceXml,path:`G6-G8-shared/${sourceXml.path}`},members:[member]}]};
  const data={schema:'hfr-page/1',compiler:'hfr-compile 0.1.1-candidate',
    placement:{animationId:key,module:'NMS002',lesson:7,ordinal:27,sectionCode:'IN'},
    source:{...source,path:member.source.path,swfVersion:6},module:`${key}.js`,
    dictionary:{'1':{kind:'bitmap',src:'media/image.png'},'2':{kind:'sound',src:'media/audio.mp3'}},
    streams:[],spanishAudio:'media/spanish.mp3'};
  const module=put(root,`packages/demos/src/modules/${key}.tsx`,'export default {syntheticContractFixture: true};\n');
  const generated=put(root,`packages/demos/src/hfr-pages/${key}.ts`,'export default function page() { return {}; }\n');
  const dataPin=put(root,`${pageRoot}/${key}.data.json`,json(data));
  const media=[put(root,`${pageRoot}/media/audio.mp3`,'sound'),put(root,`${pageRoot}/media/image.png`,'bitmap'),
    put(root,`${pageRoot}/media/spanish.mp3`,'synthetic Spanish bytes')].sort((a,b)=>a.path.localeCompare(b.path));
  const compiler=['compile-lesson.mjs','compile-page.mjs','decompile.mjs','media.mjs','swf.mjs']
    .map(name=>{
      const bytes=`// synthetic compiler ${name}\n`;
      put(root,`work/hfr-typescript/hfr/compiler/${name}`,bytes);
      return put(root,`work/g678-shared-page-factory/hfr-ts-fixture-v1/compiler/${name}`,bytes);
    });
  const runtime=['audio.ts','avm.ts','display.ts','helpers.ts','host-bridge.ts','player.ts','render.ts','renderer.tsx','session.ts','types.ts']
    .map(name=>put(root,`packages/demos/src/hfr/${name}`,`// synthetic runtime ${name}\n`));
  const host=['contract.ts','lesson-host-contract.ts'].map(name=>put(root,`packages/demos/src/${name}`,`// synthetic ${name}\n`));
  const closure={schemaVersion:1,kind:'hfr-typescript-artifact-closure-v1',animationId:key,deploymentScope:'local-only',
    sourceRoot,source,sourceXml,sourceAudio:[spanish],releaseManifest:put(root,'catalog/g678-page-only-release-manifest.v1.json',json(catalog)),
    module,generated,data:dataPin,compiler,runtime,host,media};
  const entry={key,module:`./modules/${key}`,maturity:'private-current-js',complexityLane:'interactive-understood',
    artifacts:{kind:HFR_ARTIFACT_KIND,module,generated,data:dataPin,closure:null}};
  const freeze={schemaVersion:1,calibrationId,deploymentScope:'local-only',sourceRoot,source,sourceXml,
    selectedPages:[{animationId:key,complexityLane:entry.complexityLane,runtime:{rendererBinding:null}}]};
  const calibration={calibrationId,deploymentScope:'local-only',freezeManifest:`catalog/product-bridge-calibrations/${calibrationId}.json`,
    freezeManifestBytes:0,freezeManifestSha256:'',entries:[entry]};
  const seal=()=>{
    entry.artifacts.closure=put(root,`${pageRoot}/artifact-closure.json`,json(closure));
    freeze.selectedPages[0].runtime.rendererBinding=structuredClone(entry.artifacts);
    const f=put(root,calibration.freezeManifest,json(freeze));calibration.freezeManifestBytes=f.bytes;calibration.freezeManifestSha256=f.sha256;
    put(root,'work/fragment.json',json(calibration));
  };
  seal();
  const registry={...blankRegistry,calibrations:[oldCalibration()]};
  put(root,'packages/demos/private-current-js-registry.json',json(registry));
  const generatedRegistry=registrySources(registry);
  ['registry.local-only.generated.ts','registry.local-only.metadata.generated.ts'].forEach((name,i)=>put(root,`packages/demos/src/${name}`,generatedRegistry[i]));
  return {root,sourceRoot,key,calibration,entry,freeze,closure,data,pageRoot,seal,registry,
    repinData:()=>{closure.data=put(root,entry.artifacts.data.path,json(data));entry.artifacts.data=closure.data;seal();}};
}

test('the real writer validates the complete HFR fixture source and artifact closure',async t=>{
  const f=fixture(t);
  const result=await validateFragment(f.root,f.calibration);
  assert.deepEqual(result.entryArtifacts.get(f.key),f.entry.artifacts);
  assert.equal(result.deploymentScope,'local-only');
  assert.equal(validateV2(f.calibration,f.freeze,f.entry,'local-only').animationId,f.key);
  assert.equal(validateV3(f.calibration,f.freeze,f.entry,'local-only').animationId,f.key);
  const closure=validateHfrArtifactClosure(f.root,f.calibration,f.entry,f.freeze);
  assert.equal(closure.external.length,3);assert.equal(closure.files.length,25);
  assert.equal(admissionArtifactPins(f.entry).length,4);
  assert.deepEqual(admissionSourcePins({...f.freeze,entry:f.entry}),[f.closure.source,f.closure.sourceXml]);
});

for(const [name,target] of [['SWF source','source'],['XML source','sourceXml'],['source Spanish audio','sourceAudio'],
  ['generated TypeScript','generated'],['compiler','compiler'],['runtime','runtime'],['shared host contract','host'],['generated media','media']]) {
  test(`${name} byte drift is rejected by the real writer`,async t=>{
    const f=fixture(t);let targetPin=f.closure[target];if(Array.isArray(targetPin))targetPin=targetPin[0];
    const root=target.startsWith('source')?f.sourceRoot:f.root;
    writeFileSync(path.join(root,targetPin.path),'changed bytes');
    if(target==='runtime'||target==='host')
      await assert.rejects(synchronizePrivateCurrentJsCalibration({root:f.root,calibrationPath:'work/fragment.json',check:false}),/bytes drifted/u);
    else await assert.rejects(validateFragment(f.root,f.calibration),/bytes drifted/u);
  });
}
test('missing generated media fails; a supplied hash is not a substitute for bytes',async t=>{
  const f=fixture(t);rmSync(path.join(f.root,f.closure.media[0].path));
  await assert.rejects(validateFragment(f.root,f.calibration),/ENOENT|complete media directory/u);
});
test('omitting runtime source from a freshly sealed declaration does not hide it',async t=>{
  const f=fixture(t);f.closure.runtime.pop();f.seal();
  await assert.rejects(synchronizePrivateCurrentJsCalibration({root:f.root,calibrationPath:'work/fragment.json',check:false}),/complete source membership/u);
});
test('unreferenced extra media is rejected from the private asset directory',async t=>{
  const f=fixture(t);put(f.root,`${f.pageRoot}/media/undeclared.mp3`,'extra');
  await assert.rejects(validateFragment(f.root,f.calibration),/complete media directory/u);
});
test('external URL or unlisted media in generated data cannot escape the closure',async t=>{
  const f=fixture(t);f.data.dictionary['1'].src='https://example.invalid/image.png';f.repinData();
  await assert.rejects(validateFragment(f.root,f.calibration),/private media reference/u);
});
test('a rehashed data file must still have the exact catalog placement and SWF identity',async t=>{
  const f=fixture(t);f.data.placement.animationId='shared-nms002-l07-p028';f.repinData();
  await assert.rejects(validateFragment(f.root,f.calibration),/generated data\/source identity drifted/u);
});
test('a symlink cannot stand in for source bytes',async t=>{
  const f=fixture(t),file=path.join(f.sourceRoot,f.closure.source.path);
  const bytes=readFileSync(file);rmSync(file);const alternative=put(f.sourceRoot,'elsewhere.swf',bytes);
  symlinkSync(path.join(f.sourceRoot,alternative.path),file);
  await assert.rejects(validateFragment(f.root,f.calibration),/physical file path/u);
});
test('HFR cannot use bundled, missing, or unknown deployment scopes',async t=>{
  const f=fixture(t);
  for(const scope of ['bundled',undefined,'production']) {
    const c=structuredClone(f.calibration);if(scope===undefined)delete c.deploymentScope;else c.deploymentScope=scope;
    assert.throws(()=>privateCurrentJsCalibrationDeploymentScope(c),/local-only|deploymentScope/u);
    const frozen=structuredClone(f.freeze);if(scope===undefined)delete frozen.deploymentScope;else frozen.deploymentScope=scope;
    put(f.root,c.freezeManifest,json(frozen));
    await assert.rejects(validateFragment(f.root,c),/local-only|deploymentScope/u);
  }
});
test('HFR private data may not be rebound under public or another page',t=>{
  const f=fixture(t);
  for(const file of ['public/hfr/page.data.json',f.entry.artifacts.data.path.replace('p027','p028')]) {
    const c=structuredClone(f.calibration);c.entries[0].artifacts.data.path=file;
    assert.throws(()=>upsertPrivateCurrentJsCalibration(blankRegistry,c),/private page artifact paths/u);
  }
});
test('the existing preflight consumes writer and dispatch contracts without changing registry files',async t=>{
  const f=fixture(t),before=readFileSync(path.join(f.root,'packages/demos/private-current-js-registry.json'));
  const result=await preflightRegistration({root:f.root,fragment:f.calibration,exact:true});
  assert.equal(result.status,'registration-contract-passed');assert.equal(result.registered,false);
  assert.deepEqual(readFileSync(path.join(f.root,'packages/demos/private-current-js-registry.json')),before);
});
test('real writer adds only the new fixture and preserves every previous registration',async t=>{
  const f=fixture(t);const result=await synchronizePrivateCurrentJsCalibration({root:f.root,calibrationPath:'work/fragment.json',check:false});
  assert.equal(result.mode,'write');
  const updated=JSON.parse(readFileSync(path.join(f.root,'packages/demos/private-current-js-registry.json')));
  assert.deepEqual(updated.calibrations.find(c=>c.calibrationId===f.registry.calibrations[0].calibrationId),f.registry.calibrations[0]);
  assert.equal(updated.calibrations.length,2);
  assert.equal((await synchronizePrivateCurrentJsCalibration({root:f.root,calibrationPath:'work/fragment.json',check:true})).mode,'check');
});
test('HFR cannot replace an existing calibration, mutate its own existing pins, or reuse another key',t=>{
  const f=fixture(t),existing=upsertPrivateCurrentJsCalibration(f.registry,f.calibration);
  const replaceOld=structuredClone(f.calibration);replaceOld.calibrationId=f.registry.calibrations[0].calibrationId;
  assert.throws(()=>upsertPrivateCurrentJsCalibration(f.registry,replaceOld),/cannot replace/u);
  const changed=structuredClone(f.calibration);changed.entries[0].artifacts.generated.sha256='0'.repeat(64);
  assert.throws(()=>upsertPrivateCurrentJsCalibration(existing,changed),/cannot replace/u);
  const duplicate=structuredClone(f.calibration);duplicate.calibrationId+='-other';
  assert.throws(()=>upsertPrivateCurrentJsCalibration(existing,duplicate),/duplicate private Current-JS animation key/u);
  const retagged={...structuredClone(f.calibration),deploymentScope:'bundled'};delete retagged.entries[0].artifacts;
  assert.throws(()=>upsertPrivateCurrentJsCalibration(existing,retagged),/cannot replace/u);
});
test('production dispatch stays empty and HFR metadata never pretends to be a canvas timeline',t=>{
  const f=fixture(t),entry={...f.entry,scope:'private-engineering',calibrationId:f.calibration.calibrationId,
    deploymentScope:'local-only',freezeManifestSha256:f.calibration.freezeManifestSha256,
    moduleSha256:f.entry.artifacts.module.sha256,...hfrRegistrationMetadata(f.entry)};
  for(const fn of ['renderRegistrySource','renderRegistryMetadataSource'])assert(!renderer[fn]([entry]).includes(f.key));
  for(const fn of ['renderLocalOnlyRegistrySource','renderLocalOnlyRegistryMetadataSource']) {
    const source=renderer[fn]([entry]);assert(source.includes('generatedModuleSha256'));assert(!source.includes('timelineSha256'));
    const js=transformSync(source,{loader:'ts',format:'cjs'}).code,m={exports:{}};
    new Function('module','exports','process',js)(m,m.exports,{env:{NODE_ENV:'production'}});
    for(const value of Object.values(m.exports))assert.equal(Object.keys(value).length,0);
  }
});
test('the actual writer retains canvas and maintained-DOM artifact semantics',async t=>{
  const f=fixture(t),canvas=oldCalibration(),ce=canvas.entries[0];
  for(const [kind,binding] of Object.entries(ce.artifacts))ce.artifacts[kind]=put(f.root,binding.path,`old ${kind}`);
  const canvasFreeze={schemaVersion:1,calibrationId:canvas.calibrationId,deploymentScope:'local-only',
    selectedPages:[{animationId:ce.key,complexityLane:ce.complexityLane,runtime:{canvasRenderer:ce.artifacts.runtime}}]};
  const cf=put(f.root,canvas.freezeManifest,json(canvasFreeze));canvas.freezeManifestBytes=cf.bytes;canvas.freezeManifestSha256=cf.sha256;
  assert.deepEqual((await validateFragment(f.root,canvas)).entryArtifacts.get(ce.key),ce.artifacts);
  assert.equal(privateCurrentJsCalibrationDeploymentScope(canvas),'local-only');
  const key='shared-alg001-l11-p006',run='work/g678-shared-page-factory/old-dom',calibrationId='fixture-old-dom';
  const artifacts={kind:'maintained-dom-module-v1',
    module:put(f.root,'packages/demos/src/modules/g678-old-dom-p006.tsx','old DOM module'),
    timeline:put(f.root,'packages/demos/src/timelines/g678-old-dom-p006.ts','old DOM timeline'),
    memberManifest:put(f.root,`${run}/members/${key}/member-manifest.json`,'old member'),
    sourceRun:put(f.root,`${run}/run-manifest.json`,'old run')};
  const entry={key,module:'./modules/g678-old-dom-p006',maturity:'private-current-js',complexityLane:'interactive-understood',artifacts};
  const freeze={schemaVersion:1,calibrationId,deploymentScope:'local-only',selectedPages:[{animationId:key,
    complexityLane:entry.complexityLane,runtime:{rendererBinding:artifacts}}]};
  const freezePin=put(f.root,`catalog/product-bridge-calibrations/${calibrationId}.json`,json(freeze));
  const calibration={calibrationId,deploymentScope:'local-only',freezeManifest:freezePin.path,
    freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,entries:[entry]};
  assert.deepEqual((await validateFragment(f.root,calibration)).entryArtifacts.get(key),artifacts);
  assert.equal(privateCurrentJsCalibrationDeploymentScope(calibration),'local-only');
});

function proofFixture(t,{extraSharedPaths=[]}={}) {
  const f=fixture(t),closure=validateHfrArtifactClosure(f.root,f.calibration,f.entry,f.freeze);
  const extraShared=extraSharedPaths.map(file=>put(f.root,file,'// original outside HFR shared dependency\n'));
  f.freeze.entry=structuredClone(f.entry);
  f.freeze.integrity={files:uniquePins([...closure.files,...extraShared])};
  f.freeze.acceptanceEffects={currentJavaScriptRegistered:false,originalRuntimeAccepted:false,
    audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
  f.seal();
  const freezePin=pin(f.root,f.calibration.freezeManifest),packet={...structuredClone(f.freeze),freezeManifest:freezePin};
  const shared=uniquePins([...f.closure.runtime,...f.closure.host,...extraShared]);
  const host={schemaVersion:1,kind:'g678-admission-host-v1',contract:'source-native-current-js-v1',
    files:shared,replacedRoutes:[],historicalRoutes:[],legacyInputTransitions:[]};
  const hostPin=put(f.root,'catalog/g678-admission-v1/host-fixture-v1.json',json(host));
  const legacyInputs=uniquePins([...closure.files,...extraShared,freezePin]),sharedPaths=new Set(shared.map(p=>p.path));
  const proof={schemaVersion:1,kind:'g678-page-proof-v1',hostContract:host.contract,animationId:f.key,
    packet,registration:structuredClone(f.calibration),legacyInputs,
    files:legacyInputs.filter(p=>!sharedPaths.has(p.path)),external:closure.external};
  const proofPin=put(f.root,'work/g678-workflow/candidates/hfr-fixture-proof-v1.json',json(proof));
  const transaction={registry:upsertPrivateCurrentJsCalibration(f.registry,f.calibration),sha256:'fixture'};
  const read=(nextHostPin=hostPin)=>readPageProof(f.root,proofPin,verifyHostVersion(f.root,nextHostPin),transaction);
  assert.deepEqual(read(),packet);
  return {...f,host,hostPin,proof,proofPin,transaction,read,extraShared};
}
function successor(f,{added=false,changed=false,pinToChange}={}) {
  const target=pinToChange??f.closure.runtime.find(p=>p.path.endsWith('/helpers.ts'));
  const preserved=[];
  if(changed) {
    const snapshot=put(f.root,'catalog/g678-admission-v1/snapshots/hfr-fixture-helpers-v1.ts',readFileSync(path.join(f.root,target.path)));
    put(f.root,target.path,'// reviewed successor helper implementation\n');
    preserved.push({path:target.path,snapshot:snapshot.path});
  }
  const extra=added?[put(f.root,'packages/demos/src/hfr/reviewed-extra.ts','// reviewed added shared file\n')]:[];
  const transitions=preservedHostTransitions(f.root,f.host,changed?[target.path]:[],preserved);
  const host={...f.host,previous:f.hostPin,
    files:uniquePins([...f.host.files.map(p=>changed&&p.path===target.path?pin(f.root,p.path):p),...extra]),
    legacyInputTransitions:transitions};
  return {host,target,hostPin:put(f.root,'catalog/g678-admission-v1/host-fixture-v2.json',json(host))};
}

test('an unchanged HFR proof accepts an added file in a verified shared host version',t=>{
  const f=proofFixture(t),before=pin(f.root,f.proofPin.path),next=successor(f,{added:true});
  assert.deepEqual(f.read(next.hostPin),f.proof.packet);
  assert.deepEqual(pin(f.root,f.proofPin.path),before);
});
test('an unchanged HFR proof uses the existing exact shared-host snapshot transition',t=>{
  const f=proofFixture(t),before=pin(f.root,f.proofPin.path),next=successor(f,{changed:true});
  assert.deepEqual(f.read(next.hostPin),f.proof.packet);
  assert.deepEqual(pin(f.root,f.proofPin.path),before);
});

test('a shared host contract change uses the same existing snapshot mapping',t=>{
  const f=proofFixture(t),next=successor(f,{changed:true,pinToChange:f.closure.host[0]});
  assert.deepEqual(f.read(next.hostPin),f.proof.packet);
});
test('an unpinned extra shared runtime source is rejected by the current host membership',t=>{
  const f=proofFixture(t);put(f.root,'packages/demos/src/hfr/unreviewed.ts','// unpinned shared source\n');
  assert.throws(()=>f.read(),/current host covers complete runtime membership/u);
});
test('a changed shared source without an updated host pin fails the existing host verifier',t=>{
  const f=proofFixture(t);put(f.root,f.closure.runtime[0].path,'// changed without host version\n');
  assert.throws(()=>f.read(),/current bytes/u);
});
test('updated current pins alone cannot authorize a changed shared input',t=>{
  const f=proofFixture(t),next=successor(f,{changed:true});
  next.host.legacyInputTransitions=[];
  const hostPin=put(f.root,'catalog/g678-admission-v1/host-without-transition.json',json(next.host));
  assert.throws(()=>f.read(hostPin),/exact HFR shared host transition required/u);
});
test('a replacedRoutes path without an exact historical mapping grants no HFR exemption',t=>{
  const f=proofFixture(t),next=successor(f,{changed:true});
  next.host.legacyInputTransitions=[];next.host.replacedRoutes=[next.target.path];
  const hostPin=put(f.root,'catalog/g678-admission-v1/host-path-only.json',json(next.host));
  assert.throws(()=>f.read(hostPin),/exact HFR shared host transition required/u);
});
test('the existing historicalRoutes original and snapshot form is supported exactly',t=>{
  const f=proofFixture(t),next=successor(f,{changed:true}),transition=next.host.legacyInputTransitions[0];
  next.host.legacyInputTransitions=[];next.host.replacedRoutes=[next.target.path];
  next.host.historicalRoutes=[{original:transition.original,snapshot:transition.snapshot}];
  const hostPin=put(f.root,'catalog/g678-admission-v1/host-historical-route.json',json(next.host));
  assert.deepEqual(f.read(hostPin),f.proof.packet);
});
test('a retained historical snapshot must contain the original bytes, not only matching metadata',t=>{
  const f=proofFixture(t),next=successor(f,{changed:true});
  put(f.root,next.host.legacyInputTransitions[0].snapshot.path,'// corrupted frozen historical bytes\n');
  assert.throws(()=>f.read(next.hostPin),/current bytes/u);
});
for(const field of ['original','current'])test(`an incorrect ${field} pin in the host mapping is rejected`,t=>{
  const f=proofFixture(t),next=successor(f,{changed:true});
  next.host.legacyInputTransitions[0][field].sha256='0'.repeat(64);
  const hostPin=put(f.root,`catalog/g678-admission-v1/host-wrong-${field}.json`,json(next.host));
  assert.throws(()=>f.read(hostPin),/exact HFR shared host transition required|current host transition target/u);
});
for(const [label,select,external] of [
  ['SWF',f=>f.closure.source,true],
  ['XML',f=>f.closure.sourceXml,true],
  ['own wrapper',f=>f.entry.artifacts.module,false],
  ['generated TypeScript',f=>f.entry.artifacts.generated,false],
  ['page data',f=>f.entry.artifacts.data,false],
  ['page media',f=>f.closure.media[0],false],
  ['frozen run compiler',f=>f.closure.compiler[0],false],
])test(`a valid shared-host mapping never exempts changed ${label} bytes`,t=>{
  const f=proofFixture(t),next=successor(f,{changed:true}),target=select(f);
  put(external?f.sourceRoot:f.root,target.path,'corrupted own/source bytes');
  assert.throws(()=>f.read(next.hostPin),/current bytes|bytes drifted/u);
});
test('the compiler snapshot is run-level and cannot be replaced by per-page copies',async t=>{
  const f=fixture(t);
  f.closure.compiler=f.closure.compiler.map(p=>put(f.root,`${f.pageRoot}/compiler/${path.posix.basename(p.path)}`,readFileSync(path.join(f.root,p.path))));
  f.seal();
  await assert.rejects(validateFragment(f.root,f.calibration),/frozen compiler: source path boundary/u);
});
test('new writes and new preflights reject a live compiler that differs from the run snapshot',async t=>{
  const f=fixture(t),before=pin(f.root,'packages/demos/private-current-js-registry.json');
  put(f.root,'work/hfr-typescript/hfr/compiler/decompile.mjs','// newer live compiler\n');
  await assert.rejects(synchronizePrivateCurrentJsCalibration({root:f.root,calibrationPath:'work/fragment.json',check:false}),/current compiler: bytes drifted/u);
  await assert.rejects(preflightRegistration({root:f.root,fragment:f.calibration,exact:true}),/current compiler: bytes drifted/u);
  assert.deepEqual(pin(f.root,'packages/demos/private-current-js-registry.json'),before);
});
test('later compiler repairs leave the old proof and exact registered read/check unchanged',async t=>{
  const f=proofFixture(t),before=pin(f.root,f.proofPin.path);
  put(f.root,'packages/demos/private-current-js-registry.json',json(f.transaction.registry));
  const sources=registrySources(f.transaction.registry);
  ['registry.local-only.generated.ts','registry.local-only.metadata.generated.ts'].forEach((name,i)=>put(f.root,`packages/demos/src/${name}`,sources[i]));
  put(f.root,'work/hfr-typescript/hfr/compiler/decompile.mjs','// newer live compiler\n');
  put(f.root,'work/hfr-typescript/hfr/compiler/new-pass.mjs','// later added compiler phase\n');
  assert.deepEqual(f.read(),f.proof.packet);
  assert.equal((await synchronizePrivateCurrentJsCalibration({root:f.root,calibrationPath:'work/fragment.json',check:true})).mode,'check');
  assert.equal((await preflightRegistration({root:f.root,fragment:f.calibration,exact:true})).registered,true);
  assert.deepEqual(pin(f.root,f.proofPin.path),before);
});
test('shared ownership does not exempt another undeclared historical pin at the same path',t=>{
  const f=proofFixture(t),next=successor(f,{changed:true});
  const changed=structuredClone(f.proof);
  changed.legacyInputs.push({...next.target,sha256:'0'.repeat(64)});
  const proofPin=put(f.root,'work/g678-workflow/candidates/hfr-wrong-shared-input.json',json(changed));
  assert.throws(()=>readPageProof(f.root,proofPin,verifyHostVersion(f.root,next.hostPin),f.transaction),/exact HFR shared legacy input|conflicting pins/u);
});

for(const file of ['packages/demos/src/lesson-text-snapshot.ts','packages/demos/src/unclassified-shared-helper.ts']) {
  test(`outside shared input ${file} rejects path-only replacement`,t=>{
    const f=proofFixture(t,{extraSharedPaths:[file]}),next=successor(f,{changed:true,pinToChange:f.extraShared[0]});
    next.host.legacyInputTransitions=[];next.host.replacedRoutes=[file];
    const hostPin=put(f.root,'catalog/g678-admission-v1/outside-path-only.json',json(next.host));
    assert.throws(()=>f.read(hostPin),/exact HFR shared host transition required/u);
  });
  test(`outside shared input ${file} accepts its exact retained snapshot`,t=>{
    const f=proofFixture(t,{extraSharedPaths:[file]}),next=successor(f,{changed:true,pinToChange:f.extraShared[0]});
    assert.deepEqual(f.read(next.hostPin),f.proof.packet);
  });
}
test('an outside shared dependency cannot be silently moved to an unknown current path',t=>{
  const originalPath='packages/demos/src/lesson-text-snapshot.ts',f=proofFixture(t,{extraSharedPaths:[originalPath]});
  const moved=put(f.root,'packages/demos/src/unreviewed-location/native-text.ts','// changed dependency at a new path\n');
  const host={...f.host,files:uniquePins([...f.host.files.filter(p=>p.path!==originalPath),moved]),replacedRoutes:[originalPath]};
  const hostPin=put(f.root,'catalog/g678-admission-v1/outside-unknown-current.json',json(host));
  assert.throws(()=>f.read(hostPin),/unaccounted legacy input|HFR shared input belongs/u);
});
