/** Review draft for P028 real My Lesson evidence. A passed flag is never proof. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pinFile,readJsonPin,readPin,readRegistryTransaction,
 uniquePins,verifyHostVersion,readPageProof}
 from './g678-admission-proof.mjs';

import {verifyPageHostInputBoundary} from '../scripts/lib/g678-page-host-input-boundary-v1.mjs';

export const ID='shared-alg001-l06-p028';
export const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const SOURCE={path:'G6-G8-shared/ALG001/L6/VB/L6VB21.swf',bytes:47191,
 sha256:'12b9912231512d5622b96708b83331217691169fadf185b3b2d0a27733e3c297'};
export const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
export const SA={path:'G6-G8-shared/ALG001/L6/SA/L6VB21.mp3',bytes:37632,
 sha256:'f056221dc3c4251538c3a1d2c201bec5abe92c18a58f6ce1d185a8a6cf6703cf'};
export const KEYS=['Relation','Set','Ordered pair'];
export const ACCEPTANCE={authoritativeOriginalRuntime:false,fidelityAccepted:false,
 audioAccepted:false,listeningAccepted:false,humanVisualAccepted:false,
 ownerAccepted:false,strictComplete:false,published:false};
export const BROWSER_DIR='output/playwright/alg-l06-p028-candidate-host-v3/';
export const RUNTIME_BINDING='apps/web/lib/alg-l06-p028-candidate-binding-v1.ts';
export const EXPECTED_INDEX={path:'catalog/g678-admission-v1/index-v95.json',
 bytes:7213,sha256:'abc289363ad1de972e53bc4eeed881db05ab82fb1c59c9aed56a4dedcf4acb69'};
export const EXPECTED_HOST={path:'catalog/g678-admission-v1/host-v94.json',
 bytes:136221,sha256:'3aa87dbbb8fe1576efb1faae191614053e4ab5ee7d8cefb4e0a68a411dfc23cc'};
export const PREDECESSOR_REGISTRY_SHA='d1d56ce92fe29a25c072f93cdf6b0aa2ce97a40c455f13af261d88fe16b99d65';
const HISTORICAL_TRANSACTION_PINS=[
 {path:'apps/web/lib/g678-admission-activation.ts',bytes:291,sha256:'d491c8d3b78fc73f2bedd9f8b2ea983d0cb661033f1645409a14bf0fa093165c'},
 {path:'packages/demos/private-current-js-registry.json',bytes:652307,sha256:PREDECESSOR_REGISTRY_SHA},
 {path:'packages/demos/src/registry.local-only.generated.ts',bytes:391855,sha256:'31e6ed3baf7a866b2b1310f221a04b47e75174f3a331d06a10484fae41cce2fd'},
 {path:'packages/demos/src/registry.local-only.metadata.generated.ts',bytes:305523,sha256:'68e0dd118005cad881b589521b883e61fdf136ab8d30e347681b4a4aadb5fb4a'}];
const ORIGIN='http://127.0.0.1:3331';
const MAIN_SHA='4f6453056b67a9eb37859eba02a0f0c31d1619d50fd7c83863c55f0fd7c41a70';
const MAIN_PCM='a37a3a97c61557bcbf7634a84fb70b4097fdbef247d9ae771ea512f2e780c12f';
const SA_PCM='fda7eef75eb7d8346fbe84c87ec2ce9bbd8842ed520e298e256cb1a84b39ca78';
const CANVAS_SHA='b4d784c6dd65c0a412c4a41447d4485476a8715b665b175f277a40a40ffbb2e6';
const BOUNDARIES=[2,10,25,34,40,80,85,111,117,123,129,134];
const READING=['A relation is a set of ordered pairs.',
 '{(0, 1), (1, 5), (–3, 6), (0, 7)}'];
const RAW_NAMES=['nativeMainEn','nativeMainEs','controls','navigation','http','responsive'];
const RAW_PATHS={nativeMainEn:'native-en.json',nativeMainEs:'native-es.json',
 controls:'controls-v2.json',navigation:'navigation-v2.json',
 http:'http-boundary-v1.json',responsive:'responsive-v1.json'};
const STABLE_PATHS={nativeMainEn:'stable-native-en-v1.json',
 nativeMainEs:'stable-native-es-v1.json',controls:'stable-controls-v2.json',
 navigation:'stable-navigation-v2.json',http:'stable-http-v1.json',
 responsive:'stable-responsive-v1.json'};
const same=(actual,expected,message)=>assert.deepEqual(actual,expected,message);
const need=(condition,message)=>assert(condition,message);
const eqPin=(a,b)=>a?.path===b?.path&&a?.bytes===b?.bytes&&a?.sha256===b?.sha256;
const route=locale=>`${ORIGIN}/${locale}/migration-status/g678-calibration/${ID}/candidate-v1?mode=focus`;
const asset=(token,pin,id=ID)=>
 `${ORIGIN}/flash-assets/g678-local/${id}/${token}?sha256=${pin.sha256}`;
const clean=(raw,name)=>{
 same(raw.pageErrors,[],`${name} page errors`);
 same(raw.consoleErrors,[],`${name} console errors`);
};
const dataset=(row,phase,frame,owner='main',sa='idle')=>{
 same([row?.p028Player,row?.p028PlayerPhase,row?.p028PlayerFrame,
  row?.p028AudioPlayer,row?.p028Phase,row?.p028Frame,
  row?.p028AudioOwner,row?.p028SaPhase],
  ['true',phase,String(frame),'true',phase,String(frame),owner,sa],
  `outer and inner P028 state ${phase} frame ${frame}`);
 same(row.p028SourceSwfSha256,SOURCE.sha256,'physical source identity in player');
};

export function validateNativeMain(raw,locale,source){
 same([raw?.kind,raw?.locale,raw?.url,raw?.status],
  ['p028-real-my-lesson-native-main-v1',locale,route(locale),'passed'],
  `${locale} actual My Lesson native case`);
 clean(raw,`${locale} native`);
 same(raw.nativeReading,READING,
  `${locale} exact source mathematical reading order`);
 dataset(raw.initial?.dataset,'ready',1);
 same([raw.initial.nodes,raw.initial.saRequests],[0,0],
  `${locale} no autoplay or early Spanish request`);
 same(raw.initial.decoded,[{samples:243648,sampleRate:22050,channels:1}],
  `${locale} exact embedded main decode`);
 dataset(raw.final?.dataset,'timeline-ended',134);
 same(raw.final.alerts,[],`${locale} no playback alerts`);
 const audio=raw.final.audio;
 same(audio.decoded,raw.initial.decoded,`${locale} no late Spanish decode`);
 same(audio.contexts.map(row=>row.sampleRate),[22050],
  `${locale} one native main context`);
 same(audio.nodes.length,1,`${locale} one native main node`);
 const node=audio.nodes[0];
 same([node.samples,node.contextRate,node.starts.length,node.stops.length,
  node.ended.length,node.ended[0]?.stopCalled],
  [243648,22050,1,0,1,false],`${locale} main natural EOF`);
 const start=node.starts[0],end=node.ended[0];
 need(Math.abs(start.args[1]-1673/22050)<1e-8,
  `${locale} authored first seek`);
 same([start.player?.frame,start.player?.owner],
  [1,'main'],`${locale} student Play main owner`);
 need(Math.abs((end.time-start.args[0])-(243648-1673)/22050)<0.06,
  `${locale} native EOF duration`);
 same([end.player?.frame,end.player?.owner,end.player?.sa],
  [134,'main','idle'],`${locale} natural EOF at final frame`);
 const trace=audio.trace;
 need(Array.isArray(trace)&&trace.length>0,`${locale} real frame trace`);
 for(const frame of BOUNDARIES)
  need(trace.some(row=>Math.abs(row.frame-frame)<=1&&
   row.phase==='playing'&&row.owner==='main'),
   `${locale} source reveal frame ${frame}`);
 need(trace.some(row=>row.frame===134&&row.phase==='timeline-ended'),
  `${locale} terminal hold after EOF`);
 const allowed=new Set([asset('canvas-renderer.js',source.assetPins.canvas),
  asset('main-source-v1',source.assetPins.main)]);
 need(raw.requests.length>=2&&raw.requests.every(url=>allowed.has(url))&&
  allowed.size===new Set(raw.requests).size,
  `${locale} only exact Canvas/main bytes requested; no SA autoplay`);
 return true;
}

export function validateControls(raw,source){
 same([raw?.kind,raw?.status],
  ['p028-real-my-lesson-controls-v1','passed'],'real My Lesson controls');
 clean(raw,'controls');
 same(raw.screenshot,BROWSER_DIR+'controls-return-held-v2.png',
  'current controls held-return screenshot');
 same(raw.glossary.map(row=>row.key),KEYS,'three source keys in order');
 for(const row of raw.glossary){
  need(source.native.glossary.some(control=>control.key===row.key&&
   control.instanceId===row.iid),`source glossary instance ${row.key}`);
  same([row.openedFrame,row.closedFrame,row.closedPhase,row.focusRestored],
   ['134','134','timeline-ended',true],
   `keyboard glossary and focus restoration ${row.key}`);
 }
 dataset(raw.replay?.dataset,'ready',1);
 same([raw.replay.dataset.p028PlayerReplay,
  raw.replay.dataset.p028Replay],['1','1'],'Replay resets both players');
 same(raw.replay.alerts,[],'Replay no alert');
 const held=Number(raw.held?.dataset?.p028PlayerFrame);
 need(Number.isSafeInteger(held)&&held>=40&&held<134,
  'main pause has real held cursor');
 dataset(raw.held.dataset,'paused',held);
 dataset(raw.pauseCheck?.dataset,'paused',held);
 same(raw.pauseCheck.alerts,[],'held frame no alert');
 dataset(raw.spanishPlaying?.dataset,'playing',held,'spanish','playing');
 dataset(raw.spanishEnded?.dataset,'ended',held,'spanish','ended');
 same(raw.spanishEnded.alerts,[],'Spanish Audio no alert');
 same(raw.spanishEnded.audio.decoded,
  [{samples:243648,sampleRate:22050,channels:1},
   {samples:129024,sampleRate:48000,channels:1}],
  'separate Spanish decode only after explicit action');
 const nodes=raw.spanishEnded.audio.nodes,
  saNodes=nodes.filter(node=>node.samples===129024);
 same(saNodes.length,1,'one separate Spanish Audio node');
 const sa=saNodes[0];
 same([sa.contextRate,sa.starts.length,sa.stops.length,sa.ended.length,
  sa.ended[0]?.stopCalled],
  [48000,1,0,1,false],'Spanish Audio native EOF');
 need(nodes.some(node=>node.samples===243648&&node.stops.length>=1),
  'held main node retired before independent SA');
 const returned=Number(raw.returned?.dataset?.p028PlayerFrame),
  continued=Number(raw.continued?.dataset?.p028PlayerFrame);
 need(returned>=held&&returned<=held+8&&continued>held,
  'explicit Return resumes held cursor');
 dataset(raw.returned.dataset,'playing',returned);
 dataset(raw.continued.dataset,'playing',continued);
 same(raw.returned.alerts,[],'Return no alert');
 same(raw.continued.alerts,[],'continued playback no alert');
 return true;
}

export function validateNavigation(raw){
 same([raw?.kind,raw?.status],
  ['p028-real-my-lesson-navigation-v1','passed'],
  'actual P027/P028 My Lesson navigation');
 same(raw.screenshot,BROWSER_DIR+'navigation-mobile-root32-v2.png',
  'current navigation mobile screenshot');
 need(raw.url===route('en')||raw.url===route('es'),
  'navigation binds exact EN or ES candidate URL');
 const spanishLabel=raw.url===route('es')?
  'Audio en español':'Spanish Audio';
 clean(raw,'navigation');
 need(raw.before?.p028?.p028Player==='true',
  'P028 active before Previous');
 same([raw.previous?.p028?.p028Player,
  raw.previous?.p027?.p027Player,
  raw.previous?.p027?.p027PlayerPhase,
  raw.previous?.p027?.p027PlayerFrame],
  [undefined,'true','ready','1'],
  'Previous selects actual P027 at its start');
 const main=raw.before.contexts?.find(row=>row.sampleRate===22050);
 need(main&&raw.before.contexts.filter(row=>row.id===main.id).length===1,
  'P028 main context before navigation');
 need(!raw.before.events?.some(row=>row.id===main.id&&row.state==='closed')&&
  raw.previous.events?.slice(raw.before.events.length).some(row=>
   row.event==='context-state'&&row.id===main.id&&row.state==='closed'),
  'P028 context newly closes on Previous');
 same([raw.returned?.p027?.p027Player,
  raw.returned?.p028?.p028Player,
  raw.returned?.p028?.p028PlayerPhase,
  raw.returned?.p028?.p028PlayerFrame],
  [undefined,'true','ready','1'],
  'Next creates fresh P028');
 const mobile=raw.mobile;
 same([mobile?.width,mobile?.rootFont],
  [390,'32px'],'390 px/root 32 navigation reflow');
 need(mobile.documentWidth>0&&mobile.documentWidth<=390,
  'navigation document does not overflow mobile viewport');
 need(mobile.canvas.x>=0&&mobile.canvas.width>0&&
  mobile.canvas.x+mobile.canvas.width<=391,
  'navigation Canvas within viewport');
 need(mobile.buttons.some(button=>button.text===spanishLabel&&
  button.x>=0&&button.x+button.width<=391&&button.height>=44),
  'explicit Spanish Audio control reachable after return');
 need(mobile.buttons.every(button=>button.x>=0&&
  button.x+button.width<=391&&button.height>=44),
  'all enabled mobile controls reachable');
 return true;
}

export function validateResponsive(raw){
 same([raw?.kind,raw?.status,raw?.url],
  ['p028-es-final-native-reflow-v1','passed',route('es')],
  'actual final Spanish route');
 clean(raw,'responsive');
 const layout=raw.layout;
 same([layout?.width,layout?.frame,
  layout?.textLanguage,layout?.policy,layout?.keys],
  [390,'134','en','source-en-fallback',KEYS],
  'source-English fallback and three keys at mobile root 32');
 need(layout.documentWidth>0&&layout.documentWidth<=390,
  'responsive document does not overflow mobile viewport');
 same(layout.alerts,[],'no responsive runtime alert');
 need(Array.isArray(layout.reading)&&layout.reading.length===2,
  'both source mathematical reading lines measured');
 same(layout.reading.map(line=>line.text),READING,
  'source mathematical reading at root 32');
 need(layout.reading.every(line=>line.clientWidth>0&&
  line.scrollWidth<=line.clientWidth+1&&line.height>0),
  'both source reading lines have no hidden horizontal overflow');
 need(layout.canvas.x>=0&&layout.canvas.width>0&&
  layout.canvas.x+layout.canvas.width<=391,
  'responsive Canvas within viewport');
 same(layout.controls.map(control=>control.key),KEYS,
  'three responsive glossary controls in source order');
 need(layout.controls.length===3&&layout.controls.every(control=>
  KEYS.includes(control.key)&&control.x>=0&&
  control.x+control.width<=391&&control.height>=44&&
  control.fontSize==='32px'),
  'three glossary controls visible and reachable at root 32');
 return true;
}

/** Exact HTTP rows, including negative requests, rather than an HTTP status flag. */
export function validateHttp(raw,source,root){
 same([raw?.kind,raw?.status,raw?.origin,raw?.bindingVersion,
  raw?.registered,raw?.registeredResourcePins],
  ['p028-real-local-http-boundary-v1','passed',ORIGIN,'v4',false,106],
  'P028 bounded HTTP resource map');
 same(raw.acceptanceEffects,ACCEPTANCE,
  'HTTP cannot grant fidelity, audio or Owner acceptance');
 same(raw.locales,['en','es'],'both My Lesson locales');
 const tokens=['canvas-renderer.js','main-source-v1',
  'optional-spanish-audio-v1','p027-canvas-renderer.js',
  'p027-main-source-v1'];
 same(raw.testedResourceTokens,tokens,'own three and inherited two assets');
 const negatives=['no-referer','wrong-referer','foreign-origin',
  'cross-site','navigate-dest','range','bad-forwarded-host',
  'bad-forwarded-proto','wrong-hash','extra-query','unknown-token',
  'post','localhost-host'];
 same(raw.negatives,negatives,'thirteen exact denial scenarios');
 same(raw.requests.length,27,'two pages, ten assets, thirteen denials, two HEADs');
 const oldIndex=readJsonPin(root,source.binding.predecessorIndex),
  previous=oldIndex.pages.find(row=>row.animationId==='shared-alg001-l06-p027');
 need(previous,'exact P027 inherited resource owner');
 const old=readJsonPin(root,previous.proof).packet,
  inherited=[old.entry.artifacts.runtime,
   old.continuousSource.mainRuns[0].asset];
 const assets=[['canvas-renderer.js',source.assetPins.canvas,'text/javascript; charset=utf-8',ID],
  ['main-source-v1',source.assetPins.main,'audio/mpeg',ID],
  ['optional-spanish-audio-v1',source.assetPins.sa,'audio/mpeg',ID],
  ['canvas-renderer.js',inherited[0],'text/javascript; charset=utf-8',
   'shared-alg001-l06-p027'],
  ['main-source-v1',inherited[1],'audio/mpeg',
   'shared-alg001-l06-p027']];
 for(let localeIndex=0;localeIndex<2;localeIndex++){
  const locale=['en','es'][localeIndex],offset=localeIndex*6,
   document=raw.requests[offset];
  same([document.url,document.method,document.status],
   [route(locale),'GET',200],`${locale} local candidate document`);
  need(document.responseHeaders?.['x-robots-tag']?.includes('noindex')&&
   document.responseHeaders?.['content-type']==='text/html; charset=utf-8',
   `${locale} protected document`);
  for(let i=0;i<assets.length;i++){
   const [token,pin,type,id]=assets[i],row=raw.requests[offset+i+1];
   same([row.url,row.method,row.status,row.bytes,row.sha256],
    [asset(token,pin,id),'GET',200,pin.bytes,pin.sha256],
    `${locale} exact asset ${i}`);
   need(row.responseHeaders?.['x-robots-tag']?.includes('noindex')&&
    row.responseHeaders?.['cache-control']?.includes('no-store')&&
    row.responseHeaders?.['content-length']===String(pin.bytes)&&
    row.responseHeaders?.['content-type']===type&&
    row.responseHeaders?.['cross-origin-resource-policy']==='same-origin',
    `${locale} protected asset ${i}`);
  }
 }
 const denied=raw.requests.slice(12,25),main=source.assetPins.main,
  mainUrl=asset('main-source-v1',main);
 for(let i=0;i<denied.length;i++){
  const row=denied[i],name=negatives[i];
  need(row.status===(name==='post'?405:404)&&row.bytes===0&&
   row.sha256!==main.sha256,`HTTP ${name} denies source bytes`);
 }
 const head=raw.requests[25],scriptHead=raw.requests[26];
 same([head.url,head.method,head.status,head.bytes,
  head.responseHeaders?.['content-length'],
  head.responseHeaders?.['content-type']],
  [mainUrl,'HEAD',200,0,String(main.bytes),'audio/mpeg'],
  'main HEAD exposes metadata only');
 need(head.responseHeaders?.['x-robots-tag']?.includes('noindex')&&
  head.responseHeaders?.['cache-control']?.includes('no-store'),
  'HEAD metadata protected');
 same([scriptHead.method,scriptHead.status,scriptHead.bytes],
  ['HEAD',404,0],'script HEAD denied');
 return true;
}

const DICTIONARY_ROOT='/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const DICTIONARY=[
 {root:DICTIONARY_ROOT,pin:{path:'L1KTE01.xml',bytes:345838,
  sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'}},
 {root:DICTIONARY_ROOT,pin:{path:'L1KTS01.xml',bytes:344456,
  sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'}}];
const ownSources=[SOURCE,XML,SA].map(pin=>({root:SOURCE_ROOT,pin}));

/** This can read historical packets for raw mutation tests. Formal acceptance
 * additionally requires readCurrentSource and the current v4-or-later binding. */
export function readSourcePacket(root,packetPin){
 same(pinFile(root,packetPin.path),packetPin,'exact packet bytes');
 const binding=readJsonPin(root,packetPin);
 same([binding.schemaVersion,binding.kind,binding.animationId,binding.source,
  binding.predecessorIndex,binding.predecessorHost,
  binding.acceptanceEffects],
  [1,'alg-l06-p028-candidate-source-binding-v1',ID,SOURCE,
   EXPECTED_INDEX,EXPECTED_HOST,ACCEPTANCE],
  'P028 source packet identity and pending gates');
 same(binding.external,[...ownSources,...DICTIONARY],
  'three physical sources and two dictionary sources');
 same(uniquePins(binding.files),binding.files,
  'source packet unique sorted workspace pins');
 for(const pin of binding.files)readPin(root,pin);
 for(const item of binding.external)readPin(item.root,item.pin);
 need(binding.limits?.candidateOnly===true&&
  binding.limits?.optionalSpanishExplicit===true&&
  binding.limits?.optionalSpanishSpliced===false&&
  binding.limits?.originalHostRunObserved===false,
  'source packet retains pending original-runtime/audio gates');
 const named=['sourcePlan','native','canvas','audioPlan','browserDecode','crosswalk'];
 const bound=new Map(binding.files.map(pin=>[pin.path,pin]));
 for(const name of named)
  same(bound.get(binding[name]?.path),binding[name],
   `named source packet input ${name}`);
 const sourcePlan=readJsonPin(root,binding.sourcePlan),
  native=readJsonPin(root,binding.native),
  canvas=readJsonPin(root,binding.canvas),
  audioPlan=readJsonPin(root,binding.audioPlan),
  browserDecode=readJsonPin(root,binding.browserDecode),
  crosswalk=readJsonPin(root,binding.crosswalk);
 same([sourcePlan.identity.animationId,
  sourcePlan.identity.globalActiveOrdinal,
  sourcePlan.identity.sectionCode,
  sourcePlan.identity.sectionPageOrdinal,
  sourcePlan.frameDomains.map(row=>[row.id,row.frames])],
  [ID,28,'VB',18,[['root',10],['sprite-30',134]]],
  'physical source order and frame domains');
 same([native.animationId,native.sourceSwfSha256,native.mainFrameCount,
  native.definitions.length,native.nativeCandidateTextInstanceIds.length],
  [ID,SOURCE.sha256,134,21,51],
  'native source text and frame count');
 same([canvas.animationId,canvas.source.sha256,
  canvas.sourceClipMasks.length,canvas.sourceGlyphRendering.default,
  canvas.sourceGlyphRendering.suppressTextIdsSupported],
  [ID,SOURCE.sha256,1,'preserve-all',false],
  'one mask and no unsourced glyph suppression');
 same([audioPlan.main.asset.sha256,audioPlan.main.declaredSamples,
  audioPlan.main.blockCount,audioPlan.optionalSpanishAudio.source,
  audioPlan.optionalSpanishAudio.localeAutoplay,
  audioPlan.optionalSpanishAudio.joinedWithMain],
  [MAIN_SHA,243648,133,SA,false,false],
  'one embedded main and independent optional SA');
 same(crosswalk.entries.map(row=>row.sourceKeyAttribute),KEYS,
  'three source dictionary keys');
 same(browserDecode.results.map(row=>[row.sourceSha256,row.samples,
  row.pcmSha256]),[[MAIN_SHA,243648,MAIN_PCM],[SA.sha256,129024,SA_PCM]],
  'actual main/SA Chrome PCM identity');
 const assetPins={canvas:canvas.outputs.find(row=>row.path===
   'output/alg-l06-p028-canvas-v1/canvas-renderer.js'),
  main:audioPlan.main.asset,sa:audioPlan.optionalSpanishAudio.asset};
 need(Object.values(assetPins).every(Boolean),'three source-owned assets');
 for(const pin of Object.values(assetPins)){
  same(bound.get(pin.path),pin,`bound asset ${pin.path}`);
  readPin(root,pin);
 }
 same([assetPins.canvas.sha256,assetPins.main.sha256,
  assetPins.sa.sha256],[CANVAS_SHA,MAIN_SHA,SA.sha256],
  'exact Canvas/main/SA hashes');
 same(Object.keys(binding.artifacts).sort(),['module','runtime','timeline'],
  'canonical artifact triple');
 same(binding.artifacts.module.path,
  `packages/demos/src/modules/${ID}.tsx`,'own module path');
 same(binding.artifacts.timeline.path,
  `packages/demos/src/timelines/${ID}.ts`,'own timeline path');
 need(binding.artifacts.runtime.path.startsWith('work/g678-shared-page-factory/')&&
  binding.artifacts.runtime.path.endsWith(`/members/${ID}/canvas-renderer.js`),
  'own factory runtime path');
 same([binding.artifacts.runtime.bytes,binding.artifacts.runtime.sha256],
  [assetPins.canvas.bytes,assetPins.canvas.sha256],
  'factory runtime has exact maintained Canvas bytes');
 for(const pin of Object.values(binding.artifacts)){
  same(bound.get(pin.path),pin,`bound artifact ${pin.path}`);
  readPin(root,pin);
 }
 return {binding,bindingPin:packetPin,sourcePlan,native,canvas,
  audioPlan,browserDecode,crosswalk,assetPins,external:binding.external};
}

function staticRuntimeBinding(root){
 const pin=pinFile(root,RUNTIME_BINDING),text=readPin(root,pin).toString('utf8'),
  match=text.match(/export const P028_CANDIDATE_BINDING = ([\s\S]*?) as const;/);
 need(match,'static P028 candidate binding');
 return {pin,binding:JSON.parse(match[1])};
}

/** Source and browser bytes remain current after the predecessor registry is
 * succeeded. This reader does not assert that its predecessor is still active. */
export function readBoundSource(root){
 const runtime=staticRuntimeBinding(root),binding=runtime.binding;
 need(/^output\/alg-l06-p028-product-integration-v1\/candidate-source-binding-v([4-9]|[1-9]\d+)\.json$/.test(binding.packet?.path),
  'packet-v4-or-later required after mathematical text repair');
 same([binding.index,binding.host],
  [EXPECTED_INDEX,EXPECTED_HOST],
  'exact historical predecessor index-v95/host-v94');
 same(pinFile(root,EXPECTED_INDEX.path),EXPECTED_INDEX,'immutable predecessor index bytes');
 const index=readJsonPin(root,EXPECTED_INDEX),host=verifyHostVersion(root,EXPECTED_HOST);
 same(index.host,EXPECTED_HOST,'predecessor host pointer');
 const source=readSourcePacket(root,binding.packet);
 for(const name of ['sourcePlan','native','canvas','audioPlan',
  'crosswalk','browserDecode'])
  same(binding[name],source.binding[name],
   `runtime ${name} pins source packet`);
 same([binding.packet,binding.index,binding.host],
  [source.bindingPin,source.binding.predecessorIndex,
   source.binding.predecessorHost],
  'runtime binds exact packet and predecessor');
 same(binding.candidateRegistrySha256,PREDECESSOR_REGISTRY_SHA,
  'runtime binds one frozen predecessor registry');
 const decoded=source.browserDecode.results.map(row=>({
  sourceSha256:row.sourceSha256,sourceBytes:row.sourceBytes,
  sampleRate:row.sampleRate,channels:row.channels,
  decodedSamples:row.samples,pcmSha256:row.pcmSha256}));
 same([binding.browserMain,binding.browserSpanish],decoded,
  'runtime binds both actual Chrome PCM measurements');
 return {...source,runtimeBinding:binding,runtimeBindingPin:runtime.pin,
  index,host};
}

/** Producer preflight, before registration: all 25 proofs and the current
 * 515-entry predecessor transaction must still match. */
export function readCurrentSource(root){
 const source=readBoundSource(root);
 const {index,host}=source;
 const activation=fs.readFileSync(path.join(root,
  'apps/web/lib/g678-admission-activation.ts'),'utf8'),
  active=activation.match(/=\s*(\{[\s\S]*?\})\s+as const;/);
 need(active,'literal active index pin');
 same(JSON.parse(active[1]),EXPECTED_INDEX,'actual active index-v95');
 const tx=readRegistryTransaction(root);
 need(index.pages.length===25&&
  index.pages.some(p=>p.animationId==='shared-alg001-l06-p027')&&
  !index.pages.some(p=>p.animationId===ID),
  '25 retained proofs; P028 not admitted');
 for(const old of index.pages)readPageProof(root,old.proof,host,tx);
 same(source.runtimeBinding.candidateRegistrySha256,tx.sha256,
  'exact unchanged registry transaction');
 need(tx.registry.calibrations.flatMap(c=>c.entries)
  .filter(e=>e.key.startsWith('shared-')).length===515,
  '515 predecessor shared pages');
 return {...source,transaction:tx};
}

export function validateRawCases(raw,source,root){
 same(Object.keys(raw??{}),RAW_NAMES,'six actual raw cases required');
 validateNativeMain(raw.nativeMainEn,'en',source);
 validateNativeMain(raw.nativeMainEs,'es',source);
 validateControls(raw.controls,source);
 validateNavigation(raw.navigation);
 validateHttp(raw.http,source,root);
 validateResponsive(raw.responsive);
 return true;
}

/** Stable runs freeze the predecessor transaction as historical evidence.
 * Every other candidate input, especially P028 source and runtime bytes,
 * must still match the workspace when this receipt is consumed. */
export function validateFrozenCandidateInputs(candidate,source,readCurrentPin){
 same(uniquePins(candidate.files),candidate.files,
  'stable candidate inputs sorted and unique');
 const frozen=new Map(candidate.files.map(item=>[item.path,item]));
 need(eqPin(frozen.get(RUNTIME_BINDING),source.runtimeBindingPin),
  'exact current runtime binding frozen');
 need(eqPin(frozen.get(source.bindingPin.path),source.bindingPin),
  'exact source packet frozen');
 for(const item of [EXPECTED_INDEX,EXPECTED_HOST,...source.binding.files])
  need(eqPin(frozen.get(item.path),item),
   `immutable predecessor/source input frozen ${item.path}`);
 const historical=new Map(HISTORICAL_TRANSACTION_PINS.map(item=>[item.path,item]));
 for(const item of HISTORICAL_TRANSACTION_PINS)
  need(eqPin(frozen.get(item.path),item),
   `exact historical transaction pin ${item.path}`);
 for(const item of candidate.files)
  if(!historical.has(item.path))readCurrentPin(item);
 return true;
}

/** A receipt remains checkable after its valid registration changes the
 * active index and registry. Raw/source/immutable input drift still fails. */
export function validateEngineeringReceipt(receipt,root,sourceOverride){
 const source=readBoundSource(root);
 if(sourceOverride){
  same(sourceOverride.bindingPin,source.bindingPin,
   'caller uses exact source packet');
  if(sourceOverride.runtimeBindingPin!==undefined)
   same(sourceOverride.runtimeBindingPin,source.runtimeBindingPin,
    'caller uses exact runtime binding');
 }
 same([receipt?.schemaVersion,receipt?.kind,receipt?.animationId,
  receipt?.status,receipt?.bindingPin,receipt?.indexPin,
  receipt?.hostPin,receipt?.registered,receipt?.denominator,
  receipt?.pageErrors,receipt?.consoleErrors,receipt?.acceptanceEffects],
  [1,'g678-p028-local-my-lesson-engineering-v1',ID,'passed',
   source.bindingPin,EXPECTED_INDEX,EXPECTED_HOST,false,2282,[],[],ACCEPTANCE],
  'actual P028 engineering receipt and independent gates');
 same(uniquePins(receipt.artifacts),receipt.artifacts,
  'sorted unique P028 browser artifact pins');
 const artifacts=new Map(receipt.artifacts.map(pin=>[pin.path,pin]));
 for(const pin of receipt.artifacts){
  need(pin.path.startsWith(BROWSER_DIR)&&!pin.path.includes('..'),
   `bounded current browser artifact ${pin.path}`);
  readPin(root,pin);
 }
 same(Object.keys(receipt.raw??{}),RAW_NAMES,
  'six current raw case paths in exact order');
 const raw={};
 for(const [name,file] of Object.entries(receipt.raw)){
  same(file,BROWSER_DIR+RAW_PATHS[name],`exact current ${name} raw path`);
  const pin=artifacts.get(file);
  need(pin,`${name} raw file included in receipt artifacts`);
  raw[name]=readJsonPin(root,pin);
  if(raw[name].screenshot){
   need(raw[name].screenshot.startsWith(BROWSER_DIR)&&
    artifacts.has(raw[name].screenshot),
    `${name} current screenshot retained and pinned`);
  }
 }
 validateRawCases(raw,source,root);
 same(Object.keys(receipt.stableRuns??{}),RAW_NAMES,
  'six frozen stable runs name the same raw cases');
 const candidates=[];
 for(const [name,pin] of Object.entries(receipt.stableRuns)){
  same(pin?.path,BROWSER_DIR+STABLE_PATHS[name],
   `exact current stable ${name} path`);
  need(eqPin(pin,artifacts.get(pin.path)),
   `stable ${name} included in receipt artifacts`);
  const stable=readJsonPin(root,pin);
  same([stable.schemaVersion,stable.kind,stable.animationIds,
   stable.host,stable.registrySha256,stable.phase,
   stable.exitCode,stable.drift,stable.status,stable.error],
   [1,'g678-stable-browser-run-v1',['shared-alg001-l06-p027'],
    EXPECTED_HOST,PREDECESSOR_REGISTRY_SHA,'postflight',0,null,
    'stable-command-passed',null],
   `stable ${name} execution and exact registry`);
  need(stable.candidate?.path?.startsWith('work/g678-workflow/browser-candidates/')&&
   !stable.candidate.path.includes('..'),
   `bounded stable candidate for ${name}`);
  same(pinFile(root,stable.candidate.path),stable.candidate,
   `stable ${name} candidate bytes`);
  const candidate=readJsonPin(root,stable.candidate);
  same([candidate.schemaVersion,candidate.kind,candidate.index,
   candidate.host,candidate.animationIds,candidate.registrySha256],
   [1,'g678-stable-browser-candidate-v1',EXPECTED_INDEX,
    EXPECTED_HOST,['shared-alg001-l06-p027'],PREDECESSOR_REGISTRY_SHA],
   `frozen ${name} predecessor and transaction`);
  need(Object.values(candidate.acceptanceEffects).every(value=>value===false),
   `${name} stable candidate remains acceptance-neutral`);
  validateFrozenCandidateInputs(candidate,source,item=>readPin(root,item));
  candidates.push(stable.candidate);
 }
 const cases=receipt.cases;
 for(const key of ['nativeMainEn','nativeMainEs','glossary3','replay',
  'explicitSpanish','explicitReturn','navigation','cleanup','http','responsive'])
  same(cases?.[key],true,`real P028 case ${key}`);
 return {validated:true,receipt,source,raw,artifacts:receipt.artifacts,
  candidates:uniquePins(candidates),runtimeBindingPin:source.runtimeBindingPin,
  registrySha256:PREDECESSOR_REGISTRY_SHA};
}

/** This is the page-owned semantic assertion after the generic writer's
 * artifact checks and before a new registry transaction is allowed. */
export function validateFinalPacket(packet,registration,root,source,
 receiptPin,engineering){
 same(pinFile(root,receiptPin.path),receiptPin,'current engineering receipt bytes');
 const checked=validateEngineeringReceipt(readJsonPin(root,receiptPin),root,source);
 same(engineering.receipt,checked.receipt,
  'same fully validated real browser receipt');
 same([packet?.schemaVersion,packet?.sourceRoot,packet?.scope,
  packet?.deploymentScope,packet?.source,packet?.sourceXml,
  packet?.calibrationId],
  [1,SOURCE_ROOT,'private-engineering','local-only',SOURCE,XML,
   'g678-alg-l06-p028-current-js-20261001-v3'],
  'final source and calibration identity');
 same(packet.entry,{key:ID,module:`./modules/${ID}`,
  maturity:'private-current-js',complexityLane:'interactive-understood',
  artifacts:source.binding.artifacts},
  'exact module/timeline/Canvas entry');
 same(packet.selectedPages,[{animationId:ID,placementId:ID,
  assetId:`swf-${SOURCE.sha256}`,sourceSha256:SOURCE.sha256,
  moduleCode:'ALG001',lessonNumber:6,globalPageOrdinal:28,
  sourceOccurrence:28,sectionCode:'VB',sectionPageOrdinal:18,
  complexityLane:'interactive-understood',
  runtime:{frameDomain:'sprite-30',frameCount:134,rootFrameCount:10,
   rootBeginFrame:6,fps:12,stage:{width:800,height:600},
   scenario:'source-static-frame',seed:'0',
   canvasRenderer:source.binding.artifacts.runtime,
   terminalPolicy:'native-main-audio-eof-and-final-frame-hold',
   hostPlaybackCompletion:false}}],
  'one source-ordered P028 placement');
 same([packet.continuousSource?.frameDomain,
  packet.continuousSource?.visualFrames,
  packet.continuousSource?.blockCount,
  packet.continuousSource?.mainRuns?.length,
  packet.continuousSource?.mainRuns?.[0]?.blockFrameRange,
  packet.continuousSource?.mainRuns?.[0]?.asset?.sha256,
  packet.continuousSource?.mainRuns?.[0]?.browserPcmSha256],
  ['sprite-30',134,133,1,[2,134],MAIN_SHA,MAIN_PCM],
  'one continuous source main and Chrome PCM');
 same([packet.optionalSpanishAudio?.source,
  packet.optionalSpanishAudio?.browserPcmSha256,
  packet.optionalSpanishAudio?.trigger,
  packet.optionalSpanishAudio?.localeAutoplay,
  packet.optionalSpanishAudio?.mainStreamSpliced],
  [SA,SA_PCM,'explicit-user-only',false,false],
  'independent explicit Spanish Audio');
 same(Object.keys(packet.glossaryActions??{}),KEYS,
  'three source-exact glossary action keys');
 for(const key of KEYS){
  const action=source.sourcePlan.glossary.find(row=>row.keyAttribute===key),
   control=source.native.glossary.find(row=>row.key===key),
   entry=source.crosswalk.entries.find(row=>row.sourceKeyAttribute===key),
   bound=packet.glossaryActions[key];
  same([bound?.sourceKey,bound?.characterId,bound?.buttonInstanceId,
   bound?.sourceActionSha256,bound?.entryId,
   bound?.originalClickObserved],
   [key,action.buttonCharacterId,control.instanceId,
    action.action.sha256,entry.id,false],
   `source glossary action ${key}`);
 }
 same(packet.engineeringReceipt,receiptPin,
  'exact real host receipt pin in final freeze');
 same(packet.browserRaw,engineering.receipt.raw,
  'six raw cases named by current receipt');
 same(packet.browserStableRuns,engineering.receipt.stableRuns,
  'six stable runs named by current receipt');
 same(packet.acceptanceEffects,ACCEPTANCE,
  'independent downstream gates remain pending');
 same([packet.productCalibrationPassed,packet.scaleOutAuthorized,
  packet.integrity?.completeTransitiveClosure],
  [false,false,false],'no strict closure or scale-out claim');
 same(uniquePins(packet.integrity.files),packet.integrity.files,
  'sorted unique complete producer input closure');
 same(packet.hostInputBoundary?.host,EXPECTED_HOST,'exact separately verified host boundary');
 const allInputs=uniquePins([...packet.integrity.files,...packet.hostInputBoundary.files]);
 const boundary=verifyPageHostInputBoundary(root,EXPECTED_HOST,allInputs);
 same(boundary.pageOwned,packet.integrity.files,'page owns only non-host inputs');
 same(boundary.hostManaged,packet.hostInputBoundary.files,'all overlapping inputs belong to exact current host');
 const closure=new Map(allInputs.map(item=>[item.path,item]));
 const required=uniquePins([source.bindingPin,...source.binding.files,
  checked.runtimeBindingPin,...Object.values(packet.entry.artifacts),
  receiptPin,...engineering.artifacts,...engineering.candidates]);
 for(const item of required){
  need(eqPin(closure.get(item.path),item),
   `final freeze includes source/browser pin ${item.path}`);
  readPin(root,item);
 }
 same(registration,{calibrationId:packet.calibrationId,
  deploymentScope:'local-only',freezeManifest:packet.freezeManifest.path,
  freezeManifestBytes:packet.freezeManifest.bytes,
  freezeManifestSha256:packet.freezeManifest.sha256,
  entries:[packet.entry]},
  'exact final production writer registration');
 return true;
}

export const validateP028EngineeringReceipt=validateEngineeringReceipt;
export const validateP028FinalPacket=validateFinalPacket;
