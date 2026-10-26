import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {ContinuousSourceClockLessonPilot} from '@/components/continuous-source-clock-lesson-pilot';
import {CONTINUOUS_AUDIO_PHASE} from '@/lib/continuous-source-audio-access';
import {DescriptorDrivenWholeLessonPlayer} from
  '@/components/descriptor-driven-whole-lesson-player';
import {findG678PartialCalibrationDescriptor} from
  '@/lib/g678-calibration-product-bridge.server';
import {isG678LocalPreviewRequestHeaders} from '@/lib/g678-preview-policy';

export const metadata: Metadata = {
  title: 'G6-G8 private Current-JS calibration',
  robots: {follow: false, index: false, noarchive: true},
};
export const dynamic = 'force-dynamic';

export default async function G678CalibrationProductBridgePage({
  params,
}: {
  params: Promise<{
    locale: 'en' | 'es';
    placementId: string;
  }>;
}) {
  const {locale, placementId} = await params;
  const requestHeaders = await headers();
  if (
    process.env.NODE_ENV === 'production' ||
    !isG678LocalPreviewRequestHeaders(requestHeaders) ||
    (locale !== 'en' && locale !== 'es')
  ) notFound();

  const descriptor = findG678PartialCalibrationDescriptor(placementId);
  if (!descriptor) notFound();

  const Player=process.env.HELP_MATH_G678_CALIBRATION_PHASE===CONTINUOUS_AUDIO_PHASE ? ContinuousSourceClockLessonPilot : DescriptorDrivenWholeLessonPlayer;
  return <main id="main-content">
    <Player
      audioEnabled={false}
      candidateMode
      descriptor={descriptor}
      hostPresentation="modern-wide"
      initialPlacementId={placementId}
      locale={locale}
      releasePublished={false}
      reviewerMode
      strictCompleteMemberCount={0}
    />
  </main>;
}
