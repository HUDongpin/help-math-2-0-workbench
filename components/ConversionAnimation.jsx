"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  FLASH_MOVIE,
  getConversionFrameState,
  getCupMeasureMarks,
  restartTimeline,
} from "../lib/conversionTimeline.js";

const cupMeasureMarks = getCupMeasureMarks();

function formatSeconds(elapsedMs) {
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

export function ConversionAnimation({ spanishFormulaFlag = "off" }) {
  const [runId, setRunId] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  const languageOptions = useMemo(
    () => ({ spanishFormulaFlag }),
    [spanishFormulaFlag],
  );
  const frameState = getConversionFrameState(elapsedMs, languageOptions);

  useEffect(() => {
    if (!isPlaying) return undefined;

    startRef.current = performance.now() - elapsedMs;

    function tick(now) {
      const nextElapsed = now - startRef.current;
      const nextState = getConversionFrameState(nextElapsed, languageOptions);
      setElapsedMs(nextState.elapsedMs);
      if (nextState.isComplete) {
        setIsPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [elapsedMs, isPlaying, languageOptions, runId]);

  const replay = useCallback(() => {
    const reset = restartTimeline(languageOptions);
    setElapsedMs(reset.elapsedMs);
    setIsPlaying(true);
    setRunId((value) => value + 1);
  }, [languageOptions]);

  const cupLiquidHeight = 94 * frameState.cupFillLevel;
  const cupLiquidY = 248 - cupLiquidHeight;
  const pourOpacity = frameState.pourVisible ? 1 : 0;
  const finalFormulaOpacity = frameState.finalFormulaVisible ? 1 : 0;
  const ouncesOpacity = frameState.ouncesLabelVisible ? 1 : 0;
  const cartonTilt = frameState.pourVisible
    ? -8 - frameState.pourProgress * 10
    : 0;

  return (
    <div className="conversion-panel">
      <div className="movie-toolbar" aria-live="polite">
        <span>Frame {frameState.frame} / {FLASH_MOVIE.frameCount}</span>
        <span>{formatSeconds(frameState.elapsedMs)} / 7.8s</span>
      </div>

      <div className="movie-stage-wrap">
        <svg
          className="movie-stage"
          viewBox={`0 0 ${FLASH_MOVIE.stage.width} ${FLASH_MOVIE.stage.height}`}
          role="img"
          aria-labelledby="conversion-title conversion-desc"
        >
          <title id="conversion-title">Capacity conversion animation</title>
          <desc id="conversion-desc">
            Milk is poured into a measuring cup to show that one cup equals
            eight fluid ounces.
          </desc>

          <defs>
            <linearGradient id="stage-bg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f7fbff" />
              <stop offset="54%" stopColor="#eef7f0" />
              <stop offset="100%" stopColor="#f7f1e2" />
            </linearGradient>
            <linearGradient id="milk-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fffef5" />
              <stop offset="100%" stopColor="#f5e7aa" />
            </linearGradient>
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="8"
                floodColor="#334155"
                floodOpacity="0.16"
              />
            </filter>
            <clipPath id="cup-clip">
              <path d="M462 148 L582 148 L558 270 L486 270 Z" />
            </clipPath>
          </defs>

          <rect width="780" height="379" rx="0" fill="url(#stage-bg)" />
          <path
            d="M66 303 C176 278 254 315 342 292 C452 263 556 281 704 250"
            fill="none"
            stroke="#b8d8cd"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />

          <g className="formula-card" transform="translate(54 38)">
            <rect
              width="270"
              height="46"
              rx="6"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="2"
            />
            <text
              x="18"
              y="30"
              fill="#0f172a"
              fontFamily="Verdana, Arial, sans-serif"
              fontSize="16"
              fontWeight="700"
            >
              {frameState.formulaText}
            </text>
          </g>

          <g
            className="milk-carton"
            transform={`translate(130 140) rotate(${cartonTilt} 72 70)`}
            opacity={frameState.milkCartonVisible ? 1 : 0.18}
            filter="url(#soft-shadow)"
          >
            <path d="M18 36 L74 8 L130 36 L130 154 L18 154 Z" fill="#f8fafc" />
            <path d="M18 36 L74 8 L74 154 L18 154 Z" fill="#e0f2fe" />
            <path d="M74 8 L130 36 L74 50 Z" fill="#bfdbfe" />
            <path d="M74 50 L130 36 L130 154 L74 154 Z" fill="#ffffff" />
            <rect x="36" y="72" width="74" height="34" rx="4" fill="#2563eb" />
            <text
              x="73"
              y="94"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Arial, sans-serif"
              fontSize="14"
              fontWeight="700"
            >
              MILK
            </text>
            <path
              d="M18 36 L74 8 L130 36 L130 154 L18 154 Z"
              fill="none"
              stroke="#1e293b"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>

          <g
            className="pour-stream"
            opacity={pourOpacity}
            style={{ transition: "opacity 180ms ease" }}
          >
            <path
              d="M260 181 C326 170 377 187 448 210"
              fill="none"
              stroke="#fff8d6"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M260 181 C326 170 377 187 448 210"
              fill="none"
              stroke="#e7d988"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="10 14"
            />
          </g>

          <g className="measuring-cup" filter="url(#soft-shadow)">
            <path
              d="M462 148 L582 148 L558 270 L486 270 Z"
              fill="#f8fafc"
              fillOpacity="0.55"
              stroke="#1e293b"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <g clipPath="url(#cup-clip)">
              <rect
                x="456"
                y={cupLiquidY}
                width="132"
                height={cupLiquidHeight}
                fill="url(#milk-fill)"
              />
            </g>
            <path
              d="M582 174 C646 176 648 244 568 244"
              fill="none"
              stroke="#1e293b"
              strokeWidth="11"
              strokeLinecap="round"
              opacity="0.88"
            />
            <path
              d="M582 174 C635 179 632 232 572 232"
              fill="none"
              stroke="#f8fafc"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.95"
            />
            {cupMeasureMarks.map((mark) => (
              <g key={mark.value}>
                <line
                  x1={mark.lineX1}
                  x2={mark.lineX2}
                  y1={mark.y}
                  y2={mark.y}
                  stroke={frameState.cupHighlight && mark.value === 3 ? "#dc2626" : "#475569"}
                  strokeWidth={mark.value === 3 ? 4 : 3}
                  strokeLinecap="round"
                />
                <text
                  x={mark.labelX}
                  y={mark.y}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="#1e293b"
                  fontFamily="Arial, sans-serif"
                  fontSize="17"
                  fontWeight="700"
                >
                  {mark.value}
                </text>
              </g>
            ))}
            <text
              x="522"
              y="294"
              textAnchor="middle"
              fill="#1e293b"
              fontFamily="Arial, sans-serif"
              fontSize="16"
              fontWeight="700"
            >
              CUP
            </text>
          </g>

          <g
            className="ounces-callout"
            opacity={ouncesOpacity}
            aria-hidden={!frameState.ouncesLabelVisible}
            transform="translate(350 52)"
            style={{ transition: "opacity 240ms ease" }}
          >
            <path
              d="M120 54 C146 68 166 84 184 108"
              fill="none"
              stroke="#dc2626"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M184 108 L168 102 L178 91 Z" fill="#dc2626" />
            <rect
              x="0"
              y="0"
              width="144"
              height="48"
              rx="6"
              fill="#fff7ed"
              stroke="#ea580c"
              strokeWidth="2"
            />
            <text
              x="72"
              y="31"
              textAnchor="middle"
              fill="#9a3412"
              fontFamily="'Arial Rounded MT Bold', Arial, sans-serif"
              fontSize="18"
              fontWeight="700"
            >
              8 ounces
            </text>
          </g>

          <g
            className="final-formula"
            opacity={finalFormulaOpacity}
            aria-hidden={!frameState.finalFormulaVisible}
            transform="translate(278 308)"
            style={{ transition: "opacity 240ms ease" }}
          >
            <rect
              width="236"
              height="36"
              rx="6"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
            />
            <text
              x="118"
              y="24"
              textAnchor="middle"
              fill="#f8fafc"
              fontFamily="'Arial Rounded MT Bold', Arial, sans-serif"
              fontSize="17"
              fontWeight="700"
            >
              1 cup = 8 fluid ounces
            </text>
          </g>
        </svg>

        {frameState.replayVisible ? (
          <button
            className="replay-button"
            type="button"
            onClick={replay}
            aria-label="Replay conversion animation"
          >
            Replay
          </button>
        ) : null}
      </div>
    </div>
  );
}
