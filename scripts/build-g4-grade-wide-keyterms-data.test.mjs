import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildG4GradeWideKeyTermsData,
  decodeLegacyText,
  parseArguments,
  parseLegacyKeyTermsXml,
  run,
} from './build-g4-grade-wide-keyterms-data.mjs';

test('legacy text decoding is text-only and rejects unknown named entities', () => {
  assert.equal(decodeLegacyText('one&nbsp;two &#x221A; &#176;'), 'one two √ °');
  assert.throws(() => decodeLegacyText('&copy;'), /unsupported legacy XML entity/);
});

test('parser preserves independent source order and records only bounded cleanup', async () => {
  const [englishXml, spanishXml] = await Promise.all([
    readFile(new URL(
      '../source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
      import.meta.url,
    ), 'utf8'),
    readFile(new URL(
      '../source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml',
      import.meta.url,
    ), 'utf8'),
  ]);
  const english = parseLegacyKeyTermsXml(englishXml, 'en');
  const spanish = parseLegacyKeyTermsXml(spanishXml, 'es');

  assert.equal(english.entries.length, 761);
  assert.equal(spanish.entries.length, 753);
  assert.equal(english.warnings.length, 6);
  assert.equal(spanish.warnings.length, 2);
  assert.equal(english.entries[0].titles.en, 'Absolute Value');
  assert.equal(english.entries.at(-1).titles.en, 'Zero property of multiplication');
  assert.equal(spanish.entries[0].titles.en, 'Addition');
  assert.equal(english.entries[0].sublinks.en[0].targetTitle, 'Value');
  assert.equal(english.entries[0].sublinks.es[0].targetTitle, 'Valor');
  assert.equal(
    Object.hasOwn(english.entries[0].sublinks.es[0], 'targetEnglishTitle'),
    false,
  );
  assert.equal(
    spanish.entries.filter(
      ({titles}) => titles.en === 'Proportional relationship',
    ).length,
    2,
  );
  assert.equal(english.entries[0].diagram.webResolutionStatus, 'not-hash-bound-for-web');
});

test('documents bind the two exact grade-wide sources without lesson substitution', async () => {
  const outputs = await buildG4GradeWideKeyTermsData();
  assert.deepEqual(outputs.map(({document}) => document.source.sha256), [
    'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
  ]);
  for (const {document} of outputs) {
    assert.equal(document.sourceDisposition, 'unresolved-lesson-vs-grade-wide');
    assert.equal(document.lessonBinding.declaredLessonSpecificSourcesPresent, false);
    assert.equal(document.lessonBinding.productDispositionAccepted, false);
    assert.equal(document.authority.lessonSpecificSubstitutionAuthorized, false);
    assert.equal(document.authority.actionScriptExecuted, false);
    assert.equal(document.authority.strictCompletion, false);
    assert.equal(document.authority.publicRelease, false);
    assert.equal(document.extraction.legacyUrlsExecuted, false);
    assert.equal(document.extraction.diagramAssetsExecuted, false);
  }
});

test('generated JSON pair is current and CLI exposes only dry-run, write, and check', async () => {
  assert.deepEqual(parseArguments([]), {mode: 'dry-run'});
  assert.deepEqual(parseArguments(['--write']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.throws(() => parseArguments(['--publish']), /unknown argument/);
  assert.throws(
    () => parseArguments(['--write', '--check']),
    /choose exactly one mode/,
  );
  const summary = await run({mode: 'check'});
  assert.deepEqual(summary.map(({entryCount}) => entryCount), [761, 753]);
  assert.ok(summary.every(({strictCompletion}) => strictCompletion === false));
  assert.ok(summary.every(({publicRelease}) => publicRelease === false));
});
