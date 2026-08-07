'use client';

import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  MonitorPlay,
  Pause,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {useState} from 'react';

import {AnimationRuntime} from '@/components/animation-runtime';
import {
  G5_L4_EXECUTIVE_PREVIEW_BOUNDARY,
  G5_L4_EXECUTIVE_PREVIEW_SCENES
} from '@/lib/g5-l4-executive-preview-content';

import styles from './g5-l4-executive-preview.module.css';

type Locale = 'en' | 'es';

const COPY = {
  en: {
    controlled: 'Controlled executive preview',
    title: 'Number Lines',
    subtitle: 'A bounded current-JavaScript lesson MVP candidate for Grade 5',
    lead: 'Explore all 54 active lesson pages as current-JavaScript candidates: 51 source-static single-sprite Canvas modules, one source-static dual-sprite composite, and two independent 18-question source-static inspection atlases. Together with the JavaScript lesson shell, this provides 55/55 engineering candidates—without Flash playback, plugins, legacy ActionScript execution, audio, or runtime network calls.',
    currentJs: 'Current JavaScript candidate',
    muted: 'Audio intentionally disabled',
    private: 'Private · noindex',
    previewBoundaryTitle: 'Preview authorization is not fidelity acceptance',
    previewBoundary:
      'This preview makes all 54 active pages runnable and, with the JavaScript shell, covers 55/55 current-JS engineering candidates across 13,732 exposed or inspection frames. Thirty-one single-sprite candidates stop before 3,020 unresolved source-tail frames; FQ001 is a two-sprite composition, while FQ002 and FQ003 are product-only inspection atlases rather than quiz behavior or canonical-governance promotions. Another 76 FQ source-timeline frames remain outside those atlases. Root-timeline fidelity, Spanish visuals, audio, behavior and source controls, source Replay, original-runtime parity, normalized RMSE, independent human review, Owner fidelity acceptance, strict completion, and publication remain unmet. The strict release remains 0/55 and unpublished.',
    sceneNavigator: 'Source-static timelines',
    scenesRepresented:
      '54 of 54 active pages · 55 of 55 with the JavaScript shell',
    scene: 'Timeline',
    page: 'Page',
    releaseMember: 'Release member',
    previousScene: 'Previous timeline',
    nextScene: 'Next timeline',
    replay: 'Replay',
    reduced:
      'Reduced motion is enabled; the deterministic first inspection frame is shown.',
    prototype: 'Source-static candidate · not strict',
    unavailable: 'This source-static module is unavailable.',
    loading: 'Loading the local source-static Canvas module…',
    keyboard:
      'Keyboard: Replay resets only the modern preview player; it is not evidence of source Flash Replay parity. Use the scene buttons to change source members.',
    exposedFrames: 'exposed frames',
    sourceFrames: 'source frames; unresolved tail closed',
    dualComposite: 'dual-sprite composite',
    questionAtlas: 'independent 18-question inspection atlas',
    atlasSourceFrames: 'source-timeline frames; non-atlas states closed',
    sourceBound: 'Source-bound identity',
    sourceBoundDetail:
      '800 × 600 stage · 12 FPS · exact checked-in SWF and available paired-FLA hashes plus nested frame domains retained',
    engineeringBoundary: 'Engineering boundary',
    engineeringBoundaryDetail:
      'Safe Canvas adapter from fresh, hash-pinned FFDec exports · no ActionScript, Ruffle playback, audio, or external requests',
    releaseBoundary: 'Release boundary',
    releaseBoundaryDetail:
      'Strict complete 0/55 · public library unchanged · unpublished',
    sourceEnglish:
      'The Canvas timeline is intentionally fixed to the verified English source path; no unverified Spanish lesson copy or audio was invented.',
    evidenceHeading: 'What this page proves—and what it does not',
    evidenceBody:
      'It proves 54 runnable, hash-bound current-JavaScript page candidates and 13,732/13,732 intentionally exposed or inspection frames executed in Chromium. The 51 single-sprite candidates comprise 20 complete source-static timelines and 31 bounded prefixes; FQ001 is a 52-frame primary sprite rendered with one fixed companion sprite; FQ002 and FQ003 are independent 18-question inspection atlases. With the current-JavaScript lesson shell, the engineering MVP count is 55/55. It does not prove the 3,096 closed source states, Spanish visuals, audio, behavior or source controls, source Replay parity, original-runtime parity, normalized RMSE, independent human review, Owner fidelity acceptance, strict completion, or publication. The two atlases do not enter canonical migration governance. Strict completion remains 0/55 and unpublished.',
    representative: 'Runnable current-JavaScript page candidates',
    sourceMember: 'source member',
    nativeStage: 'Native stage',
    sourceCadence: 'Source cadence',
    previewScenes: 'Current-JS modules',
    executedFrames: 'Frames exercised',
    strictRelease: 'Strict release'
  },
  es: {
    controlled: 'Vista ejecutiva controlada',
    title: 'Number Lines',
    subtitle: 'Un candidato MVP current-JavaScript acotado para quinto grado',
    lead: 'Explore las 54 páginas activas como candidatos current-JavaScript: 51 módulos Canvas source-static de un solo sprite, una composición source-static de dos sprites y dos atlas independientes de inspección source-static con 18 preguntas. Junto con el shell JavaScript de la lección, hay 55/55 candidatos de ingeniería, sin reproducción Flash, complementos, ejecución de ActionScript heredado, audio ni llamadas de red.',
    currentJs: 'Candidato JavaScript actual',
    muted: 'Audio deshabilitado intencionalmente',
    private: 'Privado · noindex',
    previewBoundaryTitle:
      'La autorización de vista previa no es aceptación de fidelidad',
    previewBoundary:
      'Esta vista previa hace ejecutables las 54 páginas activas y, con el shell JavaScript, cubre 55/55 candidatos current-JS de ingeniería en 13.732 fotogramas expuestos o de inspección. Treinta y un candidatos de un solo sprite se detienen antes de 3.020 fotogramas de cola no resueltos; FQ001 es una composición de dos sprites, mientras que FQ002 y FQ003 son atlas de inspección solo para el producto, no comportamiento de examen ni promociones de gobernanza canónica. Otros 76 fotogramas fuente de FQ quedan fuera de esos atlas. La fidelidad de las líneas de tiempo raíz, las imágenes en español, el audio, el comportamiento y los controles fuente, Replay de la fuente, la paridad con el runtime original, el RMSE normalizado, la revisión humana independiente, la aceptación de fidelidad del Owner, la finalización estricta y la publicación siguen sin cumplirse. La versión estricta sigue 0/55 y sin publicar.',
    sceneNavigator: 'Líneas de tiempo source-static',
    scenesRepresented:
      '54 de 54 páginas activas · 55 de 55 con el shell JavaScript',
    scene: 'Línea de tiempo',
    page: 'Página',
    releaseMember: 'Miembro de publicación',
    previousScene: 'Línea de tiempo anterior',
    nextScene: 'Línea de tiempo siguiente',
    replay: 'Repetir',
    reduced:
      'El movimiento reducido está activado; se muestra el primer fotograma determinista de inspección.',
    prototype: 'Candidato source-static · no estricto',
    unavailable: 'Este módulo source-static no está disponible.',
    loading: 'Cargando el módulo Canvas source-static local…',
    keyboard:
      'Teclado: Repetir reinicia solo el reproductor moderno de esta vista previa; no demuestra paridad con Replay de Flash. Use los botones para cambiar de miembro fuente.',
    exposedFrames: 'fotogramas expuestos',
    sourceFrames: 'fotogramas fuente; cola no resuelta cerrada',
    dualComposite: 'composición de dos sprites',
    questionAtlas: 'atlas independiente de inspección con 18 preguntas',
    atlasSourceFrames: 'fotogramas fuente; estados fuera del atlas cerrados',
    sourceBound: 'Identidad vinculada a la fuente',
    sourceBoundDetail:
      'Escenario 800 × 600 · 12 FPS · hashes exactos de los SWF registrados y de los FLA emparejados disponibles, más los dominios de fotogramas anidados',
    engineeringBoundary: 'Límite de ingeniería',
    engineeringBoundaryDetail:
      'Adaptador Canvas seguro desde exportaciones FFDec nuevas y vinculadas por hash · sin ActionScript, reproducción Ruffle, audio ni solicitudes externas',
    releaseBoundary: 'Límite de publicación',
    releaseBoundaryDetail:
      'Completitud estricta 0/55 · biblioteca pública sin cambios · no publicado',
    sourceEnglish:
      'La línea de tiempo Canvas se fija intencionalmente a la ruta fuente inglesa verificada; no se inventó contenido ni audio en español.',
    evidenceHeading: 'Lo que esta página demuestra y lo que no',
    evidenceBody:
      'Demuestra 54 candidatos de página current-JavaScript ejecutables y vinculados por hash, y 13.732/13.732 fotogramas expuestos o de inspección ejecutados intencionalmente en Chromium. Los 51 candidatos de un solo sprite incluyen 20 líneas source-static completas y 31 prefijos acotados; FQ001 muestra un sprite principal de 52 fotogramas con un sprite compañero fijo; FQ002 y FQ003 son atlas independientes de inspección con 18 preguntas. Con el shell current-JavaScript, el recuento MVP de ingeniería es 55/55. No demuestra los 3.096 estados fuente cerrados, las imágenes en español, el audio, el comportamiento ni los controles fuente, la paridad de Replay de la fuente, la paridad con el runtime original, el RMSE normalizado, la revisión humana independiente, la aceptación de fidelidad del Owner, la finalización estricta ni la publicación. Los dos atlas no ingresan en la gobernanza canónica de migración. La finalización estricta sigue 0/55 y sin publicar.',
    representative: 'Candidatos de página current-JavaScript ejecutables',
    sourceMember: 'miembro fuente',
    nativeStage: 'Escenario nativo',
    sourceCadence: 'Cadencia fuente',
    previewScenes: 'Módulos JavaScript',
    executedFrames: 'Fotogramas ejecutados',
    strictRelease: 'Versión estricta'
  }
} as const;

function range(from: number, to: number) {
  return Array.from({length: to - from + 1}, (_, index) => from + index);
}

function displayInteger(value: number) {
  return value < 0 ? `−${Math.abs(value)}` : String(value);
}

const DEFAULT_SCENE_INDEX = G5_L4_EXECUTIVE_PREVIEW_SCENES.findIndex(
  (scene) => scene.animationId === 'course-g05-l04-vb-002'
);

export function G5L4ExecutivePreview({locale}: {locale: Locale}) {
  const copy = COPY[locale];
  const [sceneIndex, setSceneIndex] = useState(DEFAULT_SCENE_INDEX);
  const scene = G5_L4_EXECUTIVE_PREVIEW_SCENES[sceneIndex];
  const sceneTitle = locale === 'es' ? scene.titleSpanish : scene.title;

  const selectScene = (nextIndex: number) => {
    setSceneIndex(
      Math.min(
        G5_L4_EXECUTIVE_PREVIEW_SCENES.length - 1,
        Math.max(0, nextIndex)
      )
    );
  };

  return (
    <main
      className={styles.preview}
      data-candidate-status="source-static-current-javascript-preview-not-strict"
      data-audio-accepted="false"
      data-behavior-accepted="false"
      data-canonical-governance-candidate-progress="52/55"
      data-current-js-lesson-mvp-progress="55/55"
      data-current-js-page-progress="54/54"
      data-current-js-source-static-progress="55/55"
      data-human-visual-review-accepted="false"
      data-natural-entry-accepted="false"
      data-normalized-rmse-complete="false"
      data-original-runtime-accepted="false"
      data-original-runtime-natural-entry-accepted="false"
      data-owner-fidelity-accepted="false"
      data-preview-owner-authorized="true"
      data-replay-parity-accepted="false"
      data-release-published="false"
      data-release-progress="0/55"
      data-root-timeline-accepted="false"
      data-source-controls-accepted="false"
      data-spanish-visual-accepted="false"
      data-strict-migration-complete="false"
      id="main-content"
    >
      <section className={styles.hero}>
        <div aria-hidden="true" className={styles.heroGrid} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>
              <Sparkles aria-hidden="true" size={17} /> {copy.controlled}
            </p>
            <h1>{copy.title}</h1>
            <p className={styles.subtitle}>{copy.subtitle}</p>
            <p className={styles.lead}>{copy.lead}</p>
            <div className={styles.badges} aria-label={copy.controlled}>
              <span>
                <MonitorPlay aria-hidden="true" size={16} /> {copy.currentJs}
              </span>
              <span>
                <Pause aria-hidden="true" size={16} /> {copy.muted}
              </span>
              <span>
                <LockKeyhole aria-hidden="true" size={16} /> {copy.private}
              </span>
            </div>
          </div>
          <div aria-hidden="true" className={styles.heroNumberLine}>
            {range(-5, 5).map((value) => (
              <span
                className={value === 0 ? styles.heroZero : undefined}
                key={value}
              >
                {displayInteger(value)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.boundaryStrip} role="note">
        <div>
          <ShieldCheck aria-hidden="true" size={24} />
          <p>
            <strong>{copy.previewBoundaryTitle}</strong>
            <span>{copy.previewBoundary}</span>
          </p>
        </div>
      </section>

      <section className={styles.workspace} aria-label={copy.sceneNavigator}>
        <header className={styles.workspaceHeader}>
          <div>
            <p>{copy.representative}</p>
            <h2>{copy.sceneNavigator}</h2>
          </div>
          <span>{copy.scenesRepresented}</span>
        </header>

        <div className={styles.workspaceGrid}>
          <nav
            className={styles.sceneNavigation}
            aria-label={copy.sceneNavigator}
          >
            <ol>
              {G5_L4_EXECUTIVE_PREVIEW_SCENES.map((item, index) => {
                const active = index === sceneIndex;
                const section =
                  locale === 'es' ? item.sectionSpanish : item.sectionEnglish;
                const title = locale === 'es' ? item.titleSpanish : item.title;
                return (
                  <li key={item.animationId}>
                    <button
                      aria-current={active ? 'page' : undefined}
                      className={
                        active ? styles.sceneButtonActive : styles.sceneButton
                      }
                      onClick={() => selectScene(index)}
                      type="button"
                    >
                      <span className={styles.sceneNumber}>
                        {String(item.releaseOrdinal).padStart(2, '0')}
                      </span>
                      <span className={styles.sceneButtonCopy}>
                        <small>
                          {section} · {copy.releaseMember} {item.releaseOrdinal}
                          /55 · {copy.page} {item.pageNumber}
                        </small>
                        <strong>{title}</strong>
                      </span>
                      <ChevronRight aria-hidden="true" size={18} />
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className={styles.keyboardHint}>{copy.keyboard}</p>
          </nav>

          <article
            className={styles.player}
            aria-labelledby="g5-l4-scene-title"
          >
            <header className={styles.playerBar}>
              <div aria-hidden="true" className={styles.windowDots}>
                <span />
                <span />
                <span />
              </div>
              <div>
                <span>
                  {copy.scene} {sceneIndex + 1}/
                  {G5_L4_EXECUTIVE_PREVIEW_SCENES.length}
                  {' · '}
                  {copy.releaseMember} {scene.releaseOrdinal}/55
                </span>
                <code>{scene.animationId}</code>
              </div>
              <span className={styles.liveBadge}>JS</span>
            </header>

            <div className={styles.stageFrame}>
              <h3 className={styles.visuallyHidden} id="g5-l4-scene-title">
                {sceneTitle}
              </h3>
              <AnimationRuntime
                animationId={scene.animationId}
                key={scene.animationId}
                labels={{
                  replay: copy.replay,
                  reduced: copy.reduced,
                  prototype: copy.prototype,
                  unavailable: copy.unavailable,
                  loading: copy.loading
                }}
                moduleKey={scene.animationId}
                query={{
                  frameDomain: scene.frameDomain,
                  lang: 'en',
                  scenario: scene.scenario,
                  seed: '0'
                }}
              />
            </div>

            <div className={styles.scenePager}>
              <button
                aria-label={copy.previousScene}
                disabled={sceneIndex === 0}
                onClick={() => selectScene(sceneIndex - 1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={19} />
                {copy.previousScene}
              </button>
              <span>
                {scene.frameCount} {copy.exposedFrames} · {scene.frameDomain}
                {scene.companionFrameDomain
                  ? ` + ${scene.companionFrameDomain} f${scene.companionFrame} · ${copy.dualComposite}`
                  : ''}
                {scene.rendererModel === 'question-atlas'
                  ? ` · ${scene.sourceFrameRange?.join('–')} mapped source frames · ${scene.sourceFrameCount} ${copy.atlasSourceFrames} · ${copy.questionAtlas}`
                  : ''}
                {scene.rendererModel !== 'question-atlas' &&
                scene.blockedFrameCount > 0
                  ? ` · ${scene.sourceFrameCount} ${copy.sourceFrames}`
                  : ''}
              </span>
              <button
                aria-label={copy.nextScene}
                disabled={
                  sceneIndex === G5_L4_EXECUTIVE_PREVIEW_SCENES.length - 1
                }
                onClick={() => selectScene(sceneIndex + 1)}
                type="button"
              >
                {copy.nextScene}
                <ChevronRight aria-hidden="true" size={19} />
              </button>
            </div>

            <footer className={styles.sourceMeta}>
              <div>
                <span>{copy.sourceMember}</span>
                <code>{scene.animationId}</code>
              </div>
              <div>
                <span>SWF SHA-256</span>
                <code>
                  {scene.sourceSwfSha256.slice(0, 12)}…
                  {scene.sourceSwfSha256.slice(-8)}
                </code>
              </div>
              <div>
                <span>
                  {scene.rendererModel === 'dual-sprite-composite'
                    ? copy.dualComposite
                    : scene.rendererModel === 'question-atlas'
                      ? copy.questionAtlas
                      : scene.frameDomain}
                </span>
                <code>
                  {scene.frameCount}f · JS{' '}
                  {scene.runtimeBytes.toLocaleString('en-US')} B ·{' '}
                  {scene.runtimeSha256.slice(0, 8)}…
                </code>
              </div>
            </footer>
          </article>
        </div>
      </section>

      <section className={styles.evidence}>
        <div className={styles.evidenceIntro}>
          <p>{copy.controlled}</p>
          <h2>{copy.evidenceHeading}</h2>
          <p>{copy.evidenceBody}</p>
          {locale === 'es' ? (
            <p className={styles.languageCaveat}>{copy.sourceEnglish}</p>
          ) : null}
        </div>
        <div className={styles.evidenceCards}>
          <article>
            <span>01</span>
            <h3>{copy.sourceBound}</h3>
            <p>{copy.sourceBoundDetail}</p>
          </article>
          <article>
            <span>02</span>
            <h3>{copy.engineeringBoundary}</h3>
            <p>{copy.engineeringBoundaryDetail}</p>
          </article>
          <article>
            <span>03</span>
            <h3>{copy.releaseBoundary}</h3>
            <p>{copy.releaseBoundaryDetail}</p>
          </article>
        </div>
        <dl className={styles.metrics}>
          <div>
            <dt>{copy.nativeStage}</dt>
            <dd>
              {G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.stage.width} ×{' '}
              {G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.stage.height}
            </dd>
          </div>
          <div>
            <dt>{copy.sourceCadence}</dt>
            <dd>{G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.fps} FPS</dd>
          </div>
          <div>
            <dt>{copy.previewScenes}</dt>
            <dd>{G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.representedSceneCount}</dd>
          </div>
          <div>
            <dt>{copy.executedFrames}</dt>
            <dd>
              {G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.representedFrameCount.toLocaleString(
                'en-US'
              )}
              {' / '}
              {G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.representedFrameCount.toLocaleString(
                'en-US'
              )}
            </dd>
          </div>
          <div>
            <dt>{copy.strictRelease}</dt>
            <dd>
              {G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.strictCompleteCount}/
              {G5_L4_EXECUTIVE_PREVIEW_BOUNDARY.releaseMemberCount}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
