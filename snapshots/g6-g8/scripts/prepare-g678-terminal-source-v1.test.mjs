import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {extractTerminalStream} from './prepare-g678-terminal-source-v1.mjs';

const task='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
for(const [source,domain,first,last,audio] of [
  ['alg-l01-p006-source-v1/source.swf','sprite-25',1,436,'alg-l01-p006-audio-v1/source-stream.mp3'],
  ['nms-l03-p002-source-v1/source.swf','sprite-237',1,688,'nms-l03-p002-audio-v1/source-stream.mp3'],
  ['alg-l02-p005-preparation-v1/source/source.swf','sprite-197',11,744,'alg-l02-p005-preparation-v1/audio/source-stream.mp3'],
  ['alg-l06-p002-preparation-v1/source/source.swf','sprite-370',16,853,'alg-l06-p002-preparation-v1/audio/source-stream.mp3'],
])test(`${domain} extraction retains exact source MP3 bytes and authored stream frame range`,async()=>{
  const original=await readFile(`${task}/${source}`),expected=await readFile(`${task}/${audio}`);
  const extracted=extractTerminalStream(original,domain);
  assert(extracted.mp3.equals(expected),'MP3 payload is unchanged; leading frames are not padded into it');
  assert.equal(extracted.blocks[0].frame,first);assert.equal(extracted.blocks.at(-1).frame,last);
  assert.deepEqual(extracted.blocks.map(b=>b.frame),Array.from({length:last-first+1},(_,i)=>first+i));
  assert.equal(extracted.actions.length,3);assert.equal(extracted.heads.length,1);
  assert.equal(extracted.actions.find(a=>a.domain===domain).hex,'0700');
  assert.equal(extracted.actions.find(a=>a.domain===domain).frame,last);
  assert.equal(createHash('sha256').update(extracted.mp3).digest('hex'),createHash('sha256').update(expected).digest('hex'));
  assert.throws(()=>extractTerminalStream(original.subarray(0,100),domain));
});
