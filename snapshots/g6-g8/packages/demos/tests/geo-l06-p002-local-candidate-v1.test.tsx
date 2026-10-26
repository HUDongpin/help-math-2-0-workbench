import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const built = await build({entryPoints: [fileURLToPath(new URL(
  '../src/geo-l06-p002-local-candidate.tsx', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs',
  packages: 'external', loader: {'.css': 'empty'}});
const moduleObject: {exports: {GeoL06P002LocalCandidate?: typeof import(
  '../src/geo-l06-p002-local-candidate')['GeoL06P002LocalCandidate']}} = {exports: {}};
new Function('require', 'module', 'exports', built.outputFiles[0]!.text)(
  createRequire(import.meta.url), moduleObject, moduleObject.exports);
const Candidate = moduleObject.exports.GeoL06P002LocalCandidate!;

test('local candidate starts at source frame 1 with explicit gate boundary in both locales', () => {
  const en = renderToStaticMarkup(<Candidate locale="en"/>);
  const es = renderToStaticMarkup(<Candidate locale="es"/>);
  assert.match(en, /no Current-JS registration/);
  assert.match(en, /data-flash-frame="1"/);
  assert.match(es, /sin registro Current-JS/);
  assert.match(es, /Fotograma de origen/);
  assert.match(es, /Candidato local GEO001 L6 P002/);
  assert.doesNotMatch(es, /Local engineering candidate only/);
});
