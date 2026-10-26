'use client';

import React, {useId} from 'react';
import type {RuntimeContext} from './contract';
import MASK_SOURCE from './generated/geo001-l07-p003-mask-paths-v1.json';
import {geoL07P003VisualPlan, type GeoL07P003VisualLayer} from './geo-l07-p003-visual-plan-v1';

type AssetHrefs = Readonly<Record<string, string>>;
type MaskSource = Readonly<{characterId: number; d: string; clipRule: string}>;
const MASKS = new Map<number, MaskSource>(MASK_SOURCE.masks.map(mask => [mask.characterId, mask]));

function svgMatrix(values: GeoL07P003VisualLayer['stageMatrix']): string {
  return `matrix(${values.join(' ')})`;
}

/** Visual-only candidate: source buttons are painted but never activated. */
export function GeoL07P003CandidateRenderer({context, assetHrefs}: {
  context: RuntimeContext;
  assetHrefs: AssetHrefs;
}) {
  const plan = geoL07P003VisualPlan(context.frame, context);
  const uniqueId = useId().replace(/:/g, '');
  const clipId = (depth: number) => `p003-${uniqueId}-clip-${depth}`;
  const maskLayers = plan.layers.filter(layer => layer.renderMode === 'mask');
  const contentLayers = plan.layers.filter(layer => layer.renderMode === 'content');
  if (MASKS.size !== 2 || plan.currentJsRegistered || plan.glossaryHostResolved) {
    throw Error('GEO_L07_P003_CANDIDATE_BOUNDARY_DRIFT');
  }
  return <section data-animation-id={plan.animationId} data-candidate-visual-only="true"
    data-flash-frame={plan.frame} data-flash-frame-domain={plan.frameDomain}
    data-flash-language={plan.language} data-flash-seed={plan.seed}
    data-flash-replay={plan.replay} data-source-text-ids={plan.sourceTextIds.join(',')}>
    <svg viewBox="0 0 800 600" role="img" aria-label="Unaccepted source visual reconstruction"
      style={{display: 'block', width: '100%', height: 'auto', aspectRatio: '4 / 3'}}>
      <rect x="0" y="0" width="800" height="600" fill="#b8d8f7"/>
      <defs>{maskLayers.map(layer => {
        const mask = MASKS.get(layer.characterId);
        if (!mask || (mask.clipRule !== 'evenodd' && mask.clipRule !== 'nonzero')) {
          throw Error('GEO_L07_P003_UNBOUND_MASK_PATH');
        }
        return <clipPath key={layer.depth} id={clipId(layer.depth)} clipPathUnits="userSpaceOnUse">
          <path d={mask.d} clipRule={mask.clipRule} transform={svgMatrix(layer.stageMatrix)}/>
        </clipPath>;
      })}</defs>
      {contentLayers.map(layer => {
        const href = assetHrefs[layer.sourceSvgPath];
        if (!href?.startsWith('data:image/svg+xml;base64,')) {
          throw Error(`GEO_L07_P003_MISSING_CANDIDATE_ASSET:${layer.characterId}`);
        }
        const [left, top, right, bottom] = layer.boundsPixels;
        const visual = <image key={`image-${layer.depth}`} href={href}
          x={left} y={top} width={right - left} height={bottom - top}
          transform={svgMatrix(layer.stageMatrix)} opacity={layer.opacity}
          preserveAspectRatio="none" pointerEvents="none"/>;
        return <g key={`depth-${layer.depth}`} data-source-depth={layer.depth}
          data-source-character-id={layer.characterId}
          data-glossary-key={layer.glossaryKey ?? undefined}>
          {layer.maskDepths.reduceRight((child, depth) =>
            <g clipPath={`url(#${clipId(depth)})`}>{child}</g>, visual)}
        </g>;
      })}
    </svg>
  </section>;
}
