import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {build} from 'esbuild';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const entry=fileURLToPath(new URL('../apps/web/lib/alg-l06-p004-predecessor-request-v1.ts',import.meta.url));
const bundled=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false});
const {P004_PREDECESSOR_RESOURCES:resources,p004PredecessorResourceForRequest:classify,
  isP004PredecessorOriginalRequest:isOriginal}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`);
const env={NODE_ENV:'development',VERCEL:'',VERCEL_ENV:'',
  HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,HELP_MATH_G678_LOCAL_PREVIEW:'1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
const referer='http://127.0.0.1:3331/en/migration-status/g678-calibration/shared-alg001-l06-p004/candidate-v1';

function request(kind,form='original',overrides={}){
  const resource=resources[kind];
  const url=new URL(`http://127.0.0.1:3331${resource[form==='original'?'originalPath':'bridgePath']}?sha256=${resource.sha256}`);
  const headers=new Headers({'host':'127.0.0.1:3331','referer':referer,
    'sec-fetch-site':'same-origin','sec-fetch-mode':kind==='canvas'?'no-cors':'cors',
    'sec-fetch-dest':kind==='canvas'?'script':'empty'});
  for(const [key,value] of Object.entries(overrides.headers??{})){
    if(value===null)headers.delete(key);else headers.set(key,value);
  }
  return {method:overrides.method??'GET',url:overrides.url??url,headers};
}

test('exact P004 document recognizes all six original/rewrite forms',()=>{
  for(const kind of ['canvas','main','spanish'])for(const form of ['original','bridge']){
    const req=request(kind,form);
    assert.equal(classify(req,env),kind);
    assert.equal(isOriginal(req,env),form==='original');
    const es=request(kind,form,{headers:{referer:referer.replace('/en/','/es/')}});
    assert.equal(classify(es,env),kind);
  }
  for(const kind of ['main','spanish'])assert.equal(classify(request(kind,'bridge',{method:'HEAD'}),env),kind);
  assert.equal(classify(request('canvas','bridge',{method:'HEAD'}),env),null);
});

test('other documents, malformed hash/method/fetch shape and broad environments deny',()=>{
  const base=request('main');
  const badUrls=[
    `${base.url}&extra=1`,`${base.url}&sha256=${resources.main.sha256}`,
    `${base.url}`.replace(resources.main.sha256,resources.spanish.sha256),
    `${base.url}`.replace('127.0.0.1:3331','127.0.0.1:3332'),
    `${base.url}`.replace('/shared-alg001-l06-p003/','/shared-alg001-l06-p004/'),
    `${base.url}#fragment`,
  ];
  for(const value of badUrls)assert.equal(classify({...base,url:new URL(value)},env),null,value);
  for(const value of [
    '/shared-alg001-l06-p003/continuous-v2',
    '/shared-alg001-l06-p004/candidate-v1?mode=focus',
    '/shared-alg001-l06-p004/candidate-v1/',
    '/shared-alg001-l06-p004/candidate-v1#x',
    '/shared-alg001-l06-p004',
  ])assert.equal(classify(request('main','original',{headers:{referer:`http://127.0.0.1:3331/en/migration-status/g678-calibration${value}`}}),env),null);
  for(const headers of [
    {'sec-fetch-site':'cross-site'},{'sec-fetch-mode':'no-cors'},
    {'sec-fetch-dest':'script'},{range:'bytes=0-1'},
    {origin:'https://helpmath.ai'},{host:'localhost:3331'},
    {'x-forwarded-host':'127.0.0.1:3332'},
    {referer:'http://localhost:3331/en/migration-status/g678-calibration/shared-alg001-l06-p004/candidate-v1'},
  ])assert.equal(classify(request('main','bridge',{headers}),env),null,JSON.stringify(headers));
  for(const change of [{NODE_ENV:'production'},{VERCEL:'1'},{VERCEL_ENV:'preview'},
    {HELP_MATH_G678_LOCAL_PREVIEW:'0'},{HELP_MATH_G678_SOURCE_ROOT:'/'},
    {HELP_MATH_G678_LOCAL_PREVIEW_BIND:'localhost'}])
    assert.equal(classify(base,{...env,...change}),null,JSON.stringify(change));
  assert.equal(classify(request('main','bridge',{method:'POST'}),env),null);
  assert.equal(classify(request('canvas','bridge',{headers:{'sec-fetch-dest':'empty'}}),env),null);
  assert.equal(classify(request('canvas','bridge',{headers:{'sec-fetch-mode':'cors'}}),env),null);
});

test('bridge reader returns only the three pinned canonical P003 resources',()=>{
  const server=pathToFileURL(path.join(ROOT,'apps/web/lib/alg-l06-p004-predecessor-resources-v1.server.ts')).href;
  const code=`import {readP004PredecessorResource as read} from '${server}';
    import {createHash} from 'node:crypto';
    const pin=b=>({bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
    console.log(JSON.stringify({canvas:pin(read('canvas')),main:pin(read('main')),
      spanish:pin(read('spanish'))}));`;
  const run=(more={})=>spawnSync(process.execPath,['--conditions=react-server','--import','tsx',
    '--input-type=module','-e',code],{cwd:ROOT,encoding:'utf8',maxBuffer:1024*1024,
    env:{...process.env,...env,...more}});
  const actual=run();assert.equal(actual.status,0,actual.stderr||actual.stdout);
  assert.deepEqual(JSON.parse(actual.stdout.trim()),Object.fromEntries(
    Object.entries(resources).map(([kind,value])=>[kind,{bytes:value.bytes,sha256:value.sha256}])));
  for(const change of [{NODE_ENV:'production'},{HELP_MATH_G678_SOURCE_ROOT:'/'},
    {HELP_MATH_G678_LOCAL_PREVIEW:'0'}]){
    const denied=run(change);assert.notEqual(denied.status,0);
    assert.match(denied.stderr,/P003_CANONICAL_RESOURCE_LOCAL_ONLY/u);
  }
});
