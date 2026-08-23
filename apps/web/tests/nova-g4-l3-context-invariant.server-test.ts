import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';

import {
  G4_L3_LESSON,
  getG4L3PageLabel,
  getG4L3SectionLabel,
  type G4L3Locale,
} from '../lib/g4-l3-lesson-navigation';
import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from
  '../lib/g4-l3-whole-lesson-player-descriptor';
import {NOVA_OPENROUTER_MODEL} from '../lib/nova-openrouter.server';
import {resolveNovaTutorRequest} from
  '../lib/nova-request-resolver.server';
import {novaTutorRequestSchema} from '../lib/nova-request-schema';
import {
  tutorPageContext,
  type TutorPageContext,
} from '../lib/tutor-integration';
import {findWholeLessonCourseRegistration} from
  '../lib/whole-lesson-course-registry';

const productionLikeG4L3Environment = Object.freeze({
  NODE_ENV: 'production',
  MODERN_WIDE_SHELL_ENABLED: 'true',
  NOVA_TUTOR_ENABLED: 'true',
  NOVA_TUTOR_RELEASE_IDS: G4_L3_LESSON.releaseId,
  NOVA_ALLOW_FRAME_CONTEXT: 'false',
  NOVA_ALLOW_SPEECH_INPUT: 'false',
  NOVA_MODEL: NOVA_OPENROUTER_MODEL,
  OPENROUTER_API_KEY: 'sk-or-v1-test-only-key-1234567890',
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
  CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
});

function customPlayerContext(pageIndex: number, locale: G4L3Locale) {
  const page = G4_L3_LESSON.pages[pageIndex];
  assert.ok(page);
  const section = G4_L3_LESSON.sections.find(
    (candidate) => candidate.code === page.sectionCode,
  );
  assert.ok(section);
  const pageLabel = getG4L3PageLabel(page, locale);
  const sectionLabel = getG4L3SectionLabel(section, locale);
  return tutorPageContext({
    releaseId: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.releaseId,
    grade: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.grade,
    lesson: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.lesson,
    animationId: page.animationId,
    sectionCode: page.sectionCode,
    sectionTitle: sectionLabel.text,
    globalPageOrdinal: page.globalPageOrdinal,
    activePageCount:
      G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.activePageCount,
    pageTitle: pageLabel.text,
    pageTitleEnglish: page.titleEnglish,
    pageTitleSpanish: page.titleSpanish,
    locale,
    pageTitleUsesEnglishFallback: pageLabel.usesEnglishFallback,
  });
}

function formalDescriptorContext(pageIndex: number, locale: G4L3Locale) {
  const registration = findWholeLessonCourseRegistration(4, 3);
  assert.ok(registration);
  const descriptor = registration.descriptor;
  const page = descriptor.pages[pageIndex];
  assert.ok(page);
  const section = descriptor.sections.find(
    (candidate) => candidate.code === page.sectionCode,
  );
  assert.ok(section);
  const pageLabel = page.labels[locale];
  const sectionLabel = section.labels[locale];
  return tutorPageContext({
    releaseId: descriptor.releaseId,
    grade: descriptor.course.grade,
    lesson: descriptor.course.lesson,
    animationId: page.animationId,
    sectionCode: page.sectionCode,
    sectionTitle: sectionLabel.text,
    globalPageOrdinal: page.globalPageOrdinal,
    activePageCount: descriptor.course.activePageCount,
    pageTitle: pageLabel.text,
    pageTitleEnglish: page.labels.en.text,
    pageTitleSpanish: page.labels.es.usesEnglishFallback
      ? null
      : page.labels.es.text,
    locale,
    pageTitleUsesEnglishFallback: pageLabel.usesEnglishFallback,
  });
}

function tutorContextFields(context: TutorPageContext): TutorPageContext {
  return {
    releaseId: context.releaseId,
    grade: context.grade,
    lesson: context.lesson,
    animationId: context.animationId,
    sectionCode: context.sectionCode,
    sectionTitle: context.sectionTitle,
    globalPageOrdinal: context.globalPageOrdinal,
    activePageCount: context.activePageCount,
    pageTitle: context.pageTitle,
    pageTitleEnglish: context.pageTitleEnglish,
    pageTitleSpanish: context.pageTitleSpanish,
    locale: context.locale,
    pageTitleUsesEnglishFallback: context.pageTitleUsesEnglishFallback,
    assessment: context.assessment,
  };
}

describe('G4 L3 preserved custom player Nova context invariant', () => {
  it('keeps the custom UI bound to the same context construction recipe', async () => {
    const source = await readFile(
      new URL('../components/g4-l3-whole-lesson-player.tsx', import.meta.url),
      'utf8',
    );
    assert.match(
      source,
      /const tutorContext = novaCapabilities\.text\s*\?\s*tutorPageContext\(\{/u,
    );
    for (const binding of [
      'releaseId: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.releaseId',
      'grade: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.grade',
      'lesson: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.lesson',
      'animationId: currentPage.animationId',
      'sectionCode: currentPage.sectionCode',
      'sectionTitle: currentSectionLabel.text',
      'globalPageOrdinal: currentPage.globalPageOrdinal',
      'activePageCount: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.activePageCount',
      'pageTitle: currentLabel.text',
      'pageTitleEnglish: currentPage.titleEnglish',
      'pageTitleSpanish: currentPage.titleSpanish',
      'locale: progress.language',
      'pageTitleUsesEnglishFallback: currentLabel.usesEnglishFallback',
    ]) {
      assert.ok(source.includes(binding), binding);
    }
  });

  it('matches all 39 formal registry placements and canonical resolution in both locales', async () => {
    const registration = findWholeLessonCourseRegistration(4, 3);
    assert.ok(registration);
    const formal = registration.descriptor;
    const custom = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR;
    assert.equal(registration.player.kind, 'preserved-custom');
    assert.equal(formal.descriptorId, 'g4-l3-formal-page-only-course-v1');
    assert.equal(formal.pages.length, 39);
    assert.equal(custom.pages.length, 39);
    assert.equal(G4_L3_LESSON.pages.length, 39);
    assert.deepEqual({
      releaseId: formal.releaseId,
      grade: formal.course.grade,
      lesson: formal.course.lesson,
      href: formal.course.href,
      domIdPrefix: formal.course.domIdPrefix,
      activePageCount: formal.course.activePageCount,
      labels: formal.course.labels,
      sourceXmlPath: formal.source.sourceXmlPath,
      sourceXmlSha256: formal.source.sourceXmlSha256,
      stage: formal.stage,
      locales: formal.support.locales,
      sections: formal.sections,
    }, {
      releaseId: custom.releaseId,
      grade: custom.course.grade,
      lesson: custom.course.lesson,
      href: custom.course.href,
      domIdPrefix: custom.course.domIdPrefix,
      activePageCount: custom.course.activePageCount,
      labels: custom.course.labels,
      sourceXmlPath: custom.source.sourceXmlPath,
      sourceXmlSha256: custom.source.sourceXmlSha256,
      stage: custom.stage,
      locales: custom.support.locales,
      sections: custom.sections,
    });

    let resolvedContexts = 0;
    for (const [pageIndex, customPage] of custom.pages.entries()) {
      const formalPage = formal.pages[pageIndex];
      assert.ok(formalPage);
      const {
        placementId,
        previousPlacementId,
        nextPlacementId,
        source: formalSource,
        ...formalSharedPage
      } = formalPage;
      const {source: customSource, ...customSharedPage} = customPage;
      const {
        assetId,
        sourceOccurrence,
        ...formalSharedSource
      } = formalSource;
      assert.deepEqual(
        formalSharedPage,
        customSharedPage,
        `descriptor page ${pageIndex + 1}`,
      );
      assert.deepEqual(
        formalSharedSource,
        customSource,
        `descriptor source page ${pageIndex + 1}`,
      );
      assert.match(placementId ?? '', /\S/u);
      assert.equal(sourceOccurrence, pageIndex + 1);
      assert.match(assetId ?? '', /^swf-[a-f0-9]{64}$/u);
      assert.equal(
        previousPlacementId,
        formal.pages[pageIndex - 1]?.placementId ?? null,
      );
      assert.equal(
        nextPlacementId,
        formal.pages[pageIndex + 1]?.placementId ?? null,
      );

      for (const locale of ['en', 'es'] as const) {
        const customContext = customPlayerContext(pageIndex, locale);
        assert.deepEqual(
          customContext,
          formalDescriptorContext(pageIndex, locale),
          `${locale} context page ${pageIndex + 1}`,
        );
        const resolved = await resolveNovaTutorRequest(
          novaTutorRequestSchema.parse({
            locale,
            mode: 'focus',
            message: 'Help me understand this page.',
            history: [],
            context: customContext,
          }),
          productionLikeG4L3Environment,
        );
        assert.deepEqual(
          tutorContextFields(resolved.context),
          customContext,
          `${locale} canonical page ${pageIndex + 1}`,
        );
        assert.equal(resolved.context.placementId, placementId);
        assert.equal(
          resolved.context.courseTitle,
          custom.course.labels[locale].text,
        );
        assert.equal(
          resolved.context.courseTitleEnglish,
          custom.course.labels.en.text,
        );
        assert.equal(
          resolved.context.courseTitleSpanish,
          custom.course.labels.es.usesEnglishFallback
            ? null
            : custom.course.labels.es.text,
        );
        assert.equal(
          resolved.context.courseTitleUsesEnglishFallback,
          custom.course.labels[locale].usesEnglishFallback,
        );
        const customSection = custom.sections.find(
          (section) => section.code === customPage.sectionCode,
        );
        assert.ok(customSection);
        assert.equal(
          resolved.context.sectionTitleEnglish,
          customSection.labels.en.text,
        );
        assert.equal(
          resolved.context.sectionTitleSpanish,
          customSection.labels.es.usesEnglishFallback
            ? null
            : customSection.labels.es.text,
        );
        assert.equal(
          resolved.context.sectionTitleUsesEnglishFallback,
          customSection.labels[locale].usesEnglishFallback,
        );
        resolvedContexts += 1;
      }
    }
    assert.equal(resolvedContexts, 78);
  });
});
