import 'server-only';

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';

import {getWorkspaceRoot} from './catalog';
export {
  isG678LocalPreviewEnabled,
  isG678ModuleCode,
} from './g678-preview-policy';

/**
 * The four middle-school module codes are a shared source scope.  They are
 * deliberately not grade identifiers: a reviewed Common Core mapping is
 * required before a learner route can be created.
 */
export const G678_SHARED_MODULES = Object.freeze([
  Object.freeze({
    code: 'NMS002',
    titleEnglish: 'Numbers Make Sense',
    lessonCount: 12,
    activePageCount: 638,
  }),
  Object.freeze({
    code: 'GEO001',
    titleEnglish: 'Geometry',
    lessonCount: 12,
    activePageCount: 595,
  }),
  Object.freeze({
    code: 'ALG001',
    titleEnglish: 'Algebra',
    lessonCount: 12,
    activePageCount: 647,
  }),
  Object.freeze({
    code: 'DAT001',
    titleEnglish: 'Data Analysis',
    lessonCount: 8,
    activePageCount: 402,
  }),
] as const);

export type G678SharedModuleCode =
  (typeof G678_SHARED_MODULES)[number]['code'];
export type G678Grade = 6 | 7 | 8;
export type G678MappingStatus =
  | 'pending'
  | 'approved'
  | 'needs-adjudication'
  | 'rejected';

/** Publicly typed projections of the source contracts; raw source bytes stay
 * outside the web bundle and are consumed only by the audit/factory tools. */
export interface SharedMiddleSchoolSourceProfileV1 {
  readonly schemaVersion: 1;
  readonly artifactType: 'help-math-g678-shared-source-profile';
  readonly profileId: string;
  readonly version: string;
  readonly sourceManifestSha256?: string | null;
  readonly mappingManifestSha256?: string | null;
  readonly sourceView: Readonly<Record<string, unknown>>;
  readonly modules: readonly Readonly<Record<string, unknown>>[];
  readonly expected: Readonly<Record<string, number>>;
}

export interface GradeMappingRecordV1 {
  readonly mappingId: string;
  readonly stableLessonKey: string;
  readonly moduleCode: G678SharedModuleCode;
  readonly lessonNumber: number;
  readonly primaryGrade: G678Grade | null;
  readonly gradeTags: readonly G678Grade[];
  readonly ccssStandardCodes: readonly string[];
  readonly evidence: readonly Readonly<Record<string, unknown>>[];
  readonly scoresByGrade: Readonly<Record<'6' | '7' | '8', number>>;
  readonly reviewers: readonly Readonly<Record<string, unknown>>[];
  readonly status: G678MappingStatus;
  readonly mappingVersion: string;
}

export interface SharedPagePlacementV1 {
  readonly placementId: string;
  readonly stableLessonKey: string;
  readonly moduleCode: G678SharedModuleCode;
  readonly lessonNumber: number;
  readonly sectionCode: string;
  readonly xmlOccurrence: number;
  readonly globalOrdinal: number;
  readonly animationId: string;
  readonly assetId: string;
  readonly sourcePath: string;
  readonly sourceSha256: string;
  readonly sourceRootKind: string;
  readonly variantDecision: string;
  readonly title: string | null;
  readonly navigation: string | null;
  readonly slideSpace: boolean;
  readonly randomAudio: string | null;
  readonly bgText: string | null;
  readonly behaviorLane: string;
  readonly audioCueIds: readonly string[];
}

export type SharedLessonAvailability =
  | 'source-mapping-pending'
  | 'engineering-preview'
  | 'strict-complete'
  | 'released';

export interface SharedMiddleSchoolLesson {
  readonly stableLessonKey: string;
  readonly moduleCode: G678SharedModuleCode;
  readonly moduleTitle: string;
  readonly moduleLesson: number;
  readonly sourceXmlPath: string | null;
  readonly sourceXmlSha256: string | null;
  readonly activePageCount: number;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly primaryGrade: G678Grade | null;
  readonly gradeTags: readonly G678Grade[];
  readonly ccssStandardCodes: readonly string[];
  readonly mappingStatus: G678MappingStatus;
  readonly mappingVersion: string | null;
  readonly sourceBacked: boolean;
  readonly courseKey: string | null;
  readonly pagePlacementCount: number;
}

export interface SharedMiddleSchoolCatalogSnapshot {
  readonly schemaVersion: 1;
  readonly profileId: string;
  readonly profilePath: string | null;
  readonly mappingPath: string | null;
  readonly sourceBacked: boolean;
  readonly lessons: readonly SharedMiddleSchoolLesson[];
}

type JsonRecord = Record<string, unknown>;

const MODULE_BY_CODE = new Map<string, (typeof G678_SHARED_MODULES)[number]>(
  G678_SHARED_MODULES.map((module) => [module.code, module]),
);

const EXPECTED_PAGE_COUNTS = new Map<string, number>([
  ['NMS002', 638],
  ['GEO001', 595],
  ['ALG001', 647],
  ['DAT001', 402],
]);

const EXPECTED_LESSON_COUNTS = new Map<string, number>([
  ['NMS002', 12],
  ['GEO001', 12],
  ['ALG001', 12],
  ['DAT001', 8],
]);

const EXPECTED_LESSON_PAGE_COUNTS = new Map<string, readonly number[]>([
  ['NMS002', Object.freeze([47, 64, 56, 45, 49, 51, 52, 60, 53, 49, 47, 65])],
  ['GEO001', Object.freeze([59, 51, 49, 44, 51, 54, 63, 47, 44, 42, 52, 39])],
  ['ALG001', Object.freeze([56, 58, 56, 53, 63, 60, 62, 50, 41, 52, 44, 52])],
  ['DAT001', Object.freeze([56, 53, 63, 39, 61, 46, 50, 34])],
]);

const SHA256 = /^[a-f0-9]{64}$/u;

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function integerValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : typeof value === 'string' && /^\d+$/u.test(value)
      ? Number(value)
      : null;
}

function gradeValue(value: unknown): G678Grade | null {
  const number = integerValue(value);
  return number === 6 || number === 7 || number === 8 ? number : null;
}

function moduleValue(value: unknown): G678SharedModuleCode | null {
  const normalized = stringValue(value)?.toUpperCase();
  return normalized && MODULE_BY_CODE.has(normalized)
    ? normalized as G678SharedModuleCode
    : null;
}

function moduleFromPath(value: unknown): G678SharedModuleCode | null {
  const pathValue = stringValue(value);
  if (!pathValue) return null;
  const match = pathValue.match(/(?:^|[/\\])(?:G6-G8-shared[/\\])?([A-Z]{3}\d{3})(?:[/\\]|$)/u);
  return moduleValue(match?.[1]);
}

function lessonFromPath(value: unknown): number | null {
  const pathValue = stringValue(value);
  if (!pathValue) return null;
  const match = pathValue.match(/(?:^|[/\\])L(\d{1,2})(?:[/\\]|$)/iu);
  return integerValue(match?.[1]);
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Accept the profile and mapping producer's small schema variations while
 * keeping the web projection read-only.  The source producer owns the
 * canonical schema; this adapter intentionally ignores unknown fields.
 */
function extractLessonRecords(value: unknown): readonly JsonRecord[] {
  const root = record(value);
  const records: JsonRecord[] = [];
  const add = (entries: readonly unknown[]) => {
    for (const entry of entries) {
      const candidate = record(entry);
      if (Object.keys(candidate).length > 0) records.push(candidate);
    }
  };

  add(asArray(root.lessons));
  add(asArray(root.entries));
  add(asArray(root.records));
  for (const moduleEntry of asArray(root.modules)) {
    const moduleRecord = record(moduleEntry);
    add(asArray(moduleRecord.lessons));
    add(asArray(moduleRecord.entries));
  }
  const catalog = record(root.catalog);
  add(asArray(catalog.lessons));
  add(asArray(catalog.entries));
  return records;
}

function readJson(root: string, relativePath: string): unknown | null {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  } catch {
    // A malformed or partially written optional catalog must not take down
    // the learner home page.  The resulting projection remains explicitly
    // sourceBacked=false and therefore cannot open a route.
    return null;
  }
}

function sourceXmlSha(recordValue: JsonRecord): string | null {
  const source = record(recordValue.source);
  const sourceXml = record(recordValue.sourceXml);
  const candidate = stringValue(
    recordValue.sourceXmlSha256 ??
    recordValue.xmlSha256 ??
    sourceXml.sha256 ??
    source.sha256,
  )?.toLowerCase();
  return candidate && SHA256.test(candidate) ? candidate : null;
}

function sourceXmlPath(recordValue: JsonRecord): string | null {
  const source = record(recordValue.source);
  const sourceXml = record(recordValue.sourceXml);
  return stringValue(
    recordValue.sourceXmlPath ??
    recordValue.xmlPath ??
    recordValue.path ??
    sourceXml.path ??
    source.path,
  );
}

function mappingStatus(recordValue: JsonRecord, primaryGrade: G678Grade | null): G678MappingStatus {
  const raw = stringValue(recordValue.mappingStatus ?? recordValue.status)?.toLowerCase();
  if (raw === 'approved' || raw === 'accepted' || raw === 'mapped') return 'approved';
  if (raw === 'rejected') return 'rejected';
  if (raw === 'needs-adjudication' || raw === 'needs_adjudication' || raw === 'review') {
    return 'needs-adjudication';
  }
  return primaryGrade ? 'needs-adjudication' : 'pending';
}

function normalizeLesson(
  sourceRecord: JsonRecord | undefined,
  mappingRecord: JsonRecord | undefined,
  fallbackModule: (typeof G678_SHARED_MODULES)[number],
  fallbackLesson: number,
  mappingVersion: string | null,
): SharedMiddleSchoolLesson {
  const source = sourceRecord ?? {};
  const mapping = mappingRecord ?? {};
  const moduleCode = moduleValue(
    mapping.moduleCode ?? mapping.module ?? source.moduleCode ?? source.module,
  ) ?? moduleFromPath(mapping.sourceXmlPath ?? mapping.path) ??
    moduleFromPath(source.sourceXmlPath ?? source.path) ?? fallbackModule.code;
  const moduleDefinition = MODULE_BY_CODE.get(moduleCode) ?? fallbackModule;
  const moduleLesson = integerValue(
    mapping.moduleLesson ?? mapping.lessonNumber ?? mapping.lesson ??
    source.moduleLesson ?? source.lessonNumber ?? source.lesson,
  ) ?? lessonFromPath(mapping.sourceXmlPath ?? mapping.path) ??
    lessonFromPath(source.sourceXmlPath ?? source.path) ?? fallbackLesson;
  const primaryGrade = gradeValue(mapping.primaryGrade ?? mapping.grade);
  const tags = [
    ...asArray(mapping.gradeTags ?? mapping.grades ?? source.gradeTags)
      .map(gradeValue)
      .filter((grade): grade is G678Grade => grade !== null),
    ...(primaryGrade ? [primaryGrade] : []),
  ];
  const gradeTags = Object.freeze([...new Set(tags)].sort((left, right) => left - right));
  const sourcePath = sourceXmlPath(source) ?? sourceXmlPath(mapping);
  const sourceSha256 = sourceXmlSha(source) ?? sourceXmlSha(mapping);
  const titleEnglish = stringValue(
    mapping.titleEnglish ?? mapping.lessonTitle ?? mapping.title ??
    source.titleEnglish ?? source.lessonTitleDisplay ?? source.lessonTitle ??
    source.lessonName ?? source.title,
    ) ?? `${moduleDefinition.titleEnglish} · Lesson ${moduleLesson}`;
  const titleSpanish = stringValue(
    mapping.titleSpanish ?? source.titleSpanish,
  );
  const pageCount = integerValue(
    source.activePageCount ?? source.pageCount ?? source.pagesCount ??
    mapping.activePageCount ?? mapping.pageCount,
  ) ?? EXPECTED_LESSON_PAGE_COUNTS.get(moduleCode)?.[moduleLesson - 1] ?? 0;
  const pages = asArray(source.pages).length || asArray(mapping.pages).length;
  const activePageCount = pages || pageCount;
  const status = mappingStatus(mapping, primaryGrade);
  const approved = status === 'approved' && primaryGrade !== null;
  const courseKey = approved
    ? stringValue(mapping.courseKey) ??
      `g${primaryGrade}-${moduleCode.toLowerCase()}-l${String(moduleLesson).padStart(2, '0')}`
    : null;
  return Object.freeze({
    stableLessonKey: stringValue(
      mapping.stableLessonKey ?? source.stableLessonKey,
    ) ?? `shared-${moduleCode.toLowerCase()}-l${String(moduleLesson).padStart(2, '0')}`,
    moduleCode,
    moduleTitle: moduleDefinition.titleEnglish,
    moduleLesson,
    sourceXmlPath: sourcePath,
    sourceXmlSha256: sourceSha256,
    activePageCount: activePageCount > 0 ? activePageCount :
      (EXPECTED_PAGE_COUNTS.get(moduleCode) ?? moduleDefinition.activePageCount),
    titleEnglish,
    titleSpanish,
    primaryGrade: approved ? primaryGrade : null,
    gradeTags,
    ccssStandardCodes: Object.freeze([
      ...new Set(asArray(mapping.ccssStandardCodes ?? mapping.ccssCodes ?? mapping.standards)
        .map(stringValue)
        .filter((code): code is string => code !== null)),
    ]),
    mappingStatus: status,
    mappingVersion: stringValue(mapping.mappingVersion) ?? mappingVersion,
    sourceBacked: Boolean(sourcePath && sourceSha256),
    courseKey,
    pagePlacementCount: activePageCount > 0 ? activePageCount :
      (EXPECTED_PAGE_COUNTS.get(moduleCode) ?? moduleDefinition.activePageCount),
  });
}

function sourceRecordsByKey(records: readonly JsonRecord[]) {
  const result = new Map<string, JsonRecord>();
  for (const candidate of records) {
    const moduleCode = moduleValue(candidate.moduleCode ?? candidate.module) ??
      moduleFromPath(candidate.sourceXmlPath ?? candidate.xmlPath ?? candidate.path);
    const lesson = integerValue(
      candidate.moduleLesson ?? candidate.lessonNumber ?? candidate.lesson,
    ) ?? lessonFromPath(candidate.sourceXmlPath ?? candidate.xmlPath ?? candidate.path);
    if (!moduleCode || !lesson) continue;
    result.set(`${moduleCode}:${lesson}`, candidate);
  }
  return result;
}

function mappingRecordsByKey(records: readonly JsonRecord[]) {
  const result = new Map<string, JsonRecord>();
  for (const candidate of records) {
    const moduleCode = moduleValue(candidate.moduleCode ?? candidate.module);
    const lesson = integerValue(
      candidate.moduleLesson ?? candidate.lessonNumber ?? candidate.lesson,
    );
    if (!moduleCode || !lesson) continue;
    result.set(`${moduleCode}:${lesson}`, candidate);
  }
  return result;
}

function readSnapshot(): SharedMiddleSchoolCatalogSnapshot {
  // The shared source projection is a local engineering artifact.  Return an
  // empty snapshot before touching the checked-in catalog in production so a
  // production build cannot accidentally trace or expose private G6-G8 source
  // metadata, even if the local preview flag is misconfigured.
  if (process.env.NODE_ENV === 'production') {
    return Object.freeze({
      schemaVersion: 1,
      profileId: 'g678-shared-production-closed',
      profilePath: null,
      mappingPath: null,
      sourceBacked: false,
      lessons: Object.freeze([]),
    });
  }
  const root = getWorkspaceRoot();
  const profileCandidates = [
    'catalog/g678-shared-catalog.v1.json',
    'catalog/g678-shared-source-profile.v1.json',
  ];
  const mappingCandidates = ['catalog/g678-grade-mapping.v1.json'];
  let profilePath: string | null = null;
  let profileValue: unknown | null = null;
  for (const candidate of profileCandidates) {
    const value = readJson(root, candidate);
    if (value === null) continue;
    profilePath = candidate;
    profileValue = value;
    break;
  }
  let mappingPath: string | null = null;
  let mappingValue: unknown | null = null;
  for (const candidate of mappingCandidates) {
    const value = readJson(root, candidate);
    if (value === null) continue;
    mappingPath = candidate;
    mappingValue = value;
    break;
  }

  const profileRoot = record(profileValue);
  const mappingRoot = record(mappingValue);
  const profileId = stringValue(profileRoot.profileId ?? profileRoot.catalogId) ??
    'g678-shared-catalog-fallback-v1';
  const mappingVersion = stringValue(
    mappingRoot.mappingVersion ?? profileRoot.mappingVersion,
  );
  const sourceRecords = sourceRecordsByKey(extractLessonRecords(profileValue));
  const mappingRecords = mappingRecordsByKey(extractLessonRecords(mappingValue));
  const profileIsRecognized = profilePath !== null &&
    profileRoot.schemaVersion === 1 &&
    (profileRoot.artifactType === 'help-math-g678-shared-source-profile' ||
      profileRoot.catalogKind === 'help-math-g678-shared-source-catalog') &&
    profileRoot.profileId === 'g678-shared-source-profile-v1';
  const lessons: SharedMiddleSchoolLesson[] = [];
  for (const moduleDefinition of G678_SHARED_MODULES) {
    const lessonCount = EXPECTED_LESSON_COUNTS.get(moduleDefinition.code) ?? moduleDefinition.lessonCount;
    for (let lesson = 1; lesson <= lessonCount; lesson += 1) {
      const key = `${moduleDefinition.code}:${lesson}`;
      const normalized = normalizeLesson(
        sourceRecords.get(key),
        mappingRecords.get(key),
        moduleDefinition,
        lesson,
        mappingVersion,
      );
      // The profile is a source-custody projection.  It can establish that a
      // card is source-backed even while the per-page SWF SHA values and grade
      // mapping remain pending; those downstream gates stay fail-closed.
      lessons.push(profileIsRecognized && !normalized.sourceBacked
        ? Object.freeze({...normalized, sourceBacked: true})
        : normalized);
    }
  }
  const moduleOrder = new Map(
    G678_SHARED_MODULES.map((moduleDefinition, index) => [moduleDefinition.code, index]),
  );
  lessons.sort((left, right) =>
    (moduleOrder.get(left.moduleCode) ?? Number.MAX_SAFE_INTEGER) -
      (moduleOrder.get(right.moduleCode) ?? Number.MAX_SAFE_INTEGER) ||
    left.moduleLesson - right.moduleLesson,
  );
  return Object.freeze({
    schemaVersion: 1,
    profileId,
    profilePath,
    mappingPath,
    sourceBacked: lessons.some((lesson) => lesson.sourceBacked),
    lessons: Object.freeze(lessons),
  });
}

let snapshot: SharedMiddleSchoolCatalogSnapshot | undefined;

/** Returns the immutable source-backed (or explicitly marked fallback) view. */
export function sharedMiddleSchoolCatalog(): SharedMiddleSchoolCatalogSnapshot {
  snapshot ??= readSnapshot();
  return snapshot;
}

export function sharedMiddleSchoolLessonCatalog(): readonly SharedMiddleSchoolLesson[] {
  return sharedMiddleSchoolCatalog().lessons;
}

export function sharedMiddleSchoolLessonKey(
  moduleCode: string,
  lesson: string | number,
): string | undefined {
  const normalizedModuleCode = moduleValue(moduleCode);
  const lessonNumber = integerValue(lesson);
  const lessonCount = normalizedModuleCode
    ? EXPECTED_LESSON_COUNTS.get(normalizedModuleCode) ?? 0
    : 0;
  if (!normalizedModuleCode || !lessonNumber || lessonNumber > lessonCount) return undefined;
  return `shared-${normalizedModuleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, '0')}`;
}

export function sharedMiddleSchoolCourseKey(
  grade: G678Grade,
  moduleCode: string,
  lesson: string | number,
): string | undefined {
  const normalizedModuleCode = moduleValue(moduleCode);
  const lessonNumber = integerValue(lesson);
  const lessonCount = normalizedModuleCode
    ? EXPECTED_LESSON_COUNTS.get(normalizedModuleCode) ?? 0
    : 0;
  if (!normalizedModuleCode || !lessonNumber || lessonNumber > lessonCount || ![6, 7, 8].includes(grade)) return undefined;
  return `g${grade}-${normalizedModuleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, '0')}`;
}
