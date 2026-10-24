import {p018NativeGlyphOffsets} from './nms-l11-p018-native-layout';
import {P001_READABLE_SOURCE_BINDINGS} from './p001-readable-source-bindings';
import {L8_P006_STYLED_SENTENCE} from './p006-styled-sentence-source-binding';
import {HFR_VOCABULARY_SOURCE_BINDINGS} from './vocabulary-source-bindings';
import {GEO_L03_P007_LOOP_SENTENCE} from './geo-l03-p007-loop-source-binding';
import {NMS_L06_P005_JOINED_QUESTION} from './nms-l06-p005-joined-source-binding';
import {NMS_L11_P005_JOINED_QUESTION} from './nms-l11-p005-joined-source-binding';
import {ALG_L02_P007_STYLED_SENTENCE} from './alg-l02-p007-styled-sentence-source-binding';
import type {P001ReadableCompanion} from './p001-readable-companion';
import {buildLessonTextSnapshot, lessonTextInstanceId, validateLessonTextBinding} from '../lesson-text-snapshot';
import type {LessonTextBinding, LessonTextInstance, LessonTextInstanceSegment, TextPresentationSnapshot} from '../lesson-text-contract';

type Matrix = readonly [number, number, number, number, number, number];
type Bounds = {left: number; right: number; top: number; bottom: number};
type TextRun = {fontId: number; fontHeightTwips: number; colorRgba: number[]; xOffsetTwips: number | null; yOffsetTwips: number; text: string | null; glyphs: readonly {index: number; code?: number; advanceTwips: number; unicode: string | null; status: string}[]};
type TextDefinition = {sourceTextId: string; sourceTagSha256?: string; characterId: number; kind: 'static-text' | 'dynamic-field'; boundsTwips: Bounds; matrix?: Matrix; runs?: readonly TextRun[]; fontId?: number; fontHeightTwips?: number; flags?: Record<string, boolean>};
type Placement = {depth: number; generation: number; characterId: number; firstFrame: number; lastFrameExclusive: number; updates: readonly string[]};
export interface HfrTextSourceCatalog {
  readonly sourceSha256: string;
  readonly header: {frameCount: number; stageBoundsTwips: Bounds};
  readonly textDefinitions: readonly TextDefinition[];
  readonly fonts: readonly {characterId: number; sourceTagSha256?: string; name?: {text: string | null}; codes?: readonly number[] | null}[];
  readonly shapeDefinitions?: readonly {characterId:number;sourceTagSha256:string}[];
  readonly timelines: readonly {timelineId: string; instances: readonly Placement[]; events: readonly {eventId: string; frame: number; filters?: unknown; blendMode?: number}[]}[];
  readonly unparsedTags: readonly unknown[];
  readonly risks: readonly {kind: string}[];
}
// Shared static-text glyph layout for HFR native labels.
// Flash draws DefineText glyphs at their authored advances. When the source
// catalog and the live HFR runtime agree glyph-for-glyph, the native SVG label
// keeps those origins (the existing x-list path) instead of the substitute
// browser font's natural advances. This replaces per-page copies of the same
// rule (P011, P012, P013, P015, P018) for newly installed pages.
type SourceText=TextDefinition;
type LiveGlyphText={kind?:string;runs?:readonly {str?:string;f?:number;h?:number;y?:number;g?:readonly (readonly [number,number])[]}[]};

export type HfrSourceGlyphLayout=
  |{readonly status:'source-glyph-offsets';readonly offsets:readonly number[]}
  |{readonly status:'natural';readonly reason:string}
  |{readonly status:'mismatch';readonly reason:string};

/** Pages registered before this shared rule (registry 8be89c17…, 654 pages).
 * Their registered evidence was produced with natural or page-owned glyph
 * layout, so they keep exactly that layout. Do not add new pages here. */
export const HFR_GLYPH_LAYOUT_REGISTERED_BEFORE_SHARED_RULE:ReadonlySet<string>=new Set([
  'shared-alg001-l02-p007','shared-geo001-l03-p007',
  'shared-nms002-l03-p001','shared-nms002-l03-p005','shared-nms002-l03-p006','shared-nms002-l03-p008',
  'shared-nms002-l04-p001','shared-nms002-l05-p001','shared-nms002-l06-p001','shared-nms002-l06-p005',
  'shared-nms002-l07-p001','shared-nms002-l07-p005','shared-nms002-l08-p001','shared-nms002-l08-p006',
  'shared-nms002-l09-p001','shared-nms002-l10-p001',
  'shared-nms002-l11-p001','shared-nms002-l11-p005','shared-nms002-l11-p006','shared-nms002-l11-p007',
  'shared-nms002-l11-p008','shared-nms002-l11-p009','shared-nms002-l11-p010','shared-nms002-l11-p011',
  'shared-nms002-l11-p012','shared-nms002-l11-p013','shared-nms002-l11-p014','shared-nms002-l11-p015',
  'shared-nms002-l11-p018','shared-nms002-l11-p019','shared-nms002-l11-p020','shared-nms002-l11-p022',
  'shared-nms002-l12-p001',
]);

const natural=(reason:string):HfrSourceGlyphLayout=>Object.freeze({status:'natural',reason});
const mismatch=(reason:string):HfrSourceGlyphLayout=>Object.freeze({status:'mismatch',reason});

/** `value` is the native label text actually rendered for this block.
 * - natural: the label is not a plain single-baseline static-text transcription
 *   (edit text, semantic/line-break/superscript substitution, unmapped glyph,
 *   mixed baseline or size). Its layout is unchanged.
 * - mismatch: source catalog and live runtime disagree; the caller blocks.
 * - source-glyph-offsets: one offset per rendered character, in twips,
 *   relative to the first glyph origin (the block anchor). */
export function hfrSourceGlyphLayout(source:SourceText,live:LiveGlyphText,value:string):HfrSourceGlyphLayout {
  if(source.kind!=='static-text')return natural('not-static-text');
  const runs=source.runs??[];
  if(!runs.length)return natural('no-source-runs');
  const first=runs[0];
  let text='';
  for(const run of runs){
    if(typeof run.text!=='string'||run.glyphs.length!==run.text.length)return natural('unmapped-run-text');
    if(!run.glyphs.length)return natural('empty-run');
    if(run.yOffsetTwips!==first.yOffsetTwips)return natural('mixed-baseline');
    if(run.fontHeightTwips!==first.fontHeightTwips)return natural('mixed-font-height');
    for(const [i,glyph]of run.glyphs.entries())
      if(glyph.unicode===null||glyph.unicode.length!==1||glyph.unicode!==run.text[i]||glyph.code===undefined)return natural('unmapped-glyph');
    text+=run.text;
  }
  if(text!==value)return natural('semantic-text');
  if(live.kind!=='text'||live.runs?.length!==runs.length)return mismatch('live-run-structure');
  const offsets:number[]=[];
  let cursor=0,origin:number|null=null;
  for(const [ri,run]of runs.entries()){
    const actual=live.runs[ri];
    if(actual.str!==run.text||actual.f!==run.fontId||actual.h!==run.fontHeightTwips||actual.y!==run.yOffsetTwips||actual.g?.length!==run.glyphs.length)
      return mismatch(`live-run-${ri}`);
    if(run.xOffsetTwips!==null)cursor=run.xOffsetTwips;
    for(const [gi,glyph]of run.glyphs.entries()){
      // Authored advances may be zero (stacked trailing spaces); the live
      // runtime position, not the sign, is the integrity check.
      if(glyph.code!==run.text!.charCodeAt(gi)||!Number.isSafeInteger(glyph.advanceTwips)||
        actual.g[gi][0]!==glyph.index||actual.g[gi][1]!==cursor)return mismatch(`glyph-${ri}-${gi}`);
      if(origin===null)origin=cursor;
      offsets.push(cursor-origin);
      cursor+=glyph.advanceTwips;
    }
  }
  if(offsets.length!==value.length)return mismatch('offset-count');
  return Object.freeze({status:'source-glyph-offsets',offsets:Object.freeze(offsets)});
}

interface HfrTextPropertyObject {readonly props?:ReadonlyMap<string,{readonly v?:unknown;readonly getter?:unknown}>;readonly proto?:HfrTextPropertyObject|null}
/** Only the already-computed display state is read. No AVM getter is invoked. */
export interface HfrTextDisplayObject extends HfrTextPropertyObject {
  readonly scriptMoved?:boolean;
  readonly charId: number; readonly depth: number; readonly def: any;
  readonly m: {a: number; b: number; c: number; d: number; tx: number; ty: number};
  readonly cx: readonly number[]; readonly visible: boolean; readonly removed: boolean;
  readonly ratio?:number;
  readonly frame?: number; readonly playing?: boolean; readonly isClip?: boolean; readonly isButton?: boolean;
  readonly children?: ReadonlyMap<number, HfrTextDisplayObject>; readonly stateChildren?: readonly HfrTextDisplayObject[];
  readonly mask?: unknown; readonly clipDepth?: number; readonly parentClip?: HfrTextDisplayObject | null;
  readonly textValue?: string; readonly htmlValue?: string; readonly html?: boolean; readonly border?: boolean;
  readonly textColor?: readonly number[] | null; readonly format?: Readonly<Record<string, unknown>>;
}
export interface HfrTextRuntime {
  readonly page: {source: {sha256: string}; placement: {animationId: string}; stage: {width: number; height: number}; root: {frameCount: number}; dictionary: Record<string, any>};
  readonly page_: HfrTextDisplayObject; readonly tickCount: number;
}
export interface HfrTextIdentity {readonly lang: 'en' | 'es'; readonly scenario: string; readonly seed: number; readonly replay: number}
export interface HfrNativeGlossaryControl {
  readonly liveButton:HfrTextDisplayObject; readonly instanceId:string;
  readonly sourceButtonCharacterId:number; readonly sourceButtonTagSha256:string; readonly sourceActionSha256:string;
  readonly sourceKeyAttribute:string; readonly dictionaryEntryId:string; readonly runIndex:number;
  readonly glyphStart?:number; readonly glyphEndExclusive?:number;
}
export interface HfrNativeGlossaryIntent {
  readonly frame:HfrNativeTextFrame; readonly identity:HfrTextIdentity; readonly control:HfrNativeGlossaryControl; readonly trigger:HTMLElement;
}
export interface HfrStyledSentenceDecision {
  readonly kind:string; readonly animationId:string; readonly sourceSwfSha256:string; readonly candidateJsonSha256:string;
  readonly bindingVersion:string; readonly sourceFrameDomain:string; readonly firstCompleteFrame:number; readonly lastCompleteFrame:number; readonly rootFrame:number;
  readonly sourceTextId:string; readonly sourceTextTagSha256:string; readonly fontId:number; readonly fontSourceTagSha256:string; readonly sourceTextInstanceId:string;
  readonly inkBoundsTwips:Bounds; readonly textMatrix:readonly number[]; readonly primaryMatrix:readonly number[];
  readonly mask:{readonly characterId:number;readonly sourceTagSha256:string;readonly geometrySha256:string;readonly instanceId:string;readonly depth:number;readonly clipDepth:number;readonly completeMatrix:readonly number[]}|null;
  readonly additionalMasks?:readonly NonNullable<HfrStyledSentenceDecision['mask']>[];
  readonly title:{readonly characterId:number;readonly sourceTagSha256:string;readonly geometrySha256:string;readonly instanceId:string;readonly text:string};
  readonly runs:readonly {readonly text:string;readonly colorRgba:readonly number[];readonly fontWeight:400|700;readonly sourceFontId:number;readonly fontHeightTwips:number;readonly baselineTwips:number}[];
  readonly controls:readonly Omit<HfrNativeGlossaryControl,'liveButton'>[];
  readonly sourceInteraction?:Readonly<{
    firstFrame:number;lastFrame:number;textInstanceIds:readonly string[];controlInstanceIds:Readonly<Record<number,readonly string[]>>;
    maskCount:number;maskDefinitions:readonly {characterId:number;sourceTagSha256:string;geometrySha256:string;kind:'rectangle'|'morph-rectangle'}[];hitCharacterId:number;
  }>;
  readonly retainedBitmapIds:readonly number[];readonly shapeRolesSha256:string;readonly sourceRoleAuditSha256:string;readonly sourceInkAuditSha256:string;
}
export interface HfrSourceTextDecisions {
  readonly sourceSwfSha256:string;
  readonly joinedQuestion?:HfrJoinedQuestionDecision;
  readonly vocabulary?:HfrVocabularyDecision;
  readonly styledSentence?:HfrStyledSentenceDecision;
  readonly readableCompanion?:P001ReadableCompanion;
  readonly glyphMappings?:readonly {sourceTextId:string;sourceTextTagSha256:string;runIndex:number;fontId:number;fontSourceTagSha256:string;glyphIndex:number;sourceCode:number;unicode:string;evidence:string}[];
  readonly runSemantics?:readonly {sourceTextId:string;sourceTextTagSha256:string;runIndex:number;kind:'superscript'|'multiplication';expectedText:string;text:string;evidence:string}[];
  /** Explicit ordinary source line breaks. Math superscripts remain independent. */
  readonly lineBreaks?:readonly {sourceTextId:string;sourceTextTagSha256:string;runIndex:number;expectedText:string;previousBaselineTwips:number;baselineTwips:number;previousXOffsetTwips:number|null;xOffsetTwips:number;fontId:number;fontHeightTwips:number;evidence:string}[];
  readonly preserveDecorative?:readonly {sourceTextId:string;sourceTextTagSha256:string;reason:string;evidence:string}[];
  /** Exact source outline transcription, restricted to semantic page titles. */
  readonly outlinedTitles?:readonly {characterId:number;sourceTagSha256:string;pathsSha256:string;geometrySha256:string;boundsTwips:Bounds;text:string;evidence:string}[];
  readonly shapeRoles?:readonly {characterId:number;sourceTagSha256:string;role:string;reason:string;evidence:string}[];
}
/** The two separately masked fields in the exact L6 question form one sentence.
 * This member keeps its source scene and loop; it is not a generic text join. */
export interface HfrJoinedQuestionDecision {
  readonly kind:'hfr-nms-l06-p005-joined-question-v1'|'hfr-nms-l11-p005-joined-question-v1';readonly animationId:string;readonly sourceSwfSha256:string;
  readonly candidateJsonSha256:string;readonly bindingSha256:string;readonly sourceCatalogSha256:string;readonly decisionsSha256:string;
  readonly frameDomain:string;readonly rootFrame:number;readonly primaryDepth:number;readonly mainFrames:number;readonly primaryMatrix:readonly number[];
  readonly firstCompleteFrame:number;readonly lastCompleteFrame:number;readonly title:HfrStyledSentenceDecision['title'];
  readonly baseFontHeightTwips?:number;
  readonly offstageTitle:{readonly characterId:number;readonly instanceId:string};
  readonly fonts:readonly {readonly fontId:number;readonly sourceTagSha256:string;readonly bold:boolean;readonly italic:boolean}[];
  readonly bodies:readonly {readonly characterId:number;readonly sourceTextId:string;readonly sourceTagSha256:string;readonly instanceId:string;readonly text:string;readonly inkBounds:Bounds;readonly runs:HfrStyledSentenceDecision['runs']}[];
  readonly masks:readonly {readonly characterId:number;readonly sourceTagSha256:string;readonly geometrySha256:string;readonly kind?:'morph-rectangle'}[];
  readonly controls:readonly (Omit<HfrNativeGlossaryControl,'liveButton'>&{readonly sourceTextId:string;readonly hitCharacterId:number;readonly sourceInstanceIds?:readonly string[]})[];
  readonly retainedBitmapIds:readonly number[];readonly sourceRoleAuditSha256:string;readonly sourceInkAuditSha256:string;
}
export interface HfrVocabularyDecision {
  readonly kind:'source-vocabulary-native-v1';readonly animationId:string;readonly sourceSwfSha256:string;
  readonly candidateJsonSha256:string;readonly bindingSha256:string;readonly sourceCatalogSha256:string;readonly decisionsSha256:string;
  readonly frameDomain:string;readonly rootFrame:number;readonly mainFrames:number;readonly primaryDepth:number;
  readonly readableFrame:number;readonly firstButtonFrame:number;
  readonly outlinedTitleCharacterId?:number;
  readonly primaryMatrix:readonly number[];
  readonly inkBounds:Readonly<Record<number,Bounds>>;
  readonly textInstances:readonly {instanceId:string;characterId:number;presentFrames:readonly (readonly [number,number])[];fullyVisibleFrames:readonly (readonly [number,number])[]}[];
  readonly masks:readonly {characterId:number;sourceTagSha256:string;geometrySha256:string;readonly kind?:'morph-rectangle'}[];
  readonly controls:readonly (Omit<HfrNativeGlossaryControl,'liveButton'>&{sourceTextId:string;hitCharacterId:number;readonly glyphSpans?:readonly {runIndex:number;glyphStart:number;glyphEndExclusive:number}[]})[];
  readonly sourceContractSha256:string;
}
export interface HfrNativeTextToken {readonly text:string;readonly baseline:'normal'|'superscript';readonly colorRgba?:readonly number[];readonly fontWeight?:400|700;readonly fontScale?:number;readonly glossaryRunIndex?:number;readonly glossaryButtonCharacterId?:number}
interface ObservedText {object: HfrTextDisplayObject; instance: LessonTextInstance | null; matrix: Matrix; visible: boolean; opacity: number; problems: string[]}
interface Guard {object: HfrTextDisplayObject; state: string; children: readonly HfrTextDisplayObject[]; outlineGeometry?: string}
export interface HfrNativeTextFrame {
  readonly snapshot: TextPresentationSnapshot;
  readonly binding: LessonTextBinding;
  readonly readableCompanion?:P001ReadableCompanion;
  readonly readableCompanionSourceJson?:string;
  readonly readableCompanionFingerprint?:string;
  readonly styledSentenceDecision?:HfrStyledSentenceDecision;
  readonly styledSentenceSourceJson?:string;readonly styledSentenceFingerprint?:string;
  readonly styledSentenceInputs?:readonly [HfrTextSourceCatalog,LessonTextBinding,HfrSourceTextDecisions];readonly styledSentenceInputsFingerprint?:string;
  readonly sourceGlossaryControls?:readonly HfrNativeGlossaryControl[];
  readonly sourceGlossaryState?:readonly {object:HfrTextDisplayObject;definition:unknown;scriptMoved:boolean;playing:boolean|undefined}[];
  readonly vocabularyDecision?:HfrVocabularyDecision;readonly vocabularySourceJson?:string;
  readonly vocabularyInputs?:readonly [HfrTextSourceCatalog,LessonTextBinding,HfrSourceTextDecisions];readonly vocabularyInputsFingerprint?:string;
  readonly vocabularyControls?:readonly HfrNativeGlossaryControl[];
  readonly joinedQuestionDecision?:HfrJoinedQuestionDecision;readonly joinedQuestionSourceJson?:string;
  readonly joinedQuestionInputs?:readonly [HfrTextSourceCatalog,LessonTextBinding,HfrSourceTextDecisions];readonly joinedQuestionInputsFingerprint?:string;
  readonly styledSentence?:Readonly<{title:string;blockId:string;tokens:readonly HfrNativeTextToken[];controls:readonly HfrNativeGlossaryControl[];
    sourceState:readonly {object:HfrTextDisplayObject;definition:unknown;scriptMoved:boolean;playing:boolean|undefined}[]}>;
  readonly sourceRiskBlockers: readonly string[];
  readonly typographyTechnicalStatus: 'blocked' | 'candidate';
  readonly opacityByBlock: Readonly<Record<string, number>>;
  readonly tokensByBlock: Readonly<Record<string,readonly HfrNativeTextToken[]>>;
  readonly geometryByBlock: Readonly<Record<string,{linear:Matrix;fontSizeRem:number;sourceGlyphOffsetsTwips?:readonly number[]}>>;
  readonly transforms: readonly {instanceId: string; matrixTwips: Matrix}[];
  readonly runtime: HfrTextRuntime; readonly page: HfrTextRuntime['page']; readonly pageRoot: HfrTextDisplayObject; readonly tick: number;
  readonly guards: readonly Guard[]; readonly sourceObjects: readonly HfrTextDisplayObject[];
}
// One reviewed source member. Exact rational glyph ink and all retained scene roles
// are bound by the source audit; this is not a general clipping-mask exemption.
const P005_STYLED_SENTENCE: HfrStyledSentenceDecision = {"kind":"hfr-nms-l07-p005-styled-sentence-v1","animationId":"shared-nms002-l07-p005","sourceSwfSha256":"52e001516750770e9e3f406d2f49bc1deecee438e4c37c1efae1080058c3fba4","candidateJsonSha256":"4b8a4a279f94efd0d56fcec3c831f61f705a1e2aab5abaeed629f7353cc6ebee","bindingVersion":"hfr-nms-l07-p005-styled-sentence-v1","sourceFrameDomain":"sprite-40","firstCompleteFrame":142,"lastCompleteFrame":157,"rootFrame":6,"sourceTextId":"character-36","sourceTextTagSha256":"bafbd1eac35c65f2b78bd392ee902f63ae3aaeafae58be9fcae7b2a940d78530","fontId":35,"fontSourceTagSha256":"f2401f64d32c44a68b8221955208f749b2198e7b971cd91d4e015f2894c6c660","sourceTextInstanceId":"root:1:1:40/sprite-40:87:1:36","inkBoundsTwips":{"left":13.28125,"top":95.625,"right":10604.9375,"bottom":465.15625},"textMatrix":[1,0,0,1,-4341,-2548],"primaryMatrix":[1,0,0,1,7219,5460],"mask":{"characterId":33,"sourceTagSha256":"d80caf5d4b3940db46fb118121363606d5657fc5bedddf4b67ed4903ac1da1d5","geometrySha256":"f92a97f44b6c0826b60a5c467502896701954fda585becf27903a64806faeb3e","instanceId":"root:1:1:40/sprite-40:85:1:33","depth":85,"clipDepth":92,"completeMatrix":[1.22366,0,0,1,933,-2349]},"title":{"characterId":42,"sourceTagSha256":"c5fc3d15ecfc25a832b6c4a4d4e114ac9cbab1b8a469fd9790d163c67ef62d8d","geometrySha256":"5faede323772edbc3f55bc72f188cb307d677876d8e404d9f144d58ee73e098f","instanceId":"root:95:1:43/sprite-43:1:1:42","text":"Ratios & Proportions: Real World Activity"},"runs":[{"text":"Essential Question: How are ","colorRgba":[0,0,0,255],"fontWeight":400,"sourceFontId":35,"fontHeightTwips":400,"baselineTwips":380},{"text":"comparisons","colorRgba":[0,0,204,255],"fontWeight":400,"sourceFontId":35,"fontHeightTwips":400,"baselineTwips":380},{"text":" used in ","colorRgba":[0,0,0,255],"fontWeight":400,"sourceFontId":35,"fontHeightTwips":400,"baselineTwips":380},{"text":"proportions","colorRgba":[0,0,204,255],"fontWeight":400,"sourceFontId":35,"fontHeightTwips":400,"baselineTwips":380},{"text":"?","colorRgba":[0,0,0,255],"fontWeight":400,"sourceFontId":35,"fontHeightTwips":400,"baselineTwips":380}],"controls":[{"instanceId":"root:1:1:40/sprite-40:88:1:38","sourceButtonCharacterId":38,"sourceButtonTagSha256":"983df741fd2f5fe85d39416e73e110993e65a64c2839f3a1d9887354a718b150","sourceActionSha256":"3d36841c27c6b9867f9963b896352a3ce2262c7d5c17a397849c4b3118255665","sourceKeyAttribute":"Comparison","dictionaryEntryId":"comparison","runIndex":1},{"instanceId":"root:1:1:40/sprite-40:90:1:39","sourceButtonCharacterId":39,"sourceButtonTagSha256":"250b0ab894476cd5eb3bd36815d6f3cbaad1e105e3ecff7816df2f89064cf94f","sourceActionSha256":"47e1192c065b1f105cf19fad92f11ca3118fbc51b51a13ac9f5d9613b92ce6c3","sourceKeyAttribute":"Proportion","dictionaryEntryId":"proportion","runIndex":3}],"retainedBitmapIds":[2,3,7],"shapeRolesSha256":"838d03a2a044a3daa67f133e5032de56cfb1f733d1ea5944abae4b0df27e5111","sourceRoleAuditSha256":"c7383bbb54bb18a41fd924b7ae6933d77acd3b4a5a88327e0a2bc7d9479944f7","sourceInkAuditSha256":"79edd9b48fdceab6a2c0648b831b072ca6510e24971f312b81fd2a57cf9bab6e"};
const ID: Matrix = [1, 0, 0, 1, 0, 0];
const rgbaIdentity = [256, 256, 256, 256, 0, 0, 0, 0];
const matrix = (o: HfrTextDisplayObject): Matrix => [o.m.a, o.m.b, o.m.c, o.m.d, o.m.tx, o.m.ty];
export function multiplyHfrTextMatrix(m: Matrix, n: Matrix): Matrix {
  return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
}
const point = (m: Matrix, x: number, y: number) => ({x: (m[0]*x+m[2]*y+m[4])/20, y: (m[1]*x+m[3]*y+m[5])/20});
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const children = (o: HfrTextDisplayObject) => o.children ? [...o.children.values()].sort((a,b)=>a.depth-b.depth) : [...(o.stateChildren??[])];
const state = (o: HfrTextDisplayObject) => JSON.stringify([o.charId,o.depth,o.frame,o.visible,o.removed,o.m,o.cx,o.def?.bounds,o.mask ? true : false,o.clipDepth,o.textValue,o.htmlValue,o.html,o.border,o.textColor,o.format,o.ratio]);
const outlineGeometry = (definition:any) => JSON.stringify({bounds:definition?.bounds,draws:definition?.draws});
const outlinePaths = (definition:any) => JSON.stringify(definition?.draws?.map((draw:any)=>draw.path));
const sha256 = async (text:string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(byte=>byte.toString(16).padStart(2,'0')).join('');

/** Bounds are already in the character's local coordinate system. TextMatrix
 * affects glyph placement inside them and must not be applied a second time. */
export function hfrSourceViewportVisibility(bounds:Bounds, world:Matrix, stage:Bounds):'inside'|'outside'|'partial'|'invalid' {
  if(!world.every(Number.isFinite)||Math.abs(world[0]*world[3]-world[1]*world[2])<1e-12||
      ![bounds.left,bounds.right,bounds.top,bounds.bottom,stage.left,stage.right,stage.top,stage.bottom].every(Number.isFinite)||bounds.left>bounds.right||bounds.top>bounds.bottom)return 'invalid';
  const corners=[[bounds.left,bounds.top],[bounds.right,bounds.top],[bounds.right,bounds.bottom],[bounds.left,bounds.bottom]].map(([x,y])=>[world[0]*x+world[2]*y+world[4],world[1]*x+world[3]*y+world[5]]);
  const left=Math.min(...corners.map(p=>p[0])),right=Math.max(...corners.map(p=>p[0])),top=Math.min(...corners.map(p=>p[1])),bottom=Math.max(...corners.map(p=>p[1]));
  if(right<=stage.left||left>=stage.right||bottom<=stage.top||top>=stage.bottom)return 'outside';
  return left>=stage.left&&right<=stage.right&&top>=stage.top&&bottom<=stage.bottom?'inside':'partial';
}

/** Async outline hashing happens before the player starts. The compact config
 * carries only exact source hashes and a reviewed transcription, never paths. */
export async function prepareHfrNativeTextAsync(page:HfrTextRuntime['page'],source:HfrTextSourceCatalog,binding:LessonTextBinding,decisions?:HfrSourceTextDecisions) {
  const verified=new Map<number,string>();
  for(const d of decisions?.outlinedTitles??[]) {
    const definition=page.dictionary[d.characterId];
    if(definition?.kind!=='shape'||!d.text.trim()||!d.evidence.trim()||
       source.shapeDefinitions?.find(s=>s.characterId===d.characterId)?.sourceTagSha256!==d.sourceTagSha256||
       !same([definition.bounds?.xmin,definition.bounds?.xmax,definition.bounds?.ymin,definition.bounds?.ymax],[d.boundsTwips.left,d.boundsTwips.right,d.boundsTwips.top,d.boundsTwips.bottom]))continue;
    const geometry=outlineGeometry(definition);
    if(await sha256(outlinePaths(definition))===d.pathsSha256&&await sha256(geometry)===d.geometrySha256)verified.set(d.characterId,geometry);
  }
  let companionJson:string|undefined;
  const q=decisions?.readableCompanion;
  const profile=q?P001_READABLE_SOURCE_BINDINGS[q.kind]:undefined;
  if(q&&profile&&q.animationId===profile.animationId&&q.animationId===binding.animationId&&q.sourceSwfSha256===profile.sourceSha256&&q.sourceSwfSha256===source.sourceSha256&&q.candidateJsonSha256===profile.candidateJsonSha256&&q.bindingVersion===profile.bindingVersion&&q.bindingVersion===binding.version&&q.evidence.trim()){
    const json=JSON.stringify(page);
    if(await sha256(json)===q.candidateJsonSha256)companionJson=json;
  }
  let styledJson:string|undefined;
  const styled=decisions?.styledSentence;
  const bodyId=styled?Number(styled.sourceTextId.replace('character-','')):0;
  if(styled&&(same(styled,P005_STYLED_SENTENCE)||same(styled,L8_P006_STYLED_SENTENCE)||same(styled,ALG_L02_P007_STYLED_SENTENCE)||same(styled,GEO_L03_P007_LOOP_SENTENCE))&&binding.animationId===styled.animationId&&binding.version===styled.bindingVersion&&
     source.sourceSha256===styled.sourceSwfSha256&&page.source.sha256===styled.sourceSwfSha256&&
     source.textDefinitions.length===1&&source.textDefinitions[0].sourceTextId===styled.sourceTextId&&
     source.textDefinitions[0].sourceTagSha256===styled.sourceTextTagSha256&&
     source.fonts.find(f=>f.characterId===styled.fontId)?.sourceTagSha256===styled.fontSourceTagSha256&&
     (styled.mask===null?styled.sourceInteraction?.maskCount===0:source.shapeDefinitions?.find(s=>s.characterId===styled.mask!.characterId)?.sourceTagSha256===styled.mask.sourceTagSha256)&&
     binding.blocks.length===2&&binding.blocks[0].id==='source-section-title'&&binding.blocks[0].role==='title'&&same(binding.blocks[0].sourceShapeIds,[styled.title.characterId])&&binding.blocks[0].sourceTextIds.length===0&&
     binding.blocks[1].id===`source-text-${bodyId}`&&binding.blocks[1].role==='body'&&same(binding.blocks[1].sourceTextIds,[styled.sourceTextId])&&
     decisions?.outlinedTitles?.length===1&&decisions.outlinedTitles[0].characterId===styled.title.characterId&&decisions.outlinedTitles[0].text===styled.title.text&&
     verified.get(styled.title.characterId)===outlineGeometry(page.dictionary[styled.title.characterId])) {
    const body=source.textDefinitions[0],font=page.dictionary[styled.fontId];
    const roles=(decisions?.shapeRoles??[]).map(({characterId,sourceTagSha256,role})=>({characterId,sourceTagSha256,role})).sort((a,b)=>a.characterId-b.characterId);
    const exactRuns=body.runs?.length===styled.runs.length&&body.runs.every((run,index)=>{
      const expected=styled.runs[index];
      return run.fontId===expected.sourceFontId&&run.fontHeightTwips===expected.fontHeightTwips&&run.yOffsetTwips===expected.baselineTwips&&same(run.colorRgba,expected.colorRgba)&&
        run.glyphs.every(g=>g.code===font?.codes?.[g.index]&&g.unicode===String.fromCharCode(g.code!))&&run.glyphs.map(g=>g.unicode).join('')===expected.text;
    });
    const maskSpecs=[...(styled.mask?[styled.mask]:[]),...(styled.additionalMasks??[])];
    const masksVerified=(await Promise.all(maskSpecs.map(async mask=>source.shapeDefinitions?.find(s=>s.characterId===mask.characterId)?.sourceTagSha256===mask.sourceTagSha256&&await sha256(outlineGeometry(page.dictionary[mask.characterId]))===mask.geometrySha256))).every(Boolean);
    const sourceMasksVerified=(await Promise.all((styled.sourceInteraction?.maskDefinitions??[]).map(async mask=>source.shapeDefinitions?.find(s=>s.characterId===mask.characterId)?.sourceTagSha256===mask.sourceTagSha256&&await sha256(mask.kind==='morph-rectangle'?JSON.stringify(page.dictionary[mask.characterId]):outlineGeometry(page.dictionary[mask.characterId]))===mask.geometrySha256))).every(Boolean);
    const json=JSON.stringify(page);
    if(exactRuns&&font?.bold===false&&font?.italic===false&&
       same(Object.entries(page.dictionary).filter(([,d])=>d.kind==='bitmap').map(([id])=>Number(id)).sort((a,b)=>a-b),styled.retainedBitmapIds)&&
       masksVerified&&sourceMasksVerified&&await sha256(json)===styled.candidateJsonSha256&&await sha256(JSON.stringify(roles))===styled.shapeRolesSha256&&
       (styled.mask===null||await sha256(outlineGeometry(page.dictionary[styled.mask.characterId]))===styled.mask.geometrySha256))styledJson=json;
  }
  let vocabularyJson:string|undefined;
  const vocabulary=decisions?.vocabulary;
  const vocabularyProfile=vocabulary?HFR_VOCABULARY_SOURCE_BINDINGS[vocabulary.animationId]:undefined;
  const {vocabulary:_vocabulary,...vocabularyDecisions}=decisions??{sourceSwfSha256:''};
  if(vocabulary&&vocabularyProfile&&same(vocabulary,vocabularyProfile)&&
      vocabulary.sourceSwfSha256===source.sourceSha256&&vocabulary.animationId===binding.animationId&&
      await sha256(JSON.stringify(binding))===vocabulary.bindingSha256&&
      await sha256(JSON.stringify(vocabularyDecisions))===vocabulary.decisionsSha256&&
      await sha256(JSON.stringify(source))===vocabulary.sourceCatalogSha256) {
    const value=JSON.stringify(page);
    if(await sha256(value)===vocabulary.candidateJsonSha256)vocabularyJson=value;
  }
  let joinedQuestionJson:string|undefined;
  const joined=decisions?.joinedQuestion,{joinedQuestion:_joined,...joinedDecisions}=decisions??{sourceSwfSha256:''};
  if(joined&&(same(joined,NMS_L06_P005_JOINED_QUESTION)||same(joined,NMS_L11_P005_JOINED_QUESTION))&&joined.sourceSwfSha256===source.sourceSha256&&joined.animationId===binding.animationId&&
      await sha256(JSON.stringify(binding))===joined.bindingSha256&&await sha256(JSON.stringify(source))===joined.sourceCatalogSha256&&
      await sha256(JSON.stringify(joinedDecisions))===joined.decisionsSha256&&
      verified.get(joined.title.characterId)===outlineGeometry(page.dictionary[joined.title.characterId])&&
      joined.fonts.every(f=>source.fonts.some(s=>s.characterId===f.fontId&&s.sourceTagSha256===f.sourceTagSha256)&&page.dictionary[f.fontId]?.bold===f.bold&&page.dictionary[f.fontId]?.italic===f.italic)) {
    const value=JSON.stringify(page);
    if(await sha256(value)===joined.candidateJsonSha256)joinedQuestionJson=value;
  }
  return prepareNativeText(page,source,binding,decisions,verified,companionJson,styledJson,vocabularyJson,joinedQuestionJson);
}

function blocked(snapshot: TextPresentationSnapshot, problems: readonly string[]): TextPresentationSnapshot {
  return Object.freeze({...snapshot, status: 'blocked', blockers: Object.freeze([...new Set([...snapshot.blockers,...problems])]), blocks: Object.freeze([]), suppressedInstances: Object.freeze([])});
}

/** Preparation validates source/candidate geometry, never derives words from HFR's
 * permissive `str` field (which currently calls Symbol code 112 the Latin p). */
export function prepareHfrNativeText(page: HfrTextRuntime['page'], source: HfrTextSourceCatalog, binding: LessonTextBinding, decisions?:HfrSourceTextDecisions) {
  return prepareNativeText(page,source,binding,decisions,new Map());
}
function prepareNativeText(page:HfrTextRuntime['page'],source:HfrTextSourceCatalog,binding:LessonTextBinding,decisions:HfrSourceTextDecisions|undefined,verifiedOutlines:ReadonlyMap<number,string>,companionJson?:string,styledJson?:string,vocabularyJson?:string,joinedQuestionJson?:string) {
  validateLessonTextBinding(binding);
  const problems: string[]=[];
  if(decisions?.styledSentence&&!styledJson)problems.push('styled-sentence-requires-exact-async-source-contract');
  if(decisions?.vocabulary&&!vocabularyJson)problems.push('vocabulary-requires-exact-async-source-contract');
  if(decisions?.joinedQuestion&&!joinedQuestionJson)problems.push('joined-question-requires-exact-async-source-contract');
  if(page.source.sha256!==source.sourceSha256 || source.sourceSha256!==binding.sourceSwfSha256 || page.placement.animationId!==binding.animationId) problems.push('source-or-placement-binding-mismatch');
  const b=source.header.stageBoundsTwips;
  if(page.root.frameCount!==source.header.frameCount || page.stage.width!==(b.right-b.left)/20 || page.stage.height!==(b.bottom-b.top)/20) problems.push('source-stage-or-frame-mismatch');
  if(source.unparsedTags.length) problems.push('unparsed-source-tags');
  const textMap=new Map(source.textDefinitions.map(t=>[t.sourceTextId,t]));
  if(decisions&&decisions.sourceSwfSha256!==source.sourceSha256)problems.push('source-semantic-decision-scope-mismatch');
  for(const d of [...(decisions?.glyphMappings??[]),...(decisions?.runSemantics??[]),...(decisions?.preserveDecorative??[]),...(decisions?.lineBreaks??[])]) {
    if(textMap.get(d.sourceTextId)?.sourceTagSha256!==d.sourceTextTagSha256||!d.evidence.trim())problems.push(`source-semantic-text-pin-mismatch:${d.sourceTextId}`);
  }
  for(const d of decisions?.glyphMappings??[]){const t=textMap.get(d.sourceTextId),r=t?.runs?.[d.runIndex],g=r?.glyphs.find(g=>g.index===d.glyphIndex);if(r?.fontId!==d.fontId||g?.code!==d.sourceCode||source.fonts.find(f=>f.characterId===d.fontId)?.sourceTagSha256!==d.fontSourceTagSha256||!d.unicode)problems.push(`source-semantic-font-pin-mismatch:${d.sourceTextId}`);}
  for(const d of decisions?.runSemantics??[])if(textMap.get(d.sourceTextId)?.runs?.[d.runIndex]?.text!==d.expectedText)problems.push(`source-semantic-run-pin-mismatch:${d.sourceTextId}`);
  for(const d of decisions?.lineBreaks??[]) {
    const t=textMap.get(d.sourceTextId),run=t?.runs?.[d.runIndex],previous=t?.runs?.[d.runIndex-1];
    const blocks=binding.blocks.filter(b=>b.sourceTextIds.includes(d.sourceTextId));
    if(!previous||!run||run.text!==d.expectedText||run.yOffsetTwips!==d.baselineTwips||previous.yOffsetTwips!==d.previousBaselineTwips||
        run.xOffsetTwips!==d.xOffsetTwips||previous.xOffsetTwips!==d.previousXOffsetTwips||
        run.fontId!==d.fontId||previous.fontId!==d.fontId||run.fontHeightTwips!==d.fontHeightTwips||previous.fontHeightTwips!==d.fontHeightTwips||
        d.baselineTwips-d.previousBaselineTwips<d.fontHeightTwips||!same(run.colorRgba,previous.colorRgba)||
        !blocks.length||blocks.some(b=>!['title','heading','body'].includes(b.role))||
        decisions?.runSemantics?.some(s=>s.sourceTextId===d.sourceTextId&&s.runIndex===d.runIndex)||
        decisions!.lineBreaks!.filter(s=>s.sourceTextId===d.sourceTextId&&s.runIndex===d.runIndex).length!==1)
      problems.push(`source-line-break-pin-mismatch:${d.sourceTextId}:${d.runIndex}`);
  }
  for(const d of decisions?.shapeRoles??[])if(!d.reason.trim()||!d.evidence.trim()||source.shapeDefinitions?.find(s=>s.characterId===d.characterId)?.sourceTagSha256!==d.sourceTagSha256)problems.push(`source-shape-role-pin-mismatch:${d.characterId}`);
  const companion=decisions?.readableCompanion;
  if(companion){
    if(!companionJson)problems.push('readable-companion-requires-async-candidate-attestation');
    const expected:Record<string,number[]>={fractions:[85,87,88,89,90,91,87,89,92,91,87,93,94,91],'decimal-list':[102,103],'number-forms':[104,106,109,110,111]};
    const profile=P001_READABLE_SOURCE_BINDINGS[companion.kind];
    if(!profile||companion.sourceSwfSha256!==profile.sourceSha256||companion.animationId!==profile.animationId||companion.candidateJsonSha256!==profile.candidateJsonSha256||companion.bindingVersion!==profile.bindingVersion||companion.sourceFrameDomain!=='sprite-113'||companion.title.text!==profile.title||!same(companion.groups.map(g=>g.id),Object.keys(expected)))problems.push('readable-companion-source-contract-mismatch');
    if(!same(companion.textPins.map(p=>p.characterId).sort((a,b)=>a-b),[87,88,89,91,93,100,101,103,106,109,111])||!same(companion.shapePins.map(p=>p.characterId).sort((a,b)=>a-b),[85,90,92,94,102,104,110]))problems.push('readable-companion-required-source-pins-missing');
    for(const pin of companion.textPins)if(textMap.get(pin.sourceTextId)?.sourceTagSha256!==pin.sourceTagSha256||textMap.get(pin.sourceTextId)?.characterId!==pin.characterId)problems.push('readable-companion-text-pin-mismatch');
    for(const pin of companion.shapePins)if(source.shapeDefinitions?.find(s=>s.characterId===pin.characterId)?.sourceTagSha256!==pin.sourceTagSha256)problems.push('readable-companion-shape-pin-mismatch');
    for(const group of companion.groups)for(const variant of group.variants){
      if(!same(variant.members.map(m=>m.characterId).sort((a,b)=>a-b),[...(expected[group.id]??[])].sort((a,b)=>a-b)))problems.push('readable-companion-source-members-mismatch');
      for(const member of variant.members)for(const part of member.instanceId.split('/')){
        const [timelineId,depth,generation,characterId]=part.split(':');
        if(!source.timelines.find(t=>t.timelineId===timelineId)?.instances.some(i=>i.depth===Number(depth)&&i.generation===Number(generation)&&i.characterId===Number(characterId)))problems.push('readable-companion-source-instance-pin-mismatch');
      }
    }
  }
  for(const block of binding.blocks) {
    if(block.sourceShapeIds?.length) {
      if(block.role!=='title'||block.sourceShapeIds.length!==1||block.sourceTextIds.length||!verifiedOutlines.has(block.sourceShapeIds[0]))problems.push(`outlined-text-needs-semantic-adapter:${block.id}`);
      if((decisions?.outlinedTitles??[]).filter(d=>d.characterId===block.sourceShapeIds![0]).length!==1)problems.push(`outlined-title-decision-not-unique:${block.id}`);
    }
    for(const id of block.sourceTextIds) if(!textMap.has(id)) problems.push(`full-source-text-definition-required:${id}`);
  }
  for(const t of source.textDefinitions) {
    const d=page.dictionary[t.characterId];
    if(!d || (t.kind==='static-text'?d.kind!=='text':d.kind!=='edittext') || !same([d.bounds?.xmin,d.bounds?.xmax,d.bounds?.ymin,d.bounds?.ymax],[t.boundsTwips.left,t.boundsTwips.right,t.boundsTwips.top,t.boundsTwips.bottom])) {problems.push(`source-text-definition-mismatch:${t.sourceTextId}`);continue;}
    if(t.kind!=='static-text') {
      if(['readOnly','password','html','border','wordWrap','multiline'].some(k=>Object.hasOwn(t.flags??{},k)&&Boolean(d[k])!==t.flags![k])||(t.fontId!==undefined&&t.fontId!==null&&d.fontId!==t.fontId)||(t.fontHeightTwips!==undefined&&d.fontHeight!==t.fontHeightTwips))problems.push(`source-edittext-flags-mismatch:${t.sourceTextId}`);
      continue;
    }
    let pen=0;
    const expected=t.runs!.map(r=>{if(r.xOffsetTwips!==null)pen=r.xOffsetTwips;return {f:r.fontId,h:r.fontHeightTwips,c:r.colorRgba,y:r.yOffsetTwips,g:r.glyphs.map(g=>{const pair=[g.index,pen];pen+=g.advanceTwips;return pair;})};});
    const actual=d.runs.map((r:any)=>({f:r.f,h:r.h,c:r.c,y:r.y,g:r.g}));
    if(!same(expected,actual) || !same(d.m,t.matrix)) problems.push(`source-text-run-mismatch:${t.sourceTextId}`);
  }
  const allShapesResolved=Boolean(source.shapeDefinitions?.length)&&source.shapeDefinitions!.every(s=>decisions?.shapeRoles?.some(d=>d.characterId===s.characterId&&d.sourceTagSha256===s.sourceTagSha256));
  const allGlyphsResolved=source.textDefinitions.every(t=>t.runs?.every((r,ri)=>r.glyphs.every(g=>g.unicode!==null||decisions?.glyphMappings?.some(d=>d.sourceTextId===t.sourceTextId&&d.runIndex===ri&&d.glyphIndex===g.index&&d.sourceCode===g.code)))??true);
  // Only this exact audited page's retained raster scene, two source button
  // records and rectangle masks are classified here. Live ink containment is
  // still mandatory below and no other page receives a mask/style exception.
  const sourceRiskBlockers=source.risks.filter(r=>['shape-text-unclassified','bitmap-text-unclassified','unresolved-font-codes','button-runtime-state-and-actions-not-interpreted','mask-filter-blend-semantics-unresolved'].includes(r.kind)&&!(r.kind==='shape-text-unclassified'&&allShapesResolved)&&!(r.kind==='unresolved-font-codes'&&allGlyphsResolved)&&!((styledJson||joinedQuestionJson)&&['bitmap-text-unclassified','button-runtime-state-and-actions-not-interpreted','mask-filter-blend-semantics-unresolved'].includes(r.kind))&&!(vocabularyJson&&['button-runtime-state-and-actions-not-interpreted','mask-filter-blend-semantics-unresolved'].includes(r.kind))).map(r=>r.kind);
  return {source, binding, page, decisions, verifiedOutlines, companionJson,companionFingerprint:companion?JSON.stringify(companion):undefined,styledJson,styledFingerprint:styledJson?JSON.stringify(decisions!.styledSentence):undefined,styledInputsFingerprint:styledJson?JSON.stringify([source,binding,decisions]):undefined,vocabularyJson,vocabularyInputsFingerprint:vocabularyJson?JSON.stringify([source,binding,decisions]):undefined,joinedQuestionJson,joinedQuestionInputsFingerprint:joinedQuestionJson?JSON.stringify([source,binding,decisions]):undefined, preparationProblems:Object.freeze(problems), sourceRiskBlockers:Object.freeze(sourceRiskBlockers)};
}
export type PreparedHfrNativeText = ReturnType<typeof prepareHfrNativeText>;

function sourceInstanceId(object:HfrTextDisplayObject,root:HfrTextDisplayObject,source:HfrTextSourceCatalog):string|null {
  const parts:LessonTextInstanceSegment[]=[];let objectAt:HfrTextDisplayObject=object;
  while(objectAt!==root){const parent=objectAt.parentClip;if(!parent)return null;const timelineId=parent===root?'root':`sprite-${parent.charId}`;
    const matches=source.timelines.find(t=>t.timelineId===timelineId)?.instances.filter(i=>i.characterId===objectAt.charId&&i.depth===objectAt.depth&&(parent.frame??0)>=i.firstFrame&&(parent.frame??0)<i.lastFrameExclusive)??[];
    if(matches.length!==1)return null;parts.unshift({timelineId,depth:objectAt.depth,generation:matches[0].generation,characterId:objectAt.charId});objectAt=parent;
  }
  return lessonTextInstanceId(parts);
}
function rectangleInParent(bounds:Bounds,m:Matrix):Bounds|null {
  if(!m.every(Number.isFinite)||m[1]!==0||m[2]!==0||m[0]<=0||m[3]<=0)return null;
  return {left:bounds.left*m[0]+m[4],right:bounds.right*m[0]+m[4],top:bounds.top*m[3]+m[5],bottom:bounds.bottom*m[3]+m[5]};
}
function sourceButtonEnabled(button:HfrTextDisplayObject):boolean {
  let object:HfrTextPropertyObject|null|undefined=button;
  for(let depth=0;object&&depth<100;depth++,object=object.proto){const own=object.props?.get('enabled');if(own)return !own.getter&&own.v===true;}
  return false;
}
function sourcePlacementAt(page:HfrTextRuntime['page'],frame:number,depth:number,primaryId=40):any {
  let placement:any=null;
  for(const tags of (primaryId===0?(page.root as any):page.dictionary[primaryId]).frames.slice(0,frame))for(const tag of tags)if(tag.depth===depth){if(tag.op==='remove')placement=null;else if(tag.op==='place')placement={...(tag.move?placement:{}),...tag};}
  return placement;
}
function sourceMasksAt(object:HfrTextDisplayObject):HfrTextDisplayObject[] {
  const masks:HfrTextDisplayObject[]=[];
  for(let o:HfrTextDisplayObject|null|undefined=object;o?.parentClip;o=o.parentClip)for(const sibling of children(o.parentClip))if(sibling.depth<o.depth&&(sibling.clipDepth??0)>=o.depth)masks.push(sibling);
  return masks;
}
/** Rectangles are admitted only by the exact source profile above. In the L8
 * source all four reveal morphs are corresponding, straight rectangle edges;
 * their complete ink audit uses this same ratio/65535 interpolation. */
function sourceMaskBounds(q:HfrStyledSentenceDecision,mask:HfrTextDisplayObject):any|null {
  if(!q.sourceInteraction)return q.mask&&mask.charId===q.mask.characterId&&mask.def.kind==='shape'?mask.def.bounds:null;
  const spec=q.sourceInteraction.maskDefinitions.find(s=>s.characterId===mask.charId);
  if(!spec)return null;
  if(spec.kind==='rectangle')return mask.def.kind==='shape'?mask.def.bounds:null;
  const ratio=mask.ratio??0;
  if(mask.def.kind!=='morph'||!Number.isInteger(ratio)||ratio<0||ratio>65535)return null;
  const t=ratio/65535;
  return Object.fromEntries(['xmin','xmax','ymin','ymax'].map(k=>[k,mask.def.sb[k]+(mask.def.eb[k]-mask.def.sb[k])*t]));
}
/** Interaction qualification is separate from complete-sentence visibility.
 * A source-canvas release may use only the revealed part of its source hit
 * rectangle. It never enables early native words or drawing suppression. */
function observeSourceGlossary(prepared:PreparedHfrNativeText,runtime:HfrTextRuntime,frameDomain:string,observed:readonly ObservedText[],domains:readonly HfrTextDisplayObject[]) {
  const q=prepared.decisions?.styledSentence;
  if(!q||!prepared.styledJson||JSON.stringify(runtime.page)!==prepared.styledJson||JSON.stringify([prepared.source,prepared.binding,prepared.decisions])!==prepared.styledInputsFingerprint||frameDomain!==q.sourceFrameDomain||domains.length!==1)return null;
  const root=runtime.page_,main=domains[0],sourceFrame=main.frame??0,primaryId=Number(q.sourceFrameDomain.replace('sprite-','')),bodyId=Number(q.sourceTextId.replace('character-',''));
  const source=q.sourceInteraction,textIds=source?.textInstanceIds??[q.sourceTextInstanceId];
  if(root.frame!==q.rootFrame||root.def!==runtime.page.root||main.def!==runtime.page.dictionary[primaryId]||main.parentClip!==root||sourceInstanceId(main,root,prepared.source)!==q.sourceTextInstanceId.split('/')[0]||!same(matrix(main),q.primaryMatrix)||sourceFrame<(source?.firstFrame??93)||sourceFrame>(source?.lastFrame??q.lastCompleteFrame))return null;
  const body=observed.find(n=>n.instance&&textIds.includes(n.instance.id)),title=observed.find(n=>n.instance?.id===q.title.instanceId);
  if(!body?.visible||body.object.def!==runtime.page.dictionary[bodyId]||body.object.parentClip!==main||!same(matrix(body.object),q.textMatrix)||!title?.visible||title.object.def!==runtime.page.dictionary[q.title.characterId]||
     observed.some(n=>n.visible&&n.object.charId!==bodyId&&n.object.charId!==q.title.characterId)||body.problems.some(p=>p!=='source-clipping-mask-unresolved'))return null;
  const masks=sourceMasksAt(body.object);
  if(masks.length!==(source?.maskCount??1))return null;
  for(const mask of masks){const placement=sourcePlacementAt(runtime.page,sourceFrame,mask.depth,primaryId),instance=sourceInstanceId(mask,root,prepared.source);
    if(mask.parentClip!==main||mask.def!==runtime.page.dictionary[mask.charId]||!instance||!sourceMaskBounds(q,mask)||!placement||placement.charId!==mask.charId||placement.clipDepth!==mask.clipDepth||!same(matrix(mask),placement.m)||(mask.ratio??0)!==(placement.ratio??0)||(!source&&instance!==q.mask?.instanceId))return null;
  }
  const controls:HfrNativeGlossaryControl[]=[],required=new Set<HfrTextDisplayObject>([body.object,...masks,title.object,main,root]);
  for(const spec of q.controls){const ids=source?.controlInstanceIds[spec.sourceButtonCharacterId]??[spec.instanceId],matches=children(main).filter(o=>o.charId===spec.sourceButtonCharacterId&&ids.includes(sourceInstanceId(o,root,prepared.source)??'')),button=matches[0];
    if(matches.length!==1||!button?.isButton||button.def!==runtime.page.dictionary[spec.sourceButtonCharacterId]||button.clipDepth||!sourceButtonEnabled(button))return null;
    const original=sourcePlacementAt(runtime.page,sourceFrame,button.depth,primaryId);if(!original||original.charId!==button.charId||!same(matrix(button),original.m))return null;
    required.add(button);controls.push(Object.freeze({...spec,instanceId:sourceInstanceId(button,root,prepared.source)!,liveButton:button}));
  }
  for(const member of [...required])for(let o:HfrTextDisplayObject|null|undefined=member;o;o=o.parentClip)required.add(o);
  if([...required].some(o=>o.removed||!o.visible||o.mask||o.scriptMoved||!same(o.cx,rgbaIdentity)))return null;
  return {controls:Object.freeze(controls),sourceState:Object.freeze([...required].map(object=>Object.freeze({object,definition:object.def,scriptMoved:Boolean(object.scriptMoved),playing:object.playing})))};
}
function observeStyledSentence(prepared:PreparedHfrNativeText,runtime:HfrTextRuntime,frameDomain:string,observed:readonly ObservedText[],domains:readonly HfrTextDisplayObject[]) {
  const q=prepared.decisions?.styledSentence,problems:string[]=[],controls:HfrNativeGlossaryControl[]=[],sourceState:{object:HfrTextDisplayObject;definition:unknown;scriptMoved:boolean;playing:boolean|undefined}[]=[];
  const result=(text?:HfrTextDisplayObject)=>({problems,controls,sourceState,text});
  if(!q)return result();
  if(!prepared.styledJson||JSON.stringify(runtime.page)!==prepared.styledJson||JSON.stringify(q)!==prepared.styledFingerprint||JSON.stringify([prepared.source,prepared.binding,prepared.decisions])!==prepared.styledInputsFingerprint||frameDomain!==q.sourceFrameDomain||domains.length!==1){problems.push('styled-sentence-source-or-clock-mismatch');return result();}
  const root=runtime.page_,main=domains[0],frame=main.frame??0,primaryId=Number(q.sourceFrameDomain.replace('sprite-','')),bodyId=Number(q.sourceTextId.replace('character-',''));
  if(root.frame!==q.rootFrame||root.def!==runtime.page.root||main.def!==runtime.page.dictionary[primaryId]||main.parentClip!==root||sourceInstanceId(main,root,prepared.source)!==q.sourceTextInstanceId.split('/')[0]||!same(matrix(main),q.primaryMatrix)||frame<q.firstCompleteFrame||frame>q.lastCompleteFrame){problems.push('styled-sentence-source-ink-not-complete');return result();}
  const body=observed.find(n=>n.instance?.id===q.sourceTextInstanceId),title=observed.find(n=>n.instance?.id===q.title.instanceId),maskSpecs=[...(q.mask?[q.mask]:[]),...(q.additionalMasks??[])];
  if(!body?.visible||body.object.parentClip!==main||body.object.charId!==bodyId||body.object.def!==runtime.page.dictionary[bodyId]||!title?.visible||!same(matrix(body.object),q.textMatrix)){problems.push('styled-sentence-live-source-instance-mismatch');return result();}
  const masks=maskSpecs.map(spec=>main.children?.get(spec.depth));
  if(masks.some((mask,i)=>{const spec=maskSpecs[i];return!mask||mask.def!==runtime.page.dictionary[spec.characterId]||mask.charId!==spec.characterId||mask.clipDepth!==spec.clipDepth||sourceInstanceId(mask,root,prepared.source)!==spec.instanceId||!same(matrix(mask),spec.completeMatrix)||outlineGeometry(mask.def)!==outlineGeometry(runtime.page.dictionary[spec.characterId]);})){problems.push('styled-sentence-live-source-instance-mismatch');return result();}
  const qualifiedMasks=masks as HfrTextDisplayObject[],actualMasks=sourceMasksAt(body.object);
  if(actualMasks.length!==qualifiedMasks.length||actualMasks.some(mask=>!qualifiedMasks.includes(mask))||body.problems.some(p=>p!=='source-clipping-mask-unresolved')){problems.push('styled-sentence-unqualified-mask-or-effect');return result();}
  const ink=rectangleInParent(q.inkBoundsTwips,matrix(body.object)),maskBounds=qualifiedMasks.map(mask=>rectangleInParent({left:mask.def.bounds.xmin,right:mask.def.bounds.xmax,top:mask.def.bounds.ymin,bottom:mask.def.bounds.ymax},matrix(mask)));
  if(!ink||maskBounds.some(b=>!b||ink.left<b.left||ink.right>b.right||ink.top<b.top||ink.bottom>b.bottom)||
     hfrSourceViewportVisibility(q.inkBoundsTwips,body.matrix,prepared.source.header.stageBoundsTwips)!=='inside'){problems.push('styled-sentence-ink-outside-source-mask-or-stage');return result();}
  const required=new Set<HfrTextDisplayObject>([body.object,...qualifiedMasks,title.object,main,root]);
  for(const control of q.controls){const candidates=children(main).filter(o=>o.charId===control.sourceButtonCharacterId&&sourceInstanceId(o,root,prepared.source)===control.instanceId);const button=candidates[0];
    if(candidates.length!==1||!button?.isButton||button.def!==runtime.page.dictionary[control.sourceButtonCharacterId]||button.clipDepth||!sourceButtonEnabled(button)){problems.push('styled-sentence-source-button-mismatch');continue;}
    required.add(button);controls.push(Object.freeze({...control,liveButton:button}));
  }
  for(const member of [...required])for(let o:HfrTextDisplayObject|null|undefined=member;o;o=o.parentClip)required.add(o);
  for(const object of required){if(object.removed||!object.visible||object.mask||object.scriptMoved||!same(object.cx,rgbaIdentity))problems.push('styled-sentence-source-visibility-or-transform-mismatch');sourceState.push(Object.freeze({object,definition:object.def,scriptMoved:Boolean(object.scriptMoved),playing:object.playing}));}
  return result(problems.length?undefined:body.object);
}

/** Three source-qualified vocabulary consumers share the existing snapshot path.
 * A partially revealed source word stays on Canvas; only complete exact instances
 * enter the native layer. Mathematical labels retain their original coordinates. */
function observeVocabulary(prepared:PreparedHfrNativeText,runtime:HfrTextRuntime,frameDomain:string,observed:ObservedText[],domains:readonly HfrTextDisplayObject[]) {
  const q=prepared.decisions?.vocabulary,problems:string[]=[],complete=new Set<HfrTextDisplayObject>(),controls:HfrNativeGlossaryControl[]=[];
  if(!q)return null;
  const result=()=>({problems,complete,controls,nativeControls:controls.filter(control=>{const spec=q.controls.find(c=>c.sourceButtonCharacterId===control.sourceButtonCharacterId);return Boolean(spec&&observed.some(n=>`character-${n.object.charId}`===spec.sourceTextId&&complete.has(n.object)));})});
  if(!prepared.vocabularyJson||JSON.stringify(runtime.page)!==prepared.vocabularyJson||JSON.stringify([prepared.source,prepared.binding,prepared.decisions])!==prepared.vocabularyInputsFingerprint||frameDomain!==q.frameDomain||domains.length!==1){problems.push('vocabulary-source-or-clock-mismatch');return result();}
  const root=runtime.page_,main=domains[0],frame=main.frame??0,mainId=Number(q.frameDomain.slice(7));
  if(root.frame!==q.rootFrame||root.def!==runtime.page.root||main.def!==runtime.page.dictionary[mainId]||main.parentClip!==root||main.depth!==q.primaryDepth||!same(matrix(main),q.primaryMatrix)||frame<1||frame>q.mainFrames){problems.push('vocabulary-source-frame-mismatch');return result();}
  const placementMatches=(object:HfrTextDisplayObject)=>{
    const parent=object.parentClip;if(parent!==main&&parent!==root)return false;
    const placement=sourcePlacementAt(runtime.page,parent.frame??0,object.depth,parent===root?0:mainId);
    return placement&&placement.charId===object.charId&&object.def===runtime.page.dictionary[object.charId]&&
      !object.removed&&object.visible&&!object.scriptMoved&&!object.mask&&Boolean(sourceInstanceId(object,root,prepared.source))&&
      same(matrix(object),placement.m??ID)&&same(object.cx,placement.cx??rgbaIdentity)&&
      (object.ratio??0)===(placement.ratio??0)&&(object.clipDepth??0)===(placement.clipDepth??0);
  };
  const masksMatch=(object:HfrTextDisplayObject)=>{
    const expected:{parent:HfrTextDisplayObject;depth:number;characterId:number}[]=[];
    for(let child:HfrTextDisplayObject|null|undefined=object;child?.parentClip;child=child.parentClip){const parent=child.parentClip;
      if(parent!==main&&parent!==root)continue;
      const timeline=parent===root?(runtime.page.root as any):runtime.page.dictionary[mainId];
      const depths=new Set<number>(timeline.frames.slice(0,parent.frame).flatMap((tags:any[])=>tags.filter(t=>Number.isInteger(t.depth)&&t.depth<child!.depth).map(t=>t.depth)));
      for(const depth of depths){const p=sourcePlacementAt(runtime.page,parent.frame??0,depth,parent===root?0:mainId);if(p&&(p.clipDepth??0)>=child.depth)expected.push({parent,depth,characterId:p.charId});}
    }
    const actual=sourceMasksAt(object);
    return actual.length===expected.length&&expected.every(e=>actual.some(mask=>mask.parentClip===e.parent&&mask.depth===e.depth&&mask.charId===e.characterId&&
      joinedQuestionMaskBounds(q,mask)&&placementMatches(mask)));
  };
  for(const text of q.textInstances){if(!text.presentFrames.some(([from,to])=>frame>=from&&frame<=to))continue;
    const matches=observed.filter(n=>n.object.charId===text.characterId&&n.instance?.id===text.instanceId);
    if(matches.length!==1||!placementMatches(matches[0].object))problems.push(`vocabulary-required-source-text-missing-or-altered:${text.instanceId}`);
  }
  const titleCharacterId=q.outlinedTitleCharacterId??3;
  const titles=observed.filter(n=>n.object.charId===titleCharacterId);
  if(titles.length!==1||!placementMatches(titles[0].object))problems.push('vocabulary-required-source-title-missing-or-altered');
  for(const n of observed.filter(n=>n.visible)) {
    if(!placementMatches(n.object)||!masksMatch(n.object)||n.problems.some(p=>!['source-clipping-mask-unresolved','source-partial-viewport-unresolved'].includes(p))){problems.push(`vocabulary-source-instance-mismatch:${n.object.charId}`);continue;}
    const ink=q.inkBounds[n.object.charId],instance=n.instance?.id;
    const sourceWindow=n.object.charId===titleCharacterId?true:q.textInstances.some(t=>t.instanceId===instance&&t.characterId===n.object.charId&&t.fullyVisibleFrames.some(([from,to])=>frame>=from&&frame<=to));
    const completeInk=Boolean(ink&&hfrSourceViewportVisibility(ink,n.matrix,prepared.source.header.stageBoundsTwips)==='inside'&&sourceMasksAt(n.object).every(mask=>{
      const box=joinedQuestionMaskBounds(q,mask);if(!box)return false;
      const world=sourceWorldMatrix(mask),bounds=rectangleInParent({left:box.xmin,right:box.xmax,top:box.ymin,bottom:box.ymax},world),text=rectangleInParent(ink,n.matrix);
      return bounds&&text&&text.left>=bounds.left&&text.right<=bounds.right&&text.top>=bounds.top&&text.bottom<=bounds.bottom;
    }));
    if(sourceWindow!==completeInk){problems.push(`vocabulary-ink-window-mismatch:${instance}`);continue;}
    if(completeInk){complete.add(n.object);n.problems=n.problems.filter(p=>!['source-clipping-mask-unresolved','source-partial-viewport-unresolved'].includes(p));}
    else n.visible=false;
  }
  for(const spec of q.controls) {
    const matches=children(main).filter(o=>o.charId===spec.sourceButtonCharacterId),button=matches[0];
    const depth=Number(spec.instanceId.split('/').at(-1)!.split(':')[1]),expected=sourcePlacementAt(runtime.page,frame,depth,mainId);
    if(!matches.length&&!expected)continue;
    if(!expected||expected.charId!==spec.sourceButtonCharacterId){problems.push(`vocabulary-unexpected-source-control:${spec.sourceButtonCharacterId}`);continue;}
    if(matches.length!==1||!button.isButton||!button.visible||!sourceButtonEnabled(button)||!placementMatches(button)||!masksMatch(button)){problems.push(`vocabulary-source-control-mismatch:${spec.sourceButtonCharacterId}`);continue;}
    const instanceId=sourceInstanceId(button,root,prepared.source)!;
    controls.push(Object.freeze({...spec,instanceId,liveButton:button}));
  }
  return result();
}

/** Only the independently proved L11 morph rectangles may use linear bounds.
 * Their raw/generated edge correspondence and fill loops are source-bound. */
function joinedQuestionMaskBounds(q:Pick<HfrJoinedQuestionDecision,'masks'>,mask:HfrTextDisplayObject):any|null {
  const spec=q.masks.find(s=>s.characterId===mask.charId);if(!spec)return null;
  if(!spec.kind)return mask.def.kind==='shape'?mask.def.bounds:null;
  const ratio=mask.ratio??0;if(mask.def.kind!=='morph'||!Number.isInteger(ratio)||ratio<0||ratio>65535)return null;
  return Object.fromEntries(['xmin','xmax','ymin','ymax'].map(k=>[k,mask.def.sb[k]+(mask.def.eb[k]-mask.def.sb[k])*ratio/65535]));
}
/** Each admitted member exposes one joined question only when both reveal masks
 * contain their exact glyph ink. Earlier canvas releases keep their own masks. */
function observeJoinedQuestion(prepared:PreparedHfrNativeText,runtime:HfrTextRuntime,frameDomain:string,observed:ObservedText[],domains:readonly HfrTextDisplayObject[]) {
  const q=prepared.decisions?.joinedQuestion,problems:string[]=[],complete=new Set<HfrTextDisplayObject>(),controls:HfrNativeGlossaryControl[]=[];
  if(!q)return null;
  const result=()=>({problems,complete,controls});
  if(!prepared.joinedQuestionJson||JSON.stringify(runtime.page)!==prepared.joinedQuestionJson||JSON.stringify([prepared.source,prepared.binding,prepared.decisions])!==prepared.joinedQuestionInputsFingerprint||frameDomain!==q.frameDomain||domains.length!==1){problems.push('joined-question-source-or-clock-mismatch');return result();}
  const root=runtime.page_,main=domains[0],frame=main.frame??0,mainId=Number(q.frameDomain.slice(7));
  if(root.frame!==q.rootFrame||root.def!==runtime.page.root||main.def!==runtime.page.dictionary[mainId]||main.parentClip!==root||main.depth!==q.primaryDepth||!same(matrix(main),q.primaryMatrix)||frame<1||frame>q.mainFrames){problems.push('joined-question-source-frame-mismatch');return result();}
  const placementMatches=(object:HfrTextDisplayObject)=>{
    const parent=object.parentClip;if(!parent)return false;
    const placement=sourcePlacementAt(runtime.page,parent.frame??0,object.depth,parent===root?0:parent.charId);
    return placement&&placement.charId===object.charId&&object.def===runtime.page.dictionary[object.charId]&&
      !object.removed&&object.visible&&!object.scriptMoved&&!object.mask&&Boolean(sourceInstanceId(object,root,prepared.source))&&
      same(matrix(object),placement.m??ID)&&same(object.cx,placement.cx??rgbaIdentity)&&
      (object.ratio??0)===(placement.ratio??0)&&(object.clipDepth??0)===(placement.clipDepth??0);
  };
  const masksMatch=(object:HfrTextDisplayObject)=>{
    const expected:{parent:HfrTextDisplayObject;depth:number;characterId:number}[]=[];
    for(let child:HfrTextDisplayObject|null|undefined=object;child?.parentClip;child=child.parentClip){const parent=child.parentClip;
      if(parent!==main&&parent!==root)continue;
      const timeline=parent===root?(runtime.page.root as any):runtime.page.dictionary[mainId];
      const depths=new Set<number>(timeline.frames.slice(0,parent.frame).flatMap((tags:any[])=>tags.filter(t=>Number.isInteger(t.depth)&&t.depth<child!.depth).map(t=>t.depth)));
      for(const depth of depths){const p=sourcePlacementAt(runtime.page,parent.frame??0,depth,parent===root?0:mainId);if(p&&(p.clipDepth??0)>=child.depth)expected.push({parent,depth,characterId:p.charId});}
    }
    const actual=sourceMasksAt(object);
    return actual.length===expected.length&&expected.every(e=>actual.some(mask=>mask.parentClip===e.parent&&mask.depth===e.depth&&mask.charId===e.characterId&&joinedQuestionMaskBounds(q,mask)&&placementMatches(mask)));
  };
  if(!placementMatches(main))problems.push('joined-question-primary-instance-mismatch');
  const title=observed.find(n=>n.instance?.id===q.title.instanceId),offstage=observed.find(n=>n.instance?.id===q.offstageTitle.instanceId);
  if(!title?.visible||title.object.charId!==q.title.characterId||!placementMatches(title.object)||!placementMatches(title.object.parentClip!)||title.opacity!==1||title.problems.length)problems.push('joined-question-visible-title-mismatch');
  if(!offstage||offstage.object.charId!==q.offstageTitle.characterId||!placementMatches(offstage.object)||offstage.visible)problems.push('joined-question-offstage-title-mismatch');
  const fullWindow=frame>=q.firstCompleteFrame&&frame<=q.lastCompleteFrame;
  for(const body of q.bodies){
    const depth=Number(body.instanceId.split('/').at(-1)!.split(':')[1]),expected=sourcePlacementAt(runtime.page,frame,depth,mainId),matches=observed.filter(n=>n.object.charId===body.characterId);
    if(!matches.length&&!expected)continue;
    const n=matches[0];
    if(!expected||expected.charId!==body.characterId||matches.length!==1||n.instance?.id!==body.instanceId||!n.visible||!placementMatches(n.object)||!masksMatch(n.object)||n.opacity!==1||n.problems.some(p=>p!=='source-clipping-mask-unresolved')){problems.push(`joined-question-body-instance-mismatch:${body.characterId}`);continue;}
    const completeInk=hfrSourceViewportVisibility(body.inkBounds,n.matrix,prepared.source.header.stageBoundsTwips)==='inside'&&sourceMasksAt(n.object).every(mask=>{
      const box=joinedQuestionMaskBounds(q,mask);if(!box)return false;
      const bounds=rectangleInParent({left:box.xmin,right:box.xmax,top:box.ymin,bottom:box.ymax},sourceWorldMatrix(mask)),text=rectangleInParent(body.inkBounds,n.matrix);
      return bounds&&text&&text.left>=bounds.left&&text.right<=bounds.right&&text.top>=bounds.top&&text.bottom<=bounds.bottom;
    });
    if(fullWindow&&!completeInk)problems.push(`joined-question-ink-window-mismatch:${body.characterId}`);
    if(completeInk){complete.add(n.object);n.problems=n.problems.filter(p=>p!=='source-clipping-mask-unresolved');}
  }
  for(const spec of q.controls){
    const depth=Number(spec.instanceId.split('/').at(-1)!.split(':')[1]),expected=sourcePlacementAt(runtime.page,frame,depth,mainId),matches=children(main).filter(o=>o.charId===spec.sourceButtonCharacterId);
    if(!matches.length&&!expected)continue;
    const button=matches[0];
    const instanceId=button?sourceInstanceId(button,root,prepared.source):null;
    if(!expected||expected.charId!==spec.sourceButtonCharacterId||matches.length!==1||!button.isButton||!sourceButtonEnabled(button)||!instanceId||!(spec.sourceInstanceIds??[spec.instanceId]).includes(instanceId)||!placementMatches(button)||!masksMatch(button)){problems.push(`joined-question-source-control-mismatch:${spec.sourceButtonCharacterId}`);continue;}
    controls.push(Object.freeze({...spec,instanceId,liveButton:button}));
  }
  if(problems.length)controls.length=0;
  if(!fullWindow||complete.size!==q.bodies.length||controls.length!==q.controls.length)problems.push('joined-question-ink-not-complete');
  return result();
}

/** One immutable snapshot feeds actual native words and exact old-text suppression.
 * Parent/child clocks and values come from HFR; viewport/font/UI changes own no clock. */
/** One stroke-only horizontal source line: every segment at one y, one colour. */
function sourceUnderlineStroke(def:any):{color:readonly number[];y:number;segments:(readonly [number,number])[]}|null {
  if(def?.kind!=='shape'||!Array.isArray(def.draws)||def.draws.length!==1||def.bounds?.ymin!==def.bounds?.ymax)return null;
  const draw=def.draws[0];if(!draw?.line||draw.fill||typeof draw.path!=='string'||!Array.isArray(draw.line.c))return null;
  const tokens=[...draw.path.matchAll(/([ml])(-?\d+) ?(-?\d+)/gu)];
  if(!tokens.length||tokens.map(t=>t[0]).join('')!==draw.path||tokens[0][1]!=='m')return null;
  let x=0,y=0;const segments:(readonly [number,number])[]=[];
  for(const [index,[,op,dx,dy]] of tokens.entries()){
    const nx=x+Number(dx),ny=y+Number(dy);
    if(index>0&&ny!==y)return null;
    if(op==='l'){if(nx===x)return null;segments.push([Math.min(x,nx),Math.max(x,nx)]);}
    x=nx;y=ny;
  }
  return segments.length&&y===def.bounds.ymin?{color:draw.line.c,y,segments}:null;
}
/** Underline hand-offs verified when these pages were registered. A registered
 * page keeps exactly this set (none when absent) until it is re-qualified; the
 * shared rule below decides alone for every other page. Do not add new pages. */
export const HFR_REGISTERED_UNDERLINE_HANDOFFS:Readonly<Record<string,readonly number[]>>={
  'shared-nms002-l11-p007':[12],'shared-nms002-l11-p008':[6],'shared-nms002-l11-p011':[6],
  'shared-nms002-l11-p012':[3],'shared-nms002-l11-p013':[3],'shared-nms002-l11-p015':[3,10],
};
/** Shared source link-underline hand-off. A source shape stops drawing only when
 * it is the exact authored placement, in the primary clip, of one stroke-only
 * horizontal line whose segments correspond one-to-one to the link glyph spans
 * of one complete native vocabulary body: same colour as those link runs, just
 * below their baseline (within 1/4 em), and each end within 1/8 em. Every source
 * control of that body must have its native control. Anything else keeps drawing. */
function hfrSourceLinkUnderlines(page:HfrTextRuntime['page'],source:HfrTextSourceCatalog,q:HfrVocabularyDecision,
  vocabulary:NonNullable<ReturnType<typeof observeVocabulary>>,main:HfrTextDisplayObject,root:HfrTextDisplayObject,
  observed:readonly ObservedText[],sourceObjects:readonly HfrTextDisplayObject[]):HfrTextDisplayObject[] {
  const mainId=Number(q.frameDomain.slice(7)),texts=new Map(source.textDefinitions.map(t=>[t.characterId,t]));
  const nativeButtons=new Set(vocabulary.nativeControls.map(c=>c.sourceButtonCharacterId));
  const bodies:{color:readonly number[];x0:number;x1:number;baseline:number;em:number}[][]=[];
  for(const textId of new Set(q.controls.map(c=>c.sourceTextId))){
    const specs=q.controls.filter(c=>c.sourceTextId===textId),charId=Number(/^character-(\d+)$/u.exec(textId)?.[1]??NaN);
    const found=observed.filter(n=>n.object.charId===charId&&n.object.parentClip===main),body=found[0],t=texts.get(charId);
    if(found.length!==1||!body.visible||!vocabulary.complete.has(body.object)||!sourceObjects.includes(body.object)||
      !t||t.kind!=='static-text'||body.object.def?.kind!=='text'||!specs.every(s=>nativeButtons.has(s.sourceButtonCharacterId)))continue;
    const m=multiplyHfrTextMatrix(matrix(body.object),body.object.def.m??ID);
    if(m[1]!==0||m[2]!==0||!(m[0]>0)||!(m[3]>0))continue;
    const spans=specs.flatMap(spec=>spec.glyphSpans??[{runIndex:spec.runIndex,glyphStart:spec.glyphStart??-1,glyphEndExclusive:spec.glyphEndExclusive??-1}]).map(s=>{
      const run=body.object.def.runs?.[s.runIndex],glyphs=t.runs?.[s.runIndex]?.glyphs,last=s.glyphEndExclusive-1;
      if(!run||!Array.isArray(run.g)||!glyphs||run.g.length!==glyphs.length||!(s.glyphStart>=0)||last<s.glyphStart||last>=run.g.length||!Array.isArray(run.c))return null;
      return {color:run.c as readonly number[],x0:m[0]*run.g[s.glyphStart][1]+m[4],x1:m[0]*(run.g[last][1]+glyphs[last].advanceTwips)+m[4],baseline:m[3]*run.y+m[5],em:m[3]*run.h};
    });
    if(spans.length&&spans.every(Boolean))bodies.push(spans as NonNullable<typeof spans[number]>[]);
  }
  const id=page.placement.animationId,pinned=HFR_GLYPH_LAYOUT_REGISTERED_BEFORE_SHARED_RULE.has(id)?HFR_REGISTERED_UNDERLINE_HANDOFFS[id]??[]:null;
  const retired:HfrTextDisplayObject[]=[],siblings=children(main);
  for(const line of siblings){
    const stroke=sourceUnderlineStroke(line.def),placement=stroke?sourcePlacementAt(page,main.frame??0,line.depth,mainId):null,lm=matrix(line);
    if(!stroke||sourceObjects.includes(line)||siblings.filter(o=>o.charId===line.charId).length!==1||line.parentClip!==main||
      line.def!==page.dictionary[line.charId]||!line.visible||line.removed||line.scriptMoved||line.mask||(line.ratio??0)!==0||(line.clipDepth??0)!==0||
      !same(line.cx,rgbaIdentity)||placement?.charId!==line.charId||!same(lm,placement.m??ID)||lm[1]!==0||lm[2]!==0||!(lm[0]>0)||!(lm[3]>0)||
      !sourceInstanceId(line,root,source)||!source.shapeDefinitions?.some(shape=>shape.characterId===line.charId))continue;
    const y=lm[3]*stroke.y+lm[5],segments=stroke.segments.map(([a,b])=>[lm[0]*a+lm[4],lm[0]*b+lm[4]] as const).sort((a,b)=>a[0]-b[0]);
    const matches=bodies.filter(spans=>{
      const under=spans.filter(s=>same(s.color,stroke.color)&&y>s.baseline&&y-s.baseline<=s.em/4).sort((a,b)=>a.x0-b.x0);
      return under.length===segments.length&&under.every((s,i)=>Math.abs(segments[i][0]-s.x0)<=s.em/8&&Math.abs(segments[i][1]-s.x1)<=s.em/8);
    });
    if(matches.length===1&&(!pinned||pinned.includes(line.charId)))retired.push(line);
  }
  return retired;
}
export function buildHfrNativeTextFrame(prepared: PreparedHfrNativeText, runtime: HfrTextRuntime, frameDomain: string, identity: HfrTextIdentity): HfrNativeTextFrame {
  const {source,binding,page,decisions}=prepared, problems=[...prepared.preparationProblems], observed:ObservedText[]=[], guards:Guard[]=[], domains:HfrTextDisplayObject[]=[];
  if(runtime.page!==page) problems.push('prepared-page-object-mismatch');
  if(prepared.companionJson&&(JSON.stringify(page)!==prepared.companionJson||JSON.stringify(decisions?.readableCompanion)!==prepared.companionFingerprint))problems.push('readable-companion-candidate-drift');
  const timelines=new Map(source.timelines.map(t=>[t.timelineId,t]));
  const root=runtime.page_;
  const visit=(o:HfrTextDisplayObject,parent:HfrTextDisplayObject|null,path:readonly LessonTextInstanceSegment[],world:Matrix,cx:readonly number[],visible:boolean,inheritedProblems:readonly string[])=>{
    const localProblems=[...inheritedProblems]; let ownPath=[...path];
    guards.push({object:o,state:state(o),children:Object.freeze(children(o)),...(prepared.verifiedOutlines.has(o.charId)?{outlineGeometry:outlineGeometry(o.def)}:{})});
    const w=multiplyHfrTextMatrix(world,matrix(o));
    const combined=cx.map((v,i)=>i<4?v*o.cx[i]/256:cx[i]+cx[i-4]*o.cx[i]/256);
    const shown=visible&&o.visible&&!o.removed&&(combined[3]>0||combined[7]>0);
    if(o.isClip && (o===root?'root':`sprite-${o.charId}`)===frameDomain) domains.push(o);
    if(parent) {
      const tid=parent===root?'root':`sprite-${parent.charId}`;
      const timeline=timelines.get(tid), frame=parent.frame??0;
      const matches=timeline?.instances.filter(x=>x.depth===o.depth&&x.characterId===o.charId&&frame>=x.firstFrame&&frame<x.lastFrameExclusive)??[];
      if(parent.isButton || o.depth<0) localProblems.push('button-or-dynamic-instance-unresolved');
      else if(matches.length!==1) localProblems.push('source-instance-generation-unresolved');
      else {
        const match=matches[0];ownPath.push({timelineId:tid,depth:o.depth,generation:match.generation,characterId:o.charId});
        if(timeline!.events.some(e=>e.frame<=frame&&match.updates.includes(e.eventId)&&(e.filters||(e.blendMode??0)>1)))localProblems.push('source-filter-or-blend-unresolved');
      }
    }
    if(o.mask) localProblems.push('runtime-mask-unresolved');
    if(o.def?.kind==='text'||o.def?.kind==='edittext'||binding.blocks.some(b=>b.sourceShapeIds?.includes(o.charId))) {
      const instance=ownPath.length&&!localProblems.some(p=>p.includes('instance'))?{id:lessonTextInstanceId(ownPath),path:Object.freeze(ownPath)}:null;
      const bounds={left:o.def.bounds?.xmin,right:o.def.bounds?.xmax,top:o.def.bounds?.ymin,bottom:o.def.bounds?.ymax};
      const viewport=hfrSourceViewportVisibility(bounds,w,source.header.stageBoundsTwips);
      if(viewport==='partial')localProblems.push('source-partial-viewport-unresolved');
      if(viewport==='invalid')localProblems.push('noninvertible-text-layout-unresolved');
      if(o.def.kind==='shape'&&(o.def!==page.dictionary[o.charId]||prepared.verifiedOutlines.get(o.charId)!==outlineGeometry(o.def)))localProblems.push('outlined-title-live-geometry-mismatch');
      const alphas=o.def.kind==='text'?o.def.runs.map((r:any)=>r.c?.[3]??255):o.def.kind==='shape'?o.def.draws.map((r:any)=>r.fill?.c?.[3]??r.line?.c?.[3]??255):[o.textColor?.[3]??o.def.color?.[3]??255];
      const opacity=Math.max(0,...alphas.map((a:number)=>Math.min(1,Math.max(0,(a*combined[3]/256+combined[7])/255))));
      observed.push({object:o,instance,matrix:w,visible:shown&&opacity>0&&viewport!=='outside',opacity,problems:localProblems});
    }
    let maskEnd=-1;
    for(const child of children(o)) {
      const extra=[...localProblems];
      if((child.clipDepth??0)>0){maskEnd=Math.max(maskEnd,child.clipDepth!);extra.push('source-mask-object-unresolved');}
      else if(child.depth<=maskEnd)extra.push('source-clipping-mask-unresolved');
      visit(child,o,ownPath,w,combined,shown,extra);
    }
  };
  // The page root's real ancestors may have transforms/visibility. They are read,
  // but excluded from source instance paths because they are modern host objects.
  const ancestors:HfrTextDisplayObject[]=[];for(let o=root.parentClip;o;o=o.parentClip)ancestors.unshift(o);
  let parentMatrix=ID,parentCx=rgbaIdentity,parentVisible=true;
  for(const o of ancestors){guards.push({object:o,state:state(o),children:Object.freeze(children(o))});parentMatrix=multiplyHfrTextMatrix(parentMatrix,matrix(o));parentCx=parentCx.map((v,i)=>i<4?v*o.cx[i]/256:parentCx[i]+parentCx[i-4]*o.cx[i]/256);parentVisible=parentVisible&&o.visible&&!o.removed;}
  visit(root,null,[],parentMatrix,parentCx,parentVisible,[]);
  if(domains.length!==1)problems.push('source-clock-domain-not-unique');
  const styled=observeStyledSentence(prepared,runtime,frameDomain,observed,domains);
  const sourceGlossary=observeSourceGlossary(prepared,runtime,frameDomain,observed,domains);
  const vocabulary=observeVocabulary(prepared,runtime,frameDomain,observed,domains);
  const joined=observeJoinedQuestion(prepared,runtime,frameDomain,observed,domains);
  problems.push(...styled.problems);
  problems.push(...(vocabulary?.problems??[]));
  problems.push(...(joined?.problems??[]));
  const textMap=new Map(source.textDefinitions.map(t=>[t.sourceTextId,t]));
  const values:Record<string,{text:string;visible:boolean}>={},opacityByBlock:Record<string,number>={},tokensByBlock:Record<string,readonly HfrNativeTextToken[]>={},geometryByBlock:Record<string,{linear:Matrix;fontSizeRem:number;sourceGlyphOffsetsTwips?:readonly number[]}>={},sourceObjects:HfrTextDisplayObject[]=[],instances:LessonTextInstance[]=[],transforms:{instanceId:string;matrixTwips:Matrix}[]=[],bound=new Set<HfrTextDisplayObject>();
  // Repeated source characters stay distinct. Their full live source paths are
  // expanded into ordinary LessonTextBinding blocks, never merged by char ID.
  const expanded=binding.blocks.flatMap(block=>{
    const matches=observed.filter(n=>n.visible&&(block.sourceTextIds.includes(`character-${n.object.charId}`)||Boolean(block.sourceShapeIds?.includes(n.object.charId))));
    if(block.role==='label'&&!block.instance&&matches.length>1)return matches.map((n,i)=>({...block,id:`${block.id}@${n.instance?.id??i}`,instance:n.instance??undefined,readingOrder:block.readingOrder*10000+i}));
    return [{...block,readingOrder:block.readingOrder*10000}];
  });
  const runtimeBlocks=expanded.map(block=>{
    const found=observed.filter(n=>(block.sourceTextIds.includes(`character-${n.object.charId}`)||Boolean(block.sourceShapeIds?.includes(n.object.charId)))&&(!block.instance||block.instance.id===n.instance?.id));
    const active=found.filter(n=>n.visible);for(const n of found)bound.add(n.object);
    if(block.sourceTextIds.length&&!block.sourceShapeIds?.length&&block.sourceTextIds.every(id=>decisions?.preserveDecorative?.some(d=>d.sourceTextId===id))){values[block.id]={text:'',visible:false};opacityByBlock[block.id]=0;return block;}
    if(active.some(n=>active.filter(x=>x.object.charId===n.object.charId).length>1))problems.push(`ambiguous-repeated-source-text:${block.id}`);
    const texts:string[]=[];
    for(const n of active){
      const t=textMap.get(`character-${n.object.charId}`)!;problems.push(...n.problems.filter(p=>!(styled.text===n.object&&p==='source-clipping-mask-unresolved')).map(p=>`${p}:${block.id}`));
      if(!n.instance)problems.push(`missing-exact-text-instance:${block.id}`);
      let value='';
      if(n.object.def.kind==='shape') {
        value=decisions?.outlinedTitles?.find(d=>d.characterId===n.object.charId)?.text??'';
        tokensByBlock[block.id]=Object.freeze([{text:value,baseline:'normal'}]);
      } else if(t.kind==='static-text') {
        const tokens=t.runs!.flatMap((r,ri)=>{
          let text=r.glyphs.map(g=>g.unicode??decisions?.glyphMappings?.find(d=>d.sourceTextId===t.sourceTextId&&d.runIndex===ri&&d.glyphIndex===g.index&&d.sourceCode===g.code)?.unicode??'').join('');
          if(r.glyphs.some(g=>g.unicode===null&&!decisions?.glyphMappings?.some(d=>d.sourceTextId===t.sourceTextId&&d.runIndex===ri&&d.glyphIndex===g.index&&d.sourceCode===g.code)))problems.push(`unresolved-source-glyph:${block.id}`);
          const semantics=decisions?.runSemantics?.find(d=>d.sourceTextId===t.sourceTextId&&d.runIndex===ri);
          if(semantics)text=semantics.text;
          const lineBreak=decisions?.lineBreaks?.find(d=>d.sourceTextId===t.sourceTextId&&d.runIndex===ri);
          if(lineBreak)text='\n'+text;
          const baseline:'normal'|'superscript'=semantics?.kind==='superscript'?'superscript':'normal';
          const joinedRun=joined&&prepared.joinedQuestionJson?decisions!.joinedQuestion!.bodies.find(b=>b.sourceTextId===t.sourceTextId)?.runs[ri]:undefined;
          const joinedFontSize=joinedRun&&decisions!.joinedQuestion!.baseFontHeightTwips&&joinedRun.fontHeightTwips===r.fontHeightTwips;
          const reference=t.runs![0];if((r.yOffsetTwips!==reference.yOffsetTwips&&baseline!=='superscript'&&!lineBreak)||(r.fontHeightTwips!==reference.fontHeightTwips&&!semantics&&!joinedFontSize))problems.push(`mixed-baseline-math-unresolved:${block.id}`);
          if(styled.text===n.object){const q=decisions!.styledSentence!,run=q.runs[ri],spans=q.controls.filter(c=>c.runIndex===ri&&c.glyphStart!==undefined).sort((a,b)=>a.glyphStart!-b.glyphStart!);
            if(spans.length){const parts:HfrNativeTextToken[]=[],glyphs=r.glyphs.map(g=>g.unicode!),base={baseline,colorRgba:Object.freeze([...run.colorRgba]),fontWeight:run.fontWeight};let cursor=0;
              for(const span of spans){const start=span.glyphStart!,end=span.glyphEndExclusive!;
                if(!Number.isInteger(start)||!Number.isInteger(end)||start<cursor||end<=start||end>glyphs.length){problems.push(`styled-sentence-invalid-glyph-span:${block.id}`);return [];}
                if(start>cursor)parts.push(Object.freeze({...base,text:glyphs.slice(cursor,start).join('')}));
                parts.push(Object.freeze({...base,text:glyphs.slice(start,end).join(''),glossaryButtonCharacterId:span.sourceButtonCharacterId}));cursor=end;
              }
              if(cursor<glyphs.length)parts.push(Object.freeze({...base,text:glyphs.slice(cursor).join('')}));return parts;
            }
            return Object.freeze({text,baseline,colorRgba:Object.freeze([...run.colorRgba]),fontWeight:run.fontWeight,...(q.controls.some(c=>c.runIndex===ri)?{glossaryRunIndex:ri}:{})}) as HfrNativeTextToken;
          }
          if(joined&&prepared.joinedQuestionJson){const body=decisions!.joinedQuestion!.bodies.find(b=>b.sourceTextId===t.sourceTextId),run=body?.runs[ri],control=decisions!.joinedQuestion!.controls.find(c=>c.sourceTextId===t.sourceTextId&&c.runIndex===ri);
            if(run)return Object.freeze({text,baseline,colorRgba:Object.freeze([...run.colorRgba]),fontWeight:run.fontWeight,...(decisions!.joinedQuestion!.baseFontHeightTwips?{fontScale:run.fontHeightTwips/decisions!.joinedQuestion!.baseFontHeightTwips!}:{}),...(control?{glossaryButtonCharacterId:control.sourceButtonCharacterId}:{})}) as HfrNativeTextToken;}
          if(vocabulary&&prepared.vocabularyJson){const base={baseline,colorRgba:Object.freeze([...r.colorRgba]),fontWeight:400 as const},glyphs=r.glyphs.map(g=>g.unicode!);
            const spans=decisions!.vocabulary!.controls.filter(c=>c.sourceTextId===t.sourceTextId).flatMap(control=>
              (control.glyphSpans??[{runIndex:control.runIndex,glyphStart:control.glyphStart??0,glyphEndExclusive:control.glyphEndExclusive??glyphs.length}])
                .filter(span=>span.runIndex===ri).map(span=>({...span,sourceButtonCharacterId:control.sourceButtonCharacterId})))
              .sort((left,right)=>left.glyphStart-right.glyphStart);
            if(spans.length){const parts:HfrNativeTextToken[]=[];let cursor=0;
              for(const span of spans){const from=span.glyphStart,to=span.glyphEndExclusive;
                if(!Number.isInteger(from)||!Number.isInteger(to)||from<cursor||to<=from||to>glyphs.length){problems.push(`vocabulary-invalid-control-glyph-span:${block.id}`);return [];}
                if(from>cursor)parts.push(Object.freeze({...base,text:glyphs.slice(cursor,from).join('')}));
                parts.push(Object.freeze({...base,text:glyphs.slice(from,to).join(''),glossaryButtonCharacterId:span.sourceButtonCharacterId}));cursor=to;
              }
              if(cursor<glyphs.length)parts.push(Object.freeze({...base,text:glyphs.slice(cursor).join('')}));return parts;}
            return Object.freeze({...base,text}) as HfrNativeTextToken;}
          return {text,baseline} as HfrNativeTextToken;
        });
        tokensByBlock[block.id]=Object.freeze(tokens);
        if(new Set(t.runs!.map(r=>JSON.stringify(r.colorRgba))).size>1&&styled.text!==n.object&&!vocabulary?.complete.has(n.object)&&!joined?.complete.has(n.object))problems.push(`mixed-run-style-semantics-unresolved:${block.id}`);
        value=tokens.map(t=>t.baseline==='superscript'?`^${t.text}`:t.text).join('');
      } else {
        if(!t.flags?.readOnly||t.flags.password||n.object.border||n.object.html||n.object.htmlValue!==undefined)problems.push(`interactive-or-html-edittext-unresolved:${block.id}`);
        const font=source.fonts.find(f=>f.characterId===t.fontId);
        if(/symbol|wingdings|webdings|dingbat/i.test(String(n.object.format?.font??font?.name?.text??'')))problems.push(`unresolved-dynamic-symbol-font:${block.id}`);
        if(typeof n.object.textValue!=='string')problems.push(`missing-live-edittext-value:${block.id}`);
        value=n.object.textValue??'';
      }
      texts.push(value);if(n.instance){instances.push(n.instance);sourceObjects.push(n.object);transforms.push({instanceId:n.instance.id,matrixTwips:n.matrix});}
    }
    if(new Set(texts).size>1)problems.push(`grouped-source-text-values-differ:${block.id}`);
    values[block.id]={text:texts[0]??'',visible:active.length>0&&Boolean(texts[0]?.trim())};
    opacityByBlock[block.id]=active.length?Math.max(...active.map(n=>n.opacity)):0;
    if(block.role!=='label'||!active.length)return block;
    if(active.length!==1)problems.push(`label-needs-one-exact-instance:${block.id}`);
    const n=active[0], t=textMap.get(`character-${n.object.charId}`)!;
    const m=multiplyHfrTextMatrix(n.matrix,t.matrix??ID);
    if(!m.every(Number.isFinite)||Math.abs(m[0]*m[3]-m[1]*m[2])<1e-12)problems.push(`noninvertible-text-layout-unresolved:${block.id}`);
    geometryByBlock[block.id]={linear:[m[0],m[1],m[2],m[3],0,0],fontSizeRem:(t.runs?.[0].fontHeightTwips??t.fontHeightTwips??360)/320};
    // This source changes the final repeating digit's generation while its bar
    // remains Canvas geometry. Keep every native glyph on its authored baseline;
    // responsive figure width scales the positions, never the rem font size.
    if(page.placement.animationId==='shared-nms002-l11-p011'&&(n.object.charId===20||(n.object.charId>=22&&n.object.charId<=57))){
      const q=decisions?.vocabulary,run=t.runs?.[0],live=n.object.def.runs?.[0];
      const text=n.object.charId===20?'= 0.3':'= 0.'+'1'.repeat(n.object.charId-21),offsets:number[]=[];let advance=0;
      const qualified=Boolean(vocabulary?.complete.has(n.object)&&prepared.vocabularyJson&&
        q&&same(q,HFR_VOCABULARY_SOURCE_BINDINGS['shared-nms002-l11-p011'])&&
        page.source.sha256==='08a31899ced03455e03b51ce846f57108a6b98a8e442f6799b6a5cc4b46b8471'&&
        source.sourceSha256===page.source.sha256&&binding.sourceSwfSha256===page.source.sha256&&
        page.stage.width===800&&page.stage.height===600&&frameDomain==='sprite-58'&&
        t.kind==='static-text'&&t.runs?.length===1&&n.object.def.kind==='text'&&n.object.def.runs?.length===1&&
        t.characterId===n.object.charId&&t.sourceTextId===`character-${n.object.charId}`&&same(m.slice(0,4),[1,0,0,1])&&
        run&&run.fontId===1&&run.fontHeightTwips===440&&(run.xOffsetTwips??0)===0&&run.yOffsetTwips===420&&
        run.text===text&&live?.str===text&&run.glyphs.length===text.length&&live.g?.length===text.length&&
        tokensByBlock[block.id]?.map(token=>token.text).join('')===text);
      if(qualified)for(const [i,glyph]of run!.glyphs.entries()){
        if(glyph.unicode!==text[i]||glyph.unicode?.length!==1||glyph.code!==text.charCodeAt(i)||
          !Number.isSafeInteger(glyph.advanceTwips)||glyph.advanceTwips<=0||
          live.g[i][0]!==glyph.index||live.g[i][1]!==advance){offsets.length=0;break;}
        offsets.push(advance);advance+=glyph.advanceTwips;
      }
      if(!qualified||offsets.length!==text.length)problems.push(`p011-decimal-source-glyph-position-mismatch:${block.id}`);
      else geometryByBlock[block.id].sourceGlyphOffsetsTwips=Object.freeze(offsets);
    }
    // P012's higher-depth magenta flashes must occupy the same authored
    // glyph baselines as the independently actionable blue heading words.
    if(page.placement.animationId==='shared-nms002-l11-p012'&&[15,18,21,24,26].includes(n.object.charId)){
      const q=decisions?.vocabulary,run=t.runs?.[0],live=n.object.def.runs?.[0];
      const text=({15:'Word Form',18:'Decimal Form',21:'Fractional Form',24:'Decimal Form',26:'Fractional Form'} as Record<number,string>)[n.object.charId],offsets:number[]=[];let advance=0;
      const qualified=Boolean(vocabulary?.complete.has(n.object)&&prepared.vocabularyJson&&
        q&&same(q,HFR_VOCABULARY_SOURCE_BINDINGS['shared-nms002-l11-p012'])&&
        page.source.sha256==='6a374691151f299737f718a17921db4d50b68040c6516df1d779279f17a002a5'&&
        source.sourceSha256===page.source.sha256&&binding.sourceSwfSha256===page.source.sha256&&
        page.stage.width===800&&page.stage.height===600&&frameDomain==='sprite-43'&&
        t.kind==='static-text'&&t.runs?.length===1&&n.object.def.kind==='text'&&n.object.def.runs?.length===1&&
        t.characterId===n.object.charId&&t.sourceTextId===`character-${n.object.charId}`&&same(m.slice(0,4),[1,0,0,1])&&
        run&&run.fontId===4&&run.fontHeightTwips===440&&(run.xOffsetTwips??0)===0&&run.yOffsetTwips===420&&
        run.text===text&&live?.str===text&&run.glyphs.length===text.length&&live.g?.length===text.length&&
        tokensByBlock[block.id]?.map(token=>token.text).join('')===text);
      if(qualified)for(const [i,glyph]of run!.glyphs.entries()){
        if(glyph.unicode!==text[i]||glyph.unicode?.length!==1||glyph.code!==text.charCodeAt(i)||
          !Number.isSafeInteger(glyph.advanceTwips)||glyph.advanceTwips<=0||
          live.g[i][0]!==glyph.index||live.g[i][1]!==advance){offsets.length=0;break;}
        offsets.push(advance);advance+=glyph.advanceTwips;
      }
      if(!qualified||offsets.length!==text.length)problems.push(`p012-heading-source-glyph-position-mismatch:${block.id}`);
      else geometryByBlock[block.id].sourceGlyphOffsetsTwips=Object.freeze(offsets);
    }
    // P013's combined 3.1 and comma text retains each authored glyph position;
    // its other labels are separate source instances with individual anchors.
    if(page.placement.animationId==='shared-nms002-l11-p013'&&n.object.charId===50){
      const q=decisions?.vocabulary,run=t.runs?.[0],live=n.object.def.runs?.[0];
      const text=({50:'3.1,'} as Record<number,string>)[n.object.charId],offsets:number[]=[];let advance=0;
      const qualified=Boolean(vocabulary?.complete.has(n.object)&&prepared.vocabularyJson&&
        q&&same(q,HFR_VOCABULARY_SOURCE_BINDINGS['shared-nms002-l11-p013'])&&
        page.source.sha256==='4428cd1ec3380278a15310580187a282d0ee148eef943379cf7e6be8835111c0'&&
        source.sourceSha256===page.source.sha256&&binding.sourceSwfSha256===page.source.sha256&&
        page.stage.width===800&&page.stage.height===600&&frameDomain==='sprite-55'&&
        t.kind==='static-text'&&t.runs?.length===1&&n.object.def.kind==='text'&&n.object.def.runs?.length===1&&
        t.characterId===n.object.charId&&t.sourceTextId===`character-${n.object.charId}`&&same(m.slice(0,4),[1,0,0,1])&&
        run&&run.fontId===4&&run.fontHeightTwips===400&&(run.xOffsetTwips??0)===0&&run.yOffsetTwips===380&&
        run.text===text&&live?.str===text&&run.glyphs.length===text.length&&live.g?.length===text.length&&
        tokensByBlock[block.id]?.map(token=>token.text).join('')===text);
      if(qualified)for(const [i,glyph]of run!.glyphs.entries()){
        if(glyph.unicode!==text[i]||glyph.unicode?.length!==1||glyph.code!==text.charCodeAt(i)||
          !Number.isSafeInteger(glyph.advanceTwips)||glyph.advanceTwips<=0||
          live.g[i][0]!==glyph.index||live.g[i][1]!==advance){offsets.length=0;break;}
        offsets.push(advance);advance+=glyph.advanceTwips;
      }
      if(!qualified||offsets.length!==text.length)problems.push(`p013-combined-decimal-source-glyph-position-mismatch:${block.id}`);
      else geometryByBlock[block.id].sourceGlyphOffsetsTwips=Object.freeze(offsets);
    }
    // P015's multi-glyph numerals and multiplication expressions retain the
    // original per-run glyph advances, including the authored Times x glyph.
    if(page.placement.animationId==='shared-nms002-l11-p015'&&[16,19,20,27].includes(n.object.charId)){
      const q=decisions?.vocabulary,live=n.object.def.runs,
        expected=({16:'12',19:'3 x 2',20:'12 x 2',27:'12'} as Record<number,string>)[n.object.charId],offsets:number[]=[];
      let cursor=0,origin:number|null=null,qualified=Boolean(vocabulary?.complete.has(n.object)&&prepared.vocabularyJson&&
        q&&same(q,HFR_VOCABULARY_SOURCE_BINDINGS['shared-nms002-l11-p015'])&&
        page.source.sha256==='8c58397c556153b5f2104398939a179af077babafb469caba63ef214818c9b55'&&source.sourceSha256===page.source.sha256&&binding.sourceSwfSha256===page.source.sha256&&
        frameDomain==='sprite-36'&&page.stage.width===800&&page.stage.height===600&&
        t.kind==='static-text'&&n.object.def.kind==='text'&&t.characterId===n.object.charId&&same(m.slice(0,4),[1,0,0,1])&&
        t.runs?.length===live?.length&&tokensByBlock[block.id]?.map(token=>token.text).join('')===expected);
      if(qualified)for(const [ri,run]of t.runs!.entries()){
        if(typeof run.text!=='string'||run.fontHeightTwips!==480||run.yOffsetTwips!==460||run.text!==live[ri].str||run.fontId!==live[ri].f||run.glyphs.length!==live[ri].g.length){qualified=false;break;}
        if(run.xOffsetTwips!==null)cursor=run.xOffsetTwips!;
        for(const [gi,g]of run.glyphs.entries()){
          if(g.unicode?.length!==1||g.code!==run.text.charCodeAt(gi)||g.unicode!==run.text[gi]||!Number.isSafeInteger(g.advanceTwips)||g.advanceTwips<=0||
            live[ri].g[gi][0]!==g.index||live[ri].g[gi][1]!==cursor){qualified=false;break;}
          if(origin===null)origin=cursor;offsets.push(cursor-origin);cursor+=g.advanceTwips;
        }
        if(!qualified)break;
      }
      if(!qualified||offsets.length!==expected.length)problems.push(`p015-fraction-expression-source-glyph-position-mismatch:${block.id}`);
      else geometryByBlock[block.id].sourceGlyphOffsetsTwips=Object.freeze(offsets);
    }
    // P018 retains exact glyph origins for its rotated chart labels, anchored
    // glossary labels and decimal/fraction expressions through the existing SVG affine path.
    if(page.placement.animationId==='shared-nms002-l11-p018'){
      const q=decisions?.vocabulary;
      const offsets=vocabulary?.complete.has(n.object)&&prepared.vocabularyJson&&q&&same(q,HFR_VOCABULARY_SOURCE_BINDINGS['shared-nms002-l11-p018'])&&
        page.source.sha256==='9bc7bdad82be899cde533f17144de0fd45f643d16b890ea6bf70252d2f89be3d'&&source.sourceSha256===page.source.sha256&&binding.sourceSwfSha256===page.source.sha256&&
        frameDomain==='sprite-47'&&page.stage.width===800&&page.stage.height===600&&t.characterId===n.object.charId?
        p018NativeGlyphOffsets(t,n.object.def,tokensByBlock[block.id]?.map(token=>token.text).join('')??''):null;
      if(!offsets)problems.push(`p018-chart-source-glyph-position-mismatch:${block.id}`);
      else geometryByBlock[block.id].sourceGlyphOffsetsTwips=offsets;
    }
    // Newly installed pages keep authored static-text glyph origins through the
    // shared rule; earlier registrations keep their verified layout unchanged.
    if(!HFR_GLYPH_LAYOUT_REGISTERED_BEFORE_SHARED_RULE.has(page.placement.animationId)){
      const layout=hfrSourceGlyphLayout(t,n.object.def,tokensByBlock[block.id]?.map(token=>token.text).join('')??'');
      if(layout.status==='mismatch')problems.push(`source-glyph-position-mismatch:${layout.reason}:${block.id}`);
      else if(layout.status==='source-glyph-offsets')geometryByBlock[block.id].sourceGlyphOffsetsTwips=layout.offsets;
    }
    const anchor=point(m,t.kind==='static-text'?(t.runs?.[0].xOffsetTwips??0):t.boundsTwips.left,t.kind==='static-text'?(t.runs?.[0].yOffsetTwips??0):t.boundsTwips.top);
    return {...block,anchor:{...anchor,stageWidth:page.stage.width,stageHeight:page.stage.height,align:'start' as const}};
  });
  for(const n of observed)if(n.visible&&!bound.has(n.object))problems.push(`unbound-live-source-text:character-${n.object.charId}`);
  const expandedBinding={...binding,blocks:runtimeBlocks};
  let snapshot=buildLessonTextSnapshot(expandedBinding,{frame:domains[0]?.frame??1,frameDomain,rootFrame:root.frame??1,scenario:identity.scenario,lang:identity.lang,seed:identity.seed,replay:identity.replay},values);
  snapshot=problems.length?blocked(snapshot,problems):Object.freeze({...snapshot,suppressedInstances:Object.freeze([...new Map(instances.map(i=>[i.id,i])).values()])});
  // Source link underlines retire only with their complete native body; the
  // renderer still requires a current commit. See hfrSourceLinkUnderlines.
  if(snapshot.status==='ready'&&decisions?.vocabulary&&vocabulary&&domains.length===1)
    sourceObjects.push(...hfrSourceLinkUnderlines(page,source,decisions.vocabulary,vocabulary,domains[0],root,observed,sourceObjects));
  const styledBlock=binding.blocks.find(b=>b.sourceTextIds.includes(decisions?.styledSentence?.sourceTextId??''));
  return Object.freeze({snapshot,binding:expandedBinding,...(prepared.companionJson?{readableCompanion:decisions!.readableCompanion,readableCompanionSourceJson:prepared.companionJson,readableCompanionFingerprint:prepared.companionFingerprint}:{}),
    ...(prepared.styledJson?{styledSentenceDecision:decisions!.styledSentence,styledSentenceSourceJson:prepared.styledJson,styledSentenceFingerprint:prepared.styledFingerprint,styledSentenceInputs:Object.freeze([source,binding,decisions!]) as readonly[HfrTextSourceCatalog,LessonTextBinding,HfrSourceTextDecisions],styledSentenceInputsFingerprint:prepared.styledInputsFingerprint}:{}),
    ...(sourceGlossary?{sourceGlossaryControls:sourceGlossary.controls,sourceGlossaryState:sourceGlossary.sourceState}:{}),
    ...(prepared.vocabularyJson?{vocabularyDecision:decisions!.vocabulary,vocabularySourceJson:prepared.vocabularyJson,vocabularyInputs:Object.freeze([source,binding,decisions!]) as readonly[HfrTextSourceCatalog,LessonTextBinding,HfrSourceTextDecisions],vocabularyInputsFingerprint:prepared.vocabularyInputsFingerprint,
      sourceGlossaryControls:Object.freeze(vocabulary?.controls??[]),vocabularyControls:Object.freeze(vocabulary?.nativeControls??[]),
      sourceGlossaryState:Object.freeze(guards.map(({object})=>Object.freeze({object,definition:object.def,scriptMoved:Boolean(object.scriptMoved),playing:object.playing})))}:{}),
    ...(prepared.joinedQuestionJson?{joinedQuestionDecision:decisions!.joinedQuestion,joinedQuestionSourceJson:prepared.joinedQuestionJson,joinedQuestionInputs:Object.freeze([source,binding,decisions!]) as readonly[HfrTextSourceCatalog,LessonTextBinding,HfrSourceTextDecisions],joinedQuestionInputsFingerprint:prepared.joinedQuestionInputsFingerprint,
      sourceGlossaryControls:Object.freeze(joined?.controls??[]),sourceGlossaryState:Object.freeze(guards.map(({object})=>Object.freeze({object,definition:object.def,scriptMoved:Boolean(object.scriptMoved),playing:object.playing}))),
      ...(joined&&snapshot.status==='ready'?{styledSentence:Object.freeze({title:decisions!.joinedQuestion!.title.text,blockId:`source-text-${decisions!.joinedQuestion!.bodies[0].characterId}`,tokens:Object.freeze(decisions!.joinedQuestion!.bodies.flatMap(body=>tokensByBlock[`source-text-${body.characterId}`]??[])),controls:Object.freeze(joined.controls),sourceState:Object.freeze(guards.map(({object})=>Object.freeze({object,definition:object.def,scriptMoved:Boolean(object.scriptMoved),playing:object.playing})))})}:{})}:{}),
    ...(styled.text&&styledBlock&&snapshot.status==='ready'?{styledSentence:Object.freeze({title:decisions!.styledSentence!.title.text,blockId:styledBlock.id,tokens:tokensByBlock[styledBlock.id],controls:Object.freeze(styled.controls),sourceState:Object.freeze(styled.sourceState)})}:{}),
    sourceRiskBlockers:prepared.sourceRiskBlockers,typographyTechnicalStatus:snapshot.status==='blocked'||prepared.sourceRiskBlockers.length?'blocked':'candidate',opacityByBlock:Object.freeze(opacityByBlock),tokensByBlock:Object.freeze(tokensByBlock),geometryByBlock:Object.freeze(geometryByBlock),transforms:Object.freeze(transforms),runtime,page,pageRoot:root,tick:runtime.tickCount,guards:Object.freeze(guards),sourceObjects:Object.freeze(snapshot.status==='ready'?sourceObjects:[])});
}

/** A stale tick, Replay root, value, transform, child replacement or language state
 * can never suppress current source drawing with yesterday's native words. */
export function isHfrNativeTextFrameCurrent(frame:HfrNativeTextFrame,runtime:HfrTextRuntime,identity:HfrTextIdentity):boolean {
  const s=frame.snapshot.identity;
  return (!frame.readableCompanionFingerprint||JSON.stringify(frame.readableCompanion)===frame.readableCompanionFingerprint)&&(!frame.readableCompanionSourceJson||JSON.stringify(runtime.page)===frame.readableCompanionSourceJson)&&
    (!frame.joinedQuestionSourceJson||JSON.stringify(runtime.page)===frame.joinedQuestionSourceJson)&&(!frame.joinedQuestionInputsFingerprint||JSON.stringify(frame.joinedQuestionInputs)===frame.joinedQuestionInputsFingerprint)&&
    (!frame.vocabularySourceJson||JSON.stringify(runtime.page)===frame.vocabularySourceJson)&&(!frame.vocabularyInputsFingerprint||JSON.stringify(frame.vocabularyInputs)===frame.vocabularyInputsFingerprint)&&
    (!frame.styledSentenceFingerprint||JSON.stringify(frame.styledSentenceDecision)===frame.styledSentenceFingerprint)&&(!frame.styledSentenceSourceJson||JSON.stringify(runtime.page)===frame.styledSentenceSourceJson)&&
    (!frame.styledSentenceInputsFingerprint||JSON.stringify(frame.styledSentenceInputs)===frame.styledSentenceInputsFingerprint)&&
    (!frame.styledSentence||frame.styledSentence.sourceState.every(s=>s.object.def===s.definition&&Boolean(s.object.scriptMoved)===s.scriptMoved&&s.object.playing===s.playing))&&
    (!frame.styledSentence||frame.styledSentence.controls.every(c=>sourceButtonEnabled(c.liveButton)))&&
    (!frame.sourceGlossaryState||frame.sourceGlossaryState.every(s=>s.object.def===s.definition&&Boolean(s.object.scriptMoved)===s.scriptMoved&&s.object.playing===s.playing))&&
    (!frame.sourceGlossaryControls||frame.sourceGlossaryControls.every(c=>sourceButtonEnabled(c.liveButton)))&&
    frame.runtime===runtime&&frame.page===runtime.page&&runtime.page.source.sha256===frame.snapshot.sourceSwfSha256&&runtime.page.placement.animationId===frame.snapshot.animationId&&frame.pageRoot===runtime.page_&&frame.tick===runtime.tickCount&&s.language===identity.lang&&s.scenario===identity.scenario&&s.seed===identity.seed&&s.replay===identity.replay&&frame.guards.every(g=>(g.outlineGeometry===undefined||outlineGeometry(g.object.def)===g.outlineGeometry)&&state(g.object)===g.state&&sameChildren(g.children,children(g.object)));
}
/** The native layer requests one source action; renderer/session ownership,
 * source release, host permission, audio and modal focus remain outside it. */
export function requestHfrNativeGlossary(frame:HfrNativeTextFrame,runtime:HfrTextRuntime,identity:HfrTextIdentity,control:HfrNativeGlossaryControl,trigger:HTMLElement,activate?:(intent:HfrNativeGlossaryIntent)=>void):boolean {
  if(!activate||frame.snapshot.status!=='ready'||!(frame.styledSentence?.controls.includes(control)||frame.vocabularyControls?.includes(control))||!isHfrNativeTextFrameCurrent(frame,runtime,identity))return false;
  activate({frame,identity,control,trigger});return true;
}

export interface HfrAnchoredGlossaryLabel {
  readonly control:HfrNativeGlossaryControl;
  readonly text:string;
  readonly colorRgba:readonly number[];
  readonly bounds:Bounds;
  readonly anchor:{readonly x:number;readonly y:number;readonly stageWidth:number;readonly stageHeight:number};
  readonly linear:Matrix;
  readonly fontSizeRem:number;
  readonly sourceGlyphOffsetsTwips?:readonly number[];
}

/** A visible HTML button owns its native SVG word. Both its source hit rectangle
 * and its glyph baseline come from the verified current source frame. No
 * invisible overlay, measured/guessed offset, or substitute source action. */
export function buildHfrAnchoredGlossaryLabels(frame:HfrNativeTextFrame,runtime:HfrTextRuntime,identity:HfrTextIdentity):Readonly<Record<string,readonly HfrAnchoredGlossaryLabel[]>>|null {
  const profile=frame.vocabularyDecision;
  const blocks=frame.snapshot.blocks.filter(block=>block.visible&&block.anchor&&profile?.controls.some(control=>
    frame.binding.blocks.find(binding=>binding.id===block.id)?.sourceTextIds.includes(control.sourceTextId)));
  if(!blocks.length)return Object.freeze({});
  const source=frame.vocabularyInputs?.[0];
  if(!profile||!source||frame.snapshot.status!=='ready'||!isHfrNativeTextFrameCurrent(frame,runtime,identity))return null;
  const labels:Record<string,readonly HfrAnchoredGlossaryLabel[]>={};
  for(const block of blocks){
    const binding=frame.binding.blocks.find(item=>item.id===block.id),geometry=frame.geometryByBlock[block.id],anchor=block.anchor!;
    if(!binding||binding.sourceTextIds.length!==1||!geometry||geometry.fontSizeRem<=0||
      !Number.isFinite(geometry.fontSizeRem)||!geometry.linear.every(Number.isFinite)||
      anchor.stageWidth!==runtime.page.stage.width||anchor.stageHeight!==runtime.page.stage.height||
      ![anchor.x,anchor.y,anchor.stageWidth,anchor.stageHeight].every(Number.isFinite))return null;
    const text=source.textDefinitions.find(item=>item.sourceTextId===binding.sourceTextIds[0]);
    if(text?.kind!=='static-text'||text.runs?.length!==1)return null;
    const run=text.runs[0],glyphs=run.glyphs;
    if(glyphs.some(glyph=>glyph.unicode===null||!Number.isFinite(glyph.advanceTwips)))return null;
    const tokens=frame.tokensByBlock[block.id],specs=profile.controls.filter(control=>control.sourceTextId===text.sourceTextId);
    if(!tokens||!specs.length||tokens.map(token=>token.text).join('')!==glyphs.map(glyph=>glyph.unicode).join('')||
      tokens.some(token=>token.glossaryButtonCharacterId===undefined&&token.text.trim()))return null;
    const tokenIds=[...new Set(tokens.flatMap(token=>token.glossaryButtonCharacterId===undefined?[]:[token.glossaryButtonCharacterId]))].sort((a,b)=>a-b);
    if(!same(tokenIds,specs.map(spec=>spec.sourceButtonCharacterId).sort((a,b)=>a-b)))return null;
    const result:HfrAnchoredGlossaryLabel[]=[];
    for(const spec of specs){
      const spans=spec.glyphSpans??[{runIndex:spec.runIndex,glyphStart:spec.glyphStart??0,glyphEndExclusive:spec.glyphEndExclusive??glyphs.length}];
      if(spans.length!==1||spans[0].runIndex!==0)return null;
      const {glyphStart:from,glyphEndExclusive:to}=spans[0];
      if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<=from||to>glyphs.length)return null;
      const label=glyphs.slice(from,to).map(glyph=>glyph.unicode).join('');
      if(!label.trim()||tokens.filter(token=>token.glossaryButtonCharacterId===spec.sourceButtonCharacterId).map(token=>token.text).join('')!==label)return null;
      const control=frame.vocabularyControls?.find(control=>control.sourceButtonCharacterId===spec.sourceButtonCharacterId&&control.instanceId===spec.instanceId);
      const hits=control?.liveButton.def.records?.filter((record:any)=>(record.states&8)!==0),hit=hits?.[0],definition=runtime.page.dictionary[spec.hitCharacterId];
      if(!control||hits?.length!==1||hit.charId!==spec.hitCharacterId||definition?.kind!=='shape')return null;
      const world=multiplyHfrTextMatrix(sourceWorldMatrix(control.liveButton),hit.m);
      const bounds=rectangleInParent({left:definition.bounds.xmin,right:definition.bounds.xmax,top:definition.bounds.ymin,bottom:definition.bounds.ymax},world);
      if(!bounds||bounds.right<=bounds.left||bounds.bottom<=bounds.top||bounds.left<0||bounds.top<0||
        bounds.right>runtime.page.stage.width*20||bounds.bottom>runtime.page.stage.height*20)return null;
      const advance=glyphs.slice(0,from).reduce((sum,glyph)=>sum+glyph.advanceTwips,0);
      const sourceGlyphOffsets=geometry.sourceGlyphOffsetsTwips;
      if(profile.animationId==='shared-nms002-l11-p012'&&(!sourceGlyphOffsets||sourceGlyphOffsets.length!==glyphs.length))return null;
      result.push(Object.freeze({control,text:label,colorRgba:Object.freeze([...run.colorRgba]),
        bounds:Object.freeze({left:bounds.left/20,right:bounds.right/20,top:bounds.top/20,bottom:bounds.bottom/20}),
        anchor:Object.freeze({x:anchor.x+geometry.linear[0]*advance/20,y:anchor.y+geometry.linear[1]*advance/20,stageWidth:anchor.stageWidth,stageHeight:anchor.stageHeight}),
        linear:geometry.linear,fontSizeRem:geometry.fontSizeRem,...(sourceGlyphOffsets?{sourceGlyphOffsetsTwips:Object.freeze(sourceGlyphOffsets.slice(from,to).map(offset=>offset-sourceGlyphOffsets[from]))}:{})}));
    }
    labels[block.id]=Object.freeze(result);
  }
  return Object.freeze(labels);
}
function sourceWorldMatrix(object:HfrTextDisplayObject):Matrix {
  const chain:HfrTextDisplayObject[]=[];for(let o:HfrTextDisplayObject|null|undefined=object;o;o=o.parentClip)chain.unshift(o);
  return chain.reduce<Matrix>((m,o)=>multiplyHfrTextMatrix(m,matrix(o)),ID);
}
function sourcePointInside(point:readonly[number,number],world:Matrix,bounds:any):boolean {
  const [a,b,c,d,tx,ty]=world,det=a*d-b*c;if(!world.every(Number.isFinite)||det===0||!bounds)return false;
  const x=point[0]*20-tx,y=point[1]*20-ty,localX=(d*x-c*y)/det,localY=(-b*x+a*y)/det;
  return localX>=bounds.xmin&&localX<=bounds.xmax&&localY>=bounds.ymin&&localY<=bounds.ymax;
}
/** null is a native full-sentence action; a point is a source-canvas release in
 * logical stage pixels. Only the exact visible hit/mask intersection qualifies. */
export function resolveHfrSourceGlossaryControl(frame:HfrNativeTextFrame,runtime:HfrTextRuntime,identity:HfrTextIdentity,liveButton:HfrTextDisplayObject,point:readonly[number,number]|null):HfrNativeGlossaryControl|null {
  if(!isHfrNativeTextFrameCurrent(frame,runtime,identity))return null;
  if(point===null)return frame.snapshot.status==='ready'?(frame.styledSentence?.controls??frame.vocabularyControls)?.find(c=>c.liveButton===liveButton)??null:null;
  if(point.length!==2||!point.every(Number.isFinite)||point[0]<0||point[1]<0||point[0]>runtime.page.stage.width||point[1]>runtime.page.stage.height)return null;
  const control=frame.sourceGlossaryControls?.find(c=>c.liveButton===liveButton),q=frame.styledSentenceDecision;
  if(control&&frame.joinedQuestionDecision){
    const spec=frame.joinedQuestionDecision.controls.find(c=>c.sourceButtonCharacterId===control.sourceButtonCharacterId),hit=liveButton.def.records?.filter((record:any)=>(record.states&8)!==0);
    if(!spec||sourceMasksAt(liveButton).some(mask=>!sourcePointInside(point,sourceWorldMatrix(mask),joinedQuestionMaskBounds(frame.joinedQuestionDecision!,mask)))||hit?.length!==1||hit[0].charId!==spec.hitCharacterId||!sourcePointInside(point,multiplyHfrTextMatrix(sourceWorldMatrix(liveButton),hit[0].m),runtime.page.dictionary[spec.hitCharacterId]?.bounds))return null;
    return control;
  }
  if(control&&frame.vocabularyDecision){
    const spec=frame.vocabularyDecision.controls.find(c=>c.sourceButtonCharacterId===control.sourceButtonCharacterId);
    const masks=sourceMasksAt(liveButton),hit=liveButton.def.records?.filter((record:any)=>(record.states&8)!==0);
    if(!spec||masks.some(mask=>!sourcePointInside(point,sourceWorldMatrix(mask),joinedQuestionMaskBounds(frame.vocabularyDecision!,mask)))||
      hit?.length!==1||hit[0].charId!==spec.hitCharacterId||!sourcePointInside(point,multiplyHfrTextMatrix(sourceWorldMatrix(liveButton),hit[0].m),runtime.page.dictionary[spec.hitCharacterId]?.bounds))return null;
    return control;
  }
  if(!control||!q)return null;
  const masks=sourceMasksAt(liveButton);
  if(masks.length!==(q.sourceInteraction?.maskCount??1)||masks.some(mask=>!sourcePointInside(point,sourceWorldMatrix(mask),sourceMaskBounds(q,mask))))return null;
  const hit=liveButton.def.records?.filter((record:any)=>(record.states&8)!==0);
  const hitId=q.sourceInteraction?.hitCharacterId??37;
  if(hit?.length!==1||hit[0].charId!==hitId||!sourcePointInside(point,multiplyHfrTextMatrix(sourceWorldMatrix(liveButton),hit[0].m),runtime.page.dictionary[hitId]?.bounds))return null;
  return control;
}
function sameChildren(a:readonly HfrTextDisplayObject[],b:readonly HfrTextDisplayObject[]){return a.length===b.length&&a.every((o,i)=>o===b[i]);}
export function shouldSuppressHfrOriginalText(frame:HfrNativeTextFrame,runtime:HfrTextRuntime,object:HfrTextDisplayObject,identity:HfrTextIdentity):boolean {
  // Most source shapes are unrelated to text. Reject them before walking guards.
  return !frame.readableCompanion&&!frame.styledSentenceDecision&&!frame.joinedQuestionDecision&&frame.snapshot.status==='ready'&&frame.sourceObjects.includes(object)&&isHfrNativeTextFrameCurrent(frame,runtime,identity);
}
