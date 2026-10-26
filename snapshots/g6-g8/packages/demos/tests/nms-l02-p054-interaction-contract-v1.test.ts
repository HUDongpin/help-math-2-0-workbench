import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const file=new URL('../../../migrations/shared-nms002-l02-p054/audit/interaction-contract-v1.json',import.meta.url);
const bytes=readFileSync(file);
const contract=JSON.parse(bytes.toString('utf8')) as {
 animationId:string;
 sources:{swf:{sha256:string};cardLayout:{sha256:string}};
 gameSpriteId:number;cardHandlerCount:number;cardHandlerSha256:string;
 cards:{level:number;sourceFrame:number;sourceInstanceName:string;
  sourceCharacterId:number;sourceDepth:number;handlerSha256:string}[];
 sourceRules:{correct:string;incorrect:string;scoreFloor:string};
 feedback:{correct:{sourceSpriteId:number;terminalFrame:number;afterSix:string};
  wrong:{sourceSpriteId:number;terminalFrame:number;effect:string}};
 buttons:Record<string,{sourceAction:string}>;
 levelSelectors:{sourceFrame:number;level:number}[];
 status:string;unresolved:string[];
 currentJsRegistered:boolean;originalRuntimeAccepted:boolean;audioAccepted:boolean;
 humanAccepted:boolean;ownerAccepted:boolean;strictComplete:boolean;published:boolean;
};

test('P054 interaction contract is source-pinned and all 24 card handlers agree',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '7472962f3e1ca32219dafd000a3f9bbcc6b90865cb0ca7d7f3b79d5265cc03b4');
 assert.equal(contract.animationId,'shared-nms002-l02-p054');
 assert.equal(contract.sources.swf.sha256,
  '06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8');
 assert.equal(contract.sources.cardLayout.sha256,
  'd34c6f2b89a99f110138c07b9b108ab96afa56db294a085a68a670d2cb034863');
 assert.equal(contract.gameSpriteId,731);
 assert.equal(contract.cardHandlerCount,24);
 assert.equal(contract.cards.length,24);
 assert.equal(new Set(contract.cards.map(card=>`${card.level}:${card.sourceInstanceName}`)).size,24);
 assert.ok(contract.cards.every(card=>card.handlerSha256===contract.cardHandlerSha256));
 for(const [level,frame] of [[1,2],[2,4]]){
  const own=contract.cards.filter(card=>card.level===level);
  assert.equal(own.length,12);
  assert.ok(own.every(card=>card.sourceFrame===frame));
 }
});

test('card scoring and feedback transitions are not inflated into page completion',()=>{
 assert.match(contract.sourceRules.correct,/add 10/);
 assert.match(contract.sourceRules.incorrect,/subtract 2/);
 assert.match(contract.sourceRules.scoreFloor,/no clamp in the 24 extracted card handlers/);
 assert.deepEqual([contract.feedback.correct.sourceSpriteId,contract.feedback.correct.terminalFrame],
  [194,27]);
 assert.deepEqual([contract.feedback.wrong.sourceSpriteId,contract.feedback.wrong.terminalFrame],
  [208,31]);
 assert.match(contract.feedback.correct.afterSix,/nextFrame in feedback sprite/);
 assert.match(contract.feedback.wrong.effect,/without completed-pair increment/);
 assert.ok(contract.unresolved.some(item=>item.includes('page completion')));
});

test('Repeat opens a popup and explicit level selection remains separate from Start',()=>{
 for(const id of ['233','649','730'])assert.equal(contract.buttons[id]?.sourceAction,'show-popup');
 assert.equal(contract.buttons['96']?.sourceAction,'hide-self');
 assert.equal(contract.buttons['655']?.sourceAction,'restart-selected-level');
 assert.deepEqual(contract.levelSelectors.map(item=>[item.sourceFrame,item.level]),
  [[3,1],[3,2],[5,1],[5,2]]);
 assert.equal(contract.status,'source-static-interaction-contract-only');
 for(const key of ['currentJsRegistered','originalRuntimeAccepted','audioAccepted',
  'humanAccepted','ownerAccepted','strictComplete','published'] as const)
  assert.equal(contract[key],false,key);
});
