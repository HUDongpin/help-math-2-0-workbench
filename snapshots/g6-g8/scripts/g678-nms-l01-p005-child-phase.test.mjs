import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
import test from 'node:test';
import {normalizeNmsL1P005NestedFrames} from './lib/g678-nms-l01-p005-child-phase-v1.mjs';
const source=readFileSync('/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p005-behavior-source-v1/source/canvas/sprites/DefineSprite_148/frames.html','utf8').replace(/\r\n?/gu,'\n');

test('the nested phase transformation changes only144 parent arguments and14 grandchild arguments',()=>{
  const normalized=normalizeNmsL1P005NestedFrames(source);
  let parents=0,children=0;
  const restored=normalized.replace('\n\tvar independentFrame = frame;','')
    .replace(/(place\("sprite104",[^\n]+,1,)independentFrame%17(,0,time\);)/gu,(_,a,b)=>`${a}(${children++}+time)%17${b}`)
    .replace(/(place\("sprite129",[^\n]+,1,)\(frame-75\+time\)(,75,time\);)/gu,(_,a,b)=>`${a}(${parents++%14}+time)%14${b}`);
  assert.equal(parents,144);assert.equal(children,14);assert.equal(restored,source);
});
test('the actual generated parent129 function retains the17-frame child across every14-frame parent boundary',()=>{
  const normalized=normalizeNmsL1P005NestedFrames(source),a=normalized.indexOf('function sprite129('),b=normalized.indexOf('\n}',a)+2;
  const calls=[],context=createContext({canvas:{},place:(...args)=>calls.push(args)});
  new Script(normalized.slice(a,b)).runInContext(context);
  for(let elapsed=0;elapsed<144;elapsed++){
    calls.length=0;context.sprite129({}, {}, elapsed,75,0);
    const child=calls.filter(c=>c[0]==='sprite104');assert.equal(child.length,1);assert.equal(child[0][6],elapsed%17);
  }
});
