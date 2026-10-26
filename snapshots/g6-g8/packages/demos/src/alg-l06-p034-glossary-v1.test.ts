import assert from 'node:assert/strict';
import test from 'node:test';
import source from '../../../migrations/shared-alg001-l06-p034/native-v1/geometry-v1.json';
import {p034NativeTextState} from './native-text/alg-l06-p034-native';
import {p034CanOpenGlossary,p034GlossaryState,type P034GlossaryKey}
 from './alg-l06-p034-glossary-v1';

const keys:readonly P034GlossaryKey[]=['Vertical-line test','Graph','Function','Vertical','Line'];
const available=(frame:number)=>p034GlossaryState(frame,p034NativeTextState(frame))
 .filter(x=>x.available).map(x=>`${x.key}#${x.buttonId}`);

test('source has five keys, ten physical placements and seven button definitions',()=>{
 assert.equal(source.glossary.length,10);
 assert.deepEqual([...new Set(source.glossary.map(x=>x.key))],keys);
 assert.deepEqual([...new Set(source.glossary.map(x=>x.buttonId))],[7,8,9,13,14,20,21]);
 assert(source.glossary.every(x=>/^[a-f0-9]{64}$/u.test(x.actionSha256)));
 assert.deepEqual(available(1),[]);
 assert.deepEqual(available(20),['Vertical-line test#7']);
 assert.deepEqual(available(50),['Vertical-line test#7','Graph#8']);
 assert.deepEqual(available(124),['Vertical-line test#7','Graph#8','Function#9',
  'Vertical#13','Line#14']);
 assert.deepEqual(available(195),['Vertical-line test#7','Graph#8','Function#9',
  'Vertical#20','Line#21']);
});

test('all 434 source frames require source button, full blue label, mask and hit correspondence',()=>{
 for(let frame=1;frame<=434;frame++){
  const state=p034GlossaryState(frame,p034NativeTextState(frame));
  assert.equal(state.length,10);
  for(const row of state){
   assert.equal(row.available,
    row.buttonPresent&&row.labelComplete&&row.sourceHitAligned,
    `frame ${frame} button ${row.buttonId}`);
   if(row.available){
    assert(row.hitBounds);
    assert(row.label.segment.length>0);
   }
  }
  assert(state.filter(x=>x.available).length<=5);
 }
});

test('live native trigger needs matching source action, instance, label and frame',()=>{
 const frame=124,native=p034NativeTextState(frame),control=p034GlossaryState(frame,native)
  .find(x=>x.key==='Function'&&x.available);
 assert(control);
 const attrs=new Map<string,string>([
  ['data-p034-glossary-key',control.key],['data-source-button-id',String(control.buttonId)],
  ['data-source-button-instance-id',control.buttonInstanceId],
  ['data-source-action-sha256',control.sourceActionSha256],
  ['data-source-label-instance-id',control.label.instanceId],
  ['data-source-label-run-id',control.label.sourceRunId],
  ['data-source-label-segment',control.label.segment],
  ['data-source-button-visual-state','full-own-blue-glyph-and-hit'],
 ]);
 const trigger=({isConnected:true,disabled:false,
  getAttribute:(name:string)=>attrs.get(name)??null}) as unknown as HTMLButtonElement;
 const scope=({isConnected:true,contains:(candidate:unknown)=>candidate===trigger,
  getAttribute:(name:string)=>name==='data-p034-frame'?String(frame):null}) as unknown as HTMLElement;
 assert(p034CanOpenGlossary('Function',trigger,frame,scope,native));
 attrs.set('data-source-button-instance-id','other-page');
 assert(!p034CanOpenGlossary('Function',trigger,frame,scope,native));
 attrs.set('data-source-button-instance-id',control.buttonInstanceId);
 assert(!p034CanOpenGlossary('Function',trigger,frame-1,scope,p034NativeTextState(frame-1)));
});
