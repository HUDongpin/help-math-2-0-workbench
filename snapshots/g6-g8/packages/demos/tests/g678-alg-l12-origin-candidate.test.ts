import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import candidate, {SHARED_ALG001_L12_P011_GLOSSARY_TERMS as terms} from '../src/modules/shared-alg001-l12-p011';

const workspace = new URL('../../../migrations/shared-alg001-l12-p011/', import.meta.url);

test('Origin controls retain exact source characters, action targets and first frames', () => {
  const xml = new URL('audit/movie.xml', workspace);
  assert.equal(createHash('sha256').update(readFileSync(xml)).digest('hex'),
    '79737d87ff67635067aba29581eca826d0c0c40c1f6942b2785c4eeddf1c9c2f');
  for (const term of terms) {
    const id = term.sourceCharacterId;
    const query = `count(//DefineSprite[@objectID='33']/tags/PlaceObject2[@objectID='${id}'][1]/preceding-sibling::ShowFrame)+1`;
    assert.equal(Number(execFileSync('/usr/bin/xmllint', ['--xpath', query, fileURLToPath(xml)], {encoding: 'utf8'})), term.firstFrame);
    const action = readFileSync(new URL(`audit/ffdec-26.2.1-source-v1/scripts/DefineButton2_${id}/BUTTONCONDACTION on(release).as`, workspace), 'utf8');
    assert(action.includes(`_global.KeyAttribute = "${term.sourceKeyAttribute}";`));
    assert(action.includes('_root.DoHyperLinks();'));
    assert(action.includes('_root.animation_mc.animation.stop();'));
  }
});

test('Origin renderer exposes controls at the two authored boundaries in both host languages', () => {
  assert.equal(candidate.key, 'shared-alg001-l12-p011');
  assert(candidate.runtime);
  assert.equal(candidate.runtime.frameCount, 10);
  for (const uiLanguage of ['en', 'es'] as const) {
    for (const [frame, expected] of [[1, 0], [7, 0], [8, 3], [77, 3], [78, 6], [118, 6]] as const) {
      const markup = renderToStaticMarkup(createElement(candidate.Renderer, {
        frame, frameDomain: 'sprite-33', scenario: 'source-static-frame',
        lang: 'en', uiLanguage, seed: 0,
      }));
      assert.equal((markup.match(/data-source-character-id=/g) || []).length, expected);
      if (expected === 6) {
        for (const term of terms) assert(markup.includes(term.labels[uiLanguage]));
      }
    }
  }
});
