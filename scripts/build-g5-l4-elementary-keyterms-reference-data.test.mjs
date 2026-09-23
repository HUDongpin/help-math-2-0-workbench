import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildG5L4ElementaryKeyTermsReferenceData,
  DATASETS,
  inspectOwnerIntakeVariant,
  parseArguments,
  run,
} from './build-g5-l4-elementary-keyterms-reference-data.mjs';

const INTAKE_ROOT = new URL(
  '../source-assets/flash/intake/2026-07-30-venky-combined-keyterms/',
  import.meta.url,
);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

test('preserved owner-intake variants retain exact identities and read-only modes', async () => {
  for (const language of ['en', 'es']) {
    const dataset = DATASETS[language];
    const sourceUrl = new URL(`ELM/${dataset.file}`, INTAKE_ROOT);
    const [bytes, sourceStat] = await Promise.all([
      readFile(sourceUrl),
      lstat(sourceUrl),
    ]);
    assert.equal(sourceStat.isFile(), true);
    assert.equal(sourceStat.isSymbolicLink(), false);
    assert.equal(sourceStat.mode & 0o777, 0o444);
    assert.equal(bytes.length, dataset.ownerIntake2015.bytes);
    assert.equal(sha256(bytes), dataset.ownerIntake2015.sha256);
  }

  const receipt = JSON.parse(await readFile(
    new URL('INTAKE_RECEIPT.json', INTAKE_ROOT),
    'utf8',
  ));
  assert.equal(receipt.sqlArchiveFinding.xmlFilesFound, 0);
  assert.equal(receipt.sqlArchiveFinding.containsCombinedElementaryKeyTermsXml, false);
  assert.equal(receipt.selection.referenceUseAuthorized, true);
  assert.equal(receipt.selection.ownerIntake2015SelectedForClient, false);
  assert.equal(receipt.authority.l4LessonSpecificXmlRecovered, false);
  assert.equal(receipt.authority.exactRuntimeByteVariantVerified, false);
  assert.equal(receipt.authority.fidelityVerified, false);
  assert.equal(receipt.authority.strictComplete, false);
  assert.equal(receipt.authority.publicationAuthorized, false);
});

test('owner-intake inspection binds 814 EN and 812 ES records plus one exact ES separator defect', async () => {
  const [englishBytes, spanishBytes] = await Promise.all([
    readFile(new URL('ELM/ELKTEG4.xml', INTAKE_ROOT)),
    readFile(new URL('ELM/ELKTSG4.xml', INTAKE_ROOT)),
  ]);
  const english = inspectOwnerIntakeVariant(englishBytes.toString('utf8'), 'en');
  const spanish = inspectOwnerIntakeVariant(spanishBytes.toString('utf8'), 'es');

  assert.deepEqual(english, {
    logicalRecordCount: 814,
    malformedDefinitionSeparatorRecords: [],
  });
  assert.deepEqual(spanish, {
    logicalRecordCount: 812,
    malformedDefinitionSeparatorRecords: [{
      sourceOrdinal: 413,
      nodeName: 'Side~of~an~equation~LNG~Lado~de~una~ecuación',
      sourceStartLine: 458,
      definitionSeparatorCount: 0,
      bodySha256:
        'd393f77eb9a18cc0e6505f0bc82f8f407e66443390f90007b1df00ecc465d709',
    }],
  });
  assert.throws(
    () => inspectOwnerIntakeVariant('<Glossary></Glossary>', 'en'),
    /contains no logical records/,
  );
  assert.throws(
    () => inspectOwnerIntakeVariant(englishBytes.toString('utf8'), 'fr'),
    /invalid intake index language/,
  );
});

test('G5 L4 client documents use canonical terms and keep the 2015 intake unselected', async () => {
  const outputs = await buildG5L4ElementaryKeyTermsReferenceData();
  assert.deepEqual(outputs.map(({indexLanguage}) => indexLanguage), ['en', 'es']);

  const expected = {
    en: {
      clientTerms: 761,
      clientWarnings: 6,
      intakeRecords: 814,
      intakeMalformed: 0,
      firstEnglishTitle: 'Absolute Value',
      lastEnglishTitle: 'Zero property of multiplication',
    },
    es: {
      clientTerms: 753,
      clientWarnings: 2,
      intakeRecords: 812,
      intakeMalformed: 1,
      firstEnglishTitle: 'Addition',
      lastEnglishTitle: 'Oval',
    },
  };

  for (const {indexLanguage, document} of outputs) {
    const dataset = DATASETS[indexLanguage];
    const languageExpected = expected[indexLanguage];
    assert.equal(document.schemaVersion, 1);
    assert.equal(
      document.dataKind,
      'g5-l4-combined-elementary-keyterms-reference',
    );
    assert.equal(
      document.sourceDisposition,
      'content-manager-authorized-reference-lesson-source-gap-open',
    );
    assert.equal(document.indexLanguage, indexLanguage);
    assert.equal(document.generatedAt, null);
    assert.deepEqual(document.lessonBinding, {
      releaseId: 'lesson-g05-l04-number-lines',
      declaredLessonSpecificSources: {
        en: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml',
        es: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml',
      },
      declaredEnglishLessonSourcePresent: false,
      declaredSpanishLessonSourcePresent: false,
      declaredLessonSpecificSourcesPresent: false,
      runtimeResolutionVerified: false,
      referenceUseAuthorized: true,
      productDispositionAccepted: true,
    });
    assert.deepEqual(document.referenceDirective, {
      evidenceClass: 'owner-relayed-content-manager-email',
      contentManager: 'Venky',
      relayedByOwner: 'Dr. Peter Hu',
      recordedDate: '2026-07-30',
      scope: 'combined-elementary-keyterms-product-reference-only',
      messageHeadersVerified: false,
    });
    assert.deepEqual(document.variantDisposition, {
      runtimeByteVariantVerified: false,
      clientSource: 'canonical-preserved-master',
      ownerIntake2015FullImport: 'blocked-malformed-source-record',
      ownerIntake2015SelectedForClient: false,
    });
    assert.deepEqual(document.authority, {
      actionScriptExecuted: false,
      originalRuntimeBaseline: false,
      lessonSpecificSubstitutionAuthorized: false,
      missingLessonSourcesRecovered: false,
      exactRuntimeByteVariantVerified: false,
      originalRuntimeAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      fidelityVerified: false,
      strictCompletion: false,
      publicationAuthorized: false,
      publicRelease: false,
    });
    assert.deepEqual(document.counts, {
      clientTermCount: languageExpected.clientTerms,
      clientExtractionWarningCount: languageExpected.clientWarnings,
      ownerIntakeLogicalRecordCount: languageExpected.intakeRecords,
      ownerIntakeMalformedDefinitionSeparatorRecordCount:
        languageExpected.intakeMalformed,
    });
    assert.equal(document.source.clientSelected.sha256, dataset.canonical.sha256);
    assert.equal(document.source.clientSelected.bytes, dataset.canonical.bytes);
    assert.equal(
      document.source.clientSelected.path.startsWith('source-assets/flash/'),
      true,
    );
    assert.equal(
      document.source.ownerIntake2015Variant.sha256,
      dataset.ownerIntake2015.sha256,
    );
    assert.equal(
      document.source.ownerIntake2015Variant.selectedForClient,
      false,
    );
    assert.equal(
      document.source.ownerIntake2015Variant.path.startsWith(
        'source-assets/flash/intake/',
      ),
      true,
    );
    assert.equal(JSON.stringify(document).includes('/Volumes/'), false);
    assert.equal(Object.hasOwn(document, 'entries'), false);
    assert.equal(document.terms.length, languageExpected.clientTerms);
    assert.equal(document.terms[0].titles.en, languageExpected.firstEnglishTitle);
    assert.equal(document.terms.at(-1).titles.en, languageExpected.lastEnglishTitle);
    assert.deepEqual(Object.keys(document.terms[0]).sort(), [
      'categories',
      'definitions',
      'diagram',
      'id',
      'screenKeyTerm',
      'sourceOrdinal',
      'sublinks',
      'titles',
    ]);
    assert.equal(
      document.terms.every((term, index) =>
        term.id.startsWith(`${indexLanguage}-`) &&
        term.sourceOrdinal === index + 1 &&
        term.diagram.webResolutionStatus === 'not-hash-bound-for-web'),
      true,
    );
  }
});

test('CLI remains fail-closed and generated G5-only documents are current', async () => {
  assert.deepEqual(parseArguments([]), {mode: 'dry-run'});
  assert.deepEqual(parseArguments(['--write']), {mode: 'write'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.throws(() => parseArguments(['--publish']), /unknown argument/);
  assert.throws(
    () => parseArguments(['--write', '--check']),
    /choose exactly one mode/,
  );

  const summary = await run({mode: 'check'});
  assert.deepEqual(summary.map(({clientTermCount}) => clientTermCount), [761, 753]);
  assert.deepEqual(
    summary.map(({ownerIntakeLogicalRecordCount}) =>
      ownerIntakeLogicalRecordCount),
    [814, 812],
  );
  assert.ok(summary.every(({referenceUseAuthorized}) =>
    referenceUseAuthorized === true));
  assert.ok(summary.every(({ownerIntake2015FullImport}) =>
    ownerIntake2015FullImport === 'blocked-malformed-source-record'));
  assert.ok(summary.every(({strictCompletion}) => strictCompletion === false));
  assert.ok(summary.every(({publicRelease}) => publicRelease === false));
});
