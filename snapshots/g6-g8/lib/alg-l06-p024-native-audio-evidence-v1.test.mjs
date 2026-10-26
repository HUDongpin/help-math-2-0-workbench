import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateNativeAudioTrace,validateP024NativeAudioEvidence}
 from './alg-l06-p024-native-audio-evidence-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const binding=JSON.parse(fs.readFileSync(path.join(root,
 'output/alg-l06-p024-host-prep-v5/candidate-source-binding-v1.json')));
const plan=JSON.parse(fs.readFileSync(path.join(root,binding.audioPlan.path)));
const read=name=>JSON.parse(fs.readFileSync(path.join(root,
 `output/playwright/alg-l06-p024-host-v3/${name}`),'utf8').split('\n')[1]);
const fixture=()=>({ready:read('ready-en-cli.txt'),sa:read('sa-flow-v5-cli.txt'),
 correct:read('en-correct-flow-v5-cli.txt')});

test('actual raw browser snapshots: eight exact decodes, isolated SA EOF, held main and right feedback',()=>{
 const result=validateP024NativeAudioEvidence(fixture(),plan);
 assert.deepEqual([result.ready,result.sa,result.correct,result.correctFeedback],
  [18,60,83,'sprite-123']);
 assert.equal(result.heldMainSeconds,result.returnMainSeconds);
 assert.equal(validateNativeAudioTrace(read('ready-es-cli.txt').observer,plan,{ready:true}).eventCount,18);
});

test('rejects a changed compressed source hash, sample count, and ready autoplay',()=>{
 for(const field of ['sourceSha256','samples']){
  const data=fixture(),event=data.ready.observer.events.find(e=>e.kind==='decode-resolved');
  if(field==='samples')event.samples++;else event.sourceSha256='0'.repeat(64);
  assert.throws(()=>validateNativeAudioTrace(data.ready.observer,plan,{ready:true}),
   /source identity|browser metadata/);
 }
 const data=fixture(),first=data.sa.observer.events.find(e=>e.kind==='source-created'),
  start=data.sa.observer.events.find(e=>e.kind==='source-start');
 data.ready.observer.events.push({...first,performanceMs:1e9},
  {...start,performanceMs:1e9+1});
 assert.throws(()=>validateNativeAudioTrace(data.ready.observer,plan,{ready:true}),
  /ready never autoplays/);
});

test('future scheduled stop does not retire main early or permit SA overlap',()=>{
 const data=fixture(),events=data.sa.observer.events;
 // Node 3 has a future stop at index 38. Remove its later immediate stop,
 // disconnect and ended; the source must still own audio when SA starts.
 data.sa.observer.events=events.filter((e,i)=>![39,40,45].includes(i));
 assert.throws(()=>validateNativeAudioTrace(data.sa.observer,plan),
  /overlapping live audio source/);
});

test('rejects a replayed main prefix or manually stopped SA presented as EOF',()=>{
 const data=fixture(),returnStart=data.sa.observer.events.find(e=>
  e.kind==='source-start'&&e.nodeId===5);
 returnStart.args[1]=0;
 assert.throws(()=>validateP024NativeAudioEvidence(data,plan),/main resumes held offset/);

 const stopped=fixture(),saEnd=stopped.sa.observer.events.find(e=>
  e.kind==='source-ended'&&e.nodeId===4);
 saEnd.kind='source-stop';saEnd.args=[];saEnd.accepted=true;
 assert.throws(()=>validateP024NativeAudioEvidence(stopped,plan),
  /SA reaches native ended event/);
});
