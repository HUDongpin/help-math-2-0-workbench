import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

type Layer={depth:number;sourceCharacterId:number;transform:Record<string,number>};
type Card={level:number;pairId:number;side:number;sourceCharacterId:number;
 frames:{frame:number;layers:Layer[]}[]};
const bytes=readFileSync(new URL('../../../migrations/shared-nms002-l02-p054/audit/card-display-list-v1.json',import.meta.url));
const ir=JSON.parse(bytes.toString('utf8')) as {cardCount:number;cardFrameCount:number;
 resources:{sourceCharacterId:number;kind:string;file?:string;value?:string}[];
 cards:Card[];status:string;productionRendererRegistered:boolean};
const ids=(layers:Layer[])=>layers.map(layer=>`${layer.depth}:${layer.sourceCharacterId}`);
function assertCardStates(card:Card){
 assert.deepEqual(card.frames.map(frame=>frame.frame),[1,2,3,4,5]);
 const [rest,selected,again,selectedAgain,replay]=card.frames.map(frame=>ids(frame.layers));
 assert.deepEqual(rest,again);
 assert.deepEqual(rest,replay);
 assert.deepEqual(selected,selectedAgain);
 assert.equal(selected!.length,rest!.length+1);
 assert.ok(card.frames.every(frame=>new Set(frame.layers.map(layer=>layer.depth)).size===frame.layers.length));
}
test('P054 source display-list IR preserves all 24 five-frame card states',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),
  'c2e18b123f43e16890548f4be5d38613b022c55c6e2b090cf663dd6d07c62343');
 assert.equal(ir.cardCount,24);
 assert.equal(ir.cardFrameCount,5);
 assert.equal(ir.cards.length,24);
 ir.cards.forEach(assertCardStates);
 assert.equal(ir.resources.filter(item=>item.kind==='shape').length,18);
 assert.equal(ir.resources.filter(item=>item.kind==='text').length,19);
 assert.equal(new Set(ir.resources.map(item=>item.sourceCharacterId)).size,ir.resources.length);
 assert.equal(ir.status,'source-static-card-state-ir-only');
 assert.equal(ir.productionRendererRegistered,false);
});
test('missing selected overlay is rejected by the card-state contract',()=>{
 const card=ir.cards[0]!;
 const changed={...card,frames:card.frames.map(frame=>({...frame,layers:[...frame.layers]}))};
 changed.frames[1]!.layers.pop();
 assert.throws(()=>assertCardStates(changed));
});
