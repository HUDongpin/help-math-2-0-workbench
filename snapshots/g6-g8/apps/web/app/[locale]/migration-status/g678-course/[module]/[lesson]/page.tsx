import type {Metadata} from 'next';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {notFound} from 'next/navigation';

import {getWorkspaceRoot} from '@/lib/catalog';
import {HFR_RENDERER_BINDING, projectRegisteredCoursePages, readLocalRegistryBindings} from '@/lib/g678-course-playback';
import {isG678LocalPreviewEnabled, isG678ModuleCode} from '@/lib/g678-preview-policy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'G6–G8 local My Lesson',
  robots: {index: false, follow: false, noarchive: true},
};

const MAX_PAGE = 80;

async function registeredLocalLesson(moduleCode: string, lessonNumber: number, locale: 'en' | 'es') {
  const prefix = `shared-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, '0')}-p`;
  const [{g678PartialCalibrationSnapshot}, {DescriptorDrivenWholeLessonPlayer}, registryText] = await Promise.all([
    import('@/lib/g678-calibration-product-bridge.server'),
    import('@/components/descriptor-driven-whole-lesson-player'),
    readFile(path.join(getWorkspaceRoot(), 'packages/demos/src/registry.local-only.generated.ts'), 'utf8'),
  ]);
  const isAlgL6 = moduleCode === 'ALG001' && lessonNumber === 6;
  const snapshot = isAlgL6 ? null : g678PartialCalibrationSnapshot();
  if (snapshot && snapshot.status !== 'ready') return undefined;
  const matches = snapshot?.descriptors.filter((descriptor) =>
    descriptor.course.moduleCode === moduleCode && descriptor.course.lesson === lessonNumber);
  const base = isAlgL6
    ? (await import('@/lib/g678-course-runtime-metadata.server')).currentAlgL6SourceDescriptor(getWorkspaceRoot())
    : matches?.length === 1 ? matches[0] : undefined;
  if (!base) return undefined;
  const registry = new Map([...readLocalRegistryBindings(registryText)].filter(([id]) => id.startsWith(prefix)));
  const isNmsL1 = moduleCode === 'NMS002' && lessonNumber === 1;
  const usesSourceAdapters = isNmsL1 || isAlgL6;
  const hfrEntry = !usesSourceAdapters && base.pages.find(page => registry.get(page.animationId) === HFR_RENDERER_BINDING);
  // The maintained HFR descriptor verifies registered siblings and preserves
  // their source glossary/host capabilities, not just renderer membership.
  const hfrDescriptor = hfrEntry
    ? await (await import('@/lib/hfr-local-pages.server')).hfrLocalLessonDescriptor(hfrEntry.animationId, 'registered')
    : undefined;
  const courseBase = hfrDescriptor
    ? Object.freeze({...hfrDescriptor, course: Object.freeze({...hfrDescriptor.course,
      href: `/migration-status/g678-course/${moduleCode.toLowerCase()}/${lessonNumber}`})})
    : base;
  const projection = projectRegisteredCoursePages(courseBase.pages, registry);
  const descriptor = usesSourceAdapters
    ? (await import('@/lib/g678-course-runtime-metadata.server')).applyG678CourseRuntimeMetadata(getWorkspaceRoot(), base).descriptor
    : Object.freeze({...courseBase, pages: projection.pages});
  const first = descriptor.pages.find((page) => page.rendererAvailability.kind === 'registered');
  if (!first) return undefined;
  const unavailableAnimationIds = descriptor.pages.filter(page => page.rendererAvailability.kind !== 'registered').map(page => page.animationId);
  const Player = isNmsL1
    ? (await import('@/components/g678-nms-l01-course-player')).G678NmsL1CoursePlayer
    : isAlgL6
      ? (await import('@/components/g678-alg-l06-course-player')).G678AlgL6CoursePlayer
      : DescriptorDrivenWholeLessonPlayer;
  const player = <Player
    {...(hfrDescriptor ? {audioEnabled: true} : {})}
    candidateMode
    descriptor={descriptor}
    hostPresentation="modern-wide"
    initialPlacementId={first.placementId ?? first.animationId}
    locale={locale}
    reviewerMode={usesSourceAdapters}
    releasePublished={false}
    strictCompleteMemberCount={0}
  />;
  return <div
    data-g678-course-lesson={lessonNumber}
    data-g678-course-module={moduleCode}
    data-g678-hfr-pages={projection.hfrPageCount}
    data-g678-unavailable-count={unavailableAnimationIds.length}
  >
    <ul data-g678-unavailable-pages="true" hidden={unavailableAnimationIds.length === 0}>
      {unavailableAnimationIds.map((animationId) => <li key={animationId}>{animationId}</li>)}
    </ul>
    {player}
  </div>;
}

export default async function Page({params}: {
  params: Promise<{locale: string; module: string; lesson: string}>;
}) {
  const {locale, module, lesson} = await params;
  const moduleCode = module.trim().toUpperCase();
  const lessonNumber = Number(lesson);
  if (
    !isG678LocalPreviewEnabled() ||
    (locale !== 'en' && locale !== 'es') ||
    !isG678ModuleCode(moduleCode) ||
    !Number.isInteger(lessonNumber) ||
    lessonNumber < 1 ||
    lessonNumber > 12
  ) notFound();
  const localLesson = await registeredLocalLesson(moduleCode, lessonNumber, locale);
  if (localLesson) return localLesson;
  // Development-only reader. A static import would pull the admission graph
  // into the production server bundle.
  const [{hfrLocalLessonDescriptor}, {HfrLocalLesson}] = await Promise.all([
    import('@/lib/hfr-local-pages.server'),
    import('@/components/hfr-local-lesson'),
  ]);
  const prefix = `shared-${moduleCode.toLowerCase()}-l${String(lessonNumber).padStart(2, '0')}-p`;
  for (let page = 1; page <= MAX_PAGE; page += 1) {
    const animationId = `${prefix}${String(page).padStart(3, '0')}`;
    try {
      const descriptor = await hfrLocalLessonDescriptor(animationId, 'registered');
      return <div data-g678-course-module={moduleCode} data-g678-course-lesson={lessonNumber}>
        <HfrLocalLesson
          animationId={animationId}
          descriptor={descriptor}
          locale={locale}
          mode="registered"
        />
      </div>;
    } catch {
      // This page is not an HFR registration. Keep scanning.
    }
  }
  notFound();
}
