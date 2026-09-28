'use client';

import {useMemo, useState} from 'react';

import {AnimationRuntime} from '@/components/animation-runtime';
import type {G4L11MigrationFactoryDescriptor} from
  '@/lib/g4-l11-migration-factory';

const SELECTED_ANIMATION_ID = 'course-g04-l11-ir-001';

export function G4L11MigrationFactoryPlayer({
  descriptor,
  locale,
}: {
  descriptor: G4L11MigrationFactoryDescriptor;
  locale: 'en' | 'es';
}) {
  const [currentAnimationId, setCurrentAnimationId] = useState(
    SELECTED_ANIMATION_ID,
  );
  const [paused, setPaused] = useState(false);
  const currentPage = descriptor.pages.find(
    (page) => page.animationId === currentAnimationId,
  ) ?? descriptor.pages[0]!;
  const currentIndex = currentPage.globalPageOrdinal - 1;
  const previousPage = descriptor.pages[currentIndex - 1] ?? null;
  const nextPage = descriptor.pages[currentIndex + 1] ?? null;
  const currentSection = descriptor.sections.find(
    (section) => section.code === currentPage.sectionCode,
  )!;
  const renderer = currentPage.rendererAvailability;
  const spanish = locale === 'es';
  const companionId = currentPage.presentation
    ? `g4-l11-factory-${currentPage.presentation.pageInteractionCompanionTargetIdSuffix}`
    : undefined;
  const pagesBySection = useMemo(() => Object.fromEntries(
    descriptor.sections.map((section) => [
      section.code,
      descriptor.pages.filter((page) => page.sectionCode === section.code),
    ]),
  ), [descriptor]);
  const navigate = (animationId: string) => {
    setCurrentAnimationId(animationId);
    setPaused(false);
  };

  return <main className="g4l11-factory" data-factory-calibration-id={
    descriptor.calibrationId
  } data-legacy-course-shell-included="false" data-private-current-js-pages="43"
  data-scale-out-decision="PAGE_ONLY_CURRENT_JS_COMPLETE" id="main-content">
    <header className="g4l11-factory__header">
      <div>
        <p>{spanish ? 'Fábrica privada de migración' : 'Private migration factory'}</p>
        <h1>{spanish ? 'Grado 4 · Lección 11 · Cuadrícula de coordenadas' :
          'Grade 4 · Lesson 11 · Coordinate Grid'}</h1>
        <span>{spanish
          ? 'Las 43 animaciones de página están registradas dentro de My Lesson; el shell Flash heredado está fuera del alcance.'
          : 'All 43 page animations are registered inside the modern My Lesson surface; the legacy Flash shell is out of scope.'}</span>
      </div>
      <dl>
        <div><dt>{spanish ? 'Fuente' : 'Source'}</dt><dd>43/43</dd></div>
        <div><dt>source-static</dt><dd>42/43</dd></div>
        <div><dt>{spanish ? 'Módulos' : 'Modules'}</dt><dd>43/43</dd></div>
        <div><dt>My Lesson</dt><dd>43/43</dd></div>
      </dl>
    </header>

    <section className="g4l11-factory__boundary" role="status">
      <strong>{spanish ? 'Current-JS de páginas: 43/43.' :
        'Page-only Current-JS: 43/43.'}</strong>
      <span>{spanish
        ? 'La ejecución original, el comportamiento natural, el audio, la fidelidad, la revisión humana y la aceptación del propietario siguen siendo puertas independientes y cerradas.'
        : 'Original runtime, natural behavior, audio, fidelity, human review, and Owner acceptance remain independent closed gates.'}</span>
    </section>

    <div className="g4l11-factory__workspace">
      <aside aria-label={spanish ? 'Mapa de la lección' : 'Lesson map'}>
        <div className="g4l11-factory__map-heading">
          <span>{spanish ? 'Orden XML exacto' : 'Exact XML order'}</span>
          <strong>43 {spanish ? 'páginas' : 'pages'}</strong>
        </div>
        {descriptor.sections.map((section) => <section key={section.code}>
          <h2><span>{section.code}</span>{section.labels[locale].text}</h2>
          <ol>
            {(pagesBySection[section.code] ?? []).map((page) => {
              const available = page.rendererAvailability.kind === 'registered';
              return <li key={page.animationId}>
                <button aria-current={page.animationId === currentPage.animationId
                  ? 'page' : undefined} data-animation-id={page.animationId}
                  data-renderer-availability={available ? 'registered' : 'unavailable'}
                  onClick={() => navigate(page.animationId)} type="button">
                  <span>{page.globalPageOrdinal}</span>
                  <span>{page.labels[locale].text}<small>{available
                    ? 'Current-JS · private'
                    : (spanish ? 'conservada · no registrada' :
                      'preserved · unregistered')}</small></span>
                </button>
              </li>;
            })}
          </ol>
        </section>)}
      </aside>

      <article className="g4l11-factory__lesson">
        <header className="g4l11-factory__lesson-heading">
          <div><span>{currentSection.labels[locale].text}</span>
            <h2>{currentPage.labels[locale].text}</h2>
            <code>{currentPage.animationId}</code></div>
          <div className="g4l11-factory__ordinal">
            <strong>{currentPage.globalPageOrdinal}</strong><span>/ 43</span>
          </div>
        </header>

        <div className="g4l11-factory__stage">
          {renderer.kind === 'registered' ? <AnimationRuntime
            animationId={currentPage.animationId}
            key={currentPage.animationId}
            labels={{
              replay: spanish ? 'Repetir' : 'Replay',
              reduced: spanish ? 'Movimiento reducido por el dispositivo.' :
                'Motion reduced by the device.',
              prototype: spanish ? 'Current-JS privado' : 'Private Current-JS',
              unavailable: spanish ? 'Módulo no disponible.' :
                'Module unavailable.',
              loading: spanish ? 'Cargando página…' : 'Loading page…',
            }}
            moduleKey={renderer.moduleKey}
            pageInteractionCompanionTargetId={companionId}
            paused={paused}
            presentation="lesson"
            query={{
              frameDomain: renderer.runtimeQuery?.frameDomain,
              lang: renderer.runtimeQuery?.language === 'fixed-en'
                ? 'en'
                : locale,
              scenario: renderer.runtimeQuery?.scenario,
              seed: renderer.runtimeQuery?.seed ?? '0',
            }}
            uiLanguage={locale}
          /> : <section className="g4l11-factory__unavailable">
            <span>{currentPage.globalPageOrdinal}</span>
            <h3>{spanish ? 'Fuente conservada; Current-JS aún no registrado' :
              'Source preserved; Current-JS not registered yet'}</h3>
            <p>{spanish
              ? 'Esta posición se mantiene en el orden XML de 43 páginas. La fábrica no carga un candidato no admitido ni simula su comportamiento.'
              : 'This position remains in the 43-page XML order. The factory does not load an unadmitted candidate or simulate its behavior.'}</p>
          </section>}
        </div>

        {companionId ? <div className="g4l11-factory__companion"
          id={companionId} /> : null}

        <footer className="g4l11-factory__controls">
          <button disabled={!previousPage} onClick={() => previousPage &&
            navigate(previousPage.animationId)} type="button">← {spanish
              ? 'Anterior' : 'Previous'}</button>
          <button aria-pressed={paused} disabled={renderer.kind !== 'registered'}
            onClick={() => setPaused((value) => !value)} type="button">
            {paused ? (spanish ? 'Continuar' : 'Resume') :
              (spanish ? 'Pausar' : 'Pause')}</button>
          <button disabled={!nextPage} onClick={() => nextPage &&
            navigate(nextPage.animationId)} type="button">{spanish
              ? 'Siguiente' : 'Next'} →</button>
        </footer>
      </article>
    </div>

    <style>{`
      .g4l11-factory{--ink:#143634;--green:#155a4c;--paper:#f4f0e6;
        --amber:#d4942b;background:#e9e5da;color:var(--ink);min-height:100vh;
        padding:24px}.g4l11-factory__header{align-items:end;background:var(--ink);
        border-radius:24px;color:#fff;display:flex;gap:28px;justify-content:space-between;
        margin:0 auto;max-width:1480px;padding:28px 32px}.g4l11-factory__header p{
        color:#f4bd5b;font-size:12px;font-weight:800;letter-spacing:.12em;margin:0 0 7px;
        text-transform:uppercase}.g4l11-factory__header h1{font-family:Georgia,serif;
        font-size:clamp(27px,4vw,48px);line-height:1;margin:0 0 10px}
      .g4l11-factory__header>div>span{color:#d8e5df;display:block;max-width:760px}
      .g4l11-factory__header dl{display:grid;gap:8px;grid-template-columns:repeat(2,1fr);
        margin:0;min-width:310px}.g4l11-factory__header dl div{background:#ffffff10;
        border:1px solid #ffffff25;border-radius:12px;padding:10px 12px}
      .g4l11-factory__header dt{color:#c8d9d3;font-size:11px;text-transform:uppercase}
      .g4l11-factory__header dd{font-size:22px;font-weight:900;margin:2px 0 0}
      .g4l11-factory__boundary{background:#fff6df;border:1px solid #d7ad60;
        border-radius:16px;display:flex;gap:10px;margin:16px auto;max-width:1480px;
        padding:14px 18px}.g4l11-factory__boundary strong{color:#75480a;white-space:nowrap}
      .g4l11-factory__workspace{display:grid;gap:18px;grid-template-columns:310px minmax(0,1fr);
        margin:0 auto;max-width:1480px}.g4l11-factory__workspace>aside{background:#f9f7f0;
        border:1px solid #d2cec0;border-radius:20px;max-height:calc(100vh - 190px);
        overflow:auto;padding:16px}.g4l11-factory__map-heading{align-items:center;display:flex;
        justify-content:space-between;margin-bottom:12px}.g4l11-factory__map-heading span{
        color:#6f7e78;font-size:11px;font-weight:800;text-transform:uppercase}
      .g4l11-factory__workspace aside section+section{border-top:1px solid #ded9cb;
        margin-top:14px;padding-top:12px}.g4l11-factory__workspace aside h2{align-items:center;
        display:flex;font-size:14px;gap:8px;margin:0 0 7px}.g4l11-factory__workspace aside h2>span{
        background:var(--green);border-radius:7px;color:#fff;font-size:10px;padding:4px 6px}
      .g4l11-factory__workspace aside ol{display:grid;gap:4px;list-style:none;margin:0;
        padding:0}.g4l11-factory__workspace aside button{align-items:center;background:transparent;
        border:0;border-radius:10px;color:var(--ink);display:grid;gap:9px;
        grid-template-columns:28px 1fr;padding:7px;text-align:left;width:100%}
      .g4l11-factory__workspace aside button:hover{background:#e8eee9}
      .g4l11-factory__workspace aside button[aria-current=page]{background:#dcece5;
        box-shadow:inset 3px 0 var(--green)}.g4l11-factory__workspace aside button>span:first-child{
        align-items:center;background:#e5e1d5;border-radius:50%;display:flex;font-size:11px;
        font-weight:900;height:26px;justify-content:center;width:26px}
      .g4l11-factory__workspace aside button[data-renderer-availability=registered]>span:first-child{
        background:var(--amber);color:#fff}.g4l11-factory__workspace aside button small{
        color:#73817c;display:block;font-size:10px;margin-top:2px}
      .g4l11-factory__lesson{background:var(--paper);border:1px solid #cbc5b6;
        border-radius:20px;box-shadow:0 12px 34px #17362d18;overflow:hidden}
      .g4l11-factory__lesson-heading{align-items:center;background:#fffaf0;border-bottom:1px solid #d8d1c1;
        display:flex;justify-content:space-between;padding:18px 24px}
      .g4l11-factory__lesson-heading span{color:var(--green);font-size:12px;font-weight:900;
        text-transform:uppercase}.g4l11-factory__lesson-heading h2{font-family:Georgia,serif;
        font-size:30px;margin:3px 0}.g4l11-factory__lesson-heading code{color:#6b7773;font-size:11px}
      .g4l11-factory__ordinal{align-items:baseline;display:flex;gap:4px}.g4l11-factory__ordinal strong{
        color:var(--green);font-family:Georgia,serif;font-size:44px}.g4l11-factory__stage{
        background:#cbded6;padding:18px}.g4l11-factory__stage>.runtime-shell{margin:0 auto;max-width:800px}
      .g4l11-factory__companion{margin:0 auto;max-width:800px;padding:0 18px 18px}
      .g4l11-factory__unavailable{align-items:center;background:#f8f6ef;border:2px dashed #9daaa5;
        border-radius:18px;display:flex;flex-direction:column;justify-content:center;margin:0 auto;
        min-height:520px;max-width:800px;padding:30px;text-align:center}.g4l11-factory__unavailable>span{
        align-items:center;background:#dce5e1;border-radius:50%;display:flex;font-family:Georgia,serif;
        font-size:30px;height:70px;justify-content:center;width:70px}.g4l11-factory__unavailable h3{
        font-family:Georgia,serif;font-size:28px;margin:18px 0 8px;max-width:560px}
      .g4l11-factory__unavailable p{color:#60706a;max-width:620px}
      .g4l11-factory__controls{background:#fffaf0;border-top:1px solid #d8d1c1;display:flex;
        gap:10px;justify-content:space-between;padding:14px 20px}.g4l11-factory__controls button{
        background:#fff;border:1px solid #8aa198;border-radius:999px;color:var(--green);
        font-weight:800;min-height:42px;padding:8px 16px}.g4l11-factory__controls button:not(:disabled):hover{
        background:var(--green);color:#fff}.g4l11-factory__controls button:disabled{opacity:.4}
      @media(max-width:960px){.g4l11-factory{padding:12px}.g4l11-factory__header{
        align-items:stretch;flex-direction:column}.g4l11-factory__header dl{min-width:0}
        .g4l11-factory__boundary{align-items:flex-start;flex-direction:column}
        .g4l11-factory__workspace{grid-template-columns:1fr}.g4l11-factory__workspace>aside{
        max-height:320px}.g4l11-factory__lesson-heading h2{font-size:24px}}
      @media(max-width:560px){.g4l11-factory__header dl{grid-template-columns:1fr 1fr}
        .g4l11-factory__lesson-heading{align-items:flex-start}.g4l11-factory__ordinal strong{
        font-size:34px}.g4l11-factory__stage{padding:8px}.g4l11-factory__controls{
        flex-wrap:wrap}.g4l11-factory__controls button{flex:1}}
    `}</style>
  </main>;
}
