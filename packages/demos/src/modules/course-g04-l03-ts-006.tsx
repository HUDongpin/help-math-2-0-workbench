"use client";

import React from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
  RuntimeContext,
  RuntimeScenario,
} from "../contract";
import {
  bindTraceCaptureIdentity,
  createSourceStaticCanvasCandidate,
  isCompleteTraceCaptureIdentity,
  type SourceStaticCanvasFrameState,
  type TraceCaptureIdentity,
} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TS_006_CONFIG,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP,
  COURSE_G04_L03_TS_006_PROGRESS_THUMB_ASSET,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT,
  COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS,
  COURSE_G04_L03_TS_006_SOURCE,
  getCourseG04L03Ts006DiagnosticCompositeState,
  type CourseG04L03Ts006DiagnosticCompositeState,
} from "../timelines/course-g04-l03-ts-006";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TS_006_CONFIG,
);
const SourceStaticRenderer = sourceStaticCandidate.Renderer;

const DIAGNOSTIC_SHELL_ASSET =
  "/flash-assets/courses/shell-course-g04-l03-index-local/root-frames/frame-0049.png";
const DIAGNOSTIC_PAGE_TITLE_ASSET =
  "/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets/page-title.png";
const DIAGNOSTIC_TABLE_ASSET =
  "/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets/four-step-plan-table-source-static.png";
const DIAGNOSTIC_BAUHAUS_FONT_ASSET =
  "/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets/bauhaus-md-bt-source-subset.ttf";
const DIAGNOSTIC_SHELL_BUTTON_ASSET_BASE =
  "/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets";
const DIAGNOSTIC_TABLE_PATCH_SOURCE_FILL = "#fff5f4";

type CourseG04L03Ts006FrameState =
  | SourceStaticCanvasFrameState
  | (CourseG04L03Ts006DiagnosticCompositeState & TraceCaptureIdentity);

function isDiagnosticState(
  state: unknown,
): state is CourseG04L03Ts006DiagnosticCompositeState & TraceCaptureIdentity {
  return Boolean(
    state &&
    typeof state === "object" &&
    "calibrationStatus" in state &&
    "requirementId" in state &&
    "traceId" in state &&
    "entryStateSha256" in state &&
    state.calibrationStatus ===
      "diagnostic-piecewise-anchor-projection-not-authoritative",
  );
}

type DiagnosticShellControlAsset =
  (typeof COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS.controls)[keyof typeof COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS.controls];

function DiagnosticShellAsset({
  asset,
}: {
  readonly asset: DiagnosticShellControlAsset;
}) {
  const { height, width, x, y } = asset.layout;
  const image = (
    <image
      aria-hidden="true"
      data-shell-control-role={asset.role}
      data-source-character-id={asset.sourceCharacterId}
      focusable="false"
      height={height}
      href={`${DIAGNOSTIC_SHELL_BUTTON_ASSET_BASE}/${asset.file}`}
      width={width}
      x={0}
      y={0}
    />
  );
  return "mirrorX" in asset && asset.mirrorX ? (
    <g
      data-shell-control-mirror-x="true"
      transform={`translate(${x + width} ${y}) scale(-1 1)`}
    >
      {image}
    </g>
  ) : (
    React.cloneElement(image, { x, y })
  );
}

function DiagnosticStage({
  entryStateSha256 = "",
  frame,
  frameDomain,
  lang,
  onReplay,
  requirementId = "",
  scenario,
  seed,
  state,
  traceId = "",
}: AnimationRendererProps) {
  const deterministicState = isDiagnosticState(state)
    ? state
    : bindTraceCaptureIdentity(
        getCourseG04L03Ts006DiagnosticCompositeState(frame, {
          frameDomain,
          scenario,
          lang,
          seed,
        }),
        { entryStateSha256, requirementId, traceId },
      );
  const captureReady = Boolean(
    deterministicState.status === "ready" &&
    isCompleteTraceCaptureIdentity(deterministicState) &&
    deterministicState.frame === frame &&
    deterministicState.frameDomain === frameDomain &&
    deterministicState.requirementId === requirementId &&
    deterministicState.traceId === traceId &&
    deterministicState.entryStateSha256 === entryStateSha256 &&
    deterministicState.scenario === scenario &&
    deterministicState.language === lang &&
    deterministicState.seed === seed,
  );
  if (deterministicState.status === "blocked") {
    const identityMismatch =
      deterministicState.blocker ===
      "diagnostic-frame-domain-scenario-mismatch";
    return (
      <section
        aria-label="TS006 diagnostic-composite path unavailable"
        data-audio-rendered="false"
        data-owner-accepted="false"
        data-strict-migration-complete="false"
        style={{ margin: "0 auto", maxWidth: 800, width: "100%" }}
      >
        <div
          aria-live="polite"
          data-fail-closed-reason={deterministicState.blocker ?? undefined}
          role="status"
          style={{
            alignItems: "center",
            aspectRatio: "4 / 3",
            background: "#eaf4fb",
            color: "#17344c",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "8%",
            textAlign: "center",
          }}
        >
          <strong>
            {identityMismatch
              ? "TS006 diagnostic capture identity unavailable"
              : "Spanish diagnostic composite unavailable"}
          </strong>
          <p>
            {identityMismatch
              ? "This engineering projection renders only the declared sprite-23 diagnostic scenario."
              : "The current manual-runtime diagnostic establishes English only. The independent Spanish trace remains fail-closed."}
          </p>
        </div>
      </section>
    );
  }
  const bauhaus = "Ts006BauhausSource, sans-serif";
  const linkBlue = "#0018ff";
  const showColor =
    deterministicState.showYourWorkColor === "magenta" ? "#ff00d8" : linkBlue;
  const shellAssets = COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS.controls;
  const playbackAsset = shellAssets.pause;
  const progress = deterministicState.shellControls;
  const statusStrip = progress.statusStrip;
  const progressThumb = COURSE_G04_L03_TS_006_PROGRESS_THUMB_ASSET;
  const replayLayout = shellAssets.replay.layout;
  return (
    <section
      aria-label="TS006 English Lesson Shell diagnostic-composite engineering candidate"
      data-audio-rendered="false"
      data-authoritative-runtime-validated="false"
      data-candidate-status="manual-runtime-diagnostic-composite-not-strict"
      data-human-visual-review-accepted="false"
      data-owner-accepted="false"
      data-strict-migration-complete="false"
      style={{ margin: "0 auto", maxWidth: 800, width: "100%" }}
    >
      <style>{`
        @font-face {
          font-family: "Ts006BauhausSource";
          src: url("${DIAGNOSTIC_BAUHAUS_FONT_ASSET}") format("truetype");
          font-display: block;
          font-style: normal;
          font-weight: 400;
        }
        .ts006-shell-replay-hotspot:focus-visible {
          outline: 3px solid #ffffff;
          outline-offset: 2px;
        }
      `}</style>
      <div
        data-animation-id="course-g04-l03-ts-006"
        data-capture-identity-status={captureReady ? "verified" : "blocked"}
        data-capture-stage={captureReady ? "true" : undefined}
        data-diagnostic-capture-ordinal={
          deterministicState.mappedFirstRunCaptureOrdinal
        }
        data-diagnostic-color-calibration={
          deterministicState.colorCalibration.status
        }
        data-diagnostic-color-calibration-exponent={
          deterministicState.colorCalibration.exponent
        }
        data-diagnostic-color-calibration-scope={
          deterministicState.colorCalibration.scope
        }
        data-diagnostic-layout-source-static-path-affected={
          COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.sourceStaticPathAffected
        }
        data-diagnostic-layout-status={
          COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.status
        }
        data-flash-entry-state-sha256={
          deterministicState.entryStateSha256 || undefined
        }
        data-flash-frame={deterministicState.frame}
        data-flash-frame-domain={deterministicState.frameDomain}
        data-flash-lang={deterministicState.language}
        data-flash-requirement-id={
          deterministicState.requirementId || undefined
        }
        data-flash-root-frame={deterministicState.rootFrame}
        data-flash-scenario={deterministicState.scenario}
        data-flash-seed={deterministicState.seed}
        data-flash-trace-id={deterministicState.traceId || undefined}
        data-original-runtime-authority="diagnostic-only"
        data-render-state="ready"
        data-render-visual="true"
        data-runtime-language={deterministicState.language}
        data-runtime-scenario={deterministicState.scenario}
        data-runtime-seed={deterministicState.seed}
        data-source-frame-mapping="diagnostic-piecewise-anchor-projection-not-authoritative"
        data-shell-control-state={
          deterministicState.shellControls.playbackVisual
        }
        data-shell-progress-fill-color={progress.progressFillColor}
        data-shell-progress-fill-filter-input-color={
          progress.progressFillFilterInputColor
        }
        data-shell-progress-mapping={progress.progressMappingStatus}
        data-shell-progress-color-projection={
          progress.progressColorProjectionStatus
        }
        data-shell-progress-track-color={progress.progressTrackColor}
        data-shell-progress-track-filter-input-color={
          progress.progressTrackFilterInputColor
        }
        data-shell-progress-thumb-sha256={progressThumb.image.sha256}
        data-shell-progress-width={progress.progressWidthPixels}
        data-shell-status-strip-active-ordinal={
          statusStrip.activeOrdinal ?? "unresolved"
        }
        data-shell-status-strip-ordinal-authority={
          statusStrip.ordinalAuthorityEstablished
        }
        data-shell-status-strip-status={statusStrip.status}
        data-shell-source-actions-executed="false"
        data-shell-structural-asset-manifest-sha256={
          deterministicState.shellControls.manifestSha256
        }
        data-strict-acceptance-effect="none"
        data-typography-source-character-id="5"
        style={{
          aspectRatio: "4 / 3",
          background: "#b8d8f7",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <svg
          aria-label={`Diagnostic-composite TS006 frame ${deterministicState.frame} of 128`}
          height="600"
          role="img"
          style={{ display: "block", height: "auto", width: "100%" }}
          viewBox="0 0 800 600"
          width="800"
        >
          <defs>
            <filter
              colorInterpolationFilters={
                deterministicState.colorCalibration.colorInterpolationFilters
              }
              filterUnits="userSpaceOnUse"
              height="600"
              id="ts006-diagnostic-srgb-gamma-v12"
              width="800"
              x="0"
              y="0"
            >
              <feComponentTransfer>
                <feFuncR
                  amplitude={deterministicState.colorCalibration.amplitude}
                  exponent={deterministicState.colorCalibration.exponent}
                  offset={deterministicState.colorCalibration.offset}
                  type="gamma"
                />
                <feFuncG
                  amplitude={deterministicState.colorCalibration.amplitude}
                  exponent={deterministicState.colorCalibration.exponent}
                  offset={deterministicState.colorCalibration.offset}
                  type="gamma"
                />
                <feFuncB
                  amplitude={deterministicState.colorCalibration.amplitude}
                  exponent={deterministicState.colorCalibration.exponent}
                  offset={deterministicState.colorCalibration.offset}
                  type="gamma"
                />
              </feComponentTransfer>
            </filter>
          </defs>
          <g
            data-diagnostic-color-calibration-scope={
              deterministicState.colorCalibration.scope
            }
            filter="url(#ts006-diagnostic-srgb-gamma-v12)"
          >
            <image
              height="600"
              href={DIAGNOSTIC_SHELL_ASSET}
              width="800"
              x="0"
              y="0"
            />
            <rect fill="#b8d8f7" height="82" width="220" x="290" y="276" />

            <image
              aria-label="Negative Numbers: Practice Test"
              height={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.pageTitle.height
              }
              href={DIAGNOSTIC_PAGE_TITLE_ASSET}
              width={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.pageTitle.width
              }
              x={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.pageTitle.x}
              y={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.pageTitle.y}
            />
            <DiagnosticShellAsset asset={shellAssets.spanishPageAudio} />

            <image
              height="175"
              href={DIAGNOSTIC_TABLE_ASSET}
              width="478"
              x="43"
              y="341"
            />
            <rect
              data-table-patch-source-fill={DIAGNOSTIC_TABLE_PATCH_SOURCE_FILL}
              fill={DIAGNOSTIC_TABLE_PATCH_SOURCE_FILL}
              height="31"
              width="197"
              x="312"
              y="433"
            />
            <text
              fill="#0a0a0a"
              fontFamily={bauhaus}
              fontSize="20"
              opacity={deterministicState.checkYourWorkOpacity}
              wordSpacing="3"
              x="312"
              y="457"
            >
              Check your work.
            </text>

            <g
              fontFamily={bauhaus}
              opacity={deterministicState.checkYourWorkOpacity}
              wordSpacing="7"
            >
              <circle cx="205" cy="127" fill="#000000" r="14" />
              <text
                fill="#ffffff"
                fontSize="20"
                textAnchor="middle"
                x="205"
                y="133"
              >
                4
              </text>
              <text fill="#111111" fontSize="20" x="224" y="135">
                Check your work.
              </text>
            </g>

            <g
              fontFamily={bauhaus}
              fontSize="20"
              opacity={deterministicState.strategiesHeadingOpacity}
              wordSpacing="7"
            >
              <circle
                cx="210"
                cy="158"
                fill="#ee1717"
                r="6"
                stroke="#9e0000"
                strokeWidth="1"
              />
              <text x="225" y="165">
                <tspan fill={linkBlue} textDecoration="underline">
                  Strategies
                </tspan>
                <tspan fill="#111111"> to try:</tspan>
              </text>
            </g>

            <g
              fill="#080808"
              fontFamily={bauhaus}
              fontSize="18"
              opacity={deterministicState.strategyListOpacity}
              transform="translate(1 -1)"
              wordSpacing="6"
            >
              <circle cx="210" cy="185" r="4" />
              <text x="220" y="191">
                write an{" "}
                <tspan fill={linkBlue} textDecoration="underline">
                  equation
                </tspan>{" "}
                and
              </text>
              <text x="220" y="214">
                solve it
              </text>
              <circle cx="210" cy="230" r="4" />
              <text x="220" y="236">
                draw a picture
              </text>
              <circle cx="210" cy="254" r="4" />
              <text x="220" y="260">
                look for a{" "}
                <tspan fill={linkBlue} textDecoration="underline">
                  pattern
                </tspan>
              </text>
              <circle cx="210" cy="278" r="4" />
              <text x="220" y="284">
                systematically guess
              </text>
              <text x="220" y="307">
                and check
              </text>

              <circle cx="533" cy="185" r="4" />
              <text x="543" y="191">
                act it out
              </text>
              <circle cx="533" cy="209" r="4" />
              <text x="543" y="215">
                make a{" "}
                <tspan fill={linkBlue} textDecoration="underline">
                  table
                </tspan>
              </text>
              <circle cx="533" cy="233" r="4" />
              <text x="543" y="239">
                work a{" "}
                <tspan fill={linkBlue} textDecoration="underline">
                  simpler
                </tspan>
              </text>
              <text x="543" y="262">
                problem
              </text>
              <circle cx="533" cy="278" r="4" />
              <text x="543" y="284">
                work backwards
              </text>
            </g>

            <g
              fontFamily={bauhaus}
              fontSize="20"
              opacity={deterministicState.showYourWorkOpacity}
              transform="translate(1 -2)"
              wordSpacing="7"
            >
              <circle
                cx="209"
                cy="325"
                fill="#ee1717"
                r="6"
                stroke="#9e0000"
                strokeWidth="1"
              />
              <text fill={showColor} textDecoration="underline" x="224" y="332">
                Show
              </text>
              <text fill="#111111" x="282" y="332">
                {" "}
                your work.
              </text>
            </g>

            <image
              height={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.map.height}
              href={`${DIAGNOSTIC_SHELL_BUTTON_ASSET_BASE}/lesson-shell-map-up.png`}
              width={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.map.width}
              x={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.map.x}
              y={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.map.y}
            />
            <image
              height={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.keyTerms.height
              }
              href={`${DIAGNOSTIC_SHELL_BUTTON_ASSET_BASE}/lesson-shell-key-terms-up.png`}
              width={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.keyTerms.width
              }
              x={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.keyTerms.x}
              y={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.keyTerms.y}
            />
            <image
              height={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.calculator.height
              }
              href={`${DIAGNOSTIC_SHELL_BUTTON_ASSET_BASE}/lesson-shell-calculator-up.png`}
              width={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.calculator.width
              }
              x={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.calculator.x}
              y={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.calculator.y}
            />

            <g
              data-shell-control-role="lesson-shell-progress-diagnostic"
              data-source-character-id={progressThumb.sourceCharacterId}
              data-source-frame-domain={progressThumb.sourceFrameDomain}
            >
              <rect
                data-progress-color-role="track"
                data-progress-semantic-output-color={
                  progress.progressTrackColor
                }
                fill={progress.progressTrackFilterInputColor}
                height="8"
                width="117"
                x="588"
                y="540"
              />
              <rect
                data-progress-color-role="fill"
                data-progress-semantic-output-color={progress.progressFillColor}
                fill={progress.progressFillFilterInputColor}
                height="6"
                width={progress.progressWidthPixels}
                x="588"
                y="541"
              />
              <image
                aria-hidden="true"
                data-shell-control-role="lesson-shell-progress-thumb-source-structural"
                data-source-character-id={progressThumb.sourceCharacterId}
                focusable="false"
                height={progressThumb.image.height}
                href={progressThumb.image.publicPath}
                transform={
                  `translate(${
                    progressThumb.sourceComposition.x +
                    progress.progressThumbOffsetPixels
                  } ` +
                  `${progressThumb.sourceComposition.y}) ` +
                  `scale(${progressThumb.sourceComposition.scaleX} ` +
                  `${progressThumb.sourceComposition.scaleY})`
                }
                width={progressThumb.image.width}
                x="0"
                y="0"
              />
            </g>
            <image
              height={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.rewind.height
              }
              href={`${DIAGNOSTIC_SHELL_BUTTON_ASSET_BASE}/lesson-shell-rewind-up.png`}
              width={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.rewind.width}
              x={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.rewind.x}
              y={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.rewind.y}
            />
            <image
              height={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.forward.height
              }
              href={`${DIAGNOSTIC_SHELL_BUTTON_ASSET_BASE}/lesson-shell-forward-up.png`}
              width={
                COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.forward.width
              }
              x={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.forward.x}
              y={COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.forward.y}
            />
            <DiagnosticShellAsset asset={shellAssets.previous} />
            <DiagnosticShellAsset asset={shellAssets.next} />
            <DiagnosticShellAsset asset={shellAssets.replay} />
            <DiagnosticShellAsset asset={shellAssets.volumeSlider} />
            <DiagnosticShellAsset asset={shellAssets.volume} />
            <DiagnosticShellAsset asset={playbackAsset} />
          </g>
          <g
            aria-label="Observed eight-block lesson status strip; block ordinal meaning is unresolved"
            data-shell-page-status-active-ordinal="unresolved"
            data-shell-page-status-block-count={statusStrip.blocks.length}
            data-shell-page-status-ordinal-authority="false"
            data-shell-page-status-source-basis={statusStrip.sourceBasis}
            data-shell-page-status-state={statusStrip.status}
            role="group"
            shapeRendering="crispEdges"
          >
            <title>
              Observed eight-block lesson status strip; block ordinal meaning is
              unresolved
            </title>
            {statusStrip.blocks.map((block, index) => {
              const { edgeInsetPixels, height, width, y } =
                statusStrip.geometry;
              const right = block.x + width;
              const bottom = y + height;
              return (
                <path
                  aria-hidden="true"
                  data-shell-page-status-block={index + 1}
                  data-shell-page-status-observed-color={
                    block.observedOutputSrgbColor
                  }
                  d={
                    `M ${block.x + edgeInsetPixels} ${y}` +
                    ` H ${right - edgeInsetPixels}` +
                    ` V ${y + edgeInsetPixels}` +
                    ` H ${right}` +
                    ` V ${bottom - edgeInsetPixels}` +
                    ` H ${right - edgeInsetPixels}` +
                    ` V ${bottom}` +
                    ` H ${block.x + edgeInsetPixels}` +
                    ` V ${bottom - edgeInsetPixels}` +
                    ` H ${block.x}` +
                    ` V ${y + edgeInsetPixels}` +
                    ` H ${block.x + edgeInsetPixels} Z`
                  }
                  fill={block.observedOutputSrgbColor}
                  focusable="false"
                  key={block.x}
                />
              );
            })}
          </g>
        </svg>
        <button
          aria-label="Replay TS006 diagnostic-composite candidate"
          aria-keyshortcuts="Enter Space"
          className="ts006-shell-replay-hotspot"
          data-replay-keyboard="enter-space"
          data-shell-control-role={shellAssets.replay.role}
          data-source-character-id={shellAssets.replay.sourceCharacterId}
          onClick={onReplay}
          style={{
            background: "transparent",
            border: 0,
            borderRadius: "50%",
            cursor: "pointer",
            height: `${(replayLayout.height / 600) * 100}%`,
            left: `${(replayLayout.x / 800) * 100}%`,
            position: "absolute",
            top: `${(replayLayout.y / 600) * 100}%`,
            width: `${(replayLayout.width / 800) * 100}%`,
          }}
          type="button"
        />
      </div>
      <p data-source-replay-parity="diagnostic-visible-reset-only">
        Engineering preview from a non-promotable English runtime diagnostic.
        Source-frame calibration, audio, Spanish, strict visual parity, human
        review, and Owner acceptance remain pending.
      </p>
    </section>
  );
}

export {
  COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP,
  COURSE_G04_L03_TS_006_PROGRESS_THUMB_ASSET,
  COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS,
  COURSE_G04_L03_TS_006_SOURCE,
};
export const COURSE_G04_L03_TS_006_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G04_L03_TS_006_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G04_L03_TS_006_SOURCE_CONTRACT = Object.freeze({
  ...sourceStaticCandidate.sourceContract,
  audioStatus: "exact-spanish-host-track-candidate-listening-unvalidated",
  shellStructuralAssetManifestSha256:
    COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS.manifest.sha256,
  shellStructuralAssetBytesBound: true,
  progressThumbAssetSha256:
    COURSE_G04_L03_TS_006_PROGRESS_THUMB_ASSET.image.sha256,
  progressThumbAssetBytesBound: true,
  progressMappingStatus:
    "diagnostic-piecewise-anchor-projection-not-authoritative",
  shellControlBehaviorStatus:
    "deterministic-current-js-visual-candidate-source-actions-disabled",
});
export const COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT = Object.freeze({
  status: "manual-runtime-diagnostic-composite-engineering-candidate-only",
  language: "en",
  repeatedRevealRunsObserved: 3,
  sourceFrameMapping:
    "diagnostic-piecewise-anchor-projection-not-authoritative",
  colorCalibration: COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION,
  shellStructuralAssetManifestSha256:
    COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS.manifest.sha256,
  shellStructuralAssetBytesBound: true,
  progressThumbAssetSha256:
    COURSE_G04_L03_TS_006_PROGRESS_THUMB_ASSET.image.sha256,
  progressThumbAssetBytesBound: true,
  progressMappingStatus:
    "diagnostic-piecewise-anchor-projection-not-authoritative",
  progressColorProjection:
    COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION,
  statusStripObservationStatus:
    COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP.status,
  statusStripOrdinalAuthorityEstablished:
    COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP.ordinalAuthorityEstablished,
  tablePatchSourceFill: DIAGNOSTIC_TABLE_PATCH_SOURCE_FILL,
  shellSourceActionsExecuted: false,
  audioRendered: false,
  spanishEnabled: false,
  runtimeAuthorityClaimed: false,
  fullFrameRmseAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_TS_006_SCENARIOS: readonly RuntimeScenario[] =
  Object.freeze([
    ...sourceStaticCandidate.scenarios,
    Object.freeze({
      id: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
      label: "English manual-runtime diagnostic composite",
      description:
        "Three repeated English runtime observations inform this fail-closed engineering projection. It is not an authoritative baseline or source-frame mapping.",
    }),
  ]);
export const normalizeCourseG04L03Ts006Frame =
  sourceStaticCandidate.normalizeFrame;
export const getCourseG04L03Ts006FrameState = (
  frame: number,
  context: Pick<
    RuntimeContext,
    | "frameDomain"
    | "scenario"
    | "lang"
    | "seed"
    | "requirementId"
    | "traceId"
    | "entryStateSha256"
  >,
): CourseG04L03Ts006FrameState =>
  context.scenario === COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO
    ? bindTraceCaptureIdentity(
        getCourseG04L03Ts006DiagnosticCompositeState(frame, context),
        context,
      )
    : sourceStaticCandidate.getFrameState(frame, context);
export const buildCourseG04L03Ts006CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;

export function CourseG04L03Ts006Renderer(props: AnimationRendererProps) {
  return props.scenario ===
    COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO ? (
    <DiagnosticStage {...props} />
  ) : (
    <SourceStaticRenderer {...props} />
  );
}

const module: AnimationModule<CourseG04L03Ts006FrameState> = Object.freeze({
  ...sourceStaticCandidate.module,
  scenarios: COURSE_G04_L03_TS_006_SCENARIOS,
  audioTracks: Object.freeze([
    Object.freeze({
      id: "course-g04-l03-ts-006-es-host-audio",
      language: "es",
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l03-ts-006/audio/spanish-host-narration.mp3",
      durationMs: 7632,
      sha256:
        "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
      activation: "user",
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-23"]),
      timelineBehavior: "pause-while-playing",
    }),
  ]),
  Renderer: CourseG04L03Ts006Renderer,
  getFrameState: getCourseG04L03Ts006FrameState,
});

export default module;
