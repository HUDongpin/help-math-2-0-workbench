#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {
  copyFile,
  lstat,
  readFile,
  realpath,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const RECOVERY_ENV = 'PRIVATE_RECOVERY_CONTAINERS';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const TS07_AUDIT = 'catalog/g678-ts07-family-audit-v1.json';
const OUTPUT = 'catalog/g678-ts07-l1-keyterm-recovery-v1.json';
const APPLIED_RECEIPT =
  'receipts/aws-newhelpprogram-canonical-reconciliation-applied-v1.json';
const ACQUISITION_RECEIPT = 'receipts/s3-object-acquisition-v1.json';
const MEMBER_MANIFEST = 'manifests/private/zip64-member-manifest-copy1.jsonl';
const EXPECTED_L1_PLACEMENT_SET_SHA256 =
  '6a7e362770d18c1586ddaf48c63a2ac9c07c3672e800e1e39ac8137af2564939';
const EXPECTED_ELIGIBLE_SET_SHA256 =
  '95d4b9527502c012b66f50c856ab8cafd33bcdd4c1cb5ddb494214e572dcd3c0';
const EXPECTED_REQUESTED_KEY_SET_SHA256 =
  '75f79f4b27dbf94b34d662f611d6326af76fa4b37355a12788502e37ca666534';
const EXPECTED_RECOVERED_KEY_SET_SHA256 =
  'dd67a83fd9241adf4a9d3219da957ae97b8484cd8524acaab7f66f57e93bed7a';
const EXPECTED_UNRESOLVED_KEYS = Object.freeze([
  Object.freeze({
    animationId: 'shared-alg001-l04-p049',
    normalizedKey: 'represented',
    sourceKeyAttribute: 'Represented',
  }),
  Object.freeze({
    animationId: 'shared-alg001-l08-p046',
    normalizedKey: 'y-intercept',
    sourceKeyAttribute: 'Y-intercept',
  }),
]);
const SELECTED_MEMBERS = Object.freeze([
  Object.freeze({
    pathDisplay: 'NewHelpProgram/HELP_KEYTERMS/KT/XML/L1KTE01.xml',
    reference: 'HELP_KEYTERMS/KT/XML/L1KTE01.xml',
    bytes: 345838,
    sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b',
    contentObjectPath:
      'objects/sha256/14/14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b',
    ordinal: 79794,
    localeRole: 'en',
  }),
  Object.freeze({
    pathDisplay: 'NewHelpProgram/HELP_KEYTERMS/KT/XML/L1KTS01.xml',
    reference: 'HELP_KEYTERMS/KT/XML/L1KTS01.xml',
    bytes: 344456,
    sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407',
    contentObjectPath:
      'objects/sha256/3b/3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407',
    ordinal: 79803,
    localeRole: 'es',
  }),
]);
const FALSE_EFFECTS = Object.freeze({
  canonicalSourcePromoted: false,
  currentJavaScriptRegistered: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return absolute;
}

function descriptor(binding, pathOverride = binding.path) {
  return Object.freeze({path: pathOverride, bytes: binding.bytes,
    sha256: binding.sha256});
}

async function stableFile(target, {json = false, absolute = false} = {}) {
  const resolvedTarget = absolute ? path.resolve(target) : projectPath(target);
  const [before, canonical] = await Promise.all([
    lstat(resolvedTarget, {bigint: true}),
    realpath(resolvedTarget),
  ]);
  invariant(canonical === resolvedTarget && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${target} must be one canonical ordinary file`);
  const buffer = await readFile(resolvedTarget);
  const after = await lstat(resolvedTarget, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({
    path: absolute ? resolvedTarget : target,
    bytes: buffer.length,
    sha256: sha256(buffer),
    buffer,
    ...(json ? {value: JSON.parse(buffer)} : {}),
  });
}

async function recoveryRoot() {
  const supplied = process.env[RECOVERY_ENV];
  invariant(typeof supplied === 'string' && supplied.length > 0,
    `${RECOVERY_ENV} is required`);
  const root = path.resolve(supplied);
  const [canonical, metadata] = await Promise.all([
    realpath(root),
    lstat(root, {bigint: true}),
  ]);
  invariant(canonical === root && metadata.isDirectory() &&
    !metadata.isSymbolicLink(), `${RECOVERY_ENV} must be a canonical directory`);
  return Object.freeze({root, identity: Object.freeze({
    realPathSha256: sha256(root),
    device: String(metadata.dev),
    inode: String(metadata.ino),
    mode: Number(metadata.mode & 0o777n),
    accessBoundary: 'owner-private-custody-root',
  })});
}

async function recoveryFile(recovery, relativePath, {json = false} = {}) {
  invariant(relativePath.split('/').every((component) =>
    component.length > 0 && component !== '.' && component !== '..'),
  `noncanonical recovery path: ${relativePath}`);
  const target = path.join(recovery.root, ...relativePath.split('/'));
  invariant(target.startsWith(`${recovery.root}${path.sep}`),
    `${relativePath} escapes recovery root`);
  const binding = await stableFile(target, {absolute: true, json});
  return Object.freeze({...binding, path: relativePath});
}

function normalizeText(value) {
  return value.replaceAll('&nbsp;', ' ').replaceAll('\u00a0', ' ')
    .replace(/\s+/gu, ' ').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

export function findRecoveredKeyTerm(xmlText, sourceKeyAttribute) {
  const escaped = sourceKeyAttribute.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = xmlText.match(new RegExp(
    `<([^\\s>]+~LNG~[^\\s>]+)\\s+([^>]*ScreenkeyTerm="${escaped}"[^>]*)>([\\s\\S]*?)<\\/\\1>`,
    'iu',
  ));
  if (!match) return null;
  const attributes = Object.fromEntries([...match[2].matchAll(
    /([A-Za-z]+)\s*=\s*"([^"]*)"/gu,
  )].map((attribute) => [attribute[1], attribute[2]]));
  const definitions = match[3].split('~LNG~');
  const spanishLabel = match[1].split('~LNG~')[1]
    .replaceAll('~', ' ').trim();
  invariant(definitions.length === 2 &&
    normalizeKey(attributes.ScreenkeyTerm ?? '') === normalizeKey(
      sourceKeyAttribute) &&
    typeof attributes.ExFileName === 'string' &&
    attributes.ExFileName.endsWith('.swf'),
  `${sourceKeyAttribute} key-term entry shape drifted`);
  return Object.freeze({
    id: normalizeKey(attributes.ScreenkeyTerm).replace(/[^a-z0-9]+/gu, '-')
      .replace(/(^-|-$)/gu, ''),
    sourceKeyAttribute: attributes.ScreenkeyTerm,
    labels: Object.freeze({en: attributes.ScreenkeyTerm, es: spanishLabel}),
    definitions: Object.freeze({
      en: normalizeText(definitions[0]),
      es: normalizeText(definitions[1]),
    }),
    legacyCompanionReferences: Object.freeze({
      subLinksEn: attributes.SubLinkEng.split('~').filter(Boolean),
      subLinksEs: attributes.SubLinkSpan.split('~').filter(Boolean),
      exampleSwf: attributes.ExFileName,
    }),
    exactEntrySha256: sha256(match[0]),
  });
}

function manifestRows(buffer) {
  const text = buffer.toString('utf8');
  const selectedPaths = new Set(SELECTED_MEMBERS.map((member) =>
    member.pathDisplay));
  const rows = [];
  let start = 0;
  while (start < text.length) {
    const newline = text.indexOf('\n', start);
    const end = newline === -1 ? text.length : newline;
    const line = text.slice(start, end);
    if ([...selectedPaths].some((selected) => line.includes(selected))) {
      const value = JSON.parse(line);
      if (selectedPaths.has(value.pathDisplay)) rows.push(value);
    }
    if (newline === -1) break;
    start = newline + 1;
  }
  return rows.sort((left, right) => compareText(left.pathDisplay,
    right.pathDisplay));
}

function pageSet(rows) {
  const projection = [...rows].sort((left, right) => compareText(
    left.animationId, right.animationId,
  )).map((row) => [row.animationId, row.stableLessonKey,
    row.normalizedSourceKeys.join('~')].join('|')).join('\n') + '\n';
  return Object.freeze({projection, sha256: sha256(projection)});
}

async function expectedRecovery() {
  const recovery = await recoveryRoot();
  const [catalog, audit, builder, appliedReceipt, acquisitionReceipt,
    memberManifest] = await Promise.all([
    stableFile(CATALOG, {json: true}),
    stableFile(TS07_AUDIT, {json: true}),
    stableFile(path.relative(ROOT, SCRIPT_PATH)),
    recoveryFile(recovery, APPLIED_RECEIPT, {json: true}),
    recoveryFile(recovery, ACQUISITION_RECEIPT, {json: true}),
    recoveryFile(recovery, MEMBER_MANIFEST),
  ]);
  invariant(appliedReceipt.value.status ===
    'AWS_CANONICAL_RECONCILIATION_APPLIED_CUSTODY_ONLY' &&
    appliedReceipt.value.boundary === 'CUSTODY_ONLY_NO_PROMOTION' &&
    appliedReceipt.value.explicitlyNotEstablished.includes(
      'canonical-promotion-runtime-fidelity-acceptance-or-release'),
  'recovery reconciliation boundary drifted');
  const acquisition = acquisitionReceipt.value;
  invariant(acquisition.status === 'OBJECT_ACQUIRED_DOUBLE_HASH_VERIFIED' &&
    acquisition.custodyBoundary === 'CUSTODY_ONLY_NO_PROMOTION' &&
    acquisition.source?.key === 'NewHelpProgram.zip' &&
    acquisition.source.bytes === 10495170599 &&
    acquisition.doubleDownloadVerification?.sameBytes === true &&
    acquisition.doubleDownloadVerification?.sameSha256 === true &&
    acquisition.doubleDownloadVerification.primary.sha256 ===
      '26da534ecc6d6df0298516283880e4a19ca241747102acde8492cf90a30b2e10' &&
    acquisition.containerVerification?.memberManifestSha256 ===
      '13339a31d4f978d70d267591133e5f4b83c6abe59d5d5e3c4898ef931d03f79d',
  'NewHelpProgram acquisition receipt drifted');
  invariant(memberManifest.bytes === 130765530 &&
    memberManifest.sha256 ===
      '13339a31d4f978d70d267591133e5f4b83c6abe59d5d5e3c4898ef931d03f79d',
  'NewHelpProgram member manifest drifted');
  const rows = manifestRows(memberManifest.buffer);
  invariant(rows.length === SELECTED_MEMBERS.length,
    'selected L1 key-term manifest row count drifted');
  const xmlByRole = new Map();
  const sources = [];
  for (const expected of SELECTED_MEMBERS) {
    const row = rows.find((candidate) =>
      candidate.pathDisplay === expected.pathDisplay);
    invariant(row?.kind === 'regular' &&
      row.disposition === 'candidate-technical-in-custody' &&
      row.bytes === expected.bytes && row.sha256 === expected.sha256 &&
      row.contentObjectPath === expected.contentObjectPath &&
      row.ordinal === expected.ordinal,
    `selected key-term member drifted: ${expected.pathDisplay}`);
    const object = await recoveryFile(recovery, expected.contentObjectPath);
    invariant(object.bytes === expected.bytes && object.sha256 === expected.sha256,
      `selected key-term CAS object drifted: ${expected.sha256}`);
    xmlByRole.set(expected.localeRole, object.buffer.toString('utf8'));
    sources.push(Object.freeze({
      localeRole: expected.localeRole,
      reference: expected.reference,
      containerMember: Object.freeze({path: expected.pathDisplay,
        ordinal: expected.ordinal, bytes: expected.bytes,
        sha256: expected.sha256}),
      casObject: descriptor(object, expected.contentObjectPath),
    }));
  }
  invariant(audit.value.status ===
    'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked' &&
    audit.value.scope.ts07Placements === 44 &&
    audit.value.scope.uniqueSourceSwfs === 44 &&
    audit.value.records.length === 44 &&
    audit.value.registrationCandidatePlacementCount === 0 &&
    Object.values(audit.value.acceptanceEffects).every((value) => value === false),
  'TS07 source audit boundary drifted');
  const lessonMap = new Map(catalog.value.lessons.map((lesson) =>
    [lesson.stableLessonKey, lesson]));
  const dependencyMap = new Map(audit.value.glossaryDependencies.map((row) =>
    [row.stableLessonKey, row]));
  const pages = audit.value.records.map((record) => {
    invariant(record.placements.length === 1,
      `${record.sourceSha256} TS07 placement cardinality drifted`);
    const placement = record.placements[0];
    const lesson = lessonMap.get(placement.stableLessonKey);
    const dependency = dependencyMap.get(placement.stableLessonKey);
    invariant(lesson && dependency &&
      lesson.pages.some((page) => page.animationId === placement.animationId),
    `${placement.animationId} catalog/audit binding drifted`);
    const sourceKeys = [...new Set(record.behavior.glossaryButtons.map(
      (button) => button.sourceKeyAttribute))].sort(compareText);
    const normalizedSourceKeys = [...new Set(sourceKeys.map(normalizeKey))]
      .sort(compareText);
    const l1References = dependency.references.map((row) => row.reference);
    const usesRecoveredL1Pair = SELECTED_MEMBERS.every((member) =>
      l1References.includes(member.reference));
    return Object.freeze({
      animationId: placement.animationId,
      stableLessonKey: placement.stableLessonKey,
      moduleCode: placement.moduleCode,
      lessonNumber: placement.lessonNumber,
      keyTerms: lesson.keyTerms,
      sourceKeys: Object.freeze(sourceKeys),
      normalizedSourceKeys: Object.freeze(normalizedSourceKeys),
      usesRecoveredL1Pair,
    });
  }).sort((left, right) => compareText(left.animationId, right.animationId));
  const l1Pages = pages.filter((page) => page.usesRecoveredL1Pair);
  const l1Set = pageSet(l1Pages);
  const requestedKeys = [...new Set(l1Pages.flatMap((page) =>
    page.normalizedSourceKeys))].sort(compareText);
  invariant(pages.length === 44 && l1Pages.length === 15 &&
    l1Set.sha256 === EXPECTED_L1_PLACEMENT_SET_SHA256 &&
    requestedKeys.length === 79 &&
    sha256(`${requestedKeys.join('\n')}\n`) ===
      EXPECTED_REQUESTED_KEY_SET_SHA256,
  'TS07 L1 page/key denominator drifted');
  const representativeKey = new Map();
  for (const page of l1Pages) for (const sourceKey of page.sourceKeys) {
    const normalized = normalizeKey(sourceKey);
    const current = representativeKey.get(normalized);
    if (!current || compareText(sourceKey, current) < 0) {
      representativeKey.set(normalized, sourceKey);
    }
  }
  const terms = [];
  const unresolvedNormalizedKeys = [];
  const definitionConflictNormalizedKeys = [];
  for (const normalizedKey of requestedKeys) {
    const sourceKey = representativeKey.get(normalizedKey);
    const english = findRecoveredKeyTerm(xmlByRole.get('en'), sourceKey);
    const spanish = findRecoveredKeyTerm(xmlByRole.get('es'), sourceKey);
    if (!english || !spanish) {
      unresolvedNormalizedKeys.push(normalizedKey);
      continue;
    }
    const identityProjection = (term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      labels: term.labels,
      legacyCompanionReferences: term.legacyCompanionReferences,
    });
    invariant(JSON.stringify(identityProjection(english)) ===
      JSON.stringify(identityProjection(spanish)),
    `${sourceKey} bilingual XML identity projections disagree`);
    const definitionParity = JSON.stringify(english.definitions) ===
      JSON.stringify(spanish.definitions);
    if (!definitionParity) definitionConflictNormalizedKeys.push(normalizedKey);
    const sourceKeyVariants = [...new Set(l1Pages.flatMap((page) =>
      page.sourceKeys.filter((key) => normalizeKey(key) === normalizedKey)))]
      .sort(compareText);
    terms.push(Object.freeze({
      id: english.id,
      sourceKeyAttribute: english.sourceKeyAttribute,
      labels: english.labels,
      legacyCompanionReferences: english.legacyCompanionReferences,
      normalizedKey,
      sourceKeyVariants: Object.freeze(sourceKeyVariants),
      definitionParity,
      definitionVariants: Object.freeze({
        englishXml: english.definitions,
        spanishXml: spanish.definitions,
      }),
      sourceEntrySha256: Object.freeze({
        en: english.exactEntrySha256,
        es: spanish.exactEntrySha256,
      }),
    }));
  }
  invariant(terms.length === 77 && unresolvedNormalizedKeys.length === 2 &&
    JSON.stringify(unresolvedNormalizedKeys) ===
      JSON.stringify(['represented', 'y-intercept']) &&
    sha256(`${terms.map((term) => term.normalizedKey).join('\n')}\n`) ===
      EXPECTED_RECOVERED_KEY_SET_SHA256 &&
    JSON.stringify(definitionConflictNormalizedKeys) === JSON.stringify([
      'acute angle', 'degree', 'exponent', 'greater', 'represent', 'set',
    ]),
  'TS07 recovered/unresolved key set drifted');
  const eligible = l1Pages.filter((page) => page.normalizedSourceKeys.every(
    (key) => !unresolvedNormalizedKeys.includes(key)));
  const blockedL1 = l1Pages.filter((page) => !eligible.includes(page));
  const nonL1 = pages.filter((page) => !page.usesRecoveredL1Pair);
  const eligibleProjection = pageSet(eligible);
  const unresolved = blockedL1.flatMap((page) => page.sourceKeys.flatMap(
    (sourceKeyAttribute) => unresolvedNormalizedKeys.includes(
      normalizeKey(sourceKeyAttribute)) ? [Object.freeze({
        animationId: page.animationId,
        normalizedKey: normalizeKey(sourceKeyAttribute),
        sourceKeyAttribute,
      })] : [],
  )).sort((left, right) => compareText(left.animationId, right.animationId));
  invariant(eligible.length === 13 && blockedL1.length === 2 &&
    nonL1.length === 29 &&
    eligibleProjection.sha256 === EXPECTED_ELIGIBLE_SET_SHA256 &&
    JSON.stringify(unresolved) === JSON.stringify(EXPECTED_UNRESOLVED_KEYS),
  'TS07 product-eligible/unresolved L1 set drifted');
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-ts07-l1-keyterm-recovery-v1',
    recoveryId: 'g678-ts07-l1-keyterm-recovery-v1',
    status:
      'private-custody-recovery-verified-13-of-15-source-complete-product-calibration-pending',
    inputs: Object.freeze({
      catalog: descriptor(catalog),
      ts07Audit: descriptor(audit),
      builder: descriptor(builder),
      appliedCustodyReceipt: descriptor(appliedReceipt, APPLIED_RECEIPT),
      acquisitionReceipt: descriptor(acquisitionReceipt, ACQUISITION_RECEIPT),
      memberManifest: descriptor(memberManifest, MEMBER_MANIFEST),
    }),
    recoveryRoot: Object.freeze({environmentVariable: RECOVERY_ENV,
      ...recovery.identity, sourceMutationPerformed: false}),
    custodyBoundary: Object.freeze({
      status: appliedReceipt.value.status,
      boundary: appliedReceipt.value.boundary,
      canonicalSourcePromotionAuthorized: false,
      localOnlyDerivedProductCalibrationAuthorized: false,
    }),
    selectedSources: Object.freeze(sources),
    requestedNormalizedKeySetSha256: EXPECTED_REQUESTED_KEY_SET_SHA256,
    recoveredNormalizedKeySetSha256: EXPECTED_RECOVERED_KEY_SET_SHA256,
    definitionConflictNormalizedKeys:
      Object.freeze(definitionConflictNormalizedKeys),
    terms: Object.freeze(terms),
    eligibility: Object.freeze({
      recoveredL1ReferencePlacementCount: l1Pages.length,
      exactEntryPresentPlacementCount: eligible.length,
      unresolvedSourceKeyPlacementCount: blockedL1.length,
      otherKeyTermXmlPlacementCount: nonL1.length,
      productEligiblePlacementCount: 0,
      eligiblePlacementSetSha256: EXPECTED_ELIGIBLE_SET_SHA256,
      exactEntryPresent: Object.freeze(eligible),
      blocked: Object.freeze([
        ...blockedL1.map((page) => Object.freeze({...page,
          unresolvedSourceKeys: Object.freeze(unresolved.filter((row) =>
            row.animationId === page.animationId)),
          blocker: 'source-key-not-found-in-recovered-l1-xml'})),
        ...nonL1.map((page) => Object.freeze({...page,
          blocker: 'lesson-referenced-key-term-xml-not-recovered'})),
      ]),
    }),
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    registrationCandidatePlacementCount: 0,
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'The two XML objects remain private custody evidence and are not promoted into the canonical source tree.',
      'Thirteen TS07 placements have every requested glossary key in the recovered L1 bilingual XML pair; they still require the typed assessment state machine and browser product calibration.',
      'Six recovered terms have different definition text between the English and Spanish XML files; both variants and hashes are retained, and no product authority is selected here.',
      'ALG L4 requests Represented and ALG L8 requests Y-intercept, neither of which has an exact ScreenkeyTerm entry in the recovered L1 XML; no alias is invented.',
      'The other 29 TS07 placements reference different lesson key-term XML pairs that remain unrecovered.',
      'This recovery does not establish runtime, audio, visual, human, Owner, strict, release, or publication acceptance.',
    ]),
  });
}

async function writeExclusive(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function auditTs07L1Keyterms({check = false} = {}) {
  const artifact = await expectedRecovery();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await stableFile(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'TS07 L1 key-term recovery audit drifted');
  } else {
    invariant(!await lstat(projectPath(OUTPUT)).then(() => true, () => false),
      `${OUTPUT} already exists`);
    await writeExclusive(OUTPUT, bytes);
  }
  return Object.freeze({
    check,
    output: OUTPUT,
    bytes: bytes.length,
    sha256: sha256(bytes),
    status: artifact.status,
    recoveredL1ReferencePlacementCount:
      artifact.eligibility.recoveredL1ReferencePlacementCount,
    exactEntryPresentPlacementCount:
      artifact.eligibility.exactEntryPresentPlacementCount,
    blockedPlacementCount: artifact.eligibility.blocked.length,
    productEligiblePlacementCount: 0,
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    registrationCandidatePlacementCount: 0,
    acceptanceEffects: FALSE_EFFECTS,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-ts07-l1-keyterms.mjs [--check]');
  auditTs07L1Keyterms({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
