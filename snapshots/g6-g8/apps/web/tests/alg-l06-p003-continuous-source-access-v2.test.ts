import assert from 'node:assert/strict';
import test from 'node:test';
import {isP003ContinuousSourceRequest,P003_CONTINUOUS_SOURCE_URL}
  from '../lib/alg-l06-p003-continuous-source-access-v2';

const env={NODE_ENV:'development',VERCEL_ENV:'',
  HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
  HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};
const url=new URL(P003_CONTINUOUS_SOURCE_URL,'http://127.0.0.1:3331');
const headers=new Headers({host:'127.0.0.1:3331','sec-fetch-site':'same-origin',
  'sec-fetch-mode':'cors','sec-fetch-dest':'empty',
  referer:'http://127.0.0.1:3331/en/migration-status/g678-calibration/shared-alg001-l06-p003/continuous-v2'});
const allowed=(method='GET',candidateUrl=url,candidateHeaders=headers,candidateEnv=env)=>
  isP003ContinuousSourceRequest({method,url:candidateUrl,headers:candidateHeaders},candidateEnv);
const withHeader=(name:string,value:string)=>{
  const next=new Headers(headers);next.set(name,value);return next;
};

test('only exact EN/ES candidate fetches can read the complete P003 stream',()=>{
  assert.equal(allowed(),true);
  assert.equal(allowed('HEAD'),true);
  assert.equal(allowed('GET',url,withHeader('referer',
    'http://127.0.0.1:3331/es/migration-status/g678-calibration/shared-alg001-l06-p003/continuous-v2')),true);
  assert.equal(allowed('GET',new URL(url.href.replace('127.0.0.1','localhost'))),true,
    'Next may normalize the request URL loopback alias while preserving actual Host');
  assert.equal(allowed('POST'),false);
  assert.equal(allowed('GET',url,headers,{...env,NODE_ENV:'production'}),false);
  assert.equal(allowed('GET',url,headers,{...env,VERCEL_ENV:'preview'}),false);
  assert.equal(allowed('GET',url,headers,{...env,HELP_MATH_G678_LOCAL_PREVIEW:'0'}),false);
  assert.equal(allowed('GET',url,headers,{...env,HELP_MATH_G678_SOURCE_ROOT:'/tmp'}),false);
});

test('hash, exact page, origin, fetch metadata and range are fail-closed',()=>{
  for(const altered of [url.href+'&x=1',url.href.replace('sha256=9','sha256=%39'),
    url.href.replace('91ddead6','81ddead6'),url.href.replace('127.0.0.1','example.com'),
    url.href.replace('/continuous-source-v2','/continuous-source-v2/extra')])
    assert.equal(allowed('GET',new URL(altered)),false,altered);
  for(const [name,value] of [['range','bytes=0-'],['origin','http://evil.example'],
    ['host','127.0.0.1:3332'],['x-forwarded-host','127.0.0.1:3332'],
    ['sec-fetch-site','cross-site'],['sec-fetch-mode','no-cors'],
    ['sec-fetch-dest','audio'],['referer','http://127.0.0.1:3331/privacy'],
    ['referer','http://127.0.0.1:3331/en/migration-status/g678-calibration/shared-alg001-l06-p003/continuous-v2?frame=41'],
    ['referer','http://127.0.0.1:3331/en/migration-status/g678-calibration/shared-alg001-l06-p003']])
    assert.equal(allowed('GET',url,withHeader(name,value)),false,`${name}: ${value}`);
  assert.equal(allowed('HEAD',url,withHeader('sec-fetch-mode','no-cors')),false);
});
