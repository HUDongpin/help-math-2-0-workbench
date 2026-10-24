"use client";

import React, {type CSSProperties} from "react";
import type {AnimationRendererProps, RuntimeContext} from "../contract";
import type {LessonTextBinding, TextPresentationSnapshot} from "../lesson-text-contract";
import {LessonTextPresentation} from "../lesson-text-presentation";
import {buildLessonTextSnapshot} from "../lesson-text-snapshot";
import {
  COURSE_G05_L04_FQ_001_ANIMATION_ID,
  COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
  COURSE_G05_L04_FQ_001_SOURCE,
  getCourseG05L04Fq001FrameState,
  type CourseG05L04Fq001FrameState,
} from "../timelines/course-g05-l04-fq-001";

const sourceText = (character: number) => `character-${character}/run-0`;
export const reducedMotionFrameByDomain = Object.freeze({[COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN]: 52});
const NUMBER_LINE_VALUES = Object.freeze(Array.from({length: 19}, (_, index) => {
  const value = index - 9;
  return value < 0 ? `−${-value}` : value > 0 ? `+${value}` : "0";
}));

/** The entire maintained view is an explicit opt-in; the old module is untouched. */
export const binding: LessonTextBinding = Object.freeze({
  schemaVersion: 1,
  version: "g5-l4-fq001-modern-text-v1",
  placementId: "g05-l04-placement-052",
  animationId: COURSE_G05_L04_FQ_001_ANIMATION_ID,
  sourceSwfSha256: COURSE_G05_L04_FQ_001_SOURCE.swfSha256,
  template: "explanation",
  blocks: Object.freeze([
    {id: "final-quiz", sourceTextIds: [sourceText(143), sourceText(144)],
      role: "title", language: "en", readingOrder: 0, valueSource: "source-static"},
    {id: "whole-numbers-heading", sourceTextIds: [sourceText(126)],
      role: "heading", language: "en", readingOrder: 10, valueSource: "source-static"},
    {id: "whole-numbers", sourceTextIds: [sourceText(125)],
      role: "body", language: "en", readingOrder: 11, valueSource: "source-static"},
    {id: "decimal-heading", sourceTextIds: [sourceText(128)],
      role: "heading", language: "en", readingOrder: 20, valueSource: "source-static"},
    {id: "decimal-value", sourceTextIds: [sourceText(129)],
      role: "body", language: "en", readingOrder: 21, valueSource: "source-static"},
    {id: "fractions-heading", sourceTextIds: [sourceText(130)],
      role: "heading", language: "en", readingOrder: 30, valueSource: "source-static"},
    {id: "fraction-value", sourceTextIds: [sourceText(131), sourceText(132), sourceText(133)],
      role: "body", language: "en", readingOrder: 31, valueSource: "source-static"},
    {id: "number-line-heading", sourceTextIds: [sourceText(123)],
      role: "heading", language: "en", readingOrder: 40, valueSource: "source-static"},
    ...NUMBER_LINE_VALUES.map((_text, index) => ({
      id: `number-line-value-${index}`,
      sourceTextIds: index < 9 ? [sourceText(120 - index)] :
        index > 9 ? [sourceText(121 - index), sourceText(122)] : [],
      ...(index === 9 ? {sourceShapeIds: [121]} : {}),
      role: "label" as const, language: "en" as const,
      readingOrder: 41 + index, valueSource: "source-static" as const,
    })),
    {id: "graph-values", sourceTextIds: [138, 139, 140, 141, 142].map(sourceText),
      role: "body", language: "en", readingOrder: 70, valueSource: "source-static"},
  ] as const),
});

export const FQ001_SOURCE_ROLE_DECISIONS = Object.freeze({
  sourceCatalogContentSha256: "b43269879381402ba2541969b2c92bf37ff2b6da810efde739c49fd8232c0115",
  mainTimeline: "sprite-145",
  mainFrameRange: Object.freeze([1, 52] as const),
  sourceContextAlpha: 26 / 256,
  contextPresentation: "Maintain all primary mathematical values as readable foreground HTML/SVG instead of the constant low-opacity backdrop.",
  numberLineZero: Object.freeze({
    sourceShapeId: 121,
    sourceTagSha256: "763635c4c258cafb8306b5514ebca29af5df802f13986206c6ef77ba013dd17e",
    disposition: "Outlined zero between the negative and positive ticks, preserved as the real text 0.",
  }),
  numericFormatting: "Source en dashes become mathematical minus signs; comma spacing and ellipsis are typographic normalization only.",
  companion: Object.freeze({
    timelineId: "sprite-100", fixedFrame: 1,
    omittedSourceTextIds: Object.freeze([85, 87, 89, 91, 93, 95, 97, 99].map(id => `character-${id}`)),
    disposition: "Fixed decorative word cloud and quote, including its generic f(x)=mx+b motif, are omitted from the student layout. They are not the changing quiz title or primary mathematical examples.",
  }),
  duplicateTitle: "Source white shadow 143 and blue foreground 144 share one semantic Final Quiz heading.",
  titlePresentation: "Source alpha/scale remain evidence data. The modern title appears on the same first visible frame (2) at the full responsive title token and full contrast; it does not replay the source's small low-contrast tween.",
  sourceRiskDisposition: "Maintained source-role interpretation; original-runtime, human review, Owner and strict acceptance remain independent and unadvanced.",
});

// Exact alpha multipliers and quantized scales of sprite-145/depth-51, frames
// 1..20. Frame 20 persists through frame 52. No elapsed-time or CSS animation.
const TITLE_ALPHA_UNITS = Object.freeze([0, 13, 27, 40, 54, 67, 81, 94, 108, 121,
  135, 148, 162, 175, 189, 202, 216, 229, 243, 256]);
const TITLE_SCALES = Object.freeze([0.5, 0.5263214111328125, 0.552642822265625,
  0.578948974609375, 0.6052703857421875, 0.6315765380859375,
  0.65789794921875, 0.6842193603515625, 0.7105255126953125,
  0.736846923828125, 0.7631683349609375, 0.7894744873046875,
  0.8157958984375, 0.84210205078125, 0.8684234619140625,
  0.894744873046875, 0.921051025390625, 0.9473724365234375,
  0.97369384765625, 1]);

export function getFq001TitlePresentation(state: CourseG05L04Fq001FrameState) {
  if (state.status !== "ready") return Object.freeze({opacity: 0, scale: 0.5, visible: false});
  const index = Math.min(state.frame, 20) - 1;
  const opacity = TITLE_ALPHA_UNITS[index]! / 256;
  return Object.freeze({opacity, scale: TITLE_SCALES[index]!, visible: opacity > 0});
}

const CONTENT = Object.freeze({
  "final-quiz": "Final Quiz",
  "whole-numbers-heading": "Whole numbers",
  "whole-numbers": "0, 1, 2, 3, 4, … etc",
  "decimal-heading": "decimal numbers",
  "decimal-value": "0.23",
  "fractions-heading": "Fractions",
  "fraction-value": "1/4",
  "number-line-heading": "Number line",
  ...Object.fromEntries(NUMBER_LINE_VALUES.map((text, index) => [`number-line-value-${index}`, text])),
  "graph-values": "412, 498, 389, 602, 537",
});

export function getSnapshot(
  state: CourseG05L04Fq001FrameState,
  context: RuntimeContext,
): TextPresentationSnapshot {
  const expected = getCourseG05L04Fq001FrameState(context.frame, context);
  const identityMatches = Boolean(state && typeof state === "object" && state.animationId === expected.animationId &&
    state.sourceSwfSha256 === binding.sourceSwfSha256 && state.frame === expected.frame &&
    state.requestedFrame === expected.requestedFrame && state.frameDomain === expected.frameDomain &&
    state.scenario === expected.scenario && state.language === expected.language &&
    state.seed === expected.seed && state.rootFrame === expected.rootFrame &&
    state.exportFrame === expected.exportFrame &&
    state.primaryFrameDomain === expected.primaryFrameDomain &&
    state.fixedCompanionFrameDomain === expected.fixedCompanionFrameDomain &&
    state.fixedCompanionFrame === expected.fixedCompanionFrame &&
    state.sourceStaticCompositeReady === expected.sourceStaticCompositeReady &&
    (context.rootFrame === undefined || context.rootFrame === 6));
  const title = getFq001TitlePresentation(expected);
  const snapshot = buildLessonTextSnapshot(binding, {...context,
    frameDomain: expected.frameDomain, rootFrame: 6, seed: expected.seed,
  }, Object.fromEntries(Object.entries(CONTENT).map(([id, text]) => [id, {
    text, visible: id === "final-quiz" ? title.visible : true,
  }])));
  if (!identityMatches || state.status !== "ready" || expected.status !== "ready") {
    return Object.freeze({...snapshot, status: "blocked", blocks: Object.freeze([]),
      suppressedInstances: Object.freeze([]), blockers: Object.freeze([
        state?.blocker ?? expected.blocker ?? "runtime-state-identity-mismatch",
      ])});
  }
  return snapshot;
}

function subset(snapshot: TextPresentationSnapshot, ids: readonly string[]) {
  return {...snapshot, blocks: snapshot.blocks.filter(block => ids.includes(block.id))};
}

function value(snapshot: TextPresentationSnapshot, id: string) {
  const block = snapshot.blocks.find(block => block.id === id && block.visible);
  if (!block) throw new Error(`FQ001 is missing its source-bound ${id}`);
  return block.text;
}

const labelStyle: CSSProperties = {
  fontFamily: "var(--lesson-text-font-body)", fontSize: "1.125rem", fontWeight: 600,
};
const cardStyle: CSSProperties = {
  border: "1px solid #d4dfed", borderRadius: "0.875rem", padding: "1.25rem",
  minWidth: 0, background: "#ffffff", boxSizing: "border-box",
};

export function getFq001NumberLineValues(snapshot: TextPresentationSnapshot) {
  const blocks = snapshot.blocks.filter(block => block.id.startsWith("number-line-value-") && block.visible);
  const sourceBlocks = binding.blocks.filter(block => block.id.startsWith("number-line-value-"));
  if (snapshot.status !== "ready" || blocks.length !== 19 || sourceBlocks.length !== 19 ||
    new Set(blocks.map(block => block.id)).size !== 19 ||
    blocks.some((block, index) => block.id !== sourceBlocks[index]!.id || !block.text.trim())) {
    throw new Error("FQ001 requires nineteen ordered source-bound number-line values");
  }
  return Object.freeze(blocks.map((block, index) => Object.freeze({
    id: block.id, text: block.text,
    sourceTextIds: Object.freeze([...sourceBlocks[index]!.sourceTextIds]),
    sourceShapeIds: Object.freeze([...(sourceBlocks[index]!.sourceShapeIds ?? [])]),
  })));
}

function NumberLine({blocks}: {readonly blocks: ReturnType<typeof getFq001NumberLineValues>}) {
  const ticks = blocks.map(block => block.text);
  return <svg
    data-fq001-number-line="true"
    width="100%" height="112"
    style={{blockSize: "7rem", overflow: "visible"}}
    aria-label={ticks.join(", ")} lang="en"
  >
    <g aria-hidden="true" fill="none" strokeWidth="2" strokeLinecap="round">
      <line x1="1%" y1="35%" x2="50%" y2="35%" stroke="#b42318"/>
      <line x1="50%" y1="35%" x2="99%" y2="35%" stroke="#174ea6"/>
      <line x1="1%" y1="35%" x2="2.5%" y2="29%" stroke="#b42318"/>
      <line x1="1%" y1="35%" x2="2.5%" y2="41%" stroke="#b42318"/>
      <line x1="99%" y1="35%" x2="97.5%" y2="29%" stroke="#174ea6"/>
      <line x1="99%" y1="35%" x2="97.5%" y2="41%" stroke="#174ea6"/>
      {ticks.map((tick, index) => <line key={tick}
        x1={`${4 + index * 92 / 18}%`} x2={`${4 + index * 92 / 18}%`}
        y1="29%" y2="45%" stroke={index < 9 ? "#b42318" : "#174ea6"}/>) }
    </g>
    {ticks.map((tick, index) => <text key={tick}
      data-lesson-text-block={blocks[index]!.id} lang="en"
      x={`${4 + index * 92 / 18}%`} y="72%" textAnchor="middle"
      fill={index < 9 ? "#b42318" : "#14213d"} style={labelStyle}
    >{tick}</text>)}
  </svg>;
}

// Source shape-136 marker centers, normalized within source shape-134's chart.
// Preserve the original geometry and all five source labels; add no axis values.
const GRAPH_POINTS = Object.freeze([
  [890, -6293], [2425, -6745], [3978, -6173], [5512, -7303], [7058, -6961],
].map(([x, y]) => Object.freeze({
  x: 7 + (x! - 99) / (7824 - 99) * 86,
  y: 15 + (y! + 7851) / (7851 - 4118) * 65,
})));

export function getFq001GraphValues(snapshot: TextPresentationSnapshot) {
  const blocks = snapshot.blocks.filter(block => block.id === "graph-values" && block.visible);
  const sourceIds = binding.blocks.find(block => block.id === "graph-values")?.sourceTextIds ?? [];
  const labels = blocks.length === 1 ? blocks[0]!.text.split(", ") : [];
  if (snapshot.status !== "ready" || labels.length !== 5 || labels.some(text => !text.trim()) ||
    sourceIds.length !== 5 || new Set(sourceIds).size !== 5 ||
    sourceIds.some((id, index) => id !== sourceText(138 + index))) {
    throw new Error("FQ001 requires five ordered source-bound graph values");
  }
  return Object.freeze(sourceIds.map((sourceTextId, index) => Object.freeze({sourceTextId, text: labels[index]!})));
}

function SourceGraph({values}: {readonly values: ReturnType<typeof getFq001GraphValues>}) {
  const text = values.map(value => value.text).join(", ");
  return <svg data-fq001-source-graph="true" width="100%" height="192"
    style={{blockSize: "12rem", overflow: "visible"}} aria-label={text} lang="en">
    <g aria-hidden="true" strokeLinecap="round">
      <line x1="7%" y1="15%" x2="7%" y2="80%" stroke="#75869f" strokeWidth="1.5"/>
      <line x1="7%" y1="80%" x2="93%" y2="80%" stroke="#75869f" strokeWidth="1.5"/>
      {GRAPH_POINTS.slice(1).map((point, index) => <line key={index}
        x1={`${GRAPH_POINTS[index]!.x}%`} y1={`${GRAPH_POINTS[index]!.y}%`}
        x2={`${point.x}%`} y2={`${point.y}%`} stroke="#174ea6" strokeWidth="2.5"/>)}
      {GRAPH_POINTS.map((point, index) => <circle key={index}
        cx={`${point.x}%`} cy={`${point.y}%`} r="4" fill="#174ea6"/>)}
    </g>
    {/* A 10% baseline gap in the 12rem chart is 1.2rem for 1.125rem labels; source points stay unchanged. */}
    {GRAPH_POINTS.map((point, index) => <text key={index}
      data-lesson-text-block={`graph-values:${index}`} lang="en"
      x={`${point.x}%`} y={`${point.y - 10}%`} textAnchor="middle"
      fill="#14213d" style={labelStyle}
    >{values[index]!.text}</text>)}
  </svg>;
}

export function ModernRenderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {...props,
    frameDomain: props.frameDomain ?? COURSE_G05_L04_FQ_001_MAIN_FRAME_DOMAIN,
    rootFrame: props.rootFrame ?? 6,
  };
  const state = props.state === undefined
    ? getCourseG05L04Fq001FrameState(props.frame, context)
    : props.state as CourseG05L04Fq001FrameState;
  const snapshot = getSnapshot(state, context);
  if (snapshot.status !== "ready") return <section data-modern-lesson="g5-l4-fq001"
    data-presentation-status="blocked" data-presentation-blocker={snapshot.blockers.join(",")}/>;
  const title = getFq001TitlePresentation(state);
  const fraction = value(snapshot, "fraction-value").split("/");
  const graphValues = getFq001GraphValues(snapshot);
  const numberLineBlocks = getFq001NumberLineValues(snapshot);
  return <section className="lesson-text-presentation" lang="en"
    data-modern-lesson="g5-l4-fq001"
    data-presentation-status="candidate"
    data-source-swf-sha256={binding.sourceSwfSha256}
    data-source-context-alpha={FQ001_SOURCE_ROLE_DECISIONS.sourceContextAlpha}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain}
    data-flash-root-frame={state.rootFrame} data-flash-lang={state.language}
    data-flash-scenario={state.scenario} data-flash-seed={state.seed}
    data-replay={context.replay ?? 0}
    data-language-policy={props.uiLanguage === "es" ? "source-fallback" : "source"}
    data-spanish-translation="false" data-original-runtime-accepted="false"
    data-owner-accepted="false" data-strict-migration-complete="false"
    style={{display: "grid", gap: "1.25rem", maxWidth: "60rem", marginInline: "auto"}}
  >
    <div data-fq001-source-title-opacity={title.opacity} data-fq001-source-title-scale={title.scale}
      style={{minHeight: "3rem"}}>
      <LessonTextPresentation snapshot={subset(snapshot, ["final-quiz"])} template="explanation"/>
    </div>
    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13rem), 1fr))", gap: "1rem", minWidth: 0}}>
      <div style={cardStyle}>
        <LessonTextPresentation snapshot={subset(snapshot, ["whole-numbers-heading", "whole-numbers"])} template="explanation"/>
      </div>
      <div style={cardStyle}>
        <LessonTextPresentation snapshot={subset(snapshot, ["decimal-heading", "decimal-value"])} template="explanation"/>
      </div>
      <div style={cardStyle}>
        <LessonTextPresentation snapshot={subset(snapshot, ["fractions-heading"])} template="explanation"
          figureReadingOrder={31} figureLabel={value(snapshot, "fraction-value")}
          figure={React.createElement("math", {
            "data-lesson-text-block": "fraction-value", lang: "en", display: "inline",
            style: {fontSize: "1.5rem"},
          }, React.createElement("mfrac", null,
            React.createElement("mn", null, fraction[0]),
            React.createElement("mn", null, fraction[1])))}/>
      </div>
    </div>
    <div style={cardStyle}>
      <LessonTextPresentation snapshot={subset(snapshot, ["number-line-heading"])} template="complex-figure"
        figureMinWidthRem={44} figureReadingOrder={41} figureLabel={numberLineBlocks.map(block => block.text).join(", ")}
        figure={<NumberLine blocks={numberLineBlocks}/>}/>
      <ol data-fq001-number-line-values="true" lang="en"
        style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 3em), 1fr))",
          gap: "0.25em 2em", fontFamily: "var(--lesson-text-font-body)", fontSize: "1.125rem", lineHeight: 1.5,
          color: "#14213d", paddingInlineStart: "1.75em", marginBlock: "1rem 0", overflowWrap: "anywhere"}}>
        {numberLineBlocks.map(item => <li key={item.id} data-number-line-block-id={item.id}
          data-source-text-ids={JSON.stringify(item.sourceTextIds)}
          data-source-shape-ids={JSON.stringify(item.sourceShapeIds)}>
          {item.text}
        </li>)}
      </ol>
    </div>
    <div style={cardStyle}>
      <LessonTextPresentation snapshot={subset(snapshot, [])} template="complex-figure"
        figureMinWidthRem={24} figureReadingOrder={70} figureLabel={value(snapshot, "graph-values")}
        figure={<SourceGraph values={graphValues}/>}/>
      <ol data-fq001-graph-values="true" lang="en"
        style={{fontFamily: "var(--lesson-text-font-body)", fontSize: "1.125rem", lineHeight: 1.5,
          color: "#14213d", paddingInlineStart: "1.75em", marginBlock: "1rem 0", overflowWrap: "anywhere"}}>
        {graphValues.map(item => <li key={item.sourceTextId} data-source-text-id={item.sourceTextId}>
          {item.text}
        </li>)}
      </ol>
    </div>
  </section>;
}
