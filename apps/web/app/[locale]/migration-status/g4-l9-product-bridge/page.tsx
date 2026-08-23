import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {DescriptorDrivenWholeLessonPlayer} from '@/components/descriptor-driven-whole-lesson-player';
import {loadCurrentGrade4CourseCatalogCoverage} from '@/lib/g4-course-catalog-coverage.server';
import {buildG4L9ProductBridgeDescriptor} from '@/lib/g4-l9-product-bridge-descriptor';
import {isMigrationStatusAvailable} from '@/lib/migration-status-access';

export const metadata: Metadata = {
  title: 'G4 L9 P4 private product bridge',
  robots: {follow: false, index: false},
};
export const dynamic = 'force-dynamic';

export default async function G4L9ProductBridgePage({
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

  return <main id="main-content">
    <DescriptorDrivenWholeLessonPlayer
      audioEnabled
      candidateMode
      descriptor={buildG4L9ProductBridgeDescriptor(
        loadCurrentGrade4CourseCatalogCoverage(),
      )}
      hostPresentation="modern-wide"
      locale={locale}
      releasePublished={false}
      reviewerMode
      strictCompleteMemberCount={0}
    />
  </main>;
}
