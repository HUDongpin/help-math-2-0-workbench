"use client";

import React, {useEffect, useReducer, useRef, useState} from "react";
import type {FormEvent} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_GS_002_CURRENT_JS_TIMING,
  COURSE_G04_L03_GS_002_HELP,
  COURSE_G04_L03_GS_002_SHIP_Y,
  COURSE_G04_L03_GS_002_VIRUS_Y,
  createCourseG04L03Gs002InteractionState,
  formatCourseG04L03Gs002Position,
  reduceCourseG04L03Gs002Interaction,
} from "../timelines/course-g04-l03-gs-002-interaction";
import {
  COURSE_G04_L03_GS_002_CONFIG,
  COURSE_G04_L03_GS_002_INTERACTION_BASE_CONFIG,
  COURSE_G04_L03_GS_002_SOURCE,
} from "../timelines/course-g04-l03-gs-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_GS_002_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;
const interactionBaseCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_GS_002_INTERACTION_BASE_CONFIG,
);
const InteractionBaseRenderer = interactionBaseCandidate.Renderer;

const SOURCE_GAME_FRAME = 427;
const SOURCE_GAME_DOMAIN = "sprite-321";
const SOURCE_GAME_SCENARIO = "source-static-frame";
const STAGE_BASE_X = 412.4;
const STAGE_BASE_Y = 283.3;
const SOURCE_SHIP_LEFT = STAGE_BASE_X - 298.2;
const SOURCE_VIRUS_LEFT = STAGE_BASE_X - 67.2;
const SOURCE_VIRUS_IMAGE_ALPHA_OFFSET_X = 129;
const CLOCK_DISPATCH_INTERVAL_MS = 100;
const MAX_CLOCK_DELTA_MS = 250;
const SOURCE_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';

// FFDec 26.2.1 transparent sprite exports, retained inline so the immutable
// hash-bound Canvas asset does not need to be edited. These are visual support
// for the current-JS interaction only, not an original-runtime capture.
const SOURCE_SHIP_PNG_SHA256 =
  "06c707e65cfd9a9c8fd7b13cd1570c12ed9e2185f4c20fbb8e2c532ee00abeaa";
const SOURCE_VIRUS_PNG_SHA256 =
  "4e3f9ed24e5c1b637ef9a56089a58d9c2bdef55d71588825e80fd0efcb8404fe";
const SOURCE_SHIP_PNG =
  "data:image/png;base64,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";
const SOURCE_VIRUS_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKEAAAAfCAYAAACPka2zAAAElElEQVR4Xu3aaUxUVxQA4PNYh70wzMAMwyzMUNBGiFXELoLQFhhkNUQUZdBQ9k12y1JFxUitGlsMEklba9pg1ZRaSCopP5pYFbWm1apgKaXWUitg3FBU4PS+AdrJpLRUIOmP8yUn9+W9d+6vk/vu8gAIIYQQQgghhJD/KVu1o6WWtaYsxCwsjZ4TMmscWUhfkAt074aLrut87d/ZEiz8Ou45m1LjFwmZDdapCx0at7wi/L4uUjw4WKHB/g0eeK1QhWl+Du/xz40TCJlpZul+Dh+1p8rxQaUGR6s8/4xv0uSPVvnYbbM2h/nGSUYELDzHQ8pCAlS8ZIqcg1U2iekh87r2Fa/G9hxvHHpTg21Z8/DzjAXYk6/C/VHiJ5n+DkfZu+bGyeMsXAF00QAnEjiuN5rjrgRwXIsdQDKMzS0JmVyIxjpjZ5ho9P3dm7Gvrw8/KdRie6YGP208iM1NR/FkugfeKVNjY7ykRygwC54jtohhaWaGfbwKkFIE8IU/wLplHHduAcB2dlvJgjN8j5DJCP3drPZqla4PW1uahw8VaLFp/VKM9322ryRp5b3W3EX6z/JtVoi7wpx73goVdbEcuWEHSQD1KQA72KWZFYA/3xo+J+RfqYXm2YtMuaE1AS/2Hi4Ixcb8cFxianIvRiPrnyhCPk4ky0ZeUlhmsxQLw3w/gG3p7FMMNAckT2v5HNuKhggRNid5DLfnzMXmjPlYHSTFiiAFns/+a5Fy6w01slV0PUsxMcwPB0hk399OdulmeJ+QKdPpdJWVKwIvHIhx+el0qvuTS9kK7MhV4LeZcmxbK7t9IMqlu22t28DjjRqsixCfg7FN7AlOcQCtrAjbYWyvkZD/ztfXN9FPJNqjEwge7q2tfZDrrfoxWyPrrqvdM5jt6tq/ieMwT2T5S3e+Eo8nud1kKd7jqSK2CPmATQaHSgCaYfLVMyH/yIqNhB8GmJoeKWfFto4VXQ1r+euswMCuatZuZVFoazZwOUfB5oXuj1hOJpsHvs1GwO5KAPwSYJQtmfOMOyZkSuwswWvDmtCvCiIjLvMjXq5W21lqYjK6mV2nyGS/b+fbxYu7M9V2V2+UeOCp191Hylnh7WfxGYtfWZSNjYIi474JmRJ3e3O/rcHCi0fiJXer/B07qlNir+T5qDvSXFwGdtbU3EgTmN4pj11yoSFGcuvnAhW2rJL81soK7wyLUwD3UwDqgBYkZJq4ZZ42RT/kKXFkkyfeLPXAzlwlnk2T6+NilgL5EfDYail2rVdiw2vOnd+xAmwAuLRUv0WoP64jZFrUB5e7XOUL0PDMeCL4wuN/ZGiIdtEX6Ma5dmd0YyciKuOOCHka/Oay9myqfHT4b4rwepEKmxKkeGiFBOujxHx7TfaMWSAY7RMSMh0+O0Kde44lSO8f17nh4XgJ3i1X6wuQ3xPsLfbAj+NcsS5S/Lgs0OnkywqrWKDzYDLD+OM3L/4nhqpg4fl9rNj4jWp+fng61R13h4l6k5+33+XlLAhi7zkZJxMy08TW5rAwRG27MsrbJilcY5Mf4WVTDPTpJYQQQgghhBBCZtEfxtG8IRIQiJUAAAAASUVORK5CYII=";

const visuallyHiddenStyle = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

const transparentSourceButtonStyle = {
  background: "transparent",
  border: 0,
  color: "transparent",
  cursor: "pointer",
  fontSize: 1,
  margin: 0,
  outlineOffset: 3,
  padding: 0,
  pointerEvents: "auto",
  position: "absolute",
} as const;

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function sourceShipTop(index: number) {
  const y = COURSE_G04_L03_GS_002_SHIP_Y[index];
  return y === undefined ? null : STAGE_BASE_Y + y;
}

function sourceVirusTop(index: number) {
  const y = COURSE_G04_L03_GS_002_VIRUS_Y[index];
  return y === undefined ? null : STAGE_BASE_Y + y;
}

function PageInteractionCompanionPortal({
  children,
  targetId,
}: {
  children: React.ReactNode;
  targetId?: string;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [resolvedTargetId, setResolvedTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) {
      setTarget(null);
      setResolvedTargetId(null);
      return;
    }
    setTarget(document.getElementById(targetId));
    setResolvedTargetId(targetId);
  }, [targetId]);

  if (!targetId) return children;
  if (resolvedTargetId !== targetId) return null;
  return target ? createPortal(children, target) : children;
}

function CourseG04L03Gs002InteractionOverlay({
  pageInteractionCompanionTargetId,
  paused = false,
  reducedMotion = false,
  replay = 0,
  seed,
}: Pick<
  AnimationRendererProps,
  | "pageInteractionCompanionTargetId"
  | "paused"
  | "reducedMotion"
  | "replay"
  | "seed"
>) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Gs002Interaction,
    seed,
    createCourseG04L03Gs002InteractionState,
  );
  const distanceInputRef = useRef<HTMLInputElement>(null);
  const mobileDistanceInputRef = useRef<HTMLInputElement>(null);
  const plusInputRef = useRef<HTMLInputElement>(null);
  const mobilePlusInputRef = useRef<HTMLInputElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const mobileHelpButtonRef = useRef<HTMLButtonElement>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);
  const mobileModalCloseRef = useRef<HTMLButtonElement>(null);
  const terminalNewGameRef = useRef<HTMLButtonElement>(null);
  const mobileTerminalNewGameRef = useRef<HTMLButtonElement>(null);
  const priorModeRef = useRef(interaction.mode);

  useEffect(() => {
    dispatch({type: "replay", seed});
  }, [replay, seed]);

  useEffect(() => {
    if (
      paused
      || interaction.mode === "expired"
      || interaction.mode === "help"
      || interaction.mode === "feedback"
    ) return;
    let animationFrame = 0;
    let lastTime = performance.now();
    let pendingElapsedMs = 0;

    const resetClockOrigin = () => {
      lastTime = performance.now();
      pendingElapsedMs = 0;
    };

    const tick = (now: number) => {
      if (document.visibilityState === "hidden") {
        lastTime = now;
        pendingElapsedMs = 0;
        animationFrame = requestAnimationFrame(tick);
        return;
      }
      pendingElapsedMs += Math.min(
        MAX_CLOCK_DELTA_MS,
        Math.max(0, now - lastTime),
      );
      lastTime = now;
      if (pendingElapsedMs >= CLOCK_DISPATCH_INTERVAL_MS) {
        dispatch({type: "advance-time", elapsedMs: pendingElapsedMs});
        pendingElapsedMs = 0;
      }
      animationFrame = requestAnimationFrame(tick);
    };

    document.addEventListener("visibilitychange", resetClockOrigin);
    animationFrame = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener("visibilitychange", resetClockOrigin);
      cancelAnimationFrame(animationFrame);
    };
  }, [interaction.mode, paused]);

  useEffect(() => {
    if (!reducedMotion || paused) return;
    if (interaction.mode === "moving") {
      dispatch({type: "movement-step"});
    } else if (interaction.mode === "hit-resolving") {
      dispatch({type: "resolve-hit"});
    }
  }, [interaction.mode, interaction.remainingMoveCount, paused, reducedMotion]);

  useEffect(() => {
    const priorMode = priorModeRef.current;
    priorModeRef.current = interaction.mode;
    const focusVisible = <T extends HTMLElement,>(...elements: Array<T | null>) =>
      elements.find((element) => element && element.getClientRects().length > 0)
        ?.focus();
    if (interaction.mode === "feedback" || interaction.mode === "help") {
      focusVisible(modalCloseRef.current, mobileModalCloseRef.current);
    } else if (interaction.mode === "expired") {
      focusVisible(
        terminalNewGameRef.current,
        mobileTerminalNewGameRef.current,
      );
    } else if (interaction.mode === "ready" && priorMode === "feedback") {
      if (interaction.sign) {
        focusVisible(distanceInputRef.current, mobileDistanceInputRef.current);
      } else {
        focusVisible(plusInputRef.current, mobilePlusInputRef.current);
      }
    } else if (interaction.mode === "ready" && priorMode === "help") {
      focusVisible(helpButtonRef.current, mobileHelpButtonRef.current);
    }
  }, [interaction.mode, interaction.sign]);

  const shipTop = sourceShipTop(interaction.shipIndex);
  const virusTop = sourceVirusTop(interaction.virusIndex);
  const ready = interaction.mode === "ready";
  const modalOpen =
    interaction.mode === "feedback" || interaction.mode === "help";
  const submitMove = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({type: "submit-move"});
  };
  const resetGame = () => dispatch({type: "new-game"});
  const liveStatus = interaction.mode === "moving"
    ? `Ship moving. Current position ${formatCourseG04L03Gs002Position(
        interaction.shipIndex,
      )}.`
    : interaction.mode === "hit-resolving"
      ? `Target reached. Score ${interaction.score}.`
      : interaction.mode === "expired"
        ? `Time is up. Final score ${interaction.score}.`
        : `Ship at ${formatCourseG04L03Gs002Position(
            interaction.shipIndex,
          )}; target at ${formatCourseG04L03Gs002Position(
            interaction.virusIndex,
          )}; score ${interaction.score}.`;

  return (
    <>
      <style>{`
        @keyframes course-g04-l03-gs-002-hit-feedback {
          0% {filter: brightness(1); transform: scale(1) rotate(0deg);}
          32% {filter: brightness(1.35); transform: scale(1.2) rotate(-7deg);}
          68% {filter: brightness(1.1); transform: scale(.88) rotate(7deg);}
          100% {filter: brightness(1); transform: scale(1) rotate(0deg);}
        }

        @keyframes course-g04-l03-gs-002-score-feedback {
          0% {opacity: 0; transform: translateY(8px) scale(.8);}
          24%, 70% {opacity: 1; transform: translateY(0) scale(1);}
          100% {opacity: 0; transform: translateY(-8px) scale(.94);}
        }

        .course-g04-l03-gs-002-mobile-controls {
          display: none;
        }

        @media (max-width: 640px) {
          .course-g04-l03-gs-002-stage-control {
            display: none !important;
          }

          .course-g04-l03-gs-002-mobile-controls {
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: ${SOURCE_FONT};
            gap: 12px;
            margin: 12px 0 0;
            padding: 14px;
            position: relative;
            width: 100%;
            z-index: 4;
          }

          .course-g04-l03-gs-002-mobile-controls fieldset {
            border: 0;
            display: grid;
            gap: 8px;
            grid-template-columns: 1fr 1fr;
            margin: 0;
            padding: 0;
          }

          .course-g04-l03-gs-002-mobile-controls legend,
          .course-g04-l03-gs-002-mobile-distance > span {
            display: block;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 6px;
          }

          .course-g04-l03-gs-002-mobile-choice {
            align-items: center;
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 10px;
            box-sizing: border-box;
            display: flex;
            font-size: 17px;
            gap: 8px;
            min-height: 48px;
            padding: 8px 12px;
          }

          .course-g04-l03-gs-002-mobile-choice input {
            height: 24px;
            margin: 0;
            width: 24px;
          }

          .course-g04-l03-gs-002-mobile-distance input {
            border: 2px solid #224b8e;
            border-radius: 10px;
            box-sizing: border-box;
            font: inherit;
            font-size: 20px;
            min-height: 48px;
            padding: 8px 12px;
            width: 100%;
          }

          .course-g04-l03-gs-002-mobile-actions {
            display: grid;
            gap: 8px;
            grid-template-columns: 1fr 1fr;
          }

          .course-g04-l03-gs-002-mobile-controls button {
            background: #ffdd29;
            border: 2px solid #224b8e;
            border-radius: 999px;
            color: #111;
            font: inherit;
            font-size: 17px;
            font-weight: 700;
            min-height: 48px;
            padding: 8px 12px;
          }

          .course-g04-l03-gs-002-mobile-controls button[type="submit"] {
            grid-column: 1 / -1;
          }

          .course-g04-l03-gs-002-mobile-dialog {
            background: #ffffe0;
            border: 3px solid #224b8e;
            border-radius: 12px;
            box-shadow: 0 8px 22px rgba(0, 0, 0, 0.24);
            padding: 16px;
          }

          .course-g04-l03-gs-002-mobile-dialog strong {
            display: block;
            font-size: 20px;
            margin-bottom: 8px;
          }

          .course-g04-l03-gs-002-mobile-dialog p {
            font-family: system-ui, sans-serif;
            font-size: 17px;
            line-height: 1.4;
            margin: 6px 0;
          }
        }
      `}</style>
    <svg
      aria-label="Source-script-bound current JavaScript positive and negative number game"
      data-audio-feedback="unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-functional-candidate="true"
      data-game-mode={interaction.mode}
      data-legacy-actionscript-executed="false"
      data-source-script-bound="true"
      data-timing-authority="current-js-product-clock-and-source-informed-movement-not-original-runtime-trace"
      role="group"
      style={{
        height: "auto",
        inset: 0,
        pointerEvents: "none",
        position: "absolute",
        width: "100%",
        zIndex: 3,
      }}
      viewBox="0 0 800 600"
    >
      <foreignObject height="600" width="800" x="0" y="0">
        <form
          aria-label="Move the space ship to the target"
          onSubmit={submitMove}
          style={{
            fontFamily: SOURCE_FONT,
            height: 600,
            margin: 0,
            pointerEvents: "none",
            position: "relative",
            width: 800,
          }}
        >
          {shipTop !== null ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              aria-hidden="true"
              data-source-sprite-sha256={SOURCE_SHIP_PNG_SHA256}
              height="26"
              src={SOURCE_SHIP_PNG}
              style={{
                height: 26,
                left: SOURCE_SHIP_LEFT,
                filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35))",
                position: "absolute",
                top: shipTop,
                width: 39,
                zIndex: 2,
              }}
              width="39"
            />
          ) : null}
          {virusTop !== null ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              aria-hidden="true"
              data-source-sprite-sha256={SOURCE_VIRUS_PNG_SHA256}
              height="31"
              src={SOURCE_VIRUS_PNG}
              style={{
                animation:
                  interaction.mode === "hit-resolving" && !reducedMotion
                    ? `${COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.hitResolutionMs}ms ease-in-out both course-g04-l03-gs-002-hit-feedback`
                    : undefined,
                height: 31,
                left: SOURCE_VIRUS_LEFT - SOURCE_VIRUS_IMAGE_ALPHA_OFFSET_X,
                opacity: 1,
                position: "absolute",
                top: virusTop,
                transformOrigin: "10px 15px",
                width: 161,
                zIndex: 2,
              }}
              width="161"
            />
          ) : null}
          {interaction.mode === "hit-resolving" && virusTop !== null ? (
            <output
              aria-hidden="true"
              data-current-js-hit-feedback="visible"
              style={{
                animation: reducedMotion
                  ? undefined
                  : `${COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.hitResolutionMs}ms ease-out both course-g04-l03-gs-002-score-feedback`,
                background: "#ffdd29",
                border: "2px solid #173f86",
                borderRadius: 999,
                color: "#102b70",
                fontFamily: SOURCE_FONT,
                fontSize: 17,
                fontWeight: 900,
                left: SOURCE_VIRUS_LEFT - 8,
                padding: "3px 8px",
                position: "absolute",
                top: virusTop - 29,
                zIndex: 4,
              }}
            >+1</output>
          ) : null}

          <fieldset
            aria-label="Choose a positive or negative number"
            className="course-g04-l03-gs-002-stage-control"
            disabled={!ready}
            style={{
              border: 0,
              height: 64,
              left: 476,
              margin: 0,
              padding: 0,
              pointerEvents: "auto",
              position: "absolute",
              top: 128,
              width: 130,
            }}
          >
            <legend style={visuallyHiddenStyle}>Direction</legend>
            {(["+", "-"] as const).map((sign, index) => (
              <label
                key={sign}
                style={{
                  cursor: ready ? "pointer" : "default",
                  height: 60,
                  left: index * 67,
                  pointerEvents: "auto",
                  position: "absolute",
                  top: 0,
                  width: 60,
                }}
              >
                <span style={visuallyHiddenStyle}>
                  {sign === "+" ? "Positive" : "Negative"}
                </span>
                <input
                  aria-label={sign === "+" ? "Positive" : "Negative"}
                  checked={interaction.sign === sign}
                  name="course-g04-l03-gs-002-sign"
                  onChange={() => dispatch({type: "set-sign", sign})}
                  ref={sign === "+" ? plusInputRef : undefined}
                  style={{
                    cursor: ready ? "pointer" : "default",
                    height: 60,
                    inset: 0,
                    margin: 0,
                    opacity: 0.001,
                    position: "absolute",
                    width: 60,
                  }}
                  type="radio"
                />
                <span
                  aria-hidden="true"
                  style={{
                    border: interaction.sign === sign
                      ? "4px solid #082d86"
                      : "4px solid transparent",
                    borderRadius: "50%",
                    boxSizing: "border-box",
                    inset: 7,
                    pointerEvents: "none",
                    position: "absolute",
                  }}
                />
              </label>
            ))}
          </fieldset>

          <output
            aria-hidden="true"
            style={{
              alignItems: "center",
              color: "#111",
              display: "flex",
              fontFamily: SOURCE_FONT,
              fontSize: 31,
              height: 43,
              justifyContent: "center",
              left: 468,
              lineHeight: 1,
              position: "absolute",
              top: 218,
              width: 70,
            }}
          >{interaction.sign ?? ""}</output>

          <label
            className="course-g04-l03-gs-002-stage-control"
            style={{
              height: 60,
              left: 536,
              pointerEvents: "auto",
              position: "absolute",
              top: 209,
              width: 78,
            }}
          >
            <span style={visuallyHiddenStyle}>Number of spaces</span>
            <input
              aria-describedby="course-g04-l03-gs-002-live-status"
              aria-label="Number of spaces"
              autoComplete="off"
              disabled={!ready}
              inputMode="numeric"
              maxLength={2}
              onChange={(event) => dispatch({
                type: "set-distance",
                value: event.currentTarget.value,
              })}
              pattern="[0-9]{0,2}"
              ref={distanceInputRef}
              spellCheck={false}
              style={{
                background: "#fff",
                border: "1px solid #111",
                boxSizing: "border-box",
                color: "#111",
                fontFamily: SOURCE_FONT,
                fontSize: 28,
                height: 43,
                left: 9,
                margin: 0,
                outlineOffset: 2,
                padding: "0 2px",
                pointerEvents: "auto",
                position: "absolute",
                textAlign: "center",
                top: 9,
                width: 59,
              }}
              type="text"
              value={interaction.distanceInput}
            />
          </label>

          <button
            aria-label="Go"
            className="course-g04-l03-gs-002-stage-control"
            disabled={!ready}
            style={{
              ...transparentSourceButtonStyle,
              height: 60,
              left: 627,
              top: 169,
              width: 98,
            }}
            type="submit"
          >Go</button>
          <button
            aria-label="New Game"
            className="course-g04-l03-gs-002-stage-control"
            disabled={!ready}
            onClick={resetGame}
            style={{
              ...transparentSourceButtonStyle,
              height: 60,
              left: 506,
              top: 298,
              width: 154,
            }}
            type="button"
          >New Game</button>
          <button
            aria-label="Need More Help"
            className="course-g04-l03-gs-002-stage-control"
            disabled={!ready}
            onClick={() => dispatch({type: "open-help"})}
            ref={helpButtonRef}
            style={{
              ...transparentSourceButtonStyle,
              height: 60,
              left: 486,
              top: 349,
              width: 194,
            }}
            type="button"
          >Need More Help</button>

          <output
            aria-label="Time remaining"
            style={{
              alignItems: "center",
              background: "#252525",
              color: "#00ff00",
              display: "flex",
              fontFamily: "Arial, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              height: 18,
              justifyContent: "center",
              left: 466,
              lineHeight: 1,
              position: "absolute",
              top: 435,
              width: 99,
            }}
          >{interaction.timerDisplay}</output>
          <output
            aria-label={`Score ${interaction.score}`}
            aria-live="polite"
            style={{
              alignItems: "center",
              background: "#333",
              color: "#fff",
              display: "flex",
              fontFamily: SOURCE_FONT,
              fontSize: 20,
              fontWeight: 700,
              height: 27,
              justifyContent: "center",
              left: 658,
              position: "absolute",
              top: 418,
              width: 50,
            }}
          >{interaction.score}</output>

          <span
            aria-live="polite"
            id="course-g04-l03-gs-002-live-status"
            role="status"
            style={visuallyHiddenStyle}
          >{liveStatus}</span>

          {modalOpen ? (
            <div
              aria-describedby="course-g04-l03-gs-002-dialog-detail"
              aria-labelledby="course-g04-l03-gs-002-dialog-title"
              aria-modal="true"
              className="course-g04-l03-gs-002-stage-control"
              role="dialog"
              style={{
                background: "#ffffcc",
                border: "4px solid #224b8e",
                borderRadius: 12,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.38)",
                boxSizing: "border-box",
                color: "#111",
                left: 185,
                minHeight: 170,
                padding: "24px 28px 22px",
                pointerEvents: "auto",
                position: "absolute",
                top: 184,
                width: 430,
                zIndex: 5,
              }}
            >
              <strong
                id="course-g04-l03-gs-002-dialog-title"
                style={{display: "block", fontSize: 24, marginBottom: 12}}
              >{interaction.mode === "help" ? "Need More Help" : "Try again"}</strong>
              <div
                id="course-g04-l03-gs-002-dialog-detail"
                style={{fontSize: 20, lineHeight: 1.3}}
              >
                {interaction.mode === "help"
                  ? COURSE_G04_L03_GS_002_HELP.map((line) => (
                      <p key={line} style={{margin: "7px 0"}}>{line}</p>
                    ))
                  : <p style={{margin: "7px 0"}}>{interaction.feedbackText}</p>}
              </div>
              <button
                onClick={() => dispatch({
                  type: interaction.mode === "help"
                    ? "close-help"
                    : "close-feedback",
                })}
                ref={modalCloseRef}
                style={{
                  background: "#fff",
                  border: "2px solid #224b8e",
                  borderRadius: 8,
                  color: "#111",
                  cursor: "pointer",
                  float: "right",
                  fontFamily: SOURCE_FONT,
                  fontSize: 18,
                  marginTop: 10,
                  minHeight: 44,
                  padding: "6px 22px",
                }}
                type="button"
              >Close</button>
            </div>
          ) : null}

          {interaction.mode === "expired" ? (
            <div
              aria-describedby="course-g04-l03-gs-002-expired-detail"
              aria-labelledby="course-g04-l03-gs-002-expired-title"
              aria-modal="true"
              className="course-g04-l03-gs-002-stage-control"
              role="dialog"
              style={{
                background: "#def4ff",
                border: "4px solid #224b8e",
                borderRadius: 12,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.38)",
                boxSizing: "border-box",
                color: "#111",
                left: 225,
                padding: "26px 30px",
                pointerEvents: "auto",
                position: "absolute",
                textAlign: "center",
                top: 190,
                width: 350,
                zIndex: 5,
              }}
            >
              <strong
                id="course-g04-l03-gs-002-expired-title"
                style={{display: "block", fontSize: 28, marginBottom: 12}}
              >Time&apos;s up</strong>
              <p
                id="course-g04-l03-gs-002-expired-detail"
                style={{fontSize: 22, margin: "0 0 20px"}}
              >Final score: {interaction.score}</p>
              <button
                onClick={resetGame}
                ref={terminalNewGameRef}
                style={{
                  background: "#ffdd29",
                  border: "2px solid #224b8e",
                  borderRadius: 999,
                  color: "#111",
                  cursor: "pointer",
                  fontFamily: SOURCE_FONT,
                  fontSize: 20,
                  minHeight: 48,
                  padding: "8px 26px",
                }}
                type="button"
              >New Game</button>
            </div>
          ) : null}
        </form>
      </foreignObject>
    </svg>
    <PageInteractionCompanionPortal
      targetId={pageInteractionCompanionTargetId}
    >
      <form
        aria-label="Mobile controls for moving the space ship to the target"
        className="course-g04-l03-gs-002-mobile-controls"
        data-game-mode={interaction.mode}
        data-page-interaction-companion-surface="gs002-mobile"
        onSubmit={submitMove}
      >
      <fieldset disabled={!ready}>
        <legend>Direction</legend>
        {(["+", "-"] as const).map((sign) => (
          <label
            className="course-g04-l03-gs-002-mobile-choice"
            key={sign}
          >
            <input
              aria-label={sign === "+" ? "Positive" : "Negative"}
              checked={interaction.sign === sign}
              name="course-g04-l03-gs-002-mobile-sign"
              onChange={() => dispatch({type: "set-sign", sign})}
              ref={sign === "+" ? mobilePlusInputRef : undefined}
              type="radio"
            />
            <span>{sign === "+" ? "Positive (+)" : "Negative (−)"}</span>
          </label>
        ))}
      </fieldset>
      <label className="course-g04-l03-gs-002-mobile-distance">
        <span>Number of spaces</span>
        <input
          aria-describedby="course-g04-l03-gs-002-mobile-live-status"
          aria-label="Number of spaces"
          autoComplete="off"
          disabled={!ready}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) => dispatch({
            type: "set-distance",
            value: event.currentTarget.value,
          })}
          pattern="[0-9]{0,2}"
          ref={mobileDistanceInputRef}
          spellCheck={false}
          type="text"
          value={interaction.distanceInput}
        />
      </label>
      <div className="course-g04-l03-gs-002-mobile-actions">
        <button disabled={!ready} type="submit">Go</button>
        <button disabled={!ready} onClick={resetGame} type="button">
          New Game
        </button>
        <button
          disabled={!ready}
          onClick={() => dispatch({type: "open-help"})}
          ref={mobileHelpButtonRef}
          type="button"
        >Need More Help</button>
      </div>
      <p
        aria-live="polite"
        id="course-g04-l03-gs-002-mobile-live-status"
        style={{fontFamily: "system-ui, sans-serif", margin: 0}}
      >{liveStatus}</p>
      {modalOpen ? (
        <div
          aria-describedby="course-g04-l03-gs-002-mobile-dialog-detail"
          aria-labelledby="course-g04-l03-gs-002-mobile-dialog-title"
          aria-modal="true"
          className="course-g04-l03-gs-002-mobile-dialog"
          role="dialog"
        >
          <strong id="course-g04-l03-gs-002-mobile-dialog-title">
            {interaction.mode === "help" ? "Need More Help" : "Try again"}
          </strong>
          <div id="course-g04-l03-gs-002-mobile-dialog-detail">
            {interaction.mode === "help"
              ? COURSE_G04_L03_GS_002_HELP.map((line) => (
                  <p key={line}>{line}</p>
                ))
              : <p>{interaction.feedbackText}</p>}
          </div>
          <button
            onClick={() => dispatch({
              type: interaction.mode === "help"
                ? "close-help"
                : "close-feedback",
            })}
            ref={mobileModalCloseRef}
            type="button"
          >Close</button>
        </div>
      ) : null}
      {interaction.mode === "expired" ? (
        <div
          aria-describedby="course-g04-l03-gs-002-mobile-expired-detail"
          aria-labelledby="course-g04-l03-gs-002-mobile-expired-title"
          aria-modal="true"
          className="course-g04-l03-gs-002-mobile-dialog"
          role="dialog"
        >
          <strong id="course-g04-l03-gs-002-mobile-expired-title">
            Time&apos;s up
          </strong>
          <p id="course-g04-l03-gs-002-mobile-expired-detail">
            Final score: {interaction.score}
          </p>
          <button
            onClick={resetGame}
            ref={mobileTerminalNewGameRef}
            type="button"
          >New Game</button>
        </div>
      ) : null}
      </form>
    </PageInteractionCompanionPortal>
    </>
  );
}

export function CourseG04L03Gs002Renderer(props: AnimationRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const frameDomain = props.frameDomain ?? SOURCE_GAME_DOMAIN;
  const interactionEnabled =
    props.frame === SOURCE_GAME_FRAME
    && frameDomain === SOURCE_GAME_DOMAIN
    && props.scenario === SOURCE_GAME_SCENARIO
    && props.lang === "en"
    && !isDeterministicEvidenceCapture(props);

  useEffect(() => {
    const canvas = wrapperRef.current?.querySelector<HTMLCanvasElement>(
      'canvas[data-course-canvas="course-g04-l03-gs-002-interaction-base"]',
    );
    if (!canvas || !interactionEnabled) return;
    canvas.setAttribute("aria-hidden", "true");
    return () => {
      canvas.removeAttribute("aria-hidden");
    };
  }, [interactionEnabled]);

  return (
    <div
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-scope="gs002-positive-negative-number-game-source-script-bound"
      data-owner-accepted="false"
      data-strict-acceptance-effect="none"
      ref={wrapperRef}
      style={{margin: "0 auto", maxWidth: 800, position: "relative", width: "100%"}}
    >
      {interactionEnabled
        ? <InteractionBaseRenderer {...props} />
        : <SourceStaticRenderer {...props} />}
      {interactionEnabled ? (
        <CourseG04L03Gs002InteractionOverlay
          pageInteractionCompanionTargetId={
            props.pageInteractionCompanionTargetId
          }
          paused={props.paused}
          reducedMotion={props.reducedMotion}
          replay={props.replay}
          seed={props.seed}
        />
      ) : null}
    </div>
  );
}

export {COURSE_G04_L03_GS_002_SOURCE};
export const COURSE_G04_L03_GS_002_MOVIE = candidate.movie;
export const COURSE_G04_L03_GS_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_GS_002_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-candidate",
  currentJavascriptInteractionScope: Object.freeze([
    "positive-negative-direction-choice",
    "two-digit-source-restricted-input",
    "exact-source-validation-feedback",
    "nominal-source-frame-deduced-step-movement",
    "hit-scoring-and-deterministic-next-target",
    "current-javascript-standard-four-minute-timer-and-expiry",
    "current-javascript-crisp-single-actor-layer",
    "source-sprite321-case426-clean-base-without-pixel-interpolation",
    "current-javascript-visible-hit-and-score-feedback",
    "need-more-help-text-dialog",
    "whole-renderer-new-game-and-host-replay-reset",
    "host-pause-freezes-current-javascript-clock",
    "responsive-mobile-touch-control-surface",
  ]),
  currentJavascriptTiming: COURSE_G04_L03_GS_002_CURRENT_JS_TIMING,
  sourceSpriteExports: Object.freeze({
    shipPngSha256: SOURCE_SHIP_PNG_SHA256,
    virusPngSha256: SOURCE_VIRUS_PNG_SHA256,
  }),
  interactionBaseSuccessor: Object.freeze({
    animationId: COURSE_G04_L03_GS_002_INTERACTION_BASE_CONFIG.animationId,
    assetSource: COURSE_G04_L03_GS_002_INTERACTION_BASE_CONFIG.assetSource,
    assetSha256: COURSE_G04_L03_GS_002_INTERACTION_BASE_CONFIG.assetSha256,
    manifestSource:
      "public/flash-assets/courses/course-g04-l03-gs-002/interaction-base-manifest.json",
    manifestSha256:
      "c248508d8e8fc42fc533f90ff2746849c8456b377d2786cedc99a3742e688b7e",
    publicFrame: 427,
    sourceSpriteObjectId: 321,
    sourceSpriteExportFrame: 426,
    sourceLocalGameInitialStateDrawn: false,
    reactOwnsActorsTimerAndScore: true,
    preservedRendererAssetSha256:
      "1c806e2fdeb026edb5b0109ab24bac3689918894b3d7e38fe17503dfbbc1bfb1",
    acceptanceEffect: "none",
  }),
  associatedAudioStatus: "inventoried-unimplemented-unaccepted",
  glossaryHostStatus: "source-bound-unimplemented",
  spanishInteractionStatus: "unimplemented-disabled",
  terminalFrameReachabilityEstablished: false,
  behaviorParityEstablished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_GS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Gs002Frame = candidate.normalizeFrame;
export const getCourseG04L03Gs002FrameState = candidate.getFrameState;
export const buildCourseG04L03Gs002CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  reducedMotionFrame: SOURCE_GAME_FRAME,
  Renderer: CourseG04L03Gs002Renderer,
});
