/** P027 real My Lesson observations. Receipt flags never replace raw evidence. */
import assert from 'node:assert/strict';
import {pinFile,readJsonPin,readPin,uniquePins} from './g678-admission-proof.mjs';
import {ID,KEYS,ACCEPTANCE,readP027CanonicalSource}
 from './alg-l06-p027-admission-semantics-v1.mjs';
import {validateP027SourceProjection}
 from './alg-l06-p027-admission-semantics-v1.mjs';

export const BROWSER_DIR='output/playwright/alg-l06-p027-candidate-host-v1/';
export const FINAL_CALIBRATION='g678-alg-l06-p027-current-js-20261001-v2';
export const RUNTIME_BINDING='apps/web/lib/alg-l06-p027-candidate-binding-v1.ts';
export const RAW=Object.freeze({
 nativeMainEn:BROWSER_DIR+'native-en.json',
 nativeMainEs:BROWSER_DIR+'native-es.json',
 controls:BROWSER_DIR+'controls-v1.json',
 navigation:BROWSER_DIR+'navigation-v1.json'});
const ORIGIN='http://127.0.0.1:3331';
const BOUNDARIES=[16,66,195,265,300,414,618,660];
const same=(a,b,label)=>assert.deepEqual(a,b,label);
const need=(condition,label)=>assert(condition,label);
const pinEquals=(a,b)=>a?.path===b?.path&&a?.bytes===b?.bytes&&a?.sha256===b?.sha256;
const route=locale=>`${ORIGIN}/${locale}/migration-status/g678-calibration/${ID}/candidate-v1?mode=focus`;
const asset=(token,sha)=>`${ORIGIN}/flash-assets/g678-local/${ID}/${token}?sha256=${sha}`;
const clean=(row,label)=>{
 same(row.pageErrors,[],`${label} page errors`);
 same(row.consoleErrors,[],`${label} console errors`);
};
const player=(dataset,phase,frame,owner='main',sa='idle')=>{
 same([dataset.p027Player,dataset.p027PlayerPhase,dataset.p027PlayerFrame,
  dataset.p027AudioOwner,dataset.p027SaPhase],
  ['true',phase,String(frame),owner,sa],
  `P027 player ${phase} at ${frame}`);
};

export function validateP027NativeMain(raw,locale,source){
 same([raw.kind,raw.locale,raw.url,raw.status],
  ['p027-real-my-lesson-native-main-v1',locale,route(locale),'passed'],
  `${locale} real route and case`);
 clean(raw,`${locale} native main`);
 player(raw.initial.dataset,'ready',1);
 same([raw.initial.nodes,raw.initial.saRequests],[0,0],
  `${locale} no autoplay and no early SA request`);
 same(raw.initial.decoded,[{samples:1412352,sampleRate:22050,channels:1}],
  `${locale} exact one source main decode`);
 player(raw.final.dataset,'timeline-ended',770);
 same(raw.final.alerts,[],`${locale} no runtime alert`);
 const audio=raw.final.audio;
 same(audio.decoded,raw.initial.decoded,`${locale} no late SA decode`);
 same(audio.contexts.map(row=>row.sampleRate),[22050],
  `${locale} one native main context`);
 const nodes=audio.nodes;
 same(nodes.length,1,`${locale} one physical main node`);
 const node=nodes[0];
 same([node.samples,node.contextRate,node.starts.length,node.stops.length,
  node.ended.length,node.ended[0].stopCalled],
  [1412352,22050,1,0,1,false],`${locale} main natural EOF`);
 const start=node.starts[0],end=node.ended[0];
 need(Math.abs(start.args[1]-1673/22050)<1e-8,
  `${locale} authored first seek`);
 need(start.player?.frame===1&&start.player?.owner==='main'&&
  start.player?.phase==='start-pending',
  `${locale} student Play created source node`);
 need(Math.abs((end.time-start.args[0])-(1412352-1673)/22050)<0.06,
  `${locale} native EOF duration`);
 need(end.player?.frame===770&&end.player?.owner==='main',
  `${locale} source EOF at final visual frame`);
 const trace=audio.trace;
 need(Array.isArray(trace)&&trace.length>0,`${locale} frame trace`);
 for(const frame of BOUNDARIES)
  need(trace.some(row=>Math.abs(row.frame-frame)<=1&&
   row.phase==='playing'&&row.owner==='main'),
   `${locale} source reveal or morph frame ${frame}`);
 need(trace.some(row=>row.frame===770&&row.phase==='playing'),
  `${locale} final frame reached before natural EOF`);
 same(raw.requests,[asset('canvas-renderer.js',source.assetPins.canvas.sha256),
  asset('main-source-v1',source.assetPins.main.sha256)],
  `${locale} only exact source drawing and main audio fetched`);
 return true;
}

export function validateP027Controls(raw,source){
 same([raw.kind,raw.status],['p027-real-my-lesson-controls-v1','passed'],
  'real My Lesson controls');
 clean(raw,'controls');
 same(raw.glossary.map(row=>row.key),KEYS.map(row=>row[0]),
  'six source glossary keys in order');
 for(const row of raw.glossary){
  need(source.native.glossary.some(control=>control.key===row.key&&
   control.instanceId===row.iid),`source button instance ${row.key}`);
  same([row.openedFrame,row.closedFrame,row.closedPhase,row.focusRestored],
   ['770','770','timeline-ended',true],`keyboard glossary ${row.key}`);
 }
 player(raw.replay.dataset,'ready',1);
 same(raw.replay.dataset.p027PlayerReplay,'1','Replay resets held frame');
 const held=Number(raw.held.dataset.p027PlayerFrame);
 need(Number.isSafeInteger(held)&&held>=40&&held<770,
  'main pause with real cursor');
 player(raw.held.dataset,'paused',held);
 player(raw.pauseCheck.dataset,'paused',held);
 player(raw.spanishPlaying.dataset,'playing',held,'spanish','playing');
 player(raw.spanishEnded.dataset,'ended',held,'spanish','ended');
 const saNodes=raw.spanishEnded.audio.nodes.filter(node=>
  node.samples===1307520);
 same(saNodes.length,1,'one independent SA node');
 same([saNodes[0].contextRate,saNodes[0].starts.length,
  saNodes[0].stops.length,saNodes[0].ended.length,
  saNodes[0].ended[0].stopCalled],
  [48000,1,0,1,false],'SA natural EOF and retained selection');
 need(raw.spanishEnded.audio.nodes.some(node=>
  node.samples===1412352&&node.stops.length>=1),
  'main node retired before independent SA');
 const returned=Number(raw.returned.dataset.p027PlayerFrame),
  continued=Number(raw.continued.dataset.p027PlayerFrame);
 need(returned>=held&&returned<=held+8&&continued>held,
  'explicit Return resumes held cursor');
 player(raw.returned.dataset,'playing',returned);
 player(raw.continued.dataset,'playing',continued);
 return true;
}

export function validateP027Navigation(raw){
 same([raw.kind,raw.status],['p027-real-my-lesson-navigation-v1','passed'],
  'true P026/P027 navigation');
 clean(raw,'navigation');
 need(raw.before.p027.p027Player==='true',
  'P027 active before Previous');
 same([raw.previous.p027.p027Player,raw.previous.p026.p026Player,
  raw.previous.p026.p026PlayerPhase,
  raw.previous.p026.p026PlayerFrame],
  [undefined,'true','ready','1'],'Previous selects actual P026');
 const main=raw.before.contexts.find(row=>row.sampleRate===22050);
 need(main&&raw.before.contexts.filter(row=>row.id===main.id).length===1,
  'exact P027 main context before navigation');
 need(!raw.before.events.some(row=>row.id===main.id&&row.state==='closed')&&
  raw.previous.events.slice(raw.before.events.length).some(row=>
   row.event==='context-state'&&row.id===main.id&&row.state==='closed'),
  'P027 main context newly closed on Previous');
 same([raw.returned.p026.p026Player,raw.returned.p027.p027Player,
  raw.returned.p027.p027PlayerPhase,
  raw.returned.p027.p027PlayerFrame],
  [undefined,'true','ready','1'],'Next creates fresh P027');
 const mobile=raw.mobile;
 same([mobile.width,mobile.rootFont,mobile.documentWidth],[390,'32px',390],
  '390 px and root 32 reflow');
 need(mobile.canvas.x>=0&&mobile.canvas.width>0&&
  mobile.canvas.x+mobile.canvas.width<=391,'Canvas within viewport');
 // This navigation case returns to frame 1, before glossary controls appear.
 // The final-frame responsive case checks all six glossary controls below.
 need(mobile.buttons.some(button=>button.text==='Spanish Audio'&&
  button.x>=0&&button.x+button.width<=391&&button.height>=44),
  'mobile explicit Spanish Audio control reachable');
 return true;
}

/** HTTP and responsive records must be actual cases supplied by the receipt. */
export function validateP027Http(raw,source,root){
 same([raw.kind,raw.status,raw.origin,raw.bindingVersion,
  raw.registered],
  ['p027-real-local-http-boundary-v1','passed',ORIGIN,'v2',false],
  'exact local HTTP boundary');
 same(raw.registeredResourcePins,103,'exact inherited project resource map');
 same(raw.acceptanceEffects,ACCEPTANCE,'HTTP cannot accept migration');
 same(raw.locales,['en','es'],'bilingual route coverage');
 same(raw.testedResourceTokens,['canvas-renderer.js','main-source-v1',
  'optional-spanish-audio-v1','p026-canvas-renderer.js','p026-main-1'],
  'own three and inherited two HTTP tokens');
 same(raw.negatives,['no-referer','wrong-referer','foreign-origin',
  'cross-site','navigate-dest','range','bad-forwarded-host',
  'bad-forwarded-proto','wrong-hash','extra-query','unknown-token',
  'post','localhost-host'],'exact denial case order');
 same(raw.requests.length,27,'two documents, ten assets, thirteen denials, two HEADs');
 for(let localeIndex=0;localeIndex<2;localeIndex++){
  const locale=['en','es'][localeIndex],offset=localeIndex*6,
   document=raw.requests[offset],candidate=route(locale);
  same([document.url,document.method,document.status],[candidate,'GET',200],
   `${locale} document`);
  need(document.responseHeaders?.['x-robots-tag']?.includes('noindex')&&
   document.responseHeaders?.['content-type']==='text/html; charset=utf-8',
   `${locale} candidate noindex HTML`);
  for(let i=0;i<3;i++){
   const [token,pin]=[['canvas-renderer.js',source.assetPins.canvas],
    ['main-source-v1',source.assetPins.main],
    ['optional-spanish-audio-v1',source.assetPins.sa]][i],
    row=raw.requests[offset+i+1];
   same([row.url,row.method,row.status,row.bytes,row.sha256],
    [asset(token,pin.sha256),'GET',200,pin.bytes,pin.sha256],
    `${locale} exact own asset ${token}`);
   need(row.responseHeaders?.['x-robots-tag']?.includes('noindex')&&
    row.responseHeaders?.['cache-control']?.includes('no-store')&&
    row.responseHeaders?.['content-length']===String(pin.bytes)&&
    row.responseHeaders?.['content-type']===(i===0?
     'text/javascript; charset=utf-8':'audio/mpeg')&&
    row.responseHeaders?.['cross-origin-resource-policy']==='same-origin',
    `${locale} asset protection ${token}`);
  }
  const index=readJsonPin(root,source.binding.predecessorIndex),
   previous=index.pages.find(page=>page.animationId==='shared-alg001-l06-p026');
  need(previous,'exact P026 predecessor proof');
  const p026=readJsonPin(root,previous.proof),
   p026Pins=[p026.packet.entry.artifacts.runtime,
    p026.packet.continuousSource.mainRuns[0].asset];
  for(let i=4;i<=5;i++){
   const row=raw.requests[offset+i],pin=p026Pins[i-4],
    token=i===4?'canvas-renderer.js':'main-1',
    contentType=i===4?'text/javascript; charset=utf-8':'audio/mpeg';
   same([row.url,row.method,row.status,row.bytes,row.sha256],
    [`${ORIGIN}/flash-assets/g678-local/shared-alg001-l06-p026/${token}?sha256=${pin.sha256}`,
     'GET',200,pin.bytes,pin.sha256],
    `${locale} exact inherited P026 asset ${token}`);
   need(row.responseHeaders?.['x-robots-tag']?.includes('noindex')&&
    row.responseHeaders?.['cache-control']?.includes('no-store')&&
    row.responseHeaders?.['content-length']===String(pin.bytes)&&
    row.responseHeaders?.['content-type']===contentType&&
    row.responseHeaders?.['cross-origin-resource-policy']==='same-origin',
    `${locale} protected inherited P026 asset ${token}`);
  }
 }
 const negatives=raw.requests.slice(12,25),main=source.assetPins.main,
  mainUrl=asset('main-source-v1',main.sha256);
 same(negatives.length,13,'thirteen negative requests');
 for(let i=0;i<negatives.length;i++){
  const row=negatives[i],name=raw.negatives[i];
  need(row.status===(name==='post'?405:404)&&row.bytes===0&&
   row.sha256!==main.sha256,`HTTP ${name} denies source bytes`);
 }
 const head=raw.requests[25],scriptHead=raw.requests[26];
 same([head.url,head.method,head.status,head.bytes,
  head.responseHeaders?.['content-length'],
  head.responseHeaders?.['content-type']],
  [mainUrl,'HEAD',200,0,String(main.bytes),'audio/mpeg'],
  'main HEAD metadata only');
 need(head.responseHeaders?.['x-robots-tag']?.includes('noindex')&&
  head.responseHeaders?.['cache-control']?.includes('no-store'),
  'main HEAD still protected');
 same([scriptHead.method,scriptHead.status,scriptHead.bytes],
  ['HEAD',404,0],'script HEAD denied');
 return true;
}

export function validateP027Responsive(raw){
 same([raw.kind,raw.status,raw.url],
  ['p027-es-final-native-reflow-v1','passed',route('es')],
  'Spanish route responsive case');
 clean(raw,'responsive ES');
 const layout=raw.layout;
 same([layout.width,layout.documentWidth,layout.frame,
  layout.textLanguage,layout.policy,layout.keys],
  [390,390,'770','en','source-en-fallback',KEYS.map(row=>row[0])],
  'source-English fallback with six keys');
 same(layout.alerts,[],'no responsive runtime alerts');
 need(layout.canvas.x>=0&&layout.canvas.width>0&&
  layout.canvas.x+layout.canvas.width<=391,'responsive Canvas within viewport');
 need(layout.controls.length>=6&&layout.controls.every(control=>
  KEYS.some(([key])=>key===control.key)&&control.x>=0&&
  control.x+control.width<=391&&control.height>=44&&
  control.fontSize==='32px'),'six source glossary controls at root 32');
 return true;
}

export function validateP027EngineeringRaw(raw,source,root){
 need(raw&&source?.assetPins&&source?.native&&source?.binding,
  'P027 real raw cases and source binding required');
 validateP027NativeMain(raw.nativeMainEn,'en',source);
 validateP027NativeMain(raw.nativeMainEs,'es',source);
 validateP027Controls(raw.controls,source);
 validateP027Navigation(raw.navigation);
 validateP027Http(raw.http,source,root);
 validateP027Responsive(raw.responsive);
 return true;
}

export function validateP027RuntimeBinding(binding,source,registrySha256){
 const decoded=source.browserDecode.results.map(row=>({
  sourceSha256:row.sourceSha256,sourceBytes:row.sourceBytes,
  sampleRate:row.sampleRate,channels:row.channels,
  decodedSamples:row.samples,pcmSha256:row.pcmSha256}));
 same(binding,{candidateRegistrySha256:registrySha256,
  index:source.binding.predecessorIndex,
  host:source.binding.predecessorHost,
  packet:source.bindingPin,browserMain:decoded[0],
  browserSpanish:decoded[1]},
  'actual runtime binding has exact source packet and Chrome PCM');
 return true;
}

/** Read every raw case and every stable browser candidate behind a receipt. */
export function validateP027EngineeringReceipt(receipt,root,sourceOverride){
 const source=sourceOverride??readP027CanonicalSource(root);
 same([receipt.schemaVersion,receipt.kind,receipt.animationId,receipt.status,
  receipt.bindingPin,receipt.indexPin,receipt.hostPin,receipt.registered,
  receipt.denominator,receipt.pageErrors,receipt.consoleErrors,
  receipt.acceptanceEffects],
  [1,'g678-p027-local-my-lesson-engineering-v1',ID,'passed',
   source.bindingPin,source.binding.predecessorIndex,
   source.binding.predecessorHost,false,2282,[],[],ACCEPTANCE],
  'exact real engineering receipt and independent gates');
 same(uniquePins(receipt.artifacts),receipt.artifacts,
  'sorted unique P027 browser artifacts');
 const artifacts=new Map(receipt.artifacts.map(pin=>[pin.path,pin]));
 for(const pin of receipt.artifacts){
  need(pin.path.startsWith(BROWSER_DIR)&&!pin.path.includes('..'),
   `bounded browser artifact ${pin.path}`);
  readPin(root,pin);
 }
 same(Object.keys(receipt.raw),['nativeMainEn','nativeMainEs',
  'controls','navigation','http','responsive'],
  'six actual raw case paths');
 const raw={};
 for(const [name,file] of Object.entries(receipt.raw)){
  need(file.startsWith(BROWSER_DIR)&&!file.includes('..'),
   `bounded ${name} raw case`);
  if(RAW[name])same(file,RAW[name],`exact ${name} file`);
  const pin=artifacts.get(file);
  need(pin,`raw ${name} is included in receipt artifacts`);
  raw[name]=readJsonPin(root,pin);
  if(raw[name].screenshot)need(artifacts.has(raw[name].screenshot),
   `raw ${name} screenshot retained`);
 }
 validateP027EngineeringRaw(raw,source,root);
 same(Object.keys(receipt.stableRuns),Object.keys(receipt.raw),
  'six stable source runs');
 const runtimeBindingPin=pinFile(root,RUNTIME_BINDING),
  runtimeText=readPin(root,runtimeBindingPin).toString('utf8'),
  match=runtimeText.match(/export const P027_CANDIDATE_BINDING = ([\s\S]*?) as const;/);
 need(match,'actual P027 runtime binding has static value');
 const runtimeBinding=JSON.parse(match[1]);
 const candidates=[];let registrySha256;
 for(const [name,pin] of Object.entries(receipt.stableRuns)){
  need(pin?.path.startsWith(BROWSER_DIR)&&pinEquals(pin,artifacts.get(pin.path)),
   `stable ${name} is included in receipt artifacts`);
  const stable=readJsonPin(root,pin);
  same([stable.schemaVersion,stable.kind,stable.animationIds,
   stable.host,stable.phase,stable.exitCode,stable.drift,
   stable.status,stable.error],
   [1,'g678-stable-browser-run-v1',['shared-alg001-l06-p026'],
    source.binding.predecessorHost,'postflight',0,null,
    'stable-command-passed',null],
   `stable ${name} execution`);
  registrySha256??=stable.registrySha256;
  same(stable.registrySha256,registrySha256,
   'one unchanged registry across all browser flows');
  validateP027RuntimeBinding(runtimeBinding,source,registrySha256);
  const candidate=readJsonPin(root,stable.candidate);
  same([candidate.schemaVersion,candidate.kind,candidate.index,
   candidate.host,candidate.animationIds,candidate.registrySha256],
   [1,'g678-stable-browser-candidate-v1',
    source.binding.predecessorIndex,source.binding.predecessorHost,
    ['shared-alg001-l06-p026'],registrySha256],
   `frozen ${name} predecessor boundary`);
  need(Object.values(candidate.acceptanceEffects).every(value=>value===false),
   `${name} candidate acceptance neutral`);
  same(uniquePins(candidate.files),candidate.files,
   `frozen ${name} unique inputs`);
  const frozen=new Map(candidate.files.map(item=>[item.path,item]));
  need(pinEquals(frozen.get(RUNTIME_BINDING),runtimeBindingPin),
   `${name} actual Chrome runtime binding is frozen and current`);
  need(pinEquals(frozen.get(source.bindingPin.path),source.bindingPin),
   `${name} exact P027 candidate binding`);
  for(const item of source.binding.files)
   need(pinEquals(frozen.get(item.path),item),
    `${name} source input ${item.path}`);
  candidates.push(stable.candidate);
 }
 const cases=receipt.cases;
 for(const key of ['nativeMainEn','nativeMainEs','glossary6','replay',
  'explicitSpanish','explicitReturn','navigation','cleanup','http','responsive'])
  same(cases?.[key],true,`real P027 case ${key}`);
 return {receipt,source,artifacts:receipt.artifacts,runtimeBindingPin,
  candidates:uniquePins(candidates),raw,registrySha256};
}

/** The v2 freeze binds the real receipt and every raw/stable candidate input. */
export function validateP027FinalPacket(packet,registration,root,
 source,receiptPin,engineering){
 validateP027SourceProjection(packet,source);
 same(packet.calibrationId,FINAL_CALIBRATION,'final P027 calibration');
 same(packet.engineeringReceipt,receiptPin,'exact real host receipt in freeze');
 same(packet.browserRaw,engineering.receipt.raw,
  'six raw cases named by actual host receipt');
 same(packet.browserStableRuns,engineering.receipt.stableRuns,
  'actual stable runs in freeze');
 same(packet.acceptanceEffects,ACCEPTANCE,'independent downstream gates');
 same([packet.productCalibrationPassed,packet.scaleOutAuthorized],
  [false,false],'no scale-out authorization');
 need(packet.integrity?.completeTransitiveClosure===false,
  'Current-JS proof does not claim strict closure');
 const required=uniquePins([source.bindingPin,...source.binding.files,
  engineering.runtimeBindingPin,
  ...Object.values(packet.entry.artifacts),receiptPin,
  ...engineering.artifacts,...engineering.candidates]);
 same(uniquePins(packet.integrity.files),packet.integrity.files,
  'sorted final producer input closure');
 const closure=new Map(packet.integrity.files.map(item=>[item.path,item]));
 for(const item of required){
  need(pinEquals(closure.get(item.path),item),
   `final freeze retains real source/browser input ${item.path}`);
  readPin(root,item);
 }
 same(registration,{calibrationId:FINAL_CALIBRATION,
  deploymentScope:'local-only',freezeManifest:packet.freezeManifest.path,
  freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,
  entries:[packet.entry]},'exact v2 production writer registration');
 return true;
}
