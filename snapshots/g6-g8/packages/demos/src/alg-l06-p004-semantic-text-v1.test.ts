import {P004_PAIR_REPLACED_INSTANCE_IDS} from './alg-l06-p004-semantic-pairs-v1';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {p004SemanticText,P004_SENTENCE_REVEAL,P004_SENTENCE_REVEAL_EVIDENCE,P004_SEMANTIC_EQUATION as eq,P004_SEMANTIC_TEXT_BINDING as binding} from './alg-l06-p004-semantic-text-v1';
import {P004_EQUATION_EXCLUDED_NATIVE_INSTANCE_IDS} from './alg-l06-p004-equation-presentation-v1';
import {p004TextOccurrences} from './alg-l06-p004-text-occurrences-v2';
import {validateLessonTextBinding,lessonTextInstanceId} from './lesson-text-snapshot';
import {p004TextSnapshot} from './alg-l06-p004-text-snapshot-v1';
const root=new URL('../../../',import.meta.url);
test('formal binding orders are unique including hidden constituents and retain source semantic order in all frames',()=>{
 const orders=binding.blocks.map(block=>`${block.language}:${block.readingOrder}`);
 assert.equal(new Set(orders).size,orders.length);
 for(let frame=1;frame<=831;frame++){
  const snapshot=p004TextSnapshot({frame,frameDomain:'sprite-95',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0});
  assert.deepEqual(snapshot.blocks.filter(block=>block.visible).map(block=>block.id),p004SemanticText(frame).map(row=>row.id),`source semantic reading order at frame ${frame}`);
 }
});
test('semantic math binds exact reviewed geometry and real source IDs and instance paths',()=>{
 assert.equal(validateLessonTextBinding(binding),binding);
 const bytes=readFileSync(new URL(eq.auditPath,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),eq.auditSha256);
 const geometry=JSON.parse(bytes.toString());assert.deepEqual(eq.instanceIds,geometry.objects.map((o:any)=>o.instanceId));
 assert.equal(eq.text,geometry.semanticDecision.semanticMath);assert.deepEqual([eq.firstFrame,eq.lastFrame],geometry.semanticDecision.range);
 const sourceBytes=readFileSync(new URL('migrations/shared-alg001-l06-p004/audit/source-text-v1.json',root));
 assert.equal(createHash('sha256').update(sourceBytes).digest('hex'),geometry.sourcePins[1].sha256);
 const source=JSON.parse(sourceBytes.toString());
 assert.equal(binding.sourceSwfSha256,source.sourceSha256);
 const ids=new Set(source.textDefinitions.flatMap((d:any)=>d.runs.map((r:any)=>r.sourceTextId)));
 for(const block of binding.blocks){
  assert(block.sourceTextIds.every(id=>ids.has(id)));assert(block.instance);
  assert.equal(block.instance.id,lessonTextInstanceId(block.instance.path));
  for(const segment of block.instance.path){const timeline=source.timelines.find((t:any)=>t.timelineId===segment.timelineId);
   assert(timeline.instances.some((i:any)=>i.depth===segment.depth&&i.generation===segment.generation&&i.characterId===segment.characterId));}
 }
 assert.equal(binding.sourceInstancesByBlock.equation93.length,2);
});
test('all831 frames retain unrelated source text and phase-active coherent equation provenance',()=>{
 const excluded=new Set([...P004_EQUATION_EXCLUDED_NATIVE_INSTANCE_IDS,...P004_PAIR_REPLACED_INSTANCE_IDS]);
 const catalog=JSON.parse(readFileSync(new URL('migrations/shared-alg001-l06-p004/audit/source-text-v1.json',root),'utf8'));
 const sourceInstances=catalog.timelines.find((t:any)=>t.timelineId==='sprite-95').instances;
 for(let frame=1;frame<=831;frame++){
  const source=p004TextOccurrences(frame),active=new Set<string>(source.map(row=>row.instanceId));
  for(const instance of sourceInstances)if(instance.firstFrame<=frame&&frame<instance.lastFrameExclusive)active.add(instance.instanceId);
  const rows=p004SemanticText(frame),math=rows.filter(row=>row.kind==='semanticMath');
  assert.equal(math.length,frame>=314&&frame<=461?2:1,`math count ${frame}`);
  assert.equal(math[0].text,'M = $0.50 × C');
  for(const row of math){
   for(const id of row.instanceIds)assert(active.has(id),`inactive ${frame} ${id}`);
   assert(row.math?.ariaLabel);assert(row.instances.length>0);
  }
  const expected=source.filter(row=>!excluded.has(row.instanceId)).filter(row=>{
   const reveal=P004_SENTENCE_REVEAL[row.instanceId as keyof typeof P004_SENTENCE_REVEAL];return reveal===undefined||frame>=reveal;
  });
  assert.deepEqual(rows.filter(row=>row.kind==='source-text').map(row=>[row.id,row.text]),expected.map(row=>[row.instanceId,row.text]));
 }
 for(const frame of [1,83,84,91,92,93,831])assert.equal(p004SemanticText(frame).filter(row=>row.kind==='semanticMath').length,1);
 for(const frame of [314,360,366,462])assert(!p004SemanticText(frame).some(row=>row.text.includes('2.50')&&row.kind==='semanticMath'));
 assert(p004SemanticText(367).some(row=>row.text==='M = $0.50 × 5 = $2.50'));
 assert(p004SemanticText(374).some(row=>row.text==='$0.50 × 5 = $2.50'));
 const initial=p004SemanticText(1);assert.equal(initial.filter(row=>row.text==='0').length,0);
 assert.deepEqual(p004SemanticText(1),initial);assert(Object.isFrozen(initial));assert.equal(initial[0].role,'title');
 for(const invalid of [0,832,NaN,1.1])assert.throws(()=>p004SemanticText(invalid),RangeError);
});

test('full sentences wait for exact source mask terminal updates and reviewed composed frames',()=>{
 const source=JSON.parse(readFileSync(new URL('migrations/shared-alg001-l06-p004/audit/source-text-v1.json',root),'utf8'));
 const events=source.timelines.find((t:any)=>t.timelineId==='sprite-95').events;
 const review=readFileSync(new URL(P004_SENTENCE_REVEAL_EVIDENCE.path,root));
 assert.equal(createHash('sha256').update(review).digest('hex'),P004_SENTENCE_REVEAL_EVIDENCE.sha256);
 for(const [textId,maskId,scale,sha] of [
  ['sprite-95/depth-84/generation-3','sprite-95/depth-82/generation-6',1,'b9a7b330b65db6e1567c1243f93fc8529734b09c43c521ef9d23a6a50fe6ecf2'],
  ['sprite-95/depth-94/generation-1','sprite-95/depth-92/generation-1',0.8452606201171875,'c1b16b4f803c79be69b9755ef5f57d0f57bd83b14a4d51abd0de666066360ab9'],
 ] as const){
  const last=events.filter((e:any)=>e.instanceId===maskId).at(-1);assert(last);
  assert.equal(last.sourceTagSha256,sha);assert.equal(last.matrix[0],scale);
  assert.equal(P004_SENTENCE_REVEAL[textId],last.frame);
  assert(!p004SemanticText(last.frame-1).some(r=>r.instanceIds.includes(textId)));
  assert(p004SemanticText(last.frame).some(r=>r.instanceIds.includes(textId)));
 }
});
