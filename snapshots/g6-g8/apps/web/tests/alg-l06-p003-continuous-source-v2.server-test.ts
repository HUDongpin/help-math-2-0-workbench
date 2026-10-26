import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {pathToFileURL} from 'node:url';

const root=path.resolve(import.meta.dirname,'../../..');
const aws='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const server=pathToFileURL(path.join(root,
  'apps/web/lib/alg-l06-p003-continuous-source-v2.server.ts')).href;
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
function call(cwd=root,nodeEnv:'development'|'production'='development',vercel=''){
  const code=`import {readP003ContinuousSource} from '${server}';
    import {createHash} from 'node:crypto';
    const bytes=readP003ContinuousSource();
    console.log(JSON.stringify({bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}));`;
  return spawnSync(process.execPath,['--conditions=react-server','--import','tsx',
    '--input-type=module','-e',code],{cwd,encoding:'utf8',maxBuffer:1024*1024,
    env:{...process.env,NODE_ENV:nodeEnv,VERCEL:vercel,VERCEL_ENV:'',
      HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
      HELP_MATH_G678_SOURCE_ROOT:aws}});
}

test('physical source SWF, v3 audit and external whole MP3 yield the exact payload',()=>{
  for(const cwd of [root,path.join(root,'apps/web')]){
    const result=call(cwd);
    assert.equal(result.status,0,result.stderr||result.stdout);
    assert.deepEqual(JSON.parse(result.stdout.trim()),{bytes:263640,
      sha256:'91ddead67e2e39640b4fe76493f9764959daba8dab40e0ac2036670103285111'});
  }
  const report=readFileSync(path.join(root,
    'output/alg-l06-p003-audio-alignment-20260928/continuous-v3.json'));
  assert.equal(hash(report),'d3b66115dc1aa6bc61e3d375f475052d646f4f52ea50e544fa9eff4be3b273af');
});

test('server denies production and Vercel before reading source bytes',()=>{
  for(const [nodeEnv,vercel] of [['production',''],['development','1']] as const){
    const result=call(root,nodeEnv,vercel);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/P003_CONTINUOUS_SOURCE_LOCAL_ONLY/u);
  }
  const route=readFileSync(path.join(root,
    'apps/web/app/flash-assets/g678-local/shared-alg001-l06-p003/continuous-source-v2/route.ts'),'utf8');
  assert.match(route,/NODE_ENV==='production'\?Promise\.resolve\(null\)/u);
  assert.match(route,/method==='HEAD'\?null/u);
  assert.match(route,/private, no-store/u);
  assert.match(route,/noindex/u);
});
