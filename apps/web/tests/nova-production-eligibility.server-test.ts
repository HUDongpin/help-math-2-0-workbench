import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {
  CURRENT_JS_PRODUCTION_APPROVED_RELEASE_IDS,
} from '../lib/current-js-asset-profile';
import {availableLearningLessons} from
  '../lib/learning-lesson-availability.server';
import {
  NOVA_TUTOR_COURSE_POLICY,
  resolveNovaClientCapabilities,
  type NovaCapabilitiesEnvironment,
} from '../lib/nova-capabilities.server';
import {EMPTY_NOVA_CLIENT_CAPABILITIES} from '../lib/nova-capabilities';
import {NOVA_OPENROUTER_MODEL} from '../lib/nova-openrouter.server';
import {
  NovaTutorRequestResolutionError,
  resolveNovaTutorRequest,
} from '../lib/nova-request-resolver.server';
import {novaTutorRequestSchema} from '../lib/nova-request-schema';
import {tutorPageContext} from '../lib/tutor-integration';
import {findWholeLessonCourseRegistration} from
  '../lib/whole-lesson-course-registry';
import {
  isModernWideShellEnabled,
  resolveWholeLessonHostPresentation,
} from '../lib/whole-lesson-host-presentation';

const productionEligibleCourses = Object.freeze([
  Object.freeze({
    grade: 3,
    lesson: 2,
    releaseId:
      'lesson-g03-l02-addition-subtraction-page-only-current-js',
  }),
  Object.freeze({
    grade: 4,
    lesson: 3,
    releaseId: 'lesson-g04-l03-negative-numbers',
  }),
  Object.freeze({
    grade: 4,
    lesson: 5,
    releaseId: 'lesson-g04-l05-multiplication-page-only',
  }),
  Object.freeze({
    grade: 4,
    lesson: 10,
    releaseId: 'lesson-g04-l10-perimeter-area-page-only',
  }),
  Object.freeze({
    grade: 4,
    lesson: 11,
    releaseId: 'lesson-g04-l11-coordinate-grid-page-only',
  }),
  Object.freeze({
    grade: 5,
    lesson: 3,
    releaseId:
      'lesson-g05-l03-exponents-prime-factorizations-page-only',
  }),
  Object.freeze({
    grade: 5,
    lesson: 4,
    releaseId: 'lesson-g05-l04-number-lines',
  }),
  Object.freeze({
    grade: 5,
    lesson: 5,
    releaseId: 'lesson-g05-l05-add-subtract-negative-numbers',
  }),
] as const);

function productionLikeEnvironment(): NovaCapabilitiesEnvironment {
  return {
    NODE_ENV: 'production',
    MODERN_WIDE_SHELL_ENABLED: 'true',
    NOVA_TUTOR_ENABLED: 'true',
    NOVA_TUTOR_RELEASE_IDS: NOVA_TUTOR_COURSE_POLICY
      .map(({releaseId}) => releaseId)
      .join(','),
    NOVA_ALLOW_FRAME_CONTEXT: 'true',
    NOVA_ALLOW_SPEECH_INPUT: 'true',
    NOVA_MODEL: NOVA_OPENROUTER_MODEL,
    OPENROUTER_API_KEY: 'sk-or-v1-test-only-key-1234567890',
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    // Candidate mode is deliberately on. Production must still derive all
    // eight approved lessons from the production asset profile, never from
    // candidate bytes.
    CURRENT_JS_CANDIDATE_PROFILE_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G3_L2_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L3_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L5_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L10_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G4_L11_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L3_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L4_ENABLED: 'true',
    CURRENT_JS_SHOWCASE_G5_L5_ENABLED: 'true',
  };
}

function firstPageTransport(
  course: Readonly<{grade: number; lesson: number}>,
) {
  const registration = findWholeLessonCourseRegistration(
    course.grade,
    course.lesson,
  );
  assert.ok(registration);
  const descriptor = registration.descriptor;
  const page = descriptor.pages[0];
  assert.ok(page);
  const section = descriptor.sections.find(
    (candidate) => candidate.code === page.sectionCode,
  );
  assert.ok(section);
  return novaTutorRequestSchema.parse({
    locale: 'en',
    mode: 'focus',
    message: 'Help me understand this page.',
    history: [],
    context: tutorPageContext({
      releaseId: descriptor.releaseId,
      grade: descriptor.course.grade,
      lesson: descriptor.course.lesson,
      animationId: page.animationId,
      sectionCode: page.sectionCode,
      sectionTitle: section.labels.en.text,
      globalPageOrdinal: page.globalPageOrdinal,
      activePageCount: descriptor.course.activePageCount,
      pageTitle: page.labels.en.text,
      pageTitleEnglish: page.labels.en.text,
      pageTitleSpanish: page.labels.es.usesEnglishFallback
        ? null
        : page.labels.es.text,
      locale: 'en',
      pageTitleUsesEnglishFallback: page.labels.en.usesEnglishFallback,
    }),
  });
}

describe('production-like Nova course eligibility', () => {
  it('derives exactly the eight production-profile lessons as learner-visible and text-capable', () => {
    const environment = productionLikeEnvironment();
    assert.deepEqual(
      [...CURRENT_JS_PRODUCTION_APPROVED_RELEASE_IDS].sort(),
      productionEligibleCourses.map(({releaseId}) => releaseId).sort(),
    );
    assert.deepEqual(
      availableLearningLessons(environment).map((lesson) => ({
        grade: lesson.grade,
        lesson: lesson.lesson,
        releaseId: lesson.releaseId,
      })),
      productionEligibleCourses,
    );

    for (const course of productionEligibleCourses) {
      const registration = findWholeLessonCourseRegistration(
        course.grade,
        course.lesson,
      );
      assert.ok(registration);
      assert.deepEqual(resolveNovaClientCapabilities({
        ...course,
        hostPresentation: resolveWholeLessonHostPresentation({
          declared: registration.descriptor.visualSkin.presentations,
          enabled: isModernWideShellEnabled(environment),
        }),
        environment,
      }), {
        schemaVersion: 1,
        text: true,
        currentLessonFrame: true,
        speechToDraft: true,
      }, course.releaseId);
    }
  });

  it('keeps the Nova rollout list independent from the eight-course product profile', () => {
    const firstCourse = productionEligibleCourses[0];
    const environment = {
      ...productionLikeEnvironment(),
      NOVA_TUTOR_RELEASE_IDS: firstCourse.releaseId,
    };
    for (const course of productionEligibleCourses) {
      const registration = findWholeLessonCourseRegistration(
        course.grade,
        course.lesson,
      );
      assert.ok(registration);
      const capabilities = resolveNovaClientCapabilities({
        ...course,
        hostPresentation: resolveWholeLessonHostPresentation({
          declared: registration.descriptor.visualSkin.presentations,
          enabled: isModernWideShellEnabled(environment),
        }),
        environment,
      });
      assert.deepEqual(
        capabilities,
        course.releaseId === firstCourse.releaseId
          ? {
              schemaVersion: 1,
              text: true,
              currentLessonFrame: true,
              speechToDraft: true,
            }
          : EMPTY_NOVA_CLIENT_CAPABILITIES,
        course.releaseId,
      );
    }
  });

  it('allows all eight canonical requests and rejects formally supported courses outside a selected batch', async () => {
    const environment = productionLikeEnvironment();
    for (const course of productionEligibleCourses) {
      const resolved = await resolveNovaTutorRequest(
        firstPageTransport(course),
        environment,
      );
      assert.equal(resolved.context.releaseId, course.releaseId);
      assert.equal(resolved.context.grade, course.grade);
      assert.equal(resolved.context.lesson, course.lesson);
      assert.equal(resolved.context.globalPageOrdinal, 1);
    }

    const firstCourse = productionEligibleCourses[0];
    const firstBatchEnvironment = {
      ...environment,
      NOVA_TUTOR_RELEASE_IDS: firstCourse.releaseId,
    };
    for (const course of productionEligibleCourses.slice(1)) {
      await assert.rejects(
        resolveNovaTutorRequest(
          firstPageTransport(course),
          firstBatchEnvironment,
        ),
        (error) => error instanceof NovaTutorRequestResolutionError &&
          error.failure === 'course-not-available',
        course.releaseId,
      );
    }
  });
});
