import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P004NativeTextV1} from '../src/alg-l06-p004-native-text-v1';
import {p004TextSnapshot} from '../src/alg-l06-p004-text-snapshot-v1';
import {p004SemanticText} from '../src/alg-l06-p004-semantic-text-v1';

test('native snapshot and DOM carry completed outline5 only on314, then source text on315',()=>{
 for(const lang of ['en','es'] as const)for(const frame of [313,314,315,366,367]){
  const snapshot=p004TextSnapshot({frame,frameDomain:'sprite-95',rootFrame:6,scenario:'source-static-frame',lang,seed:0});
  const html=renderToStaticMarkup(<P004NativeTextV1 snapshot={snapshot}/>);
  const row=p004SemanticText(frame).find(row=>row.id==='equation-worked-substitution');
  if(frame===313||frame===367){assert(!row);continue;}
  assert.equal(row?.text,'M = $0.50 × 5');
  assert(snapshot.blocks.some(block=>block.id===row.id&&block.visible&&block.text===row.text));
  assert.match(html,/data-p004-text-block="equation-worked-substitution"/);
  assert.deepEqual(snapshot.suppressedInstances,[]);
  if(frame===314){
   assert.deepEqual(row.sourceShapeIds,[67]);
   const instance=row.instances.find(i=>i.path.at(-1)?.characterId===67)!;
   assert.deepEqual(instance.path.at(-1),{timelineId:'sprite-95',depth:90,generation:2,characterId:67});
   assert.match(html,/data-source-shape-ids="67"/);
   assert(!row.instanceIds.includes('sprite-95/depth-90/generation-3'));
  }else assert.deepEqual(row.sourceShapeIds,[]);
  assert(!row.text.includes('$2.50'));
 }
});
