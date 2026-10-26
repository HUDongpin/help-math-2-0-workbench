import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {Runtime, MovieClip} from '../src/hfr/display';
import {makeHelpers} from '../src/hfr/helpers';
import {resumeHfrGlossarySource} from '../src/hfr/host-bridge';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');
const registry=JSON.parse(read('packages/demos/private-current-js-registry.json'));
const entries=new Map<string,any>(registry.calibrations.flatMap((c:any)=>c.entries.filter((e:any)=>e.artifacts?.kind==='generated-typescript-hfr-v1').map((e:any)=>[e.key,e])));
const P023={data:'work/g678-shared-page-factory/hfr-ts-nms-l11-p023-claude-glyph-v2/members/shared-nms002-l11-p023/shared-nms002-l11-p023.data.json',
  factory:'work/hfr-typescript/hfr/out/corpus-v1/shared-nms002-l11/pages/shared-nms002-l11-p023/shared-nms002-l11-p023.ts'};

async function start(id:string){
  const data=JSON.parse(read(id==='shared-nms002-l11-p023'?P023.data:entries.get(id).artifacts.data.path));
  const factory=(await import(pathToFileURL(path.join(ROOT,id==='shared-nms002-l11-p023'?P023.factory:`packages/demos/src/hfr-pages/${id}.ts`)).href)).default;
  const rt=new Runtime(data,{seed:0,audio:null});rt.helpers=makeHelpers(rt);rt.scripts=factory(rt.helpers);rt.shell.set('Report_URL','');rt.loadPage();
  return rt;
}
/** Tick until a root child clip is playing on its own final frame. */
function loopEnd(rt:Runtime,bound=4000):MovieClip|null {
  for(let tick=0;tick<bound;tick++){
    const clip=rt.allObjects().find((o:any)=>o instanceof MovieClip&&o.parentClip===rt.page_&&o.playing&&o.totalFrames>1&&o.frame===o.totalFrames) as MovieClip|undefined;
    if(clip)return clip;rt.tick();
  }
  return null;
}
function resumes(rt:Runtime,clip:MovieClip,perturb:()=>()=>void=()=>()=>{}):boolean {
  const restore=perturb();clip.playing=false;
  try{assert.equal(resumeHfrGlossarySource(rt,{runtime:rt,clip,frame:clip.frame,resumeSource:true}),true);return clip.playing;}
  finally{clip.playing=false;restore();}
}

// The ten replaced page blocks, as [page, primary character, depth, final frame].
const REVIEWED:readonly [string,number,number,number][]=[
  ['shared-geo001-l03-p007',13,5,239],['shared-nms002-l06-p005',17,1,194],['shared-nms002-l11-p006',34,3,832],
  ['shared-nms002-l11-p007',37,3,459],['shared-nms002-l11-p011',58,3,610],['shared-nms002-l11-p012',43,2,839],
  ['shared-nms002-l11-p013',55,2,733],['shared-nms002-l11-p015',36,2,598],['shared-nms002-l11-p018',47,2,553],
  ['shared-nms002-l11-p023',30,2,485],
];

test('every reviewed loop resumes from its final frame through its own binding',async()=>{
  for(const [id,charId,depth,frames] of REVIEWED){
    const rt=await start(id),clip=loopEnd(rt);
    assert(clip,`${id} reaches its loop end`);
    assert.deepEqual([clip.charId,clip.depth,clip.frame,clip.totalFrames],[charId,depth,frames,frames],id);
    assert.equal(resumes(rt,clip),true,id);
  }
});

test('registered pages that held their loop end keep holding it',async()=>{
  for(const id of ['shared-nms002-l03-p005','shared-nms002-l03-p006','shared-nms002-l03-p008']){
    const rt=await start(id),clip=loopEnd(rt);
    assert(clip,`${id} reaches its loop end`);
    assert.equal(resumes(rt,clip),false,id);
  }
});

test('a loop end resumes only while the clip is exactly the reviewed placement',async()=>{
  const rt=await start('shared-nms002-l11-p023'),clip=loopEnd(rt)!;
  const swap=(o:any,k:string,v:unknown)=>()=>{const old=o[k];o[k]=v;return ()=>{o[k]=old;};};
  const cases:Record<string,()=>()=>void>={
    'moved':swap(clip.m,'tx',clip.m.tx+1),'script-moved':swap(clip,'scriptMoved',true),'hidden':swap(clip,'visible',false),
    'ratio':swap(clip,'ratio',4),'root-playing':swap(rt.page_,'playing',true),'root-frame':swap(rt.page_,'frame',rt.page_.frame+1),
    'depth':swap(clip,'depth',clip.depth+1),'source':swap(rt.page.source,'sha256','0'.repeat(64)),
    'authored-action':()=>{const f=(clip.def as any).frames[0];f.push({op:'action'});return ()=>f.pop();},
  };
  assert.equal(resumes(rt,clip),true);
  for(const [name,perturb] of Object.entries(cases))assert.equal(resumes(rt,clip,perturb),false,name);
  assert.equal(resumes(rt,clip),true);
});

test('a frame before the end still resumes and a source that was not playing never does',async()=>{
  const rt=await start('shared-nms002-l11-p012'),clip=loopEnd(rt)!;
  rt.tick();rt.tick();
  assert(clip.frame<clip.totalFrames);
  assert.equal(resumes(rt,clip),true);
  clip.playing=false;
  assert.equal(resumeHfrGlossarySource(rt,{runtime:rt,clip,frame:clip.frame,resumeSource:false}),true);
  assert.equal(clip.playing,false);
});
