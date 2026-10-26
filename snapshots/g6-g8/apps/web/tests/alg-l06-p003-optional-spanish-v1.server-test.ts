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
  'apps/web/lib/alg-l06-p003-optional-spanish-v1.server.ts')).href;
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
function call(cwd=root,nodeEnv:'development'|'production'='development',vercel=''){
  const code=`import {readP003OptionalSpanish} from '${server}';
    import {createHash} from 'node:crypto';
    const bytes=readP003OptionalSpanish();
    console.log(JSON.stringify({bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}));`;
  return spawnSync(process.execPath,['--conditions=react-server','--import','tsx',
    '--input-type=module','-e',code],{cwd,encoding:'utf8',maxBuffer:1024*1024,
    env:{...process.env,NODE_ENV:nodeEnv,VERCEL:vercel,VERCEL_ENV:'',
      HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
      HELP_MATH_G678_SOURCE_ROOT:aws}});
}

test('physical source and source-host role audit yield the separate exact SA payload',()=>{
  for(const cwd of [root,path.join(root,'apps/web')]){
    const result=call(cwd);
    assert.equal(result.status,0,result.stderr||result.stdout);
    assert.deepEqual(JSON.parse(result.stdout.trim()),{bytes:135408,
      sha256:'d280e8f5e653c165755baf2f8960cfd667f03205d2f9aaafe1820a15d327f89a'});
  }
  const report=readFileSync(path.join(root,
    'migrations/shared-alg001-l06-p003/audit/sa-host-disposition-v2.json'));
  assert.equal(hash(report),'7a7a4d1e26806569a788d6981593e027b583c84e55cd3d05ff42deae5351f463');
});

test('server denies production and Vercel before reading source bytes',()=>{
  for(const [nodeEnv,vercel] of [['production',''],['development','1']] as const){
    const result=call(root,nodeEnv,vercel);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/P003_OPTIONAL_SA_LOCAL_ONLY/u);
  }
  const route=readFileSync(path.join(root,
    'apps/web/app/flash-assets/g678-local/shared-alg001-l06-p003/optional-spanish-audio-v1/route.ts'),'utf8');
  assert.match(route,/NODE_ENV==='production'\?Promise\.resolve\(null\)/u);
  assert.match(route,/method==='HEAD'\?null/u);
  assert.match(route,/private, no-store/u);
  assert.match(route,/noindex/u);
});
