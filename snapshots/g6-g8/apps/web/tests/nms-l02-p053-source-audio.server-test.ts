import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {pathToFileURL} from 'node:url';

const projectRoot=path.resolve(import.meta.dirname,'../../..');
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

function readSource(cwd=projectRoot,nodeEnv:'test'|'development'|'production'='test',vercel=''){
  const moduleUrl=pathToFileURL(path.join(projectRoot,
    'apps/web/lib/nms-l02-p053-source-audio.server.ts')).href;
  const code=`import {readP053SourceAudio} from '${moduleUrl}';
    const bytes=readP053SourceAudio();console.log(bytes.length);`;
  return spawnSync(process.execPath,['--conditions=react-server','--import','tsx',
    '--input-type=module','-e',code],{cwd,encoding:'utf8',maxBuffer:1024*1024,
    env:{...process.env,NODE_ENV:nodeEnv,VERCEL:vercel,VERCEL_ENV:'',
      HELP_MATH_G678_SOURCE_ROOT:sourceRoot}});
}

test('P053 server reader verifies real source SWF, audit, all raw-index bytes and full MP3',()=>{
  const result=readSource();
  assert.equal(result.status,0,result.stderr||result.stdout);
  assert.equal(result.stdout.trim(),'256230');
  const webCwd=readSource(path.join(projectRoot,'apps/web'));
  assert.equal(webCwd.status,0,webCwd.stderr||webCwd.stdout);
  assert.equal(webCwd.stdout.trim(),'256230');
  const audit=JSON.parse(readFileSync(path.join(projectRoot,
    'migrations/shared-nms002-l02-p053/audit/source-stream-product-v1.json'),'utf8'));
  assert.equal(audit.externalFiles.mp3.sha256,
    '225177c9c27670c636ce383e0ec58e439888b14afa33427a53c14ff1ca7a4e7d');
  assert.equal(audit.externalFiles.rawIndex.sha256,
    '71b102949ed66206315863a290691f1f4db1b2331ce3d0283ea90684b0ff8fa8');
});

test('P053 server reader denies production before reading any source resource',()=>{
  const result=readSource(projectRoot,'production');
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/P053_SOURCE_AUDIO_LOCAL_ONLY/u);
  const route=readFileSync(path.join(projectRoot,
    'apps/web/app/flash-assets/g678-local/shared-nms002-l02-p053/source-audio/route.ts'),'utf8');
  assert.match(route,/NODE_ENV==='production'\?Promise\.resolve\(null\)/u);
  assert.match(route,/method==='HEAD'\?null/u);
  assert.match(route,/no-store/u);
});

test('P053 server reader denies a Vercel runtime even with local-looking source variables',()=>{
  const result=readSource(projectRoot,'development','1');
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/P053_SOURCE_AUDIO_LOCAL_ONLY/u);
});
