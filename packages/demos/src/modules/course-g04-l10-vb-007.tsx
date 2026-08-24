"use client";

import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {
  AnimationRendererProps,
  AudioCue,
  AudioTrack,
  InteractiveAudioAsset,
} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_VB_007_CONFIG,
  COURSE_G04_L10_VB_007_SOURCE,
} from "../timelines/course-g04-l10-vb-007";

const CALIBRATION_ID = "g4-l10-candidate-to-product-v25";
const INTERACTION_ID = "identify-width-arrow";
const QUIZ_STOP_FRAME = 61;
const CORRECT_CONTINUATION_FIRST_FRAME = 62;
const CORRECT_TERMINAL_FRAME = 130;
const SOURCE_FPS = 12;

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L10_VB_007_CONFIG);

export const COURSE_G04_L10_VB_007_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "rectangle",
    sourceKeyAttribute: "Rectangle",
    sourceCharacterId: 10,
    sourceFirstPlacementFrame: 1,
    productFirstVisibleFrame: QUIZ_STOP_FRAME,
    labels: Object.freeze({en: "Rectangle", es: "Rectángulo"}),
  }),
  Object.freeze({
    id: "width",
    sourceKeyAttribute: "Width",
    sourceCharacterId: 9,
    sourceFirstPlacementFrame: 1,
    productFirstVisibleFrame: QUIZ_STOP_FRAME,
    labels: Object.freeze({en: "Width", es: "Anchura"}),
  }),
] as const);

export const COURSE_G04_L10_VB_007_WRONG_FEEDBACK = Object.freeze({
  sourceText: "The width is usually the shorter measurement. Try again.",
  glossaryEntryIds: Object.freeze(["width", "measurement"]),
});

interface FeedbackBranch {
  readonly branchIndex: number;
  readonly frameCount: number;
  readonly instanceName: string;
  readonly sourceTimelineId: string;
  readonly audioAssetId: string;
}

export const COURSE_G04_L10_VB_007_WRONG_BRANCHES: readonly FeedbackBranch[] = Object.freeze([
  Object.freeze({branchIndex: 1, frameCount: 28, instanceName: "Mc_Wrong_Feed1", sourceTimelineId: "sprite-73", audioAssetId: "vb007-wrong-1"}),
  Object.freeze({branchIndex: 2, frameCount: 28, instanceName: "Mc_Wrong_Feed2", sourceTimelineId: "sprite-84", audioAssetId: "vb007-wrong-2"}),
  Object.freeze({branchIndex: 3, frameCount: 31, instanceName: "Mc_Wrong_Feed3", sourceTimelineId: "sprite-96", audioAssetId: "vb007-wrong-3"}),
]);

export const COURSE_G04_L10_VB_007_RIGHT_BRANCHES: readonly FeedbackBranch[] = Object.freeze([
  Object.freeze({branchIndex: 1, frameCount: 28, instanceName: "Mc_Right_Feed1", sourceTimelineId: "sprite-172", audioAssetId: "vb007-right-1"}),
  Object.freeze({branchIndex: 2, frameCount: 31, instanceName: "Mc_Right_Feed2", sourceTimelineId: "sprite-122", audioAssetId: "vb007-right-2"}),
  Object.freeze({branchIndex: 3, frameCount: 28, instanceName: "Mc_Right_Feed3", sourceTimelineId: "sprite-139", audioAssetId: "vb007-right-3"}),
  Object.freeze({branchIndex: 4, frameCount: 33, instanceName: "Mc_Right_Feed4", sourceTimelineId: "sprite-160", audioAssetId: "vb007-right-4"}),
]);

export function resolveCourseG04L10Vb007FeedbackBranch(
  seed: number,
  outcome: "correct" | "incorrect",
): FeedbackBranch {
  const branches = outcome === "correct"
    ? COURSE_G04_L10_VB_007_RIGHT_BRANCHES
    : COURSE_G04_L10_VB_007_WRONG_BRANCHES;
  const normalizedSeed = Number.isSafeInteger(seed) ? seed >>> 0 : 0;
  return branches[normalizedSeed % branches.length]!;
}

const audioPath = (name: string, sha256: string) =>
  `/flash-assets/courses/course-g04-l10-vb-007/audio/${name}.mp3?sha256=${sha256}`;

export const COURSE_G04_L10_VB_007_PRIVATE_AUDIO_CUES: readonly AudioCue[] = Object.freeze([
  Object.freeze({
    id: "vb007-main",
    sourceCueId: "sprite-204-soundstream-11",
    frame: 10,
    endFrame: QUIZ_STOP_FRAME,
    frameDomain: "sprite-204",
    language: "en" as const,
    scenario: "source-static-frame",
    source: audioPath("main-timeline", "3ac4c7a2e3d153a3f39427b519de2bf3d87f5d4873fcd9d2c4a655ed6c7aabd6"),
    durationMs: 10057,
    sha256: "3ac4c7a2e3d153a3f39427b519de2bf3d87f5d4873fcd9d2c4a655ed6c7aabd6",
    spokenLanguage: "undetermined" as const,
  }),
]);

export const COURSE_G04_L10_VB_007_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] = Object.freeze([
  Object.freeze({
    id: "spanish-host-narration",
    language: "es" as const,
    label: "Audio en español",
    source: audioPath("spanish-host-narration", "af50406afceff38f9395907b0b059dbe980f60e5b14eead7d6e3832e51b10396"),
    durationMs: 11400,
    sha256: "af50406afceff38f9395907b0b059dbe980f60e5b14eead7d6e3832e51b10396",
    activation: "user" as const,
    visibleWhen: Object.freeze(["es" as const]),
    frameDomains: Object.freeze(["sprite-204"]),
    timelineBehavior: "pause-while-playing" as const,
  }),
]);

const interactiveAudio = (id: string, name: string, sha256: string): InteractiveAudioAsset => Object.freeze({
  id,
  language: "en" as const,
  source: audioPath(name, sha256),
  sha256,
});

export const COURSE_G04_L10_VB_007_INTERACTIVE_AUDIO_ASSETS: readonly InteractiveAudioAsset[] = Object.freeze([
  interactiveAudio("vb007-feedback-close", "feedback-close", "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38"),
  interactiveAudio("vb007-wrong-1", "wrong-1", "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1"),
  interactiveAudio("vb007-wrong-2", "wrong-2", "d7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0"),
  interactiveAudio("vb007-wrong-3", "wrong-3", "c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1"),
  interactiveAudio("vb007-right-1", "right-1", "ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8"),
  interactiveAudio("vb007-right-2", "right-2", "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b"),
  interactiveAudio("vb007-right-3", "right-3", "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7"),
  interactiveAudio("vb007-right-4", "right-4", "c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e"),
  interactiveAudio("vb007-main-continuation", "main-continuation", "55aea0a63242d214a9b5b828347236971fc7083334da945d45e31507f2cb56b2"),
]);

type PracticePhase = "idle" | "wrong-playing" | "wrong-awaiting-close" | "wrong-closing" | "right-playing" | "right-continuing" | "complete";

interface PracticeState {
  readonly phase: PracticePhase;
  readonly outcome: "correct" | "incorrect" | null;
  readonly branch: FeedbackBranch | null;
}

const INITIAL_PRACTICE_STATE: PracticeState = Object.freeze({phase: "idle", outcome: null, branch: null});
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function CompanionPortal({children, targetId}: {children: React.ReactNode; targetId?: string}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useClientLayoutEffect(() => {
    if (!targetId) return void setTarget(null);
    const element = document.getElementById(targetId);
    setTarget(element?.dataset.pageInteractionCompanionHost === "true" ? element : null);
  }, [targetId]);
  return target ? createPortal(children, target) : children;
}

function StagePortal({children, targetId}: {children: React.ReactNode; targetId?: string}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useClientLayoutEffect(() => {
    if (!targetId) return void setTarget(null);
    const element = document.getElementById(targetId);
    setTarget(element?.dataset.pageInteractionStageHost === "true" ? element : null);
  }, [targetId]);
  return target ? createPortal(children, target) : null;
}

function CourseG04L10Vb007PrivateRenderer(props: AnimationRendererProps) {
  const visualHostRef = useRef<HTMLDivElement>(null);
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onLessonHostRequestRef = useRef(props.onLessonHostRequest);
  const [canvasReady, setCanvasReady] = useState(false);
  const [continuationFrame, setContinuationFrame] = useState(1);
  const [requestStatus, setRequestStatus] = useState<"idle" | "accepted" | "blocked">("idle");
  const [practice, setPractice] = useState<PracticeState>(INITIAL_PRACTICE_STATE);

  const clearTimers = useCallback(() => {
    for (const timerId of timerIds.current) clearTimeout(timerId);
    timerIds.current = [];
  }, []);
  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timerId = setTimeout(() => {
      timerIds.current = timerIds.current.filter((value) => value !== timerId);
      callback();
    }, delayMs);
    timerIds.current.push(timerId);
  }, []);

  useEffect(() => {
    onLessonHostRequestRef.current = props.onLessonHostRequest;
  }, [props.onLessonHostRequest]);

  useEffect(() => {
    const host = visualHostRef.current;
    if (!host) return void setCanvasReady(false);
    const update = () => {
      const surface = host.querySelector<HTMLElement>('[data-candidate-status="source-static-engineering-not-strict"][data-canvas-status]');
      setCanvasReady(surface?.dataset.canvasStatus === "ready" || surface?.dataset.canvasStatus === "updating");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(host, {attributeFilter: ["data-canvas-status"], attributes: true, childList: true, subtree: true});
    return () => observer.disconnect();
  }, [props.replay]);

  useEffect(() => {
    clearTimers();
    setContinuationFrame(1);
    setPractice(INITIAL_PRACTICE_STATE);
    setRequestStatus("idle");
    onLessonHostRequestRef.current?.({type: "stop-audio"});
    onLessonHostRequestRef.current?.({type: "reset-practice-feedback", interactionId: INTERACTION_ID});
    return clearTimers;
  }, [clearTimers, props.replay]);

  const interactionVisible = (props.frameDomain ?? COURSE_G04_L10_VB_007_CONFIG.mainFrameDomain) === COURSE_G04_L10_VB_007_CONFIG.mainFrameDomain && props.scenario === "source-static-frame" && !props.entryStateSha256;
  const controlsReady = interactionVisible && canvasReady && Boolean(props.onLessonHostRequest);
  const quizReady = controlsReady && !props.paused && props.frame >= QUIZ_STOP_FRAME && practice.phase === "idle";
  const embeddedAudioRouted = props.audioEnabled === true && props.uiLanguage !== "es";

  const requestAudio = useCallback((cueId: string) => {
    if (!embeddedAudioRouted || !props.onLessonHostRequest) return;
    props.onLessonHostRequest({type: "stop-audio"});
    props.onLessonHostRequest({type: "play-audio", cueId});
  }, [embeddedAudioRouted, props.onLessonHostRequest]);

  const stopAudio = useCallback((cueId: string) => {
    if (!embeddedAudioRouted || !props.onLessonHostRequest) return;
    props.onLessonHostRequest({type: "stop-audio", cueId});
  }, [embeddedAudioRouted, props.onLessonHostRequest]);

  useEffect(() => {
    if (practice.phase !== "right-continuing" || props.paused) return;
    const timerId = setTimeout(() => {
      if (continuationFrame < CORRECT_TERMINAL_FRAME) {
        setContinuationFrame((frame) => Math.min(frame + 1, CORRECT_TERMINAL_FRAME));
        return;
      }
      stopAudio("vb007-main-continuation");
      setPractice((current) => current.phase === "right-continuing" ? {...current, phase: "complete"} : current);
    }, 1000 / SOURCE_FPS);
    return () => clearTimeout(timerId);
  }, [continuationFrame, practice.phase, props.paused, stopAudio]);

  const openGlossary = useCallback((entryId: string, trigger: HTMLButtonElement) => {
    if (!controlsReady || !props.onLessonHostRequest) return;
    const decision = props.onLessonHostRequest({type: "open-glossary", entryId}, {trigger});
    setRequestStatus(decision?.status === "allowed" ? "accepted" : "blocked");
  }, [controlsReady, props.onLessonHostRequest]);

  const chooseAnswer = useCallback((outcome: "correct" | "incorrect") => {
    if (!quizReady || !props.onLessonHostRequest) return;
    const branch = resolveCourseG04L10Vb007FeedbackBranch(props.seed, outcome);
    const decision = props.onLessonHostRequest({type: "record-practice-feedback", interactionId: INTERACTION_ID, outcome, branchIndex: branch.branchIndex, branchCount: outcome === "correct" ? COURSE_G04_L10_VB_007_RIGHT_BRANCHES.length : COURSE_G04_L10_VB_007_WRONG_BRANCHES.length});
    if (decision?.status !== "allowed") return void setRequestStatus("blocked");
    setRequestStatus("accepted");
    requestAudio(branch.audioAssetId);
    if (outcome === "incorrect") {
      setPractice({phase: "wrong-playing", outcome, branch});
      schedule(() => {
        stopAudio(branch.audioAssetId);
        setPractice({phase: "wrong-awaiting-close", outcome, branch});
      }, ((22 - 2) / SOURCE_FPS) * 1000);
      return;
    }
    setPractice({phase: "right-playing", outcome, branch});
    schedule(() => {
      stopAudio(branch.audioAssetId);
      setContinuationFrame(CORRECT_CONTINUATION_FIRST_FRAME);
      setPractice({phase: "right-continuing", outcome, branch});
      requestAudio("vb007-main-continuation");
    }, ((branch.frameCount - 2) / SOURCE_FPS) * 1000);
  }, [props.onLessonHostRequest, props.seed, quizReady, requestAudio, schedule, stopAudio]);

  const closeWrongFeedback = useCallback(() => {
    if (practice.phase !== "wrong-awaiting-close" || !practice.branch || !props.onLessonHostRequest) return;
    const branch = practice.branch;
    setPractice({...practice, phase: "wrong-closing"});
    requestAudio("vb007-feedback-close");
    schedule(() => {
      stopAudio("vb007-feedback-close");
      const decision = props.onLessonHostRequest?.({type: "reset-practice-feedback", interactionId: INTERACTION_ID});
      setRequestStatus(decision?.status === "allowed" ? "accepted" : "blocked");
      if (decision?.status === "allowed") setPractice(INITIAL_PRACTICE_STATE);
    }, ((branch.frameCount - 23) / SOURCE_FPS) * 1000);
  }, [practice, props.onLessonHostRequest, requestAudio, schedule, stopAudio]);

  const visibleGlossaryTerms = practice.phase === "idle" ? COURSE_G04_L10_VB_007_GLOSSARY_TERMS.filter(({productFirstVisibleFrame}) => props.frame >= productFirstVisibleFrame) : [];
  const renderFrame = practice.phase === "complete" ? CORRECT_TERMINAL_FRAME : practice.phase === "right-continuing" ? (props.reducedMotion ? CORRECT_TERMINAL_FRAME : continuationFrame) : Math.min(props.frame, QUIZ_STOP_FRAME);

  const glossaryButton = (entryId: string, label: string, sourceCharacterId?: number, sourceKeyAttribute?: string) => (
    <button data-source-character-id={sourceCharacterId} data-source-key-attribute={sourceKeyAttribute ?? label} disabled={!controlsReady || Boolean(props.paused)} key={`${entryId}:${label}`} onClick={(event) => openGlossary(entryId, event.currentTarget)} style={{background: "#fff4c7", border: "2px solid #86660e", borderRadius: 999, color: "#163e31", cursor: controlsReady && !props.paused ? "pointer" : "default", font: "700 .92rem system-ui, sans-serif", minHeight: 44, padding: "8px 14px"}} type="button">{label}</button>
  );

  const answerButtons = practice.phase === "idle" && props.frame >= QUIZ_STOP_FRAME ? (
    <div aria-label="Source answer handlers" style={{display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"}}>
      <button data-source-button-character-id="17" data-source-instance="AnsBtn1" disabled={!quizReady} onClick={() => chooseAnswer("incorrect")} style={{background: "white", border: "2px solid #315d4d", borderRadius: 12, minHeight: 48, padding: "10px 14px"}} type="button">{props.uiLanguage === "es" ? "Flecha vertical: 1 pulg." : "Vertical arrow: 1 in."}</button>
      <button data-source-button-character-id="18" data-source-instance="AnsBtn2" disabled={!quizReady} onClick={() => chooseAnswer("correct")} style={{background: "white", border: "2px solid #315d4d", borderRadius: 12, minHeight: 48, padding: "10px 14px"}} type="button">{props.uiLanguage === "es" ? "Flecha horizontal: 3 pulg." : "Horizontal arrow: 3 in."}</button>
    </div>
  ) : null;

  const controls = interactionVisible ? (
    <section aria-label={props.uiLanguage === "es" ? "Práctica: identificar la anchura" : "Practice: identify the width"} data-answer-handlers-enabled={quizReady ? "true" : "false"} data-audio-route={embeddedAudioRouted ? "embedded-en" : "host-es-or-muted"} data-current-js-controls-ready={controlsReady ? "true" : "false"} data-feedback-branch={practice.branch?.branchIndex ?? "none"} data-feedback-source-instance={practice.branch?.instanceName ?? "none"} data-feedback-source-timeline={practice.branch?.sourceTimelineId ?? "none"} data-legacy-reporting="blocked" data-page-interaction-companion-surface="g4-l10-vb007-practice" data-practice-phase={practice.phase} data-product-render-frame={renderFrame} data-source-main-quiz-stop-frame={QUIZ_STOP_FRAME} style={{background: "#f5fbf8", border: "1px solid #a4c5b4", borderRadius: 16, color: "#163e31", display: "grid", gap: 12, margin: "0 auto", maxWidth: 800, padding: 14}}>
      {visibleGlossaryTerms.length > 0 ? <div style={{alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8}}><strong>{props.uiLanguage === "es" ? "Palabras clave" : "Key words"}</strong>{visibleGlossaryTerms.map((term) => glossaryButton(term.id, term.labels[props.uiLanguage === "es" ? "es" : "en"], term.sourceCharacterId, term.sourceKeyAttribute))}</div> : null}
      {props.frame < QUIZ_STOP_FRAME ? <p aria-live="polite" style={{margin: 0}}>{props.uiLanguage === "es" ? "La explicación continúa hasta la pregunta." : "The explanation continues to the question."}</p> : null}
      {answerButtons}
      {practice.phase === "wrong-playing" ? <p aria-live="polite" style={{margin: 0}}>{props.uiLanguage === "es" ? "Preparando comentarios…" : "Preparing feedback…"}</p> : null}
      {practice.phase === "wrong-awaiting-close" || practice.phase === "wrong-closing" ? <div aria-live="assertive" data-source-popup="Mc_Feed_Popup" role="alert" style={{background: "#fff7df", border: "2px solid #9b6b13", borderRadius: 12, padding: 12}}><p style={{lineHeight: 1.7, margin: "0 0 10px"}}>The {glossaryButton("width", "width")} is usually the shorter {glossaryButton("measurement", "measurement")}. Try again.</p><button data-source-button-character-id="40" data-source-instance="BtnClose" disabled={practice.phase === "wrong-closing"} onClick={closeWrongFeedback} style={{background: "#194f3a", border: 0, borderRadius: 999, color: "white", minHeight: 44, padding: "8px 18px"}} type="button">{practice.phase === "wrong-closing" ? (props.uiLanguage === "es" ? "Restableciendo…" : "Resetting…") : (props.uiLanguage === "es" ? "Intentar de nuevo" : "Try again")}</button></div> : null}
      {practice.phase === "right-playing" ? <p aria-live="polite" role="status" style={{margin: 0}}>{props.uiLanguage === "es" ? "Correcto. Reproduciendo comentarios…" : "Correct. Playing feedback…"}</p> : null}
      {practice.phase === "right-continuing" ? <p aria-live="polite" role="status" style={{margin: 0}}>{props.uiLanguage === "es" ? `Correcto. Continuando la explicación: fotograma ${renderFrame} de ${CORRECT_TERMINAL_FRAME}.` : `Correct. Continuing the explanation: frame ${renderFrame} of ${CORRECT_TERMINAL_FRAME}.`}</p> : null}
      {practice.phase === "complete" ? <p aria-live="polite" role="status" style={{fontWeight: 700, margin: 0}}>{props.uiLanguage === "es" ? "Correcto. La flecha horizontal mide la anchura. Usa Repetir para practicar otra vez." : "Correct. The horizontal arrow measures the width. Use Replay to practice again."}</p> : null}
      {requestStatus === "blocked" ? <span aria-live="assertive" role="alert">{props.uiLanguage === "es" ? "La solicitud se cerró de forma segura." : "The page request failed closed."}</span> : null}
    </section>
  ) : null;

  const stageHandlers = interactionVisible && practice.phase === "idle" && props.frame >= QUIZ_STOP_FRAME ? (
    <div aria-label={props.uiLanguage === "es" ? "Flechas de respuesta" : "Answer arrows"} data-page-interaction-stage-surface="g4-l10-vb007-arrow-handlers" role="group" style={{inset: 0, pointerEvents: "none", position: "absolute"}}>
      <button aria-label={props.uiLanguage === "es" ? "Flecha vertical de 1 pulgada" : "Vertical 1 inch arrow"} data-source-button-character-id="17" data-source-instance="AnsBtn1" disabled={!quizReady} onClick={() => chooseAnswer("incorrect")} style={{background: "transparent", border: 0, height: "18%", left: "30%", pointerEvents: "auto", position: "absolute", top: "42%", width: "8%"}} type="button" />
      <button aria-label={props.uiLanguage === "es" ? "Flecha horizontal de 3 pulgadas" : "Horizontal 3 inch arrow"} data-source-button-character-id="18" data-source-instance="AnsBtn2" disabled={!quizReady} onClick={() => chooseAnswer("correct")} style={{background: "transparent", border: 0, height: "9%", left: "36%", pointerEvents: "auto", position: "absolute", top: "35%", width: "33%"}} type="button" />
    </div>
  ) : null;

  return (
    <div data-audio-acceptance="pending" data-behavior-parity-established="false" data-calibration-id={CALIBRATION_ID} data-complexity-lane="interactive-understood" data-private-current-js="true" data-random-branch-gate="closed-3-wrong-4-right" data-replay-engineering-gate="closed-reset-vector" data-source-actionscript-executed="false" data-spoken-language-accepted="false" data-strict-acceptance-effect="none" data-timeline-reachability-gate="closed-stop61-continuation62-terminal130" ref={visualHostRef} style={{margin: "0 auto", maxWidth: candidate.movie.stage.width}}>
      <candidate.Renderer {...props} frame={renderFrame} state={undefined} />
      <StagePortal targetId={props.pageInteractionStageTargetId}>{stageHandlers}</StagePortal>
      {controls ? <CompanionPortal targetId={props.pageInteractionCompanionTargetId}>{controls}</CompanionPortal> : null}
    </div>
  );
}

const privateModule = Object.freeze({
  ...candidate.module,
  playbackEndFrame: QUIZ_STOP_FRAME,
  lessonHost: Object.freeze({capabilities: Object.freeze(["audio", "glossary", "practice-feedback"] as const), legacyOperations: "blocked" as const, auditStorage: "memory-only" as const, storesPersonalData: false as const}),
  audioCues: COURSE_G04_L10_VB_007_PRIVATE_AUDIO_CUES,
  audioTracks: COURSE_G04_L10_VB_007_PRIVATE_AUDIO_TRACKS,
  interactiveAudioAssets: COURSE_G04_L10_VB_007_INTERACTIVE_AUDIO_ASSETS,
  maturity: "private-current-js" as const,
  Renderer: CourseG04L10Vb007PrivateRenderer,
});

export {COURSE_G04_L10_VB_007_SOURCE};
export const COURSE_G04_L10_VB_007_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb007Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb007FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb007CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L10Vb007Renderer = CourseG04L10Vb007PrivateRenderer;

export default privateModule;
