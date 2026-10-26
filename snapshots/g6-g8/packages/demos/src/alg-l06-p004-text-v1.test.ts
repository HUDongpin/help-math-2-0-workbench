import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync} from 'node:fs';
import {test} from 'node:test';
import {p004ReadableText,P004_TEXT_PROVENANCE} from './alg-l06-p004-text-v1';
import {P004_SOURCE_TEXT_BLOCKS} from './alg-l06-p004-text.generated';
// The source decoder is independent of this page's projection generator.
// @ts-ignore Repository source-audit utility is JavaScript.
import {collectSwfTextSourceCatalog} from '../../../scripts/lib/swf-text-source-catalog.mjs';
const root=new URL('../../../',import.meta.url);
const source='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L6/RW/L6RW04.swf';
const auditBytes=readFileSync(new URL(P004_TEXT_PROVENANCE.sourceAudit.path,root));
const audit=JSON.parse(auditBytes.toString());

test('generated text uses independent source runs and complete display-list membership, all 831 frames',()=>{
 assert.equal(realpathSync(source),source);const bytes=readFileSync(source);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),P004_TEXT_PROVENANCE.sourceSwfSha256);
 assert.equal(createHash('sha256').update(auditBytes).digest('hex'),P004_TEXT_PROVENANCE.sourceAudit.sha256);
 const fresh=collectSwfTextSourceCatalog(bytes);assert.deepEqual(fresh,audit);
 const main=fresh.timelines.find((t:any)=>t.timelineId==='sprite-95');
 assert(main,'source contains the required sprite-95 timeline');
 const definitions=[fresh.textDefinitions.find((d:any)=>d.characterId===96),...fresh.textDefinitions.filter((d:any)=>main.instances.some((i:any)=>i.characterId===d.characterId)).sort((a:any,b:any)=>a.sourceTagOffset-b.sourceTagOffset)];
 assert.equal(P004_SOURCE_TEXT_BLOCKS.length,28);
 for(const block of P004_SOURCE_TEXT_BLOCKS){
  const definition=fresh.textDefinitions.find((d:any)=>d.characterId===block.characterId);
  assert.equal(block.text,definition.runs.map((r:any)=>r.text).join(''));
  assert.deepEqual([...block.sourceTextIds],definition.runs.map((r:any)=>r.sourceTextId));
  for(let frame=1;frame<=831;frame++){
   const sourcePresent:boolean=block.characterId===96||main.instances.some((i:any)=>i.characterId===block.characterId&&i.firstFrame<=frame&&i.lastFrameExclusive>frame);
   assert.equal(block.ranges.some(([first,last])=>frame>=first&&frame<=last),sourcePresent,`${block.characterId} frame ${frame}`);
  }
 }
 for(let frame=1;frame<=831;frame++){
  const expected:string[]=definitions.filter((d:any)=>d.characterId===96||main.instances.some((i:any)=>i.characterId===d.characterId&&i.firstFrame<=frame&&i.lastFrameExclusive>frame)).map((d:any)=>d.runs.map((r:any)=>r.text).join(''));
  assert.deepEqual(p004ReadableText(frame),[...new Set(expected)]);
 }
});
test('instructional sentences and labels enter at source placement boundaries without fabricated equation joining',()=>{
 const relation='A function is a special relation in which every value of x has a unique value of y.  ';
 const rule='A function can also be a rule for using an input to make an output.';
 for(const [frame,text] of [[508,relation],[614,rule],[127,'input'],[195,'output']] as const){
  assert(!p004ReadableText(frame-1).includes(text));assert(p004ReadableText(frame).includes(text));assert(p004ReadableText(831).includes(text));
 }
 assert(p004ReadableText(93).includes('M = $0.50   C'));
 assert(p004ReadableText(93).includes('x'));
 assert(!p004ReadableText(93).includes('M = $0.50 x C'),'separate source objects are never spliced');
 assert.equal(P004_TEXT_PROVENANCE.language,'en');
 assert(P004_TEXT_PROVENANCE.visibilityBoundary.includes('alpha'));
});
test('terminal and Replay are deterministic, immutable and reject invalid frame domains',()=>{
 const initial=p004ReadableText(1),terminal=p004ReadableText(831);
 assert.equal(initial[0],'Understanding Functions: Real World Activity');assert.equal(terminal[0],initial[0]);
 assert(terminal.includes('A function can also be a rule for using an input to make an output.'));
 assert(!initial.includes('input'));assert(!initial.includes('output'));
 assert.deepEqual(p004ReadableText(1),initial);assert(Object.isFrozen(initial));
 for(const bad of [0,832,-1,1.5,NaN,Infinity])assert.throws(()=>p004ReadableText(bad),RangeError);
});
