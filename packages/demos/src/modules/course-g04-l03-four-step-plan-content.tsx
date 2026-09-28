"use client";

import React, {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";

// Maintained learner copy from the five source pages. It does not replace the
// source drawing, its capture identity, or TS006's independent diagnostic path.
const strategies = Object.freeze([
  "Write an equation and solve it.",
  "Draw a picture.",
  "Look for a pattern.",
  "Systematically guess and check.",
  "Act it out.",
  "Make a table.",
  "Work a simpler problem.",
  "Work backwards.",
]);

export const FOUR_STEP_PLAN_CONTENT = Object.freeze({
  "course-g04-l03-ts-002": Object.freeze({
    frameDomain: "sprite-27", endFrame: 355,
    heading: "1. Restate the question.",
    lines: Object.freeze([
      "Read the problem and decide what the question is asking.",
      "Write the question in your own words.",
    ]),
    strategies: Object.freeze([] as string[]),
  }),
  "course-g04-l03-ts-003": Object.freeze({
    frameDomain: "sprite-25", endFrame: 241,
    heading: "2. Organize the information.",
    lines: Object.freeze([
      "What information do I have?",
      "What information do I need?",
    ]),
    strategies: Object.freeze([] as string[]),
  }),
  "course-g04-l03-ts-004": Object.freeze({
    frameDomain: "sprite-70", endFrame: 336,
    heading: "3. Solve the problem.",
    lines: Object.freeze(["Circle your answer."]),
    strategies,
  }),
  "course-g04-l03-ts-005": Object.freeze({
    frameDomain: "sprite-40", endFrame: 275,
    heading: "4. Check your work.",
    lines: Object.freeze(["Show your work."]),
    strategies,
  }),
  "course-g04-l03-ts-006": Object.freeze({
    frameDomain: "sprite-23", endFrame: 128,
    heading: "Four-step plan",
    lines: Object.freeze([
      "1. Restate the question.",
      "2. Organize the information.",
      "3. Solve the problem.",
      "4. Check your answer.",
    ]),
    strategies: Object.freeze([] as string[]),
  }),
});

export function FourStepPlanContent({
  animationId,
  children,
  ...props
}: AnimationRendererProps & {
  animationId: keyof typeof FOUR_STEP_PLAN_CONTENT;
  children: React.ReactNode;
}) {
  const content = FOUR_STEP_PLAN_CONTENT[animationId];
  const visualRef = useRef<HTMLDivElement>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const eligible = props.lang === "en"
    && props.scenario === "source-static-frame"
    && (props.frameDomain ?? content.frameDomain) === content.frameDomain
    && props.frame === content.endFrame
    && !props.entryStateSha256;

  useEffect(() => {
    setTarget(props.pageInteractionCompanionTargetId
      ? document.getElementById(props.pageInteractionCompanionTargetId) : null);
  }, [props.pageInteractionCompanionTargetId]);

  useEffect(() => {
    const host = visualRef.current;
    if (!host || !eligible) {
      setCanvasReady(false);
      return;
    }
    const update = () => {
      setCanvasReady(host.querySelector<HTMLElement>("[data-canvas-status]")?.dataset.canvasStatus === "ready");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(host, {attributes: true, attributeFilter: ["data-canvas-status"], childList: true, subtree: true});
    return () => observer.disconnect();
  }, [eligible, props.replay]);

  return (
    <>
      <div ref={visualRef}>{children}</div>
      {eligible && canvasReady && target ? createPortal(
        <section className="four-step-plan-summary" data-four-step-summary={animationId}
          aria-label="Read the four-step plan">
          <h2>{content.heading}</h2>
          <ul>{content.lines.map((line) => <li key={line}>{line}</li>)}</ul>
          {content.strategies.length > 0 ? <>
            <h3>Strategies to try</h3>
            <ul>{content.strategies.map((line) => <li key={line}>{line}</li>)}</ul>
          </> : null}
        </section>, target,
      ) : null}
      <style>{`
        .four-step-plan-summary {
          clip-path: inset(50%);
          height: 1px;
          overflow: hidden;
          position: absolute;
          white-space: nowrap;
          width: 1px;
        }
        @media (max-width: 640px) {
          .four-step-plan-summary {
            background: #f2f8ff;
            border: 1px solid #b9cbe3;
            border-radius: 12px;
            box-sizing: border-box;
            clip-path: none;
            color: #17395f;
            font: 16px/1.5 system-ui, sans-serif;
            height: auto;
            margin: 8px 0;
            padding: 14px 16px;
            position: relative;
            white-space: normal;
            width: 100%;
          }
          .four-step-plan-summary h2 {font-size: 19px; line-height: 1.4; margin: 0 0 8px;}
          .four-step-plan-summary h3 {font-size: 17px; margin: 14px 0 6px;}
          .four-step-plan-summary ul {margin: 0; padding-left: 22px;}
          .four-step-plan-summary li + li {margin-top: 6px;}
        }
      `}</style>
    </>
  );
}
