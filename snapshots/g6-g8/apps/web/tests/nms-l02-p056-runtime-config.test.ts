import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P056_MAIN_AUDIO,P056_RUNTIME_CONFIG} from '../components/nms-l02-p056-lesson-runtime-v1';
import {P056_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p056-terms-v1';
import {sourceGlossaryControlsAtFrame} from '../../../packages/demos/src/source-glossary-controls';

test('P056 full-opacity controls resolve distinct qualified source entries',()=>{
 assert.deepEqual(sourceGlossaryControlsAtFrame(P056_RUNTIME_CONFIG.page,16,'sprite-24'),[]);
 const controls=sourceGlossaryControlsAtFrame(P056_RUNTIME_CONFIG.page,17,'sprite-24');
 assert.equal(controls.length,2);
 for(const control of controls){
  const matches=P056_SOURCE_TERMS.filter(term=>term.id===control.entryId);
  assert.equal(matches.length,1);
  assert.equal(matches[0]!.sourceKeyAttribute,control.sourceKeyAttribute);
 }
 assert.equal(sourceGlossaryControlsAtFrame(P056_RUNTIME_CONFIG.page,234,'sprite-24').length,2);
 assert.throws(()=>sourceGlossaryControlsAtFrame(P056_RUNTIME_CONFIG.page,235,'sprite-24'));
 assert.equal(P056_RUNTIME_CONFIG.createSpanish,undefined);
});
test('P056 binds exact extracted stream and cannot perform network or audio work at entry',async()=>{
 const bytes=readFileSync(new URL('../../../migrations/shared-nms002-l02-p056/audit/embedded-source-stream-v1.mp3',import.meta.url));
 assert.equal(bytes.length,P056_MAIN_AUDIO.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),P056_MAIN_AUDIO.sha256);
 // Construction and seeking must work without WebAudio globals in Node.
 const transport=P056_RUNTIME_CONFIG.createTransport('http://127.0.0.1:3331');
 assert.equal(transport.snapshot().phase,'paused');
 assert.equal(transport.snapshot().frame,1);
 transport.seekFrame(234);
 assert.equal(transport.snapshot().frame,234);
 assert.equal(transport.snapshot().phase,'paused');
 assert.throws(()=>transport.seekFrame(235));
 await transport.close();
 assert.equal(transport.snapshot().phase,'closed');
});
