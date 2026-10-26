import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import LAYOUT from '../src/generated/dat001-l02-p002-visual-layout-v1.json';
import {DatL02P002CandidateRenderer} from '../src/dat-l02-p002-candidate-renderer-v1';

const assetHrefs: Record<string, string> = {};
const maskPaths: Record<string, {d: string; clipRule: 'nonzero'}> = {};
for (const symbol of LAYOUT.symbols) {
  const assets = symbol.kind === 'morph' ? symbol.states : [symbol];
  for (const asset of assets) {
    assetHrefs[asset.path] =
      `/flash-assets/g678-local/shared-dat001-l02-p002/symbol/${asset.sha256}`;
    if ([1, 103, 106, 107, 109, 111].includes(symbol.characterId)) {
      maskPaths[asset.path] = {d: 'M0 0H100V100Z', clipRule: 'nonzero'};
    }
  }
}
const render = (frame: number, lang: 'en' | 'es' = 'en', nativeTerminalAssignment = false) => renderToStaticMarkup(
  createElement(DatL02P002CandidateRenderer, {
    context: {frame, frameDomain: 'sprite-113', scenario: 'default', lang, seed: 0, replay: 0},
    assetHrefs, maskPaths, nativeTerminalAssignment,
  }));

test('candidate paints nested source frames with geometric clips, but no lesson controls', () => {
  for (const frame of [1, 42, 43, 60, 126, 144, 209, 242, 276]) {
    const html = render(frame);
    assert.match(html, /data-candidate-visual-only="true"/);
    assert.match(html, /viewBox="0 0 800 600"/);
    assert.match(html, new RegExp(`data-flash-frame="${frame}"`));
    assert.match(html, /data-flash-frame-domain="sprite-113"/);
    assert.match(html, /<clipPath/);
    assert.match(html, /clip-path="url\(#datp002-/);
    assert.match(html, /pointer-events="none"/);
    assert.doesNotMatch(html, /<button|role="button"|tabIndex=/);
  }
  assert.match(render(126), /data-source-instance-path="root\/1\/397"/);
  assert.match(render(276, 'es'), /data-flash-language="es"/);
  assert.match(render(276, 'es'), /aria-label="Reconstrucción visual no aceptada; texto original en inglés"/);
});

test('candidate fails closed on a missing source image or morph-mask silhouette', () => {
  const context = {frame: 126, frameDomain: 'sprite-113', scenario: 'default',
    lang: 'en' as const, seed: 0};
  assert.throws(() => renderToStaticMarkup(createElement(DatL02P002CandidateRenderer, {
    context, assetHrefs: {}, maskPaths,
  })), /DAT_L02_P002_MISSING_CANDIDATE_ASSET/);
  assert.throws(() => renderToStaticMarkup(createElement(DatL02P002CandidateRenderer, {
    context, assetHrefs, maskPaths: {},
  })), /DAT_L02_P002_UNBOUND_MASK_PATH/);
});

test('terminal native assignment removes the exact source card, title, and four glyph layers', () => {
  const original = render(276);
  const native = render(276, 'en', true);
  for (const id of [102, 105, 108, 110, 112, 114, 115]) {
    assert.match(original, new RegExp(`data-source-character-id="${id}"`));
    assert.doesNotMatch(native, new RegExp(`data-source-character-id="${id}"`));
  }
  assert.match(native, /data-native-terminal-assignment="candidate"/);
  assert.match(native, /data-source-character-id="117"/);
  assert.match(render(275), /data-source-character-id="105"/);
  assert.throws(() => render(275, 'en', true),
    /DAT_L02_P002_NATIVE_ASSIGNMENT_ONLY_AT_TERMINAL_FRAME/);
});
