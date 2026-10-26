import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {geoL06P002MainState} from '../src/geo-l06-p002-display-state-v1';
import {geoL06P002TeachingState} from '../src/geo-l06-p002-teaching-state-v1';
import {GeoL06P002TeachingText} from '../src/geo-l06-p002-teaching-text-v1';

const markup = (frame: number, lang: 'en' | 'es' = 'en') => {
  const state = geoL06P002TeachingState(geoL06P002MainState(frame, {
    frame, frameDomain: 'sprite-230', scenario: 'default', lang, seed: 0,
  }));
  return renderToStaticMarkup(<GeoL06P002TeachingText state={state}/>);
};

test('native text is absent before source placement and preserves exact sentence thereafter', () => {
  assert.doesNotMatch(markup(981), /Area is the amount/);
  assert.doesNotMatch(markup(982), /Area<\/span>/);
  const html = markup(983);
  assert.match(html, /lang="en"/);
  assert.match(html, /data-source-text-ids="209"/);
  assert.match(html, /style="opacity:0.25"/);
  assert.match(html, /Area<\/span><span> is the amount of <\/span>/);
  assert.match(html, /two-dimensional<\/span><span> <\/span><span/);
  assert.doesNotMatch(html, /data-source-highlighted/);
});

test('source emphasis and radius/diameter remain semantic text, not raster labels', () => {
  assert.match(markup(989), /data-source-key="Area" data-source-highlighted="true"/);
  assert.match(markup(1007), /data-source-key="Surface" data-source-highlighted="true"/);
  assert.match(markup(1018), /data-source-key="Two dimensional" data-source-highlighted="true"/);
  assert.match(markup(1029), /data-source-key="Figure" data-source-highlighted="true"/);
  assert.doesNotMatch(markup(1124), /radius<\/span>/);
  assert.doesNotMatch(markup(1125), /radius<\/span>/);
  assert.match(markup(1132), /geo-l06-p002-teaching-text__highlight">radius<\/span>/);
  assert.match(markup(1166), /geo-l06-p002-teaching-text__highlight">diameter<\/span>/);
});

test('ES host discloses English source fallback without claiming Spanish source sentence', () => {
  const html = markup(1132, 'es');
  assert.match(html, /aria-label="Texto de la lección"/);
  assert.match(html, /lang="es">El texto original/);
  assert.match(html, /lang="en" style="opacity:1"><span/);
});
