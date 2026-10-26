#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, readdir, lstat, realpath, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TASK='/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f';
const OUT=path.join(TASK,'frozen16-intro-linkages-v1');
const sha=b=>createHash('sha256').update(b).digest('hex');
const bindings=new Map();
async function bound(file) {
  const before=await lstat(file,{bigint:true});
  assert(before.isFile()&&!before.isSymbolicLink()&&await realpath(file)===file,`${file}: canonical ordinary file required`);
  const bytes=await readFile(file),after=await lstat(file,{bigint:true});
  for(const key of ['dev','ino','size','mtimeNs','mode','nlink'])assert.equal(before[key],after[key],`${file}: changed during read`);
  bindings.set(file,{path:file,bytes:bytes.length,sha256:sha(bytes)});
  return bytes;
}
const MEMBERS=[
  ['shared-alg001-l01-p001',83,135,null,61677,'cd5d73e2aed3214c547dd7758d0201905ce39e7cc0dcfc6d6473ca177d764650','092efa0029dda364ba700b7cb26a3f9a57dd64114fef90e060e21c92d9f120b1',20,'b3482834dde083e0538a48c6ba038fd13555f8c1f02477a3ec3c2894c31d1983'],
  ['shared-dat001-l01-p001',133,136,132,99134,'9cb2f39f0f33fbf7a100f1f306424051864d932c7107b97649e88ae3253203c6','ebac929ceaecaefcaa18811639c79ff73872eb9aa8204396c2a568b0ecd4de60',23,'aa5a393026d03707d0c8449ce561ae073966fc9f6f7191c19948bab0e740701c'],
  ['shared-nms002-l01-p001',113,136,112,92448,'714ecfc1cca2d49766c43c107337c7ef1996122d40073721ee67529cf89f9dd3','1bc33e200c09976d2500be4783574bd0d86324e9935fca2de4ff4a947582601f',23,'aa5a393026d03707d0c8449ce561ae073966fc9f6f7191c19948bab0e740701c'],
];

export async function audit() {
  const catalog=JSON.parse(await bound(path.join(ROOT,'catalog/g678-shared-catalog.v1.json')));
  const pages=catalog.lessons.flatMap(l=>l.pages);
  const segmentation=JSON.parse(await bound(path.join(TASK,'frozen16-audio-segments-v1/receipt.json')));
  const records=[];
  for(const [id,mainId,frameCount,childId,sourceBytes,sourceHash,fingerprint,scriptCount,scriptSetHash] of MEMBERS) {
    const member=path.join(ROOT,'work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members',id);
    const catalogPage=pages.find(p=>p.animationId===id);assert(catalogPage);
    assert.equal(catalogPage.sourceSha256,sourceHash);assert.equal(catalogPage.sourceBytes,sourceBytes);
    const source=await bound(path.join(member,'source/source.swf'));
    assert.equal(source.length,sourceBytes);assert.equal(sha(source),sourceHash);
    const canonical=path.join('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',catalogPage.viewPath);
    assert.equal(sha(await bound(canonical)),sourceHash);
    const facts=parseSwfSourceFacts(source);assert.equal(facts.structureFingerprintSha256,fingerprint);
    assert.equal(facts.header.fps,12);assert.equal(facts.header.rootFrameCount,10);
    const reachable=facts.frameDomains.domains.filter(d=>d.staticallyRootReachable);
    const main=reachable.find(d=>d.domainId===`sprite-${mainId}`),root=reachable.find(d=>d.kind==='root');
    assert.deepEqual(reachable.map(d=>d.domainId).sort(),['root',`sprite-${mainId}`,...(childId?[`sprite-${childId}`]:[])].sort());
    assert.equal(main.declaredFrameCount,frameCount);
    assert.deepEqual(root.placementEdges.map(e=>[e.childSpriteId,e.firstFrame,e.placementCount]),[[mainId,6,1]]);
    assert(reachable.filter(d=>d.kind!=='root').every(d=>d.scriptTagCount===0));
    if(childId)assert.equal(reachable.find(d=>d.spriteId===childId).declaredFrameCount,1);
    const placed=new Set(reachable.flatMap(d=>d.placementEdges.map(e=>e.characterId)));
    assert(reachable.every(d=>d.placementEdges.every(e=>!e.characterType.startsWith('DefineButton'))));
    assert(facts.linkageAndImports.exportedAssets.every(e=>!placed.has(e.characterId)));
    assert.equal(facts.linkageAndImports.importedAssets.length,0);
    const scripts=[];
    for(const relative of (await readdir(path.join(member,'canvas/scripts'),{recursive:true})).filter(p=>p.endsWith('.as')).sort()) {
      const bytes=await bound(path.join(member,'canvas/scripts',relative));
      scripts.push({path:relative,bytes:bytes.length,sha256:sha(bytes)});
      if(relative==='frame_1/DoAction.as')assert.equal(bytes.toString(),'_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n');
      if(relative==='frame_6/DoAction.as')assert.equal(bytes.toString(),'stop();\r\n');
    }
    assert.equal(scripts.length,scriptCount);assert.equal(sha(JSON.stringify(scripts)),scriptSetHash);
    assert.deepEqual(scripts.filter(s=>s.path.startsWith('frame_')).map(s=>s.path),['frame_1/DoAction.as','frame_6/DoAction.as']);
    const init=scripts.filter(s=>!s.path.includes('/'));
    assert.deepEqual(init.map(s=>s.path),childId?['FScrollBarSymbol.as','FUIComponentSymbol.as']:['FUIComponentSymbol.as']);
    assert.equal(root.scriptTagCount,2+init.length);
    const audio=segmentation.records.filter(r=>r.animationId===id);assert.equal(audio.length,1);
    const stream=audio[0];assert.equal(stream.source.sha256,sourceHash);assert.equal(stream.domain,main.domainId);
    assert.equal(stream.segments.length,1);assert.equal(stream.segments[0].firstBlockFrame,1);assert.equal(stream.segments[0].lastBlockFrame,frameCount);
    assert.equal(stream.blocks.length,frameCount);assert(stream.blocks.every(b=>b.seekSamples>=0));
    assert.equal(sha(await bound(stream.payload.path)),stream.payload.sha256);
    const adapter=JSON.parse(await bound(path.join(member,'adapter-spec.json')));
    assert.equal(adapter.source.swfSha256,sourceHash);assert.equal(adapter.timeline.local.frameCount,frameCount);
    assert.equal(adapter.timeline.local.playbackMode,'once');
    const canvasPath=path.join(member,'canvas-renderer.js');await bound(canvasPath);
    records.push({animationId:id,source:bindings.get(canonical),scripts,scriptSetSha256:scriptSetHash,
      sourceStructureFingerprintSha256:fingerprint,
      reachableDomains:reachable.map(d=>({domainId:d.domainId,frames:d.declaredFrameCount,scriptTagCount:d.scriptTagCount,placementEdges:d.placementEdges})),
      exportedButUnplacedLinkages:facts.linkageAndImports.exportedAssets,
      activePageButtons:0,activePageScriptedSprites:0,
      initDisposition:'FUI class/prototype and global style definitions; FScrollBar prototype initialization may install a legacy Selection listener. No root page display instance or page dynamic attachment. Preserve this evidence, do not recreate a nonexistent page scrollbar or emulate AVM1 globals in the modern host.',
      sourceBehavior:'Root preloader call and stops at frames 1/6; script-free child visual/stream timeline; one-frame nested graphic where present. Source has no explicit child terminal stop; current once-clamp is the modern host policy, not evidence of Flash terminal behavior.',
      resolvedBlocker:childId?'intro-fui-scroll-behavior-not-reconstructed':'intro-fui-component-behavior-not-reconstructed',
      family:'intro-script-free-child-with-unplaced-fui-linkages',complexity:'low-candidate',
      lane:'source-locked-canvas-plus-contiguous-stream-adapter-after-exact-product-verification',
      canvas:bindings.get(canvasPath),audio:{domain:stream.domain,payload:stream.payload,frameRate:stream.frameRate,sampleRate:stream.sampleRate,latencySamples:stream.latencySeek,segments:stream.segments},
      remainingBlockers:['embedded-audio-lifecycle-not-implemented','intro-my-lesson-first-paint-replay-and-native-audio-qa-pending','original-runtime-terminal-and-source-audio-alignment-not-accepted'],
      productCalibrationPassed:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,scaleOutAuthorized:false});
  }
  for(const file of [fileURLToPath(import.meta.url),path.join(ROOT,'scripts/build-g4-l3-machine-source-audits.mjs')])await bound(file);
  for(const binding of bindings.values()){const b=await readFile(binding.path);assert.equal(b.length,binding.bytes);assert.equal(sha(b),binding.sha256);}
  return {schemaVersion:1,status:'exact-source-linkage-audit-passed',scope:MEMBERS.map(r=>r[0]),records,inputBindings:[...bindings.values()],
    disposition:'Three exact FUI reconstruction blockers resolved at source-audit gate only. Original frozen 16-page batch unchanged.',
    productCalibrationPassed:false,scaleOutAuthorized:false,originalRuntimeAccepted:false,audioAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const check=process.argv[2]==='--check';assert(process.argv.length===2||process.argv.length===3&&check);
  const value=await audit(),bytes=JSON.stringify(value,null,2)+'\n';
  if(check)assert.equal(await readFile(path.join(OUT,'receipt.json'),'utf8'),bytes);
  else {await mkdir(OUT);await writeFile(path.join(OUT,'receipt.json'),bytes,{flag:'wx'});}
  console.log(JSON.stringify({output:OUT,check,pages:value.records.length,status:value.status,productCalibrationPassed:false}));
}
