"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  QUART_GALLON_FLASH_MOVIE,
  QUART_GALLON_FORMULAS,
  getQuartGallonFrameState,
  getQuartGallonFrameStateAtFrame,
  restartQuartGallonTimeline,
} from "../lib/conversion13Timeline.js";

// The directory name predates expansion from terminal-only evidence to the
// complete source-derived root-frame sequence.
const SOURCE_FRAME_ASSET_ROOT = "/flash-assets/conversion-1-3/terminal-frames";
const SPANISH_PANEL_ASSET = "/flash-assets/conversion-1-3/formula-es.svg";
const SPANISH_PANEL = Object.freeze({ x: 414.3, y: 322.85, width: 365.7, height: 52.8 });

function frameAsset(frame) {
  return `${SOURCE_FRAME_ASSET_ROOT}/${frame}.svg`;
}

function ReplayHitTarget({ language, visible, onReplay }) {
  if (!visible) return null;
  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onReplay();
    }
  };
  return (
    <g
      className="flash-replay"
      role="button"
      tabIndex="0"
      aria-label={language === "es" ? "Repetir animación" : "Replay animation"}
      onClick={onReplay}
      onKeyDown={onKeyDown}
    >
      <rect x="676.5" y="8.6" width="92.6" height="21.6" fill="transparent" />
    </g>
  );
}

export function QuartGallonConversionAnimation({
  spanishFormulaFlag = "off",
  captureFrame,
  captureStageAttributes,
  captureVisualAttributes,
  onReplay,
}) {
  const normalizedCaptureFrame = Number.isInteger(captureFrame)
    ? Math.min(QUART_GALLON_FLASH_MOVIE.frameCount, Math.max(1, captureFrame))
    : null;
  const [runId, setRunId] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(normalizedCaptureFrame === null);
  const rafRef = useRef(0);
  const languageOptions = useMemo(() => ({ spanishFormulaFlag }), [spanishFormulaFlag]);
  const frameState = normalizedCaptureFrame === null
    ? getQuartGallonFrameState(elapsedMs, languageOptions)
    : getQuartGallonFrameStateAtFrame(normalizedCaptureFrame, languageOptions);
  const language = frameState.spanishFormulaVisible ? "es" : "en";

  useEffect(() => {
    if (normalizedCaptureFrame !== null || typeof window === "undefined") return undefined;
    const images = Array.from({ length: 169 }, (_, index) => {
      const image = new window.Image();
      image.src = frameAsset(index + 1);
      return image;
    });
    return () => {
      for (const image of images) image.src = "";
    };
  }, [normalizedCaptureFrame]);

  useEffect(() => {
    if (normalizedCaptureFrame !== null || !isPlaying) return undefined;
    const startedAt = performance.now() - elapsedMs;
    function tick(now) {
      const next = getQuartGallonFrameState(now - startedAt, languageOptions);
      setElapsedMs(next.elapsedMs);
      if (next.isComplete) {
        setIsPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [elapsedMs, isPlaying, languageOptions, normalizedCaptureFrame, runId]);

  const replay = useCallback(() => {
    if (onReplay) {
      onReplay();
      return;
    }
    if (normalizedCaptureFrame !== null) return;
    const reset = restartQuartGallonTimeline(languageOptions);
    setElapsedMs(reset.elapsedMs);
    setRunId((value) => value + 1);
    setIsPlaying(true);
  }, [languageOptions, normalizedCaptureFrame, onReplay]);

  return (
    <div className="faithful-conversion quart-gallon-conversion">
      <div
        {...captureStageAttributes}
        className="faithful-stage-wrap"
        data-flash-frame={frameState.frame}
      >
        <svg
          {...captureVisualAttributes}
          className="faithful-stage"
          viewBox="0 0 780 379"
          role="group"
          aria-labelledby="quart-gallon-title quart-gallon-desc"
        >
          <title id="quart-gallon-title">
            {language === "es" ? "Un galón equivale a cuatro cuartos" : "One gallon equals four quarts"}
          </title>
          <desc id="quart-gallon-desc">
            {language === "es"
              ? "Cuatro botellas de un cuarto llenan una jarra de un galón."
              : "Four one-quart bottles fill a gallon jug to the four-quart mark."}
          </desc>

          <rect width="780" height="379" fill="#e4e4e4" />
          <image
            href={frameAsset(frameState.sourceFrame)}
            width="780"
            height="379"
            aria-hidden="true"
          />
          <rect x="414" y="322" width="366" height="54" fill="#e4e4e4" />

          <g aria-label={QUART_GALLON_FORMULAS.en} />
          {frameState.spanishFormulaVisible ? (
            <g aria-label={QUART_GALLON_FORMULAS.es} data-source-instance="Mc_SD" data-source-depth="4">
              <image
                href={SPANISH_PANEL_ASSET}
                x={SPANISH_PANEL.x}
                y={SPANISH_PANEL.y}
                width={SPANISH_PANEL.width}
                height={SPANISH_PANEL.height}
              />
            </g>
          ) : null}
          <g aria-label="Gallon scale from one to four quarts" />
          <ReplayHitTarget
            language={language}
            visible={frameState.replayVisible}
            onReplay={replay}
          />
        </svg>
        <span className="sr-only" aria-live="polite">
          Frame {frameState.frame} of {QUART_GALLON_FLASH_MOVIE.frameCount}
        </span>
      </div>
    </div>
  );
}
