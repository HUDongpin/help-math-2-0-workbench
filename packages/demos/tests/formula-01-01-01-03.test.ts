import assert from 'node:assert/strict';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import cup from '../src/modules/conversion-1-1';
import quartGallon from '../src/modules/conversion-1-3';

function render(
  module: typeof cup,
  frame: number,
  lang: 'en' | 'es',
) {
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

test('Conversion_1_1 module exposes the native movie and deterministic frame', () => {
  assert.equal(cup.key, 'conversion-1-1');
  assert.deepEqual(cup.movie.stage, {width: 780, height: 379});
  assert.equal(cup.movie.fps, 12);
  assert.equal(cup.movie.frameCount, 94);
  assert.deepEqual(cup.audioCues, []);
  assert.deepEqual(cup.audioTracks?.map(({language, activation, visibleWhen}) => ({language, activation, visibleWhen})), [
    {language: 'en', activation: 'user', visibleWhen: ['en', 'es']},
    {language: 'es', activation: 'user', visibleWhen: ['es']},
  ]);
  assert.equal(cup.maturity, 'legacy-prototype');

  const terminal = render(cup, 94, 'en');
  assert.match(terminal, /data-flash-frame="94"/);
  assert.match(terminal, /1 cup = 8 fluid ounces/);
  assert.match(terminal, /role="button"/);
  assert.match(terminal, /aria-label="Replay animation"/);
  assert.doesNotMatch(terminal, /\.swf|ruffle/i);
});

test('Conversion_1_1 Spanish context adds Mc_SD while retaining English', () => {
  const english = render(cup, 94, 'en');
  const spanish = render(cup, 94, 'es');
  assert.match(english, /1 cup = 8 fluid ounces/);
  assert.doesNotMatch(english, /1 taza = 8 onzas líquidas/);
  assert.match(spanish, /1 cup = 8 fluid ounces/);
  assert.match(spanish, /1 taza = 8 onzas líquidas/);
  assert.match(spanish, /aria-label="Repetir animación"/);
});

test('Conversion_1_3 module exposes the native movie and deterministic frame', () => {
  assert.equal(quartGallon.key, 'conversion-1-3');
  assert.deepEqual(quartGallon.movie.stage, {width: 780, height: 379});
  assert.equal(quartGallon.movie.fps, 12);
  assert.equal(quartGallon.movie.frameCount, 170);
  assert.deepEqual(quartGallon.audioCues, []);
  assert.deepEqual(quartGallon.audioTracks?.map(({language, activation}) => ({language, activation})), [
    {language: 'en', activation: 'user'},
    {language: 'es', activation: 'user'},
  ]);
  assert.equal(quartGallon.maturity, 'legacy-prototype');

  const terminal = render(quartGallon as typeof cup, 170, 'en');
  assert.match(terminal, /data-flash-frame="170"/);
  assert.match(terminal, /1 gallon = 4 quarts/);
  assert.match(terminal, /Gallon scale from one to four quarts/);
  assert.match(terminal, /aria-label="Replay animation"/);
  assert.doesNotMatch(terminal, /\.swf|ruffle/i);
});

test('Conversion_1_3 Spanish context adds Mc_SD while retaining English', () => {
  const english = render(quartGallon as typeof cup, 170, 'en');
  const spanish = render(quartGallon as typeof cup, 170, 'es');
  assert.match(english, /1 gallon = 4 quarts/);
  assert.doesNotMatch(english, /1 galón =  4 cuartos/);
  assert.match(spanish, /1 gallon = 4 quarts/);
  assert.match(spanish, /1 galón =  4 cuartos/);
  assert.match(spanish, /aria-label="Repetir animación"/);
});
