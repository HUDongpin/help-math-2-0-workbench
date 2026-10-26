import assert from 'node:assert/strict';
import test from 'node:test';
import {isP003ContinuousHostSearch} from '../lib/alg-l06-p003-local-audio-request-v1';
import {isP003ContinuousSourceRequest,P003_CONTINUOUS_SOURCE_URL} from '../lib/alg-l06-p003-continuous-source-access-v2';
import {isP003OptionalSpanishRequest,P003_OPTIONAL_SPANISH_URL} from '../lib/alg-l06-p003-optional-spanish-access-v1';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};
const base='http://127.0.0.1:3331';
const host='/en/migration-status/g678-calibration/shared-alg001-l06-p003/continuous-v2';
test('host focus and bounded RSC queries preserve actual navigation without frame overrides',()=>{
 for(const query of ['', 'mode=focus'])assert(isP003ContinuousHostSearch(new URLSearchParams(query)));
 for(const query of ['_rsc=abc-123','mode=focus&_rsc=abc_123']){
  assert(isP003ContinuousHostSearch(new URLSearchParams(query),true));
  assert(!isP003ContinuousHostSearch(new URLSearchParams(query)));
 }
 for(const query of ['mode=focus&mode=focus','mode=admin','frame=544','seek=1','_rsc=','_rsc=a/b','_rsc=a&_rsc=b','mode=focus&unknown=1'])
  assert(!isP003ContinuousHostSearch(new URLSearchParams(query),true),query);
});
test('both exact audio resources share focus-aware origin and transport boundaries',()=>{
 for(const [source,guard] of [[P003_CONTINUOUS_SOURCE_URL,isP003ContinuousSourceRequest],[P003_OPTIONAL_SPANISH_URL,isP003OptionalSpanishRequest]] as const){
  const url=new URL(source,base);
  const headers=new Headers({host:'127.0.0.1:3331','sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty',referer:base+host+'?mode=focus'});
  for(const method of ['GET','HEAD'])assert(guard({method,url,headers},env));
  for(const query of ['?frame=544','?mode=focus&_rsc=abc','?mode=focus&mode=focus']){
   const altered=new Headers(headers);altered.set('referer',base+host+query);
   assert(!guard({method:'GET',url,headers:altered},env));
  }
  for(const [key,value] of [['range','bytes=0-'],['origin','https://example.invalid'],['sec-fetch-site','cross-site'],['sec-fetch-dest','audio']]){
   const altered=new Headers(headers);altered.set(key,value);assert(!guard({method:'GET',url,headers:altered},env));
  }
  const other=new URL(source===P003_CONTINUOUS_SOURCE_URL?P003_OPTIONAL_SPANISH_URL:P003_CONTINUOUS_SOURCE_URL,base);
  assert(!guard({method:'GET',url:other,headers},env));
 }
});
