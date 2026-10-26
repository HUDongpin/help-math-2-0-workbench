import assert from 'node:assert/strict';
import test from 'node:test';
import React, {isValidElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P010NativeTextV1} from '../src/alg-l06-p010-native-text-v1';

const render = (frame: number, language: 'en' | 'es' = 'en',
  onGlossary?: (key: 'Function', trigger: HTMLButtonElement) => void) =>
  renderToStaticMarkup(<P010NativeTextV1 frame={frame} language={language}
    onGlossary={onGlossary}/>);

test('native source title and timed mathematical structure follow the same frame', () => {
  const initial = render(1);
  assert.match(initial, /data-p010-title="true"/);
  assert.match(initial, /Understanding Functions: Real World Activity/);
  assert.match(initial, /data-source-shape-ids="54"/);
  assert.doesNotMatch(initial, /data-p010-equation|data-p010-table|data-p010-graph-labels|data-p010-question/);
  assert.doesNotMatch(render(147), /data-p010-equation/);
  assert.match(render(148), /data-p010-equation="true"/);
  assert.doesNotMatch(render(166), /data-p010-table/);
  const table = render(167);
  assert.match(table, /data-p010-table="lemonade"/);
  assert.equal((table.match(/data-p010-row=/g) || []).length, 6);
  assert.equal((table.match(/scope="col"/g) || []).length, 2);
  assert.doesNotMatch(render(197), /data-p010-graph-labels/);
  assert.match(render(198), /data-p010-graph-label-group="cups"/);
});

test('masked question waits for final source update while Function can be opened earlier', () => {
  assert.doesNotMatch(render(267, 'en', () => {}), /data-p010-glossary-key|data-p010-question/);
  const at268 = render(268, 'en', () => {});
  assert.match(at268, /data-p010-glossary-key="Function"/);
  assert.match(at268, /data-source-button-id="51"/);
  assert.doesNotMatch(at268, /data-p010-question/);
  assert.doesNotMatch(render(296), /data-p010-question/);
  assert.match(render(297), /What are functions, and how are they used\?/);
  assert.match(render(303), /data-p010-question="true"/);
});

test('Spanish interface keeps source English and the button invokes the exact key', () => {
  const es = render(303, 'es');
  assert.match(es, /lang="en"/);
  assert.match(es, /data-p010-language-policy="source-en-fallback"/);
  assert.match(es, /data-p010-canvas-suppression="none"/);
  assert.match(es, /disabled=""/);
  let requested: unknown = null;
  const section = P010NativeTextV1({frame: 268, language: 'es',
    onGlossary: (key, trigger) => {requested = [key, trigger];}});
  const findButton = (value: unknown): React.ReactElement | undefined => {
    if (Array.isArray(value)) return value.map(findButton).find(Boolean);
    if (!isValidElement(value)) return undefined;
    if (value.type === 'button') return value;
    return findButton((value.props as {children?: unknown}).children);
  };
  const button = findButton(section);
  if (!button) throw new Error('P010 Function button missing');
  const trigger = {focus() {}} as HTMLButtonElement;
  (button.props as {onClick: (event: {currentTarget: HTMLButtonElement}) => void})
    .onClick({currentTarget: trigger});
  assert.deepEqual(requested, ['Function', trigger]);
});
