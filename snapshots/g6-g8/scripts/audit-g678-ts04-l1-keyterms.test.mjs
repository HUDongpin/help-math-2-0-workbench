import assert from 'node:assert/strict';
import test from 'node:test';

import {parseRecoveredKeyTerm} from
  './audit-g678-ts04-l1-keyterms.mjs';

const xml = `<?xml version="1.0"?>
<Glossary>
<Data~tables~LNG~Tablas~de~datos EngCategory="d" SpanCategory="t" ScreenkeyTerm="Data Tables" SubLinkEng="organized,Organize~rows,Row" SubLinkSpan="organizadas,Organizar~filas,Fila" ExFileName="Data_tables.swf">Data&nbsp;tables use rows.~LNG~Las tablas de datos usan filas.</Data~tables~LNG~Tablas~de~datos>
<Simple~/~Simpler~/~Simplest~LNG~Simple~/~Más~Simple~/~El~Más~simple EngCategory="s" SpanCategory="s" ScreenkeyTerm="Simple / Simpler / Simplest" SubLinkEng="form,Form" SubLinkSpan="forma,Forma" ExFileName="Simple_simpler_simplest.swf">The easiest form.~LNG~La forma más fácil.</Simple~/~Simpler~/~Simplest~LNG~Simple~/~Más~Simple~/~El~Más~simple>
</Glossary>`;

test('TS04 recovered parser preserves spaces, slashes, labels, and definitions', () => {
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
  assert.equal(parseRecoveredKeyTerm(xml, 'Data Tables').id, 'data-tables');
});

test('TS04 recovered parser fails closed on unsupported or changed entries', () => {
  assert.throws(() => parseRecoveredKeyTerm(xml, 'Unknown'),
    /unsupported recovered key term/u);
  assert.throws(() => parseRecoveredKeyTerm(xml.replace(
    'ScreenkeyTerm="Data Tables"', 'ScreenkeyTerm="Other"'), 'Data Tables'),
  /missing exact Data Tables/u);
});
