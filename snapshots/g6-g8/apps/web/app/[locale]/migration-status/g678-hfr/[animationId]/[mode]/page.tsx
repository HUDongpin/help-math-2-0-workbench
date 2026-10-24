import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {hfrDocumentRequest} from '@/lib/hfr-local-access';

const loadSource = () => (process.env.NODE_ENV === 'development' || process.env.HELP_MATH_G678_COMPILED_LOCAL_QA === '1')
  ? import('@/lib/hfr-local-pages.server') : Promise.resolve(null);
const loadHost = () => (process.env.NODE_ENV === 'development' || process.env.HELP_MATH_G678_COMPILED_LOCAL_QA === '1')
  ? import('@/components/hfr-local-lesson') : Promise.resolve(null);
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'HFR local My Lesson review', robots: {index: false, follow: false, noarchive: true}};
export default async function Page({params, searchParams}: {
  params: Promise<{locale: string; animationId: string; mode: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {locale, animationId, mode} = await params;
  const incoming = await headers();
  const query = await searchParams;
  let url: URL;
  try {url = new URL(`http://${incoming.get('host') ?? 'invalid'}/${locale}/migration-status/g678-hfr/${animationId}/${mode}`);}
  catch {notFound();}
  for (const [key, value] of Object.entries(query)) {
    if (typeof value !== 'string') notFound();
    url.searchParams.set(key, value);
  }
  if (!hfrDocumentRequest(url, incoming, 'GET')) notFound();
  const source = await loadSource(), host = await loadHost();
  if (!source || !host) notFound();
  let descriptor;
  try {descriptor = await source.hfrLocalLessonDescriptor(animationId, mode as 'candidate' | 'registered');}
  catch {notFound();}
  return <div data-hfr-review-mode={mode} data-hfr-placement={animationId}>
    <host.HfrLocalLesson descriptor={descriptor} animationId={animationId} locale={locale as 'en' | 'es'} mode={mode as 'candidate' | 'registered'}
      audioEnabled={animationId !== 'shared-alg001-l06-p001'}/>
  </div>;
}
