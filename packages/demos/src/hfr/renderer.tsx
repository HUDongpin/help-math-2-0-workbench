"use client";

// HFR runtime · the stage component a renderer-clocked host mounts. It owns
// one HfrPlayer: loads the page's data and generated module, follows the
// host's pause, volume, language and narration controls, routes the page's
// shell calls through the host bridge and reports playback back to the host.
import { useEffect, useRef, useState } from "react";

import type { AnimationRendererProps, RendererPlaybackReport } from "../contract";
import { bridgeHostCall } from "./host-bridge";
import { HfrPlayer } from "./player";
import { readLessonGlobals, writeLessonGlobals } from "./session";
import type { HfrPageMeta, PageData, PageFactory } from "./types";

export interface HfrRendererProps extends AnimationRendererProps {
  readonly meta: HfrPageMeta;
  readonly page: PageFactory;
}

type LoadStatus = "loading" | "ready" | "failed";

/** Page completion: timeline pages finish when they settle or reach their end; activity pages need the page's own signal. */
export function hfrPageComplete(
  mode: HfrPageMeta["completionMode"],
  state: Readonly<{ settled: boolean; reachedEnd: boolean; activity: boolean; lessonFinished: boolean }>,
): boolean {
  return mode === "activity"
    ? state.activity || state.lessonFinished
    : state.settled || state.reachedEnd || state.lessonFinished;
}

export function HfrRenderer({
  audioEnabled = false,
  lang,
  meta,
  narrationRequest,
  onLessonHostRequest,
  onRendererPlayback,
  page,
  paused = false,
  seed,
  uiLanguage,
  volume = 1,
}: HfrRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HfrPlayer | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const language = uiLanguage ?? lang;
  // Callbacks and live controls read through refs so a re-render never reloads the page.
  const live = useRef({ paused, volume, language, onLessonHostRequest, onRendererPlayback });
  useEffect(() => {
    live.current = { paused, volume, language, onLessonHostRequest, onRendererPlayback };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    const flags = { activity: false, lessonFinished: false };
    let lastReport = "";
    const report = () => {
      const player = playerRef.current;
      if (!player?.rt) return;
      const progress = player.progress();
      const next: RendererPlaybackReport = {
        frame: progress.frame,
        frameCount: progress.frameCount,
        frameDomain: progress.domain,
        fps: meta.stage.fps,
        settled: progress.settled,
        complete: hfrPageComplete(meta.completionMode, { ...progress, ...flags }),
        lessonFinished: flags.lessonFinished,
        narration: player.narrationState(),
      };
      const key = JSON.stringify(next);
      if (key === lastReport) return;
      lastReport = key;
      live.current.onRendererPlayback?.(next);
    };
    const player = new HfrPlayer(canvas, {
      onHost: (call) => {
        const action = bridgeHostCall(meta, call);
        if (action.kind === "request") {
          if (action.activity) flags.activity = true;
          live.current.onLessonHostRequest?.(action.request);
        } else if (action.kind === "activity") {
          flags.activity = true;
        } else if (action.kind === "lesson-finished") {
          flags.lessonFinished = true;
        }
      },
      onTick: report,
    });
    playerRef.current = player;
    setStatus("loading");
    (async () => {
      const response = await fetch(meta.dataUrl);
      if (!response.ok) throw new Error(`HFR page data ${response.status}`);
      const data = (await response.json()) as PageData;
      if (disposed) return;
      await player.load(data, page, meta.dataUrl.replace(/[^/]*$/u, ""), {
        audio: audioEnabled,
        globals: readLessonGlobals(meta.lessonKey),
        progressTimeline: meta.progressTimeline,
        seed: Number.isSafeInteger(seed) && seed > 0 ? seed : undefined,
      });
      if (disposed) return;
      player.resize();
      player.setVolume(live.current.volume);
      player.setSpanish(live.current.language === "es");
      setStatus("ready");
      if (!live.current.paused) player.start();
      report();
    })().catch(() => {
      if (!disposed) setStatus("failed");
    });
    const resize = new ResizeObserver(() => player.resize());
    resize.observe(canvas);
    return () => {
      disposed = true;
      resize.disconnect();
      if (player.rt) writeLessonGlobals(meta.lessonKey, player.exportGlobals());
      player.destroy();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [audioEnabled, meta, page, seed]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || status !== "ready") return;
    if (paused) player.pause();
    else player.start();
  }, [paused, status]);

  useEffect(() => {
    if (status === "ready") playerRef.current?.setVolume(volume);
  }, [status, volume]);

  useEffect(() => {
    if (status === "ready") playerRef.current?.setSpanish(language === "es");
  }, [language, status]);

  const lastNarrationRequest = useRef(0);
  useEffect(() => {
    const player = playerRef.current;
    if (!player || status !== "ready" || !narrationRequest) return;
    if (narrationRequest.requestId === lastNarrationRequest.current) return;
    lastNarrationRequest.current = narrationRequest.requestId;
    if (narrationRequest.action === "stop") player.stopNarration();
    else void player.resumeAudio();
  }, [narrationRequest, status]);

  // A hidden tab stops ticks and sound; the host's own pause state decides what happens on return.
  useEffect(() => {
    const onVisibility = () => {
      const player = playerRef.current;
      if (!player || status !== "ready") return;
      if (document.hidden) player.pause();
      else if (!live.current.paused) player.start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [status]);

  return (
    <div
      className="faithful-stage-wrap hfr-stage"
      data-hfr-page={meta.key}
      data-hfr-compiler={meta.compiler}
      data-hfr-source-sha256={meta.sourceSha256}
    >
      <canvas
        aria-label={language === "es" ? "Página de la lección" : "Lesson page"}
        className="faithful-stage"
        data-canvas-status={status === "ready" ? "ready" : status === "failed" ? "failed" : "loading"}
        height={meta.stage.height}
        ref={canvasRef}
        tabIndex={0}
        width={meta.stage.width}
      />
      {status === "failed" ? (
        <p className="runtime-unavailable" role="alert">
          {language === "es" ? "Esta página no se pudo cargar." : "This page could not be loaded."}
        </p>
      ) : null}
    </div>
  );
}
