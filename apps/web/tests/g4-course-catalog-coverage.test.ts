import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGrade4CourseCatalogCoverage,
  findGrade4CourseCoverageLesson,
} from '../lib/g4-course-catalog-coverage';
import {
  loadCurrentGrade4CourseCatalogCoverage,
  loadCurrentGrade4CourseCatalogInputs,
} from '../lib/g4-course-catalog-coverage.server';
import {findWholeLessonCourseRegistration} from '../lib/whole-lesson-course-registry';

const ACTIVE_PAGES = [80, 67, 39, 54, 53, 49, 48, 46, 43, 46, 43, 77];
const RESOLVED_PAGES = [80, 67, 39, 54, 53, 49, 48, 46, 43, 46, 43, 77];
const MISSING_SOURCE_PAGES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// These `currentJs*` fields are legacy names for demos-registry loadability.
// At this tree, 198 = 181 formal page-only occurrences + 17 candidate-only
// placements (G4 L1: 1; G4 L9: 16). This does not change the project's formal
// 426/1,751 control-ledger total.
const FORMAL_CURRENT_JS_PAGES = [0, 0, 39, 0, 53, 0, 0, 0, 0, 46, 43, 0];
const CANDIDATE_ONLY_PAGES = [1, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0];
const LOADABLE_DEMO_REGISTRY_PAGES = [1, 0, 39, 0, 53, 0, 0, 0, 16, 46, 43, 0];
const LOADABLE_DEMO_REGISTRY_SHELLS = [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const G4_L9_ADDED_LOADABLE_CANDIDATE_IDS = [
  'course-g04-l09-ir-001',
  'course-g04-l09-rw-002',
  'course-g04-l09-vb-009',
  'course-g04-l09-in-003',
  'course-g04-l09-in-009',
  'course-g04-l09-in-010',
  'course-g04-l09-in-011',
  'course-g04-l09-ti-002',
  'course-g04-l09-ti-003',
  'course-g04-l09-ti-004',
  'course-g04-l09-ti-005',
  'course-g04-l09-ti-007',
  'course-g04-l09-ts-008',
  'course-g04-l09-fq-001',
  'course-g04-l09-fq-002',
] as const;

test('Grade 4 catalog coverage records the reviewed active-source promotion without expanding acceptance', () => {
  const coverage = loadCurrentGrade4CourseCatalogCoverage();
  assert.equal(coverage.status, 'valid');
  if (coverage.status !== 'valid') return;

  assert.equal(Object.isFrozen(coverage), true);
  assert.deepEqual(coverage.summary, {
    lessonCount: 12,
    activePageCount: 645,
    courseShellCount: 12,
    requiredMemberCount: 657,
    catalogResolvedPageCount: 645,
    missingSourcePageCount: 0,
    currentJsPageCount: 198,
    missingCurrentJsPageCount: 447,
    currentJsShellCount: 2,
    missingCurrentJsShellCount: 10,
    currentJsMemberCount: 200,
    missingCurrentJsMemberCount: 457,
    fullySourceResolvedLessonCount: 12,
    rendererCoverageCompleteLessonCount: 1,
  });
  assert.deepEqual(coverage.coverageAuthority, {
    authorizesRouteRegistration: false,
    authorizesFidelity: false,
    authorizesStrictCompletion: false,
    authorizesPublication: false,
  });

  assert.deepEqual(
    coverage.lessons.map((lesson) => lesson.counts.activePages),
    ACTIVE_PAGES,
  );
  assert.deepEqual(
    coverage.lessons.map((lesson) => lesson.counts.catalogResolvedPages),
    RESOLVED_PAGES,
  );
  assert.deepEqual(
    coverage.lessons.map((lesson) => lesson.counts.missingSourcePages),
    MISSING_SOURCE_PAGES,
  );
  assert.deepEqual(
    coverage.lessons.map((lesson) => lesson.counts.currentJsPages),
    LOADABLE_DEMO_REGISTRY_PAGES,
  );
  assert.deepEqual(
    coverage.lessons.map((lesson) => lesson.counts.currentJsShells),
    LOADABLE_DEMO_REGISTRY_SHELLS,
  );
  assert.equal(FORMAL_CURRENT_JS_PAGES.reduce((sum, count) => sum + count, 0), 181);
  assert.equal(CANDIDATE_ONLY_PAGES.reduce((sum, count) => sum + count, 0), 17);
  assert.deepEqual(
    FORMAL_CURRENT_JS_PAGES.map(
      (formal, index) => formal + CANDIDATE_ONLY_PAGES[index]!,
    ),
    LOADABLE_DEMO_REGISTRY_PAGES,
  );
  const lessonNine = findGrade4CourseCoverageLesson(coverage, 9);
  assert.ok(lessonNine);
  assert.deepEqual(
    lessonNine.pages
      .filter(
        (page) =>
          page.rendererAvailability.kind === 'registered' &&
          page.source.animationId !== 'course-g04-l09-gs-002',
      )
      .map((page) => page.source.animationId),
    G4_L9_ADDED_LOADABLE_CANDIDATE_IDS,
  );
  assert.equal(findWholeLessonCourseRegistration(4, 9), undefined);
  assert.deepEqual(
    coverage.lessons
      .filter((lesson) => lesson.readiness.sourceCoverageComplete)
      .map((lesson) => lesson.lesson),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );
  assert.deepEqual(
    coverage.lessons
      .filter((lesson) => lesson.readiness.rendererCoverageComplete)
      .map((lesson) => lesson.lesson),
    [3],
  );
  assert.ok(coverage.lessons.every((lesson) =>
    Object.values(lesson.acceptanceEffects).every((value) => value === false)
  ));
});

test('coverage preserves exact XML occurrence, section order, promoted identity, and renderer gaps', () => {
  const coverage = loadCurrentGrade4CourseCatalogCoverage();
  const lessonOne = findGrade4CourseCoverageLesson(coverage, 1);
  const lessonThree = findGrade4CourseCoverageLesson(coverage, '03');
  assert.ok(lessonOne);
  assert.ok(lessonThree);

  assert.equal(lessonOne.source.lessonXmlPath, 'HELP_COURSES/ELMGR4/L1/index.xml');
  assert.equal(
    lessonOne.source.lessonXmlSha256,
    'b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2',
  );
  assert.deepEqual(
    lessonOne.sections.map(({order, code, activePageCount}) => ({
      order,
      code,
      activePageCount,
    })),
    [
      {order: 1, code: 'IR', activePageCount: 1},
      {order: 2, code: 'RW', activePageCount: 4},
      {order: 3, code: 'VB', activePageCount: 24},
      {order: 4, code: 'IN', activePageCount: 35},
      {order: 5, code: 'TI', activePageCount: 5},
      {order: 6, code: 'GS', activePageCount: 1},
      {order: 7, code: 'TS', activePageCount: 7},
      {order: 8, code: 'FQ', activePageCount: 3},
    ],
  );

  const resolvedFirst = lessonOne.pages[0]!;
  assert.equal(resolvedFirst.source.sourceOccurrence, 1);
  assert.equal(resolvedFirst.source.animationId, 'course-g04-l01-ir-001');
  assert.equal(resolvedFirst.source.status, 'catalog-resolved-swf');
  assert.deepEqual(resolvedFirst.rendererAvailability, {
    kind: 'registered',
    moduleKey: 'course-g04-l01-ir-001',
  });

  const promotedSecond = lessonOne.pages[1]!;
  assert.equal(promotedSecond.source.sourceOccurrence, 2);
  assert.equal(
    promotedSecond.source.expectedPath,
    'HELP_COURSES/ELMGR4/L1/RW/L1RW02.swf',
  );
  assert.equal(promotedSecond.source.status, 'catalog-resolved-swf');
  assert.equal(promotedSecond.source.animationId, 'course-g04-l01-rw-002');
  assert.equal(
    promotedSecond.source.assetId,
    'swf-0202c928c79df491720a8096b41d89fe53651741232d71c2554b0e6c6717d089',
  );
  assert.equal(
    promotedSecond.source.swfSha256,
    '0202c928c79df491720a8096b41d89fe53651741232d71c2554b0e6c6717d089',
  );
  assert.deepEqual(promotedSecond.rendererAvailability, {
    kind: 'unavailable',
    reason: 'animation-module-not-registered',
  });
  assert.equal(resolvedFirst.nextSourceKey, promotedSecond.sourceKey);
  assert.equal(promotedSecond.previousSourceKey, resolvedFirst.sourceKey);

  assert.equal(lessonThree.pages.length, 39);
  assert.equal(
    lessonThree.pages[0]!.source.animationId,
    'course-g04-l03-ir-001-341242cc',
  );
  assert.equal(
    lessonThree.pages.at(-1)!.source.animationId,
    'course-g04-l03-fq-003',
  );
  assert.ok(lessonThree.pages.every((page, index) =>
    page.globalPageOrdinal === index + 1 &&
    page.source.sourceOccurrence === index + 1 &&
    page.rendererAvailability.kind === 'registered'
  ));
  assert.deepEqual(lessonThree.shell.rendererAvailability, {
    kind: 'registered',
    moduleKey: 'shell-course-g04-l03-index-local',
  });
});

test('registry changes update coverage counts without fabricating source or acceptance', () => {
  const inputs = loadCurrentGrade4CourseCatalogInputs();
  const withoutOneRenderer = buildGrade4CourseCatalogCoverage({
    ...inputs,
    registeredAnimationKeys: inputs.registeredAnimationKeys.filter(
      (key) => key !== 'course-g04-l03-in-002',
    ),
  });
  assert.equal(withoutOneRenderer.status, 'valid');
  if (withoutOneRenderer.status !== 'valid') return;
  assert.equal(withoutOneRenderer.summary.currentJsPageCount, 197);
  assert.equal(withoutOneRenderer.summary.missingCurrentJsPageCount, 448);
  assert.equal(
    withoutOneRenderer.summary.rendererCoverageCompleteLessonCount,
    0,
  );
  assert.equal(
    findGrade4CourseCoverageLesson(withoutOneRenderer, 3)?.readiness
      .rendererCoverageComplete,
    false,
  );
  assert.equal(withoutOneRenderer.coverageAuthority.authorizesRouteRegistration, false);
});

test('ambiguous XML occurrence fails the whole Grade 4 coverage atomically', () => {
  const inputs = loadCurrentGrade4CourseCatalogInputs();
  const animationsDocument = structuredClone(inputs.animationsDocument) as {
    animations: Array<{
      animationId?: string;
      references?: {courseXml?: Array<{occurrence?: number}>};
    }>;
  };
  const target = animationsDocument.animations.find(
    (animation) => animation.animationId === 'course-g04-l01-in-008',
  );
  assert.ok(target?.references?.courseXml?.[0]);
  target.references.courseXml[0]!.occurrence = 1;

  const coverage = buildGrade4CourseCatalogCoverage({
    ...inputs,
    animationsDocument,
  });
  assert.equal(coverage.status, 'invalid');
  if (coverage.status !== 'invalid') return;
  assert.deepEqual(coverage.lessons, []);
  assert.ok(coverage.diagnostics.some((diagnostic) =>
    diagnostic.includes('does not have one exact source binding')
  ));
  assert.equal(findGrade4CourseCoverageLesson(coverage, 1), undefined);
});
