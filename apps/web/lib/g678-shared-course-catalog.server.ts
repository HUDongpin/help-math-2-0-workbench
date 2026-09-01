import 'server-only';

import {createHash} from 'node:crypto';
import {existsSync, readFileSync, statSync} from 'node:fs';
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
  readonly sourceViewPath?: string | null;
  readonly canonicalRootRule?: Readonly<Record<string, unknown>>;
  readonly alternateRootRules?: readonly Readonly<Record<string, unknown>>[];
  readonly archiveReceipts?: readonly Readonly<Record<string, unknown>>[];
  readonly moduleDefinitions?: readonly Readonly<Record<string, unknown>>[];
  readonly toolchainVersions?: Readonly<Record<string, unknown>>;
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
  readonly sourceProjectionValid: boolean;
  readonly gradeMappingAuthorityApproved: boolean;
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

function positiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
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

/**
 * Validate the checked-in source projection before the web adapter marks a
 * shared lesson as source-backed.  This is deliberately stricter than the
 * display projection: a catalog with the right aggregate counts but a
 * tampered XML/page/audio identity must remain locked and non-runnable.
 */
export function sharedCatalogProjectionIsValid(value: unknown): boolean {
  const root = record(value);
  if (root.schemaVersion !== 1 || root.catalogKind !== 'help-math-g678-shared-source-catalog' ||
      root.gradeScope !== 'G6-G8-shared' || root.canonicalLessonXmlCount !== 44 ||
      root.activePagePlacementCount !== 2282 || root.uniqueActiveSwfSha256Count !== 2240) {
    return false;
  }
  const audit = record(root.audit);
  const fileCounts = record(audit.canonicalFileCounts);
  if (audit.sourceRootKind !== 'private-external-read-only' ||
      asArray(audit.missingSources).length !== 0 ||
      asArray(audit.unknownSwfMagic).length !== 0 ||
      asArray(audit.classificationHashDrift).length !== 0 ||
      audit.commentedPageCount !== 315 || audit.bomXmlCount !== 39 ||
      audit.bareAmpersandCount !== 7 || audit.variantPlacements !== 46 ||
      audit.dependencyHolds !== 92 || audit.audioCandidatePages !== 2133 ||
      audit.audioGroupedCandidateCount !== 5562 ||
      audit.geoAlternateLessonCount !== 1 || audit.geoAlternateActivePageCount !== 59 ||
      fileCounts.swf !== 2776 || fileCounts.mp3 !== 13353 ||
      fileCounts.fla !== 0 || fileCounts.xml !== 44) return false;
  const lessons = asArray(root.lessons).map(record);
  if (lessons.length !== 44) return false;
  const seenLessons = new Set<string>();
  const seenPlacements = new Set<string>();
  const seenSourcePaths = new Set<string>();
  const seenAudioCueIds = new Set<string>();
  const seenGroupedAudioIds = new Set<string>();
  const seenGroupedAudioSources = new Set<string>();
  let pageTotal = 0;
  let groupedAudioTotal = 0;
  for (const lesson of lessons) {
    const moduleCode = moduleValue(lesson.moduleCode);
    const lessonNumber = integerValue(lesson.lessonNumber);
    const expectedLessonCount = moduleCode ? EXPECTED_LESSON_COUNTS.get(moduleCode) ?? 0 : 0;
    const expectedPages = moduleCode ? EXPECTED_LESSON_PAGE_COUNTS.get(moduleCode)?.[Number(lessonNumber) - 1] : undefined;
    const stableLessonKey = moduleCode && lessonNumber
      ? `shared-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, '0')}`
      : null;
    const key = moduleCode && lessonNumber
      ? `${moduleCode}:${lessonNumber}`
      : null;
    const sourceXml = record(lesson.sourceXml);
    const expectedXmlPath = moduleCode && lessonNumber
      ? `G6-G8-shared/${moduleCode}/L${lessonNumber}/index.xml`
      : null;
    const sourceXmlSha256 = stringValue(sourceXml.sha256)?.toLowerCase();
    if (!moduleCode || !lessonNumber || !key || seenLessons.has(key) ||
        lesson.stableLessonKey !== stableLessonKey ||
        lessonNumber > expectedLessonCount || lesson.activePageCount !== expectedPages ||
        lesson.pagePlacementCount !== expectedPages || !Array.isArray(lesson.pages) ||
        lesson.pages.length !== expectedPages ||
        !expectedXmlPath || sourceXml.path !== expectedXmlPath ||
        !sourceXmlSha256 || !SHA256.test(sourceXmlSha256) ||
        sourceXml.sha256 !== sourceXmlSha256 ||
        !positiveSafeInteger(sourceXml.bytes) ||
        lesson.sourceXmlPath !== expectedXmlPath ||
        lesson.sourceXmlSha256 !== sourceXmlSha256) {
      return false;
    }
    seenLessons.add(key);
    pageTotal += lesson.pages.length;

    const groupedCandidates = asArray(lesson.audioGroupedCandidates);
    groupedAudioTotal += groupedCandidates.length;
    for (const groupedValue of groupedCandidates) {
      const grouped = record(groupedValue);
      const groupedId = stringValue(grouped.id);
      const groupedSource = stringValue(grouped.source);
      const groupedSourcePath = stringValue(grouped.sourcePath);
      const groupedViewPath = stringValue(grouped.viewPath);
      const groupedSha256 = stringValue(grouped.sha256)?.toLowerCase();
      const groupedRelativePath = groupedSourcePath?.replace(/^HELP_COURSES\//u, '');
      const expectedGroupedViewPath = groupedRelativePath
        ? `G6-G8-shared/${groupedRelativePath}`
        : null;
      if (!groupedId || seenGroupedAudioIds.has(groupedId) ||
          !groupedSource || !groupedSourcePath || seenGroupedAudioSources.has(groupedSourcePath) ||
          groupedSource !== groupedSourcePath ||
          !groupedSha256 || !SHA256.test(groupedSha256) || grouped.sha256 !== groupedSha256 ||
          !positiveSafeInteger(grouped.bytes) ||
          grouped.sourceRootKind !== 'canonical' ||
          grouped.classificationStatus !== 'resolved-canonical' ||
          grouped.binding !== 'FQ/EA' || grouped.language !== 'undetermined' ||
          grouped.required !== null || grouped.acceptance !== 'candidate-index-only' ||
          grouped.matchDisposition !== 'unmatched-page-basename' ||
          !expectedGroupedViewPath || groupedViewPath !== expectedGroupedViewPath ||
          !groupedSourcePath.startsWith(`HELP_COURSES/${moduleCode}/L${lessonNumber}/`) ||
          !groupedViewPath.startsWith(`G6-G8-shared/${moduleCode}/L${lessonNumber}/`)) {
        return false;
      }
      for (const field of ['startSemantics', 'hostTrigger', 'stopOrCompleteSemantics', 'replayBehavior']) {
        if (typeof grouped[field] !== 'string' || grouped[field].length === 0) return false;
      }
      seenGroupedAudioIds.add(groupedId);
      seenGroupedAudioSources.add(groupedSourcePath);
    }

    for (const [pageIndex, pageValue] of lesson.pages.entries()) {
      const page = record(pageValue);
      const placementId = stringValue(page.placementId);
      const sourceSha = stringValue(page.sourceSha256)?.toLowerCase();
      const expectedPlacementId = `${stableLessonKey}-p${String(pageIndex + 1).padStart(3, '0')}`;
      const reference = stringValue(page.reference)?.replaceAll('\\', '/');
      const expectedSourcePath = reference
        ? `HELP_COURSES/${moduleCode}/L${lessonNumber}/${reference}`
        : null;
      const expectedViewPath = reference
        ? `G6-G8-shared/${moduleCode}/L${lessonNumber}/${reference}`
        : null;
      const pageCandidates = asArray(page.audioCueCandidates);
      const pageAudioIds = asArray(page.audioCueIds);
      if (!placementId || placementId !== expectedPlacementId || seenPlacements.has(placementId) ||
          page.stableLessonKey !== stableLessonKey || page.moduleCode !== moduleCode ||
          page.lessonNumber !== lessonNumber ||
          page.xmlOccurrence !== pageIndex + 1 ||
          page.globalOrdinal !== pageIndex + 1 ||
          !reference || reference.startsWith('/') || reference.startsWith('../') || reference.includes('/../') ||
          !sourceSha || !SHA256.test(sourceSha) ||
          page.sourceSha256 !== sourceSha ||
          page.assetId !== `swf-${sourceSha}` ||
          !positiveSafeInteger(page.sourceBytes) ||
          page.animationId !== placementId ||
          page.sourceStatus !== 'resolved-canonical' ||
          page.sourceRootKind !== 'canonical' || page.variantOf !== null ||
          !expectedSourcePath || page.sourcePath !== expectedSourcePath ||
          page.expectedPath !== expectedSourcePath || page.viewPath !== expectedViewPath ||
          !Array.isArray(page.audioCueCandidates) || !Array.isArray(page.audioCueIds) ||
          pageAudioIds.length !== pageCandidates.length ||
          pageAudioIds.some((id, index) => id !== record(pageCandidates[index]).id) ||
          seenSourcePaths.has(page.sourcePath)) return false;
      seenSourcePaths.add(page.sourcePath);

      const pageCandidateIds = new Set<string>();
      for (const candidateValue of pageCandidates) {
        const candidate = record(candidateValue);
        const candidateId = stringValue(candidate.id);
        const candidateSource = stringValue(candidate.source);
        const candidateSourcePath = stringValue(candidate.sourcePath);
        const candidateViewPath = stringValue(candidate.viewPath);
        const candidateSha256 = stringValue(candidate.sha256)?.toLowerCase();
        const candidateRelativePath = candidateSourcePath?.replace(/^HELP_COURSES\//u, '');
        const expectedCandidateViewPath = candidateRelativePath
          ? `G6-G8-shared/${candidateRelativePath}`
          : null;
        const binding = candidate.binding;
        if (!candidateId || pageCandidateIds.has(candidateId) || seenAudioCueIds.has(candidateId) ||
            !candidateSource || !candidateSourcePath || candidateSource !== candidateSourcePath ||
            !candidateViewPath || candidateViewPath !== expectedCandidateViewPath ||
            !candidateSha256 || !SHA256.test(candidateSha256) || candidate.sha256 !== candidateSha256 ||
            !positiveSafeInteger(candidate.bytes) ||
            candidate.sourceRootKind !== 'canonical' ||
            candidate.classificationStatus !== 'resolved-canonical' ||
            candidate.language !== 'undetermined' || candidate.required !== null ||
            candidate.acceptance !== 'candidate-index-only' ||
            !['FQ/EA', 'FQ/SA', 'lesson-SA'].includes(String(binding)) ||
            candidate.bindingKind !== `${String(binding)}-candidate` ||
            candidate.durationMs !== null || candidate.frameDomain !== null ||
            !candidateSourcePath.startsWith(`HELP_COURSES/${moduleCode}/L${lessonNumber}/`) ||
            !candidateViewPath.startsWith(`G6-G8-shared/${moduleCode}/L${lessonNumber}/`)) {
          return false;
        }
        for (const field of ['startSemantics', 'hostTrigger', 'stopOrCompleteSemantics', 'replayBehavior']) {
          if (typeof candidate[field] !== 'string' || candidate[field].length === 0) return false;
        }
        pageCandidateIds.add(candidateId);
        seenAudioCueIds.add(candidateId);
      }
      seenPlacements.add(placementId);
    }
  }
  const acceptanceEffects = record(root.acceptanceEffects);
  const requiredAcceptanceKeys = [
    'canonicalSourcePromoted', 'currentJavaScriptRegistered',
    'authoritativeOriginalRuntime', 'visualFidelityAccepted', 'audioAccepted',
    'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'released',
    'published',
  ];
  return seenLessons.size === 44 && pageTotal === 2282 && seenPlacements.size === 2282 &&
    groupedAudioTotal === 5562 && seenGroupedAudioIds.size === 5562 &&
    requiredAcceptanceKeys.every((key) => Object.hasOwn(acceptanceEffects, key) && acceptanceEffects[key] === false);
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

function fileSha256(root: string, relativePath: string): string | null {
  if (typeof relativePath !== 'string' || path.isAbsolute(relativePath)) return null;
  const absolutePath = path.resolve(root, relativePath);
  const relative = path.relative(root, absolutePath);
  if (relative === '..' || relative.startsWith(`..${path.sep}`)) return null;
  if (!existsSync(absolutePath)) return null;
  try {
    return createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
  } catch {
    return null;
  }
}

function safeRelativePath(root: string, value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0 || path.isAbsolute(value)) return null;
  const absolute = path.resolve(root, value);
  const relative = path.relative(root, absolute);
  if (relative === '..' || relative.startsWith(`..${path.sep}`)) return null;
  return relative.split(path.sep).join('/');
}

function hasApprovedGradeMapping(
  root: string,
  mappingPath: string | null,
): boolean {
  if (mappingPath === null) return false;
  const report = record(readJson(root, 'reports/g678-grade-mapping-readiness.json'));
  const ccss = record(report.ccss);
  const summary = record(report.summary);
  const source = record(report.source);
  const profilePath = 'catalog/g678-shared-source-profile.v1.json';
  const mappingRelativePath = 'catalog/g678-grade-mapping.v1.json';
  const snapshotPath = safeRelativePath(root, ccss.snapshotPath);
  const receiptPath = safeRelativePath(root, ccss.authorityReceiptPath);
  const snapshotSha256 = stringValue(ccss.snapshotSha256)?.toLowerCase();
  const receiptSha256 = stringValue(ccss.authorityReceiptSha256)?.toLowerCase();
  const receipt = receiptPath ? record(readJson(root, receiptPath)) : {};
  const records = Array.isArray(report.records) ? report.records : [];
  const profile = record(readJson(root, profilePath));
  const profileSourceManifestSha256 = stringValue(
    profile.sourceManifestSha256 ?? record(profile.witnesses)['classification-manifest.jsonl'],
  )?.toLowerCase();
  const profileMappingManifestSha256 = stringValue(profile.mappingManifestSha256)?.toLowerCase();
  const currentMappingSha256 = fileSha256(root, mappingRelativePath);
  const catalog = record(readJson(root, 'catalog/g678-shared-catalog.v1.json'));
  const generatedFrom = record(catalog.generatedFrom);
  const expected = record(profile.expected);
  // Grade approval is downstream of the exact source projection.  Bind the
  // readiness report to the canonical profile and to the checked-in catalog;
  // a locally edited report/profile pair must not unlock routes merely by
  // preserving the public profile ID.
  if (
    profile.schemaVersion !== 1 ||
    profile.artifactType !== 'help-math-g678-shared-source-profile' ||
    profile.profileId !== 'g678-shared-source-profile-v1' ||
    profile.version !== 'G6-G8-shared-v1' ||
    !profileSourceManifestSha256 || !SHA256.test(profileSourceManifestSha256) ||
    !profileMappingManifestSha256 || !SHA256.test(profileMappingManifestSha256) ||
    expected.canonicalLessonXmlCount !== 44 ||
    expected.activePagePlacementCount !== 2282 ||
    expected.uniqueActiveSwfSha256Count !== 2240 ||
    catalog.schemaVersion !== 1 ||
    catalog.catalogKind !== 'help-math-g678-shared-source-catalog' ||
    catalog.profileId !== profile.profileId ||
    catalog.profileVersion !== profile.version ||
    generatedFrom.sourceManifestSha256 !== profileSourceManifestSha256 ||
    !sharedCatalogProjectionIsValid(catalog)
  ) return false;
  const expectedRecordKeys = new Set(
    G678_SHARED_MODULES.flatMap((module) =>
      Array.from({length: module.lessonCount}, (_value, index) =>
        `${module.code}:${index + 1}`)),
  );
  const recordKeys = new Set<string>();
  const recordsReady = records.length === 44 && records.every((entry) => {
    const item = record(entry);
    const moduleCode = moduleValue(item.moduleCode);
    const lessonNumber = integerValue(item.lessonNumber);
    const recordKey = moduleCode && lessonNumber ? `${moduleCode}:${lessonNumber}` : null;
    if (!recordKey || recordKeys.has(recordKey)) return false;
    recordKeys.add(recordKey);
    return item.ready === true && item.status === 'approved' &&
      item.mappingVersion === ccss.mappingVersion &&
      item.sourceManifestSha256 === profileSourceManifestSha256 &&
      expectedRecordKeys.has(recordKey) &&
      gradeValue(item.primaryGrade) !== null &&
      Array.isArray(item.ccssStandardCodes) && item.ccssStandardCodes.length > 0 &&
      Array.isArray(item.blockers) && item.blockers.length === 0;
  });
  const receiptValid = receipt.schemaVersion === 1 &&
    receipt.artifactType === 'ccss-authority-receipt-v1' &&
    receipt.status === 'approved' &&
    receipt.mappingVersion === ccss.mappingVersion &&
    receipt.snapshotSha256 === snapshotSha256 &&
    typeof receipt.reviewerId === 'string' && receipt.reviewerId.trim().length > 0 &&
    typeof receipt.reviewedAt === 'string' && receipt.reviewedAt.length > 0 &&
    Boolean(receiptPath && receiptSha256 && fileSha256(root, receiptPath) === receiptSha256);
  return report.artifactType === 'help-math-g678-grade-mapping-readiness' &&
    report.schemaVersion === 1 &&
    ccss.mappingVersion === 'ccss-math-2010-v1' &&
    summary.gradeRouteGenerationAllowed === true &&
    ccss.status === 'authority-approved' &&
    typeof ccss.authorityReviewer === 'string' && ccss.authorityReviewer.trim().length > 0 &&
    Boolean(snapshotPath && snapshotSha256 && fileSha256(root, snapshotPath) === snapshotSha256) &&
    receiptValid && recordsReady &&
    source.profilePath === profilePath &&
    source.mappingPath === mappingRelativePath &&
    source.profileSha256 === fileSha256(root, profilePath) &&
    source.mappingSha256 === fileSha256(root, mappingRelativePath) &&
    profileMappingManifestSha256 !== null &&
    profileMappingManifestSha256 === currentMappingSha256 &&
    source.sourceManifestSha256 === profileSourceManifestSha256 &&
    recordKeys.size === expectedRecordKeys.size &&
    mappingPath === mappingRelativePath;
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
      sourceProjectionValid: false,
      gradeMappingAuthorityApproved: false,
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
  const sourceProfilePath = 'catalog/g678-shared-source-profile.v1.json';
  const sourceProfile = record(readJson(root, sourceProfilePath));
  const sourceProfileManifestSha256 = stringValue(sourceProfile.sourceManifestSha256 ??
    record(sourceProfile.witnesses)['classification-manifest.jsonl'])?.toLowerCase();
  const sourceProfileMappingSha256 = stringValue(sourceProfile.mappingManifestSha256)?.toLowerCase();
  const generatedFrom = record(profileRoot.generatedFrom);
  const sourceProfileBindingValid = sourceProfile.schemaVersion === 1 &&
    sourceProfile.artifactType === 'help-math-g678-shared-source-profile' &&
    sourceProfile.profileId === 'g678-shared-source-profile-v1' &&
    sourceProfile.version === 'G6-G8-shared-v1' &&
    SHA256.test(sourceProfileManifestSha256 ?? '') &&
    SHA256.test(sourceProfileMappingSha256 ?? '') &&
    record(sourceProfile.expected).canonicalLessonXmlCount === 44 &&
    record(sourceProfile.expected).activePagePlacementCount === 2282 &&
    record(sourceProfile.expected).uniqueActiveSwfSha256Count === 2240 &&
    generatedFrom.sourceManifestSha256 === sourceProfileManifestSha256 &&
    fileSha256(root, 'catalog/g678-grade-mapping.v1.json') === sourceProfileMappingSha256;
  const catalogProjectionValid = profilePath === 'catalog/g678-shared-catalog.v1.json' &&
    sourceProfileBindingValid
    ? sharedCatalogProjectionIsValid(profileValue)
    : false;
  const gradeMappingAuthorityApproved = hasApprovedGradeMapping(root, mappingPath);
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
        gradeMappingAuthorityApproved ? mappingRecords.get(key) : undefined,
        moduleDefinition,
        lesson,
        mappingVersion,
      );
      // The profile is a source-custody projection.  It can establish that a
      // card is source-backed even while the per-page SWF SHA values and grade
      // mapping remain pending; those downstream gates stay fail-closed.
      lessons.push(catalogProjectionValid && profileIsRecognized && !normalized.sourceBacked
        ? Object.freeze({...normalized, sourceBacked: true})
        : catalogProjectionValid && profileIsRecognized
          ? normalized
          : Object.freeze({...normalized, sourceBacked: false}));
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
    sourceProjectionValid: catalogProjectionValid,
    gradeMappingAuthorityApproved,
    lessons: Object.freeze(lessons),
  });
}

let snapshot: SharedMiddleSchoolCatalogSnapshot | undefined;
let snapshotFingerprint: string | undefined;

function currentSnapshotFingerprint(root: string): string {
  const paths = [
    'catalog/g678-shared-catalog.v1.json',
    'catalog/g678-shared-source-profile.v1.json',
    'catalog/g678-grade-mapping.v1.json',
    'reports/g678-grade-mapping-readiness.json',
  ];
  return paths.map((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    try {
      const stat = statSync(absolutePath);
      return `${relativePath}:${stat.size}:${stat.mtimeMs}`;
    } catch {
      return `${relativePath}:missing`;
    }
  }).join('|');
}

/** Returns the immutable source-backed (or explicitly marked fallback) view. */
export function sharedMiddleSchoolCatalog(): SharedMiddleSchoolCatalogSnapshot {
  if (process.env.NODE_ENV === 'production') {
    return readSnapshot();
  }
  const root = getWorkspaceRoot();
  const fingerprint = currentSnapshotFingerprint(root);
  if (!snapshot || snapshotFingerprint !== fingerprint) {
    snapshot = readSnapshot();
    snapshotFingerprint = fingerprint;
  }
  return snapshot;
}

export function sharedMiddleSchoolLessonCatalog(): readonly SharedMiddleSchoolLesson[] {
  return sharedMiddleSchoolCatalog().lessons;
}

/**
 * A mapping record marked approved is not enough to create a grade route.
 * The readiness report must also be hash-bound to the current profile and
 * mapping bytes and carry an independently issued CCSS authority receipt.
 */
export function isG678GradeMappingAuthorityApproved(): boolean {
  return sharedMiddleSchoolCatalog().gradeMappingAuthorityApproved;
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
