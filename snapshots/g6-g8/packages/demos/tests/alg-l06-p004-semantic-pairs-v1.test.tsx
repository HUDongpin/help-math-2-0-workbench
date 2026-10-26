import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P004_SEMANTIC_PAIRS_V1 as pairs,P004_PAIR_SOURCE_SHA256,p004SemanticPairs} from '../src/alg-l06-p004-semantic-pairs-v1';
import {p004TextSnapshot} from '../src/alg-l06-p004-text-snapshot-v1';
import {P004NativeTextV1} from '../src/alg-l06-p004-native-text-v1';
const bytes=readFileSync(new URL('../../../migrations/shared-alg001-l06-p004/audit/source-text-v1.json',import.meta.url));
const source=JSON.parse(bytes.toString());
const timeline=source.timelines.find((t:any)=>t.timelineId==='sprite-95');
const context=(frame:number)=>({frame,frameDomain:'sprite-95',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});
test('price associations bind the two source signs without changing values or source case',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),P004_PAIR_SOURCE_SHA256);
 const decisionBytes=readFileSync(new URL('../../../migrations/shared-alg001-l06-p004/audit/semantic-pairs-v1.json',import.meta.url));
 assert.equal(createHash('sha256').update(decisionBytes).digest('hex'),'509d3b9313e8187ab29851a68c3626c7a17f48b0cbc08c9be910f73a8f21552c');
 const decision=JSON.parse(decisionBytes.toString());
 assert.deepEqual(decision.decisions.map((d:any)=>[d.id,d.text,d.frames]),pairs.map(p=>[p.id,p.text,[p.firstFrame,p.lastFrameExclusive-1]]));
 for(const pin of decision.sourcePins){const b=readFileSync(new URL(`../../../${pin.path}`,import.meta.url));assert.equal(b.length,pin.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),pin.sha256);}

 assert.deepEqual(pairs.slice(0,2).map(p=>[p.label,p.value]),[['Lemonade:','50¢ per cup'],['orange juice:','75¢ per cup']]);
 for(const pair of pairs.slice(0,2)){
  const events=pair.instanceIds.map(id=>timeline.events.find((e:any)=>e.instanceId===id));
  assert.equal(events[0].matrix[0],events[1].matrix[0]);
  assert.equal(events[1].matrix[4]-events[0].matrix[4],79);
  assert.equal(events[1].matrix[5]-events[0].matrix[5],524);
  assert(events.every((e:any)=>e.frame===1));
  const texts=events.map((e:any)=>source.textDefinitions.find((d:any)=>d.characterId===e.characterId).runs.map((r:any)=>r.text).join(''));
  assert.equal(pair.label,texts[0].trim());assert.equal(pair.value,texts[1]);
 }
});
test('variable associations preserve label appearance and point to letters in the original complete formula run',()=>{
 for(const [id,labelCharacter,first,value] of [['variable-input',55,127,'C'],['variable-output',58,195,'M']] as const){
  const pair=pairs.find(p=>p.id===id)!;
  const label=timeline.instances.find((i:any)=>i.instanceId===pair.instanceIds[0]);
  assert.equal(label.characterId,labelCharacter);assert.equal(label.firstFrame,first);
  assert.equal(pair.value,value);assert.equal(pair.firstFrame,first);
  assert(pair.sourceTextIds.includes('character-52/run-0'));
  const formula=source.textDefinitions.find((d:any)=>d.characterId===52).runs.map((r:any)=>r.text).join('');
  assert(formula.includes(value));
  assert(!p004SemanticPairs(first-1).some(p=>p.id===id));assert(p004SemanticPairs(first).some(p=>p.id===id));
 }
 assert.equal(p004SemanticPairs(1).length,2);assert.equal(p004SemanticPairs(831).length,4);
});
test('all831 frame snapshots contain complete pairs with active source provenance and retain the separate equation',()=>{
 for(let frame=1;frame<=831;frame++){
  const snapshot=p004TextSnapshot(context(frame)),visible=snapshot.blocks.filter(b=>b.visible);
  for(const pair of p004SemanticPairs(frame)){
   assert(visible.some(b=>b.id===pair.id&&b.text===pair.text));
   assert(!visible.some(b=>pair.replaces.includes(b.id)));
   for(const id of pair.instanceIds){const i=timeline.instances.find((i:any)=>i.instanceId===id);assert(i.firstFrame<=frame&&frame<i.lastFrameExclusive);}
  }
  assert.equal(visible.filter(b=>b.text==='M = $0.50 × C').length,1);
 }
});
test('native pairs have term/definition semantics, unique block markers and clean Replay state',()=>{
 const render=(frame:number)=>renderToStaticMarkup(<P004NativeTextV1 snapshot={p004TextSnapshot(context(frame))}/>);
 const first=render(1),all=render(195);
 assert.equal((first.match(/data-p004-semantic-pair="price"/g)||[]).length,2);
 assert.equal((all.match(/data-p004-semantic-pair="equation-variable"/g)||[]).length,2);
 assert.equal((all.match(/<dt /g)||[]).length,4);assert.equal((all.match(/<dd /g)||[]).length,4);
 const ids=[...all.matchAll(/data-lesson-text-block="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 assert.equal(render(1),first);assert(!first.includes('data-p004-text-block="variable-input"'));
});
