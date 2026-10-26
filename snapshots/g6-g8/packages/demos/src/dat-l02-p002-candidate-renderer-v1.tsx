'use client';

import React, {useId} from 'react';
import type {RuntimeContext} from './contract';
import {datL02P002VisualPlan, type DatL02P002VisualLayer} from './dat-l02-p002-visual-plan-v1';

type AssetHrefs = Readonly<Record<string, string>>;
type MaskGeometry = Readonly<{d: string; clipRule: 'evenodd' | 'nonzero'}>;
type MaskPaths = Readonly<Record<string, MaskGeometry>>;
// Source assignment card/text and title layers move together into native flow.
const TERMINAL_ASSIGNMENT_LAYER_IDS = new Set([102, 105, 108, 110, 112, 114, 115]);

function svgMatrix(values: DatL02P002VisualLayer['stageMatrix']): string {
  return `matrix(${values.join(' ')})`;
}

/** Visual-only, unregistered source-frame candidate. No audio, host clock, or original-runtime claim. */
export function DatL02P002CandidateRenderer({context, assetHrefs, maskPaths, nativeTerminalAssignment = false}: {
  context: RuntimeContext;
  assetHrefs: AssetHrefs;
  maskPaths: MaskPaths;
  nativeTerminalAssignment?: boolean;
}) {
  const plan = datL02P002VisualPlan(context.frame, context);
  if (plan.currentJsRegistered || plan.originalHostTraceEstablished ||
      plan.audioSynchronizationAccepted) {
    throw Error('DAT_L02_P002_CANDIDATE_BOUNDARY_DRIFT');
  }
  const uniqueId = useId().replace(/:/g, '');
  const replaceAssignment = nativeTerminalAssignment && context.frameDomain === 'sprite-113' &&
    context.frame === 276;
  if (nativeTerminalAssignment && !replaceAssignment) {
    throw Error('DAT_L02_P002_NATIVE_ASSIGNMENT_ONLY_AT_TERMINAL_FRAME');
  }
  const clipId = (path: string) => `datp002-${uniqueId}-${path.replaceAll('/', '-')}`;
  const maskLayers = plan.layers.filter(layer => layer.renderMode === 'mask');
  const contentLayers = plan.layers.filter(layer => layer.renderMode === 'content');
  if (replaceAssignment) {
    const sourceIds = contentLayers.filter(layer => TERMINAL_ASSIGNMENT_LAYER_IDS.has(layer.characterId))
      .map(layer => layer.characterId).sort((a, b) => a - b);
    if (sourceIds.join(',') !== '102,105,108,110,112,114,115') {
      throw Error('DAT_L02_P002_TERMINAL_TEXT_BINDING_DRIFT');
    }
  }
  return <section data-animation-id={plan.animationId} data-candidate-visual-only="true"
    data-native-terminal-assignment={replaceAssignment ? 'candidate' : undefined}
    data-flash-frame={plan.frame} data-flash-frame-domain={plan.frameDomain}
    data-flash-root-frame="6" data-flash-language={plan.language}
    data-flash-seed={plan.seed} data-flash-replay={plan.replay}
    data-projected-child-count={plan.projectedChildCount}>
    <svg viewBox="0 0 800 600" role="img"
      aria-label={plan.language === 'es'
        ? 'Reconstrucción visual no aceptada; texto original en inglés'
        : 'Unaccepted source-frame visual reconstruction; original English text'}
      style={{display: 'block', width: '100%', height: 'auto', aspectRatio: '4 / 3'}}>
      <rect x="0" y="0" width="800" height="600" fill="#b8d8f7"/>
      <defs>{maskLayers.map(layer => {
        const geometry = maskPaths[layer.sourceSvgPath];
        if (!geometry?.d || (geometry.clipRule !== 'evenodd' && geometry.clipRule !== 'nonzero')) {
          throw Error(`DAT_L02_P002_UNBOUND_MASK_PATH:${layer.instancePath}`);
        }
        return <clipPath key={layer.instancePath} id={clipId(layer.instancePath)}
          clipPathUnits="userSpaceOnUse">
          <path d={geometry.d} clipRule={geometry.clipRule}
            transform={svgMatrix(layer.stageMatrix)}/>
        </clipPath>;
      })}</defs>
      {contentLayers.filter(layer => !replaceAssignment || !TERMINAL_ASSIGNMENT_LAYER_IDS.has(layer.characterId)).map(layer => {
        const href = assetHrefs[layer.sourceSvgPath];
        if (href !== `/flash-assets/g678-local/shared-dat001-l02-p002/symbol/${layer.sourceSvgSha256}`) {
          throw Error(`DAT_L02_P002_MISSING_CANDIDATE_ASSET:${layer.instancePath}`);
        }
        const [left, top, right, bottom] = layer.boundsPixels;
        const visual = <image href={href} x={left} y={top}
          width={right - left} height={bottom - top}
          transform={svgMatrix(layer.stageMatrix)} opacity={layer.opacity}
          preserveAspectRatio="none" pointerEvents="none"/>;
        return <g key={layer.instancePath} data-source-instance-path={layer.instancePath}
          data-source-character-id={layer.characterId}>
          {layer.maskPaths.reduceRight((child, path) =>
            <g key={path} clipPath={`url(#${clipId(path)})`}>{child}</g>, visual)}
        </g>;
      })}
    </svg>
  </section>;
}
