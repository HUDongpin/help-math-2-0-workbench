import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import {
  NOVA_TUTOR_COURSE_POLICY,
  type NovaCapabilitiesEnvironment,
} from '../lib/nova-capabilities.server';
import {
  NOVA_OPENROUTER_MODEL,
  buildNovaSystemInstruction,
} from '../lib/nova-openrouter.server';
import {
  NovaTutorRequestResolutionError,
  resolveNovaTutorRequest,
  type NovaTutorRequestResolutionFailure,
} from '../lib/nova-request-resolver.server';
import {novaTutorRequestSchema} from '../lib/nova-request-schema';
import {findWholeLessonCourseRegistration} from
  '../lib/whole-lesson-course-registry';

const onePixelPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function configuredEnvironment(
  overrides: Readonly<Record<string, string | undefined>> = {},
): NovaCapabilitiesEnvironment {
  return {
    NODE_ENV: 'development',
    MODERN_WIDE_SHELL_ENABLED: 'true',
    NOVA_TUTOR_ENABLED: 'true',
    NOVA_TUTOR_RELEASE_IDS: NOVA_TUTOR_COURSE_POLICY
      .map((entry) => entry.releaseId)
      .join(','),
    NOVA_ALLOW_FRAME_CONTEXT: 'false',
    NOVA_ALLOW_SPEECH_INPUT: 'false',
    NOVA_MODEL: NOVA_OPENROUTER_MODEL,
    OPENROUTER_API_KEY: 'sk-or-v1-test-only-key-1234567890',
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    ...overrides,
  };
}

function transportFor(
  grade: number,
  lesson: number,
  pageIndex = 0,
  locale: 'en' | 'es' = 'en',
) {
  const registration = findWholeLessonCourseRegistration(grade, lesson);
  assert.ok(registration);
  const {descriptor} = registration;
  const page = descriptor.pages[pageIndex];
  assert.ok(page);
  const section = descriptor.sections.find(
    (candidate) => candidate.code === page.sectionCode,
  );
  assert.ok(section);
  const pageLabel = page.labels[locale];
  const sectionLabel = section.labels[locale];
  return {
    locale,
    mode: 'study' as const,
    message: 'Help me understand this page.',
    history: [{role: 'user' as const, text: 'Can you give me one hint?'}],
    context: {
      releaseId: descriptor.releaseId,
      grade,
      lesson,
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
      assessment: ['TI', 'TS', 'FQ'].includes(page.sectionCode),
    },
  };
}

async function expectResolutionFailure(
  promise: ReturnType<typeof resolveNovaTutorRequest>,
  failure: NovaTutorRequestResolutionFailure,
) {
  await assert.rejects(promise, (error) =>
    error instanceof NovaTutorRequestResolutionError &&
    error.failure === failure
  );
}

describe('resolveNovaTutorRequest', () => {
  it('resolves all 426 canonical placements in both locales', async () => {
    let resolvedCases = 0;
    for (const course of NOVA_TUTOR_COURSE_POLICY) {
      const registration = findWholeLessonCourseRegistration(
        course.grade,
        course.lesson,
      );
      assert.ok(registration);
      for (const pageIndex of registration.descriptor.pages.keys()) {
        for (const locale of ['en', 'es'] as const) {
          const transport = novaTutorRequestSchema.parse(
            transportFor(course.grade, course.lesson, pageIndex, locale),
          );
          const resolved = await resolveNovaTutorRequest(
            transport,
            configuredEnvironment(),
          );
          assert.equal(resolved.context.releaseId, course.releaseId);
          assert.equal(resolved.context.grade, course.grade);
          assert.equal(resolved.context.lesson, course.lesson);
          assert.equal(resolved.context.globalPageOrdinal, pageIndex + 1);
          assert.equal(resolved.locale, locale);
          assert.equal(resolved.mode, 'focus');
          assert.ok(resolved.context.courseTitleEnglish);
          assert.ok(resolved.context.sectionTitleEnglish);
          const instruction = buildNovaSystemInstruction(resolved);
          assert.match(
            instruction,
            new RegExp(`Grade ${course.grade} learner`, 'u'),
          );
          assert.match(instruction, new RegExp(
            resolved.context.courseTitleEnglish.replace(
              /[.*+?^${}()|[\]\\]/gu,
              '\\$&',
            ),
            'u',
          ));
          resolvedCases += 1;
        }
      }
    }
    assert.equal(resolvedCases, 852);
  });

  it('uses ordinal placement identity when one animation occurs twice', async () => {
    const first = novaTutorRequestSchema.parse(transportFor(5, 3, 44));
    const second = novaTutorRequestSchema.parse(transportFor(5, 3, 45));
    assert.equal(first.context.animationId, second.context.animationId);

    const firstResolved = await resolveNovaTutorRequest(
      first,
      configuredEnvironment(),
    );
    const secondResolved = await resolveNovaTutorRequest(
      second,
      configuredEnvironment(),
    );
    assert.equal(firstResolved.context.globalPageOrdinal, 45);
    assert.equal(secondResolved.context.globalPageOrdinal, 46);
    assert.notEqual(
      firstResolved.context.placementId,
      secondResolved.context.placementId,
    );
  });

  it('rejects every caller-controlled canonical field when individually forged', async () => {
    const base = transportFor(4, 3, 4, 'en');
    const nextPage = transportFor(4, 3, 5, 'en');
    const otherCourse = NOVA_TUTOR_COURSE_POLICY.find(
      (course) => course.grade === 5 && course.lesson === 4,
    );
    assert.ok(otherCourse);

    const forgedRequests = [
      ['releaseId', {
        ...base,
        context: {...base.context, releaseId: otherCourse.releaseId},
      }],
      ['grade', {
        ...base,
        context: {...base.context, grade: 5},
      }],
      ['lesson', {
        ...base,
        context: {...base.context, lesson: 4},
      }],
      ['animationId', {
        ...base,
        context: {
          ...base.context,
          animationId: nextPage.context.animationId,
        },
      }],
      ['sectionCode', {
        ...base,
        context: {...base.context, sectionCode: 'RW'},
      }],
      ['sectionTitle', {
        ...base,
        context: {...base.context, sectionTitle: 'Caller supplied section'},
      }],
      ['globalPageOrdinal', {
        ...base,
        context: {
          ...base.context,
          globalPageOrdinal: base.context.globalPageOrdinal + 1,
        },
      }],
      ['activePageCount', {
        ...base,
        context: {
          ...base.context,
          activePageCount: base.context.activePageCount + 1,
        },
      }],
      ['pageTitle', {
        ...base,
        context: {...base.context, pageTitle: 'Caller supplied title'},
      }],
      ['pageTitleEnglish', {
        ...base,
        context: {
          ...base.context,
          pageTitleEnglish: 'Caller supplied English title',
        },
      }],
      ['pageTitleSpanish', {
        ...base,
        context: {...base.context, pageTitleSpanish: null},
      }],
      ['locale', {
        ...base,
        locale: 'es' as const,
        context: {...base.context, locale: 'es' as const},
      }],
      ['pageTitleUsesEnglishFallback', {
        ...base,
        context: {...base.context, pageTitleUsesEnglishFallback: true},
      }],
      ['assessment', {
        ...base,
        context: {...base.context, assessment: true},
      }],
    ] as const;

    let rejectedCases = 0;
    for (const [field, forged] of forgedRequests) {
      const parsed = novaTutorRequestSchema.parse(forged);
      await assert.rejects(
        resolveNovaTutorRequest(parsed, configuredEnvironment()),
        (error) =>
          error instanceof NovaTutorRequestResolutionError &&
          error.failure === 'canonical-mismatch',
        `${field} must be re-derived from the canonical descriptor`,
      );
      rejectedCases += 1;
    }
    assert.equal(rejectedCases, 14);
  });

  it('independently blocks an unselected course and a non-modern host', async () => {
    const request = novaTutorRequestSchema.parse(transportFor(4, 3));
    await expectResolutionFailure(
      resolveNovaTutorRequest(
        request,
        configuredEnvironment({NOVA_TUTOR_RELEASE_IDS: ''}),
      ),
      'course-not-available',
    );
    await expectResolutionFailure(
      resolveNovaTutorRequest(
        request,
        configuredEnvironment({MODERN_WIDE_SHELL_ENABLED: 'false'}),
      ),
      'course-not-available',
    );
  });

  it('fails invalid rollout/provider configuration as not configured', async () => {
    const request = novaTutorRequestSchema.parse(transportFor(4, 3));
    await expectResolutionFailure(
      resolveNovaTutorRequest(
        request,
        configuredEnvironment({
          NOVA_TUTOR_RELEASE_IDS:
            'lesson-g04-l03-negative-numbers,lesson-g04-l03-negative-numbers',
        }),
      ),
      'not-configured',
    );
    await expectResolutionFailure(
      resolveNovaTutorRequest(
        request,
        configuredEnvironment({NOVA_MODEL: 'fallback-model'}),
      ),
      'not-configured',
    );
  });

  it('authorizes and normalizes a frame only through the independent flag', async () => {
    const raw = transportFor(4, 3);
    const withFrame = novaTutorRequestSchema.parse({
      ...raw,
      frame: {
        releaseId: raw.context.releaseId,
        globalPageOrdinal: raw.context.globalPageOrdinal,
        animationId: raw.context.animationId,
        dataUrl: onePixelPng,
        width: 1,
        height: 1,
      },
    });
    await expectResolutionFailure(
      resolveNovaTutorRequest(withFrame, configuredEnvironment()),
      'frame-not-available',
    );

    const resolved = await resolveNovaTutorRequest(
      withFrame,
      configuredEnvironment({NOVA_ALLOW_FRAME_CONTEXT: 'true'}),
    );
    assert.match(resolved.frame?.dataUrl ?? '', /^data:image\/jpeg;base64,/u);
    assert.equal(resolved.frame?.releaseId, raw.context.releaseId);
    assert.equal(resolved.frame?.globalPageOrdinal, 1);
  });

  it('rejects all frame placement identity mismatches at schema and resolver layers', async () => {
    const raw = transportFor(4, 3, 4);
    const otherCourse = NOVA_TUTOR_COURSE_POLICY.find(
      (course) => course.grade === 5 && course.lesson === 4,
    );
    assert.ok(otherCourse);
    const canonicalFrame = {
      releaseId: raw.context.releaseId,
      globalPageOrdinal: raw.context.globalPageOrdinal,
      animationId: raw.context.animationId,
      dataUrl: onePixelPng,
      width: 1,
      height: 1,
    };
    const canonicalRequest = novaTutorRequestSchema.parse({
      ...raw,
      frame: canonicalFrame,
    });
    const mismatchedFrames = [
      ['releaseId', {...canonicalFrame, releaseId: otherCourse.releaseId}],
      ['globalPageOrdinal', {
        ...canonicalFrame,
        globalPageOrdinal: canonicalFrame.globalPageOrdinal + 1,
      }],
      ['animationId', {
        ...canonicalFrame,
        animationId: 'course-g04-l03-vb-forged',
      }],
    ] as const;

    for (const [field, frame] of mismatchedFrames) {
      assert.equal(
        novaTutorRequestSchema.safeParse({...raw, frame}).success,
        false,
        `${field} must fail transport consistency validation`,
      );
      await assert.rejects(
        resolveNovaTutorRequest(
          {...canonicalRequest, frame},
          configuredEnvironment({NOVA_ALLOW_FRAME_CONTEXT: 'true'}),
        ),
        (error) =>
          error instanceof NovaTutorRequestResolutionError &&
          error.failure === 'canonical-mismatch',
        `${field} must fail the server-trusted placement recheck`,
      );
    }
  });

  it('rejects unsupported frame MIME and declared-type signature mismatch', () => {
    const raw = transportFor(4, 3, 4);
    const pngBase64 = onePixelPng.split(',', 2)[1];
    assert.ok(pngBase64);
    const frame = {
      releaseId: raw.context.releaseId,
      globalPageOrdinal: raw.context.globalPageOrdinal,
      animationId: raw.context.animationId,
      width: 1,
      height: 1,
    };

    assert.equal(novaTutorRequestSchema.safeParse({
      ...raw,
      frame: {...frame, dataUrl: `data:image/gif;base64,${pngBase64}`},
    }).success, false);
    assert.equal(novaTutorRequestSchema.safeParse({
      ...raw,
      frame: {...frame, dataUrl: `data:image/jpeg;base64,${pngBase64}`},
    }).success, false);
  });

  it('carries trusted course, section, and page fallback facts into the prompt DTO', async () => {
    const request = novaTutorRequestSchema.parse(transportFor(4, 3, 0, 'es'));
    const resolved = await resolveNovaTutorRequest(
      request,
      configuredEnvironment(),
    );
    assert.equal(resolved.context.courseTitleSpanish, null);
    assert.equal(resolved.context.courseTitleUsesEnglishFallback, true);
    assert.equal(resolved.context.sectionTitleSpanish, 'Introduction');
    assert.equal(resolved.context.sectionTitleUsesEnglishFallback, false);
    assert.equal(resolved.context.pageTitleSpanish, null);
    assert.equal(resolved.context.pageTitleUsesEnglishFallback, true);
    const instruction = buildNovaSystemInstruction(resolved);
    assert.match(instruction, /Trusted course-title sources:/u);
    assert.match(instruction, /Trusted section-title sources:/u);
    assert.match(instruction, /Trusted page-title sources:/u);
    assert.match(instruction, /not supplied by the lesson source/u);
    assert.match(instruction, /current title uses English fallback: yes/u);
  });
});
