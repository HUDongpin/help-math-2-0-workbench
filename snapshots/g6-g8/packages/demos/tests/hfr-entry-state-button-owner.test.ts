import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=process.env.G678_ENTRY_STATE_WORKSPACE_ROOT??path.resolve(here,'../../..');
const runtimeRoot=process.env.G678_ENTRY_STATE_RUNTIME_DIR??path.resolve(here,'../src/hfr');
const {LessonRuntime}=await import(pathToFileURL(path.join(runtimeRoot,'lesson-runtime.ts')).href);
const {captureEntryState}=await import(pathToFileURL(path.join(runtimeRoot,'entry-state.ts')).href);
const {ASObject}=await import(pathToFileURL(path.join(runtimeRoot,'avm.ts')).href);
const {ButtonObj,DisplayObject}=await import(pathToFileURL(path.join(runtimeRoot,'display.ts')).href);
const registry=JSON.parse(fs.readFileSync(path.join(root,'packages/demos/private-current-js-registry.json'),'utf8'));
const pages=new Map<number,{data:any;factory:any}>();
for(const ordinal of [42,43]) {
 const id=`shared-nms002-l07-p${String(ordinal).padStart(3,'0')}`;
 const entry=registry.calibrations.flatMap((c:any)=>c.entries).find((e:any)=>e.key===id);
 assert.equal(entry.artifacts.kind,'generated-typescript-hfr-v1');
 for(const pin of [entry.artifacts.data,entry.artifacts.generated]) {
  const bytes=fs.readFileSync(path.join(root,pin.path));
  assert.equal(bytes.length,pin.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256);
 }
 const data=JSON.parse(fs.readFileSync(path.join(root,entry.artifacts.data.path),'utf8'));
 const factory=(await import(pathToFileURL(path.join(root,entry.artifacts.generated.path)).href)).default;
 pages.set(ordinal,{data,factory});
}
const binding=(data:any)=>({lessonKey:'shared-nms002-l07',pageKey:data.placement.animationId,
 sourceSha256:data.source.sha256,compiler:data.compiler,seed:0});
function enter(lesson:any,ordinal:number) {
 const {data,factory}=pages.get(ordinal)!;
 return lesson.enter(binding(data),data,factory,{audio:null});
}
/** Inspect the real persistent graph, without editing the product or its source. */
function retainedButtonChild(global:any) {
 const seen=new Set<object>(),queue:[any,string][]=[[global,'Global']];
 for(let i=0;i<queue.length;i++) {
  const [value,label]=queue[i];
  if(value===null||typeof value!=='object'||seen.has(value))continue;
  seen.add(value);assert(seen.size<20000,'bounded source graph');
  if(value instanceof DisplayObject&&Object.hasOwn(value,'buttonOwner'))return {child:value,owner:(value as any).buttonOwner,path:label+'.buttonOwner'};
  if(value instanceof Map) {
   for(const [key,item] of value)queue.push([item,`${label}[${JSON.stringify(String(key))}]`]);
  } else if(value instanceof Set) {
   for(const item of value)queue.push([item,label+'.setValue']);
  } else {
   for(const [key,item] of Object.entries(value)) {
    if(['rt','def','stream','body','native','compiled','ctor'].includes(key))continue;
    queue.push([item,`${label}.${key}`]);
   }
  }
 }
 throw Error('P042 must create a reachable button state child after its first source tick');
}

for(const ticks of [1,2])test(`actual P042 ${ticks} tick(s) -> P043 -> Replay preserves the same button owner graph`,()=>{
 const lesson=new LessonRuntime();
 try {
  const first=enter(lesson,42),rt=lesson.active(first);
  for(let i=0;i<ticks;i++)assert.equal(lesson.tick(first),true);
  const retained=retainedButtonChild(rt.Global),{child,owner}=retained;
  assert(owner instanceof ButtonObj);assert.equal(owner.rt,rt);
  assert.equal(owner.stateChildren.includes(child),true);
  const childIndex=owner.stateChildren.indexOf(child);
  const beforeGlobal=rt.Global;
  // Match the real player's resource-release boundary before the next page.
  assert.equal(lesson.release(first),true);
  let second;
  try {second=enter(lesson,43);} catch(error) {
   console.log('TRIAGE '+JSON.stringify({ticks,phase:'P042-to-P043',status:'failed',error:String(error),fieldPath:(error as any).path,retainedPath:retained.path,ownerCharacterId:owner.charId,childCharacterId:child.charId}));
   throw error;
  }
  assert.equal(second.disposition,'navigation');
  assert.equal(lesson.active(second),rt);assert.equal(rt.Global,beforeGlobal);
  assert.equal((child as any).buttonOwner,owner);
  assert.equal(owner.stateChildren[childIndex],child);
  // Change only in-memory state after the real entry snapshot, then Replay.
  (child as any).buttonOwner=null;owner.stateChildren=[];
  const replay=enter(lesson,43);
  assert.equal(replay.disposition,'replay');assert.equal(lesson.active(replay),rt);
  assert.equal((child as any).buttonOwner,owner,'restore the exact existing owner, not a replacement');
  assert.equal(owner.stateChildren[childIndex],child,'restore the same state child in its owner graph');
  assert.equal(child.rt,owner.rt);assert.equal(child.rt,rt);
  assert.equal(lesson.tick(replay),true);
  assert.deepEqual(rt.errors,[]);
  console.log('TRIAGE '+JSON.stringify({ticks,phase:'P042-to-P043-Replay',status:'passed',retainedPath:retained.path,ownerCharacterId:owner.charId,childCharacterId:child.charId,ownerAndChildIdentityRetained:true,sameVm:true}));
 } finally {lesson.close();}
});

test('actual P042 with zero ticks -> P043 remains a valid timing control',()=>{
 const lesson=new LessonRuntime();
 try {enter(lesson,42);assert.equal(enter(lesson,43).disposition,'navigation');}
 finally {lesson.close();}
});

test('an unknown native field is still rejected with its exact field path',()=>{
 const lesson=new LessonRuntime();
 try {
  const opened=enter(lesson,43),rt=lesson.active(opened),value=new ASObject(rt,rt.ObjectProto);
  (value as any).unclassifiedNativePayload=7;rt.Global.set('unknownProbe',value);
  assert.throws(()=>captureEntryState(rt),(error:any)=>error.code==='HFR_ENTRY_UNSUPPORTED_FIELD'&&error.path.endsWith('.unclassifiedNativePayload'));
 } finally {lesson.close();}
});

test('a buttonOwner from another VM is still rejected, rather than shallow-copied',()=>{
 const lesson=new LessonRuntime(),foreignLesson=new LessonRuntime();
 try {
  const rt=lesson.active(enter(lesson,43)),foreign=foreignLesson.active(enter(foreignLesson,43));
  const child=new DisplayObject(rt,null,{kind:'shape'},rt.page_,1,'owner-probe',1);
  const owner=new ButtonObj(foreign,foreign.ButtonProto,{kind:'button',records:[],conds:[]},foreign.page_,2,'foreign-owner',2);
  (child as any).buttonOwner=owner;rt.Global.set('foreignOwnerProbe',child);
  assert.throws(()=>captureEntryState(rt),(error:any)=>error.code==='HFR_ENTRY_FOREIGN_VM'&&error.path.endsWith('.buttonOwner'));
 } finally {lesson.close();foreignLesson.close();}
});

test('native Date remains unsupported; the fix does not admit arbitrary payloads',()=>{
 const lesson=new LessonRuntime();
 try {
  const rt=lesson.active(enter(lesson,43));rt.Global.set('dateProbe',rt.construct(rt.Global.get('Date'),[]));
  assert.throws(()=>captureEntryState(rt),(error:any)=>error.code==='HFR_ENTRY_UNSUPPORTED_FIELD'&&error.path.endsWith('.t'));
 } finally {lesson.close();}
});

test('an unsupported entry still retires the lease and leaves the VM unavailable until close',()=>{
 const lesson=new LessonRuntime();
 try {
  const first=enter(lesson,42),rt=lesson.active(first),value=new ASObject(rt,rt.ObjectProto);
  (value as any).unclassifiedNativePayload=7;rt.Global.set('unknownProbe',value);
  assert.throws(()=>enter(lesson,43),/HFR_ENTRY_UNSUPPORTED_FIELD/);
  assert.equal(lesson.active(first),null);assert.equal(lesson.tick(first),false);
  assert.throws(()=>enter(lesson,43),/HFR_LESSON_VM_UNAVAILABLE/);
  lesson.close();assert.equal(enter(lesson,43).disposition,'new-lesson');
 } finally {lesson.close();}
});
