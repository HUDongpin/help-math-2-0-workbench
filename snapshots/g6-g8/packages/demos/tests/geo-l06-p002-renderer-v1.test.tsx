import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const built = await build({entryPoints: [fileURLToPath(new URL(
  '../src/geo-l06-p002-renderer-v1.tsx', import.meta.url))], bundle: true,
  write: false, platform: 'node', format: 'cjs', packages: 'external',
  loader: {'.css': 'empty'}});
const moduleObject: {exports: {GeoL06P002Renderer?: typeof import(
  '../src/geo-l06-p002-renderer-v1')['GeoL06P002Renderer']}} = {exports: {}};
new Function('require', 'module', 'exports', built.outputFiles[0]!.text)(
  createRequire(import.meta.url), moduleObject, moduleObject.exports);
const GeoL06P002Renderer = moduleObject.exports.GeoL06P002Renderer!;

const render = (frame: number, uiLanguage: 'en' | 'es' = 'en') =>
  renderToStaticMarkup(<GeoL06P002Renderer frame={frame} frameDomain="sprite-230"
    scenario="default" lang="en" uiLanguage={uiLanguage} seed={0} replay={0}/>);

test('candidate uses a source-domain React renderer without claiming asset or fidelity acceptance', () => {
  const html = render(1);
  assert.match(html, /data-flash-frame="1"/);
  assert.match(html, /data-flash-frame-domain="sprite-230"/);
  assert.match(html, /data-source-mask-mode="binary-fill"/);
  assert.match(html, /data-source-graphics-status="loading"/);
  assert.match(html, /data-source-fidelity="not-accepted"/);
  assert.match(html, /Loading source scene/);
  assert.doesNotMatch(html, /Area is the amount/);
});

test('source teaching and glossary controls appear only on their frames', () => {
  assert.match(render(983), /data-source-key="Area">Area<\/span><span> is the amount of/);
  assert.doesNotMatch(render(986), /<button[^>]+data-source-key="Figure"/);
  const glossary = render(987);
  assert.match(glossary, /<button[^>]+data-source-key="Figure"/);
  assert.match(glossary, /<button[^>]+data-source-key="Surface"/);
  assert.match(glossary, /disabled=""/);
  assert.match(render(1126), /radius/);
  assert.match(render(983, 'es'), /El texto original de esta animación está en inglés/);
});

test('root domain remains structurally visible without inventing host-driven child frames', () => {
  const root = renderToStaticMarkup(<GeoL06P002Renderer frame={6} frameDomain="root"
    scenario="default" lang="en" uiLanguage="es" seed={0} replay={1}/>);
  assert.match(root, /data-flash-frame-domain="root"/);
  assert.match(root, /data-flash-root-frame="6"/);
  assert.match(root, /data-source-host-trace="unverified"/);
  assert.match(root, /El avance del anfitrión original/);
  assert.doesNotMatch(root, /data-source-depth=/);
  assert.doesNotMatch(root, /source-stream\.mp3/);
});
