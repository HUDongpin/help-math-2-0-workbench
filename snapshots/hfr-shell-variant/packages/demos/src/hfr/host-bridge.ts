// HFR runtime · host bridge. Translates the HELP Math 1.0 course-shell calls a
// page makes into the modern lesson host's typed requests. Nothing here sends
// data anywhere: legacy endpoints become blocked `legacy` requests, and any
// call the bridge does not know stays inside the page (fail closed).
import type { LessonHostRequest } from "../lesson-host-contract";
import type { HfrPageMeta, HostCall } from "./types";

export type HfrBridgeAction =
  | Readonly<{ kind: "request"; request: LessonHostRequest; activity?: boolean }>
  /** The page signalled that its activity is done (quiz unlocked, Next activated). */
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

export function bridgeHostCall(meta: HfrPageMeta, call: HostCall): HfrBridgeAction {
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
      case "enablequizbutton": return { kind: "activity" };
      case "showrightfeed":
      case "showwrongfeed":
        return {
          kind: "request",
          activity: true,
          request: {
            type: "record-practice-feedback",
            interactionId: meta.key,
            outcome: kind.toLowerCase().endsWith("showrightfeed") ? "correct" : "incorrect",
            branchIndex: 1,
            branchCount: 1,
          },
        };
      default:
        // setBookMark/getBookMark, preloader, DoHyperLinks (glossary: M2) and
        // the rest stay inside the page.
        return NONE;
    }
  }
  if (kind === "getURL") return legacy("getURL", call.args[0]);
  if (kind === "loadVariables") return legacy("loadVariables", call.args[0]);
  if (kind.startsWith("sandboxed.")) return legacy(kind.includes("XML") ? "xml-send" : "loadVariables");
  return NONE;
}
