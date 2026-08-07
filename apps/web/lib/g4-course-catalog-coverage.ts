import type {
  SourceBoundLabel,
  WholeLessonRendererAvailability,
} from './whole-lesson-player-descriptor';

type JsonRecord = Record<string, unknown>;

export interface Grade4CourseCatalogCoverageInput {
  readonly lessonsDocument: unknown;
  readonly animationsDocument: unknown;
  readonly missingReferencesDocument: unknown;
  readonly registeredAnimationKeys: readonly string[];
}

export type Grade4CatalogSourceStatus =
  | 'catalog-resolved-swf'
  | 'missing-canonical-swf';

export interface Grade4CourseCoveragePage {
  readonly globalPageOrdinal: number;
  readonly sectionPageOrdinal: number;
  readonly sectionCode: string;
  readonly sourceKey: string;
  readonly previousSourceKey: string | null;
  readonly nextSourceKey: string | null;
  readonly labels: Readonly<Record<'en' | 'es', SourceBoundLabel>>;
  readonly rendererAvailability: WholeLessonRendererAvailability;
  readonly source: Readonly<{
    status: Grade4CatalogSourceStatus;
    expectedPath: string;
    sourceXmlPath: string;
    sourceXmlSha256: string;
    sourceOccurrence: number;
    animationId: string | null;
    assetId: string | null;
    swfPath: string | null;
    swfSha256: string | null;
  }>;
}

export interface Grade4CourseCoverageSection {
  readonly order: number;
  readonly code: string;
  readonly activePageCount: number;
  readonly firstActiveSourceKey: string;
  readonly labels: Readonly<Record<'en' | 'es', SourceBoundLabel>>;
}

export interface Grade4CourseCoverageLesson {
  readonly schemaVersion: 1;
  readonly descriptorKind: 'catalog-source-and-renderer-coverage';
  readonly descriptorId: string;
  readonly grade: 4;
  readonly lesson: number;
  readonly titleEnglish: string;
  readonly source: Readonly<{
    lessonXmlPath: string;
    lessonXmlBytes: number;
    lessonXmlSha256: string;
    sequenceAuthority: 'course-xml-occurrence';
  }>;
  readonly shell: Readonly<{
    animationId: string;
    assetId: string;
    sourcePath: string;
    sourceSha256: string;
    rendererAvailability: WholeLessonRendererAvailability;
  }>;
  readonly sections: readonly Grade4CourseCoverageSection[];
  readonly pages: readonly Grade4CourseCoveragePage[];
  readonly counts: Readonly<{
    activePages: number;
    courseShells: 1;
    requiredMembers: number;
    catalogResolvedPages: number;
    missingSourcePages: number;
    currentJsPages: number;
    missingCurrentJsPages: number;
    currentJsShells: 0 | 1;
    missingCurrentJsShells: 0 | 1;
    currentJsMembers: number;
    missingCurrentJsMembers: number;
  }>;
  readonly readiness: Readonly<{
    sourceCoverageComplete: boolean;
    rendererCoverageComplete: boolean;
    registrationRequiresIndependentPlayerDescriptor: true;
  }>;
  readonly acceptanceEffects: Readonly<{
    authoritativeOriginalRuntime: false;
    fidelityAccepted: false;
    audioAccepted: false;
    humanVisualAccepted: false;
    ownerAccepted: false;
    strictComplete: false;
    published: false;
  }>;
}

export interface ValidGrade4CourseCatalogCoverage {
  readonly schemaVersion: 1;
  readonly status: 'valid';
  readonly lessons: readonly Grade4CourseCoverageLesson[];
  readonly summary: Readonly<{
    lessonCount: number;
    activePageCount: number;
    courseShellCount: number;
    requiredMemberCount: number;
    catalogResolvedPageCount: number;
    missingSourcePageCount: number;
    currentJsPageCount: number;
    missingCurrentJsPageCount: number;
    currentJsShellCount: number;
    missingCurrentJsShellCount: number;
    currentJsMemberCount: number;
    missingCurrentJsMemberCount: number;
    fullySourceResolvedLessonCount: number;
    rendererCoverageCompleteLessonCount: number;
  }>;
  readonly coverageAuthority: Readonly<{
    authorizesRouteRegistration: false;
    authorizesFidelity: false;
    authorizesStrictCompletion: false;
    authorizesPublication: false;
  }>;
}

export interface InvalidGrade4CourseCatalogCoverage {
  readonly schemaVersion: 1;
  readonly status: 'invalid';
  readonly lessons: readonly [];
  readonly diagnostics: readonly string[];
}

export type Grade4CourseCatalogCoverage =
  | ValidGrade4CourseCatalogCoverage
  | InvalidGrade4CourseCatalogCoverage;

interface ParsedLessonSection {
  readonly order: number;
  readonly code: string;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly pageReferenceCount: number;
}

interface ParsedLesson {
  readonly lesson: number;
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly pageRoot: string;
  readonly titleEnglish: string;
  readonly pageReferenceCount: number;
  readonly sections: readonly ParsedLessonSection[];
}

interface PageCandidate {
  readonly globalPageOrdinal: number;
  readonly sectionPageOrdinal: number;
  readonly sectionCode: string;
  readonly titleEnglish: string;
  readonly titleSpanish: string | null;
  readonly expectedPath: string;
  readonly sourceXmlPath: string;
  readonly sourceStatus: Grade4CatalogSourceStatus;
  readonly animationId: string | null;
  readonly assetId: string | null;
  readonly swfPath: string | null;
  readonly swfSha256: string | null;
}

const SHA256 = /^[a-f0-9]{64}$/;

function record(value: unknown): JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function integer(value: unknown): number | null {
  return Number.isSafeInteger(value) ? Number(value) : null;
}

function exactEnglishLabel(value: string): SourceBoundLabel {
  return Object.freeze({
    text: value,
    sourceLanguage: 'en',
    sourceStatus: 'exact-page-title',
    usesEnglishFallback: false,
  });
}

function pageSpanishLabel(
  english: string,
  spanish: string | null,
): SourceBoundLabel {
  return spanish
    ? Object.freeze({
        text: spanish,
        sourceLanguage: 'es',
        sourceStatus: 'exact-page-title',
        usesEnglishFallback: false,
      })
    : Object.freeze({
        text: english,
        sourceLanguage: 'en',
        sourceStatus: 'missing-page-level-spanish-title',
        usesEnglishFallback: true,
      });
}

function sectionLabel(
  english: string,
  spanish: string | null,
  locale: 'en' | 'es',
): SourceBoundLabel {
  if (locale === 'es' && spanish) {
    return Object.freeze({
      text: spanish,
      sourceLanguage: 'es',
      sourceStatus: 'exact-course-xml',
      usesEnglishFallback: false,
    });
  }
  return Object.freeze({
    text: english,
    sourceLanguage: 'en',
    sourceStatus:
      locale === 'es'
        ? 'missing-spanish-source-label'
        : 'exact-course-xml',
    usesEnglishFallback: locale === 'es',
  });
}

function rendererAvailability(
  animationId: string | null,
  registeredAnimationKeys: ReadonlySet<string>,
): WholeLessonRendererAvailability {
  if (animationId === null) {
    return Object.freeze({
      kind: 'unavailable',
      reason: 'source-not-in-canonical-catalog',
    });
  }
  return registeredAnimationKeys.has(animationId)
    ? Object.freeze({kind: 'registered', moduleKey: animationId})
    : Object.freeze({
        kind: 'unavailable',
        reason: 'animation-module-not-registered',
      });
}

function invalid(diagnostics: readonly string[]): InvalidGrade4CourseCatalogCoverage {
  return Object.freeze({
    schemaVersion: 1,
    status: 'invalid',
    lessons: Object.freeze([] as const),
    diagnostics: Object.freeze([...new Set(diagnostics)].sort()),
  });
}

function parseLessons(
  documentValue: unknown,
  diagnostics: string[],
): readonly ParsedLesson[] {
  const document = record(documentValue);
  if (document.schemaVersion !== 1 || !Array.isArray(document.lessons)) {
    diagnostics.push('catalog/lessons.json is not a schema-v1 lessons document');
    return [];
  }

  const gradeFour = document.lessons
    .map(record)
    .filter((lesson) => lesson.grade === 4)
    .sort((left, right) => (integer(left.lesson) ?? 0) - (integer(right.lesson) ?? 0));
  if (
    gradeFour.length !== 12 ||
    gradeFour.some((lesson, index) => lesson.lesson !== index + 1)
  ) {
    diagnostics.push('Grade 4 lesson scope must be exactly lessons 1 through 12');
    return [];
  }

  return gradeFour.flatMap((lesson): ParsedLesson[] => {
    const lessonNumber = integer(lesson.lesson);
    const path = text(lesson.path);
    const bytes = integer(lesson.bytes);
    const sha256 = text(lesson.sha256);
    const pageRoot = text(lesson.pageRoot);
    const titleEnglish = text(lesson.titleDisplay);
    const pageReferenceCount = integer(lesson.pageReferenceCount);
    const sectionCount = integer(lesson.sectionCount);
    const sectionValues = array(lesson.sections).map(record);
    if (
      lessonNumber === null ||
      path !== `HELP_COURSES/ELMGR4/L${lessonNumber}/index.xml` ||
      bytes === null || bytes <= 0 ||
      !sha256 || !SHA256.test(sha256) ||
      pageRoot !== `HELP_COURSES/ELMGR4/L${lessonNumber}` ||
      !titleEnglish ||
      pageReferenceCount === null || pageReferenceCount < 1 ||
      sectionCount === null || sectionCount < 1 ||
      sectionValues.length !== sectionCount
    ) {
      diagnostics.push(`Grade 4 lesson ${lessonNumber ?? '?'} catalog identity is malformed`);
      return [];
    }

    const sections = sectionValues.flatMap((section, index): ParsedLessonSection[] => {
      const order = integer(section.number);
      const code = text(section.code);
      const english = text(section.titleEnglish);
      const spanish = text(section.titleSpanish);
      const count = integer(section.pageReferenceCount);
      if (
        order !== index + 1 ||
        !code || !english ||
        count === null || count < 1
      ) {
        diagnostics.push(`Grade 4 lesson ${lessonNumber} section ${index + 1} is malformed`);
        return [];
      }
      return [{
        order,
        code,
        titleEnglish: english,
        titleSpanish: spanish,
        pageReferenceCount: count,
      }];
    });
    if (
      sections.length !== sectionValues.length ||
      new Set(sections.map((section) => section.code)).size !== sections.length ||
      sections.reduce((sum, section) => sum + section.pageReferenceCount, 0) !==
        pageReferenceCount
    ) {
      diagnostics.push(`Grade 4 lesson ${lessonNumber} section counts do not bind its page count`);
      return [];
    }
    return [{
      lesson: lessonNumber,
      path,
      bytes,
      sha256,
      pageRoot,
      titleEnglish,
      pageReferenceCount,
      sections: Object.freeze(sections),
    }];
  });
}

function resolvedPageCandidate(
  animationValue: unknown,
  referenceValue: unknown,
  lesson: ParsedLesson,
  diagnostics: string[],
): PageCandidate | null {
  const animation = record(animationValue);
  const reference = record(referenceValue);
  const classification = record(animation.classification);
  const section = record(classification.section);
  const page = record(classification.page);
  const source = record(animation.source);
  const flags = record(animation.flags);
  const occurrence = integer(reference.occurrence);
  const expectedPath = text(reference.expectedPath);
  const animationId = text(animation.animationId);
  const assetId = text(animation.assetId);
  const swfPath = text(source.path);
  const swfSha256 = text(source.sha256);
  const sectionCode = text(section.code);
  const sectionPageOrdinal = integer(page.ordinal);
  const titleEnglish = text(classification.titleEnglish) ??
    text(classification.titleDisplay);
  const titleSpanish = text(classification.titleSpanish);
  if (
    occurrence === null || occurrence < 1 ||
    !expectedPath ||
    reference.sourceXmlPath !== lesson.path ||
    !animationId || !assetId ||
    animation.isCanonical !== true ||
    flags.shell === true || flags.variant === true ||
    classification.collection !== 'course' ||
    classification.grade !== 4 ||
    classification.lesson !== lesson.lesson ||
    !sectionCode ||
    sectionPageOrdinal === null || sectionPageOrdinal < 1 ||
    !titleEnglish ||
    swfPath !== expectedPath ||
    !swfSha256 || !SHA256.test(swfSha256) ||
    assetId !== `swf-${swfSha256}`
  ) {
    diagnostics.push(
      `${lesson.path} occurrence ${occurrence ?? '?'} has a malformed resolved source binding`,
    );
    return null;
  }
  return {
    globalPageOrdinal: occurrence,
    sectionPageOrdinal,
    sectionCode,
    titleEnglish,
    titleSpanish,
    expectedPath,
    sourceXmlPath: lesson.path,
    sourceStatus: 'catalog-resolved-swf',
    animationId,
    assetId,
    swfPath,
    swfSha256,
  };
}

function missingPageCandidate(
  entryValue: unknown,
  occurrenceValue: unknown,
  lesson: ParsedLesson,
  diagnostics: string[],
): PageCandidate | null {
  const entry = record(entryValue);
  const occurrenceValueRecord = record(occurrenceValue);
  const section = record(occurrenceValueRecord.section);
  const page = record(occurrenceValueRecord.page);
  const knowledgePoint = record(occurrenceValueRecord.knowledgePoint);
  const occurrence = integer(occurrenceValueRecord.occurrence);
  const expectedPath = text(occurrenceValueRecord.expectedPath);
  const sectionCode = text(section.code);
  const sectionPageOrdinal = integer(page.ordinal);
  const titleEnglish = text(knowledgePoint.titleEnglish) ?? text(page.titleRaw);
  const titleSpanish = text(knowledgePoint.titleSpanish);
  if (
    occurrenceValueRecord.sourceXmlPath !== lesson.path ||
    occurrenceValueRecord.grade !== 4 ||
    occurrenceValueRecord.lesson !== lesson.lesson ||
    occurrence === null || occurrence < 1 ||
    !expectedPath || expectedPath !== text(entry.expectedPath) ||
    entry.exists !== false || entry.resolvedPath !== null ||
    !sectionCode ||
    sectionPageOrdinal === null || sectionPageOrdinal < 1 ||
    !titleEnglish
  ) {
    diagnostics.push(
      `${lesson.path} occurrence ${occurrence ?? '?'} has a malformed missing-source binding`,
    );
    return null;
  }
  return {
    globalPageOrdinal: occurrence,
    sectionPageOrdinal,
    sectionCode,
    titleEnglish,
    titleSpanish,
    expectedPath,
    sourceXmlPath: lesson.path,
    sourceStatus: 'missing-canonical-swf',
    animationId: null,
    assetId: null,
    swfPath: null,
    swfSha256: null,
  };
}

function shellForLesson(
  animations: readonly unknown[],
  lesson: ParsedLesson,
  registeredAnimationKeys: ReadonlySet<string>,
  diagnostics: string[],
): Grade4CourseCoverageLesson['shell'] | null {
  const expectedPath = `${lesson.pageRoot}/index_local.swf`;
  const matches = animations.filter((value) => {
    const animation = record(value);
    const classification = record(animation.classification);
    const flags = record(animation.flags);
    const source = record(animation.source);
    return classification.collection === 'course' &&
      classification.grade === 4 &&
      classification.lesson === lesson.lesson &&
      flags.shell === true &&
      animation.isCanonical === true &&
      source.path === expectedPath;
  });
  if (matches.length !== 1) {
    diagnostics.push(`${lesson.path} must bind exactly one canonical index_local.swf shell`);
    return null;
  }
  const animation = record(matches[0]);
  const source = record(animation.source);
  const animationId = text(animation.animationId);
  const assetId = text(animation.assetId);
  const sourceSha256 = text(source.sha256);
  if (
    !animationId || !assetId ||
    !sourceSha256 || !SHA256.test(sourceSha256) ||
    assetId !== `swf-${sourceSha256}`
  ) {
    diagnostics.push(`${lesson.path} shell source identity is malformed`);
    return null;
  }
  return Object.freeze({
    animationId,
    assetId,
    sourcePath: expectedPath,
    sourceSha256,
    rendererAvailability: rendererAvailability(
      animationId,
      registeredAnimationKeys,
    ),
  });
}

function sum(
  lessons: readonly Grade4CourseCoverageLesson[],
  selector: (lesson: Grade4CourseCoverageLesson) => number,
): number {
  return lessons.reduce((total, lesson) => total + selector(lesson), 0);
}

/**
 * Builds source-ordered Grade 4 coverage only.
 *
 * The result can identify the exact next missing renderer/source, but it does
 * not create a player skin, migration evidence, review, strict completion, or
 * publication authority. Any ambiguity in XML occurrence, source identity,
 * section order, or shell identity closes the entire result.
 */
export function buildGrade4CourseCatalogCoverage({
  lessonsDocument,
  animationsDocument,
  missingReferencesDocument,
  registeredAnimationKeys,
}: Grade4CourseCatalogCoverageInput): Grade4CourseCatalogCoverage {
  const diagnostics: string[] = [];
  const lessons = parseLessons(lessonsDocument, diagnostics);
  const animationsDocumentRecord = record(animationsDocument);
  const missingDocument = record(missingReferencesDocument);
  if (
    animationsDocumentRecord.schemaVersion !== 1 ||
    !Array.isArray(animationsDocumentRecord.animations)
  ) {
    diagnostics.push('catalog/animations.json is not a schema-v1 animations document');
  }
  if (
    missingDocument.schemaVersion !== 1 ||
    !Array.isArray(missingDocument.course)
  ) {
    diagnostics.push('catalog/missing-references.json is not a schema-v1 missing-reference document');
  }
  if (
    new Set(registeredAnimationKeys).size !== registeredAnimationKeys.length ||
    registeredAnimationKeys.some((key) => !text(key))
  ) {
    diagnostics.push('current JavaScript renderer registry keys are malformed or duplicated');
  }
  if (diagnostics.length) return invalid(diagnostics);

  const animations = animationsDocumentRecord.animations as readonly unknown[];
  const missingEntries = missingDocument.course as readonly unknown[];
  const registeredKeys = new Set(registeredAnimationKeys);
  const lessonByXmlPath = new Map(lessons.map((lesson) => [lesson.path, lesson]));
  const candidatesByLesson = new Map(
    lessons.map((lesson) => [lesson.lesson, [] as PageCandidate[]]),
  );

  for (const animationValue of animations) {
    const animation = record(animationValue);
    const references = array(record(animation.references).courseXml);
    for (const referenceValue of references) {
      const reference = record(referenceValue);
      const sourceXmlPath = text(reference.sourceXmlPath);
      const lesson = sourceXmlPath ? lessonByXmlPath.get(sourceXmlPath) : undefined;
      if (!lesson) continue;
      const candidate = resolvedPageCandidate(
        animationValue,
        referenceValue,
        lesson,
        diagnostics,
      );
      if (candidate) candidatesByLesson.get(lesson.lesson)!.push(candidate);
    }
  }

  for (const entryValue of missingEntries) {
    const entry = record(entryValue);
    for (const occurrenceValue of array(entry.occurrences)) {
      const occurrence = record(occurrenceValue);
      if (occurrence.grade !== 4) continue;
      const sourceXmlPath = text(occurrence.sourceXmlPath);
      const lesson = sourceXmlPath ? lessonByXmlPath.get(sourceXmlPath) : undefined;
      if (!lesson) {
        diagnostics.push('a Grade 4 missing reference names an unknown lesson XML');
        continue;
      }
      const candidate = missingPageCandidate(
        entryValue,
        occurrenceValue,
        lesson,
        diagnostics,
      );
      if (candidate) candidatesByLesson.get(lesson.lesson)!.push(candidate);
    }
  }

  const coverageLessons: Grade4CourseCoverageLesson[] = [];
  const allExpectedPaths = new Set<string>();
  for (const lesson of lessons) {
    const candidates = [...(candidatesByLesson.get(lesson.lesson) ?? [])]
      .sort((left, right) => left.globalPageOrdinal - right.globalPageOrdinal);
    const occurrences = new Set(candidates.map((page) => page.globalPageOrdinal));
    if (
      candidates.length !== lesson.pageReferenceCount ||
      occurrences.size !== candidates.length ||
      candidates.some((page, index) => page.globalPageOrdinal !== index + 1)
    ) {
      diagnostics.push(
        `${lesson.path} does not have one exact source binding for every XML occurrence`,
      );
      continue;
    }
    for (const candidate of candidates) {
      if (allExpectedPaths.has(candidate.expectedPath)) {
        diagnostics.push(`Grade 4 page source is duplicated: ${candidate.expectedPath}`);
      }
      allExpectedPaths.add(candidate.expectedPath);
    }

    const sections: Grade4CourseCoverageSection[] = [];
    for (const sourceSection of lesson.sections) {
      const sectionPages = candidates.filter(
        (page) => page.sectionCode === sourceSection.code,
      );
      const contiguous = sectionPages.every(
        (page, index) => page.sectionPageOrdinal === index + 1,
      );
      if (
        sectionPages.length !== sourceSection.pageReferenceCount ||
        !contiguous
      ) {
        diagnostics.push(
          `${lesson.path} section ${sourceSection.code} page order differs from catalog XML`,
        );
        continue;
      }
      sections.push(Object.freeze({
        order: sourceSection.order,
        code: sourceSection.code,
        activePageCount: sectionPages.length,
        firstActiveSourceKey:
          sectionPages[0]!.animationId ?? sectionPages[0]!.expectedPath,
        labels: Object.freeze({
          en: sectionLabel(
            sourceSection.titleEnglish,
            sourceSection.titleSpanish,
            'en',
          ),
          es: sectionLabel(
            sourceSection.titleEnglish,
            sourceSection.titleSpanish,
            'es',
          ),
        }),
      }));
    }
    if (sections.length !== lesson.sections.length) continue;

    const shell = shellForLesson(
      animations,
      lesson,
      registeredKeys,
      diagnostics,
    );
    if (!shell) continue;

    const pages = candidates.map((candidate, index): Grade4CourseCoveragePage => {
      const sourceKey = candidate.animationId ?? candidate.expectedPath;
      return Object.freeze({
        globalPageOrdinal: candidate.globalPageOrdinal,
        sectionPageOrdinal: candidate.sectionPageOrdinal,
        sectionCode: candidate.sectionCode,
        sourceKey,
        previousSourceKey: index > 0
          ? candidates[index - 1]!.animationId ?? candidates[index - 1]!.expectedPath
          : null,
        nextSourceKey: index + 1 < candidates.length
          ? candidates[index + 1]!.animationId ?? candidates[index + 1]!.expectedPath
          : null,
        labels: Object.freeze({
          en: exactEnglishLabel(candidate.titleEnglish),
          es: pageSpanishLabel(candidate.titleEnglish, candidate.titleSpanish),
        }),
        rendererAvailability: rendererAvailability(
          candidate.animationId,
          registeredKeys,
        ),
        source: Object.freeze({
          status: candidate.sourceStatus,
          expectedPath: candidate.expectedPath,
          sourceXmlPath: lesson.path,
          sourceXmlSha256: lesson.sha256,
          sourceOccurrence: candidate.globalPageOrdinal,
          animationId: candidate.animationId,
          assetId: candidate.assetId,
          swfPath: candidate.swfPath,
          swfSha256: candidate.swfSha256,
        }),
      });
    });

    const catalogResolvedPages = pages.filter(
      (page) => page.source.status === 'catalog-resolved-swf',
    ).length;
    const currentJsPages = pages.filter(
      (page) => page.rendererAvailability.kind === 'registered',
    ).length;
    const currentJsShells = shell.rendererAvailability.kind === 'registered'
      ? 1 as const
      : 0 as const;
    const requiredMembers = pages.length + 1;
    const currentJsMembers = currentJsPages + currentJsShells;
    coverageLessons.push(Object.freeze({
      schemaVersion: 1,
      descriptorKind: 'catalog-source-and-renderer-coverage',
      descriptorId: `catalog-course-g04-l${String(lesson.lesson).padStart(2, '0')}-coverage-v1`,
      grade: 4,
      lesson: lesson.lesson,
      titleEnglish: lesson.titleEnglish,
      source: Object.freeze({
        lessonXmlPath: lesson.path,
        lessonXmlBytes: lesson.bytes,
        lessonXmlSha256: lesson.sha256,
        sequenceAuthority: 'course-xml-occurrence',
      }),
      shell,
      sections: Object.freeze(sections),
      pages: Object.freeze(pages),
      counts: Object.freeze({
        activePages: pages.length,
        courseShells: 1,
        requiredMembers,
        catalogResolvedPages,
        missingSourcePages: pages.length - catalogResolvedPages,
        currentJsPages,
        missingCurrentJsPages: pages.length - currentJsPages,
        currentJsShells,
        missingCurrentJsShells: (1 - currentJsShells) as 0 | 1,
        currentJsMembers,
        missingCurrentJsMembers: requiredMembers - currentJsMembers,
      }),
      readiness: Object.freeze({
        sourceCoverageComplete: catalogResolvedPages === pages.length,
        rendererCoverageComplete: currentJsMembers === requiredMembers,
        registrationRequiresIndependentPlayerDescriptor: true,
      }),
      acceptanceEffects: Object.freeze({
        authoritativeOriginalRuntime: false,
        fidelityAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
      }),
    }));
  }

  if (diagnostics.length || coverageLessons.length !== lessons.length) {
    if (coverageLessons.length !== lessons.length) {
      diagnostics.push('Grade 4 coverage could not bind all 12 lessons atomically');
    }
    return invalid(diagnostics);
  }

  const activePageCount = sum(coverageLessons, (lesson) => lesson.counts.activePages);
  const courseShellCount = coverageLessons.length;
  const requiredMemberCount = activePageCount + courseShellCount;
  const catalogResolvedPageCount = sum(
    coverageLessons,
    (lesson) => lesson.counts.catalogResolvedPages,
  );
  const currentJsPageCount = sum(
    coverageLessons,
    (lesson) => lesson.counts.currentJsPages,
  );
  const currentJsShellCount = sum(
    coverageLessons,
    (lesson) => lesson.counts.currentJsShells,
  );
  const currentJsMemberCount = currentJsPageCount + currentJsShellCount;
  return Object.freeze({
    schemaVersion: 1,
    status: 'valid',
    lessons: Object.freeze(coverageLessons),
    summary: Object.freeze({
      lessonCount: coverageLessons.length,
      activePageCount,
      courseShellCount,
      requiredMemberCount,
      catalogResolvedPageCount,
      missingSourcePageCount: activePageCount - catalogResolvedPageCount,
      currentJsPageCount,
      missingCurrentJsPageCount: activePageCount - currentJsPageCount,
      currentJsShellCount,
      missingCurrentJsShellCount: courseShellCount - currentJsShellCount,
      currentJsMemberCount,
      missingCurrentJsMemberCount: requiredMemberCount - currentJsMemberCount,
      fullySourceResolvedLessonCount: coverageLessons.filter(
        (lesson) => lesson.readiness.sourceCoverageComplete,
      ).length,
      rendererCoverageCompleteLessonCount: coverageLessons.filter(
        (lesson) => lesson.readiness.rendererCoverageComplete,
      ).length,
    }),
    coverageAuthority: Object.freeze({
      authorizesRouteRegistration: false,
      authorizesFidelity: false,
      authorizesStrictCompletion: false,
      authorizesPublication: false,
    }),
  });
}

export function findGrade4CourseCoverageLesson(
  coverage: Grade4CourseCatalogCoverage,
  lesson: string | number,
): Grade4CourseCoverageLesson | undefined {
  const lessonNumber = Number(lesson);
  if (
    coverage.status !== 'valid' ||
    !Number.isSafeInteger(lessonNumber)
  ) {
    return undefined;
  }
  const matches = coverage.lessons.filter(
    (candidate) => candidate.lesson === lessonNumber,
  );
  return matches.length === 1 ? matches[0] : undefined;
}
