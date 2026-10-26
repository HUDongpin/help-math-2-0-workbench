import assert from 'node:assert/strict';
import test from 'node:test';

import {findRecoveredKeyTerm} from './audit-g678-ts07-l1-keyterms.mjs';

const XML = `<Root>
<Acute~angle~LNG~Ángulo~agudo EngCategory="a" SpanCategory="a" ScreenkeyTerm="Acute angle" SubLinkEng="angle,Angle~degree,Degree" SubLinkSpan="ángulo,Ángulo" ExFileName="Acute_angle.swf">An acute&nbsp;angle.~LNG~Un ángulo agudo.</Acute~angle~LNG~Ángulo~agudo>
</Root>`;

test('TS07 recovery parses one exact bilingual key-term entry', () => {
  const term = findRecoveredKeyTerm(XML, 'acute ANGLE');
  assert.deepEqual({
    id: term.id,
    sourceKeyAttribute: term.sourceKeyAttribute,
    labels: term.labels,
    definitions: term.definitions,
    exampleSwf: term.legacyCompanionReferences.exampleSwf,
  }, {
    id: 'acute-angle',
    sourceKeyAttribute: 'Acute angle',
    labels: {en: 'Acute angle', es: 'Ángulo agudo'},
    definitions: {en: 'An acute angle.', es: 'Un ángulo agudo.'},
    exampleSwf: 'Acute_angle.swf',
  });
});

test('TS07 recovery does not invent a missing source-key alias', () => {
  assert.equal(findRecoveredKeyTerm(XML, 'Represented'), null);
  assert.equal(findRecoveredKeyTerm(XML, 'Y-intercept'), null);
});

test('TS07 recovery rejects malformed bilingual definition structure', () => {
  assert.throws(() => findRecoveredKeyTerm(
    XML.replace('~LNG~Un ángulo agudo.', ''), 'Acute angle'),
  /key-term entry shape drifted/u);
});
