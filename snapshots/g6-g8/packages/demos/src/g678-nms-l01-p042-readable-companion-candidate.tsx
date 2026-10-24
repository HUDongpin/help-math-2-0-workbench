"use client";
import React, {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {AnimationRendererProps} from './contract';
import {G678_NMS_L01_P042_CANDIDATE_MODULE as BASE, G678_NMS_L01_P042_CONFIG as BASE_CONFIG,
  NmsL01P042SourceRenderer} from './g678-nms-l01-p042-candidate';
import {G678_NMS_L01_P042_SOURCE_VISUAL as SOURCE} from './generated/g678-nms-l01-p042-source-visual-v1';

export const G678_NMS_L01_P042_READABLE_COMPANION_CONFIG = Object.freeze({
  animationId: BASE_CONFIG.animationId, sourceSwfSha256: SOURCE.source.sha256,
  sourceLiteralCharacterIds: Object.freeze([2, 16, 18, 20, 22]),
  pageInteractionCompanionTargetIdSuffix: 'nms-l01-p042-readable-companion',
  sourceLanguage: 'en', stepFontPx: 20, titleFontPx: 22, lineHeight: 1.5, stepGapPx: 8,
  color: Object.freeze({ink: '#13284c', surface: '#ffffff'}),
  contentType: 'noninteractive-literal-title-and-ordered-four-steps',
  sourceVisualRetained: true, sourceClockInherited: true, audioIntegrated: false,
  currentJavaScriptRegistered: false, productCalibrationPassed: false,
} as const);
const CONFIG = G678_NMS_L01_P042_READABLE_COMPANION_CONFIG;
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Only the exact native learning-column slot can own this companion portal. */
export function resolveNmsL01P042ReadableTarget(source: HTMLElement | null, targetId?: string): HTMLElement | null {
  if (!source?.isConnected || !targetId ||
    !(targetId === CONFIG.pageInteractionCompanionTargetIdSuffix || targetId.endsWith(`-${CONFIG.pageInteractionCompanionTargetIdSuffix}`))) return null;
  const owner = source.closest('.lesson-shell2__learning-column');
  if (!owner) return null;
  const matches = [...source.ownerDocument.querySelectorAll<HTMLElement>('[id]')].filter(element => element.id === targetId);
  if (matches.length !== 1) return null;
  const target = matches[0];
  return target.isConnected && target.tagName === 'DIV' && target.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
    target.ownerDocument === source.ownerDocument && target.dataset.pageInteractionCompanionHost === 'true' &&
    target.parentElement === owner && target.closest('.lesson-shell2__learning-column') === owner &&
    !source.contains(target) ? target : null;
}
function useReadableTarget(source: React.RefObject<HTMLDivElement | null>, targetId?: string) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useClientLayoutEffect(() => {
    const resolve = () => setTarget(previous => {
      const next = resolveNmsL01P042ReadableTarget(source.current, targetId);
      return previous === next ? previous : next;
    });
    resolve();
    if (!targetId) return;
    const document = source.current?.ownerDocument;
    if (!document) return;
    const observer = new MutationObserver(resolve);
    observer.observe(document.body, {subtree: true, childList: true, attributes: true,
      attributeFilter: ['id', 'class', 'data-page-interaction-companion-host']});
    return () => observer.disconnect();
  }, [source, targetId]);
  return target && resolveNmsL01P042ReadableTarget(source.current, targetId) === target ? target : null;
}
function ReadableContent({placement}: {placement: 'portal' | 'fallback'}) {
  const titleId = `p042-readable-title-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  return <section data-p042-readable-content="true" data-companion-placement={placement} lang="en" aria-labelledby={titleId}
    style={{boxSizing: 'border-box', width: '100%', minWidth: 0, maxWidth: 800, margin: '0 auto', padding: 16,
      color: CONFIG.color.ink, backgroundColor: CONFIG.color.surface, fontFamily: 'system-ui, sans-serif',
      fontSize: CONFIG.stepFontPx, lineHeight: CONFIG.lineHeight, overflowWrap: 'anywhere'}}>
    <h2 id={titleId} style={{fontSize: CONFIG.titleFontPx, lineHeight: CONFIG.lineHeight, margin: '0 0 16px',
      color: 'inherit', fontFamily: 'inherit', fontWeight: 600}}>{SOURCE.literalTitle}</h2>
    <ol style={{margin: 0, paddingInlineStart: '1.5em', listStyleType: 'decimal', fontSize: CONFIG.stepFontPx, lineHeight: CONFIG.lineHeight}}>
      {SOURCE.literalSteps.map((literal, index) => <li key={literal} data-source-literal-character-id={CONFIG.sourceLiteralCharacterIds[index + 1]}
        style={{fontSize: CONFIG.stepFontPx, lineHeight: CONFIG.lineHeight, padding: 0, margin: index === 0 ? 0 : `${CONFIG.stepGapPx}px 0 0`}}>{literal}</li>)}
    </ol>
  </section>;
}
export function NmsL01P042ReadableCompanionRenderer(props: AnimationRendererProps) {
  const source = useRef<HTMLDivElement | null>(null), target = useReadableTarget(source, props.pageInteractionCompanionTargetId);
  const ready = BASE.getFrameState(props.frame, props).status === 'ready';
  const content = ready ? <ReadableContent placement={target ? 'portal' : 'fallback'}/> : null;
  return <div data-p042-readable-companion-candidate="v1" data-source-state={ready ? 'ready' : 'blocked'}
    data-current-javascript-registered="false" data-product-calibration-passed="false" lang="en">
    {content && !target ? <div data-p042-readable-fallback="true">{content}</div> : null}
    <div ref={source} data-p042-readable-source-plane="true" aria-hidden={ready ? true : undefined}>
      <NmsL01P042SourceRenderer {...props}/>
    </div>
    {content && target ? createPortal(content, target) : null}
  </div>;
}
export const G678_NMS_L01_P042_READABLE_COMPANION_CANDIDATE_MODULE = Object.freeze({
  ...BASE, Renderer: NmsL01P042ReadableCompanionRenderer,
});
