import assert from 'node:assert/strict';import {test} from 'node:test';
import first from '../packages/demos/src/modules/g678-alg-l10-p005.tsx';
import second from '../packages/demos/src/modules/g678-alg-l10-p006.tsx';
const active=(module,frame)=>module.privateTerminalSource.reading.filter(b=>frame>=b.firstFrame&&frame<=b.lastFrame);
const table=(module,frame)=>active(module,frame).find(b=>b.table).table.rows;
const steps=(module,frame)=>active(module,frame).filter(b=>b.steps);
test('all 2410 pure source states are deterministic and unsupported root/title/Spanish requests stay blocked',()=>{
 for(const [m,domain,title,last] of [[first,'sprite-128','sprite-4',1304],[second,'sprite-78','sprite-80',1106]]){
  const q={frameDomain:domain,scenario:'source-static-frame',lang:'en',seed:0};const opening=m.getFrameState(1,q);
  for(let f=1;f<=last;f++){const s=m.getFrameState(f,q);assert.equal(s.status,'ready');assert.equal(s.frame,f);assert.equal(s.frameDomain,domain);assert.equal(s.sourceSwfSha256,m.privateTerminalSource.CONFIG.sourceSwfSha256);}
  assert.deepEqual(m.getFrameState(1,q),opening);
  for(const query of [{...q,frameDomain:'root',scenario:'default'},{...q,frameDomain:title},{...q,lang:'es'}])assert.equal(m.getFrameState(1,query).status,'blocked');
 }
});
test('the source distinguishes powers from new/cumulative answers and retains intentionally blank cells',()=>{
 assert.deepEqual(table(first,1).map(row=>row.slice(1)),[['1','1'],['2','3'],['4','7'],['',''],['',''],['',''],['',''],['',''],['','']]);
 assert.equal(table(first,443)[0][1],'1');assert.equal(table(first,444)[0][1],'1 = 2^0');
 assert.equal(table(first,655)[8][1],'2^8');assert.equal(table(first,655)[8][2],'');
 assert.deepEqual(table(first,1097)[4].slice(1),['16','']);assert.deepEqual(table(first,1268)[4].slice(1),['16','31']);
 assert.equal(table(second,572)[8][2],'');assert.equal(table(second,573)[8][2],'511');assert.equal(table(second,1106)[8][1],'');
 for(const r of [5,6,7])assert.deepEqual(table(second,1106)[r].slice(1),['','']);
});
test('source formula and substitution steps reveal in order and Replay clears later teaching states',()=>{
 assert.equal(active(first,104).some(b=>b.text==='Let n = day number.'),false);assert.equal(active(first,105).some(b=>b.text==='Let n = day number.'),true);
 assert.equal(active(first,204).some(b=>b.text.startsWith('2^n =')),false);assert.equal(active(first,205).some(b=>b.text.startsWith('2^n =')),true);
 assert.equal(active(first,324).some(b=>b.text.startsWith('2^(n+1)')),false);assert.equal(active(first,325).some(b=>b.text.startsWith('2^(n+1)')),true);
 assert.equal(steps(first,852).length,0);assert.deepEqual(steps(first,853)[0].steps,['2^(n+1) − 1']);assert.equal(steps(first,913)[0].steps.at(-1),'= 3');assert.equal(steps(first,963).length,0);
 assert.equal(steps(first,1083)[0].steps.at(-1),'= 16');assert.equal(steps(first,1203)[0].steps.at(-1),'= 31');
 assert.equal(steps(second,328).length,0);assert.equal(steps(second,510)[0].steps.at(-1),'= 512 − 1');assert.equal(steps(second,570)[0].steps.at(-1),'= 511');
 assert.equal(active(second,1095).some(b=>b.text.startsWith('The essential question:')),false);assert.equal(active(second,1096).some(b=>b.text.startsWith('The essential question:')),true);
 assert.equal(steps(first,1).length,0);assert.equal(steps(second,1).length,0);assert.equal(table(second,1)[8][2],'');
});
