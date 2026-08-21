#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, opendir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const RECEIPT_PATH =
  'catalog/owner-authorizations/g5-l4-combined-keyterms-product-reference-successor-2026-07-30.json';
const RECEIPT_SQL_ARCHIVE_PATH =
  '/Volumes/WestWorld/Extracted_NewHelpProgram_20210203';
const CURRENT_SQL_ARCHIVE_PATH =
  '/Volumes/WestWorld/HELP MATH Related Files/Extracted_NewHelpProgram_20210203';
const RECEIPT_KEYTERMS_ROOT = '/Volumes/WestWorld/HELP_OnlineKeyTerms_XML';
const CURRENT_KEYTERMS_ROOT =
  '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML';
const EXACT_MESSAGE =
  'The key terms for all lessons are combined as Middle school keyterms and elementary keyterms... please use that file for the key term reference.  \n\nThis is the file: Extracted_NewHelpProgram_20210203';

const EXPECTED_EXTERNAL_FILES = Object.freeze([
  Object.freeze({
    relativePath: 'ELM/ELKTEG4.xml',
    bytes: 398_191,
    sha256: 'd39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c',
  }),
  Object.freeze({
    relativePath: 'ELM/ELKTSG4.xml',
    bytes: 396_776,
    sha256: 'a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d',
  }),
  Object.freeze({
    relativePath: 'MI/L1KTE01.xml',
    bytes: 345_838,
    sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b',
  }),
  Object.freeze({
    relativePath: 'MI/L1KTS01.xml',
    bytes: 344_456,
    sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407',
  }),
]);

const EXPECTED_PROJECT_FILES = Object.freeze([
  Object.freeze({
    path: 'source-assets/flash/intake/2026-07-30-venky-combined-keyterms/INTAKE_RECEIPT.json',
    bytes: 3_362,
    sha256: 'f4324515451500fb641dd8d34ff04ce86baaefa2c5c29289bfdb8d8748abfc0c',
  }),
  Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
    bytes: 378_783,
    sha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  }),
  Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml',
    bytes: 374_466,
    sha256: '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
  }),
  Object.freeze({
    path: 'source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTEG4.xml',
    bytes: 398_191,
    sha256: 'd39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c',
  }),
  Object.freeze({
    path: 'source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTSG4.xml',
    bytes: 396_776,
    sha256: 'a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d',
  }),
  Object.freeze({
    path: 'apps/web/public/generated/g5-l4-elementary-keyterms-reference-en.json',
    bytes: 971_582,
    sha256: 'e4baaf8d98bb0d2032381a2faf107a877f8bbaea26413bd45dd49f10e7fbcdfd',
  }),
  Object.freeze({
    path: 'apps/web/public/generated/g5-l4-elementary-keyterms-reference-es.json',
    bytes: 964_481,
    sha256: '0184db0cca0a3351ed4f210ddcac752eeee8756ed46a95ca63bec1980c41e7cb',
  }),
  Object.freeze({
    path: 'scripts/build-g5-l4-elementary-keyterms-reference-data.mjs',
    bytes: 13_357,
    sha256: 'f0e3594de19e1f3e7164427300fc76d8ce81a853f62698a56eae42088239cfcf',
  }),
  Object.freeze({
    path: 'apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts',
    bytes: 20_847,
    sha256: 'cf97fada67b41b22c0c8bc27847adfa49dd295807535730a15319aa3e9aa62da',
  }),
  Object.freeze({
    path: 'apps/web/components/legacy-key-terms-browser.tsx',
    bytes: 36_303,
    sha256: 'a96c25458ef8475a22c6be72e42da75c17f5bfa14d15ea73a22d937c6166d60f',
  }),
]);

const EXPECTED_AUTHORITY_BOUNDARY = Object.freeze({
  contentManagerReferenceDirectionOwnerRelayed: true,
  contentManagerMessageHeadersVerified: false,
  originalFlashSourceEstablished: false,
  lessonSpecificSourceRecoveryEstablished: false,
  lessonSpecificSubstitutionAuthorized: false,
  exactRuntimeByteVariantVerified: false,
  actionScriptExecutionVerified: false,
  authoritativeOriginalRuntimeEvidenceEstablished: false,
  audioAccepted: false,
  independentHumanReviewAccepted: false,
  ownerFidelityAcceptanceEstablished: false,
  strictCompletionEstablished: false,
  publicationAuthorized: false,
  published: false,
  strictAcceptanceEffect: 'product-reference-authorization-only',
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

async function readExactRegularFile(absolutePath, expected) {
  const sourceStat = await lstat(absolutePath);
  invariant(
    sourceStat.isFile() && !sourceStat.isSymbolicLink(),
    `${absolutePath} must be a regular file`,
  );
  const bytes = await readFile(absolutePath);
  invariant(
    bytes.length === expected.bytes && sha256(bytes) === expected.sha256,
    `${absolutePath} identity changed`,
  );
  return bytes;
}

async function readExactRegularFileSet(entries, label) {
  const results = await Promise.allSettled(entries.map(({absolutePath, expected}) =>
    readExactRegularFile(absolutePath, expected)));
  const failures = results.flatMap((result) =>
    result.status === 'rejected'
      ? [result.reason instanceof Error ? result.reason.message : String(result.reason)]
      : []);
  invariant(
    failures.length === 0,
    `${label} identities changed:\n${failures.map((message) => `- ${message}`).join('\n')}`,
  );
  return results.map((result) => result.value);
}

async function enumerateRelativeFiles(root) {
  const results = [];
  async function visit(directory, relativeDirectory) {
    const handle = await opendir(directory);
    for await (const entry of handle) {
      const relativePath = relativeDirectory
        ? path.posix.join(relativeDirectory, entry.name)
        : entry.name;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
      } else if (entry.isFile()) {
        results.push(relativePath);
      } else {
        invariant(false, `${absolutePath} is not a regular file or directory`);
      }
    }
  }
  await visit(root, '');
  return results.sort();
}

function expectFileBinding(value, expected, label) {
  invariant(value !== null && typeof value === 'object', `${label} is missing`);
  invariant(
    value.path === expected.path &&
      value.bytes === expected.bytes &&
      value.sha256 === expected.sha256,
    `${label} binding drifted`,
  );
}

export function validateReceiptDocument(receipt) {
  invariant(receipt !== null && typeof receipt === 'object', 'receipt is not an object');
  invariant(
    receipt.schemaVersion === 1 &&
      receipt.evidenceType ===
        'g5-l4-owner-relayed-content-manager-combined-keyterms-product-reference-successor' &&
      receipt.releaseId === 'lesson-g05-l04-number-lines' &&
      receipt.receivedOn === '2026-07-30' &&
      receipt.channel === 'current-codex-task' &&
      receipt.taskThreadId === '019f9f44-c13b-7033-92d0-3658e2f9c638',
    'receipt identity drifted',
  );

  const message = receipt.relay?.contentManagerMessage;
  invariant(
    receipt.relay?.relayedByOwner === 'Dr. Peter Hu' &&
      receipt.relay.contentManagerNamedByOwner === 'Venky' &&
      receipt.relay.emailMessageHeadersVerified === false &&
      message?.exactUtf8 === EXACT_MESSAGE &&
      message.byteLength === Buffer.byteLength(EXACT_MESSAGE) &&
      message.sha256 === sha256(Buffer.from(EXACT_MESSAGE)) &&
      message.captureBoundary ===
        'exact-owner-relayed-content-manager-message-after-email-from-venky-header-with-two-trailing-spaces-before-the-first-blank-line-preserved',
    'owner-relayed Venky message binding drifted',
  );

  invariant(
    receipt.authorization?.referenceUseAuthorized === true &&
      receipt.authorization.scope ===
        'combined-elementary-keyterms-product-reference-only' &&
      receipt.authorization.g5L4GradeBandSelection === 'elementary' &&
      receipt.authorization.middleSchoolSourcesSelectedForG5L4 === false &&
      receipt.authorization.selectedProductReferenceVariant ===
        'canonical-preserved-master' &&
      receipt.authorization.ownerIntake2015VariantSelectedForClient === false,
    'combined glossary authorization boundary drifted',
  );

  invariant(
    receipt.reportedArtifactResolution?.reportedName ===
        'Extracted_NewHelpProgram_20210203' &&
      receipt.reportedArtifactResolution.resolvedPath ===
        RECEIPT_SQL_ARCHIVE_PATH &&
      receipt.reportedArtifactResolution.xmlFilesFound === 0 &&
      receipt.reportedArtifactResolution.keyTermOrGlossaryNamedFilesFound === 0 &&
      receipt.reportedArtifactResolution
        .containsCombinedElementaryOrMiddleSchoolKeyTermsXml === false &&
      receipt.reportedArtifactResolution.inspectionBoundary ===
        'read-only-filename-and-extension-enumeration-only-no-raw-sql-bcp-jsonl-or-personal-record-content-read',
    'reported SQL archive resolution drifted',
  );

  invariant(
    receipt.physicalCombinedKeytermsFolder?.path === RECEIPT_KEYTERMS_ROOT &&
      sameJson(receipt.physicalCombinedKeytermsFolder.ignoredNonContentFiles, [
        '.DS_Store',
      ]) &&
      Array.isArray(receipt.physicalCombinedKeytermsFolder.declaredXmlFileClosure) &&
      receipt.physicalCombinedKeytermsFolder.declaredXmlFileClosure.length === 4,
    'physical combined KeyTerms folder binding drifted',
  );
  for (const [index, expected] of EXPECTED_EXTERNAL_FILES.entries()) {
    const entry = receipt.physicalCombinedKeytermsFolder.declaredXmlFileClosure[index];
    invariant(
      entry.path === path.posix.join(RECEIPT_KEYTERMS_ROOT, expected.relativePath) &&
        entry.bytes === expected.bytes &&
        entry.sha256 === expected.sha256 &&
        entry.selectedForG5L4Client === false,
      `physical combined KeyTerms entry ${index + 1} drifted`,
    );
  }

  const product = receipt.productBindings;
  expectFileBinding(product?.intakeReceipt, EXPECTED_PROJECT_FILES[0], 'intake receipt');
  expectFileBinding(product?.selectedMasterSources?.en, EXPECTED_PROJECT_FILES[1], 'EN selected master');
  expectFileBinding(product?.selectedMasterSources?.es, EXPECTED_PROJECT_FILES[2], 'ES selected master');
  expectFileBinding(product?.ownerIntake2015Variants?.en, EXPECTED_PROJECT_FILES[3], 'EN owner intake');
  expectFileBinding(product?.ownerIntake2015Variants?.es, EXPECTED_PROJECT_FILES[4], 'ES owner intake');
  expectFileBinding(product?.generatedClientDocuments?.en, EXPECTED_PROJECT_FILES[5], 'EN client document');
  expectFileBinding(product?.generatedClientDocuments?.es, EXPECTED_PROJECT_FILES[6], 'ES client document');
  expectFileBinding(product?.generator, EXPECTED_PROJECT_FILES[7], 'generator');
  expectFileBinding(product?.lessonDescriptor, EXPECTED_PROJECT_FILES[8], 'lesson descriptor');
  expectFileBinding(product?.keyTermsBrowser, EXPECTED_PROJECT_FILES[9], 'Key Terms browser');
  invariant(
    product.selectedMasterSources.en.clientTermCount === 761 &&
      product.selectedMasterSources.es.clientTermCount === 753 &&
      product.ownerIntake2015Variants.en.selectedForClient === false &&
      product.ownerIntake2015Variants.es.selectedForClient === false &&
      product.ownerIntake2015Variants.en.logicalRecordCount === 814 &&
      product.ownerIntake2015Variants.es.logicalRecordCount === 812 &&
      product.ownerIntake2015Variants.en
        .malformedDefinitionSeparatorRecordCount === 0 &&
      product.ownerIntake2015Variants.es
        .malformedDefinitionSeparatorRecordCount === 1,
    'selected and unselected Key Terms variant disposition drifted',
  );

  invariant(
    receipt.missingLessonSpecificSourceBoundary?.declaredEnglishPath ===
        'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml' &&
      receipt.missingLessonSpecificSourceBoundary.declaredSpanishPath ===
        'HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml' &&
      receipt.missingLessonSpecificSourceBoundary.declaredEnglishSourcePresent === false &&
      receipt.missingLessonSpecificSourceBoundary.declaredSpanishSourcePresent === false &&
      receipt.missingLessonSpecificSourceBoundary
        .combinedReferenceSubstitutesForDeclaredLessonSources === false,
    'missing lesson-specific XML boundary drifted',
  );
  invariant(
    sameJson(receipt.authorityBoundary, EXPECTED_AUTHORITY_BOUNDARY),
    'strict evidence authority boundary drifted',
  );
  return receipt;
}

function validateGeneratedClientDocument(document, language, receipt) {
  const selected = receipt.productBindings.selectedMasterSources[language];
  const intake = receipt.productBindings.ownerIntake2015Variants[language];
  invariant(
    document.schemaVersion === 1 &&
      document.dataKind === 'g5-l4-combined-elementary-keyterms-reference' &&
      document.sourceDisposition ===
        'content-manager-authorized-reference-lesson-source-gap-open' &&
      document.indexLanguage === language &&
      document.source?.clientSelected?.path === selected.path &&
      document.source.clientSelected.bytes === selected.bytes &&
      document.source.clientSelected.sha256 === selected.sha256 &&
      document.source.ownerIntake2015Variant?.path === intake.path &&
      document.source.ownerIntake2015Variant.bytes === intake.bytes &&
      document.source.ownerIntake2015Variant.sha256 === intake.sha256 &&
      document.source.ownerIntake2015Variant.selectedForClient === false &&
      document.lessonBinding?.declaredEnglishLessonSourcePresent === false &&
      document.lessonBinding.declaredSpanishLessonSourcePresent === false &&
      document.lessonBinding.runtimeResolutionVerified === false &&
      document.lessonBinding.referenceUseAuthorized === true &&
      document.referenceDirective?.contentManager === 'Venky' &&
      document.referenceDirective.relayedByOwner === 'Dr. Peter Hu' &&
      document.referenceDirective.messageHeadersVerified === false &&
      document.variantDisposition?.clientSource === 'canonical-preserved-master' &&
      document.variantDisposition.ownerIntake2015SelectedForClient === false &&
      document.counts?.clientTermCount === selected.clientTermCount &&
      Array.isArray(document.terms) &&
      document.terms.length === selected.clientTermCount &&
      document.authority?.missingLessonSourcesRecovered === false &&
      document.authority.lessonSpecificSubstitutionAuthorized === false &&
      document.authority.exactRuntimeByteVariantVerified === false &&
      document.authority.originalRuntimeAccepted === false &&
      document.authority.humanVisualAccepted === false &&
      document.authority.ownerAccepted === false &&
      document.authority.fidelityVerified === false &&
      document.authority.strictCompletion === false &&
      document.authority.publicationAuthorized === false &&
      document.authority.publicRelease === false,
    `${language} generated Key Terms product document drifted`,
  );
}

export async function verifyG5L4CombinedKeytermsProductReferenceSuccessor() {
  const receiptBytes = await readFile(projectPath(RECEIPT_PATH));
  const receipt = validateReceiptDocument(JSON.parse(receiptBytes.toString('utf8')));

  const externalRelativePaths = await enumerateRelativeFiles(CURRENT_KEYTERMS_ROOT);
  const externalContentRelativePaths = externalRelativePaths.filter(
    (value) => value !== '.DS_Store',
  );
  invariant(
    sameJson(
      externalContentRelativePaths,
      EXPECTED_EXTERNAL_FILES.map(({relativePath}) => relativePath).sort(),
    ) &&
      sameJson(
        externalRelativePaths.filter((value) => value === '.DS_Store'),
        ['.DS_Store'],
      ),
    'physical combined KeyTerms folder closure drifted',
  );
  await readExactRegularFileSet(EXPECTED_EXTERNAL_FILES.map((entry) => ({
    absolutePath: path.join(CURRENT_KEYTERMS_ROOT, entry.relativePath),
    expected: entry,
  })), 'physical combined KeyTerms files');

  const sqlArchiveRelativePaths = await enumerateRelativeFiles(
    CURRENT_SQL_ARCHIVE_PATH,
  );
  const sqlXmlFiles = sqlArchiveRelativePaths.filter((value) =>
    value.toLocaleLowerCase('en-US').endsWith('.xml'));
  const sqlKeytermOrGlossaryFiles = sqlArchiveRelativePaths.filter((value) =>
    /key[\s_-]*terms?|glossar/i.test(path.basename(value)));
  invariant(
    sqlXmlFiles.length === 0 && sqlKeytermOrGlossaryFiles.length === 0,
    'reported SQL archive filename-only finding drifted',
  );

  const projectBytes = await readExactRegularFileSet(EXPECTED_PROJECT_FILES.map((entry) => ({
    absolutePath: projectPath(entry.path),
    expected: entry,
  })), 'bound project files');
  invariant(
    projectBytes[3].equals(await readFile(path.join(CURRENT_KEYTERMS_ROOT, 'ELM/ELKTEG4.xml'))) &&
      projectBytes[4].equals(await readFile(path.join(CURRENT_KEYTERMS_ROOT, 'ELM/ELKTSG4.xml'))),
    'read-only owner-intake copies no longer match the physical ELM sources',
  );

  const generatedEnglish = JSON.parse(projectBytes[5].toString('utf8'));
  const generatedSpanish = JSON.parse(projectBytes[6].toString('utf8'));
  validateGeneratedClientDocument(generatedEnglish, 'en', receipt);
  validateGeneratedClientDocument(generatedSpanish, 'es', receipt);

  const descriptorSource = projectBytes[8].toString('utf8');
  const browserSource = projectBytes[9].toString('utf8');
  for (const token of [
    'g5-l4-elementary-keyterms-reference-en.json',
    'g5-l4-elementary-keyterms-reference-es.json',
    'ELKTEG4.xml',
    'ELKTSG4.xml',
    'combined-elementary-keyterms-product-reference-only',
  ]) {
    invariant(
      descriptorSource.includes(token) && browserSource.includes(token),
      `G5 L4 product binding token is missing: ${token}`,
    );
  }

  return {
    releaseId: receipt.releaseId,
    receipt: RECEIPT_PATH,
    contentManagerReferenceUseAuthorized: true,
    selectedClientSources: {
      en: {
        path: receipt.productBindings.selectedMasterSources.en.path,
        sha256: receipt.productBindings.selectedMasterSources.en.sha256,
        terms: generatedEnglish.terms.length,
      },
      es: {
        path: receipt.productBindings.selectedMasterSources.es.path,
        sha256: receipt.productBindings.selectedMasterSources.es.sha256,
        terms: generatedSpanish.terms.length,
      },
    },
    ownerIntake2015SelectedForClient: false,
    reportedSqlArchiveXmlFiles: sqlXmlFiles.length,
    reportedSqlArchiveKeytermOrGlossaryNamedFiles:
      sqlKeytermOrGlossaryFiles.length,
    missingLessonSpecificSources: ['L4KTE01.xml', 'L4KTS01.xml'],
    strictCompletionEstablished: false,
    publicationAuthorized: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const result = await verifyG5L4CombinedKeytermsProductReferenceSuccessor();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
