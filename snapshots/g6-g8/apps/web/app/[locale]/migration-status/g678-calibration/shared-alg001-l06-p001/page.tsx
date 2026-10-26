import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {P001TitleView} from '@helpmath/demos/alg-l06-p001-local-candidate';
import {G678AlgL6P002Lesson} from '@/components/g678-alg-l06-p002-lesson';
import {P001LocalPlayback} from '@/components/g678-alg-l06-p001-local-playback';
import {ALG_L6_P001_ID, algL6P001Descriptor} from '@/lib/g678-alg-l06-p001.server';
import {isP001LocalHostQuery} from '@/lib/g678-alg-l06-p001-host-query';
import {loadP001LocalGlyphs} from '@/lib/g678-alg-l06-p001-local-assets.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import './p001-local-preview.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'P001 — private Current-JS local audit',
  robots: {index: false, follow: false, noarchive: true},
};

export default async function Page({params, searchParams}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || (locale !== 'en' && locale !== 'es') ||
      !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  const query = await searchParams;
  if (isP001LocalHostQuery(query)) {
    let descriptor;
    try { descriptor = algL6P001Descriptor(); } catch { notFound(); }
    return <main id="main-content" data-p001-local-preview>
      <G678AlgL6P002Lesson audioEnabled={false} candidateMode descriptor={descriptor}
        hostPresentation="modern-wide" initialPlacementId={ALG_L6_P001_ID}
        locale={locale} releasePublished={false} reviewerMode strictCompleteMemberCount={0}/>
    </main>;
  }
  if (Object.keys(query).some(key => key !== 'frame' && key !== 'play') ||
      (query.play !== undefined && (query.play !== '1' || query.frame !== undefined))) notFound();
  const raw = query.frame ?? '133';
  if (Array.isArray(raw) || !/^(?:[1-9]|[1-9]\d|1[0-2]\d|13[0-4])$/u.test(raw)) notFound();
  let glyphs;
  try {glyphs = loadP001LocalGlyphs();} catch {notFound();}
  return <main id="main-content" data-p001-local-preview>{query.play === '1'
    ? <P001LocalPlayback uiLanguage={locale} textAssetHrefs={glyphs}/>
    : <P001TitleView frame={Number(raw)} uiLanguage={locale} textAssetHrefs={glyphs}/>}</main>;
}
