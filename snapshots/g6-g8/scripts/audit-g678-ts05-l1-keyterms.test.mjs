import assert from 'node:assert/strict';
import test from 'node:test';

import {parseRecoveredKeyTerm} from
  './audit-g678-ts05-l1-keyterms.mjs';

const xml = `<?xml version="1.0"?>
<Glossary>
<Show~LNG~Mostrar EngCategory="s" SpanCategory="m" ScreenkeyTerm="Show" SubLinkEng="displayed,Display" SubLinkSpan="" ExFileName="Show.swf">To show&nbsp;means to be visible.~LNG~Mostrar significa enseñar.</Show~LNG~Mostrar>
<Simple~/~Simpler~/~Simplest~LNG~Simple~/~Más~Simple~/~El~Más~simple EngCategory="s" SpanCategory="s" ScreenkeyTerm="Simple / Simpler / Simplest" SubLinkEng="form,Form" SubLinkSpan="forma,Forma" ExFileName="Simple_simpler_simplest.swf">The easiest form.~LNG~La forma más fácil.</Simple~/~Simpler~/~Simplest~LNG~Simple~/~Más~Simple~/~El~Más~simple>
</Glossary>`;

test('TS05 recovered parser preserves spaces, slashes, labels, and definitions', () => {
  const result = parseRecoveredKeyTerm(xml, 'Simple / Simpler / Simplest');
  assert.deepEqual(result, {
    id: 'simple-simpler-simplest',
    sourceKeyAttribute: 'Simple / Simpler / Simplest',
    labels: {en: 'Simple / Simpler / Simplest',
      es: 'Simple / Más Simple / El Más simple'},
    definitions: {en: 'The easiest form.', es: 'La forma más fácil.'},
    legacyCompanionReferences: {
      subLinksEn: ['form,Form'], subLinksEs: ['forma,Forma'],
      exampleSwf: 'Simple_simpler_simplest.swf',
    },
    exactEntrySha256: result.exactEntrySha256,
  });
  assert.equal(parseRecoveredKeyTerm(xml, 'Show').id, 'show');
});

test('TS05 recovered parser fails closed on unsupported or changed entries', () => {
  assert.throws(() => parseRecoveredKeyTerm(xml, 'Unknown'),
    /unsupported recovered key term/u);
  assert.throws(() => parseRecoveredKeyTerm(xml.replace(
    'ScreenkeyTerm="Show"', 'ScreenkeyTerm="Other"'), 'Show'),
  /missing exact Show/u);
});
