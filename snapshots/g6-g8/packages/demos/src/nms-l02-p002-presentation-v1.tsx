'use client';
import React, {useEffect, useRef, useState} from 'react';
import type {AnimationRendererProps} from './contract';
import {getNmsL2P002FrameState, type P002FrameState} from './nms-l02-p002-timeline-v1';
import {p002TeachingState, p002TextSnapshot} from './nms-l02-p002-text-v1';

function P002ArtworkGate({state}: {state: P002FrameState}) {
  const [Artwork, setArtwork] = useState<React.ComponentType<{state: P002FrameState}> | null>(null);
  useEffect(() => {
    let active = true;
    void import('./nms-l02-p002-artwork-v1').then((module) => {
      if (active) setArtwork(() => module.NmsL2P002Artwork);
    });
    return () => {active = false;};
  }, []);
  if (!Artwork) return null;
  return <Artwork state={state} />;
}

const h = React.createElement;
const math = (...children: React.ReactNode[]) => h('math', {xmlns:'http://www.w3.org/1998/Math/MathML', display:'inline', displaystyle:'true'}, h('mrow',null,...children));
const fraction = (top: string, bottom: string, text = false) => {
  const value = (label:string) => text ? h('mtext',null,<span className="nms-l02-p002__fraction-label">{label}</span>) : h('mn',null,label);
  return h('mfrac',null,value(top),value(bottom));
};
const equals = () => h('mo',null,'=');
export type P002TermEntries = Readonly<Record<'Fraction'|'Whole'|'Group', string>>;
const termByRun: Readonly<Record<string,keyof P002TermEntries>> = Object.freeze({
  'character-233/run-1':'Fraction', 'character-233/run-4':'Whole', 'character-233/run-6':'Group',
});

export interface P002PresentationProps {
  readonly state: P002FrameState;
  readonly uiLanguage?: 'en'|'es';
  /** Only a host with the verified source index may supply these entries. */
  readonly termEntries?: P002TermEntries;
  readonly onLessonHostRequest?: AnimationRendererProps['onLessonHostRequest'];
  readonly onSourceStop?: () => void;
  readonly reducedMotion?: boolean;
}

/** Original teaching values retain their instance visibility. The layout and
 * text are native; source English remains explicitly English on the ES route. */
export function NmsL2P002Presentation({state,uiLanguage=state.language,termEntries,onLessonHostRequest,onSourceStop,reducedMotion=false}: P002PresentationProps) {
  const teaching = p002TeachingState(state), snapshot = p002TextSnapshot(state);
  const latest = useRef(state); latest.current = state;
  const [blocked,setBlocked] = useState(false);
  useEffect(() => {setBlocked(false);},[state.replay]);
  if (snapshot.status !== 'ready') return <p role="alert">{uiLanguage==='es'?'La página no está disponible.':'The page is unavailable.'}</p>;
  return <section className="nms-l02-p002 lesson-text-presentation" lang="en" data-p002-frame={state.frame} data-p002-domain={state.frameDomain} data-p002-root-frame={state.rootFrame} data-p002-text-status={snapshot.status} data-content-language="en">
    {uiLanguage==='es' && <p className="nms-l02-p002__fallback" lang="es">Texto original en inglés.</p>}
    {teaching.headingVisible && <header className="nms-l02-p002__header">
      <p data-lesson-text-block="course-title">Fractions, Decimals and Percents Concepts:</p>
      <h2 data-lesson-text-block="activity-title">Real World Activity</h2>
    </header>}
    {state.mainFrame !== null && <figure className="nms-l02-p002__figure" aria-label="Two hikers with backpacks and a map in a green landscape. A trail sign reads Welcome to Near Rush.">
      <P002ArtworkGate state={reducedMotion ? getNmsL2P002FrameState(910,{seed:state.seed,lang:state.language,replay:state.replay}) : state}/>
    </figure>}
    <div className="nms-l02-p002__teaching">
      {teaching.distance && <div className="nms-l02-p002__distance" data-lesson-text-block="distance">
        <span>{teaching.distance}{teaching.distanceRemainder ? ' '+teaching.distanceRemainder : ''}</span>
        {teaching.lowerFraction && math(equals(),fraction('1','2'))}
      </div>}
      {teaching.definition.trim() && <p className="nms-l02-p002__definition" data-lesson-text-block="definition">
        {teaching.definitionRuns.map(run => {
          if (!run.visiblePrefix) return null;
          const term = termByRun[run.sourceTextId], entryId = term ? termEntries?.[term] : undefined;
          if (!term || !entryId || !onLessonHostRequest) return <React.Fragment key={run.sourceTextId}>{run.visiblePrefix}</React.Fragment>;
          return <button key={run.sourceTextId} type="button" className="nms-l02-p002__term" data-source-text-id={run.sourceTextId} data-source-key-attribute={term} onClick={event => {
            const current = p002TeachingState(latest.current).definitionRuns.find(candidate => candidate.sourceTextId === run.sourceTextId);
            if (!current?.visiblePrefix.trim()) {setBlocked(true); return;}
            const decision = onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:state.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});
            setBlocked(decision?.status !== 'allowed');
            if (decision?.status === 'allowed') onSourceStop?.();
          }}>{run.visiblePrefix}</button>;
        })}
      </p>}
      {(teaching.whole || teaching.part) && <div className="nms-l02-p002__relationship" data-lesson-text-block="part-whole">
        {teaching.partOverWhole ? <div className="nms-l02-p002__equation" tabIndex={0} role="region" aria-label="Part and whole fraction">
          {math(fraction(teaching.part.trim(),teaching.whole.trim(),true))}
          {teaching.fourEighths && math(equals(),fraction('4','8'))}
          {teaching.finalHalf && math(equals(),fraction('1','2'))}
        </div> : <div className="nms-l02-p002__labels">
          {teaching.whole && <span>{teaching.whole}</span>}
          {teaching.part && <span>{teaching.part}</span>}
        </div>}
      </div>}
      {blocked && <p role="alert" lang={uiLanguage}>{uiLanguage==='es'?'El término no está disponible.':'The term is unavailable.'}</p>}
    </div>
  </section>;
}
