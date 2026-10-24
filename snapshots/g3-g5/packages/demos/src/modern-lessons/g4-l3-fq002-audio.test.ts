import test from 'node:test';
import assert from 'node:assert/strict';
import {fq002AudioAsset, fq002AudioRequest, fq002AudioStopRequest} from './g4-l3-fq002-audio';
import {FQ002_AUDIO_ASSETS} from './generated/g4-l3-fq002-audio';
test('all25 source questions have both language question and A-D assets',()=>{
 assert.equal(FQ002_AUDIO_ASSETS.length,250);assert.equal(new Set(FQ002_AUDIO_ASSETS.map(a=>a.id)).size,250);
 for(let question=1;question<=25;question++)for(const lang of ['en','es'] as const)for(const option of [null,'A','B','C','D'] as const){
  const a=fq002AudioAsset(question,lang,option)!;assert(a);assert(a.source.includes(`/${lang==='en'?'EA':'SA'}/Q${question}${option??''}.mp3?sha256=${a.sha256}`));
  assert.equal(a.spokenLanguage,'undetermined');
 }
 assert.equal(fq002AudioAsset(0,'en'),undefined);assert.equal(fq002AudioAsset(26,'en'),undefined);assert.equal(fq002AudioAsset(1.5,'en'),undefined);
});
test('source identity and host gates control requests; active audio can stop',()=>{
 const input={questionId:7,language:'es' as const,option:'B' as const,enabled:true,ready:true,paused:false};
 const request=fq002AudioRequest(input)!;assert.equal(request.type,'play-audio');assert.equal(request.cueId,fq002AudioAsset(7,'es','B')!.id);
 assert.equal(fq002AudioRequest({...input,activeId:request.cueId})!.type,'pause-audio');
 assert.equal(fq002AudioRequest({...input,pausedId:request.cueId})!.type,'resume-audio');
 for(const change of [{enabled:false},{ready:false},{paused:true},{questionId:26}])assert.equal(fq002AudioRequest({...input,...change}),undefined);
 assert.deepEqual(fq002AudioStopRequest(request.cueId),{type:'stop-audio',cueId:request.cueId});
 assert.equal(fq002AudioStopRequest('other-page-audio'),undefined);assert.equal(fq002AudioStopRequest(null),undefined);
});
