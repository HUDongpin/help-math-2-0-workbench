import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const file=new URL('../../../migrations/shared-nms002-l02-p054/audit/game-display-list-v1.json',import.meta.url);
const cardFile=new URL('../../../migrations/shared-nms002-l02-p054/audit/card-layout-v1.json',import.meta.url);
const script=new URL('../../../scripts/build-nms-l02-p054-game-display-list-v1.mjs',import.meta.url);
const bytes=readFileSync(file),value=JSON.parse(bytes.toString('utf8')) as {
 animationId:string;rootPlacement:{sourceFrame:number;sourceDepth:number;
  sourceCharacterId:number;translationTwips:{x:number;y:number}};
 controllerSpriteId:number;controllerFrameCount:number;
 placementEventCount:number;removalEventCount:number;
 frames:{frame:number;layers:{depth:number;sourceCharacterId:number;
  sourceInstanceName:string;sourceTagSha256:string;transform:Record<string,number>}[]}[];
 controllerActions:{frame:number;sha256:string}[];
 sourceStaticFinding:string;status:string;limitations:string[];
 currentJsRegistered:boolean;originalRuntimeAccepted:boolean;visualFidelityAccepted:boolean;
 audioAccepted:boolean;humanAccepted:boolean;ownerAccepted:boolean;strictComplete:boolean;published:boolean;
};
const cards=JSON.parse(readFileSync(cardFile,'utf8')).cards as {
 sourceFrame:number;sourceDepth:number;sourceCharacterId:number;sourceInstanceName:string}[];
const sha=(bytes: Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('P054 game controller preserves all five source display-list frames',()=>{
 assert.equal(sha(bytes),'8887c62a93824e851b2b6bba3779742ba43143b5c8e38b47c49b81c04fa6c40c');
 assert.equal(value.animationId,'shared-nms002-l02-p054');
 assert.deepEqual(value.rootPlacement,{sourceFrame:6,sourceDepth:3,
  sourceCharacterId:731,translationTwips:{x:8268,y:5686}});
 assert.equal(value.controllerSpriteId,731);
 assert.equal(value.controllerFrameCount,5);
 assert.deepEqual(value.frames.map(frame=>frame.layers.length),[1,31,9,31,9]);
 assert.equal(value.placementEventCount,69);
 assert.equal(value.removalEventCount,60);
 assert.deepEqual(value.controllerActions.map(item=>item.frame),[1,2,3,4,5]);
 assert.ok(value.frames.every(frame=>frame.layers.every(layer=>
  /^[a-f0-9]{64}$/u.test(layer.sourceTagSha256))));
});

test('game and result frames are distinct without inventing their transition',()=>{
 for(const card of cards){
  const frame=value.frames[card.sourceFrame-1];
  assert.ok(frame.layers.some(layer=>layer.depth===card.sourceDepth&&
   layer.sourceCharacterId===card.sourceCharacterId&&
   layer.sourceInstanceName===card.sourceInstanceName),card.sourceInstanceName);
 }
 for(const [gameFrame,resultFrame,resultSprite] of [[2,3,648],[4,5,729]]){
  const game=value.frames[gameFrame-1],result=value.frames[resultFrame-1];
  assert.equal(game.layers.filter(layer=>/^Mc[1-6]_[12]$/u.test(layer.sourceInstanceName)).length,12);
  assert.equal(result.layers.filter(layer=>/^Mc[1-6]_[12]$/u.test(layer.sourceInstanceName)).length,0);
  assert.ok(result.layers.some(layer=>layer.sourceCharacterId===resultSprite));
  for(const name of ['BtnStart','BtnRepeat','Mc_Score','mcL1','mcL2'])
   assert.ok(result.layers.some(layer=>layer.sourceInstanceName===name),name);
 }
 assert.match(value.sourceStaticFinding,/No controller-frame DoAction directly advances/);
 assert.ok(value.limitations.some(item=>item.includes('game-to-result transition')));
 assert.equal(value.status,'source-static-game-display-list-only');
 for(const key of ['currentJsRegistered','originalRuntimeAccepted','visualFidelityAccepted',
  'audioAccepted','humanAccepted','ownerAccepted','strictComplete','published'] as const)
  assert.equal(value[key],false,key);
});

test('game display-list generator refuses an accidental overwrite',()=>{
 const before=sha(readFileSync(file));
 const result=spawnSync(process.execPath,[fileURLToPath(script),'--write'],{encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/EEXIST/);
 assert.equal(sha(readFileSync(file)),before);
});
