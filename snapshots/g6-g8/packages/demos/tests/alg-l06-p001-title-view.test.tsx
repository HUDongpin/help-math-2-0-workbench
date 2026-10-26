import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {P001TitleView} from '../src/alg-l06-p001-title-view';
import {sourceTitleState} from '../src/alg-l06-p001-title-state';

const assets = ['/private-p001/140.svg', '/private-p001/141.svg'] as const;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('P001 private glyph assets remain pinned source exports without active or external content', () => {
  for (const [id, expected] of [
    ['140', 'baf7a50b1bd9ac810f5bc60659dff72186c5d574722acb2ccc02fe2ceb589ada'],
    ['141', '9a6b736402da2164a2ce59b4592c9db06a0473c777622c612375777888da4e1c'],
  ] as const) {
    const svg = readFileSync(path.join(projectRoot, `migrations/shared-alg001-l06-p001/assets/title-svg/${id}.svg`));
    assert.equal(createHash('sha256').update(svg).digest('hex'), expected);
    const text = svg.toString('utf8');
    assert.match(text, /<svg\b/);
    assert.doesNotMatch(text, /<script\b|<foreignObject\b|<image\b/i);
    assert.doesNotMatch(text, /(?:href|src)="(?!#)[^"]+"/i);
  }
});

test('P001 SVG candidate renders only the two source-reachable title layers', () => {
  for (const frame of [1, 66, 132, 133, 134]) {
    const state = sourceTitleState(frame);
    const html = renderToStaticMarkup(<P001TitleView frame={frame} uiLanguage="en" textAssetHrefs={assets}/>);
    assert.match(html, /viewBox="0 0 800 600"/);
    assert.match(html, /fill="#b8d8f7"/);
    assert.match(html, /data-current-javascript-registered="false"/);
    assert.match(html, new RegExp(`data-flash-frame="${frame}"`));
    assert.equal([...html.matchAll(/<image\b/g)].length, 2);
    for (const [index, layer] of state.layers.entries()) {
      assert.ok(html.includes(`href="${assets[index]}"`));
      assert.ok(html.includes(`data-flash-character-id="${layer.characterId}"`));
      assert.ok(html.includes(`opacity="${layer.alpha256 / 256}"`));
      assert.ok(html.includes(`translate(${(state.rootXTwips + layer.xTwips) / 20} ${(state.rootYTwips + layer.yTwips) / 20}) scale(${layer.scaleX} ${layer.scaleY})`));
    }
    assert.doesNotMatch(html, /<button\b|<audio\b|hurricane/i);
  }
});

test('P001 candidate labels source English text in both preview languages without claiming Spanish content', () => {
  const es = renderToStaticMarkup(<P001TitleView frame={133} uiLanguage="es" textAssetHrefs={assets}/>);
  assert.match(es, /Título original: Understanding Functions: Introduction/);
  assert.match(es, /Fotograma 133 de 134/);
  assert.throws(() => renderToStaticMarkup(<P001TitleView frame={135} uiLanguage="en" textAssetHrefs={assets}/>), RangeError);
  assert.throws(() => renderToStaticMarkup(<P001TitleView frame={133} uiLanguage="en"
    textAssetHrefs={['https://example.com/140.svg', assets[1]]}/>), RangeError);
  assert.match(renderToStaticMarkup(<P001TitleView frame={133} uiLanguage="en"
    textAssetHrefs={['data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', assets[1]]}/>),
    /data:image\/svg\+xml;base64,PHN2Zz48L3N2Zz4=/);
  assert.throws(() => renderToStaticMarkup(<P001TitleView frame={133} uiLanguage="en"
    textAssetHrefs={['data:image/svg+xml;base64,%%', assets[1]]}/>), RangeError);
});
