import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';
import {ALG_L12_P012_ID, p012HostProbeDescriptor} from '@/lib/g678-alg-l12-p012-host-probe.server';
import {p012AssetManifest} from '@/lib/g678-alg-l12-p012-assets.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';
import {splitAdmissionDescriptor} from '@/lib/g678-split-admission.server';
import styles from '../shared-alg001-l12-p010/probe.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'P012 — Ordered Pairs Interaction candidate',
  robots: {index: false, follow: false, noarchive: true}};
const loadHost = () => process.env.NODE_ENV === 'production'
  ? import('@/lib/g678-alg-l12-p012-host.production-stub')
  : import('@/components/g678-alg-l12-p012-host-lesson');

export default async function Page({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL ||
    (locale !== 'en' && locale !== 'es') || !isG678LocalPreviewRequestHeaders(await headers())) notFound();
  const registered = new Set<string>(registeredLocalOnlyAnimationKeys);
  const formal = registered.has(ALG_L12_P012_ID);
  let descriptor, assets;
  try {descriptor = formal ? splitAdmissionDescriptor(ALG_L12_P012_ID) : p012HostProbeDescriptor(); assets = p012AssetManifest();}
  catch {notFound();}
  const {G678AlgL12P012HostLesson} = await loadHost();
  return <main id="main-content" className={styles.probe} data-p012-current-js={formal ? 'registered-local' : 'unregistered-probe'}
    data-official-alg-l12-current-js={`${descriptor.pages.filter(page => registered.has(page.animationId)).length}/52`}
    data-official-g678-current-js={`${registered.size}/2282`}>
    <G678AlgL12P012HostLesson key={locale} descriptor={descriptor} assets={assets}
      initialPlacementId={ALG_L12_P012_ID} locale={locale} audioEnabled={false}
      candidateMode hostPresentation="modern-wide" reviewerMode releasePublished={false} strictCompleteMemberCount={0}/>
    {!formal && <p role="status">{locale === 'es'
      ? 'Candidato local sin registrar. Esta página no se cuenta como una nueva migración completada.'
      : 'Unregistered local candidate. This page is not counted as a newly completed migration.'}</p>}
  </main>;
}
