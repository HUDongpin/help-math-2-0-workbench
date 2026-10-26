import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {mkdtempSync,mkdirSync,copyFileSync,readFileSync,writeFileSync,symlinkSync,realpathSync,rmSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {isP052AudioRequest,P052_AUDIO_PREFIX} from '../../../apps/web/lib/nms-l02-p052-audio-access';
import {p052AudioResponse} from '../../../apps/web/lib/nms-l02-p052-audio-response';
import {P052_SOURCE_ROOT,readP052CandidateAudio} from '../../../apps/web/lib/nms-l02-p052-source-bytes';
import {P052_AUDIO_PLANS} from '../src/generated/nms-l02-p052-runtime-audio-v1';
import {CONTINUOUS_AUDIO_PHASE} from '../../../apps/web/lib/continuous-source-audio-access';
const root=fileURLToPath(new URL('../../../',import.meta.url)).replace(/\/$/,'');
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_CALIBRATION_PHASE:CONTINUOUS_AUDIO_PHASE,HELP_MATH_G678_P052_AUDIO_CANDIDATE:'1',HELP_MATH_G678_SOURCE_ROOT:P052_SOURCE_ROOT};
function request(domain:string,locale='en'){
 const plan=P052_AUDIO_PLANS[domain as keyof typeof P052_AUDIO_PLANS];
 return new Request('http://127.0.0.1:3231'+P052_AUDIO_PREFIX+domain+'?sha256='+plan.inputSha256,{headers:{
  host:'127.0.0.1:3231',referer:`http://127.0.0.1:3231/${locale}/migration-status/g678-calibration/shared-nms002-l02-p052`,
  'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty'}});
}
function allowed(r:Request,domain:string,e=env){return isP052AudioRequest({method:r.method,url:new URL(r.url),headers:r.headers},domain,e);}
test('six exact candidate streams pass source hashes and response contract in both locales',async()=>{
 for(const [domain,plan] of Object.entries(P052_AUDIO_PLANS))for(const locale of ['en','es']){
  const r=request(domain,locale);assert.equal(allowed(r,domain),true);
  const response=p052AudioResponse(r,domain,()=>root,env);assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'audio/mpeg');assert.equal(response.headers.get('content-length'),String(plan.inputBytes));
  assert.equal(response.headers.get('cross-origin-resource-policy'),'same-origin');assert.match(response.headers.get('cache-control')!,/no-store/);
  assert.match(response.headers.get('x-robots-tag')!,/noindex/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(createHash('sha256').update(new Uint8Array(await response.arrayBuffer())).digest('hex'),plan.inputSha256);
 }
});
test('all environment denials happen before workspace or source access',()=>{
 const r=request('sprite-350');
 for(const patch of [{NODE_ENV:'production'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW:'0'},
  {HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'},{HELP_MATH_G678_CALIBRATION_PHASE:'wrong'},
  {HELP_MATH_G678_P052_AUDIO_CANDIDATE:undefined},{HELP_MATH_G678_SOURCE_ROOT:'/tmp/wrong'}]){
  const response=p052AudioResponse(r,'sprite-350',()=>{assert.fail('denied request reached filesystem');},{...env,...patch});
  assert.equal(response.status,404);assert.equal(response.body,null);
 }
});
test('exact prefixless English lesson referer retains same-origin source audio',()=>{
 const r=request('sprite-350');
 const headers=new Headers(r.headers);
 headers.set('referer','http://127.0.0.1:3231/migration-status/g678-calibration/shared-nms002-l02-p052?mode=focus');
 assert.equal(allowed(new Request(r.url,{headers}),'sprite-350'),true);
 headers.set('referer','http://127.0.0.1:3232/migration-status/g678-calibration/shared-nms002-l02-p052?mode=focus');
 assert.equal(allowed(new Request(r.url,{headers}),'sprite-350'),false);
});
test('cross-site, ranges, sibling pages, malformed headers and query changes are denied',()=>{
 const r=request('sprite-350');
 for(const [key,value]of [
  ['range','bytes=0-10'],['sec-fetch-site','cross-site'],['sec-fetch-mode','navigate'],['sec-fetch-dest','audio'],
  ['host','127.0.0.1:3232'],['host','localhost:3231'],['host','user@127.0.0.1:3231'],
  ['x-forwarded-host','127.0.0.1:3232'],['origin','https://example.com'],
  ['referer','http://127.0.0.1:3231/en/migration-status/g678-calibration/shared-nms002-l02-p051'],
  ['referer','http://localhost:3231/en/migration-status/g678-calibration/shared-nms002-l02-p052'],
 ]){const h=new Headers(r.headers);h.set(key,value);assert.equal(allowed(new Request(r.url,{headers:h}),'sprite-350'),false,`${key} ${value}`);}
 for(const key of ['host','referer','sec-fetch-site','sec-fetch-mode','sec-fetch-dest']){
  const h=new Headers(r.headers);h.delete(key);assert.equal(allowed(new Request(r.url,{headers:h}),'sprite-350'),false,key);
 }
 for(const url of [r.url+'&extra=1',r.url+'&sha256=x',r.url.replace('sha256=','sha256=0'),r.url.replace('http:','https:'),
  r.url.replace('127.0.0.1','example.com'),r.url.replace('sprite-350','sprite-349')])assert.equal(allowed(new Request(url,{headers:r.headers}),'sprite-350'),false);
 assert.equal(allowed(new Request(r.url,{method:'POST',headers:r.headers}),'sprite-350'),false);
 for(const domain of ['__proto__','constructor','../sprite-350','sprite-999'])assert.equal(allowed(r,domain),false);
 // NextURL may normalize a loopback hostname, but never its port or actual Host/Referer.
 assert.equal(allowed(new Request(r.url.replace('127.0.0.1','localhost'),{headers:r.headers}),'sprite-350'),true);
});
test('missing source and unknown domain fail closed without leaking filesystem errors',async()=>{
 assert.throws(()=>readP052CandidateAudio(root,P052_SOURCE_ROOT,'../sprite-350'),/DOMAIN/);
 const response=p052AudioResponse(request('sprite-350'),'sprite-350',()=>'/nonexistent-p052-test-workspace',env);
 assert.equal(response.status,404);assert.equal(await response.text(),'');
});
test('source readers reject symlinks, source drift and same-length audio drift',t=>{
 const dir=mkdtempSync(join(realpathSync(tmpdir()),'p052-source-access-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const workspace=join(dir,'work'),source=join(dir,'source');
 const relative='migrations/shared-nms002-l02-p052/audit';
 mkdirSync(join(workspace,relative),{recursive:true});mkdirSync(join(source,'G6-G8-shared/NMS002/L2/TI'),{recursive:true});
 const swf=join(source,'G6-G8-shared/NMS002/L2/TI/L2TI11.swf');
 copyFileSync(join(P052_SOURCE_ROOT,'G6-G8-shared/NMS002/L2/TI/L2TI11.swf'),swf);
 for(const name of ['preserved-source-v1.swf','sprite-350-source-stream-v1.mp3'])copyFileSync(join(root,relative,name),join(workspace,relative,name));
 assert.equal(readP052CandidateAudio(workspace,source,'sprite-350').length,58630);
 symlinkSync(source,join(dir,'source-link'));assert.throws(()=>readP052CandidateAudio(workspace,join(dir,'source-link'),'sprite-350'),/ROOT/);
 const audio=join(workspace,relative,'sprite-350-source-stream-v1.mp3');
 rmSync(audio);symlinkSync(join(root,relative,'sprite-350-source-stream-v1.mp3'),audio);
 assert.throws(()=>readP052CandidateAudio(workspace,source,'sprite-350'),/SYMLINK/);
 rmSync(audio);copyFileSync(join(root,relative,'sprite-350-source-stream-v1.mp3'),audio);
 const b=readFileSync(audio);b[10]^=1;writeFileSync(audio,b);
 assert.throws(()=>readP052CandidateAudio(workspace,source,'sprite-350'),/HASH/);
 copyFileSync(join(root,relative,'sprite-350-source-stream-v1.mp3'),audio);
 const s=readFileSync(swf);s[10]^=1;chmodSync(swf,0o600);writeFileSync(swf,s);
 assert.throws(()=>readP052CandidateAudio(workspace,source,'sprite-350'),/HASH/);
});
