import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import LAYOUT from '../src/generated/geo001-l07-p003-visual-layout-v1.json';
import {GeoL07P003CandidateRenderer} from '../src/geo-l07-p003-candidate-renderer-v1';

const assetHrefs: Record<string, string> = {};
for (const symbol of LAYOUT.symbols) {
  const path = symbol.kind === 'button' ? symbol.states?.up.path : symbol.path;
  if (path) assetHrefs[path] = 'data:image/svg+xml;base64,PHN2Zy8+';
}
const render = (frame: number, lang: 'en' | 'es' = 'en') => renderToStaticMarkup(
  createElement(GeoL07P003CandidateRenderer, {context: {frame,
    frameDomain: 'sprite-140', scenario: 'default', lang, seed: 0, replay: 0}, assetHrefs}));

test('candidate renders native SVG frame geometry with source masks, never active glossary controls', () => {
  for (const frame of [1, 413, 422, 886, 943, 1168, 1274]) {
    const html = render(frame);
    assert.match(html, /data-candidate-visual-only="true"/);
    assert.match(html, /viewBox="0 0 800 600"/);
    assert.match(html, new RegExp(`data-flash-frame="${frame}"`));
    assert.match(html, /<clipPath/);
    assert.match(html, /clip-path="url\(#p003-/);
    assert.match(html, /pointer-events="none"/);
    assert.doesNotMatch(html, /<button|role="button"|tabIndex=/);
  }
  assert.match(render(422), /data-glossary-key="Measurement"/);
  assert.match(render(1168), /data-glossary-key="Cubic foot"/);
  assert.match(render(1168, 'es'), /data-flash-language="es"/);
});

test('candidate rejects missing source SVG instead of showing a partial page', () => {
  assert.throws(() => renderToStaticMarkup(createElement(GeoL07P003CandidateRenderer, {
    context: {frame: 1, frameDomain: 'sprite-140', scenario: 'default', lang: 'en', seed: 0},
    assetHrefs: {},
  })), /MISSING_CANDIDATE_ASSET/);
});
