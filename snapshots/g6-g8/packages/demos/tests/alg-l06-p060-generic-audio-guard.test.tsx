import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import animationModule from '../src/modules/shared-alg001-l06-v2-p060';

const Renderer = animationModule.Renderer!;

test('the generic quiz cannot silently discard a request for scoped audio', () => {
  const html = renderToStaticMarkup(<Renderer frame={1} scenario="source-quiz" lang="en" seed={0} audioEnabled={true}/>);
  assert.match(html, /role="alert"/u);
  assert.match(html, /The quiz is unavailable in this view\./u);
  assert.doesNotMatch(html, /Loading quiz/u);
});

test('an explicitly silent generic preview remains available', () => {
  const html = renderToStaticMarkup(<Renderer frame={1} scenario="source-quiz" lang="en" seed={0} audioEnabled={false}/>);
  assert.match(html, /Loading quiz/u);
  assert.doesNotMatch(html, /role="alert"/u);
});
