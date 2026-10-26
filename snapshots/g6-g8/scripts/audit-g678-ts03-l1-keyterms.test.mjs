import assert from 'node:assert/strict';
import test from 'node:test';

import {parseRecoveredKeyTerm} from
  './audit-g678-ts03-l1-keyterms.mjs';

const xml = `<?xml version="1.0"?>
<Glossary>
<Organize~LNG~Organizar EngCategory="o" SpanCategory="o" ScreenkeyTerm="Organize" SubLinkEng="order,Order~pattern,Pattern" SubLinkSpan="orden,Orden~patrón,Patrón" ExFileName="Organize.swf">To organize&nbsp;means order.~LNG~Organizar significa poner en orden.</Organize~LNG~Organizar>
<Information~LNG~Información EngCategory="i" SpanCategory="i" ScreenkeyTerm="Information" SubLinkEng="data,Data" SubLinkSpan="datos,Datos" ExFileName="Information.swf">Facts or data.~LNG~Datos o hechos.</Information~LNG~Información>
</Glossary>`;

test('recovered key-term parser preserves source labels and bilingual definitions', () => {
  assert.deepEqual(parseRecoveredKeyTerm(xml, 'Organize'), {
    id: 'organize',
    sourceKeyAttribute: 'Organize',
    labels: {en: 'Organize', es: 'Organizar'},
    definitions: {
      en: 'To organize means order.',
      es: 'Organizar significa poner en orden.',
    },
    legacyCompanionReferences: {
      subLinksEn: ['order,Order', 'pattern,Pattern'],
      subLinksEs: ['orden,Orden', 'patrón,Patrón'],
      exampleSwf: 'Organize.swf',
    },
    exactEntrySha256: parseRecoveredKeyTerm(xml, 'Organize').exactEntrySha256,
  });
});

test('recovered key-term parser fails closed on missing or changed entries', () => {
  assert.throws(() => parseRecoveredKeyTerm(xml, 'Unknown'),
    /unsupported recovered key term/u);
  assert.throws(() => parseRecoveredKeyTerm(xml.replace(
    'ScreenkeyTerm="Information"', 'ScreenkeyTerm="Info"'), 'Information'),
  /entry shape drifted/u);
});
