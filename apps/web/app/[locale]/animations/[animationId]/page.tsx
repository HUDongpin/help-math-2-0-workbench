import {matchPrototype} from '@helpmath/demos/prototype-manifest';
import {frameDomainMovie, resolveFrameDomain} from '@helpmath/demos/runtime';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {AnimationRuntime} from '@/components/animation-runtime';
import {G4L3LessonContextNavigation} from '@/components/g4-l3-lesson-navigation';
import {LessonContextNavigation} from '@/components/lesson-navigation';
import {Container} from '@/components/ui';
import {Link} from '@/i18n/navigation';
import {buildCaptureFrameLinks} from '@/lib/animation-capture-controls';
import {getCatalog, isAnimationPublished, isLessonReleasePublished} from '@/lib/catalog';
import {G4_L3_LESSON} from '@/lib/g4-l3-lesson-navigation';
import {findLessonNavigationForAnimation} from '@/lib/lesson-navigation';

export const dynamic = 'force-dynamic';
type Query = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export async function generateMetadata({params}: {params: Promise<{animationId: string}>}): Promise<Metadata> {
  const {animationId} = await params;
  const catalog = getCatalog();
  const animation = catalog.animations.find((candidate) => candidate.animationId === animationId);
  if (!animation || (process.env.NODE_ENV === 'production' && !isAnimationPublished(catalog, animation))) notFound();
  return {title: animation.classification.titleDisplay, robots: animation.migration.status === 'complete' ? undefined : {index: false, follow: false}};
}

export default async function AnimationPage({params, searchParams}: {params: Promise<{locale: 'en' | 'es'; animationId: string}>; searchParams: Promise<Query>}) {
  const [{locale, animationId}, query] = await Promise.all([params, searchParams]);
  const catalog = getCatalog();
  const animation = catalog.animations.find((item) => item.animationId === animationId);
  if (!animation || (process.env.NODE_ENV === 'production' && !isAnimationPublished(catalog, animation))) notFound();
  const spanish = locale === 'es';
  const auditPreview = process.env.NODE_ENV !== 'production';
  const completeAnimationIds = new Set(catalog.animations
    .filter((candidate) => candidate.migration.status === 'complete')
    .map((candidate) => candidate.animationId));
  const g4L3ReleasePublished = isLessonReleasePublished(catalog, G4_L3_LESSON.releaseId);
  const lessonDescriptor = findLessonNavigationForAnimation(catalog, animationId);
  const lessonReleasePublished = lessonDescriptor
    ? isLessonReleasePublished(catalog, lessonDescriptor.releaseId)
    : false;
  const prototype = matchPrototype({animationId, sourcePath: animation.source.path});
  const requestedLanguage = first(query.lang);
  const queryLanguage = requestedLanguage === 'en' || requestedLanguage === 'es' ? requestedLanguage : locale;
  const frame = first(query.frame); const frameDomain = first(query.frameDomain); const scenario = first(query.scenario); const seed = first(query.seed); const requirementId = first(query.requirementId); const trace = first(query.trace); const entryStateSha256 = first(query.entryStateSha256); const capture = first(query.capture);
  const captureMode = capture === '1';
  const duplicateCaptureIdentity = captureMode && ([
    'frame', 'frameDomain', 'requirementId', 'trace', 'entryStateSha256',
    'scenario', 'lang', 'seed', 'capture'
  ] as const).some((name) => Array.isArray(query[name]));
  const selectedDomain = prototype
    ? resolveFrameDomain(prototype.runtime, frameDomain)
    : undefined;
  const frameCount = prototype && selectedDomain
    ? frameDomainMovie(prototype.runtime, selectedDomain).frameCount
    : animation.source.swf.frameCount ?? 1;
  const frameLinks = buildCaptureFrameLinks(frameCount);
  const moduleKey = prototype?.key ?? animation.animationId;
  const frameDomainQuery = frameDomain ? `frameDomain=${encodeURIComponent(frameDomain)}&` : '';
  const traceStateQuery = `${requirementId ? `requirementId=${encodeURIComponent(requirementId)}&` : ''}${trace ? `trace=${encodeURIComponent(trace)}&` : ''}${entryStateSha256 ? `entryStateSha256=${encodeURIComponent(entryStateSha256)}&` : ''}`;
  const scenarioQuery = scenario ? `scenario=${encodeURIComponent(scenario)}&` : '';

  return <main className={captureMode ? 'capture-page' : undefined} id="main-content">
    <header className="animation-header"><Container><div className="animation-breadcrumbs"><Link href="/library">{spanish ? 'Biblioteca' : 'Library'}</Link><span aria-hidden="true">/</span><span>{animation.classification.collection}</span></div><div className="animation-title-row"><div><p className="eyebrow">{animation.classification.grade === 'elementary' ? (spanish ? 'Compartido · Primaria' : 'Shared · Elementary') : `${spanish ? 'Grado' : 'Grade'} ${animation.classification.grade ?? '—'} · ${spanish ? 'Lección' : 'Lesson'} ${animation.classification.lesson ?? '—'}`}</p><h1>{animation.classification.titleDisplay}</h1>{animation.classification.titleRaw !== animation.classification.titleDisplay ? <p className="raw-title">Original: {animation.classification.titleRaw}</p> : null}</div><span className={`status-chip status-chip--${animation.migration.status}`}>{animation.migration.status}</span></div></Container></header>
    <section className="animation-workspace-section"><Container>
      {prototype && animation.migration.status !== 'complete' ? <div className="prototype-warning" role="note"><strong>{spanish ? 'Prototipo heredado, no migración completa.' : 'Legacy prototype, not a complete migration.'}</strong><span>{spanish ? 'Solo se ofrece en el entorno local de auditoría.' : 'Available only in the local audit environment.'}</span></div> : null}
      {!prototype && animation.migration.status !== 'complete' ? <div className="prototype-warning audit-placeholder-warning" data-audit-placeholder="true" role="note"><strong>{spanish ? 'Marcador de auditoría, no implementación.' : 'Audit placeholder, not an implementation.'}</strong><span>{spanish ? 'Esta ruta solo expone identidad de fuente y navegación de la lección; no afirma conversión, fidelidad ni aceptación.' : 'This route exposes source identity and lesson navigation only; it makes no conversion, fidelity, or acceptance claim.'}</span></div> : null}
      <G4L3LessonContextNavigation animationId={animation.animationId} auditPreview={auditPreview} completeAnimationIds={completeAnimationIds} locale={locale} releasePublished={g4L3ReleasePublished} />
      {lessonDescriptor && lessonDescriptor.releaseId !== G4_L3_LESSON.releaseId
        ? <LessonContextNavigation
            animationId={animation.animationId}
            auditPreview={auditPreview}
            completeAnimationIds={completeAnimationIds}
            descriptor={lessonDescriptor}
            locale={locale}
            releasePublished={lessonReleasePublished}
          />
        : null}
      <AnimationRuntime animationId={animation.animationId} labels={{replay: spanish ? 'Repetir' : 'Replay', reduced: spanish ? 'El movimiento está reducido; se muestra un cuadro estático validado.' : 'Motion is reduced; a validated static frame is shown.', prototype: animation.migration.status === 'complete' ? (spanish ? 'migración estricta' : 'strict migration') : prototype ? (spanish ? 'prototipo heredado' : 'legacy prototype') : (spanish ? 'migración en curso' : 'migration in progress'), unavailable: spanish ? 'El módulo no está disponible.' : 'The module is unavailable.', loading: spanish ? 'Cargando módulo…' : 'Loading module…'}} moduleKey={moduleKey} query={{frame, frameDomain, scenario, lang: captureMode ? requestedLanguage : queryLanguage, seed, requirementId, trace, entryStateSha256, capture, duplicateCaptureIdentity}} />
      {!captureMode ? <nav aria-label={spanish ? 'Controles de captura determinista' : 'Deterministic capture controls'} className="capture-controls"><div><span>{spanish ? 'Cuadro exacto' : 'Exact frame'}</span>{frameLinks.map((value) => <a href={`?${frameDomainQuery}${traceStateQuery}${scenarioQuery}frame=${value}&lang=${queryLanguage}&seed=${seed ?? '0'}`} key={value}>{value}</a>)}<a href={`?${frameDomainQuery}${traceStateQuery}${scenarioQuery}lang=${queryLanguage}&seed=${seed ?? '0'}`}>{spanish ? 'Reproducir' : 'Live'}</a></div><div><span>{spanish ? 'Idioma' : 'Language'}</span><a aria-current={queryLanguage === 'en' ? 'page' : undefined} href={`?${frameDomainQuery}${traceStateQuery}${scenarioQuery}${frame ? `frame=${frame}&` : ''}lang=en&seed=${seed ?? '0'}`}>English</a><a aria-current={queryLanguage === 'es' ? 'page' : undefined} href={`?${frameDomainQuery}${traceStateQuery}${scenarioQuery}${frame ? `frame=${frame}&` : ''}lang=es&seed=${seed ?? '0'}`}>Español</a></div></nav> : null}
      <aside className="animation-evidence"><div><h2>{spanish ? 'Identidad y fuente' : 'Identity and source'}</h2><dl><div><dt>animationId</dt><dd><code>{animation.animationId}</code></dd></div><div><dt>assetId</dt><dd><code>{animation.assetId}</code></dd></div><div><dt>{spanish ? 'Fuente' : 'Source'}</dt><dd><code>{animation.source.path}</code></dd></div><div><dt>SHA-256</dt><dd><code>{animation.source.sha256 ?? '—'}</code></dd></div></dl></div><div><h2>{spanish ? 'Película' : 'Movie'}</h2><dl><div><dt>{spanish ? 'Escenario' : 'Stage'}</dt><dd>{animation.source.swf.stage?.width ?? '—'} × {animation.source.swf.stage?.height ?? '—'}</dd></div><div><dt>FPS</dt><dd>{animation.source.swf.fps ?? '—'}</dd></div><div><dt>{spanish ? 'Cuadros' : 'Frames'}</dt><dd>{animation.source.swf.frameCount ?? '—'}</dd></div><div><dt>{spanish ? 'Audio exacto' : 'Exact audio'}</dt><dd>{animation.audio.length}</dd></div></dl></div></aside>
      {process.env.NODE_ENV !== 'production' ? <p className="reference-link"><Link href={`/reference/${animation.animationId}`}>{spanish ? 'Abrir referencia SWF local' : 'Open local SWF reference'} ↗</Link></p> : null}
    </Container></section>
  </main>;
}
