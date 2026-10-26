import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {P004_TEXT_OCCURRENCES} from '../src/alg-l06-p004-text-occurrences-v2.generated';
import {P004_EQUATION_EVIDENCE_V1 as evidence,P004_EQUATION_EXCLUDED_NATIVE_INSTANCE_IDS as excluded,
 P004_EQUATION_SOURCE_GROUPS_V1 as groups,P004_EQUATION_SOURCE_SHAPES_V1 as shapes,
 P004_EQUATION_STATES_V1 as states,P004_SUBSTITUTION_SOURCE_SHAPE_V1 as substitutionShape,p004EquationRows} from '../src/alg-l06-p004-equation-presentation-v1';

const root=new URL('../../../',import.meta.url);
const read=(path:string)=>readFileSync(new URL(path,root));
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const sourceBytes=read('migrations/shared-alg001-l06-p004/audit/source-text-v1.json');
const source=JSON.parse(sourceBytes.toString());
const decisionBytes=read('output/alg-l06-p004-equation-states-v1/teaching-decision-v1.json');
const decision=JSON.parse(decisionBytes.toString());
const analysisBytes=read('output/alg-l06-p004-equation-states-v1/source-analysis-v1.json');
const analysis=JSON.parse(analysisBytes.toString());
const timeline=source.timelines.find((item:any)=>item.timelineId==='sprite-95');

test('all equation groups match the pinned teaching decision and actual source catalog',()=>{
 assert.equal(sha(sourceBytes),evidence.sourceTextSha256);
 assert.equal(sha(decisionBytes),evidence.teachingDecisionSha256);
 assert.equal(sha(analysisBytes),evidence.sourceAnalysisSha256);
 assert.equal(source.sourceSha256,evidence.sourceSwfSha256);
 assert.equal(analysis.sourcePins[0].sha256,evidence.sourceSwfSha256);
 assert.equal(analysis.sourcePins[1].sha256,evidence.sourceTextSha256);
 for(const [name,instanceIds] of Object.entries(groups)){
  assert.deepEqual(instanceIds,decision.sourceAnchors[name],name);
  for(const instanceId of instanceIds as string[]){
   const instance=timeline.instances.find((item:any)=>item.instanceId===instanceId);
   const occurrence=P004_TEXT_OCCURRENCES.find(item=>item.instanceId===instanceId);
   assert(instance&&occurrence,instanceId);
   assert.equal(instance.characterId,occurrence.characterId);
   assert.deepEqual(occurrence.sourceTextIds,source.textDefinitions.find((item:any)=>item.characterId===instance.characterId).runs.map((run:any)=>run.sourceTextId));
  }
 }
 assert.equal(excluded.length,89);
 assert.equal(new Set(excluded).size,89);
 assert.deepEqual(excluded,Object.values(groups).flat());
 assert(!excluded.includes('sprite-95/depth-97/generation-1'));
});

test('intro source placements spell one formula in spatial order; outlined shapes are real distinct source generations',()=>{
 const glyphs=groups.introGlyphs.map(instanceId=>{
  const event=timeline.events.find((item:any)=>item.instanceId===instanceId);
  const definition=source.textDefinitions.find((item:any)=>item.characterId===event.characterId);
  assert.equal(event.frame,1);
  return {text:definition.runs.map((run:any)=>run.text).join(''),x:event.matrix[4],y:event.matrix[5]};
 });
 assert.equal(glyphs.sort((a,b)=>a.x-b.x).map(item=>item.text).join(''),'M=$0.50xC');
 assert(glyphs.every(item=>Math.abs(item.y-glyphs[0].y)<=80));
 for(const [index,shape] of shapes.entries()){
  const instance=timeline.instances.find((item:any)=>item.instanceId===shape.instanceId);
  const definition=source.shapeDefinitions.find((item:any)=>item.characterId===shape.characterId);
  const placement=timeline.events.find((item:any)=>item.instanceId===shape.instanceId);
  assert(instance&&definition&&placement);
  assert.equal(definition.sourceTagSha256,shape.sourceTagSha256);
  assert.equal(placement.sourceTagSha256,shape.placementTagSha256);
  assert.deepEqual([instance.firstFrame,instance.lastFrameExclusive],[shape.firstFrame,shape.lastFrameExclusive]);
  assert.deepEqual({...decision.sourceAnchors.outlinedTransitions[index],role:shape.role},
   {characterId:shape.characterId,sourceTagSha256:shape.sourceTagSha256,instanceId:shape.instanceId,
    firstFrame:shape.firstFrame,lastFrame:shape.lastFrameExclusive,placementTagSha256:shape.placementTagSha256,
    placementMatrix:placement.matrix,role:shape.role});
 }
 assert.equal(p004EquationRows(84)[0].sourceShapeAnchors[0].characterId,49);
 assert.equal(p004EquationRows(91)[0].sourceShapeAnchors[0].characterId,49);
 assert.equal(p004EquationRows(92)[0].sourceShapeAnchors[0].characterId,50);
 assert.equal(p004EquationRows(92)[0].sourceTextIds.length,0);
});

test('three worked stages follow the direct alpha and source replacement boundaries',()=>{
 const resultId='sprite-95/depth-91/generation-1';
 const alpha=Object.fromEntries(timeline.events.filter((event:any)=>event.instanceId===resultId&&event.colorTransform)
  .map((event:any)=>[event.frame,event.colorTransform.multiply[3]]));
 assert.deepEqual([360,361,364,366,367,455,456,461,462].map(frame=>[frame,alpha[frame]??(frame===455?256:null)]),
  [[360,0],[361,37],[364,146],[366,219],[367,256],[455,256],[456,219],[461,37],[462,0]]);
 assert.deepEqual(states.map(row=>[row.id,row.firstFrame,row.lastFrame]),[
  ['equation-intro',1,83],['equation-outline',84,92],['equation93',93,831],
  ['equation-worked-substitution',314,366],['equation-worked-result-with-m',367,373],
  ['equation-worked-calculation',374,461]]);
 for(const [frame,ids] of [
  [313,['equation93']],[314,['equation93','equation-worked-substitution']],[315,['equation93','equation-worked-substitution']],
  [366,['equation93','equation-worked-substitution']],[367,['equation93','equation-worked-result-with-m']],
  [373,['equation93','equation-worked-result-with-m']],[374,['equation93','equation-worked-calculation']],
  [461,['equation93','equation-worked-calculation']],[462,['equation93']],[831,['equation93']],
 ] as const)assert.deepEqual(p004EquationRows(frame).map(row=>row.id),ids);
 assert(!p004EquationRows(363)[1].sourceTextInstanceIds.includes(resultId));
 assert(p004EquationRows(363)[1].sourceTextInstanceIds.includes('sprite-95/depth-90/generation-3'));
 assert(p004EquationRows(364)[1].sourceTextInstanceIds.includes(resultId));
 assert(!p004EquationRows(364)[1].sourceTextInstanceIds.includes('sprite-95/depth-90/generation-3'));
 assert(!p004EquationRows(374)[1].sourceTextInstanceIds.includes('sprite-95/depth-87/generation-2'));
 assert(p004EquationRows(374)[1].sourceTextInstanceIds.includes('sprite-95/depth-87/generation-3'));
});

test('every frame has one coherent rule and only complete worked values with frame-active provenance',()=>{
 for(let frame=1;frame<=831;frame++){
  const rows=p004EquationRows(frame),active=new Set(timeline.instances.filter((item:any)=>item.firstFrame<=frame&&frame<item.lastFrameExclusive).map((item:any)=>item.instanceId));
  assert.equal(rows.filter(row=>row.kind==='rule').length,1,`rule ${frame}`);
  assert(rows.length<=2);
  for(const row of rows){
   assert(row.sourceTextInstanceIds.every(id=>active.has(id)),`active source ${frame}`);
   assert(row.sourceShapeAnchors.every(shape=>active.has(shape.instanceId)),`active shape ${frame}`);
   assert(row.ariaLabel.length>row.text.length);
   assert(row.language==='en'&&row.valueSource==='maintained-page-state');
  }
  if(frame<314||frame>=462)assert.equal(rows.length,1);
  if(frame<=366)assert(!rows.some(row=>row.text.includes('$2.50')));
 }
 assert.notEqual(states[2].ariaLabel,states[4].ariaLabel);
 for(const frame of [0,832,-1,NaN,1.5])assert.throws(()=>p004EquationRows(frame),RangeError);
});

test('completed outlined5 at314 hands off to text61 at315 with no early result',()=>{
 const shape=source.shapeDefinitions.find((item:any)=>item.characterId===67);
 const instance=timeline.instances.find((item:any)=>item.instanceId===substitutionShape.instanceId);
 const place=timeline.events.find((item:any)=>item.eventId===instance.createdByEventId);
 assert.equal(shape.sourceTagSha256,substitutionShape.sourceTagSha256);
 assert.equal(place.sourceTagSha256,substitutionShape.placementTagSha256);
 assert.deepEqual([instance.depth,instance.generation,instance.firstFrame,instance.lastFrameExclusive],[90,2,314,315]);
 assert.equal(place.flags.hasColorTransform,false);
 const prior=timeline.instances.find((item:any)=>item.characterId===66);
 assert.deepEqual([prior.firstFrame,prior.lastFrameExclusive],[307,314]);
 const next=timeline.instances.find((item:any)=>item.instanceId==='sprite-95/depth-90/generation-3');
 assert.equal(next.characterId,61);assert.equal(next.firstFrame,315);
 const decision=read('output/alg-l06-p004-substitution-implementation-v1/decision.json');
 assert.equal(sha(decision),evidence.substitutionDecisionSha256);
 for(const frame of [314,315]){
  const row=p004EquationRows(frame).find(row=>row.kind==='worked')!;
  assert.equal(row.text,'M = $0.50 × 5');assert(!row.text.includes('$2.50'));
  assert.deepEqual(row.sourceShapeAnchors.map(s=>s.characterId),frame===314?[67]:[]);
  assert.equal(row.sourceTextInstanceIds.includes(next.instanceId),frame===315);
 }
});
