import {matchPrototype} from '@helpmath/demos/prototype-manifest';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {AnimationRuntime} from '@/components/animation-runtime';
import {Container} from '@/components/ui';
import {Link} from '@/i18n/navigation';
import {findAnimation} from '@/lib/catalog';

export const dynamic = 'force-dynamic';
type Query = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export async function generateMetadata({params}: {params: Promise<{animationId: string}>}): Promise<Metadata> {
  const {animationId} = await params;
  const animation = findAnimation(animationId);
  if (!animation || (process.env.NODE_ENV === 'production' && animation.migration.status !== 'complete')) notFound();
  return {title: animation.classification.titleDisplay, robots: animation.migration.status === 'complete' ? undefined : {index: false, follow: false}};
}

export default async function AnimationPage({params, searchParams}: {params: Promise<{locale: 'en' | 'es'; animationId: string}>; searchParams: Promise<Query>}) {
  const [{locale, animationId}, query] = await Promise.all([params, searchParams]);
  const animation = findAnimation(animationId);
  if (!animation || (process.env.NODE_ENV === 'production' && animation.migration.status !== 'complete')) notFound();
  const spanish = locale === 'es';
  const prototype = matchPrototype({animationId, sourcePath: animation.source.path});
  const requestedLanguage = first(query.lang);
  const queryLanguage = requestedLanguage === 'en' || requestedLanguage === 'es' ? requestedLanguage : locale;
  const frame = first(query.frame); const scenario = first(query.scenario); const seed = first(query.seed); const capture = first(query.capture);
  const captureMode = capture === '1';
  const frameCount = prototype?.movie.frameCount ?? animation.source.swf.frameCount ?? 1;
  const frameLinks = [1, Math.ceil(frameCount / 2), frameCount];
  const moduleKey = prototype?.key ?? animation.animationId;

  return <main className={captureMode ? 'capture-page' : undefined} id="main-content">
    <header className="animation-header"><Container><div className="animation-breadcrumbs"><Link href="/library">{spanish ? 'Biblioteca' : 'Library'}</Link><span aria-hidden="true">/</span><span>{animation.classification.collection}</span></div><div className="animation-title-row"><div><p className="eyebrow">{animation.classification.grade === 'elementary' ? (spanish ? 'Compartido · Primaria' : 'Shared · Elementary') : `${spanish ? 'Grado' : 'Grade'} ${animation.classification.grade ?? '—'} · ${spanish ? 'Lección' : 'Lesson'} ${animation.classification.lesson ?? '—'}`}</p><h1>{animation.classification.titleDisplay}</h1>{animation.classification.titleRaw !== animation.classification.titleDisplay ? <p className="raw-title">Original: {animation.classification.titleRaw}</p> : null}</div><span className={`status-chip status-chip--${animation.migration.status}`}>{animation.migration.status}</span></div></Container></header>
    <section className="animation-workspace-section"><Container>
      {prototype && animation.migration.status !== 'complete' ? <div className="prototype-warning" role="note"><strong>{spanish ? 'Prototipo heredado, no migración completa.' : 'Legacy prototype, not a complete migration.'}</strong><span>{spanish ? 'Solo se ofrece en el entorno local de auditoría.' : 'Available only in the local audit environment.'}</span></div> : null}
      <AnimationRuntime labels={{replay: spanish ? 'Repetir' : 'Replay', reduced: spanish ? 'El movimiento está reducido; se muestra el cuadro 1.' : 'Motion is reduced; frame 1 is shown.', prototype: prototype ? (spanish ? 'prototipo heredado' : 'legacy prototype') : (spanish ? 'migración estricta' : 'strict migration'), unavailable: spanish ? 'El módulo no está disponible.' : 'The module is unavailable.', loading: spanish ? 'Cargando módulo…' : 'Loading module…'}} moduleKey={moduleKey} query={{frame, scenario, lang: queryLanguage, seed, capture}} />
      {!captureMode ? <nav aria-label={spanish ? 'Controles de captura determinista' : 'Deterministic capture controls'} className="capture-controls"><div><span>{spanish ? 'Cuadro exacto' : 'Exact frame'}</span>{frameLinks.map((value) => <a href={`?frame=${value}&lang=${queryLanguage}&scenario=${scenario ?? 'default'}&seed=${seed ?? '0'}`} key={value}>{value}</a>)}<a href={`?lang=${queryLanguage}&scenario=${scenario ?? 'default'}&seed=${seed ?? '0'}`}>{spanish ? 'Reproducir' : 'Live'}</a></div><div><span>{spanish ? 'Idioma' : 'Language'}</span><a aria-current={queryLanguage === 'en' ? 'page' : undefined} href={`?${frame ? `frame=${frame}&` : ''}lang=en&scenario=${scenario ?? 'default'}&seed=${seed ?? '0'}`}>English</a><a aria-current={queryLanguage === 'es' ? 'page' : undefined} href={`?${frame ? `frame=${frame}&` : ''}lang=es&scenario=${scenario ?? 'default'}&seed=${seed ?? '0'}`}>Español</a></div></nav> : null}
      <aside className="animation-evidence"><div><h2>{spanish ? 'Identidad y fuente' : 'Identity and source'}</h2><dl><div><dt>animationId</dt><dd><code>{animation.animationId}</code></dd></div><div><dt>assetId</dt><dd><code>{animation.assetId}</code></dd></div><div><dt>{spanish ? 'Fuente' : 'Source'}</dt><dd><code>{animation.source.path}</code></dd></div><div><dt>SHA-256</dt><dd><code>{animation.source.sha256 ?? '—'}</code></dd></div></dl></div><div><h2>{spanish ? 'Película' : 'Movie'}</h2><dl><div><dt>{spanish ? 'Escenario' : 'Stage'}</dt><dd>{animation.source.swf.stage?.width ?? '—'} × {animation.source.swf.stage?.height ?? '—'}</dd></div><div><dt>FPS</dt><dd>{animation.source.swf.fps ?? '—'}</dd></div><div><dt>{spanish ? 'Cuadros' : 'Frames'}</dt><dd>{animation.source.swf.frameCount ?? '—'}</dd></div><div><dt>{spanish ? 'Audio exacto' : 'Exact audio'}</dt><dd>{animation.audio.length}</dd></div></dl></div></aside>
      {process.env.NODE_ENV !== 'production' ? <p className="reference-link"><Link href={`/reference/${animation.animationId}`}>{spanish ? 'Abrir referencia SWF local' : 'Open local SWF reference'} ↗</Link></p> : null}
    </Container></section>
  </main>;
}
