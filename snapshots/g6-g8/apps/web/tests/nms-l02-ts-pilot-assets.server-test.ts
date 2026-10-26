import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs,{readFileSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {p055PilotAssetManifest,p055PilotResources,p055PilotText,
  verifyP055PilotSource,type P055PilotAssetName} from '../lib/nms-l02-ts-pilot-assets.server';
import {GET} from '../app/migration-assets/nms-l02-ts-pilot/[asset]/route';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ENV_KEYS=['NODE_ENV','VERCEL_ENV','HELP_MATH_G678_LOCAL_PREVIEW',
 'HELP_MATH_G678_LOCAL_PREVIEW_BIND','HELP_MATH_G678_SOURCE_ROOT'] as const;
const env:Record<string,string|undefined>=process.env;
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function local(run:()=>void|Promise<void>){
 const saved=Object.fromEntries(ENV_KEYS.map(key=>[key,env[key]]));
 try{
  env.NODE_ENV='development';delete env.VERCEL_ENV;
  env.HELP_MATH_G678_LOCAL_PREVIEW='1';env.HELP_MATH_G678_LOCAL_PREVIEW_BIND='127.0.0.1';
  env.HELP_MATH_G678_SOURCE_ROOT=SOURCE_ROOT;
  await run();
 }finally{for(const key of ENV_KEYS){
  if(saved[key]===undefined)delete env[key];else env[key]=saved[key];
 }}
}
const ORIGIN='http://127.0.0.1:3377';
function request(name:P055PilotAssetName,sha256:string,
 options:{url?:string;headers?:Record<string,string>;omit?:readonly string[];method?:string}={}){
 const script=name==='typography.js';
 const headers=new Headers({host:'127.0.0.1:3377',
  referer:`${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p055`,
  origin:ORIGIN,'sec-fetch-site':'same-origin',
  'sec-fetch-mode':script?'cors':'same-origin','sec-fetch-dest':script?'script':'empty',
  ...options.headers});
 for(const name of options.omit??[])headers.delete(name);
 const url=options.url??`${ORIGIN}/migration-assets/nms-l02-ts-pilot/${name}?sha256=${sha256}`;
 return new Request(url,{method:options.method??'GET',headers});
}
const get=(input:Request,asset:string)=>GET(input,{params:Promise.resolve({asset})});
async function denied(input:Request,asset:string){
 const result=await get(input,asset);
 assert.equal(result.status,404,`${asset}: ${input.url}`);
 assert.equal((await result.arrayBuffer()).byteLength,0);
 assert.match(result.headers.get('x-robots-tag')??'',/noindex/u);
}

test('P055 server reads exact real source, native/audio bytes and serializable text IR',()=>local(()=>{
 const source=verifyP055PilotSource();
 assert.equal(source.sha256,'8581db0c66f2b9640eb8ea244e22ec6831d0cb98d1fd9b3fb60b15bcc745758e');
 assert.equal(hash(readFileSync(source.path)),source.sha256);
 const manifest=p055PilotAssetManifest();
 assert.deepEqual(manifest.map(item=>item.name),['typography.js','main.mp3']);
 assert.equal(manifest[0]?.sha256,'47e796237e5520140a760175865f09c3f218ac942cf3cadc8fb9f56c38bd358d');
 assert.equal(manifest[1]?.sha256,'ca2a80e75f1fc25d4ff0696af4cc1ccfcec87a1518bbc88eda998b855865a20b');
 for(const row of manifest){
  assert.equal(hash(readFileSync(path.join(ROOT,row.path))),row.sha256);
  assert.equal(row.url,`/migration-assets/nms-l02-ts-pilot/${row.name}?sha256=${row.sha256}`);
 }
 const text=p055PilotText();
 assert.equal(text.animationId,'shared-nms002-l02-p055');
 assert.equal(text.frameCount,351);
 assert.equal(text.definitions.length,12);
 assert.equal(text.instances.length,18);
 const mutable=p055PilotResources();mutable[0]!.bytes.fill(0);
 assert.equal(hash(p055PilotResources()[0]!.bytes),manifest[0]?.sha256);
}));

test('P055 route serves only the two exact same-origin local pilot assets',()=>local(async()=>{
 for(const row of p055PilotAssetManifest()){
  for(const input of [request(row.name,row.sha256),
   request(row.name,row.sha256,{url:`http://localhost:3377/migration-assets/nms-l02-ts-pilot/${row.name}?sha256=${row.sha256}`}),
   request(row.name,row.sha256,{headers:{'sec-fetch-mode':'no-cors',
    'sec-fetch-dest':row.name==='typography.js'?'script':'audio'},omit:['origin']}),
   request(row.name,row.sha256,{headers:{referer:`${ORIGIN}/es/migration-status/g678-calibration/shared-nms002-l02-p055`}})]){
    const result=await get(input,row.name);
    assert.equal(result.status,200);
    assert.equal(result.headers.get('content-type'),row.contentType);
    assert.equal(result.headers.get('content-length'),String(row.bytes));
    assert.equal(result.headers.get('cache-control'),'private, no-store, max-age=0');
    assert.equal(result.headers.get('cross-origin-resource-policy'),'same-origin');
    assert.equal(hash(new Uint8Array(await result.arrayBuffer())),row.sha256);
   }
 }
}));

test('P055 route denies path/query/header/method drift and has no SA endpoint',()=>local(async()=>{
 for(const row of p055PilotAssetManifest()){
  const good=request(row.name,row.sha256).url,base=good.split('?')[0]!;
  for(const url of [base,`${base}?sha256=bad`,`${good}&extra=1`,
   `${good}&sha256=${row.sha256}`,good.replace('127.0.0.1','helpmath.ai'),
   good.replace('http:','https:'),good.replace('127.0.0.1:3377','localhost:9999'),
   good.replace('nms-l02-ts-pilot','other-pilot')])
    await denied(request(row.name,row.sha256,{url}),row.name);
  for(const headers of [{host:'helpmath.ai'},{'x-forwarded-host':'example.com'},
   {referer:`${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p056`},
   {referer:`${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p055?x=1`},
   {origin:'https://example.com'},{'sec-fetch-site':'cross-site'},
   {'sec-fetch-mode':'navigate'},{'sec-fetch-dest':row.name==='typography.js'?'audio':'script'},
   {range:'bytes=0-100'}] as Record<string,string>[])await denied(request(row.name,row.sha256,{headers}),row.name);
  for(const omit of ['host','referer','sec-fetch-site','sec-fetch-mode','sec-fetch-dest'])
   await denied(request(row.name,row.sha256,{omit:[omit]}),row.name);
  for(const method of ['HEAD','POST'])
   await denied(request(row.name,row.sha256,{method}),row.name);
  if(row.name==='typography.js')await denied(request(row.name,row.sha256,{omit:['origin']}),row.name);
 }
 await denied(request('main.mp3',p055PilotAssetManifest()[1]!.sha256),'spanish-audio.mp3');
}));

test('P055 asset reader and route remain closed outside exact local source scope',async()=>{
 const cases:ReadonlyArray<readonly [typeof ENV_KEYS[number],string|undefined]>=[
  ['NODE_ENV','production'],['VERCEL_ENV','preview'],['VERCEL_ENV','production'],
  ['HELP_MATH_G678_LOCAL_PREVIEW',undefined],['HELP_MATH_G678_LOCAL_PREVIEW_BIND','0.0.0.0'],
  ['HELP_MATH_G678_SOURCE_ROOT','/nonexistent'],
 ];
 for(const [key,value] of cases)await local(async()=>{
  if(value===undefined)delete env[key];else env[key]=value;
  assert.throws(()=>p055PilotAssetManifest());
  assert.throws(()=>p055PilotText());
  await denied(request('main.mp3','0'.repeat(64)),'main.mp3');
 });
});

test('P055 reader and route reject changed physical asset bytes',t=>local(async()=>{
 const original=fs.readFileSync;
 const target=path.join(ROOT,'output/nms-l02-ts-family-20260927/visual/canvas-renderer.js');
 try{
  t.mock.method(fs,'readFileSync',(...args:Parameters<typeof fs.readFileSync>)=>{
   const bytes=original(...args);
   if(args[0]!==target)return bytes;
   assert(Buffer.isBuffer(bytes));
   const changed=Buffer.from(bytes);changed[0]^=1;return changed;
  });
  syncBuiltinESMExports();
  assert.throws(()=>p055PilotResources(),/P055_PILOT_HASH/u);
  await denied(request('typography.js','47e796237e5520140a760175865f09c3f218ac942cf3cadc8fb9f56c38bd358d'),'typography.js');
 }finally{t.mock.restoreAll();syncBuiltinESMExports();}
}));
