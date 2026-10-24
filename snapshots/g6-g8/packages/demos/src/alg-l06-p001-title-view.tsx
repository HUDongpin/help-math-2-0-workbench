import React from 'react';
import {ALG_L06_P001_SOURCE, sourceTitleState} from './alg-l06-p001-title-state';

const TITLE_BOUNDS = {x: 2.3, y: 10.3, width: 654.4, height: 37.15} as const;

export interface P001TitleViewProps {
  frame: number;
  uiLanguage: 'en' | 'es';
  /** Private-preview exports of SWF DefineText characters 140 and 141. */
  textAssetHrefs: readonly [string, string];
  registered?: boolean;
}

/** Source-static SVG candidate. The host must supply clock, audio, and replay decisions. */
export function P001TitleView({frame, uiLanguage, textAssetHrefs, registered = false}: P001TitleViewProps) {
  if (textAssetHrefs.some(href =>
    !(href.startsWith('/') && !href.startsWith('//')) &&
    !/^data:image\/svg\+xml;base64,(?:[A-Za-z0-9+/]{4})+(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(href))) {
    throw new RangeError('P001 title assets must use same-origin paths or SVG data URLs');
  }
  const state = sourceTitleState(frame);
  const label = uiLanguage === 'es'
    ? `Título original: ${state.title}. Fotograma ${frame} de ${ALG_L06_P001_SOURCE.frameCount}.`
    : `Original title: ${state.title}. Frame ${frame} of ${ALG_L06_P001_SOURCE.frameCount}.`;

  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"
    width="800" height="600" role="img" aria-label={label}
    style={{display: 'block', width: '100%', maxWidth: 800, height: 'auto', aspectRatio: '4 / 3'}}
    data-animation-id={ALG_L06_P001_SOURCE.animationId}
    data-flash-animation-id={ALG_L06_P001_SOURCE.animationId}
    data-flash-source-sha256={ALG_L06_P001_SOURCE.swfSha256}
    data-flash-frame-domain={state.frameDomainId}
    data-flash-frame={state.frame}
    data-current-javascript-registered={registered ? 'true' : 'false'}>
    <rect x="0" y="0" width="800" height="600" fill="#b8d8f7"/>
    {state.layers.map((layer, index) => <image key={layer.characterId}
      href={textAssetHrefs[index]}
      x={TITLE_BOUNDS.x} y={TITLE_BOUNDS.y}
      width={TITLE_BOUNDS.width} height={TITLE_BOUNDS.height}
      transform={`translate(${(state.rootXTwips + layer.xTwips) / 20} ${(state.rootYTwips + layer.yTwips) / 20}) scale(${layer.scaleX} ${layer.scaleY})`}
      opacity={layer.alpha256 / 256}
      data-flash-character-id={layer.characterId}
      data-flash-depth={layer.depth}/>)}
  </svg>;
}
