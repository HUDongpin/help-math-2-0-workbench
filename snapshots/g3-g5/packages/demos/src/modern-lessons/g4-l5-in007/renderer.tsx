'use client';
import React, {useState} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../../contract';
import type {LessonTextPresentationCapability, TextPresentationSnapshot} from '../../lesson-text-contract';
import {buildLessonTextSnapshot, validateLessonTextBinding} from '../../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {IN007_SOURCE as config} from './source.generated';
import {createIn007Interaction, reduceIn007Interaction, type In007Interaction} from './state';

const at = <T,>(curve: readonly (readonly [number, T])[], frame: number): T => {
  let value = curve[0][1];
  for (const [first, next] of curve) { if (first > frame) break; value = next; }
  return value;
};
const tokens = new Map(config.tokens.map(token => [token.id, token]));
function wordState(character: number, word: number, frame: number) {
  const source = config.tokens.filter(token => token.character === character && token.word === word);
  const visible = source.filter(token => at(token.alpha, frame) > 0);
  return {source, visible, alpha: Math.max(0, ...visible.map(token => at(token.alpha, frame))), rgb: visible.length ? at<readonly number[]>(visible[0].rgb, frame) : [0, 0, 0]};
}
function groupText(character: number, frame: number) {
  const group = config.groups.find(group => group.character === character)!;
  return group.words.filter((_, index) => wordState(character, index, frame).alpha > 0).map(word => word.text).join(' ');
}

const STYLE = `
.g4l5-in007{container-type:inline-size;box-sizing:border-box;inline-size:100%;min-inline-size:0;padding:1rem;background:#fffdf7;color:#172336;font-family:var(--lesson-font-body,'Nunito Sans'),sans-serif;font-size:var(--lesson-text-body-size,1.125rem);line-height:1.6}
.g4l5-in007 *{box-sizing:border-box}.g4l5-in007 h2{font-family:var(--lesson-font-display,Fredoka),sans-serif;font-size:clamp(1.125rem,4.5cqi,1.75rem);line-height:1.25;color:#10389c;margin:0 0 .8rem;overflow-wrap:normal;word-break:normal}
.g4l5-in007__word{display:inline-block;white-space:nowrap}.g4l5-in007__instruction{max-inline-size:70ch;margin:.6rem 0}.g4l5-in007__term{font:inherit;line-height:inherit;color:#1556a0;background:transparent;border:0;padding:0;min-block-size:44px;min-inline-size:44px;text-align:start;border-radius:.2rem;text-decoration:underline;text-underline-offset:.15em;cursor:pointer}.g4l5-in007__term:disabled{color:inherit;cursor:default}
.g4l5-in007__scroll{max-inline-size:100%;min-inline-size:0;overflow-x:auto;overscroll-behavior-inline:contain;padding:.3rem}.g4l5-in007 table{inline-size:100%;min-inline-size:calc(10 * 3.5em);max-inline-size:44rem;margin-inline:auto;table-layout:fixed;border-collapse:collapse;border:1px solid #24272b;font-size:1.125rem;line-height:1.5}.g4l5-in007 td{border:1px solid #667282;text-align:center;padding:.3em .15em;block-size:2.35em;font-variant-numeric:tabular-nums;background:#fff}.g4l5-in007 td[data-highlighted=true]{background:#ff99ff;font-weight:700}
.g4l5-in007__entry-placeholder{display:inline-block;vertical-align:middle;inline-size:6ch;min-block-size:44px;border:2px solid #59677a;border-radius:.25rem;background:#fff;margin-inline-start:.2rem}.g4l5-in007__controls{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin:.75rem 0}.g4l5-in007 input{font:inherit;inline-size:6ch;min-block-size:44px;border:2px solid #59677a;border-radius:.25rem;padding:.2rem;text-align:center;background:#fff;color:#172336}.g4l5-in007__action{font:inherit;font-weight:700;min-block-size:44px;padding:.4rem .8rem;border:2px solid #1556a0;border-radius:.4rem;background:#eaf2fb;color:#123d79}.g4l5-in007 button:focus-visible,.g4l5-in007 input:focus-visible,.g4l5-in007__scroll:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
@container(max-width:26rem){.g4l5-in007{padding:.5rem;font-size:1.125rem}}
`;

/** No default empty audio: integration must provide this page's reviewed source cues. */
export function createIn007Presentation(
  getFrameState: (frame: number, context: RuntimeContext) => SourceStaticCanvasFrameState,
  FallbackRenderer: React.ComponentType<AnimationRendererProps>,
  sourceAudio: readonly (AudioCue & {readonly sha256: string; readonly manualNarration?: false})[],
): LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  validateLessonTextBinding(config.binding);
  function getSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext,
    activity = createIn007Interaction(context.seed, context.replay ?? 0)): TextPresentationSnapshot {
    const expected = getFrameState(context.frame, context);
    const valid = state.status === 'ready' && expected.status === 'ready' && state.animationId === config.animationId &&
      state.sourceSwfSha256 === config.sourceSwfSha256 && state.frame === context.frame && Number.isInteger(context.frame) && context.frame >= 1 && context.frame <= config.frameCount &&
      state.frameDomain === config.frameDomain && (context.frameDomain ?? config.frameDomain) === config.frameDomain && state.rootFrame === config.rootFrame &&
      (context.rootFrame ?? config.rootFrame) === config.rootFrame && state.scenario === 'source-static-frame' && context.scenario === state.scenario &&
      state.language === 'en' && context.lang === 'en' && state.seed === expected.seed && activity.seed === expected.seed && activity.replay === (context.replay ?? 0) && !context.entryStateSha256;
    if (!valid) return {...buildLessonTextSnapshot(config.binding, context, {}), status: 'blocked', blockers: ['source-or-activity-identity-mismatch'], blocks: [], suppressedInstances: []};
    const content: Record<string, {text: string; visible: boolean}> = {};
    content.title = {text: config.title, visible: true};
    for (const group of config.groups) {
      const text = state.frame >= config.interactionFrame && [108, 110, 111].includes(group.character) ? group.text : groupText(group.character, state.frame);
      content[`character-${group.character}`] = {text, visible: text.length > 0};
    }
    for (const number of config.numbers) content[`cell-${number.number}`] = {text: String(number.number), visible: state.frame >= config.interactionFrame || number.tokens.some(id => at(tokens.get(id)!.alpha, state.frame) > 0)};
    content.entry = {text: activity.entry, visible: state.frame >= config.interactionFrame && activity.entry !== ''};
    return buildLessonTextSnapshot(config.binding, {...context, frameDomain: config.frameDomain, rootFrame: config.rootFrame}, content);
  }
  function Session({state, context, props}: {state: SourceStaticCanvasFrameState; context: RuntimeContext; props: AnimationRendererProps}) {
    const [activity, setActivity] = useState(() => createIn007Interaction(state.seed, context.replay ?? 0));
    const snapshot = getSnapshot(state, context, activity);
    if (snapshot.status !== 'ready') return <FallbackRenderer {...props} state={state}/>;
    const interactive = state.frame >= config.interactionFrame;
    const enabled = interactive && !props.paused;
    const dispatch = (action: Parameters<typeof reduceIn007Interaction>[1]) => { if (enabled) setActivity(current => reduceIn007Interaction(current, action, state.frame)); };
    const renderWords = (character: number) => {
      const group = config.groups.find(group => group.character === character)!;
      const word = (index: number) => {
        const current = wordState(character, index, state.frame);
        return <span className="g4l5-in007__word" data-source-character={character} data-source-word={index} data-source-instances={current.source.map(token => token.instance).join(',')} data-source-text-ids={[...new Set(current.source.flatMap(token => token.sourceTextIds))].join(',')}
          aria-hidden={current.alpha === 0 || undefined} style={{opacity: current.alpha, visibility: current.alpha > 0 ? 'visible' : 'hidden', color: `rgb(${current.rgb.join(',')})`}}>{group.words[index].text}</span>;
      };
      const rendered: React.ReactNode[] = [];
      for (let index = 0; index < group.words.length; index++) {
        const term = config.terms.find(term => term.character === character && term.words[0] === index);
        if (term) {
          const active = term.activeFrames.some(([first, end]) => state.frame >= first && state.frame < end) && term.words.every(i => wordState(character, i, state.frame).alpha > 0);
          rendered.push(<button key={index} type="button" className="g4l5-in007__term" data-source-button={term.button} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} disabled={!active || !props.onLessonHostRequest}
            onClick={event => {if (active) props.onLessonHostRequest?.({type: 'open-keyterm', entryId: term.entryId, sourceAnimationId: config.animationId, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger: event.currentTarget, keyTermIndexLanguage: 'en'});}}>{term.words.map((i, n) => <React.Fragment key={i}>{n ? ' ' : null}{word(i)}</React.Fragment>)}</button>);
          index = term.words.at(-1)!;
        } else rendered.push(<React.Fragment key={index}>{word(index)}</React.Fragment>);
        if (index < group.words.length - 1) rendered.push(' ');
      }
      return rendered;
    };
    const block = (id: string) => snapshot.blocks.find(block => block.id === id)!;
    const plainControlLabel = (character: number) => interactive ? config.groups.find(group => group.character === character)!.text : renderWords(character);
    return <section className="g4l5-in007 lesson-text-presentation" lang="en" data-modern-text-page={config.animationId} data-placement-id={config.placementId} data-source-sha={config.sourceSwfSha256} data-source-frame={state.frame} data-flash-frame-domain={config.frameDomain} data-flash-root-frame={config.rootFrame} data-replay={context.replay ?? 0} data-source-quiz-hold={interactive} data-interaction-enabled={enabled} data-language-policy={props.uiLanguage === 'es' ? 'source-English-fallback' : 'source-English'}>
      <style>{STYLE}</style>
      <h2 data-lesson-text-block="title" data-source-text-ids={config.titleSourceTextIds.join(',')}>{config.title}</h2>
      {[114, 122].map(character => <p key={character} className="g4l5-in007__instruction" data-lesson-text-block={`character-${character}`} aria-hidden={!block(`character-${character}`).visible || undefined}>{renderWords(character)}</p>)}
      <div className="g4l5-in007__scroll" role="region" aria-label="Hundreds chart: ten columns and ten rows" tabIndex={0}>
        <table aria-label="Numbers 1 through 100"><tbody>{Array.from({length: 10}, (_, row) => <tr key={row}>{config.numbers.filter(number => number.row === row).map(number => <td key={number.number} data-lesson-text-block={`cell-${number.number}`} data-chart-number={number.number} data-highlighted={activity.shaded.includes(number.number)} data-source-character={number.character} data-source-text-ids={[...number.sourceTextIds, number.dynamicSourceTextId].join(',')} data-source-dynamic-instance={interactive ? number.dynamicInstance : undefined}><span aria-hidden={!block(`cell-${number.number}`).visible || undefined} style={{visibility: block(`cell-${number.number}`).visible ? 'visible' : 'hidden'}}>{number.number}</span></td>)}</tr>)}</tbody></table>
      </div>
      <div className="g4l5-in007__controls">
        <label data-lesson-text-block="character-108"><span>{plainControlLabel(108)}</span>{interactive ? <input type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" data-lesson-text-block="entry" data-source-character="131" data-source-instance="txtEntry" value={activity.entry} disabled={!enabled} onChange={event => dispatch({type: 'entry', value: event.currentTarget.value})}/> : <span className="g4l5-in007__entry-placeholder" aria-hidden="true" data-source-shape={config.entrySurface.introShape} style={{opacity: at(config.entrySurface.introAlpha, state.frame), visibility: at(config.entrySurface.introAlpha, state.frame) > 0 ? 'visible' : 'hidden'}}/>}</label>
        <button type="button" className="g4l5-in007__action" data-lesson-text-block="character-110" data-source-button="128" disabled={!enabled} onClick={() => dispatch({type: 'shade'})}>{plainControlLabel(110)}</button>
        <button type="button" className="g4l5-in007__action" data-lesson-text-block="character-111" data-source-button="130" disabled={!enabled} onClick={() => dispatch({type: 'clear'})}>{plainControlLabel(111)}</button>
      </div>
    </section>;
  }
  function Renderer(props: AnimationRendererProps) {
    const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? config.frameDomain};
    const state = (props.state ?? getFrameState(props.frame, context)) as SourceStaticCanvasFrameState;
    return <Session key={`${state.seed}:${context.replay ?? 0}`} state={state} context={context} props={props}/>;
  }
  return {schemaVersion: 1, binding: config.binding, Renderer, getSnapshot, playbackMode: 'once', playbackEndFrameByDomain: {[config.frameDomain]: config.interactionFrame}, reducedMotionFrameByDomain: {[config.frameDomain]: config.interactionFrame}, sourceTimelineAudioCues: sourceAudio, keyTerms: config.keyTerms};
}
