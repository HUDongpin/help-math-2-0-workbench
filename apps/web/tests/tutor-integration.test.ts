import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NOVA_TUTOR_MODE_PRODUCT_LABELS,
  TUTOR_ASSESSMENT_SECTIONS,
  isTutorAssessmentSection,
  novaTutorModeHref,
  resolveTutorAvailability,
  resolveNovaTutorMode,
  tutorContextSummary,
  tutorFrameSnapshot,
  tutorPageContext,
  tutorStageFrameSnapshot,
} from '../lib/tutor-integration';
import {G4_L3_LESSON} from '../lib/g4-l3-lesson-navigation';

function context(overrides: Partial<Parameters<typeof tutorPageContext>[0]> = {}) {
  return tutorPageContext({
    releaseId: G4_L3_LESSON.releaseId,
    grade: 4,
    lesson: 3,
    animationId: 'course-g04-l03-ts-006',
    sectionCode: 'TS',
    sectionTitle: 'Practice Test',
    globalPageOrdinal: 34,
    activePageCount: 39,
    pageTitle: '4 - Step Plan',
    pageTitleEnglish: '4 - Step Plan',
    pageTitleSpanish: null,
    locale: 'en',
    ...overrides,
  });
}

test('page context carries where the learner is without anyone typing it', () => {
  const ctx = context();
  assert.equal(ctx.animationId, 'course-g04-l03-ts-006');
  assert.equal(ctx.globalPageOrdinal, 34);
  assert.equal(ctx.activePageCount, 39);
  assert.equal(ctx.sectionCode, 'TS');
  assert.equal(ctx.releaseId, 'lesson-g04-l03-negative-numbers');
  assert.equal(ctx.pageTitleEnglish, '4 - Step Plan');
  assert.equal(ctx.pageTitleSpanish, null);
});

test('page context is frozen so it cannot be widened after construction', () => {
  const ctx = context();
  assert.ok(Object.isFrozen(ctx));
});

test('impossible page positions are rejected rather than sent to a tutor', () => {
  assert.throws(() => context({globalPageOrdinal: 0}), /globalPageOrdinal/);
  assert.throws(() => context({globalPageOrdinal: 40}), /cannot exceed/);
  assert.throws(() => context({activePageCount: 0}), /activePageCount/);
  assert.throws(() => context({animationId: ''}), /animationId/);
});

test('assessment sections are flagged so the tutor scaffolds instead of answering', () => {
  assert.deepEqual([...TUTOR_ASSESSMENT_SECTIONS], ['TI', 'TS', 'FQ']);
  for (const code of ['TI', 'TS', 'FQ']) {
    assert.equal(isTutorAssessmentSection(code), true, code);
    assert.equal(context({sectionCode: code}).assessment, true, code);
  }
  for (const code of ['IR', 'RW', 'VB', 'IN', 'GS']) {
    assert.equal(isTutorAssessmentSection(code), false, code);
    assert.equal(context({sectionCode: code}).assessment, false, code);
  }
});

test('every assessment section code is a real section of the lesson', () => {
  const known = new Set(G4_L3_LESSON.sections.map((section) => section.code));
  for (const code of TUTOR_ASSESSMENT_SECTIONS) {
    assert.ok(known.has(code as never), `${code} is not a section of G4 L3`);
  }
});

test('a missing Spanish title is reported, never presented as sourced', () => {
  assert.equal(context().pageTitleUsesEnglishFallback, false);
  const fallback = context({locale: 'es', pageTitleUsesEnglishFallback: true});
  assert.equal(fallback.pageTitleUsesEnglishFallback, true);
});

test('the context summary states the page in the reader’s language', () => {
  assert.equal(
    tutorContextSummary(context()),
    'Page 34 of 39 · Practice Test · 4 - Step Plan',
  );
  assert.equal(
    tutorContextSummary(context({locale: 'es'})),
    'Página 34 de 39 · Practice Test · 4 - Step Plan',
  );
});

test('every legacy lesson mode input resolves to the single Focus view', () => {
  assert.equal(resolveNovaTutorMode('focus'), 'focus');
  assert.equal(resolveNovaTutorMode('study'), 'focus');
  assert.equal(resolveNovaTutorMode('classroom'), 'focus');
  assert.equal(resolveNovaTutorMode(['study', 'focus']), 'focus');
  assert.equal(resolveNovaTutorMode('unknown'), 'focus');
  assert.equal(resolveNovaTutorMode(undefined), 'focus');
});

test('legacy product labels remain metadata while lesson links canonicalize to Focus', () => {
  assert.deepEqual(NOVA_TUTOR_MODE_PRODUCT_LABELS, {
    focus: {
      en: 'Focus', es: 'Enfoque', zh: '专注学习',
      purposeEn: 'Focused learning', purposeEs: 'Aprendizaje enfocado',
    },
    study: {
      en: 'Study', es: 'Estudio', zh: '辅助学习',
      purposeEn: 'Learning support', purposeEs: 'Apoyo de aprendizaje',
    },
    classroom: {
      en: 'Classroom', es: 'Clase', zh: '课堂展示',
      purposeEn: 'Class display', purposeEs: 'Presentación de clase',
    },
  });
  assert.equal(
    novaTutorModeHref('/courses/4/3', 'focus'),
    '/courses/4/3?mode=focus',
  );
  assert.equal(
    novaTutorModeHref('/courses/4/3?review=1&mode=focus#page', 'classroom'),
    '/courses/4/3?review=1&mode=focus#page',
  );
});

/* ---------- frame snapshot ---------- */

test('a snapshot is produced for a canvas-backed page', () => {
  const canvas = {
    width: 800,
    height: 600,
    toDataURL: () => 'data:image/png;base64,AAAA',
  } as unknown as HTMLCanvasElement;
  const shot = tutorFrameSnapshot(canvas, 'course-g04-l03-in-004');
  assert.equal(shot?.width, 800);
  assert.equal(shot?.height, 600);
  assert.equal(shot?.animationId, 'course-g04-l03-in-004');
});

test('a modern-wide snapshot is cropped to the visible authored content band', () => {
  let drawArguments: readonly unknown[] = [];
  const output = {
    width: 0,
    height: 0,
    getContext: () => ({
      drawImage: (...args: readonly unknown[]) => { drawArguments = args; },
    }),
    toDataURL: () => 'data:image/png;base64,CROPPED',
  };
  const canvas = {
    width: 800,
    height: 600,
    ownerDocument: {createElement: () => output},
    toDataURL: () => 'data:image/png;base64,FULL',
  } as unknown as HTMLCanvasElement;
  const shot = tutorFrameSnapshot(
    canvas,
    'course-g04-l03-ts-006',
    {left: 0, top: 109, width: 800, height: 415},
  );
  assert.equal(shot?.width, 800);
  assert.equal(shot?.height, 415);
  assert.equal(shot?.dataUrl, 'data:image/png;base64,CROPPED');
  assert.deepEqual(drawArguments.slice(1), [0, 109, 800, 415, 0, 0, 800, 415]);
});

test('an invalid snapshot crop fails closed', () => {
  const canvas = {
    width: 800,
    height: 600,
    ownerDocument: {createElement: () => null},
    toDataURL: () => 'data:image/png;base64,FULL',
  } as unknown as HTMLCanvasElement;
  assert.equal(
    tutorFrameSnapshot(canvas, 'x', {left: 0, top: 500, width: 800, height: 415}),
    null,
  );
});

test('a page without a renderable frame degrades to context-only support', async () => {
  assert.equal(tutorFrameSnapshot(null, 'course-g04-l03-vb-004'), null);
  assert.equal(tutorFrameSnapshot(undefined, 'course-g04-l03-vb-004'), null);
  assert.equal(await tutorStageFrameSnapshot(
    {querySelector: () => null} as unknown as HTMLElement,
    'course-g04-l03-vb-004',
  ), null);
});

test('stage capture prefers a painted canvas before attempting SVG fallback', async () => {
  const canvas = {
    width: 800,
    height: 600,
    toDataURL: () => 'data:image/png;base64,STAGE',
  } as unknown as HTMLCanvasElement;
  const stage = {
    querySelector: (selector: string) => selector === 'canvas' ? canvas : null,
  } as unknown as HTMLElement;
  const shot = await tutorStageFrameSnapshot(stage, 'course-g04-l03-vb-004');
  assert.equal(shot?.dataUrl, 'data:image/png;base64,STAGE');
  assert.equal(shot?.width, 800);
  assert.equal(shot?.height, 600);
});

test('a tainted or empty canvas never takes the lesson down', () => {
  const tainted = {
    width: 800,
    height: 600,
    toDataURL: () => {
      throw new Error('tainted');
    },
  } as unknown as HTMLCanvasElement;
  assert.equal(tutorFrameSnapshot(tainted, 'x'), null);

  const empty = {width: 0, height: 0, toDataURL: () => 'data:,'} as unknown as HTMLCanvasElement;
  assert.equal(tutorFrameSnapshot(empty, 'x'), null);

  const transparent = {
    width: 2,
    height: 2,
    getContext: () => ({
      getImageData: () => ({data: new Uint8ClampedArray(16)}),
    }),
    toDataURL: () => 'data:image/png;base64,TRANSPARENT',
  } as unknown as HTMLCanvasElement;
  assert.equal(tutorFrameSnapshot(transparent, 'x'), null);
});

/* ---------- availability ---------- */

test('the player exposes a same-origin gateway without claiming connectivity', () => {
  assert.deepEqual({...resolveTutorAvailability({})}, {
    kind: 'same-origin-gateway',
    connectivity: 'not-yet-confirmed',
  });
  assert.deepEqual(
    {...resolveTutorAvailability({TUTOR_PROVIDER_ID: 'nova'})},
    {
      kind: 'same-origin-gateway',
      connectivity: 'not-yet-confirmed',
    },
  );
});
