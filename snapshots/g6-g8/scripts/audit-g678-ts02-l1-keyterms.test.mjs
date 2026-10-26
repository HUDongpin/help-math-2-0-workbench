import assert from 'node:assert/strict';
import test from 'node:test';

import {parseRecoveredKeyTerm} from
  './audit-g678-ts02-l1-keyterms.mjs';

const xml = `<?xml version="1.0"?>
<Glossary>
<Restate~LNG~Replantear EngCategory="r" SpanCategory="r" ScreenkeyTerm="Restate" SubLinkEng="" SubLinkSpan="" ExFileName="Restate.swf">To repeat again; to say again~LNG~Volver a repetir; decir de nuevo.</Restate~LNG~Replantear>
<Question~LNG~Pregunta EngCategory="q" SpanCategory="p" ScreenkeyTerm="Question" SubLinkEng="problem,Problem~solve,Solve" SubLinkSpan="problema,Problema~resolver,Resolver" ExFileName="Question.swf">A problem to solve.~LNG~Un problema para resolver.</Question~LNG~Pregunta>
<Problem~LNG~Problema EngCategory="p" SpanCategory="p" ScreenkeyTerm="Problem" SubLinkEng="question,Question" SubLinkSpan="pregunta,Pregunta" ExFileName="Problem.swf">A question to solve or answer.~LNG~Una pregunta para resolver o contestar.</Problem~LNG~Problema>
</Glossary>`;

test('recovered key-term parser preserves source labels and bilingual definitions', () => {
  assert.deepEqual(parseRecoveredKeyTerm(xml, 'Restate'), {
    id: 'restate',
    sourceKeyAttribute: 'Restate',
    labels: {en: 'Restate', es: 'Replantear'},
    definitions: {
      en: 'To repeat again; to say again',
      es: 'Volver a repetir; decir de nuevo.',
    },
    legacyCompanionReferences: {
      subLinksEn: [],
      subLinksEs: [],
      exampleSwf: 'Restate.swf',
    },
    exactEntrySha256: parseRecoveredKeyTerm(xml, 'Restate').exactEntrySha256,
  });
});

test('recovered key-term parser fails closed on missing or changed entries', () => {
  assert.throws(() => parseRecoveredKeyTerm(xml, 'Unknown'),
    /unsupported recovered key term/u);
  assert.throws(() => parseRecoveredKeyTerm(xml.replace(
    'ScreenkeyTerm="Question"', 'ScreenkeyTerm="Query"'), 'Question'),
  /entry shape drifted/u);
});
