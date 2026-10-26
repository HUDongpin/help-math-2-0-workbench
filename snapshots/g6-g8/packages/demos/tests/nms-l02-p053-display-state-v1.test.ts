import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {p053DomainSnapshot,p053NestedSnapshot} from
  '../src/nms-l02-p053-display-state-v1';
import type {P053DisplayScene} from '../src/nms-l02-p053-display-state-v1';

const file = new URL('../../../migrations/shared-nms002-l02-p053/audit/visual-scene-v1.json',
  import.meta.url);
const scene = JSON.parse(readFileSync(file,'utf8')) as P053DisplayScene & {
  sourceMarkers: {earlyStart: {instanceId: string}; laterStart: {instanceId: string};
    popup: {instanceId: string}};
};
const main = (frame: number, mode: 'playback'|'structural' = 'structural') =>
  p053DomainSnapshot(scene,'sprite-187',frame,{mode});

test('real source playback holds main 693 while structural 694 remains inspectable',()=>{
 const root5=p053DomainSnapshot(scene,'root',5);
 const root6=p053DomainSnapshot(scene,'root',6);
 assert(!root5.instances.some(item=>item.characterId===187));
 assert(root6.instances.some(item=>item.instanceId==='root/depth-3/generation-1'&&
  item.characterId===187&&item.depth===3));
 const early=scene.sourceMarkers.earlyStart.instanceId;
 assert.equal(main(1).instances.find(item=>item.instanceId===early)?.colorTransform.multiply[3],0);
 assert.equal(main(6).instances.find(item=>item.instanceId===early)?.colorTransform.multiply[3],256);
 assert(!main(7).instances.some(item=>item.instanceId===early));
 const popup=scene.sourceMarkers.popup.instanceId;
 const late=scene.sourceMarkers.laterStart.instanceId;
 assert(main(693).instances.some(item=>item.instanceId===popup));
 assert(main(693).instances.some(item=>item.instanceId===late));
 assert(!main(694).instances.some(item=>item.instanceId===popup));
 assert(main(694).instances.some(item=>item.instanceId===late));
 const held=main(694,'playback');
 assert.equal(held.requestedFrame,694);assert.equal(held.frame,693);
 assert(held.instances.some(item=>item.instanceId===popup));
 assert.throws(()=>main(695,'playback'),/P053_FRAME_OUT_OF_DOMAIN/);
 assert.throws(()=>main(Number.POSITIVE_INFINITY),/P053_FRAME_OUT_OF_DOMAIN/);
 assert.throws(()=>main(1.5),/P053_FRAME_OUT_OF_DOMAIN/);
 assert.throws(()=>p053DomainSnapshot(scene,'sprite-999',1),/P053_UNKNOWN_FRAME_DOMAIN/);
});

test('eight source mask generations retain exact clip-depth association',()=>{
 for(const [frame,count] of [[173,0],[174,1],[221,2],[277,3],[436,4],
  [492,5],[535,6],[586,7],[615,8],[693,8],[694,8]] as const){
  const state=main(frame);
  assert.equal(state.instances.filter(item=>item.clipDepth!==null).length,count,`frame ${frame}`);
  for(const item of state.instances){
   const expected=state.instances.filter(mask=>mask.clipDepth!==null&&
    mask.depth<item.depth&&item.depth<=mask.clipDepth!).map(mask=>mask.instanceId);
   assert.deepEqual(item.sourceMaskInstanceIds,expected,`frame ${frame} depth ${item.depth}`);
  }
 }
 const at174=main(174);
 const mask=at174.instances.find(item=>item.depth===1)!;
 assert.equal(mask.instanceId,'sprite-187/depth-1/generation-2');
 assert.equal(mask.clipDepth,3);
 assert(at174.instances.find(item=>item.depth===2)!.sourceMaskInstanceIds.includes(mask.instanceId));
 assert(!at174.instances.find(item=>item.depth===4)?.sourceMaskInstanceIds.includes(mask.instanceId));
 assert.equal(main(175).instances.find(item=>item.depth===1)?.instanceId,mask.instanceId);
 assert.notDeepEqual(main(175).instances.find(item=>item.depth===1)?.matrix,mask.matrix);
});

test('nested traversal requires an explicit local clock for every sprite',()=>{
 assert.throws(()=>p053NestedSnapshot(scene,'root',6,{}),/P053_CHILD_CLOCK_REQUIRED/);
 assert.throws(()=>p053NestedSnapshot(scene,'root',6,
  {'root/depth-1/generation-1':1,'root/depth-3/generation-1':0}),
  /P053_FRAME_OUT_OF_DOMAIN/);
 assert.throws(()=>p053NestedSnapshot(scene,'sprite-104',1,
  {'sprite-104/depth-99/generation-1':1}),/P053_UNKNOWN_CHILD_CLOCK/);
});

function syntheticScene(): P053DisplayScene {
 const event=(id:string,frame:number,depth:number,characterId:number,
  matrix:readonly [number,number,number,number,number,number],
  alpha:number,clipDepth?:number)=>({kind:'place' as const,eventId:id,frame,depth,
   sourceTagSha256:'a'.repeat(64),move:false,
   instanceId:`${id.split('/')[0]}/depth-${depth}/generation-1`,characterId,
   matrix,colorTransform:{multiply:[256,256,256,alpha] as const,
    add:[0,0,0,0] as const,divisor:256 as const},
   ...(clipDepth===undefined?{}:{clipDepth})});
 const rootEvent=event('root/a',6,3,187,[2,0,0,2,100,200],128);
 const maskEvent=event('sprite-187/a',1,1,1,[1,0,0,1,0,0],256,3);
 const childEvent=event('sprite-187/b',1,2,200,[1,0,0,1,50,25],128);
 const leafEvent=event('sprite-200/a',1,1,1,[1,0,0,1,10,20],128);
 const domain=(id:string,count:number,events:readonly ReturnType<typeof event>[])=>({
  id,declaredFrameCount:count,observedFrameCount:count,events,
  instances:events.map(e=>({instanceId:e.instanceId,timelineId:id,depth:e.depth,
   generation:1,characterId:e.characterId,firstFrame:e.frame,
   lastFrameExclusive:count+1,createdByEventId:e.eventId,updates:[e.eventId]})),
  masks:events.filter(e=>e.clipDepth!==undefined).map(e=>({instanceId:e.instanceId,
   characterId:e.characterId,depth:e.depth,clipDepth:e.clipDepth!,firstFrame:e.frame,
   lastFrameExclusive:count+1,sourceTagSha256:e.sourceTagSha256})),
 });
 return {schemaVersion:1,kind:'nms-l02-p053-visual-scene-source-v1',
  animationId:'shared-nms002-l02-p053',source:{sha256:scene.source.sha256,rootFrames:10},
  rootPlacement:{rootFrame:6,depth:3,characterId:187,
   instanceId:'root/depth-3/generation-1'},
  mainFrameDomain:{id:'sprite-187',declaredFrames:694,heldFrame:693,
   heldActionTagSha256:scene.mainFrameDomain.heldActionTagSha256,
   nextDeclaredFrame:694,nextFrameAutoReachedEstablished:false},
  definitions:{shapes:[{characterId:1}],bitmaps:[],texts:[],
   sprites:[{characterId:187,domainId:'sprite-187'},
    {characterId:200,domainId:'sprite-200'}],buttons:[]},
  domains:[domain('root',10,[rootEvent]),domain('sprite-187',694,[maskEvent,childEvent]),
   domain('sprite-200',1,[leafEvent])]};
}

test('nested matrices remain in twips, colors compose, and mask ancestry is explicit',()=>{
 const input=syntheticScene();
 const rootPath='root/depth-3/generation-1';
 const childPath=`${rootPath}>sprite-187/depth-2/generation-1`;
 const state=p053NestedSnapshot(input,'root',6,{[rootPath]:1,[childPath]:1});
 const mainNode=state.instances[0]!;
 const child=mainNode.child!.instances.find(item=>item.characterId===200)!;
 const leaf=child.child!.instances[0]!;
 assert.deepEqual(child.worldMatrix,[2,0,0,2,200,250]);
 assert.deepEqual(leaf.worldMatrix,[2,0,0,2,220,290]);
 assert.equal(child.worldColorTransform.multiply[3],64);
 assert.equal(leaf.worldColorTransform.multiply[3],32);
 assert.deepEqual(child.sourceMaskPaths,
  [`${rootPath}>sprite-187/depth-1/generation-1`]);
 assert.deepEqual(leaf.sourceMaskPaths,child.sourceMaskPaths);
 const loop=structuredClone(input) as P053DisplayScene;
 const loopDomains=loop.domains as unknown as Array<{
  events: Array<{characterId:number}>; instances:Array<{characterId:number}>}>;
 loopDomains[2]!.events[0]!.characterId=187;
 loopDomains[2]!.instances[0]!.characterId=187;
 assert.throws(()=>p053NestedSnapshot(loop,'root',6,{
  [rootPath]:1,[childPath]:1,
  [`${childPath}>sprite-200/depth-1/generation-1`]:1,
 }),/P053_NESTED_DOMAIN_LOOP/);
});

test('same-depth replacement preserves generation identity and inherited transforms',()=>{
 const source=structuredClone(syntheticScene()) as P053DisplayScene;
 const domain=source.domains.find(item=>item.id==='sprite-187') as unknown as {
  events: Array<Record<string,unknown>>;
  instances:Array<Record<string,unknown>>;
 };
 const former=domain.events[1]!;
 domain.instances[1]!.lastFrameExclusive=2;
 const replacement:Record<string,unknown>={...former,eventId:'sprite-187/replace',frame:2,move:true,
  instanceId:'sprite-187/depth-2/generation-2'};
 delete replacement.matrix;delete replacement.colorTransform;
 const update={kind:'place',eventId:'sprite-187/update',frame:3,depth:2,move:true,
  instanceId:replacement.instanceId,sourceTagSha256:'b'.repeat(64),
  matrix:[1,0,0,1,70,30],colorTransform:{multiply:[256,256,256,64],
   add:[0,0,0,0],divisor:256}};
 const remove={kind:'remove',eventId:'sprite-187/remove',frame:4,depth:2,
  instanceId:replacement.instanceId,sourceTagSha256:'c'.repeat(64)};
 domain.events.push(replacement,update,remove);
 domain.instances.push({...domain.instances[1],instanceId:replacement.instanceId,
  generation:2,firstFrame:2,lastFrameExclusive:4,
  createdByEventId:replacement.eventId,updates:[replacement.eventId,update.eventId]});
 const before=p053DomainSnapshot(source,'sprite-187',1).instances.find(item=>item.depth===2)!;
 const after=p053DomainSnapshot(source,'sprite-187',2).instances.find(item=>item.depth===2)!;
 const changed=p053DomainSnapshot(source,'sprite-187',3).instances.find(item=>item.depth===2)!;
 assert.equal(before.generation,1);assert.equal(after.generation,2);
 assert.deepEqual(after.matrix,before.matrix);
 assert.deepEqual(after.colorTransform,before.colorTransform);
 assert.deepEqual(changed.matrix,[1,0,0,1,70,30]);
 assert.equal(changed.colorTransform.multiply[3],64);
 assert(!p053DomainSnapshot(source,'sprite-187',4).instances.some(item=>item.depth===2));
});
