import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL(
  '../components/loaded-swf-host-canvas.tsx',
  import.meta.url,
);

test('loaded-SWF host canvas stays local, hash-bound, and fail-closed', async () => {
  const source = await readFile(componentUrl, 'utf8');

  assert.match(source, /asset\.assetSource\.startsWith\('\/flash-assets\/'\)/);
  assert.match(source, /!\s*asset\.assetSource\.includes\('\.\.'\)/);
  assert.match(source, /\/\^\[a-f0-9\]\{64\}\$\/\.test\(asset\.assetSha256\)/);
  assert.match(source, /asset\.sourceProvenLanguage === 'en'/);
  assert.match(source, /asset\.sourceProvenLanguage === 'es'/);
  assert.match(source, /script\.integrity = integrity/);
  assert.match(source, /script\.crossOrigin = 'anonymous'/);
  assert.match(source, /script\.dataset\.helpMathLoadedSwfHost/);
  assert.match(source, /script\.dataset\.helpMathCanvasSha256/);
  assert.match(source, /script\.src = source/);
  assert.match(source, /document\.head\.appendChild\(script\)/);
  assert.ok(
    source.indexOf('script.integrity = integrity') <
      source.indexOf('document.head.appendChild(script)'),
    'SRI must be assigned before the local script is inserted',
  );
  assert.match(source, /loaded-SWF host asset returned a mismatched identity/);
  assert.match(source, /rendered\.audioRendered === false/);
  assert.match(source, /data-candidate-status="source-static-host-composite-not-strict"/);
  assert.match(source, /data-original-runtime-accepted="false"/);
  assert.match(source, /data-owner-accepted="false"/);
  assert.match(source, /data-strict-migration-complete="false"/);
  assert.match(source, /The local loaded-SWF host drawing failed safely\./);
});
