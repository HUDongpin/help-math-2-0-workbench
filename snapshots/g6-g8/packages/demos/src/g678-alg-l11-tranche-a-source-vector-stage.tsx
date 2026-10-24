"use client";

import React from "react";

export interface AlgL11ASourceVectorBundle {
  readonly animationId: string;
  readonly source: Readonly<{sha256: string}>;
  readonly frameCount: number;
  readonly definitions: readonly string[];
  readonly rootBody: string;
  readonly frameBodies: readonly string[];
  readonly frameBodyIndices: readonly number[];
  readonly helpBody: string | null;
  readonly helpControls?: Readonly<Record<'open' | 'close', Readonly<{
    sourceInstanceName: string;
    sourceObjectId: number;
    polygon: readonly (readonly number[])[];
  }>>> | null;
  readonly choiceControls: readonly Readonly<{
    slot: string;
    sourceInstanceName: string;
    sourceObjectId: number;
    geometrySha256: string;
    polygon: readonly (readonly number[])[];
  }>[];
}

export function resolveAlgL11ASourceVectorFrame(
  bundle: AlgL11ASourceVectorBundle,
  frame: number,
) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > bundle.frameCount ||
    bundle.frameBodyIndices.length !== bundle.frameCount) {
    throw new Error(`${bundle.animationId}: source vector frame is invalid`);
  }
  const index = bundle.frameBodyIndices[frame - 1];
  const body = bundle.frameBodies[index];
  if (typeof body !== "string" || body.length === 0) {
    throw new Error(`${bundle.animationId}: source vector frame is missing`);
  }
  return {frame, body};
}

/** Source vectors are compiler-validated local inputs. This visual layer alone
 * does not implement the independent child playheads or authorize calibration. */
export function AlgL11ASourceVectorStage({bundle, frame, helpOpen = false,
  paused = false, choicesEnabled = false, onChoice, choiceLabels,
  helpEnabled = false, onHelpChange, description}: {
  readonly bundle: AlgL11ASourceVectorBundle;
  readonly frame: number;
  readonly helpOpen?: boolean;
  readonly paused?: boolean;
  readonly choicesEnabled?: boolean;
  readonly onChoice?: (slot: string, input: 'mouse' | 'Enter' | ' ') => void;
  readonly choiceLabels?: Readonly<Record<string, string>>;
  readonly helpEnabled?: boolean;
  readonly onHelpChange?: (open: boolean, input: 'mouse' | 'Enter' | ' ') => void;
  readonly description?: string;
}) {
  const state = resolveAlgL11ASourceVectorFrame(bundle, frame);
  if (helpOpen && !bundle.helpBody) {
    throw new Error(`${bundle.animationId}: source help is not present`);
  }
  const enabled = choicesEnabled && !paused && !helpOpen && Boolean(onChoice);
  return <div data-source-vector-animation-id={bundle.animationId}
    data-source-vector-frame={state.frame}
    data-source-swf-sha256={bundle.source.sha256}
    data-instructional-layer="source-vectors"
    data-product-calibration-passed="false"
    style={{aspectRatio: "4 / 3", position: "relative", width: "100%"}}>
    <style>{`[data-instructional-layer="source-vectors"] polygon[role=button]:focus-visible{stroke:#154c96;stroke-width:2;outline:none}`}</style>
    <svg aria-label={description ?? `Source lesson artwork, frame ${state.frame}`}
      role="img" viewBox="0 0 800 600"
      style={{display: "block", height: "100%", pointerEvents: "none",
        width: "100%"}}>
      <defs dangerouslySetInnerHTML={{__html: bundle.definitions.join("")}}/>
      <g dangerouslySetInnerHTML={{__html: bundle.rootBody + state.body +
        (helpOpen ? bundle.helpBody : "")}}/>
      {bundle.animationId === 'shared-alg001-l11-p008' && state.frame === 68 ?
        <line data-maintained-diagram-clarification="open-interval-negative3-positive3"
          aria-label="The interval between −3 and 3, excluding both endpoints"
          stroke="#000" strokeLinecap="butt" strokeWidth="1.5"
          x1="436.10" x2="553.00" y1="282.95" y2="282.95"/> : null}
    </svg>
    <svg aria-label="Source-positioned answer controls" viewBox="0 0 800 600"
      style={{height: "100%", inset: 0, pointerEvents: "none",
        position: "absolute", width: "100%"}}>
      {bundle.choiceControls.map((choice) => <polygon
        aria-disabled={!enabled} aria-label={choiceLabels?.[choice.slot] ?? `Answer ${choice.slot}`}
        data-choice-slot={choice.slot}
        data-source-geometry-sha256={choice.geometrySha256}
        data-source-instance-name={choice.sourceInstanceName}
        data-source-object-id={choice.sourceObjectId}
        fill="transparent" key={choice.slot}
        onClick={() => { if (enabled) onChoice?.(choice.slot, 'mouse'); }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (enabled && !event.repeat) onChoice?.(choice.slot,
              event.key === 'Enter' ? 'Enter' : ' ');
          }
        }}
        points={choice.polygon.map((point) => point.join(",")).join(" ")}
        role="button" style={{cursor: enabled ? "pointer" : "default",
          pointerEvents: enabled ? "all" : "none"}}
        tabIndex={enabled ? 0 : -1}/>) }
      {bundle.helpControls && (helpEnabled || helpOpen) ? (() => {
        const action = helpOpen ? 'close' : 'open';
        const hit = bundle.helpControls[action];
        const active = !paused && Boolean(onHelpChange);
        const activate = (input: 'mouse' | 'Enter' | ' ') => {
          if (active) onHelpChange?.(!helpOpen, input);
        };
        return <polygon aria-disabled={!active}
          aria-label={helpOpen ? 'Close help' : 'Need more help'}
          data-source-instance-name={hit.sourceInstanceName}
          data-source-object-id={hit.sourceObjectId} fill="transparent"
          onClick={() => activate('mouse')} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (!event.repeat) activate(event.key === 'Enter' ? 'Enter' : ' ');
            }
          }} points={hit.polygon.map((point) => point.join(',')).join(' ')}
          role="button" style={{cursor: active ? 'pointer' : 'default',
            pointerEvents: active ? 'all' : 'none'}} tabIndex={active ? 0 : -1}/>;
      })() : null}
    </svg>
  </div>;
}
