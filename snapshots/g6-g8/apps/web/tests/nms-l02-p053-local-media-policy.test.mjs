import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
function mediaPolicies(mode, optIn) {
  const code = `import config from './apps/web/next.config.ts';
    config.headers().then(entries => console.log(JSON.stringify(entries.filter(entry =>
      entry.source.includes('shared-nms002-l02-p053')).map(entry => ({
        source: entry.source,
        csp: entry.headers.find(header => header.key === 'Content-Security-Policy')?.value,
      })))));`;
  return JSON.parse(execFileSync(path.join(root, 'node_modules/.bin/tsx'), ['-e', code], {
    cwd: root, encoding: 'utf8', env: {...process.env, NODE_ENV: mode,
      VERCEL_ENV: '', HELP_MATH_G678_LOCAL_PREVIEW: optIn ? '1' : '0',
      HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'},
  }).trim());
}

test('only opted-in local P053 pages allow Blob media; production keeps ordinary CSP', () => {
  const local = mediaPolicies('development', true);
  assert.deepEqual(local.map(item => item.source), [
    '/en/migration-status/g678-calibration/shared-nms002-l02-p053',
    '/es/migration-status/g678-calibration/shared-nms002-l02-p053',
  ]);
  for (const item of local) assert.match(item.csp, /(?:^|; )media-src 'self' blob:/u);
  assert.deepEqual(mediaPolicies('development', false), []);
  assert.deepEqual(mediaPolicies('production', true), []);
});


test('game resource rewrites require exact local P053 referer and disappear in production',()=>{
 const get=(mode,optIn)=>JSON.parse(execFileSync(path.join(root,'node_modules/.bin/tsx'),['-e',
  "import config from './apps/web/next.config.ts';config.rewrites().then(x=>console.log(JSON.stringify(x)));"],
  {cwd:root,encoding:'utf8',env:{...process.env,NODE_ENV:mode,VERCEL_ENV:'',
   HELP_MATH_G678_LOCAL_PREVIEW:optIn?'1':'0',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'}}).trim());
 const local=get('development',true);
 assert.equal(local.beforeFiles.length,2);assert.deepEqual(local.afterFiles,[]);assert.deepEqual(local.fallback,[]);
 for(const rule of local.beforeFiles){
  assert(rule.source.startsWith('/flash-assets/g678-local/shared-nms002-l02-p054/'));
  assert(rule.destination.startsWith('/flash-assets/g678-local/shared-nms002-l02-p053/game/'));
  assert.equal(rule.has.length,1);assert.equal(rule.has[0].key,'referer');
  const exact=new RegExp(`^(?:${rule.has[0].value})$`);
  const ref='http://127.0.0.1:3331/en/migration-status/g678-calibration/shared-nms002-l02-p053';
  assert(exact.test(ref));assert(exact.test(ref.replace('/en/','/es/')));
  for(const invalid of [ref+'?level=2',ref+'#x',ref.replace('127.0.0.1','example.com'),ref.replace('p053','p054')])assert(!exact.test(invalid));
 }
 for(const [mode,optIn] of [['production',true],['development',false]])assert.deepEqual(get(mode,optIn),{beforeFiles:[],afterFiles:[],fallback:[]});
});
