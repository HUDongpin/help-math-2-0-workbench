import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {isP054RevealRequest} from '../lib/nms-l02-p054-reveal-access.ts';
import {isP054FeedbackAudioRequest} from '../lib/nms-l02-p054-feedback-audio-access.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const specifier = '@helpmath/demos/nms-l02-p054-local-candidate';
const source = path.join(root, 'packages/demos/src/nms-l02-p054-board-candidate.tsx');
const stub = path.join(root, 'apps/web/lib/g678-p054-candidate.production-stub.tsx');

function resolve(mode, optIn) {
  const code = `import config from './apps/web/next.config.ts';
    const plugins = [];
    class Replacement {constructor(pattern, replacement) {
      plugins.push({specifier: pattern.test('${specifier}'), source: pattern.test('${source}'), replacement});
    }}
    const result = config.webpack({plugins, resolve: {}},
      {dev: process.env.NODE_ENV !== 'production', isServer: false,
        webpack: {NormalModuleReplacementPlugin: Replacement}});
    console.log(JSON.stringify({webpack: result.resolve.alias['${specifier}'],
      turbopack: config.turbopack.resolveAlias['${specifier}'], plugins}));`;
  return JSON.parse(execFileSync(path.join(root, 'node_modules/.bin/tsx'), ['-e', code], {
    cwd: root, encoding: 'utf8', env: {...process.env, NODE_ENV: mode,
      VERCEL_ENV: '', HELP_MATH_G678_LOCAL_PREVIEW: optIn ? '1' : '0',
      HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'},
  }).trim());
}

function mediaPolicies(mode, optIn) {
  const code = `import config from './apps/web/next.config.ts';
    config.headers().then(entries => console.log(JSON.stringify(entries.filter(entry =>
      entry.source.includes('shared-nms002-l02-p054')).map(entry => ({
        source: entry.source,
        csp: entry.headers.find(header => header.key === 'Content-Security-Policy')?.value,
      })))));`;
  return JSON.parse(execFileSync(path.join(root, 'node_modules/.bin/tsx'), ['-e', code], {
    cwd: root, encoding: 'utf8', env: {...process.env, NODE_ENV: mode,
      VERCEL_ENV: '', HELP_MATH_G678_LOCAL_PREVIEW: optIn ? '1' : '0',
      HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'},
  }).trim());
}

test('only opted-in local P054 pages allow Blob media; production keeps ordinary CSP', () => {
  const local = mediaPolicies('development', true);
  assert.deepEqual(local.map(item => item.source), [
    '/en/migration-status/g678-calibration/shared-nms002-l02-p054',
    '/es/migration-status/g678-calibration/shared-nms002-l02-p054',
  ]);
  for (const item of local) assert.match(item.csp, /(?:^|; )media-src 'self' blob:/u);
  assert.deepEqual(mediaPolicies('development', false), []);
  assert.deepEqual(mediaPolicies('production', true), []);
});

test('P054 source loads only in opted-in local development; production replaces its resolved path', () => {
  const development = resolve('development', true);
  assert.equal(development.webpack, source);
  assert.equal(development.turbopack, source);
  for (const [mode, optIn] of [['development', false], ['production', true]]) {
    const result = resolve(mode, optIn);
    assert.equal(result.webpack, stub);
    assert.equal(result.turbopack, stub);
    if (mode === 'production') assert.ok(result.plugins.some(plugin => plugin.specifier
      && plugin.source && plugin.replacement === stub));
  }
  const stubText = readFileSync(stub, 'utf8');
  assert.match(stubText, /return null;/);
  assert.doesNotMatch(stubText, /generated\/nms-l02-p054-cards/);
});

test('P054 local route is noindex and rejects production, non-loopback, and unexpected query', () => {
  const page = readFileSync(path.join(root,
    'apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l02-p054/page.tsx'), 'utf8');
  assert.ok(page.includes("import('@/lib/nms-l02-p054-product-host.production-stub')"));
  assert.ok(page.includes("import('@/lib/nms-l02-p054-product-candidate.server')"));
  assert.ok(page.includes('unregistered-product-candidate'));
  assert.ok(page.includes("process.env.NODE_ENV === 'production'"));
  assert.ok(page.includes('isG678LocalPreviewRequestHeaders(await headers())'));
  assert.ok(page.includes("Object.keys(query).some(key => key !== 'level')"));
  assert.ok(page.includes('index: false, follow: false, noarchive: true'));
});

test('P054 image tiles require the exact local page, browser image context, and source gate', () => {
  const url = new URL('http://127.0.0.1:3231/flash-assets/g678-local/shared-nms002-l02-p054/reveal/2/12');
  const headers = new Headers({host: '127.0.0.1:3231', 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'image',
    referer: 'http://127.0.0.1:3231/es/migration-status/g678-calibration/shared-nms002-l02-p054?level=2'});
  const env = {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: '1',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'};
  const allowed = (candidateUrl = url, candidateHeaders = headers, candidateEnv = env) =>
    isP054RevealRequest({method: 'GET', url: candidateUrl, headers: candidateHeaders}, '2', '12', candidateEnv);
  assert.equal(allowed(), true);
  assert.equal(allowed(new URL(url.href.replace('127.0.0.1', 'localhost'))), true,
    'Next loopback normalization must retain the real Host and port binding');
  assert.equal(allowed(url, headers, {...env, NODE_ENV: 'production'}), false);
  assert.equal(allowed(new URL('http://example.com' + url.pathname)), false);
  assert.equal(allowed(new URL(url + '?extra=1')), false);
  assert.equal(allowed(url, new Headers({...Object.fromEntries(headers), 'sec-fetch-site': 'cross-site'})), false);
  assert.equal(allowed(url, new Headers({...Object.fromEntries(headers), referer: 'http://127.0.0.1:3231/privacy'})), false);
  assert.equal(allowed(url, new Headers({...Object.fromEntries(headers),
    referer: 'http://127.0.0.1:3231/es/migration-status/g678-calibration/shared-nms002-l02-p054?level=1'})), false);
  assert.equal(allowed(url, new Headers({...Object.fromEntries(headers),
    referer: 'http://127.0.0.1:3231/es/migration-status/g678-calibration/shared-nms002-l02-p054?level=2&extra=1'})), false);
  assert.equal(isP054RevealRequest({method: 'GET', url, headers}, '2', '13', env), false);
  const route = readFileSync(path.join(root,
    'apps/web/app/flash-assets/g678-local/shared-nms002-l02-p054/reveal/[level]/[order]/route.ts'), 'utf8');
  assert.match(route, /isP054RevealRequest/u);
  assert.match(route, /readP054RevealTile/u);
  assert.match(route, /no-store/u);
});

test('P054 feedback audio allows only hash-bound same-origin local fetches', () => {
  const audioPath = '/flash-assets/g678-local/shared-nms002-l02-p054/feedback-audio/correct';
  const url = new URL(`http://127.0.0.1:3231${audioPath}?sha256=d34cad2db2f6a6be02a1efffd46ffc169a1b65730cf6f503cbae28fa7aab9fc4`);
  const headers = new Headers({host: '127.0.0.1:3231', 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty',
    referer: 'http://127.0.0.1:3231/es/migration-status/g678-calibration/shared-nms002-l02-p054?level=2'});
  const env = {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: '1',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'};
  const allowed = (candidateUrl = url, candidateHeaders = headers, candidateEnv = env) =>
    isP054FeedbackAudioRequest({method: 'GET', url: candidateUrl,
      headers: candidateHeaders}, 'correct', candidateEnv);
  assert.equal(allowed(), true);
  assert.equal(allowed(new URL(url.href.replace('127.0.0.1', 'localhost'))), true);
  assert.equal(allowed(url, headers, {...env, NODE_ENV: 'production'}), false);
  assert.equal(allowed(new URL(url.href.replace('d34cad2d', 'a34cad2d'))), false);
  assert.equal(allowed(new URL(url + '&extra=1')), false);
  assert.equal(allowed(url, new Headers({...Object.fromEntries(headers), range: 'bytes=0-'})), false);
  assert.equal(allowed(url, new Headers({...Object.fromEntries(headers), 'sec-fetch-dest': 'audio'})), false);
  assert.equal(allowed(url, new Headers({...Object.fromEntries(headers), referer: 'http://127.0.0.1:3231/privacy'})), false);
  assert.equal(isP054FeedbackAudioRequest({method: 'GET', url, headers}, 'result', env), false);
  const route = readFileSync(path.join(root,
    'apps/web/app/flash-assets/g678-local/shared-nms002-l02-p054/feedback-audio/[kind]/route.ts'), 'utf8');
  assert.match(route, /readP054FeedbackAudio/u);
  assert.match(route, /no-store/u);
});
