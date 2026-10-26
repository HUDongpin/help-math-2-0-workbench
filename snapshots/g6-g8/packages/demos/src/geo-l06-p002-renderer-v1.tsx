'use client';
import {useEffect, useRef, useState} from 'react';
import type {AnimationRendererProps} from './contract';
import {geoL06P002MainState, geoL06P002RootState} from './geo-l06-p002-display-state-v1';
import {geoL06P002Scene} from './geo-l06-p002-scene-v1';
import {geoL06P002TeachingState} from './geo-l06-p002-teaching-state-v1';
import {GeoL06P002TeachingText} from './geo-l06-p002-teaching-text-v1';
import {geoL06P002VisibleGlossaryTerms} from './geo-l06-p002-glossary-v1';
import './geo-l06-p002-teaching-text-v1.css';
import './geo-l06-p002-renderer-v1.css';

const SHEET_URL = '/flash-assets/g678-local/shared-geo001-l06-p002/symbol-sheet.svg?sha256=' +
  'ae5c6fb9ba4e7c5b4acb1ee1187739a2bf6c1c81ff6d0c9129c428a1f9094c7c';
const SHEET_HASH = 'ae5c6fb9ba4e7c5b4acb1ee1187739a2bf6c1c81ff6d0c9129c428a1f9094c7c';
const MASK_ID = 'geo-l06-p002-source-mask';

/** Source-derived graphics/teaching candidate for local product calibration.
 * Root preloader, host glossary stop, audio and visual fidelity remain open. */
function GeoL06P002MainRenderer(props: AnimationRendererProps) {
  const symbols = useRef<SVGDefsElement>(null);
  const [available, setAvailable] = useState<ReadonlySet<number> | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const source = geoL06P002MainState(props.frame, {...props, frame: props.frame,
    frameDomain: props.frameDomain ?? 'sprite-230'});
  const scene = geoL06P002Scene(source);
  const uiLanguage: 'en' | 'es' = props.uiLanguage === 'es' ? 'es' : 'en';
  const uiState = {...source, language: uiLanguage};
  const teaching = geoL06P002TeachingState(uiState);
  const glossary = geoL06P002VisibleGlossaryTerms(uiState);
  const allObjects = [...scene.clipped, ...scene.foreground];
  const missing = available && allObjects.find(object => !available.has(object.characterId));

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const response = await fetch(SHEET_URL, {signal: controller.signal});
      if (!response.ok) throw Error(`GEO_P002_SHEET_FETCH_${response.status}`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== 8122158) throw Error('GEO_P002_SHEET_SIZE_DRIFT');
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
        .map(value => value.toString(16).padStart(2, '0')).join('');
      if (hash !== SHEET_HASH) throw Error('GEO_P002_SHEET_HASH_DRIFT');
      const document = new DOMParser().parseFromString(
        new TextDecoder().decode(bytes), 'image/svg+xml');
      const defs = document.querySelector('svg > defs');
      if (document.querySelector('parsererror') || !defs || defs.children.length !== 207) {
        throw Error('GEO_P002_SHEET_STRUCTURE_DRIFT');
      }
      const ids = new Set<number>();
      for (const item of defs.children) {
        const match = /^geo-p002-character-(\d+)$/.exec(item.id);
        if (!match) throw Error('GEO_P002_SHEET_ID_DRIFT');
        ids.add(Number(match[1]));
      }
      if (ids.size !== 207 || controller.signal.aborted || !symbols.current) return;
      symbols.current.replaceChildren(...[...defs.children].map(item =>
        globalThis.document.importNode(item, true)));
      setAvailable(ids);
    }
    load().catch(error => {
      if (!controller.signal.aborted) setAssetError(
        error instanceof Error ? error.message : 'GEO_P002_SHEET_FAILED');
    });
    return () => controller.abort();
  }, []);

  return <section className="geo-l06-p002" data-animation-id={source.animationId}
    data-flash-animation-id={source.animationId} data-flash-frame={source.frame}
    data-flash-frame-domain={source.frameDomain} data-flash-root-frame={props.rootFrame ?? 6}
    data-flash-scenario={source.scenario} data-flash-language={source.language}
    data-flash-seed={source.seed} data-flash-replay={source.replay}
    data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256}
    data-source-mask-mode={scene.maskMode}
    data-source-graphics-status={assetError ? 'error' : missing ? 'missing-symbol' : available ? 'loaded' : 'loading'}
    data-source-fidelity="not-accepted" data-source-audio="not-accepted">
    <svg className="geo-l06-p002__scene" viewBox="0 0 800 600" role="img"
      aria-label={uiLanguage === 'es' ? 'Escena de cocina de la lección' : 'Lesson kitchen scene'}>
      <defs ref={symbols}/>
      {/* The source clipDepth mask uses filled geometry, not shape-4's 0.6 fill alpha. */}
      <defs><clipPath id={MASK_ID} clipPathUnits="userSpaceOnUse">
        <rect x="-303.35" y="-195" width="602.15" height="352.8"/>
      </clipPath></defs>
      <rect width="800" height="600" fill="#b8d8f7"/>
      {!assetError && !missing && available ? <g transform="translate(412.4 303.3)">
        <g clipPath={`url(#${MASK_ID})`}>{scene.clipped.map(object =>
          <use key={object.depth} href={`#geo-p002-character-${object.characterId}`}
            transform={object.matrix} opacity={object.opacity}
            data-source-depth={object.depth}/>)}</g>
        <g>{scene.foreground.map(object =>
          <use key={object.depth} href={`#geo-p002-character-${object.characterId}`}
            transform={object.matrix} opacity={object.opacity}
            data-source-depth={object.depth}/>)}</g>
      </g> : null}
    </svg>
    {assetError || missing ? <p role="alert" className="geo-l06-p002__notice">
      {assetError ?? `GEO_P002_MISSING_SYMBOL_${missing?.characterId}`}
    </p> : !available ? <p role="status" className="geo-l06-p002__notice">
      {uiLanguage === 'es' ? 'Cargando la escena de origen…' : 'Loading source scene…'}
    </p> : null}
    <GeoL06P002TeachingText state={teaching}/>
    {glossary.length > 0 ? <div className="geo-l06-p002__glossary"
      aria-label={uiLanguage === 'es' ? 'Glosario de origen' : 'Source glossary'}>
      {glossary.map(term => <button key={term.sourceCharacterId} type="button"
        disabled={!props.onLessonHostRequest} data-source-key={term.sourceKeyAttribute}
        onClick={event => props.onLessonHostRequest?.({type: 'open-glossary', entryId: term.id},
          {trigger: event.currentTarget})}>{term.label}</button>)}
    </div> : null}
    <p className="geo-l06-p002__candidate-note">
      {uiLanguage === 'es'
        ? 'Vista técnica local: la sincronización de audio y la fidelidad visual no están aprobadas.'
        : 'Local engineering view: audio sync and visual fidelity are not accepted.'}
    </p>
  </section>;
}

export function GeoL06P002Renderer(props: AnimationRendererProps) {
  if (props.frameDomain !== 'root') return <GeoL06P002MainRenderer {...props}/>;
  const state = geoL06P002RootState(props.frame, {...props, frameDomain: 'root'});
  return <section className="geo-l06-p002" data-animation-id={state.animationId}
    data-flash-animation-id={state.animationId} data-flash-frame={state.frame}
    data-flash-frame-domain="root" data-flash-root-frame={state.frame}
    data-flash-scenario={state.scenario} data-flash-language={state.language}
    data-flash-seed={state.seed} data-flash-replay={state.replay}
    data-source-host-trace="unverified" data-source-fidelity="not-accepted">
    <svg className="geo-l06-p002__scene" viewBox="0 0 800 600" role="img"
      aria-label={props.uiLanguage === 'es' ? 'Escenario original sin avance del anfitrión' : 'Source stage without host progression'}>
      <rect width="800" height="600" fill="#b8d8f7"/>
    </svg>
    <p className="geo-l06-p002__candidate-note">{props.uiLanguage === 'es'
      ? 'El avance del anfitrión original y el fotograma del clip interno no están verificados.'
      : 'Original host progression and the child clip frame are unverified.'}</p>
  </section>;
}
