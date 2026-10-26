// HFR runtime · host bridge. Translates the HELP Math 1.0 course-shell calls a
// page makes into the modern lesson host's typed requests. Nothing here sends
// data anywhere: legacy endpoints become blocked `legacy` requests, and any
// call the bridge does not know stays inside the page (fail closed).
import type {Runtime, MovieClip} from "./display";
import {GEO_L03_P007_LOOP_SENTENCE} from "./geo-l03-p007-loop-source-binding";
import {NMS_L06_P005_JOINED_QUESTION} from "./nms-l06-p005-joined-source-binding";
import {HFR_VOCABULARY_SOURCE_BINDINGS} from './vocabulary-source-bindings';
import {NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS} from './nms-l07-canvas-glossary-source-binding';
import {DAT_L03_CANVAS_GLOSSARY_SOURCE_BINDINGS} from './dat-l03-canvas-glossary-source-binding';
import type { LessonHostRequest } from "../lesson-host-contract";
import type { HfrPageMeta, HostCall, HfrSourceGlossaryTerm } from "./types";

export type HfrBridgeAction =
  | Readonly<{ kind: "request"; request: LessonHostRequest; activity?: boolean }>
  /** The page explicitly activated Next; ordinary feedback is not completion. */
  | Readonly<{ kind: "activity" }>
  /** `doCloseApp`: the final quiz finished; the host shows its lesson-complete notice. */
  | Readonly<{ kind: "lesson-finished" }>
  | Readonly<{ kind: "none" }>;

const NONE: HfrBridgeAction = Object.freeze({ kind: "none" });

const SHELL_PREFIX = "shell.";
const NAV_PREFIX = "shell.nav.";

function navigate(target: string | null | undefined): HfrBridgeAction {
  return target
    ? { kind: "request", request: { type: "navigate", targetAnimationId: target } }
    : NONE;
}

function legacy(operation: "getURL" | "loadVariables" | "report" | "download" | "xml-send", target?: unknown): HfrBridgeAction {
  return {
    kind: "request",
    request: typeof target === "string" && target
      ? { type: "legacy", operation, target: target.slice(0, 256) }
      : { type: "legacy", operation },
  };
}

/** Resolve a `doNeedMoreHelp("L7GS03", …)` target to an active page of this lesson. */
export function resolvePageJump(meta: HfrPageMeta, file: unknown): string | null {
  if (typeof file !== "string") return null;
  const stem = file.replace(/\.swf$/iu, "").split(/[\\/]/u).pop()?.toUpperCase() ?? "";
  return Object.hasOwn(meta.lessonPagesByFile, stem) ? meta.lessonPagesByFile[stem]! : null;
}

/** One synchronous native activation owns one source release. It is never a
 * general KeyAttribute lookup: every field comes from the current page's proof. */
export interface HfrGlossaryRelease {
  readonly pageKey: string;
  readonly sourceSha256: string;
  readonly term: HfrSourceGlossaryTerm;
  readonly tick: number;
  sourceKeyAttribute: unknown;
  consumed: boolean;
}
export function createHfrGlossaryRelease(meta: HfrPageMeta, control: HfrSourceGlossaryTerm, tick: number): HfrGlossaryRelease | null {
  const binding = meta.sourceGlossary;
  if (!binding || binding.pageKey !== meta.key || binding.sourceSha256 !== meta.sourceSha256 ||
      !Number.isSafeInteger(tick) || tick < 0) return null;
  const terms = binding.terms.filter(term => term.sourceButtonCharacterId === control.sourceButtonCharacterId);
  if (terms.length !== 1) return null;
  const term = terms[0];
  if (!Number.isSafeInteger(term.sourceButtonCharacterId) || term.sourceButtonCharacterId < 1 ||
      !/^[a-f0-9]{64}$/u.test(term.sourceButtonTagSha256) || !/^[a-f0-9]{64}$/u.test(term.sourceActionSha256) ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u.test(term.dictionaryEntryId) || !term.sourceKeyAttribute ||
      term.sourceButtonTagSha256 !== control.sourceButtonTagSha256 || term.sourceActionSha256 !== control.sourceActionSha256 ||
      term.sourceKeyAttribute !== control.sourceKeyAttribute || term.dictionaryEntryId !== control.dictionaryEntryId) return null;
  return {pageKey: meta.key, sourceSha256: meta.sourceSha256, term, tick, sourceKeyAttribute: undefined, consumed: false};
}

export function bridgeHostCall(meta: HfrPageMeta, call: HostCall, release?: HfrGlossaryRelease | null): HfrBridgeAction {
  if (call.kind === "shell.DoHyperLinks") {
    if (!release || release.consumed || release.pageKey !== meta.key || release.sourceSha256 !== meta.sourceSha256 ||
        release.tick !== call.tick || call.args.length !== 0 || release.sourceKeyAttribute !== release.term.sourceKeyAttribute ||
        !meta.sourceGlossary?.terms.includes(release.term)) return NONE;
    release.consumed = true;
    return {kind: "request", request: {type: "open-glossary", entryId: release.term.dictionaryEntryId,
      sourceAnimationId: meta.key, playbackDisposition: "source-stop-timeline-and-audio-until-explicit-resume"}};
  }

  const kind = call.kind;
  if (kind.startsWith(NAV_PREFIX)) {
    // `_root.next_mc.gotoAndStop("active")`: the page has finished its activity.
    const clip = kind.slice(NAV_PREFIX.length).toLowerCase();
    const label = String(call.args[0] ?? "").toLowerCase();
    return clip === "next_mc" && label === "active" ? { kind: "activity" } : NONE;
  }
  if (kind.startsWith(SHELL_PREFIX)) {
    switch (kind.slice(SHELL_PREFIX.length).toLowerCase()) {
      case "doneedmorehelp": return navigate(resolvePageJump(meta, call.args[0]));
      case "doplaynextmovie": return navigate(meta.nextKey);
      case "doplaypreviousmovie": return navigate(meta.previousKey);
      case "docloseapp": return { kind: "lesson-finished" };
      // Source pages also re-enable answer buttons after feedback for a retry.
      // This call does not establish that the whole page has finished.
      case "enablequizbutton": return NONE;
      case "showrightfeed":
      case "showwrongfeed":
        return {
          kind: "request",
          request: {
            type: "record-practice-feedback",
            interactionId: meta.key,
            outcome: kind.toLowerCase().endsWith("showrightfeed") ? "correct" : "incorrect",
            branchIndex: 1,
            branchCount: 1,
          },
        };
      default:
        // setBookMark/getBookMark, preloader and
        // the rest stay inside the page.
        return NONE;
    }
  }
  if (kind === "getURL") return legacy("getURL", call.args[0]);
  if (kind === "loadVariables") return legacy("loadVariables", call.args[0]);
  if (kind.startsWith("sandboxed.")) return legacy(kind.includes("XML") ? "xml-send" : "loadVariables");
  return NONE;
}

/** The reviewed primary loop of one exact source page, read from that page's
 * own binding: a calibrated native presentation or retained Canvas glossary. */
interface HfrReviewedLoop {
  readonly animationId: string; readonly sourceSwfSha256: string; readonly rootFrame: number;
  readonly characterId: number; readonly depth: number; readonly frames: number; readonly primaryMatrix: readonly number[];
  readonly hasEarlierSourceActions?: true;
}
const spriteId = (domain: string): number => Number(/^sprite-(\d+)$/u.exec(domain)?.[1] ?? NaN);
/** Registered before the shared rule while holding their loop end; they keep
 * that verified behavior until they are re-qualified under it. */
const HFR_LOOP_END_HELD_REGISTERED: ReadonlySet<string> = new Set([
  'shared-nms002-l03-p005', 'shared-nms002-l03-p006', 'shared-nms002-l03-p008', 'shared-nms002-l11-p008',
]);
function hfrReviewedLoop(animationId: string): HfrReviewedLoop | null {
  if (HFR_LOOP_END_HELD_REGISTERED.has(animationId)) return null;
  const canvas = NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS[animationId];
  if (canvas?.animationId === animationId) return canvas;
  const dat = DAT_L03_CANVAS_GLOSSARY_SOURCE_BINDINGS[animationId];
  // These exact DAT sources hold at the question, then naturally loop after
  // their action-free final frame. The captured pre-release playing flag is
  // still required; an authored question hold never gains permission to play.
  if (dat?.animationId === animationId) return {...dat, hasEarlierSourceActions: true};
  const geo = GEO_L03_P007_LOOP_SENTENCE, l6 = NMS_L06_P005_JOINED_QUESTION;
  if (animationId === geo.animationId) return {animationId, sourceSwfSha256: geo.sourceSwfSha256, rootFrame: geo.rootFrame,
    characterId: spriteId(geo.sourceFrameDomain), depth: Number(/^root:(\d+):/u.exec(geo.sourceTextInstanceId)?.[1] ?? NaN),
    frames: geo.lastCompleteFrame, primaryMatrix: geo.primaryMatrix};
  const q = animationId === l6.animationId ? l6 : HFR_VOCABULARY_SOURCE_BINDINGS[animationId];
  return q && q.animationId === animationId ? {animationId, sourceSwfSha256: q.sourceSwfSha256, rootFrame: q.rootFrame,
    characterId: spriteId(q.frameDomain), depth: q.primaryDepth, frames: q.mainFrames, primaryMatrix: q.primaryMatrix} : null;
}

/** Chosen modern Play behavior; this is not a recovered legacy-shell policy.
 * Resume only the exact source clip stopped by this page's glossary release.
 * Authored terminal stops remain held. A reviewed primary loop may resume from
 * its final frame only when it is still exactly the clip its binding names, on
 * the stopped begin frame. Reviewed DAT sources have earlier question actions;
 * their final frame must remain action-free. Other reviewed loops retain the
 * stricter no-action-anywhere rule.
 * A seek, replacement or successor stays held. */
export function resumeHfrGlossarySource(runtime: Runtime, held: Readonly<{runtime: Runtime; clip: MovieClip; frame: number; resumeSource: boolean}>): boolean {
  if (runtime !== held.runtime || held.clip.rt !== runtime || held.clip.removed ||
      !runtime.allObjects().includes(held.clip) || held.clip.frame !== held.frame || held.clip.playing) return false;
  const clip = held.clip, loop = hfrReviewedLoop(runtime.page.placement.animationId);
  const reviewedLoopEnd = loop !== null && Number.isSafeInteger(loop.characterId) && Number.isSafeInteger(loop.depth) &&
    runtime.page.source.sha256 === loop.sourceSwfSha256 && runtime.page.stage.fps === 12 &&
    runtime.page.root.frameCount === 10 && runtime.page.root.labels.begin === loop.rootFrame &&
    runtime.page_.def === runtime.page.root && runtime.page_.frame === loop.rootFrame && !runtime.page_.playing &&
    clip.charId === loop.characterId && clip.def === runtime.page.dictionary[loop.characterId] && clip.parentClip === runtime.page_ && clip.depth === loop.depth &&
    clip.visible && !clip.scriptMoved && (clip.ratio ?? 0) === 5 && held.frame === loop.frames && clip.totalFrames === loop.frames &&
    [clip.m.a, clip.m.b, clip.m.c, clip.m.d, clip.m.tx, clip.m.ty].every((value, i) => value === loop.primaryMatrix[i]) &&
    Array.isArray(clip.def.frames) && clip.def.frames.length === loop.frames &&
    (loop.hasEarlierSourceActions ? clip.def.frames.slice(-1) : clip.def.frames)
      .every((frame: readonly {op: string}[]) => frame.every(tag => tag.op !== "action" && tag.op !== "init"));
  if (held.resumeSource && (held.frame < clip.totalFrames || reviewedLoopEnd)) clip.playing = true;
  return true;
}
