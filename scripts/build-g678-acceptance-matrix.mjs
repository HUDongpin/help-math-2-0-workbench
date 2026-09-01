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

function lessonRecord({module, lesson, source, mapping}) {
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
  const registrationCount = Math.max(registeredPages, declaredRegistered ?? 0);
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
    matrixId: 'g678-acceptance-matrix-v1',
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
      scope: 'canonical-active-page-only',
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
  if (release.value?.sourceOfTruth?.catalogSha256 !== profile.sha256) {
    fail('release manifest is not bound to the selected catalog bytes');
  }
  if (release.value?.expectedCounts?.activeXmlReferencedPages !== 2282 ||
      release.value?.expectedCounts?.courseShells !== 0) {
    fail('release manifest has an unexpected page-only scope');
  }
  if (governance.value?.scope?.activePagePlacementCount !== 2282 ||
      governance.value?.scope?.legacyCourseShellExcluded !== true) {
    fail('governance scope is not bound to the G6-G8 page-only denominator');
  }
  const matrix = buildMatrix({
    profile: profile.value,
    mapping: mapping.value,
    profileIdentity: {path: portable(path.relative(PROJECT_ROOT, profilePath)), sha256: profile.sha256},
    mappingIdentity: {path: portable(path.relative(PROJECT_ROOT, mappingPath)), sha256: mapping.sha256},
    releaseIdentity: {path: portable(path.relative(PROJECT_ROOT, releasePath)), sha256: release.sha256},
    governanceIdentity: {path: portable(path.relative(PROJECT_ROOT, governancePath)), sha256: governance.sha256},
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
    console.log('Usage: node scripts/build-g678-acceptance-matrix.mjs [--catalog <file>] [--mapping <file>] [--release <file>] [--governance <file>] [--output <file>] [--check]');
  } else {
    try {
      console.log(stableJson(await build(options)));
    } catch (error) {
      console.error(JSON.stringify({ok: false, error: error.message}, null, 2));
      process.exitCode = 1;
    }
  }
}
