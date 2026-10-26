import assert from 'node:assert/strict';
import test from 'node:test';
import {isP053SourceAudioRequest,P053_SOURCE_AUDIO_URL}
  from '../lib/nms-l02-p053-source-audio-access';

const env={NODE_ENV:'development',VERCEL_ENV:'',
  HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
  HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};
const url=new URL(P053_SOURCE_AUDIO_URL,'http://127.0.0.1:3331');
const headers=new Headers({host:'127.0.0.1:3331','sec-fetch-site':'same-origin',
  'sec-fetch-mode':'cors','sec-fetch-dest':'empty',
  referer:'http://127.0.0.1:3331/en/migration-status/g678-calibration/shared-nms002-l02-p053'});
const request=(method='GET',candidateUrl=url,candidateHeaders=headers,candidateEnv=env)=>
  isP053SourceAudioRequest({method,url:candidateUrl,headers:candidateHeaders},candidateEnv);
const withHeader=(name:string,value:string)=>{
  const next=new Headers(headers);next.set(name,value);return next;
};

test('P053 complete audio allows only exact local GET and HEAD fetches from EN/ES page',()=>{
  assert.equal(request(),true);
  assert.equal(request('HEAD'),true);
  assert.equal(request('GET',new URL(url.href.replace('127.0.0.1','localhost'))),true,
    'Next loopback URL normalization may differ from actual Host');
  assert.equal(request('GET',url,withHeader('referer',
    'http://127.0.0.1:3331/es/migration-status/g678-calibration/shared-nms002-l02-p053')),true);
  assert.equal(request('POST'),false);
  assert.equal(request('GET',url,headers,{...env,NODE_ENV:'production'}),false);
  assert.equal(request('GET',url,headers,{...env,VERCEL_ENV:'preview'}),false);
  assert.equal(request('GET',url,headers,{...env,HELP_MATH_G678_SOURCE_ROOT:'/tmp'}),false);
});

test('P053 audio guard rejects query, range, origin, host and page-context drift',()=>{
  assert.equal(request('GET',new URL(url.href+'&extra=1')),false);
  assert.equal(request('GET',new URL(url.href.replace('sha256=2','sha256=%32'))),false);
  assert.equal(request('GET',new URL(url.href.replace('225177c9','125177c9'))),false);
  assert.equal(request('GET',new URL(url.href.replace('127.0.0.1','example.com'))),false);
  assert.equal(request('GET',url,withHeader('range','bytes=0-')),false);
  assert.equal(request('GET',url,withHeader('origin','http://evil.example')),false);
  assert.equal(request('GET',url,withHeader('host','127.0.0.1:3332')),false);
  assert.equal(request('GET',url,withHeader('x-forwarded-host','127.0.0.1:3332')),false);
  assert.equal(request('GET',url,withHeader('sec-fetch-dest','audio')),false);
  assert.equal(request('GET',url,withHeader('sec-fetch-site','cross-site')),false);
  assert.equal(request('GET',url,withHeader('referer',
    'http://127.0.0.1:3331/en/migration-status/g678-calibration/shared-nms002-l02-p053?seed=1')),false);
  assert.equal(request('GET',url,withHeader('referer','http://127.0.0.1:3331/privacy')),false);
  assert.equal(request('GET',url,withHeader('referer',
    'http://127.0.0.1:3332/en/migration-status/g678-calibration/shared-nms002-l02-p053')),false);
});
