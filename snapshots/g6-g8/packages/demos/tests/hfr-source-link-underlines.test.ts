import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {Runtime} from '../src/hfr/display';
import {makeHelpers} from '../src/hfr/helpers';
import {HFR_REGISTERED_UNDERLINE_HANDOFFS,buildHfrNativeTextFrame,prepareHfrNativeTextAsync} from '../src/hfr/hfr-native-text';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');
const registry=JSON.parse(read('packages/demos/private-current-js-registry.json'));
const entries=new Map<string,any>(registry.calibrations.flatMap((c:any)=>c.entries.filter((e:any)=>e.artifacts?.kind==='generated-typescript-hfr-v1').map((e:any)=>[e.key,e])));
const P023={data:'work/g678-shared-page-factory/hfr-ts-nms-l11-p023-claude-glyph-v2/members/shared-nms002-l11-p023/shared-nms002-l11-p023.data.json',
  factory:'work/hfr-typescript/hfr/out/corpus-v1/shared-nms002-l11/pages/shared-nms002-l11-p023/shared-nms002-l11-p023.ts',
  config:'work/hfr-typescript/life-session15-20261016/p023-source-consumer-preparation-v1/generation/config/native-runtime-config.json'};
const identity={lang:'en',scenario:'hfr',seed:0,replay:0} as const;

async function page(id:string){
  const p023=id==='shared-nms002-l11-p023';
  // P018 keeps the same embedded config in a page-owned module.
  const module=read(id==='shared-nms002-l11-p018'?'packages/demos/src/hfr/nms-l11-p018-native-config.ts':`packages/demos/src/modules/${id}.tsx`);
  const config=p023?JSON.parse(read(P023.config)):JSON.parse(JSON.parse(/const config\s*=\s*JSON\.parse\(("(?:[^"\\]|\\.)*")\)/.exec(module)![1]));
  const data=JSON.parse(read(p023?P023.data:entries.get(id).artifacts.data.path));
  const factory=(await import(pathToFileURL(path.join(ROOT,p023?P023.factory:`packages/demos/src/hfr-pages/${id}.ts`)).href)).default;
  const rt=new Runtime(data,{seed:0,audio:null});rt.helpers=makeHelpers(rt);rt.scripts=factory(rt.helpers);rt.shell.set('Report_URL','');rt.loadPage();
  const prepared=await prepareHfrNativeTextAsync(data,config.sourceCatalog,config.binding,config.decisions);
  return {rt,frame:()=>buildHfrNativeTextFrame(prepared,rt as any,config.frameDomain,identity)};
}
const isLine=(o:any)=>o.def?.kind==='shape'&&o.def.draws?.length===1&&Boolean(o.def.draws[0].line)&&o.def.bounds?.ymin===o.def.bounds?.ymax;
/** Every distinct underline set handed off over the page's whole timeline. */
async function handoffs(id:string,ticks=1500){
  const {rt,frame}=await page(id),sets=new Set<string>();let readyWithBody=0;
  for(let tick=0;tick<ticks;tick++){
    const f=frame();const lines=f.sourceObjects.filter(isLine).map((o:any)=>o.charId).sort((a:number,b:number)=>a-b);
    if(lines.length)sets.add(lines.join(','));
    if(f.snapshot.status==='ready'&&f.sourceObjects.some((o:any)=>o.def?.kind==='text'))readyWithBody++;
    rt.tick();
  }
  return {sets:[...sets].sort(),readyWithBody};
}

test('the shared rule hands off exactly the underlines the page blocks retired',async()=>{
  assert.deepEqual((await handoffs('shared-nms002-l11-p012')).sets,['3']);
  assert.deepEqual((await handoffs('shared-nms002-l11-p013')).sets,['3']);
  // P015's second reveal mask brings its own body and underline 10 later.
  assert.deepEqual((await handoffs('shared-nms002-l11-p015')).sets,['3','3,10']);
  assert.deepEqual((await handoffs('shared-nms002-l11-p023')).sets,['3']);
});

test('registered hand-offs include only the three newly visually confirmed source underlines',async()=>{
  assert.deepEqual(Object.keys(HFR_REGISTERED_UNDERLINE_HANDOFFS).sort(),['shared-nms002-l11-p007','shared-nms002-l11-p008','shared-nms002-l11-p011','shared-nms002-l11-p012','shared-nms002-l11-p013','shared-nms002-l11-p015']);
  for(const [id,expected] of [['shared-nms002-l11-p007',['12']],['shared-nms002-l11-p008',['6']],['shared-nms002-l11-p011',['6']],['shared-nms002-l11-p018',[]]] as const){
    const result=await handoffs(id);
    assert(result.readyWithBody>0,`${id} has native body frames`);
    assert.deepEqual(result.sets,expected,id);
  }
});

test('a moved, hidden or recoloured source underline keeps drawing',async()=>{
  const {rt,frame}=await page('shared-nms002-l11-p023');
  let line:any=null;
  for(let tick=0;tick<1500&&!line;tick++){line=frame().sourceObjects.find(isLine)??null;if(!line)rt.tick();}
  assert(line,'P023 hands off its underline');
  const handed=()=>frame().sourceObjects.includes(line);
  const swap=(o:any,k:string,v:unknown)=>{const old=o[k];o[k]=v;return ()=>{o[k]=old;};};
  for(const [name,perturb] of Object.entries({
    moved:()=>swap(line.m,'tx',line.m.tx+400),hidden:()=>swap(line,'visible',false),'script-moved':()=>swap(line,'scriptMoved',true),
    tinted:()=>swap(line,'cx',[256,256,256,128,0,0,0,0]),
  })){const restore=perturb();try{assert.equal(handed(),false,name);}finally{restore();}}
  assert.equal(handed(),true);
});
