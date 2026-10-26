import React from 'react';
import type {GeoL06P002TeachingState} from './geo-l06-p002-teaching-state-v1';

/** Native, source-backed instructional text only. This component deliberately
 * does not stand in for the source kitchen scene or its audio timeline.
 * The eventual page renderer must import the paired stylesheet. */
export function GeoL06P002TeachingText({state}: {readonly state: GeoL06P002TeachingState}) {
  return <section className="geo-l06-p002-teaching-text" aria-label={
    state.requestedLanguage === 'es' ? 'Texto de la lección' : 'Lesson text'
  } data-source-text-ids={state.sourceTeachingTextIds.join(',')}>
    {state.spanishSourceFallback && (state.definitionVisible || state.termsVisible) ?
      <p className="geo-l06-p002-teaching-text__fallback" lang="es">
        El texto original de esta animación está en inglés.
      </p> : null}
    {state.definitionVisible ? <p className="geo-l06-p002-teaching-text__definition" lang="en"
      style={{opacity: state.definitionOpacity}}>
      {state.parts.map((part, index) => <span key={index}
        data-source-key={part.key ?? undefined}
        data-source-highlighted={part.highlighted ? 'true' : undefined}
        className={part.highlighted ? 'geo-l06-p002-teaching-text__highlight' : undefined}>
        {part.text}
      </span>)}
    </p> : null}
    {state.termsVisible ? <p className="geo-l06-p002-teaching-text__terms" lang="en"
      style={{opacity: state.termsOpacity}}>
      <span className={state.highlightedTerm === 'radius' ? 'geo-l06-p002-teaching-text__highlight' : undefined}>radius</span>
      {', '}
      <span className={state.highlightedTerm === 'diameter' ? 'geo-l06-p002-teaching-text__highlight' : undefined}>diameter</span>
    </p> : null}
  </section>;
}
