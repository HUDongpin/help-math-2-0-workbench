"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  GALLON_FLASH_MOVIE,
  GALLON_FORMULAS,
  getGallonFrameState,
  restartGallonTimeline,
} from "../lib/conversionTimeline.js";
import {
  FlashFluidOunces,
  FlashGallonCounter,
  FlashGallonFinalFormula,
} from "./FlashBauhausGallon.jsx";

const ASSET_ROOT = "/flash-assets/conversion-1-2";
const FULL_BOTTLE_SOURCE = [1, 0, 0, 1, 56.8, 144.65];
const GALLON_LEVELS = [0, 0.25, 0.5, 0.75, 1];
const GALLON_LEVEL_ASSETS = ["0", "32", "64", "96", "128"];

function matrixTransform(matrix) {
  return `matrix(${matrix.slice(0, 6).join(" ")})`;
}

function GallonLayer({ progress }) {
  const scaled = Math.min(4, Math.max(0, progress * 4));
  const lowerIndex = Math.floor(scaled);
  const upperIndex = Math.min(4, lowerIndex + 1);
  const blend = scaled - lowerIndex;

  return (
    <g>
      <image
        href={`${ASSET_ROOT}/gallon-${GALLON_LEVEL_ASSETS[lowerIndex]}.png`}
        x="455"
        y="95"
        width="180"
        height="175"
        opacity={1 - blend}
      />
      {upperIndex !== lowerIndex ? (
        <image
          href={`${ASSET_ROOT}/gallon-${GALLON_LEVEL_ASSETS[upperIndex]}.png`}
          x="455"
          y="95"
          width="180"
          height="175"
          opacity={blend}
        />
      ) : null}
    </g>
  );
}

function BottleShadows() {
  return (
    <image
      href={`${ASSET_ROOT}/quart-shadows.svg`}
      x="92"
      y="241.7"
      width="280.8"
      height="19.2"
    />
  );
}

function BottleLabel({ matrix }) {
  return (
    <image
      href={`${ASSET_ROOT}/quart-label.svg`}
      x="0.7"
      y="5.7"
      width="42.2"
      height="15.95"
      transform={matrixTransform(matrix)}
    />
  );
}

function FullBottle({ index, matrix, labelMatrix }) {
  const bodyMatrix = matrix ?? [
    ...FULL_BOTTLE_SOURCE.slice(0, 4),
    FULL_BOTTLE_SOURCE[4] + index * 72,
    FULL_BOTTLE_SOURCE[5],
  ];
  return (
    <g>
      <image
        href={`${ASSET_ROOT}/quart-full-body.svg`}
        x="22.3"
        y="0"
        width="47.45"
        height="109.15"
        transform={matrixTransform(bodyMatrix)}
      />
      <BottleLabel matrix={labelMatrix} />
    </g>
  );
}

function EmptyBottle({ matrix, labelMatrix, opacity }) {
  return (
    <g opacity={opacity}>
      <image
        href={`${ASSET_ROOT}/quart-empty-body.svg`}
        x="-52.9"
        y="-33.85"
        width="105.8"
        height="67.75"
        transform={matrixTransform(matrix)}
      />
      <BottleLabel matrix={labelMatrix} />
    </g>
  );
}

function PouringBottle({ progress, opacity }) {
  if (progress === 0) {
    return (
      <g opacity={opacity}>
        <svg
          x="420"
          y="15"
          width="125"
          height="100"
          viewBox="420 15 125 100"
        >
          <image
            href={`${ASSET_ROOT}/pouring-start.svg`}
            width="780"
            height="379"
          />
        </svg>
      </g>
    );
  }

  const streamOpacity = Math.sin(Math.PI * progress) * opacity;
  return (
    <g opacity={opacity}>
      <path
        d="M526 91 C530 94 532 101 537 108"
        fill="none"
        stroke="#c1dce9"
        strokeLinecap="round"
        strokeWidth="4.2"
        opacity={streamOpacity}
      />
      <image
        href={`${ASSET_ROOT}/quart-pouring-full.png`}
        x="420"
        y="15"
        width="120"
        height="95"
        opacity={1 - progress}
      />
      <image
        href={`${ASSET_ROOT}/quart-pouring-empty.png`}
        x="420"
        y="15"
        width="120"
        height="95"
        opacity={progress}
      />
    </g>
  );
}

function BottleLayer({ bottle }) {
  if (bottle.phase === "full") {
    return (
      <FullBottle
        index={bottle.index}
        labelMatrix={bottle.labelMatrix}
      />
    );
  }
  if (bottle.phase === "moving") {
    return (
      <FullBottle
        index={bottle.index}
        matrix={bottle.matrix}
        labelMatrix={bottle.labelMatrix}
      />
    );
  }
  if (bottle.phase === "pouring") {
    if (bottle.pourExit) {
      return (
        <EmptyBottle
          matrix={bottle.matrix}
          labelMatrix={bottle.labelMatrix}
          opacity={bottle.opacity}
        />
      );
    }
    return (
      <PouringBottle
        progress={bottle.pourProgress}
        opacity={bottle.opacity}
      />
    );
  }
  return (
    <EmptyBottle
      matrix={bottle.matrix}
      labelMatrix={bottle.labelMatrix}
      opacity={bottle.opacity}
    />
  );
}

function ReplayButton({ opacity, onReplay }) {
  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onReplay();
    }
  };

  return (
    <g
      className="flash-replay"
      opacity={opacity}
      role="button"
      tabIndex={opacity > 0 ? 0 : -1}
      aria-label="Replay animation"
      onClick={onReplay}
      onKeyDown={onKeyDown}
    >
      <image
        href={`${ASSET_ROOT}/replay-up.svg`}
        x="676.546"
        y="8.660"
        width="92.494"
        height="21.450"
      />
    </g>
  );
}

export function GallonConversionAnimation({
  spanishFormulaFlag = "off",
  captureFrame,
  captureStageAttributes,
  captureVisualAttributes,
}) {
  const normalizedCaptureFrame = Number.isInteger(captureFrame)
    ? Math.min(GALLON_FLASH_MOVIE.frameCount, Math.max(1, captureFrame))
    : null;
  const capturedElapsedMs = normalizedCaptureFrame
    ? ((normalizedCaptureFrame - 1) * 1000) / GALLON_FLASH_MOVIE.fps + 0.001
    : 0;
  const [runId, setRunId] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(capturedElapsedMs);
  const [isPlaying, setIsPlaying] = useState(normalizedCaptureFrame === null);
  const rafRef = useRef(0);
  const languageOptions = useMemo(
    () => ({ spanishFormulaFlag }),
    [spanishFormulaFlag],
  );
  const frameState = getGallonFrameState(
    normalizedCaptureFrame === null ? elapsedMs : capturedElapsedMs,
    languageOptions,
  );
  const spanishFormulaVisible = spanishFormulaFlag.toUpperCase() === "ON";

  useEffect(() => {
    if (normalizedCaptureFrame !== null) return undefined;
    if (!isPlaying) return undefined;
    const startedAt = performance.now() - elapsedMs;

    function tick(now) {
      const nextState = getGallonFrameState(now - startedAt, languageOptions);
      setElapsedMs(nextState.elapsedMs);
      if (nextState.isComplete) {
        setIsPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [capturedElapsedMs, isPlaying, languageOptions, normalizedCaptureFrame, runId]);

  const replay = useCallback(() => {
    if (normalizedCaptureFrame !== null) return;
    const reset = restartGallonTimeline(languageOptions);
    setElapsedMs(reset.elapsedMs);
    setRunId((value) => value + 1);
    setIsPlaying(true);
  }, [languageOptions, normalizedCaptureFrame]);

  return (
    <div className="faithful-conversion gallon-conversion">
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
          aria-labelledby="gallon-conversion-title gallon-conversion-desc"
        >
          <title id="gallon-conversion-title">
            1 gallon equals 128 fluid ounces
          </title>
          <desc id="gallon-conversion-desc">
            Four quart bottles pour into a gallon jug as the fluid-ounce total
            increases from 32 to 128.
          </desc>

          <rect width="780" height="379" fill="#e4e4e4" />

          <g role="img" aria-label={GALLON_FORMULAS.en}>
            <image
              href={`${ASSET_ROOT}/formula-en.svg`}
              x="15.15"
              y="322.85"
              width="365.7"
              height="52.8"
            />
          </g>

          {spanishFormulaVisible ? (
            <g role="img" aria-label={GALLON_FORMULAS.es} data-source-instance="Mc_SD" data-source-depth="4">
              <image
                href={`${ASSET_ROOT}/formula-es.svg`}
                x="414.3"
                y="322.85"
                width="365.7"
                height="52.8"
              />
            </g>
          ) : null}

          {frameState.quartShadowsVisible ? <BottleShadows /> : null}
          <GallonLayer progress={frameState.gallonProgress} />

          {frameState.bottles.map((bottle) => (
            <BottleLayer key={bottle.index} bottle={bottle} />
          ))}

          <g opacity={frameState.counterOpacity}>
            <rect
              x="638.95"
              y="181"
              width="87"
              height="53"
              fill="#ffffcc"
              stroke={frameState.counterFlash ? "#ff0000" : "#b8b8a5"}
              strokeWidth={frameState.counterFlash ? "3" : "0.8"}
            />
            <FlashGallonCounter value={frameState.fluidOunces} />
            <FlashFluidOunces opacity={1} />
          </g>

          <g opacity={frameState.formulaOpacity}>
            <rect
              x="425.2"
              y="278.2"
              width="225.4"
              height="26.4"
              rx="13.2"
              fill="#ffff99"
              stroke="#999966"
              strokeWidth="0.55"
            />
          </g>
          <FlashGallonFinalFormula opacity={frameState.formulaOpacity} />
          <ReplayButton opacity={frameState.replayOpacity} onReplay={replay} />
        </svg>

        <span className="sr-only" aria-live="polite">
          Frame {frameState.frame} of {GALLON_FLASH_MOVIE.frameCount}
        </span>
      </div>
    </div>
  );
}
