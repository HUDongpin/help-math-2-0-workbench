import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P055_MAIN_AUDIO,P055_RUNTIME_CONFIG} from '../components/nms-l02-p055-lesson-runtime';
import {P055_SOURCE_TERMS,P055_GLOSSARY_SOURCE_DISPOSITION} from '../../../packages/demos/src/generated/nms-l02-p055-terms-v1';

test('P055 host controls resolve all exact source keys in the qualified dictionary',()=>{
 for(const control of P055_RUNTIME_CONFIG.page.controls){
  const matches=P055_SOURCE_TERMS.filter(term=>term.id===control.entryId);
  assert.equal(matches.length,1);
  assert.equal(matches[0]!.sourceKeyAttribute,control.sourceKeyAttribute);
 }
 assert(P055_GLOSSARY_SOURCE_DISPOSITION);
 assert.equal(P055_RUNTIME_CONFIG.createSpanish,undefined);
});

test('P055 audio adapter binds real extracted bytes and remains lazy on construction',async()=>{
 const bytes=readFileSync(new URL('../../../output/nms-l02-ts-family-20260927/audio/p055-main-sprite-26.mp3',import.meta.url));
 assert.equal(bytes.length,P055_MAIN_AUDIO.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),P055_MAIN_AUDIO.sha256);
 const transport=P055_RUNTIME_CONFIG.createTransport('http://127.0.0.1:3331');
 assert.equal(transport.snapshot().phase,'paused');
 assert.equal(transport.snapshot().frame,1);
 transport.seekFrame(351);
 assert.equal(transport.snapshot().frame,351);
 assert.equal(transport.snapshot().phase,'paused');
 await transport.close();
 assert.equal(transport.snapshot().phase,'closed');
});
