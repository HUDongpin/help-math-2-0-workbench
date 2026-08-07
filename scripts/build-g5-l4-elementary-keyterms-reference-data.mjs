#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseLegacyKeyTermsXml} from './build-g4-grade-wide-keyterms-data.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const RELEASE_ID = 'lesson-g05-l04-number-lines';
const CANONICAL_SOURCE_DIRECTORY =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML';
const OWNER_INTAKE_DIRECTORY =
  'source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM';
const LESSON_SPECIFIC_SOURCES = Object.freeze({
  en: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml',
  es: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml',
});

const ES_MALFORMED_DEFINITION_SEPARATOR_RECORD = Object.freeze({
  sourceOrdinal: 413,
  nodeName: 'Side~of~an~equation~LNG~Lado~de~una~ecuación',
  sourceStartLine: 458,
  definitionSeparatorCount: 0,
  bodySha256:
    'd393f77eb9a18cc0e6505f0bc82f8f407e66443390f90007b1df00ecc465d709',
});

export const DATASETS = Object.freeze({
  en: Object.freeze({
    file: 'ELKTEG4.xml',
    output:
      'apps/web/public/generated/g5-l4-elementary-keyterms-reference-en.json',
    canonical: Object.freeze({
      bytes: 378_783,
      entryCount: 761,
      warningCount: 6,
      sha256:
        'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    }),
    ownerIntake2015: Object.freeze({
      bytes: 398_191,
      logicalRecordCount: 814,
      malformedDefinitionSeparatorRecords: Object.freeze([]),
      sha256:
        'd39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c',
    }),
  }),
  es: Object.freeze({
    file: 'ELKTSG4.xml',
    output:
      'apps/web/public/generated/g5-l4-elementary-keyterms-reference-es.json',
    canonical: Object.freeze({
      bytes: 374_466,
      entryCount: 753,
      warningCount: 2,
      sha256:
        '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
    }),
    ownerIntake2015: Object.freeze({
      bytes: 396_776,
      logicalRecordCount: 812,
      malformedDefinitionSeparatorRecords: Object.freeze([
        ES_MALFORMED_DEFINITION_SEPARATOR_RECORD,
      ]),
      sha256:
        'a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d',
    }),
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sourceStartLine(source, offset) {
  return source.slice(0, offset).split(/\r\n|\n|\r/).length;
}

export function inspectOwnerIntakeVariant(source, indexLanguage) {
  invariant(
    indexLanguage === 'en' || indexLanguage === 'es',
    'invalid intake index language',
  );
  const xml = source.replace(/^\uFEFF/, '');
  invariant(xml.includes('<Glossary>'), 'owner intake Glossary root is missing');
  const glossaryClose = xml.lastIndexOf('</Glossary>');
  invariant(glossaryClose >= 0, 'owner intake Glossary close is missing');

  const openingPattern =
    /<([^\s>]+)\s+[^>]*\bEngCategory\s*=\s*"[^"]*"[^>]*>/g;
  const openings = [...xml.matchAll(openingPattern)];
  invariant(openings.length > 0, 'owner intake contains no logical records');

  const malformedDefinitionSeparatorRecords = [];
  for (let index = 0; index < openings.length; index += 1) {
    const opening = openings[index];
    const openingOffset = opening.index;
    invariant(Number.isSafeInteger(openingOffset), 'owner intake offset is missing');
    const bodyOffset = openingOffset + opening[0].length;
    const nextOffset = index + 1 < openings.length
      ? openings[index + 1].index
      : glossaryClose;
    invariant(
      Number.isSafeInteger(nextOffset) && nextOffset >= bodyOffset,
      `owner intake record ${index + 1} has invalid bounds`,
    );
    const recordTail = xml.slice(bodyOffset, nextOffset);
    const nodeName = opening[1];
    const closingPattern = new RegExp(`</${escapeRegExp(nodeName)}\\s*>`);
    const closing = closingPattern.exec(recordTail);
    const body = closing
      ? recordTail.slice(0, closing.index)
      : recordTail;
    const definitionSeparatorCount =
      body.match(/~LNG~/g)?.length ?? 0;
    if (definitionSeparatorCount !== 1) {
      malformedDefinitionSeparatorRecords.push({
        sourceOrdinal: index + 1,
        nodeName,
        sourceStartLine: sourceStartLine(xml, openingOffset),
        definitionSeparatorCount,
        bodySha256: sha256(Buffer.from(body)),
      });
    }
  }

  return {
    logicalRecordCount: openings.length,
    malformedDefinitionSeparatorRecords,
  };
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function readExactRegularFile(relativePath, expected, options = {}) {
  const absolutePath = projectPath(relativePath);
  const sourceStat = await lstat(absolutePath);
  invariant(
    sourceStat.isFile() && !sourceStat.isSymbolicLink(),
    `${relativePath} must be a regular file`,
  );
  if (options.mode !== undefined) {
    invariant(
      (sourceStat.mode & 0o777) === options.mode,
      `${relativePath} must have mode ${options.mode.toString(8).padStart(4, '0')}`,
    );
  }
  const bytes = await readFile(absolutePath);
  invariant(
    bytes.length === expected.bytes && sha256(bytes) === expected.sha256,
    `${relativePath} identity changed`,
  );
  return {absolutePath, bytes};
}

function publicDocument(indexLanguage, dataset, canonicalParsed, intakeInspection) {
  const canonicalPath = path.posix.join(
    CANONICAL_SOURCE_DIRECTORY,
    dataset.file,
  );
  const intakePath = path.posix.join(OWNER_INTAKE_DIRECTORY, dataset.file);
  return {
    schemaVersion: 1,
    dataKind: 'g5-l4-combined-elementary-keyterms-reference',
    sourceDisposition:
      'content-manager-authorized-reference-lesson-source-gap-open',
    indexLanguage,
    generatedAt: null,
    source: {
      clientSelected: {
        assetId: dataset.file,
        path: canonicalPath,
        bytes: dataset.canonical.bytes,
        sha256: dataset.canonical.sha256,
        ordering: 'source-file-order',
      },
      ownerIntake2015Variant: {
        assetId: dataset.file,
        path: intakePath,
        bytes: dataset.ownerIntake2015.bytes,
        sha256: dataset.ownerIntake2015.sha256,
        logicalRecordCount: intakeInspection.logicalRecordCount,
        selectedForClient: false,
        malformedDefinitionSeparatorRecords:
          intakeInspection.malformedDefinitionSeparatorRecords,
      },
    },
    lessonBinding: {
      releaseId: RELEASE_ID,
      declaredLessonSpecificSources: LESSON_SPECIFIC_SOURCES,
      declaredEnglishLessonSourcePresent: false,
      declaredSpanishLessonSourcePresent: false,
      declaredLessonSpecificSourcesPresent: false,
      runtimeResolutionVerified: false,
      referenceUseAuthorized: true,
      productDispositionAccepted: true,
    },
    referenceDirective: {
      evidenceClass: 'owner-relayed-content-manager-email',
      contentManager: 'Venky',
      relayedByOwner: 'Dr. Peter Hu',
      recordedDate: '2026-07-30',
      scope: 'combined-elementary-keyterms-product-reference-only',
      messageHeadersVerified: false,
    },
    variantDisposition: {
      runtimeByteVariantVerified: false,
      clientSource: 'canonical-preserved-master',
      ownerIntake2015FullImport: 'blocked-malformed-source-record',
      ownerIntake2015SelectedForClient: false,
    },
    authority: {
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
    },
    counts: {
      clientTermCount: canonicalParsed.entries.length,
      clientExtractionWarningCount: canonicalParsed.warnings.length,
      ownerIntakeLogicalRecordCount: intakeInspection.logicalRecordCount,
      ownerIntakeMalformedDefinitionSeparatorRecordCount:
        intakeInspection.malformedDefinitionSeparatorRecords.length,
    },
    extraction: {
      warnings: canonicalParsed.warnings,
      entityPolicy: 'known-named-and-numeric-text-only',
      legacyUrlsExecuted: false,
      diagramAssetsExecuted: false,
    },
    terms: canonicalParsed.entries,
  };
}

export async function buildG5L4ElementaryKeyTermsReferenceData() {
  const outputs = [];
  for (const indexLanguage of ['en', 'es']) {
    const dataset = DATASETS[indexLanguage];
    const canonicalPath = path.posix.join(
      CANONICAL_SOURCE_DIRECTORY,
      dataset.file,
    );
    const intakePath = path.posix.join(OWNER_INTAKE_DIRECTORY, dataset.file);
    const [canonicalSource, intakeSource] = await Promise.all([
      readExactRegularFile(canonicalPath, dataset.canonical),
      readExactRegularFile(intakePath, dataset.ownerIntake2015, {mode: 0o444}),
    ]);
    const canonicalParsed = parseLegacyKeyTermsXml(
      canonicalSource.bytes.toString('utf8'),
      indexLanguage,
    );
    invariant(
      canonicalParsed.entries.length === dataset.canonical.entryCount &&
        canonicalParsed.warnings.length === dataset.canonical.warningCount,
      `${dataset.file} canonical extraction closure changed`,
    );
    const intakeInspection = inspectOwnerIntakeVariant(
      intakeSource.bytes.toString('utf8'),
      indexLanguage,
    );
    invariant(
      intakeInspection.logicalRecordCount ===
        dataset.ownerIntake2015.logicalRecordCount,
      `${dataset.file} owner intake logical record count changed`,
    );
    invariant(
      sameJson(
        intakeInspection.malformedDefinitionSeparatorRecords,
        dataset.ownerIntake2015.malformedDefinitionSeparatorRecords,
      ),
      `${dataset.file} owner intake malformed-record disposition changed`,
    );
    const document = publicDocument(
      indexLanguage,
      dataset,
      canonicalParsed,
      intakeInspection,
    );
    const bytes = Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
    invariant(
      (await readFile(canonicalSource.absolutePath)).equals(canonicalSource.bytes),
      `${canonicalPath} changed during read-only extraction`,
    );
    invariant(
      (await readFile(intakeSource.absolutePath)).equals(intakeSource.bytes),
      `${intakePath} changed during read-only inspection`,
    );
    outputs.push({
      indexLanguage,
      output: dataset.output,
      bytes,
      document,
    });
  }
  return outputs;
}

export function parseArguments(argv) {
  const options = {mode: 'dry-run'};
  for (const argument of argv) {
    if (argument === '--write') {
      invariant(options.mode === 'dry-run', 'choose exactly one mode');
      options.mode = 'write';
    } else if (argument === '--check') {
      invariant(options.mode === 'dry-run', 'choose exactly one mode');
      options.mode = 'check';
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

async function emit(output, bytes, mode) {
  const target = projectPath(output);
  if (mode === 'check') {
    invariant((await readFile(target)).equals(bytes), `${output} is stale`);
    return;
  }
  if (mode !== 'write') return;
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, bytes, {flag: 'wx'});
    await rename(temporary, target);
  } finally {
    await rm(temporary, {force: true});
  }
}

export async function run(options = {}) {
  const {mode = 'dry-run'} = options;
  const outputs = await buildG5L4ElementaryKeyTermsReferenceData();
  for (const output of outputs) {
    await emit(output.output, output.bytes, mode);
  }
  return outputs.map(({document, indexLanguage, output, bytes}) => ({
    indexLanguage,
    output,
    bytes: bytes.length,
    clientTermCount: document.counts.clientTermCount,
    ownerIntakeLogicalRecordCount:
      document.counts.ownerIntakeLogicalRecordCount,
    ownerIntakeMalformedDefinitionSeparatorRecordCount:
      document.counts.ownerIntakeMalformedDefinitionSeparatorRecordCount,
    referenceUseAuthorized: document.lessonBinding.referenceUseAuthorized,
    ownerIntake2015FullImport:
      document.variantDisposition.ownerIntake2015FullImport,
    strictCompletion: document.authority.strictCompletion,
    publicRelease: document.authority.publicRelease,
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const result = await run(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
