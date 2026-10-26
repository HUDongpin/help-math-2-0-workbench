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
const TS02_AUDIT = 'catalog/g678-ts02-family-audit-v1.json';
const OUTPUT = 'catalog/g678-ts02-l1-keyterm-recovery-v1.json';
const APPLIED_RECEIPT =
  'receipts/aws-newhelpprogram-canonical-reconciliation-applied-v1.json';
const ACQUISITION_RECEIPT = 'receipts/s3-object-acquisition-v1.json';
const MEMBER_MANIFEST =
  'manifests/private/zip64-member-manifest-copy1.jsonl';
const EXPECTED_ELIGIBLE_SET_SHA256 =
  '16c70593865f125079868bb72196e056babd5a47580515ac60a41193ffa4da19';
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
    mode: Number(before.mode & 0o777n),
    nlink: Number(before.nlink),
    ...(json ? {value: JSON.parse(buffer)} : {}),
  });
}

function descriptor(binding, pathOverride = binding.path) {
  return Object.freeze({path: pathOverride, bytes: binding.bytes,
    sha256: binding.sha256});
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
    !metadata.isSymbolicLink(),
  `${RECOVERY_ENV} must be a canonical directory`);
  return Object.freeze({root, identity: Object.freeze({
    realPathSha256: sha256(root),
    device: String(metadata.dev),
    inode: String(metadata.ino),
    mode: Number(metadata.mode & 0o777n),
    accessBoundary: 'owner-private-custody-root',
  })});
}

async function recoveryFile(recovery, relativePath, options = {}) {
  invariant(relativePath.split('/').every((component) =>
    component.length > 0 && component !== '.' && component !== '..'),
  `noncanonical recovery path: ${relativePath}`);
  const target = path.join(recovery.root, ...relativePath.split('/'));
  invariant(target.startsWith(`${recovery.root}${path.sep}`),
    `${relativePath} escapes recovery root`);
  const binding = await stableFile(target, {absolute: true,
    json: options.json});
  return Object.freeze({...binding, path: relativePath});
}

function normalizeText(value) {
  return value.replaceAll('&nbsp;', ' ').replaceAll('\u00a0', ' ')
    .replace(/\s+/gu, ' ').trim();
}

export function parseRecoveredKeyTerm(xmlText, sourceKeyAttribute) {
  invariant(['Restate', 'Question', 'Problem'].includes(sourceKeyAttribute),
    `unsupported recovered key term: ${sourceKeyAttribute}`);
  const escaped = sourceKeyAttribute.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const pattern = new RegExp(
    `<${escaped}~LNG~([^\\s>]+)\\s+([^>]*)>([\\s\\S]*?)<\\/${escaped}~LNG~\\1>`,
    'u',
  );
  const match = xmlText.match(pattern);
  invariant(match, `missing exact ${sourceKeyAttribute} key-term entry`);
  const attributes = Object.fromEntries([...match[2].matchAll(
    /([A-Za-z]+)\s*=\s*"([^"]*)"/gu,
  )].map((attribute) => [attribute[1], attribute[2]]));
  const definitions = match[3].split('~LNG~');
  invariant(definitions.length === 2 &&
    attributes.ScreenkeyTerm === sourceKeyAttribute &&
    attributes.ExFileName === `${sourceKeyAttribute}.swf`,
  `${sourceKeyAttribute} key-term entry shape drifted`);
  return Object.freeze({
    id: sourceKeyAttribute.toLowerCase(),
    sourceKeyAttribute,
    labels: Object.freeze({en: attributes.ScreenkeyTerm, es: match[1]}),
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

function eligibleSet(rows) {
  const projection = rows.map((row) => [row.animationId, row.stableLessonKey,
    row.keyTerms.english, row.keyTerms.spanish].join('|')).join('\n') + '\n';
  return Object.freeze({sha256: sha256(projection), projection});
}

async function expectedRecovery() {
  const recovery = await recoveryRoot();
  const [catalog, ts02Audit, builder, appliedReceipt, acquisitionReceipt,
    memberManifest] = await Promise.all([
    stableFile(CATALOG, {json: true}),
    stableFile(TS02_AUDIT, {json: true}),
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
    invariant(object.bytes === expected.bytes &&
      object.sha256 === expected.sha256,
    `selected key-term CAS object drifted: ${expected.sha256}`);
    xmlByRole.set(expected.localeRole, object.buffer.toString('utf8'));
    sources.push(Object.freeze({
      localeRole: expected.localeRole,
      reference: expected.reference,
      containerMember: Object.freeze({
        path: expected.pathDisplay,
        ordinal: expected.ordinal,
        bytes: expected.bytes,
        sha256: expected.sha256,
      }),
      casObject: descriptor(object, expected.contentObjectPath),
    }));
  }
  const terms = ['Restate', 'Question', 'Problem'].map((key) => {
    const english = parseRecoveredKeyTerm(xmlByRole.get('en'), key);
    const spanish = parseRecoveredKeyTerm(xmlByRole.get('es'), key);
    invariant(JSON.stringify({...english, exactEntrySha256: null}) ===
      JSON.stringify({...spanish, exactEntrySha256: null}),
    `${key} bilingual XML projections disagree`);
    return Object.freeze({
      ...english,
      sourceEntrySha256: Object.freeze({
        en: english.exactEntrySha256,
        es: spanish.exactEntrySha256,
      }),
    });
  });
  invariant(ts02Audit.value.status ===
    'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked' &&
    ts02Audit.value.scope.ts02Placements === 44 &&
    ts02Audit.value.registrationCandidatePlacementCount === 0,
  'TS02 source audit boundary drifted');
  const all = catalog.value.lessons.flatMap((lesson) => {
    const page = lesson.pages.find((candidate) =>
      /\/TS\/L\d+TS02\.swf$/u.test(candidate.viewPath));
    return page ? [Object.freeze({
      animationId: page.animationId,
      stableLessonKey: lesson.stableLessonKey,
      moduleCode: lesson.moduleCode,
      lessonNumber: lesson.lessonNumber,
      keyTerms: lesson.keyTerms,
    })] : [];
  }).sort((left, right) => compareText(left.animationId, right.animationId));
  const eligible = all.filter((row) =>
    row.keyTerms.english === SELECTED_MEMBERS[0].reference &&
    row.keyTerms.spanish === SELECTED_MEMBERS[1].reference);
  const blocked = all.filter((row) => !eligible.includes(row));
  const selected = eligibleSet(eligible);
  invariant(all.length === 44 && eligible.length === 15 &&
    blocked.length === 29 &&
    selected.sha256 === EXPECTED_ELIGIBLE_SET_SHA256,
  'TS02 L1 key-term eligibility set drifted');
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-ts02-l1-keyterm-recovery-v1',
    recoveryId: 'g678-ts02-l1-keyterm-recovery-v1',
    status:
      'private-custody-recovery-verified-local-only-product-calibration-pending',
    inputs: Object.freeze({
      catalog: descriptor(catalog),
      ts02Audit: descriptor(ts02Audit),
      builder: descriptor(builder),
      appliedCustodyReceipt: descriptor(appliedReceipt, APPLIED_RECEIPT),
      acquisitionReceipt: descriptor(acquisitionReceipt,
        ACQUISITION_RECEIPT),
      memberManifest: descriptor(memberManifest, MEMBER_MANIFEST),
    }),
    recoveryRoot: Object.freeze({
      environmentVariable: RECOVERY_ENV,
      ...recovery.identity,
      sourceMutationPerformed: false,
    }),
    custodyBoundary: Object.freeze({
      status: appliedReceipt.value.status,
      boundary: appliedReceipt.value.boundary,
      canonicalSourcePromotionAuthorized: false,
      localOnlyDerivedProductCalibrationAuthorized: false,
    }),
    selectedSources: Object.freeze(sources),
    terms: Object.freeze(terms),
    eligibility: Object.freeze({
      eligiblePlacementCount: eligible.length,
      blockedPlacementCount: blocked.length,
      eligiblePlacementSetSha256: EXPECTED_ELIGIBLE_SET_SHA256,
      eligible: Object.freeze(eligible),
      blocked: Object.freeze(blocked.map((row) => Object.freeze({
        ...row,
        blocker: 'lesson-referenced-key-term-XML-not-recovered',
      }))),
    }),
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    registrationCandidatePlacementCount: 0,
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'The two XML objects are private custody evidence and are not promoted into the canonical source tree.',
      'Only 15 TS02 placements reference the recovered L1 English and Spanish XML pair; the other 29 remain blocked.',
      'Legacy sublinks and example SWFs are recorded but are not yet implemented or accepted.',
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

export async function auditTs02L1Keyterms({check = false} = {}) {
  const artifact = await expectedRecovery();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await stableFile(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'TS02 L1 key-term recovery audit drifted');
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
    eligiblePlacementCount: artifact.eligibility.eligiblePlacementCount,
    blockedPlacementCount: artifact.eligibility.blockedPlacementCount,
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    registrationCandidatePlacementCount: 0,
    acceptanceEffects: FALSE_EFFECTS,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-ts02-l1-keyterms.mjs [--check]');
  auditTs02L1Keyterms({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
