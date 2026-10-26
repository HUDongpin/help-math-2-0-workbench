import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

type Card={level:number;placementOrder:number;pairId:number;side:number;
 sourceInstanceName:string;sourceCharacterId:number;
 sourceTexts:{id:number;sha256:string;value:string}[]};
const file=new URL('../../../catalog/product-bridge-calibrations/g678-nms-l02-p053-p054-game-contract-v1.json',import.meta.url);
const bytes=readFileSync(file);
const contract=JSON.parse(bytes.toString('utf8')) as {
 source:{p053:{sha256:string};p054:{sha256:string}};
 controller:{earlyTarget:string;selectLevelTarget:string;earlierTargetReachability:string};
 matching:{levels:number;pairsPerLevel:number;cardCount:number;
  actions:{cardHandlers:{frame2:number;frame4:number};scoreCorrect:number;
   scoreWrong:number;pairsForTerminal:number};cards:Card[]};
 currentJsRegistered:boolean;originalRuntimeAccepted:boolean;audioAccepted:boolean;
 humanAccepted:boolean;ownerAccepted:boolean;strictComplete:boolean;published:boolean;
};
function value(card:Card){
 const terms=card.sourceTexts.map(item=>item.value);
 if(card.side===1){
  assert.equal(terms.length,2,card.sourceInstanceName);
  const [numerator,denominator]=terms.map(Number);
  assert.ok(Number.isFinite(numerator)&&Number.isFinite(denominator)&&denominator!==0);
  return numerator/denominator;
 }
 assert.equal(terms.length,1,card.sourceInstanceName);
 return terms[0]!.endsWith('%')?Number(terms[0]!.slice(0,-1))/100:Number(terms[0]);
}
function assertPairs(cards:Card[]){
 assert.equal(cards.length,24);
 for(const level of [1,2]){
  const own=cards.filter(card=>card.level===level);
  assert.equal(own.length,12);
  assert.deepEqual(own.map(card=>card.placementOrder).sort((a,b)=>a-b),
   Array.from({length:12},(_,i)=>i+1));
  for(let pairId=1;pairId<=6;pairId++){
   const pair=own.filter(card=>card.pairId===pairId);
   assert.deepEqual(pair.map(card=>card.side).sort(),[1,2]);
   assert.ok(Math.abs(value(pair[0]!)-value(pair[1]!))<1e-12,
    `level ${level} pair ${pairId} is not mathematically equivalent`);
  }
 }
}
test('frozen P053/P054 extraction binds the exact distinct SWFs and guarded handoff',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '6d492f48cc2df39ca1636d5f9cde8f7529493eb3770c1d47c690a3c84b8aa205');
 assert.equal(contract.source.p053.sha256,
  'f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf');
 assert.equal(contract.source.p054.sha256,
  '06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8');
 assert.equal(contract.controller.selectLevelTarget,'L2GS03');
 assert.equal(contract.controller.earlyTarget,'L7GS03');
 assert.equal(contract.controller.earlierTargetReachability,'unresolved');
});
test('both six-pair math sets preserve the source card identities and scoring',()=>{
 assert.equal(contract.matching.levels,2);
 assert.equal(contract.matching.pairsPerLevel,6);
 assert.equal(contract.matching.cardCount,24);
 assert.deepEqual(contract.matching.actions.cardHandlers,{frame2:12,frame4:12});
 assert.equal(contract.matching.actions.scoreCorrect,10);
 assert.equal(contract.matching.actions.scoreWrong,-2);
 assert.equal(contract.matching.actions.pairsForTerminal,6);
 assertPairs(contract.matching.cards);
});
test('a swapped pairing is detected and source extraction grants no acceptance',()=>{
 const changed=contract.matching.cards.map(card=>({...card}));
 const wrong=changed.find(card=>card.level===2&&card.pairId===1&&card.side===2)!;
 wrong.pairId=2;
 assert.throws(()=>assertPairs(changed));
 for(const key of ['currentJsRegistered','originalRuntimeAccepted','audioAccepted',
  'humanAccepted','ownerAccepted','strictComplete','published'] as const)
  assert.equal(contract[key],false,key);
});
test('static frame-domain graphs retain the long game timelines without claiming runtime reachability',()=>{
 for(const [page,count,character,frames] of [
  ['p053',12,187,694],['p054',65,648,121],
 ] as const){
  const file=new URL(`../../../migrations/shared-nms002-l02-${page}/audit/frame-domain-static-graph-v1.json`,import.meta.url);
  const value=JSON.parse(readFileSync(file,'utf8')) as {
   staticRootReachableSpriteCount:number;totalDefinedSpriteCount:number;
   staticRootReachableSpriteDomains:{sourceCharacterId:number;frameCount:number;
    disposition:string;runtimeReachabilityAccepted:boolean}[];
   originalRuntimeAccepted:boolean;strictComplete:boolean};
  assert.equal(value.staticRootReachableSpriteCount,count);
  assert.ok(value.totalDefinedSpriteCount>=count);
  assert.equal(value.staticRootReachableSpriteDomains.find(item=>item.sourceCharacterId===character)?.frameCount,frames);
  assert.ok(value.staticRootReachableSpriteDomains.every(item=>
   item.disposition==='static-placement-graph-only'&&!item.runtimeReachabilityAccepted));
  assert.equal(value.originalRuntimeAccepted,false);
  assert.equal(value.strictComplete,false);
 }
});
