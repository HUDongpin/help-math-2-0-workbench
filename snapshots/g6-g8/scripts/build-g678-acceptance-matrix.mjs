#!/usr/bin/env node

/**
 * Build a read-only, source-bound acceptance funnel for the G6–G8 shared
 * scope.  This is a reporting command: it never promotes a candidate, signs
 * a human/Owner decision, or mutates completion/release ledgers.
 */

import {createHash} from 'node:crypto';
import {access, mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SHA256 = /^[a-f0-9]{64}$/u;
const DEFAULT_RELEASE_MANIFEST = 'catalog/g678-page-only-release-manifest.v1.json';
const DEFAULT_GOVERNANCE = 'catalog/g678-review-governance.v1.json';
const MODULES = Object.freeze({
  NMS002: 12,
  GEO001: 12,
  ALG001: 12,
  DAT001: 8,
});
const EXPECTED_PAGES = Object.freeze({
  NMS002: 638,
  GEO001: 595,
  ALG001: 647,
  DAT001: 402,
});
const EXPECTED_LESSON_PAGES = Object.freeze({
  NMS002: Object.freeze([47, 64, 56, 45, 49, 51, 52, 60, 53, 49, 47, 65]),
  GEO001: Object.freeze([59, 51, 49, 44, 51, 54, 63, 47, 44, 42, 52, 39]),
  ALG001: Object.freeze([56, 58, 56, 53, 63, 60, 62, 50, 41, 52, 44, 52]),
  DAT001: Object.freeze([56, 53, 63, 39, 61, 46, 50, 34]),
});

function fail(message) {
  const error = new Error(message);
  error.name = 'G678AcceptanceMatrixError';
  throw error;
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

function string(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function integer(value) {
  if (Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/u.test(value)) return Number(value);
  return null;
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function parseLocalOnlyRegistryMetadata(source) {
  const keyBlock = source.match(
    /export const registeredLocalOnlyAnimationKeys:[\s\S]*?:\s*Object\.freeze\(\[([\s\S]*?)\]\);/u,
  );
  if (!keyBlock) fail('local generated registry key block is invalid');
  const keys = [...keyBlock[1].matchAll(/'(shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3})'/gu)]
    .map((match) => match[1]);
  const records = new Map();
  const registrationPattern = /'(shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3})': Object\.freeze\(\{maturity: 'private-current-js', scope: 'private-engineering', deploymentScope: 'local-only', calibrationId: '([^']+)', freezeManifestSha256: '([a-f0-9]{64})', moduleSha256: '([a-f0-9]{64})', timelineSha256: '([a-f0-9]{64})', runtimeSha256: '([a-f0-9]{64})'\}\)/gu;
  for (const match of source.matchAll(registrationPattern)) {
    if (records.has(match[1])) fail('local generated registry repeats a key');
    records.set(match[1], Object.freeze({calibrationId: match[2],
      freezeManifestSha256: match[3], moduleSha256: match[4],
      timelineSha256: match[5], runtimeSha256: match[6]}));
  }
  if (keys.length !== new Set(keys).size || records.size !== keys.length ||
      JSON.stringify([...records.keys()].sort()) !==
        JSON.stringify([...keys].sort())) {
    fail('local generated registry key and metadata sets differ');
  }
  return Object.freeze({keys: Object.freeze(keys), records});
}

function resolveProjectPath(value, label) {
  if (!value) fail(`${label} is required`);
  const resolved = path.isAbsolute(value)
    ? path.resolve(value)
    : path.resolve(PROJECT_ROOT, value);
  const relative = path.relative(PROJECT_ROOT, resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`)) {
    fail(`${label} must remain inside the project root`);
  }
  return resolved;
}

async function readJson(filePath, label) {
  let bytes;
  try {
    bytes = await readFile(filePath);
  } catch (error) {
    fail(`${label} cannot be read: ${error.message}`);
  }
  let value;
  try {
    value = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
  return {value, bytes, sha256: sha256(bytes)};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function recordsFrom(value) {
  const root = object(value);
  const records = [];
  const add = (entries) => {
    for (const entry of entries) {
      const candidate = object(entry);
      if (Object.keys(candidate).length) records.push(candidate);
    }
  };
  add(array(root.lessons));
  add(array(root.entries));
  add(array(root.records));
  for (const module of array(root.modules)) {
    const item = object(module);
    add(array(item.lessons));
    add(array(item.entries));
  }
  const nested = object(root.catalog);
  add(array(nested.lessons));
  add(array(nested.entries));
  return records;
}

function moduleOf(record) {
  const direct = string(record.moduleCode ?? record.module)?.toUpperCase();
  if (direct && Object.hasOwn(MODULES, direct)) return direct;
  const sourcePath = string(
    record.sourceXmlPath ?? record.xmlPath ?? record.source?.path ?? record.path,
  );
  const match = sourcePath?.match(/(?:^|[/\\])(NMS002|GEO001|ALG001|DAT001)(?:[/\\]|$)/u);
  return match?.[1] ?? null;
}

function lessonOf(record) {
  const direct = integer(
    record.moduleLesson ?? record.lessonNumber ?? record.lesson,
  );
  if (direct) return direct;
  const sourcePath = string(
    record.sourceXmlPath ?? record.xmlPath ?? record.source?.path ?? record.path,
  );
  return integer(sourcePath?.match(/(?:^|[/\\])L(\d{1,2})(?:[/\\]|$)/iu)?.[1]);
}

function lessonKey(moduleCode, lesson) {
  return moduleCode && lesson
    ? `shared-${moduleCode.toLowerCase()}-l${String(lesson).padStart(2, '0')}`
    : null;
}

function statusOf(record) {
  const raw = string(record.status ?? record.mappingStatus)?.toLowerCase();
  if (raw === 'approved' || raw === 'accepted' || raw === 'mapped') return 'approved';
  if (raw === 'needs-adjudication' || raw === 'needs_adjudication' || raw === 'review') return 'needs-adjudication';
  if (raw === 'rejected') return 'rejected';
  return 'pending';
}

function primaryGradeOf(record) {
  const value = integer(record.primaryGrade ?? record.grade);
  return value === 6 || value === 7 || value === 8 ? value : null;
}

function mappingIndex(mappingValue) {
  const index = new Map();
  for (const record of recordsFrom(mappingValue)) {
    const module = moduleOf(record);
    const lesson = lessonOf(record);
    if (module && lesson) index.set(`${module}:${lesson}`, record);
  }
  return index;
}

function sourceIndex(profileValue) {
  const index = new Map();
  for (const record of recordsFrom(profileValue)) {
    const module = moduleOf(record);
    const lesson = lessonOf(record);
    if (module && lesson) index.set(`${module}:${lesson}`, record);
  }
  return index;
}

function pageCount(source, module, lesson) {
  const explicit = integer(
    source?.activePageCount ?? source?.pageCount ?? source?.pagesCount,
  );
  if (explicit) return explicit;
  const counts = source?.activePageCounts;
  if (Array.isArray(counts) && integer(counts[lesson - 1])) return integer(counts[lesson - 1]);
  return EXPECTED_LESSON_PAGES[module]?.[lesson - 1] ?? EXPECTED_PAGES[module] ?? null;
}

function lessonRecord({module, lesson, source, mapping,
  registeredPageCount = 0}) {
  const key = lessonKey(module, lesson);
  const mappingStatus = statusOf(mapping ?? {});
  const primaryGrade = primaryGradeOf(mapping ?? {});
  const approved = mappingStatus === 'approved' && primaryGrade !== null;
  const sourceXmlPath = string(
    source?.sourceXmlPath ?? source?.xmlPath ?? source?.sourceXml?.path ?? source?.source?.path,
  );
  const sourceXmlSha256 = string(
    source?.sourceXmlSha256 ?? source?.xmlSha256 ?? source?.sourceXml?.sha256 ?? source?.source?.sha256,
  )?.toLowerCase() ?? null;
  const pages = array(source?.pages ?? source?.placements);
  const registeredPages = pages.filter((page) => {
    const item = object(page);
    return item.registered === true || item.currentJavaScriptRegistered === true ||
      object(item.rendererAvailability).kind === 'registered';
  }).length;
  const declaredRegistered = integer(source?.registeredPageCount ?? source?.currentJsPageCount);
  const activePageCount = pageCount(source, module, lesson) ?? EXPECTED_PAGES[module] ?? 0;
  const registrationCount = Math.max(registeredPages, declaredRegistered ?? 0,
    registeredPageCount);
  const engineeringPreview = approved && registrationCount === activePageCount && activePageCount > 0;
  const availability = engineeringPreview ? 'engineering-preview' : 'locked';
  return {
    stableLessonKey: key,
    moduleCode: module,
    lessonNumber: lesson,
    primaryGrade: approved ? primaryGrade : null,
    gradeTags: array(mapping?.gradeTags ?? mapping?.grades)
      .map(integer)
      .filter((value) => value === 6 || value === 7 || value === 8),
    mappingStatus,
    sourceXmlPath,
    sourceXmlSha256: sourceXmlSha256 && SHA256.test(sourceXmlSha256) ? sourceXmlSha256 : null,
    activePageCount,
    registeredPageCount: registrationCount,
    availability,
    evidenceBoundary: engineeringPreview
      ? 'Current-JS engineering preview; original-runtime, fidelity, audio, human/Owner, strict and release remain pending.'
      : mappingStatus === 'approved'
        ? 'Common Core mapping approved; complete Current-JS registration is pending.'
        : 'Common Core grade mapping is pending independent review; no learner route is available.',
    acceptance: {
      originalRuntime: false,
      behavior: false,
      fidelity: false,
      audio: false,
      humanVisual: false,
      owner: false,
      strictComplete: false,
      released: false,
      published: false,
    },
  };
}

export function buildMatrix({
  profile,
  mapping,
  profileIdentity,
  mappingIdentity,
  releaseIdentity = null,
  governanceIdentity = null,
  calibrationEvidence = null,
  registeredByLesson = new Map(),
}) {
  const sourceRecords = sourceIndex(profile);
  const mappings = mappingIndex(mapping);
  const lessons = [];
  for (const [module, count] of Object.entries(MODULES)) {
    for (let lesson = 1; lesson <= count; lesson += 1) {
      lessons.push(lessonRecord({
        module,
        lesson,
        source: sourceRecords.get(`${module}:${lesson}`),
        mapping: mappings.get(`${module}:${lesson}`),
        registeredPageCount:
          registeredByLesson.get(lessonKey(module, lesson)) ?? 0,
      }));
    }
  }
  const funnel = {
    lessons: lessons.length,
    activePagePlacements: lessons.reduce((sum, item) => sum + item.activePageCount, 0),
    registeredCurrentJsPages: lessons.reduce((sum, item) => sum + item.registeredPageCount, 0),
    engineeringPreviewLessons: lessons.filter((item) => item.availability === 'engineering-preview').length,
    mappingApprovedLessons: lessons.filter((item) => item.mappingStatus === 'approved').length,
    originalRuntimeEvidencePages: 0,
    fidelityAcceptedPages: 0,
    audioAcceptedPages: 0,
    humanVisualAcceptedLessons: 0,
    ownerAcceptedLessons: 0,
    strictCompleteLessons: 0,
    releasedLessons: 0,
    publishedLessons: 0,
  };
  return {
    $schema: '../schemas/g678-acceptance-matrix-v1.schema.json',
    schemaVersion: 1,
    artifactType: 'help-math-g678-acceptance-matrix',
    matrixId: calibrationEvidence
      ? 'g678-current-js-calibration-funnel-v1'
      : 'g678-acceptance-matrix-v1',
    generatedAt: new Date().toISOString(),
    source: {
      catalogPath: profileIdentity.path,
      catalogSha256: profileIdentity.sha256,
      mappingPath: mappingIdentity.path,
      mappingSha256: mappingIdentity.sha256,
      releaseManifestPath: releaseIdentity?.path ?? null,
      releaseManifestSha256: releaseIdentity?.sha256 ?? null,
      governancePath: governanceIdentity?.path ?? null,
      governanceSha256: governanceIdentity?.sha256 ?? null,
      ...(calibrationEvidence ? {
        calibrationFreezePath: calibrationEvidence.freeze.path,
        calibrationFreezeSha256: calibrationEvidence.freeze.sha256,
        privateRegistryPath: calibrationEvidence.privateRegistry.path,
        privateRegistrySha256: calibrationEvidence.privateRegistry.sha256,
        localRegistryPath: calibrationEvidence.localRegistry.path,
        localRegistrySha256: calibrationEvidence.localRegistry.sha256,
        advancedFragmentPath: calibrationEvidence.advancedFragment.path,
        advancedFragmentSha256: calibrationEvidence.advancedFragment.sha256,
        ...(calibrationEvidence.ts03FamilyCalibration ? {
          ts03FamilyCalibrationPath:
            calibrationEvidence.ts03FamilyCalibration.path,
          ts03FamilyCalibrationSha256:
            calibrationEvidence.ts03FamilyCalibration.sha256,
        } : {}),
        ...(calibrationEvidence.ts02FamilyCalibration ? {
          ts02FamilyCalibrationPath:
            calibrationEvidence.ts02FamilyCalibration.path,
          ts02FamilyCalibrationSha256:
            calibrationEvidence.ts02FamilyCalibration.sha256,
        } : {}),
        ...(calibrationEvidence.ts04FamilyCalibration ? {
          ts04FamilyCalibrationPath:
            calibrationEvidence.ts04FamilyCalibration.path,
          ts04FamilyCalibrationSha256:
            calibrationEvidence.ts04FamilyCalibration.sha256,
        } : {}),
        ...(calibrationEvidence.ts05FamilyCalibration ? {
          ts05FamilyCalibrationPath:
            calibrationEvidence.ts05FamilyCalibration.path,
          ts05FamilyCalibrationSha256:
            calibrationEvidence.ts05FamilyCalibration.sha256,
        } : {}),
      } : {}),
      scope: calibrationEvidence
        ? 'canonical-active-page-only-with-private-local-calibration'
        : 'canonical-active-page-only',
      legacyCourseShellExcluded: true,
    },
    sourceAudit: {
      canonicalLessonXmlCount: integer(profile.canonicalLessonXmlCount) ?? 0,
      activePagePlacementCount: integer(profile.activePagePlacementCount) ?? 0,
      uniqueActiveSwfSha256Count: integer(profile.uniqueActiveSwfSha256Count) ?? 0,
      commentedPageCount: integer(profile.audit?.commentedPageCount) ?? 0,
      bomXmlCount: integer(profile.audit?.bomXmlCount) ?? 0,
      bareAmpersandCount: integer(profile.audit?.bareAmpersandCount) ?? 0,
      canonicalSwfCount: integer(profile.audit?.canonicalFileCounts?.swf) ?? 0,
      canonicalMp3Count: integer(profile.audit?.canonicalFileCounts?.mp3) ?? 0,
      canonicalFlaCount: integer(profile.audit?.canonicalFileCounts?.fla) ?? 0,
      missingSources: array(profile.audit?.missingSources).length,
      unknownSwfMagic: array(profile.audit?.unknownSwfMagic).length,
      variantPlacements: integer(profile.audit?.variantPlacements) ?? 0,
      dependencyHolds: integer(profile.audit?.dependencyHolds) ?? 0,
      audioCandidatePages: integer(profile.audit?.audioCandidatePages) ?? 0,
      audioGroupedCandidateCount: integer(profile.audit?.audioGroupedCandidateCount) ?? 0,
      geoAlternateLessonCount: integer(profile.audit?.geoAlternateLessonCount) ?? 0,
      geoAlternateActivePageCount: integer(profile.audit?.geoAlternateActivePageCount) ?? 0,
      acceptanceNeutral: true,
    },
    funnel,
    ...(calibrationEvidence ? {calibration: calibrationEvidence.summary} : {}),
    lessons,
    acceptanceEffects: {
      currentJavaScriptRegistered: false,
      authoritativeOriginalRuntime: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      released: false,
      published: false,
    },
  };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const options = {
    profile: 'catalog/g678-shared-catalog.v1.json',
    mapping: 'catalog/g678-grade-mapping.v1.json',
    release: DEFAULT_RELEASE_MANIFEST,
    governance: DEFAULT_GOVERNANCE,
    calibrationFreeze: null,
    privateRegistry: null,
    localRegistry: null,
    advancedFragment: null,
    ts03FamilyCalibration: null,
    ts02FamilyCalibration: null,
    ts04FamilyCalibration: null,
    ts05FamilyCalibration: null,
    output: 'reports/g678-acceptance-matrix.json',
    check: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--check') {
      options.check = true;
      continue;
    }
    if (flag === '--help' || flag === '-h') {
      options.help = true;
      continue;
    }
    const values = {
      '--catalog': 'profile',
      '--profile': 'profile',
      '--mapping': 'mapping',
      '--release': 'release',
      '--release-manifest': 'release',
      '--governance': 'governance',
      '--calibration-freeze': 'calibrationFreeze',
      '--private-registry': 'privateRegistry',
      '--local-registry': 'localRegistry',
      '--advanced-fragment': 'advancedFragment',
      '--ts03-family-calibration': 'ts03FamilyCalibration',
      '--ts02-family-calibration': 'ts02FamilyCalibration',
      '--ts04-family-calibration': 'ts04FamilyCalibration',
      '--ts05-family-calibration': 'ts05FamilyCalibration',
      '--output': 'output',
    };
    const key = values[flag];
    if (!key) fail(`unknown argument: ${flag}`);
    if (index + 1 >= argv.length) fail(`${flag} requires a value`);
    options[key] = argv[++index];
  }
  return options;
}

async function build(options) {
  const profilePath = resolveProjectPath(options.profile, 'profile');
  const mappingPath = resolveProjectPath(options.mapping, 'mapping');
  const releasePath = resolveProjectPath(options.release, 'release manifest');
  const governancePath = resolveProjectPath(options.governance, 'governance');
  const outputPath = resolveProjectPath(options.output, 'output');
  const profile = await readJson(profilePath, 'profile');
  const mapping = await readJson(mappingPath, 'mapping');
  const release = await readJson(releasePath, 'release manifest');
  const governance = await readJson(governancePath, 'governance');
  const calibrationOptions = [options.calibrationFreeze,
    options.privateRegistry, options.localRegistry, options.advancedFragment,
    options.ts03FamilyCalibration, options.ts02FamilyCalibration,
    options.ts04FamilyCalibration, options.ts05FamilyCalibration];
  if (calibrationOptions.some(Boolean) && !calibrationOptions.every(Boolean)) {
    fail('calibration evidence requires freeze, private registry, local registry, and advanced fragment together');
  }
  if (release.value?.sourceOfTruth?.catalogSha256 !== profile.sha256 ||
      release.value?.sourceOfTruth?.mappingSha256 !== mapping.sha256 ||
      release.value?.sourceOfTruth?.catalogPath !== portable(path.relative(PROJECT_ROOT, profilePath)) ||
      release.value?.sourceOfTruth?.mappingPath !== portable(path.relative(PROJECT_ROOT, mappingPath))) {
    fail('release manifest is not bound to the selected catalog and mapping bytes');
  }
  if (release.value?.expectedCounts?.activeXmlReferencedPages !== 2282 ||
      release.value?.expectedCounts?.courseShells !== 0) {
    fail('release manifest has an unexpected page-only scope');
  }
  if (governance.value?.scope?.activePagePlacementCount !== 2282 ||
      governance.value?.scope?.legacyCourseShellExcluded !== true) {
    fail('governance scope is not bound to the G6-G8 page-only denominator');
  }
  let calibrationEvidence = null;
  const registeredByLesson = new Map();
  if (calibrationOptions.every(Boolean)) {
    const freezePath = resolveProjectPath(options.calibrationFreeze,
      'calibration freeze');
    const privateRegistryPath = resolveProjectPath(options.privateRegistry,
      'private registry');
    const localRegistryPath = resolveProjectPath(options.localRegistry,
      'local generated registry');
    const advancedFragmentPath = resolveProjectPath(options.advancedFragment,
      'advanced fragment');
    const ts03FamilyCalibrationPath = resolveProjectPath(
      options.ts03FamilyCalibration, 'TS03 family calibration');
    const ts02FamilyCalibrationPath = resolveProjectPath(
      options.ts02FamilyCalibration, 'TS02 family calibration');
    const ts04FamilyCalibrationPath = resolveProjectPath(
      options.ts04FamilyCalibration, 'TS04 family calibration');
    const ts05FamilyCalibrationPath = resolveProjectPath(
      options.ts05FamilyCalibration, 'TS05 family calibration');
    const [freeze, privateRegistry, localRegistry, advancedFragment,
      ts03FamilyCalibration, ts02FamilyCalibration, ts04FamilyCalibration,
      ts05FamilyCalibration] =
      await Promise.all([
        readJson(freezePath, 'calibration freeze'),
        readJson(privateRegistryPath, 'private registry'),
        readFile(localRegistryPath).then((bytes) => ({bytes,
          sha256: sha256(bytes), value: bytes.toString('utf8')})),
        readJson(advancedFragmentPath, 'advanced fragment'),
        readJson(ts03FamilyCalibrationPath, 'TS03 family calibration'),
        readJson(ts02FamilyCalibrationPath, 'TS02 family calibration'),
        readJson(ts04FamilyCalibrationPath, 'TS04 family calibration'),
        readJson(ts05FamilyCalibrationPath, 'TS05 family calibration'),
      ]);
    const calibrationId = 'g678-16-page-product-calibration-v1';
    const selectedPages = array(freeze.value?.selectedPages);
    const calibration = array(privateRegistry.value?.calibrations).find(
      (candidate) => candidate?.calibrationId === calibrationId,
    );
    const privateEntries = array(calibration?.entries);
    const selectedIds = selectedPages.map((page) => string(page?.animationId));
    const privateIds = privateEntries.map((entry) => string(entry?.key));
    const localMetadata = parseLocalOnlyRegistryMetadata(localRegistry.value);
    const advancedEntries = array(advancedFragment.value?.entries);
    const advancedIds = advancedEntries.map((entry) => string(entry?.key));
    const ts03AuthorizedIds = array(
      ts03FamilyCalibration.value?.authorizedPlacementIds,
    ).map(string);
    const ts02AuthorizedIds = array(
      ts02FamilyCalibration.value?.authorizedPlacementIds,
    ).map(string);
    const ts04AuthorizedIds = array(
      ts04FamilyCalibration.value?.authorizedPlacementIds,
    ).map(string);
    const ts05AuthorizedIds = array(
      ts05FamilyCalibration.value?.authorizedPlacementIds,
    ).map(string);
    const freezeInputs = object(freeze.value?.inputs);
    const predecessorDeclaration = object(freezeInputs.predecessorFreeze);
    const predecessorFreezePath = resolveProjectPath(
      predecessorDeclaration.path, 'predecessor calibration freeze');
    const predecessorFreeze = await readJson(predecessorFreezePath,
      'predecessor calibration freeze');
    const predecessorInputs = object(predecessorFreeze.value?.inputs);
    const predecessorProvisionalDeclaration = object(
      predecessorInputs.provisionalFreeze);
    const predecessorProvisionalPath = resolveProjectPath(
      predecessorProvisionalDeclaration.path,
      'predecessor provisional calibration freeze');
    const predecessorProvisionalFreeze = await readJson(
      predecessorProvisionalPath, 'predecessor provisional calibration freeze');
    const predecessorBrowserDeclaration = object(
      predecessorInputs.browserProductEvidence);
    const predecessorBrowserPath = resolveProjectPath(
      predecessorBrowserDeclaration.path, 'predecessor browser evidence');
    const predecessorBrowserEvidence = await readJson(predecessorBrowserPath,
      'predecessor browser evidence');
    const provisionalDeclaration = object(freezeInputs.provisionalFreeze);
    const provisionalFreezePath = resolveProjectPath(
      provisionalDeclaration.path, 'provisional calibration freeze');
    const provisionalFreeze = await readJson(provisionalFreezePath,
      'provisional calibration freeze');
    const browserDeclaration = object(freezeInputs.browserProductEvidence);
    const browserEvidencePath = resolveProjectPath(browserDeclaration.path,
      'browser product evidence');
    const browserEvidence = await readJson(browserEvidencePath,
      'browser product evidence');
    const exactInputDescriptor = (declaration, filePath, item) =>
      declaration.path === portable(path.relative(PROJECT_ROOT, filePath)) &&
      declaration.bytes === item.bytes.length &&
      declaration.sha256 === item.sha256;
    const glossaryProductPages = selectedPages.filter((page) =>
      ['ts02-l1-glossary-source-static',
        'ts03-l1-glossary-source-static',
        'ts04-l1-glossary-source-static',
        'ts05-l1-glossary-source-static'].includes(page?.adapterFamily));
    if (freeze.value?.calibrationId !== calibrationId ||
        freeze.value?.status !==
          'private-current-js-product-host-calibrated-candidates-registered' ||
        freeze.value?.frozenCalibrationPlacementCount !== 2282 ||
        freeze.value?.registrationCandidatePlacementCount !== 276 ||
        selectedPages.length !== 276 || new Set(selectedIds).size !== 276 ||
        calibration?.deploymentScope !== 'local-only' ||
        calibration?.freezeManifestSha256 !== freeze.sha256 ||
        privateEntries.length !== 276 ||
        JSON.stringify([...privateIds].sort()) !==
          JSON.stringify([...selectedIds].sort()) ||
        JSON.stringify([...localMetadata.keys].sort()) !==
          JSON.stringify([...selectedIds].sort()) ||
        advancedFragment.value?.calibrationId !== calibrationId ||
        advancedFragment.value?.generatedPrivateCurrentJsModuleCount !== 3 ||
        advancedFragment.value?.currentJavaScriptRegisteredCount !== 0 ||
        advancedFragment.value?.registryChanged !== false ||
        advancedFragment.value?.productCalibrationPassed !== false ||
        advancedFragment.value?.engineeringPreviewReady !== false ||
        advancedFragment.value?.scaleOutAuthorized !== false ||
        advancedEntries.length !== 3 || new Set(advancedIds).size !== 3 ||
        advancedIds.some((id) => !privateIds.includes(id)) ||
        ts03FamilyCalibration.value?.artifactType !==
          'g678-ts03-l1-family-calibration-v1' ||
        ts03FamilyCalibration.value?.status !==
          'exact-15-current-js-visual-glossary-product-host-calibrated' ||
        ts03AuthorizedIds.length !== 15 ||
        new Set(ts03AuthorizedIds).size !== 15 ||
        ts03AuthorizedIds.some((id) => !privateIds.includes(id)) ||
        ts03FamilyCalibration.value?.productHostCalibration
          ?.familyCurrentJsVisualGlossaryCalibrationPassed !== true ||
        ts03FamilyCalibration.value?.productHostCalibration
          ?.overallG678ProductCalibrationPassed !== false ||
        ts03FamilyCalibration.value?.inputs?.registrationFreeze?.path !==
          predecessorProvisionalDeclaration.path ||
        ts03FamilyCalibration.value?.inputs?.registrationFreeze?.sha256 !==
          predecessorProvisionalDeclaration.sha256 ||
        !Object.values(ts03FamilyCalibration.value?.acceptanceEffects ?? {})
          .every((value) => value === false) ||
        ts02FamilyCalibration.value?.artifactType !==
          'g678-ts02-l1-family-calibration-v1' ||
        ts02FamilyCalibration.value?.status !==
          'exact-15-current-js-visual-glossary-product-host-calibrated' ||
        ts02AuthorizedIds.length !== 15 ||
        new Set(ts02AuthorizedIds).size !== 15 ||
        ts02AuthorizedIds.some((id) => !privateIds.includes(id)) ||
        ts02FamilyCalibration.value?.productHostCalibration
          ?.familyCurrentJsVisualGlossaryCalibrationPassed !== true ||
        ts02FamilyCalibration.value?.productHostCalibration
          ?.overallG678ProductCalibrationPassed !== false ||
        ts02FamilyCalibration.value?.inputs?.registrationFreeze?.path !==
          predecessorProvisionalDeclaration.path ||
        ts02FamilyCalibration.value?.inputs?.registrationFreeze?.sha256 !==
          predecessorProvisionalDeclaration.sha256 ||
        !Object.values(ts02FamilyCalibration.value?.acceptanceEffects ?? {})
          .every((value) => value === false) ||
        ts04FamilyCalibration.value?.artifactType !==
          'g678-ts04-l1-family-calibration-v1' ||
        ts04FamilyCalibration.value?.status !==
          'exact-15-current-js-visual-glossary-product-host-calibrated' ||
        ts04AuthorizedIds.length !== 15 ||
        new Set(ts04AuthorizedIds).size !== 15 ||
        ts04AuthorizedIds.some((id) => !privateIds.includes(id)) ||
        ts04FamilyCalibration.value?.productHostCalibration
          ?.familyCurrentJsVisualGlossaryCalibrationPassed !== true ||
        ts04FamilyCalibration.value?.productHostCalibration
          ?.overallG678ProductCalibrationPassed !== false ||
        ts04FamilyCalibration.value?.inputs?.registrationFreeze?.path !==
          predecessorProvisionalDeclaration.path ||
        ts04FamilyCalibration.value?.inputs?.registrationFreeze?.sha256 !==
          predecessorProvisionalDeclaration.sha256 ||
        !Object.values(ts04FamilyCalibration.value?.acceptanceEffects ?? {})
          .every((value) => value === false) ||
        ts05FamilyCalibration.value?.artifactType !==
          'g678-ts05-l1-family-calibration-v1' ||
        ts05FamilyCalibration.value?.status !==
          'exact-15-current-js-visual-glossary-product-host-calibrated' ||
        ts05AuthorizedIds.length !== 15 ||
        new Set(ts05AuthorizedIds).size !== 15 ||
        ts05AuthorizedIds.some((id) => !privateIds.includes(id)) ||
        ts05FamilyCalibration.value?.productHostCalibration
          ?.familyCurrentJsVisualGlossaryCalibrationPassed !== true ||
        ts05FamilyCalibration.value?.productHostCalibration
          ?.overallG678ProductCalibrationPassed !== false ||
        ts05FamilyCalibration.value?.inputs?.registrationFreeze?.path !==
          provisionalDeclaration.path ||
        ts05FamilyCalibration.value?.inputs?.registrationFreeze?.sha256 !==
          provisionalDeclaration.sha256 ||
        !Object.values(ts05FamilyCalibration.value?.acceptanceEffects ?? {})
          .every((value) => value === false) ||
        !exactInputDescriptor(predecessorDeclaration, predecessorFreezePath,
          predecessorFreeze) ||
        predecessorFreeze.value?.registrationCandidatePlacementCount !== 261 ||
        !exactInputDescriptor(predecessorProvisionalDeclaration,
          predecessorProvisionalPath, predecessorProvisionalFreeze) ||
        predecessorProvisionalFreeze.value
          ?.registrationCandidatePlacementCount !== 261 ||
        !exactInputDescriptor(predecessorBrowserDeclaration,
          predecessorBrowserPath, predecessorBrowserEvidence) ||
        !exactInputDescriptor(provisionalDeclaration, provisionalFreezePath,
          provisionalFreeze) ||
        provisionalFreeze.value?.registrationCandidatePlacementCount !== 276 ||
        !exactInputDescriptor(browserDeclaration, browserEvidencePath,
          browserEvidence) ||
        browserEvidence.value?.artifactType !==
          'g678-current-js-276-browser-qa-v1' ||
        browserEvidence.value?.registeredCurrentJsPages !== 276 ||
        browserEvidence.value?.samples?.length !== 26 ||
        browserEvidence.value?.screenshots?.length !== 27 ||
        !exactInputDescriptor(object(predecessorInputs.ts02FamilyCalibration),
          ts02FamilyCalibrationPath, ts02FamilyCalibration) ||
        !exactInputDescriptor(object(predecessorInputs.ts03FamilyCalibration),
          ts03FamilyCalibrationPath, ts03FamilyCalibration) ||
        !exactInputDescriptor(object(predecessorInputs.ts04FamilyCalibration),
          ts04FamilyCalibrationPath, ts04FamilyCalibration) ||
        !exactInputDescriptor(object(freezeInputs.ts05FamilyCalibration),
          ts05FamilyCalibrationPath, ts05FamilyCalibration) ||
        [ts02FamilyCalibration, ts03FamilyCalibration,
          ts04FamilyCalibration].some((family) =>
          family.value?.inputs?.browser?.path !==
            predecessorBrowserDeclaration.path ||
          family.value?.inputs?.browser?.sha256 !==
            predecessorBrowserDeclaration.sha256) ||
        ts05FamilyCalibration.value?.inputs?.browser?.path !==
          browserDeclaration.path ||
        ts05FamilyCalibration.value?.inputs?.browser?.sha256 !==
          browserDeclaration.sha256 ||
        freeze.value?.productHostCalibration
          ?.familyCalibratedPlacementCount !== 60 ||
        freeze.value?.productHostCalibration
          ?.overallG678ProductCalibrationPassed !== false ||
        glossaryProductPages.length !== 60 ||
        glossaryProductPages.some((page) =>
          page?.implementation?.familyVisualPlaybackCalibrationPassed !== true ||
          page?.implementation
            ?.typedBilingualGlossaryProductHostCalibrationPassed !== true ||
          page?.implementation?.productCalibrationPassed !== false ||
          page?.productBlockers?.some((blocker) =>
            String(blocker).includes('browser-product-calibration-pending')))) {
      fail('calibration registration or advanced-manual boundary is invalid');
    }
    for (const entry of privateEntries) {
      const metadata = localMetadata.records.get(entry.key);
      if (!metadata || metadata.calibrationId !== calibrationId ||
          metadata.freezeManifestSha256 !== freeze.sha256 ||
          metadata.moduleSha256 !== entry.artifacts?.module?.sha256 ||
          metadata.timelineSha256 !== entry.artifacts?.timeline?.sha256 ||
          metadata.runtimeSha256 !== entry.artifacts?.runtime?.sha256) {
        fail(`local generated registry metadata drifted: ${entry.key}`);
      }
    }
    for (const page of selectedPages) {
      const key = string(page?.stableLessonKey);
      if (!key) fail('calibration selected page lesson key is missing');
      registeredByLesson.set(key, (registeredByLesson.get(key) ?? 0) + 1);
    }
    if (registeredByLesson.size !== 44 ||
        [...registeredByLesson.values()].some((count) => count <= 0) ||
        [...registeredByLesson.values()].reduce((sum, count) =>
          sum + count, 0) !== 276) {
      fail('calibration per-lesson registration vector is invalid');
    }
    for (const [key, count] of registeredByLesson) {
      const match = key.match(/^shared-(nms002|geo001|alg001|dat001)-l(\d{2})$/u);
      const moduleCode = match?.[1].toUpperCase();
      const lessonIndex = Number(match?.[2]) - 1;
      const active = EXPECTED_LESSON_PAGES[moduleCode]?.[lessonIndex];
      if (!active || count >= active) {
        fail(`calibration lesson is not a truthful partial: ${key}`);
      }
    }
    const identity = (filePath, item) => ({
      path: portable(path.relative(PROJECT_ROOT, filePath)),
      sha256: item.sha256,
    });
    calibrationEvidence = {
      freeze: identity(freezePath, freeze),
      privateRegistry: identity(privateRegistryPath, privateRegistry),
      localRegistry: identity(localRegistryPath, localRegistry),
      advancedFragment: identity(advancedFragmentPath, advancedFragment),
      ts03FamilyCalibration: identity(ts03FamilyCalibrationPath,
        ts03FamilyCalibration),
      ts02FamilyCalibration: identity(ts02FamilyCalibrationPath,
        ts02FamilyCalibration),
      ts04FamilyCalibration: identity(ts04FamilyCalibrationPath,
        ts04FamilyCalibration),
      ts05FamilyCalibration: identity(ts05FamilyCalibrationPath,
        ts05FamilyCalibration),
      summary: {
        calibrationId,
        frozenCalibrationPlacementCount: 2282,
        sharedGeneratedCandidatePages: 13,
        advancedGeneratedCandidatePages: 3,
        pureLinearScaleoutPages: 156,
        fq01FamilyPages: 44,
        ts03L1GlossaryPages: 15,
        ts03L1ProductHostCalibratedPages: 15,
        ts03L1FamilyProductHostCalibrationPassed: true,
        ts02L1GlossaryPages: 15,
        ts02L1ProductHostCalibratedPages: 15,
        ts02L1FamilyProductHostCalibrationPassed: true,
        ts04L1GlossaryPages: 15,
        ts04L1ProductHostCalibratedPages: 15,
        ts04L1FamilyProductHostCalibrationPassed: true,
        ts05L1GlossaryPages: 15,
        ts05L1ProductHostCalibratedPages: 15,
        ts05L1FamilyProductHostCalibrationPassed: true,
        totalProductHostCalibratedPages: 60,
        registeredCurrentJsPages: 276,
        localPagePreviews: 276,
        wholeLessonEngineeringPreviews: 0,
        advancedRegisteredPages: 3,
        scaleOutAuthorized: false,
        productCalibrationPassed: false,
      },
    };
  }
  const matrix = buildMatrix({
    profile: profile.value,
    mapping: mapping.value,
    profileIdentity: {path: portable(path.relative(PROJECT_ROOT, profilePath)), sha256: profile.sha256},
    mappingIdentity: {path: portable(path.relative(PROJECT_ROOT, mappingPath)), sha256: mapping.sha256},
    releaseIdentity: {path: portable(path.relative(PROJECT_ROOT, releasePath)), sha256: release.sha256},
    governanceIdentity: {path: portable(path.relative(PROJECT_ROOT, governancePath)), sha256: governance.sha256},
    calibrationEvidence,
    registeredByLesson,
  });
  if (options.check) {
    if (!(await exists(outputPath))) fail(`output does not exist: ${outputPath}`);
    const existing = await readFile(outputPath, 'utf8');
    const parsed = JSON.parse(existing);
    // generatedAt is intentionally ignored: check validates the deterministic
    // source-bound projection, not the timestamp of the report.
    const expected = {...matrix, generatedAt: parsed.generatedAt};
    if (stableJson(parsed) !== stableJson(expected)) fail('acceptance matrix drifted');
    return {ok: true, mode: 'check', output: portable(path.relative(PROJECT_ROOT, outputPath)), funnel: matrix.funnel};
  }
  await mkdir(path.dirname(outputPath), {recursive: true});
  if (await exists(outputPath)) fail(`output already exists; use --check or a new path: ${outputPath}`);
  const staging = `${outputPath}.staging-${process.pid}`;
  await writeFile(staging, stableJson(matrix), {flag: 'wx'});
  try {
    await rename(staging, outputPath);
  } catch (error) {
    // rename() is replacement-capable on some platforms.  Treat a race with
    // an existing destination as a fail-closed collision and retain the
    // staged report for diagnosis.
    if (error?.code === 'EEXIST' || await exists(outputPath)) {
      fail(`output appeared during atomic publish; staging retained at ${staging}`);
    }
    await rm(staging, {force: true}).catch(() => {});
    fail(`cannot atomically publish acceptance matrix: ${error.message}`);
  }
  return {ok: true, mode: 'build', output: portable(path.relative(PROJECT_ROOT, outputPath)), funnel: matrix.funnel};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: node scripts/build-g678-acceptance-matrix.mjs [--catalog <file>] [--mapping <file>] [--release <file>] [--governance <file>] [--calibration-freeze <file> --private-registry <file> --local-registry <file> --advanced-fragment <file> --ts03-family-calibration <file> --ts02-family-calibration <file> --ts04-family-calibration <file> --ts05-family-calibration <file>] [--output <file>] [--check]');
  } else {
    try {
      console.log(stableJson(await build(options)));
    } catch (error) {
      console.error(JSON.stringify({ok: false, error: error.message}, null, 2));
      process.exitCode = 1;
    }
  }
}
