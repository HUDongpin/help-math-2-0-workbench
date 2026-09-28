"use client";

import React, {useEffect, useMemo, useState} from "react";

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from "../contract";
import {COURSE_G04_L11_TS_002_AUTHORITY, COURSE_G04_L11_TS_002_MOVIE,
  COURSE_G04_L11_TS_002_RUNTIME, COURSE_G04_L11_TS_002_SOURCE,
  getCourseG04L11Ts002FrameState,
  type CourseG04L11Ts002FrameState} from "../timelines/course-g04-l11-ts-002";

const ANIMATION_ID = "course-g04-l11-ts-002";
const UI_FONT = '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, system-ui, sans-serif';
type GlossaryTerm = "Restate" | "question" | "problem";

const GLOSSARY = Object.freeze({
  Restate: Object.freeze({
    en: "Say or write something again in a different way.",
    es: "Decir o escribir algo otra vez de una manera diferente.",
    sourceButtonObjectId: 16,
  }),
  question: Object.freeze({
    en: "A sentence that asks for information or an answer.",
    es: "Una oración que pide información o una respuesta.",
    sourceButtonObjectId: 17,
  }),
  problem: Object.freeze({
    en: "A math situation or question that needs to be solved.",
    es: "Una situación o pregunta matemática que necesita resolverse.",
    sourceButtonObjectId: 23,
  }),
});

function isFrameState(value: unknown): value is CourseG04L11Ts002FrameState {
  return Boolean(value && typeof value === "object" && "phase" in value &&
    "frameDomain" in value && "status" in value);
}

function TermButton({term, onOpen}: {term: GlossaryTerm;
  onOpen: (term: GlossaryTerm, trigger: HTMLButtonElement) => void}) {
  return <button className="ts002-term" data-source-button-object-id={GLOSSARY[term].sourceButtonObjectId}
    data-source-glossary-term={term} onClick={(event) => onOpen(term, event.currentTarget)}
    type="button">{term}</button>;
}

function PlanGrid({showStepOne}: {showStepOne: boolean}) {
  return <ol aria-label="Four-step plan; only step 1 is authored on this page"
    className="ts002-plan">
    {[1, 2, 3, 4].map((step) => <li data-authored-content={step === 1 && showStepOne}
      key={step}><span>{step}.</span>{step === 1 && showStepOne ?
        <strong>Restate the question.</strong> : <span aria-label={`Step ${step} is empty`} />}</li>)}
  </ol>;
}

export function CourseG04L11Ts002Renderer(props: AnimationRendererProps) {
  const state = isFrameState(props.state) ? props.state :
    getCourseG04L11Ts002FrameState(props.frame, {frame: props.frame,
      frameDomain: props.frameDomain, rootFrame: props.rootFrame,
      scenario: props.scenario, lang: props.lang, seed: props.seed,
      replay: props.replay});
  const uiLanguage = props.uiLanguage ?? props.lang;
  const es = uiLanguage === "es";
  const [glossaryTerm, setGlossaryTerm] = useState<GlossaryTerm | null>(null);
  const [glossaryTrigger, setGlossaryTrigger] = useState<HTMLButtonElement | null>(null);
  useEffect(() => { setGlossaryTerm(null); setGlossaryTrigger(null); }, [props.replay]);
  const openGlossary = (term: GlossaryTerm, trigger: HTMLButtonElement) => {
    setGlossaryTrigger(trigger); setGlossaryTerm(term);
  };
  const closeGlossary = () => { setGlossaryTerm(null);
    window.requestAnimationFrame(() => glossaryTrigger?.focus()); };
  useEffect(() => {
    if (!glossaryTerm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeGlossary(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [glossaryTerm, glossaryTrigger]);
  const sourcePhaseOpacity = useMemo(() => state.phase.endsWith("enter") ?
    Math.max(.18, state.phaseProgress) : 1, [state.phase, state.phaseProgress]);

  if (state.status === "blocked") return <section aria-live="polite"
    className="course-g04-l11-ts002-blocked" data-animation-id={ANIMATION_ID}
    data-blocker={state.blocker} role="status">
    <h2>{es ? "Esta vista no está disponible" : "This view is unavailable"}</h2>
    <p>{es ? "La solicitud no corresponde a la línea de tiempo fuente declarada." :
      "The request does not match the declared source timeline."}</p></section>;

  return <section aria-label={es ? "Plan de cuatro pasos, paso 1" : "Four-step plan, step 1"}
    className="course-g04-l11-ts002-candidate" data-animation-id={ANIMATION_ID}
    data-authoritative-original-runtime-evidence="false"
    data-current-js-functional-candidate="true"
    data-current-js-functional-scope="354-frame-step-one-sequence-three-modern-glossary-controls"
    data-animation-internal-pedagogical-controls-preserved="true"
    data-modern-glossary-control-count="3"
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain}
    data-flash-root-frame={state.rootFrame} data-legacy-course-shell-included="false"
    data-legacy-player-chrome-included="false" data-owner-accepted="false"
    data-registered-current-javascript="false" data-source-audio-enabled="false"
    data-source-audio-accepted="false" data-source-instruction-language="en"
    data-source-phase={state.phase} data-steps-two-through-four-empty="true"
    data-strict-acceptance-effect="none" data-strict-migration-complete="false">
    <header><h2>{es ? "Plan de 4 Pasos" : "4-Step Plan"}</h2>
      <p>{es ? "Esta página fuente enseña solamente el paso 1. El contenido de enseñanza permanece en el inglés original hasta que exista una traducción revisada." :
        "This source page teaches step 1 only. Steps 2–4 remain intentionally empty."}</p></header>
    <div className="ts002-stage">
      {!state.terminalCleared && state.stepHeadingVisible ? <div className="ts002-instruction"
        style={{opacity: sourcePhaseOpacity}}>
        <h3><span aria-hidden="true">1</span><TermButton term="Restate"
          onOpen={openGlossary} /> the <TermButton term="question" onOpen={openGlossary} />.</h3>
        {state.firstInstructionVisible ? <p><i aria-hidden="true" />Read the <TermButton
          term="problem" onOpen={openGlossary} /> and decide what the <TermButton
          term="question" onOpen={openGlossary} /> is asking.</p> : null}
        {state.secondInstructionVisible ? <p><i aria-hidden="true" />Write the question in your own words.</p> : null}
      </div> : <div aria-hidden="true" className="ts002-empty-instruction" />}
      <PlanGrid showStepOne={!state.terminalCleared && state.firstCellTextVisible} />
    </div>
    <p className="ts002-audio-boundary">{es ?
      "La narración fuente de 29.388 segundos aún no ha sido escuchada ni aprobada; esta candidata permanece en silencio." :
      "The 29.388-second source narration has not been listened to or accepted; this candidate remains silent."}</p>
    {glossaryTerm ? <div aria-modal="true" className="ts002-glossary"
      data-modern-definition-product-copy="true" role="dialog">
      <span>{es ? "Glosario" : "Glossary"}</span><h3>{glossaryTerm}</h3>
      <p>{GLOSSARY[glossaryTerm][uiLanguage]}</p>
      <p className="boundary">{es ? "Definición moderna; no ejecuta el enlace Flash antiguo." :
        "Modern definition; the legacy Flash hyperlink is not executed."}</p>
      <button autoFocus onClick={closeGlossary} type="button">{es ? "Cerrar" : "Close"}</button>
    </div> : null}
    <style>{`
      .course-g04-l11-ts002-candidate{background:linear-gradient(145deg,#e8f6ff,#fffaf1);border:2px solid #276da7;border-radius:20px;box-sizing:border-box;color:#17395f;display:grid;font-family:${UI_FONT};gap:14px;margin:auto;max-width:800px;padding:18px;position:relative;width:100%}.course-g04-l11-ts002-candidate h2{font-size:clamp(26px,5vw,38px);margin:4px 0}.course-g04-l11-ts002-candidate header p,.course-g04-l11-ts002-candidate .ts002-audio-boundary{font-family:system-ui,sans-serif;line-height:1.4;margin:4px 0}
      .ts002-stage{background:#b8d8f7;border-radius:16px;display:grid;gap:10px;min-height:510px;padding:25px}.ts002-instruction{align-content:start;display:grid;gap:10px;min-height:190px}.ts002-instruction h3{align-items:center;display:flex;flex-wrap:wrap;font-size:clamp(21px,4vw,31px);gap:5px;margin:0}.ts002-instruction h3>span{align-items:center;background:#111;border-radius:999px;color:#fff;display:inline-flex;height:36px;justify-content:center;width:36px}.ts002-instruction p{align-items:flex-start;display:flex;flex-wrap:wrap;font-size:clamp(17px,3.2vw,24px);gap:5px;line-height:1.35;margin:0}.ts002-instruction p i{background:#e73935;border:1px solid #9f1717;border-radius:999px;display:inline-block;height:13px;margin:9px 9px 0 2px;width:13px}.ts002-empty-instruction{min-height:190px}.course-g04-l11-ts002-candidate .ts002-term{background:none;border:0;border-bottom:2px solid #0758ba;border-radius:0;color:#064bd2;cursor:pointer;font:inherit;line-height:1.1;min-height:36px;padding:0 2px}.course-g04-l11-ts002-candidate button:focus-visible{outline:4px solid #0758ba;outline-offset:3px}
      .ts002-plan{display:grid;grid-template-columns:1fr 1fr;list-style:none;margin:0;padding:0}.ts002-plan li{align-items:flex-start;background:#fff9f7;border:3px solid #ffad79;display:flex;font-size:clamp(18px,3vw,26px);gap:7px;min-height:112px;padding:14px}.ts002-plan li:nth-child(odd){border-right-width:2px}.ts002-plan li:nth-child(-n+2){border-bottom-width:2px}.ts002-plan li>span:first-child{color:#111}.ts002-plan strong{font-size:clamp(15px,2.5vw,22px);font-weight:700}.ts002-glossary button{background:linear-gradient(#fff5a6,#ffc435);border:2px solid #a64d00;border-radius:11px;color:#102b70;cursor:pointer;font:800 15px ${UI_FONT};min-height:48px;padding:9px 18px}.ts002-audio-boundary{color:#526b82;font-size:12px;text-align:center}
      .ts002-glossary{background:#fff;border:3px solid #1d73b3;border-radius:16px;box-shadow:0 16px 50px #17395f55;display:grid;gap:8px;left:50%;max-width:500px;padding:20px;position:absolute;top:24%;transform:translateX(-50%);width:min(86%,500px);z-index:5}.ts002-glossary>span{color:#0758ba;font-size:12px;font-weight:900;text-transform:uppercase}.ts002-glossary h3{font-size:30px;margin:0}.ts002-glossary p{font-family:system-ui,sans-serif;line-height:1.45;margin:0}.ts002-glossary .boundary{color:#526b82;font-size:12px}
      .course-g04-l11-ts002-blocked{background:#fff4ea;border:2px solid #b44a20;border-radius:16px;padding:20px}@media(max-width:600px){.course-g04-l11-ts002-candidate{padding:11px}.ts002-stage{min-height:470px;padding:13px}.ts002-instruction,.ts002-empty-instruction{min-height:220px}.ts002-plan{grid-template-columns:1fr}.ts002-plan li{border-width:2px!important;min-height:72px}}
    `}</style>
  </section>;
}

const module: AnimationModule<CourseG04L11Ts002FrameState> = Object.freeze({
  key: ANIMATION_ID, movie: COURSE_G04_L11_TS_002_MOVIE,
  runtime: COURSE_G04_L11_TS_002_RUNTIME, playbackMode: "once",
  playbackEndFrameByDomain: Object.freeze({root: 1, "sprite-27": 354}),
  reducedMotionFrame: 300,
  scenarios: Object.freeze([Object.freeze({id: "source-authored-step-1",
    label: "Authored step 1", description: "Exact 354-frame step-one source sequence"})]),
  defaultScenarioByFrameDomain: Object.freeze({root: "source-authored-step-1",
    "sprite-27": "source-authored-step-1"}), audioCues: Object.freeze([]),
  maturity: "legacy-prototype", Renderer: CourseG04L11Ts002Renderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG04L11Ts002FrameState(frame, context),
});

export {COURSE_G04_L11_TS_002_AUTHORITY, COURSE_G04_L11_TS_002_MOVIE,
  COURSE_G04_L11_TS_002_RUNTIME, COURSE_G04_L11_TS_002_SOURCE,
  getCourseG04L11Ts002FrameState};
export const COURSE_G04_L11_TS_002_SOURCE_CONTRACT = Object.freeze({
  animationId: ANIMATION_ID, source: COURSE_G04_L11_TS_002_SOURCE,
  authority: COURSE_G04_L11_TS_002_AUTHORITY,
  exactSourceInstructionText: Object.freeze(["Restate the question.",
    "Read the problem and decide what the question is asking.",
    "Write the question in your own words."]),
  sourceGlossaryTerms: Object.freeze(["Restate", "question", "problem"]),
  modernGlossaryDefinitionsAreProductCopyNotSourceRuntimeEvidence: true,
  registeredCurrentJavascript: false, strictAcceptanceEffect: "none",
});
export default module;
