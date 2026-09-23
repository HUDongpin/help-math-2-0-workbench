"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CUP_FLASH_MOVIE,
  CUP_FORMULAS,
  getCupFrameState,
  getCupFrameStateAtFrame,
  restartCupTimeline,
} from "../lib/conversion11Timeline.js";

const FRAME_ASSET_ROOT = "/flash-assets/conversion-1-1/frames";
const SPANISH_PANEL_ASSET = "/flash-assets/conversion-1-1/formula-es.svg";
const SPANISH_PANEL = Object.freeze({ x: 414.3, y: 240.85, width: 365.7, height: 52.8 });

function frameAsset(frame) {
  return `${FRAME_ASSET_ROOT}/${frame}.svg`;
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

export function CupConversionAnimation({
  spanishFormulaFlag = "off",
  captureFrame,
  captureStageAttributes,
  captureVisualAttributes,
  onReplay,
}) {
  const normalizedCaptureFrame = Number.isInteger(captureFrame)
    ? Math.min(CUP_FLASH_MOVIE.frameCount, Math.max(1, captureFrame))
    : null;
  const [runId, setRunId] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(normalizedCaptureFrame === null);
  const rafRef = useRef(0);
  const languageOptions = useMemo(() => ({ spanishFormulaFlag }), [spanishFormulaFlag]);
  const frameState = normalizedCaptureFrame === null
    ? getCupFrameState(elapsedMs, languageOptions)
    : getCupFrameStateAtFrame(normalizedCaptureFrame, languageOptions);
  const language = frameState.spanishFormulaVisible ? "es" : "en";

  useEffect(() => {
    if (normalizedCaptureFrame !== null || typeof window === "undefined") return undefined;
    const images = Array.from({ length: 93 }, (_, index) => {
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
      const next = getCupFrameState(now - startedAt, languageOptions);
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
    const reset = restartCupTimeline(languageOptions);
    setElapsedMs(reset.elapsedMs);
    setRunId((value) => value + 1);
    setIsPlaying(true);
  }, [languageOptions, normalizedCaptureFrame, onReplay]);

  return (
    <div className="faithful-conversion cup-conversion">
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
          aria-labelledby="cup-conversion-title cup-conversion-desc"
        >
          <title id="cup-conversion-title">
            {language === "es" ? "Una taza equivale a ocho onzas líquidas" : "One cup equals eight fluid ounces"}
          </title>
          <desc id="cup-conversion-desc">
            {language === "es"
              ? "Un cartón vierte leche en una taza medidora hasta la marca de ocho onzas."
              : "A carton pours milk into a measuring cup to the eight-ounce mark."}
          </desc>

          <rect width="780" height="379" fill="#e4e4e4" />
          {frameState.stageVisible ? (
            <image
              href={frameAsset(frameState.sourceFrame)}
              width="780"
              height="379"
              aria-hidden="true"
            />
          ) : null}

          {frameState.stageVisible ? (
            <rect x="414" y="240" width="366" height="54" fill="#e4e4e4" />
          ) : null}

          <g aria-label={CUP_FORMULAS.en} />
          {frameState.spanishFormulaVisible ? (
            <g aria-label={CUP_FORMULAS.es} data-source-instance="Mc_SD" data-source-depth="4">
              <image
                href={SPANISH_PANEL_ASSET}
                x={SPANISH_PANEL.x}
                y={SPANISH_PANEL.y}
                width={SPANISH_PANEL.width}
                height={SPANISH_PANEL.height}
              />
            </g>
          ) : null}
          <ReplayHitTarget
            language={language}
            visible={frameState.stageVisible && frameState.replayVisible}
            onReplay={replay}
          />
        </svg>
        <span className="sr-only" aria-live="polite">
          Frame {frameState.frame} of {CUP_FLASH_MOVIE.frameCount}
        </span>
      </div>
    </div>
  );
}
