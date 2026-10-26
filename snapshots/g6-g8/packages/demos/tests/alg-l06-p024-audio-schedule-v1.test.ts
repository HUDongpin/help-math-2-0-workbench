import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P024_AUDIO_DISPOSITION,P024_AUDIO_DOMAINS,P024_AUDIO_PLAN_SHA256,
 P024_AUDIO_SA,P024_MAIN_AUDIO_ID,P024_RIGHT_FEEDBACK_AUDIO_IDS,
 P024_WRONG_FEEDBACK_AUDIO_IDS,p024AudioDomain}
 from '../src/alg-l06-p024-audio-schedule-v1';

const root=new URL('../../../',import.meta.url);
const bytes=(file:string)=>readFileSync(new URL(file,root));
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');

test('P024 source schedule matches eight independent extracted MP3s and FFmpeg machine pins',()=>{
 const planBytes=bytes('output/alg-l06-p024-audio-v1/audio-domain-plan-v1.json');
 assert.equal(sha(planBytes),P024_AUDIO_PLAN_SHA256);
 const plan=JSON.parse(planBytes.toString());
 assert.equal(P024_AUDIO_DOMAINS.length,8);
 assert.deepEqual(plan.domains.map((row:{id:string})=>row.id),
  P024_AUDIO_DOMAINS.map(row=>row.id));
 for(const row of P024_AUDIO_DOMAINS){
  const asset=p024AudioDomain(row.id);
  const planned=plan.domains.find((item:{id:string})=>item.id===row.id);
  assert(planned);
  assert.deepEqual(planned.blockRange,row.blockRange);
  assert.equal(planned.declaredSamples,row.declaredSamples);
  assert.equal(planned.ffmpegDecode.samples,asset.ffmpegSamples);
  assert.equal(planned.ffmpegDecode.sha256,row.pcmSha256);
  assert.equal(bytes(asset.sourcePath).length,row.sourceBytes);
  assert.equal(sha(bytes(asset.sourcePath)),row.sourceSha256);
 }
 assert.equal(sha(bytes(P024_AUDIO_SA.sourcePath)),P024_AUDIO_SA.sourceSha256);
 assert.equal(plan.optionalSpanishAudio.ffmpegDecode.samples,P024_AUDIO_SA.ffmpegSamples);
 assert.equal(plan.optionalSpanishAudio.ffmpegDecode.sha256,P024_AUDIO_SA.pcmSha256);
});

test('quiz gate and feedback alternatives preserve source branch boundaries',()=>{
 assert.equal(P024_MAIN_AUDIO_ID,'sprite-208');
 assert.deepEqual([...P024_WRONG_FEEDBACK_AUDIO_IDS],['sprite-69','sprite-83','sprite-97']);
 assert.deepEqual([...P024_RIGHT_FEEDBACK_AUDIO_IDS],
  ['sprite-123','sprite-155','sprite-188','sprite-196']);
 assert.equal(p024AudioDomain(P024_MAIN_AUDIO_ID).localStopFrame,154);
 assert.deepEqual(p024AudioDomain('sprite-97').negativeSeekBlocks,
  [{frame:27,rawSeekSamples:-2093,mp3Bytes:0}]);
 assert.equal(P024_AUDIO_DISPOSITION.wrongPopupCloseToTerminalEstablished,false);
 assert.equal(P024_AUDIO_DISPOSITION.domainsConcatenated,false);
 assert.equal(P024_AUDIO_DISPOSITION.syntheticSilenceAdded,false);
 assert.equal(P024_AUDIO_DISPOSITION.localeStartsAudio,false);
 assert.equal(P024_AUDIO_DISPOSITION.browserDecodeObserved,false);
});
