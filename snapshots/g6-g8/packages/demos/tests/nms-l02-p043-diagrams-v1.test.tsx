import * as React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { P043Diagram, type P043Picture } from '../src/nms-l02-p043-diagrams-v1';
test('source mathematical counts and equivalent representations are retained', () => {
  const percent = renderToStaticMarkup(<P043Diagram picture="percent" />);
  assert.equal((percent.match(/data-cell=/g) ?? []).length, 100);
  assert.equal((percent.match(/data-shaded="true"/g) ?? []).length, 75);
  const fraction = renderToStaticMarkup(<P043Diagram picture="fraction" />);
  assert.equal((fraction.match(/data-part=/g) ?? []).length, 3);
  assert.equal((fraction.match(/data-shaded="true"/g) ?? []).length, 1);
  assert.equal((fraction.match(/data-pencil=/g) ?? []).length, 6);
  assert.ok(fraction.includes('data-selected-pencil-count="2"'));
  const equivalent = renderToStaticMarkup(<P043Diagram picture="equivalent" />);
  assert.ok(equivalent.includes('data-shaded-fraction="2/4"') && equivalent.includes('data-shaded-fraction="1/2"'));
  assert.ok(equivalent.includes('2/4 = 1/2 = 0.50 = 50%'));
});
test('each picture exposes a localized accessible mathematical description', () => {
  for (const language of ['en', 'es'] as const) for (const picture of ['decimal', 'fraction', 'percent', 'equivalent'] as P043Picture[]) {
    const html = renderToStaticMarkup(<P043Diagram picture={picture} language={language} />);
    assert.match(html, /role="img" aria-label="[^"]+"/);
    assert.ok(html.includes(`data-picture="${picture}"`));
  }
});
