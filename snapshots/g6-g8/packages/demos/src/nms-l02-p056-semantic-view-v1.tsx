import React from 'react';

import {p056SourceSpriteFrame} from './timelines/shared-nms002-l02-p056-display-list';
import {P056_SOURCE_BEHAVIOR, P056_SOURCE_BUTTONS} from './timelines/shared-nms002-l02-p056-source-behavior';

export type P056TermRequest = Readonly<{
  animationId: typeof P056_SOURCE_BEHAVIOR.animationId;
  teachingFrame: number;
  characterId: 16 | 17;
  sourceKeyAttribute: 'Organize' | 'Information';
}>;

export function p056TermRequest(teachingFrame: number, characterId: 16 | 17): P056TermRequest {
  const state = p056SemanticSnapshot(teachingFrame);
  if (!state.glossaryReady) throw new Error('P056 glossary button is not fully visible');
  const source = P056_SOURCE_BUTTONS.find(button => button.characterId === characterId)!;
  return Object.freeze({animationId: P056_SOURCE_BEHAVIOR.animationId, teachingFrame,
    characterId, sourceKeyAttribute: source.sourceKeyAttribute});
}

/** Source-static text visibility for the nested teaching timeline; owns no clock or glossary state. */
export function p056SemanticSnapshot(teachingFrame: number) {
  const layers = p056SourceSpriteFrame(teachingFrame);
  const alpha = (characterId: number) => {
    const matches = layers.filter(layer => layer.characterId === characterId);
    if (matches.length > 1) throw new Error(`P056 text ${characterId} has ambiguous instances`);
    return matches[0]?.alpha256 ?? 0;
  };
  if (alpha(9) !== 256) throw new Error('P056 step-one source text is not fully visible');
  if (alpha(12) !== alpha(14) || alpha(14) !== alpha(16) || alpha(16) !== alpha(17)) {
    throw new Error('P056 heading, plan text, and glossary button fades diverged');
  }
  return Object.freeze({
    teachingFrame,
    headingAlpha: alpha(14) / 256,
    stepTwoAlpha: alpha(12) / 256,
    haveQuestionAlpha: alpha(20) / 256,
    needQuestionAlpha: alpha(22) / 256,
    glossaryReady: alpha(16) === 256 && alpha(17) === 256,
    highlightedTerm: alpha(18) > 0 ? 'Organize' : alpha(19) > 0 ? 'Information' : null,
  });
}

export function P056SemanticView({teachingFrame, uiLanguage = 'en', onTermRequest}: Readonly<{
  teachingFrame: number;
  uiLanguage?: 'en' | 'es';
  onTermRequest?: (request: P056TermRequest) => void;
}>) {
  const state = p056SemanticSnapshot(teachingFrame);
  const headingVisible = state.headingAlpha > 0;
  const interactive = state.glossaryReady && typeof onTermRequest === 'function';
  const term = (characterId: 16 | 17, label: string) => {
    const source = P056_SOURCE_BUTTONS.find(button => button.characterId === characterId)!;
    const className = `p056-semantic__term${interactive ? '' : ' p056-semantic__term--unavailable'}${state.highlightedTerm === source.sourceKeyAttribute ? ' p056-semantic__term--flash' : ''}`;
    return interactive ? <button className={className} data-source-button-id={characterId}
      data-source-key={source.sourceKeyAttribute}
      onClick={() => onTermRequest?.(p056TermRequest(teachingFrame, characterId))}
      type="button">{label}</button> : <span className={className}
      data-source-button-id={characterId} data-source-key={source.sourceKeyAttribute}>{label}</span>;
  };
  return <section className="p056-semantic" data-animation-id={P056_SOURCE_BEHAVIOR.animationId}
    data-teaching-frame={teachingFrame} data-frame-domain="sprite-24" data-ui-language={uiLanguage}
    data-language-policy={uiLanguage === 'es' ? 'source-fallback' : 'source'} lang="en"
    data-glossary-resolution={interactive ? 'delegated-unverified' : 'blocked-no-l2-source'}
    data-source-audio-enabled="false" data-registered-current-javascript="false"
    data-original-runtime-accepted="false" data-strict-migration-complete="false">
    <div className="p056-semantic__instruction">
      <div className="p056-semantic__heading-slot">
        {headingVisible ? <h2 data-source-text-id="14" aria-hidden={state.headingAlpha < 1}
          style={{opacity: state.headingAlpha}}><span className="p056-semantic__step-number">2</span>{' '}
          {term(16, 'Organize')} the {term(17, 'information')}.</h2> : null}
      </div>
      <ul className="p056-semantic__questions">
        {state.haveQuestionAlpha > 0 ? <li data-source-text-id="20"
          aria-hidden={state.haveQuestionAlpha < 1}
          style={{opacity: state.haveQuestionAlpha}}>What information do I have?</li> : null}
        {state.needQuestionAlpha > 0 ? <li data-source-text-id="22"
          aria-hidden={state.needQuestionAlpha < 1}
          style={{opacity: state.needQuestionAlpha}}>What information do I need?</li> : null}
      </ul>
    </div>
    <ol className="p056-semantic__plan" aria-label="Four-step plan">
      <li data-source-text-id="8 9"><span aria-hidden="true">1.</span><span>Restate the question.</span></li>
      <li data-source-text-id="5 12"><span aria-hidden="true">2.</span>{state.stepTwoAlpha > 0 ?
        <span aria-hidden={state.stepTwoAlpha < 1} style={{opacity: state.stepTwoAlpha}}>
          Organize the information.</span> : null}</li>
      <li data-source-text-id="6"><span aria-hidden="true">3.</span><span className="p056-semantic__empty">Step 3 has no source text on this page.</span></li>
      <li data-source-text-id="7"><span aria-hidden="true">4.</span><span className="p056-semantic__empty">Step 4 has no source text on this page.</span></li>
    </ol>
  </section>;
}
