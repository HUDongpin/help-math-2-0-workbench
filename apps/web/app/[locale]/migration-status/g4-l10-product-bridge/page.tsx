import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {DescriptorDrivenWholeLessonPlayer} from '@/components/descriptor-driven-whole-lesson-player';
import {buildG4L10ProductBridgeDescriptor} from '@/lib/g4-l10-product-bridge-descriptor';
import {loadCurrentGrade4CourseCatalogCoverage} from '@/lib/g4-course-catalog-coverage.server';
import {isMigrationStatusAvailable} from '@/lib/migration-status-access';

export const metadata: Metadata = {
  title: 'G4 L10 private product bridge',
  robots: {follow: false, index: false},
};
export const dynamic = 'force-dynamic';

export default async function G4L10ProductBridgePage({
  params,
}: {
  params: Promise<{locale: 'en' | 'es'}>;
}) {
  const {locale} = await params;
  if (
    process.env.NODE_ENV === 'production' ||
    !isMigrationStatusAvailable() ||
    (locale !== 'en' && locale !== 'es')
  ) {
    notFound();
  }

  const descriptor = buildG4L10ProductBridgeDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );

  return <main id="main-content">
    <DescriptorDrivenWholeLessonPlayer
      audioEnabled
      candidateMode
      descriptor={descriptor}
      hostPresentation="modern-wide"
      locale={locale}
      releasePublished={false}
      reviewerMode
      strictCompleteMemberCount={0}
    />
  </main>;
}
