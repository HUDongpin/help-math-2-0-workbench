import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const tsx = path.join(root, 'node_modules/.bin/tsx');
const specifier = '@helpmath/demos/alg-l06-p001-local-candidate';
const source = path.join(root, 'packages/demos/src/alg-l06-p001-title-view.tsx');
const stub = path.join(root, 'apps/web/lib/g678-alg-l06-p001.production-stub.tsx');
const sourceRoot = '/Volumes/Life /HELP MATH Related Files/AWS Grade-Classified Courseware';

function run(code, env = {}) {
  return execFileSync(tsx, ['-e', code], {cwd: root, encoding: 'utf8', env: {
    ...process.env, VERCEL_ENV: '', NODE_ENV: 'development',
    HELP_MATH_G678_LOCAL_PREVIEW: '1', HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
    HELP_MATH_G678_SOURCE_ROOT: sourceRoot, ...env,
  }}).trim();
}

test('P001 local preview resolves only when explicitly opted in; production replaces source', () => {
  const code = `import config from './apps/web/next.config.ts';
    const plugins=[];
    class Replacement {constructor(pattern,replacement){plugins.push({specifier:pattern.test('${specifier}'),
      source:pattern.test('${source}'),replacement});}}
    const resolved=config.webpack({plugins,resolve:{}},{dev:process.env.NODE_ENV!=='production',
      isServer:false,webpack:{NormalModuleReplacementPlugin:Replacement}});
    console.log(JSON.stringify({webpack:resolved.resolve.alias['${specifier}'],
      turbopack:config.turbopack.resolveAlias['${specifier}'],plugins}));`;
  const local = JSON.parse(run(code));
  assert.equal(local.webpack, source);
  assert.equal(local.turbopack, source);
  const off = JSON.parse(run(code, {HELP_MATH_G678_LOCAL_PREVIEW: '0'}));
  assert.equal(off.webpack, stub);
  assert.equal(off.turbopack, stub);
  const production = JSON.parse(run(code, {NODE_ENV: 'production'}));
  assert.equal(production.webpack, stub);
  assert.equal(production.turbopack, stub);
  assert.ok(production.plugins.some(plugin => plugin.specifier && plugin.source && plugin.replacement === stub));
  const page = readFileSync(path.join(root,
    'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l06-p001/page.tsx'), 'utf8');
  assert.ok(page.includes(`from '${specifier}'`));
  assert.ok(page.includes("process.env.NODE_ENV === 'production'"));
  assert.ok(readFileSync(stub, 'utf8').includes('return null;'));
  const tsconfig = JSON.parse(readFileSync(path.join(root, 'apps/web/tsconfig.json'), 'utf8'));
  assert.deepEqual(tsconfig.compilerOptions.paths[specifier],
    ['../../packages/demos/src/alg-l06-p001-title-view.tsx']);
  assert.equal(run("import config from './apps/web/next.config.ts'; console.log(config.distDir);",
    {HELP_MATH_ALG_P001_LOCAL_QA: '1', VERCEL_ENV: undefined}), '.next-alg-p001-local-qa');
  assert.equal(run("import config from './apps/web/next.config.ts'; console.log(config.distDir);",
    {HELP_MATH_ALG_P001_LOCAL_QA: '1', NODE_ENV: 'production', VERCEL_ENV: undefined}), '.next');
  assert.equal(run("import config from './apps/web/next.config.ts'; console.log(config.distDir);",
    {HELP_MATH_ALG_P001_PRODUCTION_SCAN: '1', NODE_ENV: 'production', VERCEL_ENV: undefined}),
    '.next-alg-p001-production-scan');
  const excludes = JSON.parse(run("import config from './apps/web/next.config.ts'; console.log(JSON.stringify(config.outputFileTracingExcludes['*']));",
    {NODE_ENV: 'production'}));
  assert.ok(excludes.includes('../../packages/demos/src/alg-l06-p001-title-view.tsx'));
  assert.ok(excludes.includes('../../migrations/shared-alg001-l06-p001/assets/title-svg/*.svg'));
  assert.ok(excludes.includes('../../migrations/shared-alg001-l06-p001/assets/source-stream-142.mp3'));
});

test('P001 audio is exact-byte and default-deny, with no production or cross-origin access', () => {
  const request = `const url='http://127.0.0.1:3233/flash-assets/g678-local/shared-alg001-l06-p001/source-stream.mp3?sha256=b214a1d96c7dadcf509fe1702e3f11694d50c1cfd584978d13ef30d39139633a';
    const headers=new Headers({'host':'127.0.0.1:3233','sec-fetch-site':'same-origin',
      'sec-fetch-mode':'cors','sec-fetch-dest':'empty',
      'referer':'http://127.0.0.1:3233/en/migration-status/g678-calibration/shared-alg001-l06-p001?play=1'});
    const req=new Request(url,{headers});`;
  const check = `import {isP001AudioRequest} from './apps/web/lib/g678-alg-l06-p001-audio-access.ts';
    ${request}
    console.log(isP001AudioRequest({method:req.method,url:new URL(req.url),headers:req.headers}));`;
  assert.equal(run(check), 'false');
  assert.equal(run(check, {HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE: '1'}), 'true');
  assert.equal(run(check.replace(
    'g678-calibration/shared-alg001-l06-p001?play=1',
    'g678-hfr/shared-alg001-l06-p001/registered?play=1'),
    {HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE: '1'}), 'false');
  assert.equal(run(check.replace(
    'g678-calibration/shared-alg001-l06-p001?play=1',
    'g678-hfr/shared-alg001-l06-p001/candidate?play=1'),
    {HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE: '1'}), 'false');
  assert.equal(run(check.replace("'same-origin'", "'cross-site'"),
    {HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE: '1'}), 'false');
  assert.equal(run(check.replace('b214a1d96c7dadcf509fe1702e3f11694d50c1cfd584978d13ef30d39139633a',
    '0'.repeat(64)), {HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE: '1'}), 'false');
  assert.equal(run(check, {HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE: '1', NODE_ENV: 'production'}), 'false');
  const response = `import {p001AudioResponse} from './apps/web/lib/g678-alg-l06-p001-audio-response.server.ts';
    import {createHash} from 'node:crypto';
    ${request}
    void (async()=>{const result=p001AudioResponse(req); const bytes=new Uint8Array(await result.arrayBuffer());
    console.log(JSON.stringify({status:result.status,contentType:result.headers.get('content-type'),
      robots:result.headers.get('x-robots-tag'),bytes:bytes.length,
      sha256:createHash('sha256').update(bytes).digest('hex')}));})();`;
  const denied = JSON.parse(run(response, {NODE_OPTIONS: '--conditions=react-server'}));
  assert.equal(denied.status, 404);
  assert.equal(denied.bytes, 0);
  const allowed = JSON.parse(run(response, {
    NODE_OPTIONS: '--conditions=react-server', HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE: '1',
  }));
  assert.deepEqual(allowed, {
    status: 200, contentType: 'audio/mpeg', robots: 'noindex, nofollow, noarchive',
    bytes: 55510, sha256: 'b214a1d96c7dadcf509fe1702e3f11694d50c1cfd584978d13ef30d39139633a',
  });
  assert.equal(JSON.parse(run(response, {
    NODE_OPTIONS: '--conditions=react-server', HELP_MATH_G678_ALG_P001_AUDIO_CANDIDATE: '1',
    NODE_ENV: 'production',
  })).status, 404);
});

test('P001 glyph route serves only source-pinned local image/fetch requests', () => {
  const request = `const url='http://127.0.0.1:3233/flash-assets/g678-local/shared-alg001-l06-p001/title-glyph/140';
    const headers=new Headers({'host':'127.0.0.1:3233','sec-fetch-site':'same-origin',
      'sec-fetch-mode':'cors','sec-fetch-dest':'empty',
      'referer':'http://127.0.0.1:3233/es/migration-status/g678-calibration/shared-alg001-l06-p001?frame=133'});
    const req=new Request(url,{headers});`;
  const check = `import {p001GlyphId} from './apps/web/lib/g678-alg-l06-p001-glyph-access.ts';
    ${request}
    console.log(p001GlyphId({method:req.method,url:new URL(req.url),headers:req.headers}));`;
  assert.equal(run(check), '140');
  assert.equal(run(check.replace(
    'g678-calibration/shared-alg001-l06-p001?frame=133',
    'g678-hfr/shared-alg001-l06-p001/registered')), '140');
  assert.equal(run(check.replace(
    'g678-calibration/shared-alg001-l06-p001?frame=133',
    'g678-hfr/shared-alg001-l06-p001/candidate')), '140');
  assert.equal(run(check.replace('title-glyph/140', 'title-glyph/140?x=1')), 'null');
  assert.equal(run(check, {NODE_ENV: 'production'}), 'null');
  assert.equal(run(check.replace("'same-origin'", "'cross-site'")), 'null');
  assert.equal(run(check.replace('shared-alg001-l06-p001?frame=133',
    'shared-alg001-l06-p002?frame=133')), 'null');
  const response = `import {p001GlyphResponse} from './apps/web/lib/g678-alg-l06-p001-glyph-response.server.ts';
    import {createHash} from 'node:crypto';
    ${request}
    void (async()=>{const result=p001GlyphResponse(req); const bytes=new Uint8Array(await result.arrayBuffer());
    console.log(JSON.stringify({status:result.status,type:result.headers.get('content-type'),
      bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}));})();`;
  assert.deepEqual(JSON.parse(run(response, {NODE_OPTIONS: '--conditions=react-server'})), {
    status: 200, type: 'image/svg+xml; charset=utf-8', bytes: 12653,
    sha256: 'baf7a50b1bd9ac810f5bc60659dff72186c5d574722acb2ccc02fe2ceb589ada',
  });
  assert.deepEqual(JSON.parse(run(response.replace(
    'g678-calibration/shared-alg001-l06-p001?frame=133',
    'g678-hfr/shared-alg001-l06-p001/registered'),
    {NODE_OPTIONS: '--conditions=react-server'})), {
    status: 200, type: 'image/svg+xml; charset=utf-8', bytes: 12653,
    sha256: 'baf7a50b1bd9ac810f5bc60659dff72186c5d574722acb2ccc02fe2ceb589ada',
  });
  assert.equal(JSON.parse(run(response, {NODE_OPTIONS: '--conditions=react-server',
    NODE_ENV: 'production'})).status, 404);
});

test('P001 local asset loader binds source and glyphs, denying production and disabled preview', () => {
  const code = `import {loadP001LocalGlyphs} from './apps/web/lib/g678-alg-l06-p001-local-assets.server.ts';
    try { const glyphs=loadP001LocalGlyphs(); console.log(JSON.stringify(glyphs.map(x=>
      [x.startsWith('data:image/svg+xml;base64,'),x.length]))); }
    catch { console.log('DENIED'); }`;
  const options = {NODE_OPTIONS: '--conditions=react-server'};
  assert.deepEqual(JSON.parse(run(code, options)), [[true, 16898], [true, 16986]]);
  assert.equal(run(code, {...options, NODE_ENV: 'production'}), 'DENIED');
  assert.equal(run(code, {...options, HELP_MATH_G678_LOCAL_PREVIEW: '0'}), 'DENIED');
  assert.equal(run(code, {...options, HELP_MATH_G678_SOURCE_ROOT: '/tmp'}), 'DENIED');
});
