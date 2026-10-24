import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {G4L11MigrationFactoryPlayer} from
  '@/components/g4-l11-migration-factory-player';
import {loadCurrentGrade4CourseCatalogCoverage} from
  '@/lib/g4-course-catalog-coverage.server';
import {buildG4L11MigrationFactoryDescriptor} from
  '@/lib/g4-l11-migration-factory';

export const metadata: Metadata = {
  title: 'G4 L11 private migration factory',
  robots: {follow: false, index: false},
};
export const dynamic = 'force-dynamic';

export default async function G4L11MigrationFactoryPage({
  params,
}: {
  params: Promise<{locale: 'en' | 'es'}>;
}) {
  const {locale} = await params;
  if (
    process.env.NODE_ENV === 'production' ||
    (locale !== 'en' && locale !== 'es')
  ) {
    notFound();
  }
  const descriptor = buildG4L11MigrationFactoryDescriptor(
    loadCurrentGrade4CourseCatalogCoverage(),
  );
  return <G4L11MigrationFactoryPlayer descriptor={descriptor} locale={locale} />;
}
