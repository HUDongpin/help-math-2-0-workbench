import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const file=new URL('../../../migrations/shared-nms002-l02-p054/audit/card-layout-v1.json',import.meta.url);
const bytes=readFileSync(file);
const layout=JSON.parse(bytes.toString('utf8')) as {
 animationId:string;stage:{width:number;height:number;twipsPerPixel:number};
 rootGameSprite:{sourceCharacterId:number;rootDepth:number;
  translationTwips:{x:number;y:number}};
 cards:{level:number;sourceFrame:number;placementOrder:number;sourceInstanceName:string;
  sourceCharacterId:number;sourceDepth:number;
  localTwips:{x:number;y:number};stagePx:{x:number;y:number}}[];
 layoutAuthority:string;originalRuntimeAccepted:boolean;strictComplete:boolean};

test('P054 frozen source placement has two complete 4-by-3 card grids',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),
  'd34c6f2b89a99f110138c07b9b108ab96afa56db294a085a68a670d2cb034863');
 assert.equal(layout.animationId,'shared-nms002-l02-p054');
 assert.deepEqual(layout.stage,{width:800,height:600,twipsPerPixel:20});
 assert.equal(layout.rootGameSprite.sourceCharacterId,731);
 assert.equal(layout.rootGameSprite.rootDepth,3);
 assert.equal(layout.cards.length,24);
 for(const level of [1,2]){
  const cards=layout.cards.filter(card=>card.level===level);
  assert.deepEqual(cards.map(card=>card.placementOrder),
   Array.from({length:12},(_,index)=>index+1));
  assert.equal(new Set(cards.map(card=>card.sourceDepth)).size,12);
  assert.ok(cards.every(card=>card.sourceFrame===(level===1?2:4)));
  assert.equal(new Set(cards.map(card=>`${card.stagePx.x}:${card.stagePx.y}`)).size,12);
  for(const card of cards){
   assert.equal(card.stagePx.x,
    (layout.rootGameSprite.translationTwips.x+card.localTwips.x)/20);
   assert.equal(card.stagePx.y,
    (layout.rootGameSprite.translationTwips.y+card.localTwips.y)/20);
   assert.ok(card.stagePx.x>=0&&card.stagePx.x<800);
   assert.ok(card.stagePx.y>=0&&card.stagePx.y<600);
  }
 }
});
test('layout is a static source map and cannot be treated as accepted fidelity',()=>{
 assert.equal(layout.layoutAuthority,'source-static-placement-matrices-only');
 assert.equal(layout.originalRuntimeAccepted,false);
 assert.equal(layout.strictComplete,false);
 assert.deepEqual(layout.cards.slice(0,4).map(card=>card.stagePx.x),
  [162.9,330.7,498.5,666.3]);
 assert.deepEqual(layout.cards.slice(12,16).map(card=>card.stagePx.x),
  [162.5,330.05,498.1,666.1]);
});
