"use client";

// HFR runtime · the stage component a renderer-clocked host mounts. It owns
// one HfrPlayer: loads the page's data and generated module, follows the
// host's pause, volume, language and narration controls, routes the page's
// shell calls through the host bridge and reports playback back to the host.
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {P019Renderer} from "./nms-l11-p019-renderer";
import {P020Renderer} from "./nms-l11-p020-renderer";
import {P014Renderer} from "./nms-l11-p014-renderer";
import {flushSync} from "react-dom";

import type { AnimationRendererProps, RendererPlaybackReport } from "../contract";
import { bridgeHostCall, createHfrGlossaryRelease, resumeHfrGlossarySource, type HfrGlossaryRelease, type HfrBridgeAction } from "./host-bridge";
import { HfrPlayer } from "./player";
import {createDatL3FeedbackHost} from "./dat-l03-feedback-host";
import {isDatL3FeedbackSource} from "./dat-l03-feedback-source-binding";
import {ButtonObj, MovieClip, type Runtime, type DisplayObject} from "./display";
import {LessonRuntime} from "./lesson-runtime";
import {assertHfrMetaMatchesData} from "./meta";
import {beginPageSession, hfrSessionFailureCode, HfrSessionError, resolvePageSessionData, isPageSessionCurrent, type PageSessionLease} from "./session";
import type { HfrPageMeta, PageData, PageFactory } from "./types";
import {buildHfrNativeTextFrame, prepareHfrNativeTextAsync, shouldSuppressHfrOriginalText, isHfrNativeTextFrameCurrent, type HfrNativeTextFrame, type HfrTextIdentity, type PreparedHfrNativeText, type HfrNativeGlossaryIntent, type HfrNativeGlossaryControl, resolveHfrSourceGlossaryControl} from "./hfr-native-text";
import {HfrNativeTextLayer} from "./hfr-native-text-layer";
import {resolveHfrCanvasGlossaryControl, type HfrCanvasGlossaryControl} from "./source-canvas-glossary";
import type {HfrNativeTextOptions} from "./native-presentation";
import {P009Product, type P009ProductView} from "./nms-l11-p009-product";
import {P009NativePractice, type P009NativeIntent} from "./nms-l11-p009-native-practice";
import {P009} from "./nms-l11-p009-source-binding";
import {P009_NATIVE} from "./nms-l11-p009-native-binding";
import {isP009NativeCurrent,suppressP009Native,type P009NativeFrame} from "./nms-l11-p009-native";
import {settleP009ReducedMotion} from "./nms-l11-p009-reduced-motion";
import {P010Product,type P010ProductView} from "./nms-l11-p010-product";
import {P010NativePractice,type P010NativeIntent} from "./nms-l11-p010-native-practice";
import {P010} from "./nms-l11-p010-source-binding";
import {P010_NATIVE} from "./nms-l11-p010-native-binding";
import {isP010NativeCurrent,suppressP010Native,type P010NativeFrame} from "./nms-l11-p010-native";
import {settleP010ReducedMotion} from "./nms-l11-p010-reduced-motion";
type PracticeNativeFrame=P009NativeFrame|P010NativeFrame;
function isPracticeNativeCurrent(frame:PracticeNativeFrame,runtime:Runtime,identity:HfrTextIdentity){return frame.kind==='p010-native-frame-v1'?isP010NativeCurrent(frame,runtime,identity):isP009NativeCurrent(frame,runtime,identity);}
function suppressPracticeNative(frame:PracticeNativeFrame|null,runtime:Runtime,object:DisplayObject,identity:HfrTextIdentity){return frame?.kind==='p010-native-frame-v1'?suppressP010Native(frame,runtime,object,identity):suppressP009Native(frame,runtime,object,identity);}
function settlePracticeReducedMotion(runtime:Runtime,practice:P009Product|P010Product){if(practice instanceof P010Product)settleP010ReducedMotion(runtime,practice.adapter);else settleP009ReducedMotion(runtime,practice.adapter);}


/** P010 native anchors use the same source-stage fit as its actual Canvas. */
export function p010NativePlaneFit(
  isP010: boolean,
  canvas: Readonly<{width: number; height: number}>,
  stage: Readonly<{width: number; height: number}>,
) {
  if (!isP010) return null;
  const scale = Math.min(canvas.width / stage.width, canvas.height / stage.height);
  const width = stage.width * scale, height = stage.height * scale;
  return {inset: "auto", left: `${(canvas.width - width) / 2 / canvas.width * 100}%`,
    top: `${(canvas.height - height) / 2 / canvas.height * 100}%`,
    width: `${width / canvas.width * 100}%`, height: `${height / canvas.height * 100}%`};
}

export interface HfrRendererProps extends AnimationRendererProps {
  readonly meta: HfrPageMeta;
  readonly page: PageFactory;
  readonly nativeText?: HfrNativeTextOptions;
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

/** Source hit testing remains source-owned. Once the current native commit has
 * actually replaced a word, its now-blank Canvas position is no longer a target.
 * A ready-but-uncommitted snapshot, partial reveal, or native button is different. */
export function shouldBlockCommittedHfrCanvasGlossary(
  committed: HfrNativeTextFrame | null,
  runtime: Runtime,
  identity: HfrTextIdentity,
  button: DisplayObject,
  point: readonly [number, number] | null,
): boolean {
  if (point === null || !committed?.vocabularyDecision ||
      !isHfrNativeTextFrameCurrent(committed, runtime, identity)) return false;
  const control = committed.vocabularyControls?.find(value => value.liveButton === button);
  const source = control && committed.vocabularyDecision.controls.find(value =>
    value.sourceButtonCharacterId === control.sourceButtonCharacterId);
  return Boolean(source && committed.sourceObjects.some(object =>
    `character-${object.charId}` === source.sourceTextId &&
    shouldSuppressHfrOriginalText(committed, runtime, object, identity)));
}

function DefaultHfrRenderer({
  audioEnabled = false,
  audioLanguage,
  rendererLessonSession,
  replay = 0,
  reducedMotion = false,
  lang,
  meta,
  narrationRequest,
  nativeText,
  onLessonHostRequest,
  onRendererPlayback,
  page,
  paused = false,
  hostPaused,
  seed,
  scenario,
  uiLanguage,
  volume = 1,
}: HfrRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const diagnosticHost = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HfrPlayer | null>(null);
  const practiceRef = useRef<P009Product|P010Product|null>(null);
  const activatePractice = useRef<((intent:P009NativeIntent|P010NativeIntent,trigger:HTMLElement,frame:PracticeNativeFrame)=>void)|null>(null);
  const committedPractice = useRef<PracticeNativeFrame|null>(null);
  const [practiceView,setPracticeView] = useState<P009ProductView|P010ProductView|null>(null);
  const isP009 = meta.key === P009.animationId;
  const isP010 = meta.key === P010.animationId;
  const isPractice=isP009||isP010;
  const isDatFeedback = isDatL3FeedbackSource(meta.key, meta.sourceSha256);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const nativeProseHost = useRef<HTMLDivElement>(null);
  const nativeLabelsHost = useRef<HTMLDivElement>(null);
  const committedNative = useRef<HfrNativeTextFrame | null>(null);
  const activateGlossary = useRef<((intent: HfrNativeGlossaryIntent) => void) | null>(null);
  const glossaryHold = useRef<{player: HfrPlayer; runtime: Runtime; clip: MovieClip; frame: number; resumeSource: boolean; hostPauseObserved: boolean} | null>(null);
  const [glossaryDenied, setGlossaryDenied] = useState(false);
  const [nativeFrame, setNativeFrame] = useState<HfrNativeTextFrame | null>(null);
  const effectiveSeed = Number.isSafeInteger(seed) && seed >= 0 ? seed : 12345;
  const nativeIdentity = useMemo<HfrTextIdentity>(() => ({lang, scenario, seed: effectiveSeed, replay}), [lang, scenario, effectiveSeed, replay]);
  const nativeIdentityRef = useRef(nativeIdentity);
  nativeIdentityRef.current = nativeIdentity;
  const [failureCode, setFailureCode] = useState<string | null>(null);
  const language = uiLanguage ?? lang;
  const narrationLanguage = audioLanguage ?? lang;
  const reducedMotionState = reducedMotion ? (isPractice ? (isP010?P010_NATIVE.reducedMotion:P009_NATIVE.reducedMotion) : nativeText?.reducedMotionState) : undefined;
  const actualHostPaused = hostPaused ?? paused;
  const narrationIntent = useRef<"play" | "stop">(narrationRequest?.action === "stop" ? "stop" : "play");
  const lastNarrationRequest = useRef(0);
  // Callbacks and live controls read through refs so a re-render never reloads the page.
  const live = useRef({ paused, hostPaused:actualHostPaused, reducedMotion, volume, narrationLanguage, onLessonHostRequest, onRendererPlayback });
  useEffect(() => {
    live.current = { paused, hostPaused:actualHostPaused, reducedMotion, volume, narrationLanguage, onLessonHostRequest, onRendererPlayback };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let lease: PageSessionLease | null = null;
    let validatedDataSha256: string | null = null;
    let preparedNative: PreparedHfrNativeText | null = null;
    let projectedNative: HfrNativeTextFrame | null = null;
    let projectedInputs: string | null = null;
    const nativeInputs = () => JSON.stringify([nativeText?.binding, nativeText?.sourceCatalog,
      nativeText?.sourceDecisions, nativeText?.frameDomain]);
    const flags = { activity: false, lessonFinished: false };
    let practice:P009Product|P010Product|null = null;
    let datFeedback: ReturnType<typeof createDatL3FeedbackHost> = null;
    let lastPracticeKey = "";
    let projectedPractice:PracticeNativeFrame|null=null;
    let lastReport = "";
    const consumedGlossaryIntents = new WeakSet<HfrNativeGlossaryIntent>();
    let pendingGlossary: {release: HfrGlossaryRelease; action: HfrBridgeAction | null} | null = null;
    const report = () => {
      const player = playerRef.current;
      if (disposed || !player?.rt) return;
      const progress = player.progress();
      // Observation only: no renderer or control code reads these attributes.
      const diagnostics = diagnosticHost.current;
      if (diagnostics) {
        diagnostics.dataset.hfrRootFrame = String(player.rt.page_.frame);
        diagnostics.dataset.hfrProgressFrame = String(progress.frame);
        diagnostics.dataset.hfrTickCount = String(player.rt.tickCount);
        diagnostics.dataset.hfrAudioContextState = player.audio?.ctx.state ?? "unavailable";
        diagnostics.dataset.hfrNarrationState = player.narrationState();
        diagnostics.dataset.hfrRunning = String(player.running);
      }
      const next: RendererPlaybackReport = {
        frame: progress.frame,
        frameCount: progress.frameCount,
        frameDomain: progress.domain,
        fps: meta.stage.fps,
        settled: progress.settled,
        complete: isPractice ? practice?.adapter.snapshot().complete ?? false : hfrPageComplete(meta.completionMode, { ...progress, ...flags }),
        lessonFinished: flags.lessonFinished,
        narration: player.narrationState(),
      };
      const key = JSON.stringify(next);
      if (key === lastReport) return;
      lastReport = key;
      live.current.onRendererPlayback?.(next);
    };
    function sourceControl(runtime: Runtime, button: DisplayObject, point: readonly [number, number] | null): HfrNativeGlossaryControl | HfrCanvasGlossaryControl | null {
      if (disposed || playerRef.current !== player || !lease || !isPageSessionCurrent(lease) || player.rt !== runtime ||
          document.hidden || !meta.sourceGlossary) return null;
      if (!nativeText) return resolveHfrCanvasGlossaryControl(meta, runtime, button, point, validatedDataSha256);
      if (!preparedNative) return null;
      if (shouldBlockCommittedHfrCanvasGlossary(committedNative.current, runtime, nativeIdentityRef.current, button, point)) return null;
      const frame = buildHfrNativeTextFrame(preparedNative, runtime, nativeText.frameDomain, nativeIdentityRef.current);
      return resolveHfrSourceGlossaryControl(frame, runtime, nativeIdentityRef.current, button, point);
    }
    function executeGlossary(runtime: Runtime, control: HfrNativeGlossaryControl | HfrCanvasGlossaryControl, trigger: HTMLElement,
      point: readonly [number, number] | null, releaseSource: () => void): void {
      const button = control.liveButton;
      const clip = "sourceTimeline" in control ? control.sourceTimeline : button.parentClip;
      if (disposed || playerRef.current !== player || !lease || !isPageSessionCurrent(lease) || player.rt !== runtime ||
          document.hidden || pendingGlossary || !trigger.isConnected ||
          !(button instanceof ButtonObj) || button.rt !== runtime || !runtime.allObjects().includes(button) || !runtime.isClickable(button) ||
          !(clip instanceof MovieClip) || clip.rt !== runtime || clip.removed ||
          !runtime.allObjects().includes(clip) || clip.charId !== meta.progressTimeline) return;
      const release = createHfrGlossaryRelease(meta, control, runtime.tickCount);
      if (!release) return;
      const held = glossaryHold.current;
      if (held && (held.player !== player || held.runtime !== runtime || held.clip !== clip || held.frame !== clip.frame)) return;
      const resumeSource = held?.resumeSource ?? clip.playing, errorsBefore = runtime.errors.length;
      const pending = {release, action: null as HfrBridgeAction | null};
      pendingGlossary = pending;
      let releaseError: unknown;
      let released = false;
      try {released = player.runSourceButtonRelease(runtime, button, point, releaseSource);} catch (error) {releaseError = error;} finally {pendingGlossary = null;}
      if (releaseError) {
        player.destroy();
        player.opts.onError?.(releaseError);
        return;
      }
      if (!released) return;
      // Source release has now set KeyAttribute and stopped the primary/audio.
      // A rejected host request retains that source stop just like an open one.
      player.pause();
      glossaryHold.current = {player, runtime, clip, frame: clip.frame, resumeSource, hostPauseObserved: Boolean(held?.hostPauseObserved || (live.current.paused && !live.current.reducedMotion))};
      player.redraw();
      const action = pending.action;
      if (disposed || player.rt !== runtime || !isPageSessionCurrent(lease) || runtime.errors.length !== errorsBefore || clip.playing ||
          !release.consumed || action?.kind !== "request" || action.request.type !== "open-glossary") {
        setGlossaryDenied(true); return;
      }
      const decision = live.current.onLessonHostRequest?.(action.request, {trigger});
      const allowed = decision?.status === "allowed" && decision.state.currentAnimationId === meta.key &&
        decision.state.glossaryEntryId === action.request.entryId;
      setGlossaryDenied(!allowed);
    }
    const practiceCurrent = () => Boolean(!disposed && playerRef.current === player && lease && isPageSessionCurrent(lease) && practice && practice.runtime === player.rt && practice.adapter.snapshot().current);
    const practiceInputAllowed = () => practiceCurrent() && !document.hidden && !live.current.hostPaused && !glossaryHold.current;
    function openPracticeGlossary(request:import("../lesson-host-contract").LessonHostRequest, clip:MovieClip, frame:number, resumeSource:boolean, trigger:HTMLElement) {
      if(!practiceCurrent() || request.type !== "open-glossary" || !trigger.isConnected || clip.playing || clip.frame !== frame) return;
      player.pause();
      glossaryHold.current = {player,runtime:practice!.runtime,clip,frame,resumeSource:resumeSource && practice!.adapter.mayResumeMainSource(),hostPauseObserved:false};
      player.redraw();
      const decision=live.current.onLessonHostRequest?.(request,{trigger});
      const allowed=decision?.status==="allowed" && decision.state.currentAnimationId===meta.key && decision.state.glossaryEntryId===request.entryId;
      setGlossaryDenied(!allowed);setPracticeView(practice!.view(nativeIdentityRef.current));
    }
    function practiceSourceInput(runtime:Runtime,button:DisplayObject,point?:readonly [number,number]|null):"allowed"|"blocked" {
      if(point && committedPractice.current && isPracticeNativeCurrent(committedPractice.current,runtime,nativeIdentityRef.current) && (([9,10].includes(button.charId) && committedPractice.current.prompt) || (button.charId===(isP010?42:45) && committedPractice.current.feedback)))return "blocked";
      if(!practiceInputAllowed() || practice!.runtime !== runtime)return "blocked";
      const view=practice!.view();
      return practice!.mainGlossary().some(i=>i.button===button) || view.choices.some(i=>i.button===button) || view.feedback?.close.button===button ? "allowed" : "blocked";
    }
    const player = new HfrPlayer(canvas, {
      ...(isDatFeedback ? {
        onRuntimeActivated: (runtime: Runtime, actualDataSha256: string) => {
          datFeedback?.dispose();
          datFeedback = createDatL3FeedbackHost(runtime, {
            validatedDataSha256: actualDataSha256, seed: effectiveSeed,
            isCurrent: () => !disposed && playerRef.current === player && Boolean(lease && isPageSessionCurrent(lease)) && player.rt === runtime,
            onRequest: request => live.current.onLessonHostRequest?.(request),
          });
        },
        onSourceTick: () => datFeedback?.afterSourceUpdate(),
      } : {}),
      ...(isPractice ? {onRuntimeActivated:(runtime:Runtime,actualDataSha256:string)=>{
        if(meta.completionMode!=="activity" || !lease)throw Error("P009_ACTIVITY_RUNTIME_REQUIRED");
        const options={validatedDataSha256:actualDataSha256,seed:lease.seed,onRequest:(request:import("../lesson-host-contract").LessonHostRequest)=>live.current.onLessonHostRequest?.(request)};
        practice=isP010?new P010Product(runtime,options):new P009Product(runtime,options);
        practiceRef.current=practice;
      }} : {}),
      ...((meta.sourceGlossary || isPractice) ? {sourceButtonInput: (runtime: Runtime, button: DisplayObject, point: readonly [number, number] | null) => {
        if(isPractice)return practiceSourceInput(runtime,button,point);
        if (!meta.sourceGlossary?.terms.some(term => term.sourceButtonCharacterId === button.charId)) return "unhandled" as const;
        return sourceControl(runtime, button, point) ? "allowed" as const : "blocked" as const;
      },
      onSourceButtonRelease: (runtime: Runtime, button: DisplayObject, point: readonly [number, number], release: () => void) => {
        if(isPractice){
          if(practiceSourceInput(runtime,button,point)!=="allowed")return;
          const main=practice!.mainGlossary().find(i=>i.button===button);
          try{
            if(main){const result=practice!.releaseMainGlossary(main,()=>{player.runSourceButtonRelease(runtime,button,point,release);});if(result)openPracticeGlossary(result.request,result.clip,result.frame,result.resumeSource,canvas);}
            else player.runSourceButtonRelease(runtime,button,point,release);
            if(live.current.reducedMotion && !glossaryHold.current)settlePracticeReducedMotion(runtime,practice!);
            player.redraw();
          }catch(error){player.destroy();player.opts.onError?.(error);}
          return;
        }
        const control = sourceControl(runtime, button, point);
        if (control) executeGlossary(runtime, control, canvas, point, release);
      }} : {}),
      onError: (error) => {
        if (disposed || playerRef.current !== player) return;
        committedNative.current = null;
        committedPractice.current = null;
        glossaryHold.current = null;
        setGlossaryDenied(false);
        if(isPractice && practiceRef.current)setPracticeView(practiceRef.current.view(nativeIdentityRef.current));
        for (const host of [nativeProseHost.current, nativeLabelsHost.current]) if (host) host.style.visibility = "hidden";
        setNativeFrame(null);
        datFeedback?.dispose();datFeedback=null;
        practice?.dispose();practiceRef.current=null;setPracticeView(null);
        setFailureCode(hfrSessionFailureCode(error));
        setStatus("failed");
      },
      onBeforeRender: () => {
        if (disposed || playerRef.current !== player) return;
        const runtime = player.rt;
        if(runtime && committedPractice.current && isPracticeNativeCurrent(committedPractice.current,runtime,nativeIdentityRef.current))return;
        committedPractice.current=null;
        // RAF/resize may repaint without a source tick. Keep the committed DOM
        // until its exact source state or identity actually becomes stale.
        if (runtime && committedNative.current &&
            nativeInputs() === projectedInputs &&
            isHfrNativeTextFrameCurrent(committedNative.current, runtime, nativeIdentityRef.current)) return;
        committedNative.current = null;
        for (const host of [nativeProseHost.current, nativeLabelsHost.current]) if (host) host.style.visibility = "hidden";
      },
      shouldSuppressText: (runtime, object) => suppressPracticeNative(committedPractice.current,runtime,object,nativeIdentityRef.current) || Boolean(committedNative.current &&
        shouldSuppressHfrOriginalText(committedNative.current, runtime, object, nativeIdentityRef.current)),
      onHost: (call) => {
        if (disposed || playerRef.current !== player || !lease || !isPageSessionCurrent(lease)) return;
        if (call.kind === "shell.DoHyperLinks") {
          if (!pendingGlossary || !player.rt) return;
          pendingGlossary.release.sourceKeyAttribute = player.rt.Global.get("KeyAttribute");
          const selected = bridgeHostCall(meta, call, pendingGlossary.release);
          if (selected.kind === "request") pendingGlossary.action = selected;
          return; // Finish the source's following stop() before asking the host.
        }
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
      onTick: () => {
        if (disposed) return;
        if (preparedNative && player.rt && nativeText) {
          const inputs = nativeInputs();
          if (!projectedNative || inputs !== projectedInputs ||
              !isHfrNativeTextFrameCurrent(projectedNative, player.rt, nativeIdentityRef.current)) {
            const sourceTickChanged = projectedNative !== null && projectedNative.tick !== player.rt.tickCount;
            projectedNative = buildHfrNativeTextFrame(preparedNative, player.rt, nativeText.frameDomain, nativeIdentityRef.current);
            projectedInputs = inputs;
            // A real source tick runs outside React's effects. Commit its new
            // guarded words before that RAF paints; prop/effect redraws stay async.
            if (sourceTickChanged) flushSync(() => setNativeFrame(projectedNative));
            else setNativeFrame(projectedNative);
          }
        }
        if(practiceCurrent()){
          const view=practice!.view(nativeIdentityRef.current),key=JSON.stringify([view.native?.tick,view.state,view.prompt,view.mainGlossary.map(i=>i.button.charId)]);
          if(key!==lastPracticeKey || !projectedPractice || !isPracticeNativeCurrent(projectedPractice,practice!.runtime,nativeIdentityRef.current)){const sourceTickChanged=projectedPractice!==null && projectedPractice.tick!==view.native?.tick;projectedPractice=view.native;lastPracticeKey=key;if(sourceTickChanged)flushSync(()=>setPracticeView(view));else setPracticeView(view);}
        }
        report();
      },
      onMediaStateChange: report,
    });
    playerRef.current = player;
    const resizeCanvasAndNativePlane = () => {
      player.resize();
      const fit = p010NativePlaneFit(isP010, canvas, meta.stage);
      if (fit && nativeLabelsHost.current) Object.assign(nativeLabelsHost.current.style, fit);
    };
    activatePractice.current=(intent,trigger,frame)=>{
      if(!practiceInputAllowed()||!trigger.isConnected||frame!==committedPractice.current||!isPracticeNativeCurrent(frame,practice!.runtime,nativeIdentityRef.current))return;
      const runtime=practice!.runtime;
      try{
        if(!("kind" in intent)){
          const result=practice!.releaseMainGlossary(intent,()=>{player.runSourceButtonRelease(runtime,intent.button,null,()=>runtime.click(intent.button));});
          if(result)openPracticeGlossary(result.request,result.clip,result.frame,result.resumeSource,trigger);
        }else if(intent.kind==="answer")player.runSourceButtonRelease(runtime,intent.button,null,()=>{practice!.adapter.choose(intent);});
        else if(intent.kind==="wrong-close")player.runSourceButtonRelease(runtime,intent.button,null,()=>{practice!.adapter.closeWrong(intent);});
        else{
          const request=practice!.adapter.releaseFeedbackLink(intent),main=practice!.main();
          if(request&&main)openPracticeGlossary(request,main,main.frame,false,trigger);
        }
        if(live.current.reducedMotion && !glossaryHold.current)settlePracticeReducedMotion(runtime,practice!);
        player.redraw();
      }catch(error){player.destroy();player.opts.onError?.(error);}
    };
    activateGlossary.current = (intent) => {
      const runtime = player.rt;
      if (consumedGlossaryIntents.has(intent) || !runtime || committedNative.current !== intent.frame ||
          !isHfrNativeTextFrameCurrent(intent.frame, runtime, nativeIdentityRef.current) ||
          !isHfrNativeTextFrameCurrent(intent.frame, runtime, intent.identity) ||
          !(intent.frame.styledSentence?.controls.includes(intent.control) || intent.frame.vocabularyControls?.includes(intent.control))) return;
      consumedGlossaryIntents.add(intent);
      executeGlossary(runtime, intent.control, intent.trigger, null, () => runtime.click(intent.control.liveButton));
    };
    glossaryHold.current = null;
    setGlossaryDenied(false);
    setStatus("loading");
    setFailureCode(null);
    setNativeFrame(null);
    setPracticeView(null);
    committedNative.current = null;
    (async () => {
      if (!rendererLessonSession) throw new HfrSessionError("HFR_SESSION_HOST_SCOPE_MISSING");
      lease = beginPageSession({hostScope: rendererLessonSession, lessonKey: meta.lessonKey, pageKey: meta.key, sourceSha256: meta.sourceSha256, compiler: meta.compiler, seed: effectiveSeed}, () => new LessonRuntime());
      const response = await fetch(meta.dataUrl);
      if (!response.ok) throw new Error(`HFR page data ${response.status}`);
      const bytes = await response.arrayBuffer();
      const dataSha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(byte=>byte.toString(16).padStart(2,"0")).join("");
      let data = JSON.parse(new TextDecoder().decode(bytes)) as PageData;
      if (disposed) return;
      assertHfrMetaMatchesData(meta, data);
      data = resolvePageSessionData(lease, data, page, dataSha256);
      validatedDataSha256 = dataSha256;
      if (nativeText) preparedNative = await prepareHfrNativeTextAsync(data, nativeText.sourceCatalog, nativeText.binding, nativeText.sourceDecisions);
      if (disposed) return;
      const loaded = await player.load(data, page, meta.dataUrl.replace(/[^/]*$/u, ""), {
        audio: audioEnabled,
        replay,
        reducedMotionState,
        session: lease,
        dataSha256,
        progressTimeline: meta.progressTimeline,
        seed: lease.seed,
      });
      if (disposed || !loaded) return;
      if(isPractice){
        const activePractice=practiceRef.current;if(!activePractice || activePractice.runtime!==player.rt)throw Error("P009_ACTIVE_LEASE_ADAPTER_REQUIRED");
        await activePractice.prepareNative(dataSha256);
        if(disposed || playerRef.current!==player || !lease || !isPageSessionCurrent(lease) ||
            practiceRef.current!==activePractice || !Object.is(practice,activePractice) || activePractice.runtime!==player.rt ||
            !activePractice.adapter.snapshot().current)return;
        lastPracticeKey="";projectedPractice=null;
        player.redraw();
      }
      resizeCanvasAndNativePlane();
      player.setVolume(live.current.volume);
      player.setSpanish(live.current.narrationLanguage === "es");
      if (narrationIntent.current === "stop") player.stopNarration();
      setStatus("ready");
      if (!live.current.paused && !live.current.reducedMotion && !document.hidden) player.start();
      report();
    })().catch((error: unknown) => {
      if (!disposed) {datFeedback?.dispose();datFeedback=null;practice?.dispose(); if(isPractice){practiceRef.current=null;setPracticeView(null);player.destroy();} setFailureCode(hfrSessionFailureCode(error)); setStatus("failed");}
    });
    const resize = new ResizeObserver(resizeCanvasAndNativePlane);
    resize.observe(canvas);
    return () => {
      disposed = true;
      activateGlossary.current = null;
      datFeedback?.dispose();datFeedback=null;
      activatePractice.current=null;committedPractice.current=null;practice?.dispose();
      if(practiceRef.current===practice)practiceRef.current=null;
      glossaryHold.current = null;
      committedNative.current = null;
      for (const host of [nativeProseHost.current, nativeLabelsHost.current]) if (host) host.style.visibility = "hidden";
      resize.disconnect();
      if (isP010 && nativeLabelsHost.current) Object.assign(nativeLabelsHost.current.style,
        {inset: "0px", width: "", height: ""});
      player.destroy();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [audioEnabled, meta, page, effectiveSeed, replay, rendererLessonSession, nativeText, reducedMotionState, isPractice,isP010,isDatFeedback]);

  const resumeHeldSource = (hold:NonNullable<typeof glossaryHold.current>) => {
    const practice=practiceRef.current;
    if(practice && (practice.runtime!==hold.runtime || practice.main()!==hold.clip))return false;
    if(practice instanceof P010Product)return practice.resumeHeldSource(hold);
    return resumeHfrGlossarySource(hold.runtime,{...hold,resumeSource:hold.resumeSource && (!practice || practice.adapter.mayResumeMainSource())});
  };
  useEffect(() => {
    const player = playerRef.current;
    if (!player || status !== "ready") return;
    const hold = glossaryHold.current;
    if (hold) {
      if ((isPractice ? actualHostPaused : paused && !reducedMotion) && !document.hidden) hold.hostPauseObserved = true;
      if ((isPractice ? !actualHostPaused : !paused && !reducedMotion) && !document.hidden && hold.hostPauseObserved && player === hold.player && player.rt === hold.runtime) {
        if (!resumeHeldSource(hold)) {player.pause(); return;}
        glossaryHold.current = null;
        setGlossaryDenied(false);
        if(isPractice && practiceRef.current)setPracticeView(practiceRef.current.view(nativeIdentityRef.current));
      } else {player.pause(); return;}
    }
    if (paused || reducedMotion || document.hidden) player.pause();
    else player.start();
  }, [paused,actualHostPaused,reducedMotion,status,isPractice]);

  useEffect(() => {
    if (status === "ready") playerRef.current?.setVolume(volume);
  }, [status, volume]);

  useEffect(() => {
    if (status === "ready") playerRef.current?.setSpanish(narrationLanguage === "es");
  }, [narrationLanguage, status]);

  useEffect(() => {
    const player = playerRef.current;
    if (!narrationRequest) return;
    if (narrationRequest.requestId === lastNarrationRequest.current) return;
    if (narrationRequest.action === "stop") {
      narrationIntent.current = "stop";
      lastNarrationRequest.current = narrationRequest.requestId;
      player?.stopNarration();
      return;
    }
    if (!player || status !== "ready") return;
    lastNarrationRequest.current = narrationRequest.requestId;
    if (!live.current.paused && !live.current.reducedMotion && !document.hidden && !glossaryHold.current) {
      narrationIntent.current = "play";
      void player.resumeAudio();
    }
  }, [narrationRequest, status]);

  // A hidden tab stops ticks and sound; the host's own pause state decides what happens on return.
  useEffect(() => {
    const onVisibility = () => {
      const player = playerRef.current;
      if (!player || status !== "ready") return;
      if (document.hidden) player.pause();
      else if (!live.current.paused && !live.current.reducedMotion && !glossaryHold.current) player.start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [status]);


  const onGlossaryActivate = useCallback((intent: HfrNativeGlossaryIntent) => activateGlossary.current?.(intent), []);
  const resumeDeniedGlossary = () => {
    const hold = glossaryHold.current, player = playerRef.current;
    if (!glossaryDenied || !hold || player !== hold.player || player.rt !== hold.runtime ||
        (isPractice ? live.current.hostPaused : live.current.paused || live.current.reducedMotion) || document.hidden) return;
    if (!resumeHeldSource(hold)) return;
    glossaryHold.current = null;
    setGlossaryDenied(false);
    player.start();
  };

  const commitPracticeFrame = useCallback((frame:PracticeNativeFrame|null)=>{
    const player=playerRef.current,current=frame && player?.rt && isPracticeNativeCurrent(frame,player.rt,nativeIdentityRef.current)?frame:null;
    committedPractice.current=current;
    for(const host of [nativeProseHost.current,nativeLabelsHost.current])if(host)host.style.visibility=current?"visible":"hidden";
    if(player?.rt)player.renderer.render(player.rt);
  },[]);
  const commitNativeFrame = useCallback((frame: HfrNativeTextFrame | null) => {
    const player = playerRef.current;
    const current = frame && player?.rt && isHfrNativeTextFrameCurrent(frame, player.rt, nativeIdentityRef.current) ? frame : null;
    committedNative.current = current;
    for (const host of [nativeProseHost.current, nativeLabelsHost.current]) if (host) host.style.visibility = current ? "visible" : "hidden";
    // React has committed these words. Repaint glyph suppression without ticking.
    if (player?.rt) player.renderer.render(player.rt);
  }, []);
  useEffect(() => {playerRef.current?.redraw();}, [nativeIdentity]);

  // P012 keeps source glyph advances while native text grows with the root font.
  // Its 44px captions need more room than the generic 50rem figure at root 32.
  const figureMinWidth = meta.key === "shared-nms002-l11-p012" &&
    meta.sourceSha256 === "6a374691151f299737f718a17921db4d50b68040c6516df1d779279f17a002a5"
    ? "60rem" : "50rem";
  const figure = (
      <div className="hfr-canvas-plane" style={{position: "relative",...((isPractice || nativeText?.sourceDecisions?.vocabulary) ? {minWidth:figureMinWidth,width:`max(100%, ${figureMinWidth})`} : {})}}>
      <canvas
        aria-label={language === "es" ? "Página de la lección" : "Lesson page"}
        className="faithful-stage"
        data-canvas-status={status === "ready" ? "ready" : status === "failed" ? "failed" : "loading"}
        height={meta.stage.height}
        ref={canvasRef}
        tabIndex={paused || reducedMotion ? -1 : 0}
        width={meta.stage.width}
      />
      {(nativeText || isPractice) ? <div ref={nativeLabelsHost} className="hfr-native-text-label-plane"
        style={{position: "absolute", inset: 0, visibility: "hidden", pointerEvents: "none"}} /> : null}
      </div>
  );
  return (
    <div
      ref={diagnosticHost}
      className="faithful-stage-wrap hfr-stage"
      data-hfr-page={meta.key}
      data-hfr-native-text-status={isPractice ? practiceView?.native?.snapshot.status ?? "loading" : nativeText ? nativeFrame?.snapshot.status ?? "loading" : "absent"}
      data-hfr-typography-technical={isPractice ? practiceView?.native?.snapshot.status === "ready" ? "candidate" : "pending" : nativeText ? nativeFrame?.typographyTechnicalStatus ?? "pending" : "absent"}
      style={{position: "relative"}}
      data-hfr-session-error={failureCode ?? undefined}
      data-hfr-source-presentation={reducedMotionState ? "audited-readable-static-state" : "source-clock"}
      data-hfr-compiler={meta.compiler}
      data-hfr-seed={effectiveSeed}
      data-hfr-source-sha256={meta.sourceSha256}
    >
      {isPractice ? <div ref={nativeProseHost} style={{visibility:"hidden"}}>{practiceView ? isP010?<P010NativePractice view={practiceView as P010ProductView} blocked={actualHostPaused || Boolean(glossaryHold.current)} labelsHost={nativeLabelsHost.current} onCommitted={commitPracticeFrame} onActivate={(intent,trigger,frame)=>activatePractice.current?.(intent,trigger,frame)} />:<P009NativePractice view={practiceView as P009ProductView} blocked={actualHostPaused || Boolean(glossaryHold.current)} labelsHost={nativeLabelsHost.current} onCommitted={commitPracticeFrame} onActivate={(intent,trigger,frame)=>activatePractice.current?.(intent,trigger,frame)} /> : null}</div> : null}
      {nativeText ? <div ref={nativeProseHost} className="hfr-native-text-flow" style={{visibility: "hidden"}} /> : null}
      {(isPractice || nativeText?.sourceDecisions?.vocabulary) ? <div data-hfr-vocabulary-figure-scroll="true" style={{overflowX:"auto",maxWidth:"100%",width:"100%"}}>{figure}</div> : figure}
      {nativeText && nativeFrame && playerRef.current?.rt ?
        <HfrNativeTextLayer frame={nativeFrame} runtime={playerRef.current.rt} identity={nativeIdentity}
          proseHost={nativeProseHost.current} labelsHost={nativeLabelsHost.current} onCommitted={commitNativeFrame} onGlossaryActivate={onGlossaryActivate} /> : null}
      {glossaryDenied ? <p role="status">{language === "es" ? "El glosario no está disponible. " : "The glossary is unavailable. "}
        <button type="button" onClick={resumeDeniedGlossary} disabled={isPractice ? actualHostPaused : paused || reducedMotion}>
          {language === "es" ? "Continuar animación" : "Continue animation"}
        </button></p> : null}
      {status === "failed" ? (
        <p className="runtime-unavailable" role="alert">
          {language === "es" ? "Esta página no se pudo cargar." : "This page could not be loaded."}
        </p>
      ) : null}
    </div>
  );
}

export function HfrRenderer(props:HfrRendererProps){
  if(props.meta.key==="shared-nms002-l11-p020" && props.meta.sourceSha256==="4f3da6d49a2281938ea9a064eb6376a961ba705654f96b11633c7e4ae8990f59")return <P020Renderer {...props}/>;
  if(props.meta.key==="shared-nms002-l11-p019" && props.meta.sourceSha256==="2953b69c2fd544e580eda2a87153e2010177f83a229e67e0d07824b7bcdb209d")return <P019Renderer {...props}/>;
  if(props.meta.key==="shared-nms002-l11-p014" && props.meta.sourceSha256==="9d79c185ac136146d1106d8f9082707646d2f0b3990d739ee06a00bac73a6092")return <P014Renderer {...props}/>;
  return <DefaultHfrRenderer {...props}/>;
}
