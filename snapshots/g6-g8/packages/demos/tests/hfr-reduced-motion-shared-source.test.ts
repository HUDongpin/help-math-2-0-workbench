import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {Runtime, MovieClip, ButtonObj} from '../src/hfr/display';
import {makeHelpers} from '../src/hfr/helpers';
import {initializeHfrReducedMotion, HFR_REDUCED_MOTION_REGISTERED_SOURCES, type HfrReducedMotionState} from '../src/hfr/reduced-motion';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');
const registry=JSON.parse(read('packages/demos/private-current-js-registry.json'));
const entries=new Map<string,any>(registry.calibrations.flatMap((c:any)=>c.entries.filter((e:any)=>e.artifacts?.kind==='generated-typescript-hfr-v1').map((e:any)=>[e.key,e])));
const P023={data:'work/g678-shared-page-factory/hfr-ts-nms-l11-p023-claude-glyph-v2/members/shared-nms002-l11-p023/shared-nms002-l11-p023.data.json',
  factory:'work/hfr-typescript/hfr/out/corpus-v1/shared-nms002-l11/pages/shared-nms002-l11-p023/shared-nms002-l11-p023.ts'};
const dataPath=(id:string)=>id==='shared-nms002-l11-p023'?P023.data:entries.get(id).artifacts.data.path;
const dataSha=(id:string)=>createHash('sha256').update(fs.readFileSync(path.join(ROOT,dataPath(id)))).digest('hex');

async function start(id:string,edit?:(data:any)=>void){
  const data=JSON.parse(read(dataPath(id)));edit?.(data);
  const factory=(await import(pathToFileURL(path.join(ROOT,id==='shared-nms002-l11-p023'?P023.factory:`packages/demos/src/hfr-pages/${id}.ts`)).href)).default;
  const rt=new Runtime(data,{seed:0,audio:null});rt.helpers=makeHelpers(rt);rt.scripts=factory(rt.helpers);rt.shell.set('Report_URL','');rt.loadPage();
  return rt;
}
/** The reduced-motion state literal exactly as the page module passes it. */
function moduleState(id:string):any{
  const file=id==='shared-nms002-l11-p018'?'packages/demos/src/hfr/nms-l11-p018-native-config.ts':`packages/demos/src/modules/${id}.tsx`;
  const text=read(file),open=text.indexOf('{',text.indexOf('reducedMotionState'));
  let depth=0,end=open;
  do{if(text[end]==='{')depth++;else if(text[end]==='}')depth--;end++;}while(depth>0);
  return JSON.parse(text.slice(open,end));
}
async function outcome(id:string,state:any,edit?:(data:any)=>void,during?:(rt:Runtime)=>void):Promise<string>{
  const rt=await start(id,edit);
  if(during){const tick=rt.tick.bind(rt);rt.tick=()=>{tick();during(rt);};}
  try{initializeHfrReducedMotion(rt,state as HfrReducedMotionState,dataSha(id));return 'ok';}catch(error){return (error as Error).message;}
}
const primary=(data:any,state:any)=>data.dictionary[Number(state.frameDomain.slice('sprite-'.length))];

// Every glossary page with a reduced-motion state, as [page, readable frame, looping].
const GLOSSARY:readonly [string,number,boolean][]=[
  ['shared-alg001-l02-p007',429,false],['shared-geo001-l03-p007',196,true],['shared-nms002-l03-p005',140,true],['shared-nms002-l03-p006',170,true],
  ['shared-nms002-l03-p008',157,true],['shared-nms002-l06-p005',187,true],['shared-nms002-l07-p005',157,false],['shared-nms002-l08-p006',190,false],
  ['shared-nms002-l11-p005',190,false],['shared-nms002-l11-p006',832,true],['shared-nms002-l11-p007',459,true],['shared-nms002-l11-p008',874,false],
  ['shared-nms002-l11-p011',610,true],['shared-nms002-l11-p012',839,true],['shared-nms002-l11-p013',733,true],['shared-nms002-l11-p015',598,true],
  ['shared-nms002-l11-p018',553,true],['shared-nms002-l11-p023',485,true],
];

test('every glossary page reaches its readable state through its own binding',async()=>{
  for(const [id,frame,looping] of GLOSSARY){
    const rt=await start(id),state=moduleState(id);
    initializeHfrReducedMotion(rt,state,dataSha(id));
    const clip=rt.allObjects().find(o=>o instanceof MovieClip&&o.charId===Number(state.frameDomain.slice(7))) as MovieClip;
    assert.deepEqual([state.frame,clip.frame,clip.playing,rt.page_.playing],[frame,frame,looping,false],id);
    assert(rt.clickables().length>0,id);
  }
});

test('a stopped state ends on the exact authored stop of its primary clip',async()=>{
  const id='shared-nms002-l11-p008',state=moduleState(id);
  assert.equal(await outcome(id,state),'ok');
  assert.equal(await outcome(id,{...state,terminalActionSha256:'0'.repeat(64)}),'HFR_REDUCED_MOTION_STOP_BINDING_INVALID');
  assert.equal(await outcome(id,state,data=>{primary(data,state).frames[873]=primary(data,state).frames[873].filter((t:any)=>t.op!=='action');}),'HFR_REDUCED_MOTION_STOP_BINDING_INVALID');
  assert.equal(await outcome(id,state,data=>{primary(data,state).frames[9].push({op:'action',script:'sprite49_frame10'});}),'HFR_REDUCED_MOTION_STOP_BINDING_INVALID');
  assert.notEqual(await outcome(id,{...state,sourceBehavior:'audited-looping-source-vocabulary'}),'ok');
  for(const id of ['shared-alg001-l02-p007','shared-nms002-l07-p005','shared-nms002-l08-p006','shared-nms002-l11-p005']){
    const s=moduleState(id);
    assert.equal(await outcome(id,s,data=>{primary(data,s).frames[1].push({op:'action',script:'probe'});}),'HFR_REDUCED_MOTION_STATEMENT_BINDING_INVALID',id);
  }
});

test('a looping state needs a primary clip with no authored action',async()=>{
  for(const id of ['shared-geo001-l03-p007','shared-nms002-l06-p005','shared-nms002-l11-p006','shared-nms002-l11-p023']){
    const s=moduleState(id);
    assert.equal(await outcome(id,s),'ok',id);
    assert.equal(await outcome(id,s,data=>{primary(data,s).frames[1].push({op:'action',script:'probe'});}),'HFR_REDUCED_MOTION_STATEMENT_BINDING_INVALID',id);
  }
  // A stopping question cannot be declared a loop at its first complete frame.
  const s=moduleState('shared-nms002-l11-p005');
  assert.equal(await outcome('shared-nms002-l11-p005',{...s,sourceBehavior:'audited-looping-source-statement-glossary',frame:186,maximumInitializationTicks:186}),'HFR_REDUCED_MOTION_STATEMENT_BINDING_INVALID');
});

test('a glossary control is accepted only where the source timeline places it',async()=>{
  const id='shared-nms002-l08-p006',state=moduleState(id);
  // L8 replaces its controls at frame155 (depth71 -> 65). Depth71 is still a
  // reviewed instance of control41, but not on frames after 155.
  const back=(rt:Runtime)=>{
    for(const o of rt.allObjects())if(o instanceof ButtonObj&&o.charId===41&&o.depth===65&&(o.parentClip as MovieClip).frame>=160){
      const p=o.parentClip as MovieClip;p.children.delete(65);p.children.set(71,o);o.depth=71;
    }
  };
  assert.equal(await outcome(id,state,undefined,back),'HFR_REDUCED_MOTION_INTERACTION_OR_RUNTIME_ERROR');
  // A depth the binding never reviewed is refused even where the data places it.
  assert.equal(await outcome(id,state,data=>{for(const f of primary(data,state).frames)for(const t of f)if(t.op==='place'&&t.depth===65&&t.charId===41)t.depth=66;}),
    'HFR_REDUCED_MOTION_INTERACTION_OR_RUNTIME_ERROR');
  assert.equal(await outcome(id,state),'ok');
});

test('practice states route only to the page that owns them',async()=>{
  const P014=(await import('../src/hfr/nms-l11-p014-reduced-motion')).P014_REDUCED;
  const P019=(await import('../src/hfr/nms-l11-p019-reduced-motion')).P019_REDUCED;
  assert.equal(await outcome('shared-nms002-l11-p014',P014),'ok');
  assert.equal(await outcome('shared-nms002-l11-p014',{...P014,animationId:'shared-nms002-l11-p099'}),'HFR_REDUCED_MOTION_PRACTICE_BINDING_INVALID');
  assert.equal(await outcome('shared-nms002-l11-p019',{...P019,sourceBehavior:'audited-source-drag-practice'}),'HFR_REDUCED_MOTION_PRACTICE_BINDING_INVALID');
  assert.equal(await outcome('shared-nms002-l11-p019',P019),'ok');
});

test('the one frozen source is registered L7 P005 and equals its own binding and data',async()=>{
  assert.deepEqual(Object.keys(HFR_REDUCED_MOTION_REGISTERED_SOURCES),['shared-nms002-l07-p005']);
  const id='shared-nms002-l07-p005',frozen=HFR_REDUCED_MOTION_REGISTERED_SOURCES[id],state=moduleState(id);
  assert(entries.has(id),'registered');
  const line=read('packages/demos/src/hfr/hfr-native-text.ts').split('\n').find(l=>l.startsWith('const P005_STYLED_SENTENCE: HfrStyledSentenceDecision = '))!;
  const binding=JSON.parse(line.slice(line.indexOf('{'),line.lastIndexOf('}')+1));
  assert.equal(binding.sourceInteraction,undefined,'the binding carries no first-button frame or hit character');
  assert.deepEqual([frozen.animationId,frozen.sourceSwfSha256,frozen.candidateJsonSha256,`sprite-${frozen.timeline}`,frozen.rootFrame,frozen.frames,frozen.readableFrame],
    [binding.animationId,binding.sourceSwfSha256,binding.candidateJsonSha256,binding.sourceFrameDomain,binding.rootFrame,binding.lastCompleteFrame,binding.lastCompleteFrame]);
  assert.deepEqual([state.animationId,state.sourceSha256,state.dataSha256,state.frameDomain,state.frame],[id,frozen.sourceSwfSha256,frozen.candidateJsonSha256,`sprite-${frozen.timeline}`,frozen.readableFrame]);
  assert.equal(frozen.primaryDepth,Number(/^root:(\d+):\d+:40\//.exec(binding.sourceTextInstanceId)![1]));
  assert.deepEqual(frozen.controls.map(c=>[c.characterId,c.depths]),binding.controls.map((c:any)=>[c.sourceButtonCharacterId,[Number(c.instanceId.split('/').at(-1).split(':')[1])]]));
  const data=JSON.parse(read(dataPath(id)));
  for(const c of frozen.controls)assert.equal(data.dictionary[c.characterId].records[0].charId,c.hitCharacterId);
  const first=data.dictionary[frozen.timeline].frames.findIndex((tags:any[])=>tags.some(t=>t.op==='place'&&t.charId===frozen.controls[0].characterId))+1;
  assert.equal(frozen.firstButtonFrame,first);
});

test('the shared state type names no page',()=>{
  const source=read('packages/demos/src/hfr/reduced-motion.ts');
  assert.doesNotMatch(source,/sourceBehavior[^}\n]*animationId\s*:\s*'shared-/);
  assert.doesNotMatch(source,/state\.animationId\s*===\s*'shared-/);
});
