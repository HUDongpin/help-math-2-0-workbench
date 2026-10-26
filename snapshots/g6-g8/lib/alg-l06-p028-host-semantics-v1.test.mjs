import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readCanonicalSource} from './alg-l06-p028-admission-semantics-v1.mjs';
import {readBoundSource,readCurrentSource,validateControls,
 validateEngineeringReceipt,validateFrozenCandidateInputs,validateHttp,
 validateNativeMain,validateNavigation,validateRawCases,
 validateResponsive} from './alg-l06-p028-host-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const oldDir='output/playwright/alg-l06-p028-candidate-host-v2/';
const read=name=>JSON.parse(fs.readFileSync(path.join(root,oldDir,name)));
const clone=value=>structuredClone(value);

test('producer preflight admits only the exact unregistered transaction',()=>{
 const source=readBoundSource(root);
 assert.match(source.bindingPin.path,/candidate-source-binding-v4\.json$/);
 assert.equal(source.index.pages.length,25);
 assert.equal(source.binding.files.length,149);
 const activation=fs.readFileSync(path.join(root,'apps/web/lib/g678-admission-activation.ts'),'utf8');
 if(activation.includes('index-v95.json')){
  const current=readCurrentSource(root);
  assert.equal(current.transaction.registry.calibrations.flatMap(c=>c.entries).filter(e=>e.key.startsWith('shared-')).length,515);
 }else assert.throws(()=>readCurrentSource(root),/actual active index-v95/);
});

test('projected postregistration transaction preserves frozen browser evidence',()=>{
 const source=readBoundSource(root),candidate=JSON.parse(fs.readFileSync(
  path.join(root,'work/g678-workflow/browser-candidates/p028-candidate-host-20261001-v4.json')));
 const prior=new Map(candidate.files.map(pin=>[pin.path,pin]));
 const replaced=new Set(['apps/web/lib/g678-admission-activation.ts',
  'packages/demos/private-current-js-registry.json',
  'packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts']);
 const projectedCurrent=new Map([...prior].map(([name,pin])=>
  [name,replaced.has(name)?{...pin,sha256:'0'.repeat(64)}:pin]));
 const inspected=[];
 const projectedRead=pin=>{
  inspected.push(pin.path);
  assert.deepEqual(projectedCurrent.get(pin.path),pin,
   `postregistration immutable input ${pin.path}`);
 };
 assert.equal(validateFrozenCandidateInputs(candidate,source,projectedRead),true);
 assert.equal(inspected.length,candidate.files.length-replaced.size);
 assert([...replaced].every(name=>!inspected.includes(name)));
 const changed=clone(candidate),immutable=changed.files.find(pin=>
  pin.path==='apps/web/lib/alg-l06-p028-candidate-binding-v1.ts');
 immutable.sha256='1'.repeat(64);
 assert.throws(()=>validateFrozenCandidateInputs(changed,source,projectedRead),
  /exact current runtime binding frozen/);
 const changedTransaction=clone(candidate),registry=changedTransaction.files
  .find(pin=>pin.path==='packages/demos/private-current-js-registry.json');
 registry.sha256='2'.repeat(64);
 assert.throws(()=>validateFrozenCandidateInputs(changedTransaction,source,projectedRead),
  /exact historical transaction pin/);
 const changedOther=new Map(projectedCurrent),other=prior.get(
  'packages/demos/src/animation-registry.ts');
 changedOther.set(other.path,{...other,sha256:'3'.repeat(64)});
 assert.throws(()=>validateFrozenCandidateInputs(candidate,source,pin=>
  assert.deepEqual(changedOther.get(pin.path),pin,'all other inputs remain current')),
  /all other inputs remain current/);
});

test('actual maintained canonical source passes host receipt interface boundary',()=>{
 const prior=process.env.HELP_MATH_G678_SOURCE_ROOT;
 let canonical;
 try{
  process.env.HELP_MATH_G678_SOURCE_ROOT=
   '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
  canonical=readCanonicalSource(root);
 }finally{
  if(prior===undefined)delete process.env.HELP_MATH_G678_SOURCE_ROOT;
  else process.env.HELP_MATH_G678_SOURCE_ROOT=prior;
 }
 assert.equal(canonical.runtimeBindingPin,undefined);
 assert.deepEqual(canonical.bindingPin,readBoundSource(root).bindingPin);
 assert.throws(()=>validateEngineeringReceipt({},root,canonical),
  /actual P028 engineering receipt and independent gates/);
 const wrong=clone(canonical);wrong.bindingPin.sha256='0'.repeat(64);
 assert.throws(()=>validateEngineeringReceipt({},root,wrong),
  /caller uses exact source packet/);
});

test('historical v2 controls cannot supply the current screenshot',()=>{
 const source=readBoundSource(root),raw=read('controls-v1.json');
 assert.throws(()=>validateControls(raw,source),
  /current controls held-return screenshot/);
});

test('current v3 controls-v2 raw binds held screenshot, keys and native SA EOF',()=>{
 const source=readBoundSource(root),dir=path.join(root,
  'output/playwright/alg-l06-p028-candidate-host-v3');
 const raw=JSON.parse(fs.readFileSync(path.join(dir,'controls-v2.json')));
 assert.equal(validateControls(raw,source),true);
 assert.equal(raw.screenshot,
  'output/playwright/alg-l06-p028-candidate-host-v3/controls-return-held-v2.png');
 assert(fs.statSync(path.join(root,raw.screenshot)).size>0);
 const lostFocus=clone(raw);lostFocus.glossary[1].focusRestored=false;
 assert.throws(()=>validateControls(lostFocus,source),
  /keyboard glossary and focus restoration Set/);
 const stoppedSa=clone(raw);const sa=stoppedSa.spanishEnded.audio.nodes
  .find(node=>node.samples===129024);
 sa.ended[0].stopCalled=true;
 assert.throws(()=>validateControls(stoppedSa,source),
  /Spanish Audio native EOF/);
 const skippedReturn=clone(raw);skippedReturn.returned.dataset.p028PlayerFrame='1';
 assert.throws(()=>validateControls(skippedReturn,source),
  /explicit Return resumes held cursor/);
});

test('historical native record lacks merged audio owner and cannot be formal proof',()=>{
 const source=readBoundSource(root),raw=read('native-es.json');
 assert.throws(()=>validateNativeMain(raw,'es',source),
  /exact source mathematical reading order/);
 const claimed=clone(raw);claimed.nativeReading=[
  'A relation is a set of ordered pairs.',
  '{(0, 1), (1, 5), (–3, 6), (0, 7)}'];
 assert.throws(()=>validateNativeMain(claimed,'es',source),
  /outer and inner P028 state ready/);
});

test('current v3 English native raw proves main EOF and rejects a stopped node',()=>{
 const source=readBoundSource(root),file=path.join(root,
  'output/playwright/alg-l06-p028-candidate-host-v3/native-en.json');
 const raw=JSON.parse(fs.readFileSync(file));
 assert.equal(validateNativeMain(raw,'en',source),true);
 const stopped=clone(raw);stopped.final.audio.nodes[0].ended[0].stopCalled=true;
 assert.throws(()=>validateNativeMain(stopped,'en',source),
  /main natural EOF/);
});

test('current v3 Spanish native and mobile raw retain source reading and no overflow',()=>{
 const source=readBoundSource(root),dir=path.join(root,
  'output/playwright/alg-l06-p028-candidate-host-v3');
 const spanish=JSON.parse(fs.readFileSync(path.join(dir,'native-es.json')));
 const mobile=JSON.parse(fs.readFileSync(path.join(dir,'responsive-v1.json')));
 assert.equal(validateNativeMain(spanish,'es',source),true);
 assert.equal(validateResponsive(mobile),true);
 const overflow=clone(mobile);overflow.layout.documentWidth=391;
 assert.throws(()=>validateResponsive(overflow),
  /responsive document does not overflow mobile viewport/);
 const clipped=clone(mobile);clipped.layout.reading[1].scrollWidth=300;
 assert.throws(()=>validateResponsive(clipped),
  /both source reading lines have no hidden horizontal overflow/);
});

test('current v3 navigation-v2 observes P027 cleanup and Spanish mobile control',()=>{
 const raw=JSON.parse(fs.readFileSync(path.join(root,
  'output/playwright/alg-l06-p028-candidate-host-v3/navigation-v2.json')));
 assert.equal(validateNavigation(raw),true);
 assert(fs.statSync(path.join(root,raw.screenshot)).size>0);
 const noClosed=clone(raw);noClosed.previous.events=noClosed.before.events;
 assert.throws(()=>validateNavigation(noClosed),
  /P028 context newly closes on Previous/);
 const noSpanish=clone(raw);noSpanish.mobile.buttons=[];
 assert.throws(()=>validateNavigation(noSpanish),
  /explicit Spanish Audio control reachable after return/);
});

test('current HTTP raw binds EN/ES pages, ten assets and thirteen denials',()=>{
 const source=readBoundSource(root),raw=JSON.parse(fs.readFileSync(
  path.join(root,'output/playwright/alg-l06-p028-candidate-host-v3/http-boundary-v1.json')));
 assert.equal(validateHttp(raw,source,root),true);
 const disclosed=clone(raw);disclosed.requests[12].bytes=source.assetPins.main.bytes;
 assert.throws(()=>validateHttp(disclosed,source,root),
  /HTTP no-referer denies source bytes/);
 const wrong=clone(raw);wrong.requests[1].sha256='0'.repeat(64);
 assert.throws(()=>validateHttp(wrong,source,root),
  /en exact asset 0/);
});

test('all six current raw cases pass as one packet and missing HTTP fails',()=>{
 const source=readBoundSource(root),dir=path.join(root,
  'output/playwright/alg-l06-p028-candidate-host-v3');
 const readCurrent=name=>JSON.parse(fs.readFileSync(path.join(dir,name)));
 const raw={nativeMainEn:readCurrent('native-en.json'),
  nativeMainEs:readCurrent('native-es.json'),
  controls:readCurrent('controls-v2.json'),
  navigation:readCurrent('navigation-v2.json'),
  http:readCurrent('http-boundary-v1.json'),
  responsive:readCurrent('responsive-v1.json')};
 assert.equal(validateRawCases(raw,source,root),true);
 delete raw.http;
 assert.throws(()=>validateRawCases(raw,source,root),
  /six actual raw cases required/);
});

test('historical responsive raw lacking mathematical reading widths is rejected',()=>{
 const raw=JSON.parse(fs.readFileSync(path.join(root,
  'output/playwright/alg-l06-p028-candidate-host-v1/responsive-v1.json')));
 assert.throws(()=>validateResponsive(raw),
  /both source mathematical reading lines measured/);
 const clipped=clone(raw);clipped.layout.reading=[
  {text:'A relation is a set of ordered pairs.',clientWidth:200,
   scrollWidth:201,height:40},
  {text:'{(0, 1), (1, 5), (–3, 6), (0, 7)}',
   clientWidth:200,scrollWidth:250,height:40}];
 assert.throws(()=>validateResponsive(clipped),
  /both source reading lines have no hidden horizontal overflow/);
});

test('missing EN, navigation and HTTP records fail even with passed flags',()=>{
 const source=readBoundSource(root),controls=read('controls-v1.json');
 assert.throws(()=>validateRawCases({controls},source,root),
  /six actual raw cases required/);
 assert.throws(()=>validateNavigation({kind:'p028-real-my-lesson-navigation-v1',
  status:'passed',pageErrors:[],consoleErrors:[],screenshot:
   'output/playwright/alg-l06-p028-candidate-host-v3/navigation-mobile-root32-v2.png'}),
  /navigation binds exact EN or ES candidate URL/);
 assert.throws(()=>validateHttp({kind:'p028-real-local-http-boundary-v1',
  status:'passed'},source,root),/P028 bounded HTTP resource map/);
 assert.throws(()=>validateEngineeringReceipt({schemaVersion:1,
  kind:'g678-p028-local-my-lesson-engineering-v1',
  animationId:'shared-alg001-l06-p028',status:'passed'},root,source),
  /actual P028 engineering receipt/);
});
