import assert from 'node:assert/strict';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import gallon from '../src/modules/conversion-1-2';
import liter from '../src/modules/conversion-1-4';

function render(module: typeof gallon, frame: number, lang: 'en' | 'es') {
  const context = {frame, lang, scenario: 'default', seed: 0} as const;
  return renderToStaticMarkup(createElement(module.Renderer, {
    frame,
    lang,
    scenario: 'default',
    seed: 0,
    state: module.getFrameState(frame, context),
    onReplay() {},
  }));
}

test('Spanish gallon evidence keeps the always-visible English panel and adds Mc_SD', () => {
  const english = render(gallon, 109, 'en');
  const spanish = render(gallon, 109, 'es');
  assert.match(english, /1 gallon = 128 fluid ounces/);
  assert.doesNotMatch(english, /1 galón = 128 onzas líquidas/);
  assert.match(spanish, /1 gallon = 128 fluid ounces/);
  assert.match(spanish, /1 galón = 128 onzas líquidas/);
});

test('Spanish liter evidence keeps the always-visible English panel and adds Mc_SD', () => {
  const english = render(liter as typeof gallon, 67, 'en');
  const spanish = render(liter as typeof gallon, 67, 'es');
  assert.match(english, /1 liter = 1000 milliliters/);
  assert.doesNotMatch(english, /1 litro = 1000 mililitros/);
  assert.match(spanish, /1 liter = 1000 milliliters/);
  assert.match(spanish, /1 litro = 1000 mililitros/);
});
