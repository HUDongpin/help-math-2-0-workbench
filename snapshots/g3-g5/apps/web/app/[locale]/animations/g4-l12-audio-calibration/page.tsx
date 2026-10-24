import {headers} from 'next/headers';
import {notFound} from 'next/navigation';

import {G4L12PrivateAudioCalibrationRuntime} from '@/components/g4-l12-private-audio-calibration-runtime';
import {Container} from '@/components/ui';
import {Link} from '@/i18n/navigation';
import {isG4L12PrivateAudioCalibrationAllowed} from '@/lib/g4-l12-private-audio-calibration-access.server';
import {readG4L12PrivateAudioCalibrationAssets} from '@/lib/g4-l12-private-audio-calibration-assets.server';
import {readG4L12Vb036PrivateBehavior} from '@/lib/g4-l12-vb036-private-behavior.server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Private source-audio calibration',
  robots: {index: false, follow: false},
};

export default async function AudioCalibrationPage({params, searchParams}: {
  params: Promise<{locale: 'en' | 'es'}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {locale} = await params;
  const query = await searchParams;
  const animationId = query.animationId;
  if (Object.keys(query).length !== 1 || typeof animationId !== 'string'
    || !['en', 'es'].includes(locale)
    || !['course-g04-l12-vb-035', 'course-g04-l12-vb-036'].includes(animationId)
    || !isG4L12PrivateAudioCalibrationAllowed({headers: await headers()})) notFound();
  const [allAssets, privateVb036Behavior] = await Promise.all([
    readG4L12PrivateAudioCalibrationAssets(),
    animationId === 'course-g04-l12-vb-036'
      ? readG4L12Vb036PrivateBehavior()
      : Promise.resolve(null),
  ]);
  const assets = allAssets?.filter(
    (asset) => asset.animationId === animationId);
  if (!assets?.length) notFound();
  const spanish = locale === 'es';
  return <main id="main-content"><Container>
    <header className="archive-page-header" style={{padding: '24px 0'}}>
      <h1 style={{fontSize: 'clamp(1.5rem, 4vw, 2.5rem)'}}>{spanish ? 'Calibración privada de audio' : 'Private audio calibration'}</h1>
      <p>{animationId} · {spanish ? 'Solo ingeniería local; no publicado.' : 'Local engineering only; unpublished.'}</p>
      <p>{spanish ? 'Dibujo fuente conservado en inglés; controles de interfaz en español.'
        : 'Preserved English source drawing; interface controls follow the selected locale.'}</p>
      <Link href="/courses/4/12">{spanish ? 'Abrir My Lesson' : 'Open My Lesson'}</Link>
    </header>
    <G4L12PrivateAudioCalibrationRuntime assets={assets} audioEnabled
      animationId={animationId} moduleKey={animationId} uiLanguage={locale}
      audioLanguage={locale}
      privateVb036Behavior={privateVb036Behavior ?? undefined}
      query={{lang: 'en', frameDomain: animationId.endsWith('035') ? 'sprite-35' : 'sprite-216',
        scenario: 'source-static-frame', seed: '0'}}
      labels={{replay: spanish ? 'Repetir' : 'Replay',
        reduced: spanish ? 'Movimiento reducido.' : 'Reduced motion is enabled.',
        prototype: spanish ? 'Calibración sin aceptar' : 'Unaccepted calibration',
        unavailable: spanish ? 'Módulo no disponible.' : 'Module unavailable.',
        loading: spanish ? 'Cargando…' : 'Loading…'}} />
  </Container></main>;
}
