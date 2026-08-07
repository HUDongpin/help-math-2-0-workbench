import {hasAnimationModule} from '@helpmath/demos/animation-registry';

import {isG4L3ControlledCeoPreviewEnabled} from './g4-l3-controlled-ceo-preview';
import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from './g4-l3-whole-lesson-player-descriptor';
import {isG5L4ExecutivePreviewEnabled} from './g5-l4-executive-preview';
import {G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR} from './g5-l4-whole-lesson-player-descriptor';
import type {WholeLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export type WholeLessonCoursePlayer =
  | Readonly<{
      kind: 'descriptor-driven';
    }>
  | Readonly<{
      kind: 'preserved-custom';
      component: 'g4-l3-whole-lesson-player';
      descriptorId: 'whole-lesson-player-g04-l03-v1';
    }>;

export interface WholeLessonCourseRegistration {
  readonly descriptor: WholeLessonPlayerDescriptor;
  readonly player: WholeLessonCoursePlayer;
  readonly isControlledPreviewEnabled: () => boolean;
}

export interface WholeLessonCourseRegistrationInput {
  readonly descriptor: WholeLessonPlayerDescriptor | undefined;
  readonly player: WholeLessonCoursePlayer;
  readonly isControlledPreviewEnabled: () => boolean;
}

function descriptorPagesAreRunnable(
  descriptor: WholeLessonPlayerDescriptor,
): boolean {
  const pageIds = descriptor.pages.map((page) => page.animationId);
  if (
    pageIds.length === 0 ||
    new Set(pageIds).size !== pageIds.length ||
    descriptor.sections.length === 0 ||
    new Set(descriptor.sections.map((section) => section.code)).size !==
      descriptor.sections.length ||
    descriptor.sections.reduce(
      (count, section) => count + section.activePageCount,
      0,
    ) !== descriptor.pages.length
  ) {
    return false;
  }

  const pagesAreSourceOrdered = descriptor.pages.every((page, index) =>
    page.globalPageOrdinal === index + 1 &&
    page.previousAnimationId === (descriptor.pages[index - 1]?.animationId ?? null) &&
    page.nextAnimationId === (descriptor.pages[index + 1]?.animationId ?? null) &&
    page.rendererAvailability.kind === 'registered' &&
    page.rendererAvailability.moduleKey.length > 0 &&
    hasAnimationModule(page.rendererAvailability.moduleKey)
  );
  if (!pagesAreSourceOrdered) return false;

  return descriptor.sections.every((section, index) => {
    const sectionPages = descriptor.pages.filter(
      (page) => page.sectionCode === section.code,
    );
    return section.order === index + 1 &&
      sectionPages.length === section.activePageCount &&
      sectionPages[0]?.animationId === section.firstActiveAnimationId &&
      sectionPages.every(
        (page, pageIndex) => page.sectionPageOrdinal === pageIndex + 1,
      );
  });
}

function descriptorDrivenShellIsBound(
  descriptor: WholeLessonPlayerDescriptor,
): boolean {
  const shell = descriptor.shellImplementation;
  return Boolean(
    shell &&
    shell.sourceAnimationId === descriptor.course.shellAnimationId &&
    shell.sourceAnimationId === descriptor.visualSkin.evidence.sourceAnimationId &&
    shell.sourceSwfSha256 === descriptor.visualSkin.evidence.sourceSwfSha256,
  );
}

/**
 * Validates one server-side course-player registration without granting any
 * runtime, fidelity, review, strict-completion, or publication authority.
 * Invalid descriptor shape or a stale preserved-player binding fails closed.
 */
export function buildWholeLessonCourseRegistration({
  descriptor,
  player,
  isControlledPreviewEnabled,
}: WholeLessonCourseRegistrationInput): WholeLessonCourseRegistration | undefined {
  if (
    !descriptor ||
    descriptor.schemaVersion !== 1 ||
    descriptor.course.grade < 1 ||
    descriptor.course.lesson < 1 ||
    descriptor.course.href !==
      `/courses/${descriptor.course.grade}/${descriptor.course.lesson}` ||
    descriptor.course.activePageCount !== descriptor.pages.length ||
    descriptor.course.courseShellCount !== 1 ||
    descriptor.course.expectedReleaseMemberCount !==
      descriptor.pages.length + descriptor.course.courseShellCount ||
    descriptor.visualSkin.evidence.sourceAnimationId !==
      descriptor.course.shellAnimationId ||
    !/^[a-f0-9]{64}$/.test(descriptor.source.sourceXmlSha256) ||
    !/^[a-f0-9]{64}$/.test(descriptor.visualSkin.evidence.sourceSwfSha256) ||
    !descriptorPagesAreRunnable(descriptor) ||
    typeof isControlledPreviewEnabled !== 'function'
  ) {
    return undefined;
  }

  if (
    player.kind === 'preserved-custom' &&
    descriptor.descriptorId !== player.descriptorId
  ) {
    return undefined;
  }

  if (
    player.kind === 'descriptor-driven' &&
    !descriptorDrivenShellIsBound(descriptor)
  ) {
    return undefined;
  }

  return Object.freeze({
    descriptor,
    player: Object.freeze({...player}),
    isControlledPreviewEnabled,
  });
}

const registrations = Object.freeze([
  buildWholeLessonCourseRegistration({
    descriptor: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR,
    player: Object.freeze({
      kind: 'preserved-custom',
      component: 'g4-l3-whole-lesson-player',
      descriptorId: 'whole-lesson-player-g04-l03-v1',
    }),
    isControlledPreviewEnabled: isG4L3ControlledCeoPreviewEnabled,
  }),
  buildWholeLessonCourseRegistration({
    descriptor: G5_L4_WHOLE_LESSON_PLAYER_DESCRIPTOR,
    player: Object.freeze({kind: 'descriptor-driven'}),
    isControlledPreviewEnabled: isG5L4ExecutivePreviewEnabled,
  }),
].filter(
  (registration): registration is WholeLessonCourseRegistration =>
    registration !== undefined,
));

export function wholeLessonCourseRegistrations(): readonly WholeLessonCourseRegistration[] {
  return registrations;
}

/**
 * Route lookup deliberately requires exactly one registration. A duplicate
 * course scope therefore closes the player route instead of choosing by order.
 */
export function findWholeLessonCourseRegistration(
  grade: string | number,
  lesson: string | number,
): WholeLessonCourseRegistration | undefined {
  const normalizedGrade = Number(grade);
  const normalizedLesson = Number(lesson);
  if (
    !Number.isSafeInteger(normalizedGrade) ||
    !Number.isSafeInteger(normalizedLesson)
  ) {
    return undefined;
  }

  const matches = registrations.filter(
    ({descriptor}) =>
      descriptor.course.grade === normalizedGrade &&
      descriptor.course.lesson === normalizedLesson,
  );
  return matches.length === 1 ? matches[0] : undefined;
}
