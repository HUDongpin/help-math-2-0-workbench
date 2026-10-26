import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import animationModule from '../src/modules/shared-alg001-l06-context-v4-p060';
import priorModule from '../src/modules/shared-alg001-l06-context-v3-p060';

const Renderer = animationModule.Renderer!;

test('the layout successor preserves the source runtime and state contract', () => {
  for (const key of ['key','movie','runtime','interactiveStops','scenarios','defaultScenarioByFrameDomain','playbackEndFrameByDomain'] as const) {
    assert.deepEqual(animationModule[key], priorModule[key]);
  }
  assert.equal(animationModule.getFrameState, priorModule.getFrameState);
});

test('Spanish UI explicitly names the retained English source content', () => {
  const html = renderToStaticMarkup(<Renderer frame={1} scenario="source-quiz" lang="en" uiLanguage="es" seed={0} audioEnabled={false}/>);
  assert.match(html, /data-p060-native-flow="v1"/u);
  assert.match(html, /lang="es">Texto original en inglés\.<\/p>/u);
  assert.match(html, /Cargando cuestionario/u);
});

test('English UI does not show the Spanish source-language note', () => {
  const html = renderToStaticMarkup(<Renderer frame={1} scenario="source-quiz" lang="en" uiLanguage="en" seed={0} audioEnabled={false}/>);
  assert.match(html, /data-p060-native-flow="v1"/u);
  assert.doesNotMatch(html, /Texto original en inglés/u);
});

test('the existing scoped-audio guard still rejects a loud generic host', () => {
  const html = renderToStaticMarkup(<Renderer frame={1} scenario="source-quiz" lang="en" uiLanguage="es" seed={0} audioEnabled={true}/>);
  assert.match(html, /role="alert"/u);
  assert.doesNotMatch(html, /data-p060-native-flow/u);
});
