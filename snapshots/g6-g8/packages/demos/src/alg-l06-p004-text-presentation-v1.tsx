import React, {type ComponentType} from 'react';
import type {AnimationRendererProps, RuntimeContext} from './contract';
import type {LessonTextPresentationCapability} from './lesson-text-contract';
import type {SourceStaticCanvasFrameState} from './source-static-canvas-candidate';
import {P004_SEMANTIC_TEXT_BINDING} from './alg-l06-p004-semantic-text-v1';
import {P004NativeTextV1} from './alg-l06-p004-native-text-v1';
import {p004TextSnapshot} from './alg-l06-p004-text-snapshot-v1';

/** The source Canvas state describes English visual frames. The snapshot's
 * language describes the UI locale, which may request a Spanish fallback note. */
export function p004PresentationTextSnapshot(
  state: SourceStaticCanvasFrameState | null | undefined,
  context: RuntimeContext,
) {
  const snapshot = p004TextSnapshot(context);
  if (state !== null && state !== undefined) {
    const sameTrace = (
      ['requirementId', 'traceId', 'entryStateSha256'] as const
    ).every(key => context[key] === undefined || state[key] === context[key]);
    if (state.animationId !== P004_SEMANTIC_TEXT_BINDING.animationId ||
        state.sourceSwfSha256 !== P004_SEMANTIC_TEXT_BINDING.sourceSwfSha256 ||
        state.frame !== context.frame || state.exportFrame !== context.frame - 1 ||
        state.frameDomain !== context.frameDomain || state.rootFrame !== context.rootFrame ||
        state.rootState !== 'stopped-at-begin-while-child-static-frame-is-inspected' ||
        state.scenario !== context.scenario || state.seed !== context.seed ||
        state.language !== 'en' || state.status !== 'ready' || state.blocker !== null ||
        state.sourceStaticVisualReady !== true || !sameTrace)
      throw Error('P004_TEXT_DRAWING_STATE_MISMATCH');
  }
  return snapshot;
}

/** The generic host substitutes this Renderer for the drawing Renderer. Keep
 * the original drawing in the same view; native text lives beside its stage. */
export function createAlgL06P004TextPresentationV1(
  DrawingRenderer: ComponentType<AnimationRendererProps>,
): LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  function CompositeRenderer(props: AnimationRendererProps) {
    // Root and sibling source capture retain the original drawing/blocked view.
    // Only the inspected English visual stream has a source-bound text panel.
    if (props.frameDomain !== 'sprite-95' || props.rootFrame !== 6 ||
        props.scenario !== 'source-static-frame' || props.lang !== 'en')
      return <DrawingRenderer {...props}/>;

    const context: RuntimeContext = {
      frame: props.frame, frameDomain: props.frameDomain, rootFrame: props.rootFrame,
      scenario: props.scenario, lang: props.uiLanguage ?? props.lang,
      seed: props.seed, replay: props.replay,
      requirementId: props.requirementId, traceId: props.traceId,
      entryStateSha256: props.entryStateSha256,
    };
    const snapshot = p004PresentationTextSnapshot(
      props.state as SourceStaticCanvasFrameState | undefined, context,
    );
    return <div data-p004-text-composite="true" style={{width: '100%'}}>
      <DrawingRenderer {...props}/>
      <div data-p004-native-companion="true">
        <P004NativeTextV1 snapshot={snapshot}/>
      </div>
    </div>;
  }
  return Object.freeze({
    schemaVersion: 1 as const,
    binding: P004_SEMANTIC_TEXT_BINDING,
    Renderer: CompositeRenderer,
    getSnapshot: p004PresentationTextSnapshot,
  });
}
