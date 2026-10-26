import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {p004TextOccurrences,p004TextOccurrencePlacementEvents,P004_TEXT_OCCURRENCE_PROVENANCE as provenance} from './alg-l06-p004-text-occurrences-v2';
import {P004_TEXT_OCCURRENCES} from './alg-l06-p004-text-occurrences-v2.generated';
// @ts-ignore Source decoder is a JavaScript audit module.
import {collectSwfTextSourceCatalog} from '../../../scripts/lib/swf-text-source-catalog.mjs';
const audit=JSON.parse(readFileSync(new URL('../../../migrations/shared-alg001-l06-p004/audit/source-text-v1.json',import.meta.url),'utf8'));
test('independent actual SWF matches audit and every instance, transform update and all 831 membership frames',()=>{
 const bytes=readFileSync('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L6/RW/L6RW04.swf');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),provenance.sourceSwfSha256);
 const source=collectSwfTextSourceCatalog(bytes);assert.deepEqual(source,audit);
 const ids=new Set(source.textDefinitions.map((d:any)=>d.characterId));
 const main=source.timelines.find((t:any)=>t.timelineId==='sprite-95');
 const root=source.timelines.find((t:any)=>t.timelineId==='root');
 assert(main&&root,'source contains both declared timelines');
 const expected=main.instances.filter((i:any)=>ids.has(i.characterId));
 assert.equal(P004_TEXT_OCCURRENCES.length,expected.length+1);
 for(const row of P004_TEXT_OCCURRENCES){
  const timeline:(typeof source.timelines)[number]=row.timelineId==='root'?root:main;
  const instance:(typeof timeline.instances)[number]|undefined=timeline.instances.find((i:any)=>i.instanceId===row.instanceId);
  assert(instance,'generated occurrence belongs to the source timeline');
  const def=source.textDefinitions.find((d:any)=>d.characterId===row.characterId);
  assert.equal(row.depth,instance.depth);assert.equal(row.generation,instance.generation);
  assert.equal(row.text,def.runs.map((r:any)=>r.text).join(''));
  assert.deepEqual(row.boundsTwips,def.boundsTwips);assert.deepEqual(row.textMatrix,def.matrix);
  assert.deepEqual(row.placementEvents,instance.updates.map((id:string)=>timeline.events.find((e:any)=>e.eventId===id)));
 }
 for(let frame=1;frame<=831;frame++){
  const actual=p004TextOccurrences(frame);
  assert.deepEqual(actual.filter(r=>r.timelineId!=='root').map(r=>r.instanceId).sort(),expected.filter((i:any)=>i.firstFrame<=frame&&frame<i.lastFrameExclusive).map((i:any)=>i.instanceId).sort());
  assert.equal(actual.filter(r=>r.characterId===96).length,1);
  for(const row of actual)assert(p004TextOccurrencePlacementEvents(row,frame).every(e=>e.frame<=(row.timelineId==='root'?6:frame)));
 }
});
test('duplicates and unresolved equation geometry are preserved, Replay returns exact first occurrence set',()=>{
 const initial=p004TextOccurrences(1),zero=initial.filter(r=>r.text==='0');
 assert.equal(zero.length,2);assert.notEqual(zero[0].instanceId,zero[1].instanceId);assert.notEqual(zero[0].depth,zero[1].depth);
 const equation=p004TextOccurrences(93).filter(r=>r.characterId===52||r.characterId===39);
 assert.equal(equation.length,2);assert(equation.some(r=>r.text==='M = $0.50   C'));assert(equation.some(r=>r.text==='x'));
 assert.equal(provenance.equation93.status,'unknown-semantic-composition');
 for(const [id,start] of [[78,508],[83,614]] as const){assert(!p004TextOccurrences(start-1).some(r=>r.characterId===id));assert(p004TextOccurrences(start).some(r=>r.characterId===id));}
 assert(p004TextOccurrences(831).some(r=>r.characterId===83));assert.deepEqual(p004TextOccurrences(1),initial);
 for(const bad of [0,832,NaN,1.5])assert.throws(()=>p004TextOccurrences(bad),RangeError);
});
