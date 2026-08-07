import type {Metadata} from 'next';
import {unstable_noStore as noStore} from 'next/cache';
import {notFound} from 'next/navigation';

import {G5L4ExecutivePreview} from '@/components/g5-l4-executive-preview';
import {isG5L4ExecutivePreviewEnabled} from '@/lib/g5-l4-executive-preview';
import {hasExecutivePreviewSession} from '@/lib/executive-preview-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  if (
    !isG5L4ExecutivePreviewEnabled()
    || (
      process.env.NODE_ENV === 'production'
      && !(await hasExecutivePreviewSession())
    )
  ) notFound();

  return {
    title: 'G5 L4 Number Lines · Executive Preview',
    description: 'Private current-JavaScript candidate preview for Grade 5 Lesson 4.',
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noarchive: true,
        noimageindex: true,
        nocache: true
      }
    }
  };
}

export default async function G5L4ExecutivePreviewPage({
  params
}: {
  params: Promise<{locale: 'en' | 'es'}>;
}) {
  noStore();
  if (!isG5L4ExecutivePreviewEnabled()) notFound();
  const {locale} = await params;

  return <G5L4ExecutivePreview locale={locale} />;
}
