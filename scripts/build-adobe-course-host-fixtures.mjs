#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream, statSync} from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createServer} from "node:net";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const defaultOutputRoot = path.join(projectRoot, "work", "adobe-course-host-fixtures");
const flashPlayerPath = "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";

export const COURSE_CHILD_PILOT_IDS = Object.freeze([
  "course-g03-l01-ts-008",
  "course-g03-l01-vb-004",
  "course-g03-l06-fq-002-review",
  "course-g03-l06-ti-001",
  "course-g03-l08-re-001",
  "course-g04-l01-ir-001",
  "course-g04-l03-in-009",
  "course-g04-l09-gs-002",
  "course-g05-l13-rw-002",
]);

export const COURSE_SHELL_PILOT_ID = "shell-course-g04-l01-index-local";

const BLOCKED_CHILD_APIS = new Set([
  "ExternalInterface",
  "LocalConnection",
  "SharedObject",
  "SharedObject.flush-candidate",
  "XML",
  "fscommand",
  "getURL",
  "javascript-url",
  "loadVariables",
  "object.load-candidate",
  "sendAndLoad",
  "socket-or-net-connection",
]);

const SAFE_LOCAL_CHILD_APIS = new Set([
  "loadMovie",
  "loadSound",
  "unloadMovie",
]);

const SYNTHETIC_LITERAL_BINDINGS = Object.freeze({
  "_global.KeyAttribute": "",
  "_global.LngFlag": "English",
  "_global.Mute": false,
  "_global.Pause": false,
  "_global.Play": true,
  "_global.VolLevel": 100,
  "_global.WrongFeed": false,
  "_global.quizSection": false,
  "_global.quizTryCount": 0,
  "_global.sectionNumber": 0,
  "_global.slideNumber": 0,
  "_global.spanSound": false,
  "_global.volLevel": 100,
  "_root.Class_ID": "",
  "_root.Lesson_ID": "",
  "_root.Report_URL": "",
  "_root.Student_ID": "",
});

const HOST_FUNCTION_BINDINGS = new Set([
  "_parent.disableQuizButton",
  "_parent.enableButton",
  "_parent.enableMC",
  "_parent.enableQuizButton",
  "_parent.enablebutton",
  "_parent.play",
  "_root.DoHyperLinks",
  "_root.Send_Click_Report_Mc",
  "_root.animation_mc",
  "_root.animation_mc_preload",
  "_root.disableQuizButton",
  "_root.doCloseApp",
  "_root.doPlayFQAnswerAudio",
  "_root.doPlayFQQuestionAudio",
  "_root.enableQuizButton",
  "_root.setBookMark",
  "_root.showRightFeed",
  "_root.showWrongFeed",
]);

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function run(command, argumentsList, {cwd = projectRoot, timeoutMs = 120_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd,
      env: {...process.env, LC_ALL: "C"},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({stdout, stderr});
      else reject(new Error(`${command} exited ${code ?? signal}: ${(stderr || stdout).trim()}`));
    });
  });
}

function findOnPath(name, pathValue = process.env.PATH || "") {
  for (const directory of pathValue.split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, name);
    try {
      const result = statSync(candidate);
      if (result.isFile()) return candidate;
    } catch {
      // Continue probing the PATH without treating an absent optional tool as an error.
    }
  }
  return null;
}

export function parseArguments(argumentsList) {
  const options = {
    migrationsRoot: defaultMigrationsRoot,
    outputRoot: defaultOutputRoot,
    ids: [],
    compile: true,
    check: false,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--no-compile") options.compile = false;
    else if (value === "--check") options.check = true;
    else if (value === "--verify-fixture") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error("--verify-fixture requires a manifest path");
      options.verifyFixture = path.resolve(next);
      index += 1;
    } else if (value === "--verify-launch") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error("--verify-launch requires a manifest path");
      options.verifyLaunch = path.resolve(next);
      index += 1;
    } else if (["--migrations", "--output", "--id"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--output") options.outputRoot = path.resolve(next);
      else options.ids.push(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function firstLine(command, argumentsList) {
  try {
    const {stdout, stderr} = await run(command, argumentsList, {timeoutMs: 30_000});
    return (stdout || stderr).split(/\r?\n/).find(Boolean) || null;
  } catch (error) {
    return {error: error.message};
  }
}

export async function probeFixtureToolchain() {
  const swfmill = findOnPath("swfmill");
  const ffdec = findOnPath("ffdec");
  const sandboxExec = findOnPath("sandbox-exec") || "/usr/bin/sandbox-exec";
  const optionalAs2Compilers = ["mtasc", "haxe", "mxmlc"].map((name) => ({name, path: findOnPath(name)}));
  const report = {
    swfmill: {
      path: swfmill,
      version: swfmill ? await firstLine(swfmill, ["--version"]) : null,
      role: "creates a minimal AVM1 SWF container from deterministic XML; does not compile ActionScript source",
    },
    ffdec: {
      path: ffdec,
      version: ffdec ? await firstLine(ffdec, ["-help"]) : null,
      importScriptAvailable: ffdec ? !((await firstLine(ffdec, ["-help", "importScript"]))?.error) : false,
      role: "compiles/imports the fixture frame-1 AS1/2 source into the minimal SWF container",
    },
    adobeAnimate: {
      applicationPath: "/Applications/Adobe Animate 2021/Adobe Animate 2021.app",
      installed: await exists("/Applications/Adobe Animate 2021/Adobe Animate 2021.app"),
      supportedHeadlessCompiler: false,
      role: "authoring audit only; this installation exposes JSFL through the GUI, not a supported deterministic headless CLI",
    },
    flashPlayer: {
      path: flashPlayerPath,
      installed: await exists(flashPlayerPath),
      role: "authorized original-runtime capture; never invoked by this factory",
    },
    sandboxExec: {
      path: await exists(sandboxExec) ? sandboxExec : null,
      role: "launch boundary that permits only the LaunchServices bootstrap needed to create an Adobe Player window while denying network, LaunchServices open/database operations, Apple Events, and writes outside the fixture/capture/temp roots",
      adobeGuiSmokeTest: "pending; the non-GUI factory does not launch Flash Player",
    },
    optionalAs2Compilers,
  };
  report.canCompileFixture = Boolean(swfmill && ffdec);
  report.canLaunchSandboxedAfterGuiSmokeTest = Boolean(report.flashPlayer.installed && report.sandboxExec.path);
  return report;
}

function assertRelativeLocal(candidate, label) {
  if (!candidate || path.isAbsolute(candidate) || candidate.includes("..") || /^[a-z]+:/i.test(candidate)) {
    throw new Error(`${label} must be a local relative path: ${candidate}`);
  }
  return portable(candidate);
}

function lessonRootForSource(sourcePath) {
  const parts = portable(sourcePath).split("/");
  const marker = parts.findIndex((part) => /^L\d+$/.test(part));
  if (marker < 0) throw new Error(`could not find lesson root in ${sourcePath}`);
  return {
    lessonRoot: parts.slice(0, marker + 1).join("/"),
    relative: parts.slice(marker + 1).join("/"),
  };
}

function summarizeBinding(binding) {
  const candidates = (binding.sourceInitializationCandidates || []).map((candidate) => ({
    expression: candidate.expression,
    parsedLiteral: candidate.parsedLiteral,
    evidence: candidate.evidence,
  }));
  let fixtureDisposition = "unresolved-explicit-scenario-value-required";
  let syntheticValue;
  if (binding.staticResolution?.status === "resolved-by-hash-verified-static-source-evidence") {
    fixtureDisposition = "do-not-inject-intrinsic-or-child-self-initialized";
  } else if (Object.hasOwn(SYNTHETIC_LITERAL_BINDINGS, binding.binding)) {
    fixtureDisposition = "synthetic-probe-literal-not-original-default";
    syntheticValue = SYNTHETIC_LITERAL_BINDINGS[binding.binding];
  } else if (HOST_FUNCTION_BINDINGS.has(binding.binding)) {
    fixtureDisposition = "safe-local-host-adapter-or-recording-stub";
  } else if (binding.binding === "_level0.InternalPreloader") {
    fixtureDisposition = "one-frame-inert-local-movieclip";
  }
  return {
    binding: binding.binding,
    scope: binding.scope,
    fixtureRequirement: binding.fixtureRequirement,
    originalDefaultStatus: binding.originalDefaultStatus,
    sourceInitializationCandidates: candidates,
    fixtureDisposition,
    ...(syntheticValue === undefined ? {} : {syntheticValue}),
    ...(binding.staticResolution ? {staticResolution: binding.staticResolution} : {}),
    originalBehaviorClaimed: false,
    evidence: binding.evidence,
  };
}

function deriveChildEntryHandoff(inventory) {
  const rootTimeline = (inventory.timelineInventory || []).find((item) => item.timelineId === "root");
  const candidates = (rootTimeline?.frameLabels || []).filter((item) => String(item.label).toLowerCase() === "begin");
  if (candidates.length !== 1) {
    throw new Error(`${inventory.animationId}: expected exactly one root begin/Begin label, observed ${candidates.length}`);
  }
  const entry = candidates[0];
  const exactSameLessonEvidence = inventory.dependencies?.hostBindingResolution?.entryHandoff || null;
  if (exactSameLessonEvidence && (exactSameLessonEvidence.label !== entry.label || exactSameLessonEvidence.childRootFrame !== entry.frame)) {
    throw new Error(`${inventory.animationId}: host-binding entry-handoff evidence conflicts with the child root label`);
  }
  return {
    label: entry.label,
    oneIndexedRootFrame: entry.frame,
    trigger: "MovieClipLoader.onLoadInit(target)",
    adapter: "target.gotoAndPlay(entryLabel)",
    authority: exactSameLessonEvidence
      ? "exact-same-lesson-shell-static-code-plus-untouched-child-root-label"
      : "reviewed-common-help-shell-handoff-pattern-plus-untouched-child-root-label",
    exactSameLessonEvidence,
    originalWholeHostBehaviorClaimed: false,
    strictAcceptanceEffect: "enables the untouched child to leave its frame-1 preloader stop; does not establish original-host defaults or satisfy any acceptance gate",
    evidence: [
      {artifactId: "swfmill-xml", timelineId: "root", frame: entry.frame, label: entry.label},
      ...(exactSameLessonEvidence ? [{artifactId: "host-binding-resolution"}] : []),
    ],
  };
}

function sourceToFixtureDependency(sourceFile, expectedSha256, lessonRoot) {
  const sourcePortable = portable(sourceFile);
  if (!sourcePortable.startsWith(`${lessonRoot}/`)) {
    throw new Error(`dependency is outside the pilot lesson: ${sourceFile}`);
  }
  const relative = sourcePortable.slice(lessonRoot.length + 1);
  return {
    sourceFile: sourcePortable,
    expectedSha256,
    fixturePath: assertRelativeLocal(`lesson/${relative}`, "fixture dependency"),
  };
}

export function buildFixtureSpecification({inventory, audioAudit}) {
  if (!COURSE_CHILD_PILOT_IDS.includes(inventory.animationId)) throw new Error(`not a course child pilot: ${inventory.animationId}`);
  if (audioAudit.animationId !== inventory.animationId) throw new Error(`${inventory.animationId}: audio audit identity mismatch`);
  if (inventory.source.swfSha256 !== audioAudit.source.expectedSha256 || !audioAudit.source.hashMatches) {
    throw new Error(`${inventory.animationId}: source/audio evidence hash mismatch`);
  }
  const {lessonRoot, relative} = lessonRootForSource(inventory.source.swf);
  const child = sourceToFixtureDependency(inventory.source.swf, inventory.source.swfSha256, lessonRoot);
  const exactAudio = (audioAudit.externalAudio?.exactAssociations || []).map((item) => ({
    ...sourceToFixtureDependency(item.sourceFile, item.observedSha256, lessonRoot),
    language: item.languageAssessment?.language || "und",
    associationStatus: item.associationStatus,
    durationMs: item.probe?.durationMs ?? null,
    startFrame: item.startFrame,
    startFrameAuthority: item.startFrameAuthority,
  }));
  const candidateAudio = (audioAudit.externalAudio?.lessonGroupCandidates || []).map((item) => ({
    sourceFile: portable(item.sourceFile),
    expectedSha256: item.observedSha256 || item.catalogSha256 || null,
    language: item.languageAssessment?.language || "und",
    status: "not-staged-until-a-scenario-selects-and-justifies-this-candidate",
  }));
  const sideEffects = (inventory.dependencies.safeSideEffectPolicy || []).map((item) => {
    const blocked = BLOCKED_CHILD_APIS.has(item.api);
    const localOnly = SAFE_LOCAL_CHILD_APIS.has(item.api);
    return {
      api: item.api,
      kind: item.kind,
      sourceLine: item.sourceLine,
      fixturePolicy: blocked ? "blocked-by-runtime-sandbox-and-not-authorized-as-a-capture-step" : localOnly ? "local-content-addressed-allowlist-only" : "blocked-until-reviewed",
      executableByHostFixture: false,
      evidence: item.evidence,
    };
  });
  const blockedCalls = sideEffects.filter((item) => item.fixturePolicy.startsWith("blocked"));
  const randomObligations = inventory.coverage.randomObligations || [];
  const exactSpanish = exactAudio.filter((item) => item.language === "es");
  const bindings = (inventory.dependencies.bindings || []).map(summarizeBinding);
  const unresolvedBindings = bindings.filter((item) => item.fixtureDisposition.startsWith("unresolved"));
  const entryHandoff = deriveChildEntryHandoff(inventory);
  const specification = {
    schemaVersion: 1,
    animationId: inventory.animationId,
    fixtureKind: "minimal-safe-avm1-parent-host",
    authority: {
      sourceChildUntouched: true,
      originalShellExecuted: false,
      originalHostBehaviorClaimed: false,
      captureClassification: "synthetic-host-probe-until-every scenario binding, host adapter, runtime branch, and audio behavior is authoritatively resolved; static false-positive dispositions alone do not change this classification",
      evidencePriority: "The untouched child SWF remains authoritative for its own shipped bytecode/assets. The fixture is a controlled dependency injector, not evidence of original parent-shell defaults.",
    },
    source: {
      childSwf: inventory.source.swf,
      childSwfSha256: inventory.source.swfSha256,
      sourceRelativeFromLesson: relative,
      stage: inventory.source.stage,
      fps: inventory.source.fps,
      rootFrameCount: inventory.source.rootFrameCount,
      actionScriptVersion: inventory.source.actionScriptVersion,
      scenarioInventory: `migrations/${inventory.animationId}/audit/scenario-inventory.json`,
      audioAudit: `migrations/${inventory.animationId}/audit/audio-runtime-evidence.json`,
    },
    stagedDependencies: {
      child,
      exactAudio,
      candidateAudio,
      rule: "Only files listed with an exact hash are copied into the content-addressed fixture. Unknown remote resources and candidate-only audio are absent.",
    },
    entryHandoff,
    bindings,
    requiredGlobals: bindings.filter((item) => item.scope === "_global"),
    requiredRootBindings: bindings.filter((item) => item.scope === "_root" || item.scope === "_level0"),
    requiredParentBindings: bindings.filter((item) => item.scope === "_parent"),
    unresolvedBindings: unresolvedBindings.map((item) => item.binding),
    sideEffectPolicy: {
      childCalls: sideEffects,
      blockedCallCount: blockedCalls.length,
      blockedApis: [...new Set(blockedCalls.map((item) => item.api))].sort(compareText),
      hostAllowedCalls: [
        "MovieClipLoader.loadClip for the one exact local child.swf path",
        `MovieClip.gotoAndPlay(${JSON.stringify(entryHandoff.label)}) exactly once from onLoadInit, matching the child root entry label`,
        "Sound.loadSound for exact copied local audio paths only",
        "in-memory event recording with trace; no URL, JavaScript, LMS/report, SharedObject, fscommand, socket, or remote XML call",
      ],
      sandbox: [
        "deny network for Flash Player and its descendants",
        "allow the minimal LaunchServices bootstrap lookup required to create the Adobe Player window, while denying LaunchServices open/database operations and all Apple Events",
        "deny writes outside the content-addressed fixture, its capture directory, and the OS temporary root",
        "original course shell is never loaded",
      ],
    },
    startupScenarios: [
      {
        scenarioId: "synthetic-host-probe-en",
        language: "en",
        startup: `explicit operator click loads the exact local child; onLoadInit performs the evidenced ${entryHandoff.label} entry handoff; no audio overlay is auto-started`,
        authority: "synthetic-host-probe",
        readyForStrictBaseline: false,
        blockers: [
          ...unresolvedBindings.map((item) => item.binding),
          "any remaining recording/inert host-adapter effects exercised by this scenario",
          "authoritative runtime traversal",
        ],
      },
      {
        scenarioId: "synthetic-host-probe-es-overlay",
        language: "es",
        startup: exactSpanish.length ? "after child load, press S to start the exact copied SA track; press E to stop it and resume the child" : "blocked: no exact Spanish audio association is staged",
        authority: "synthetic-host-probe",
        readyForStrictBaseline: false,
        blockers: exactSpanish.length ? ["spoken-content listening", "authoritative start frame and pause/resume timing"] : ["exact Spanish track association"],
      },
      {
        scenarioId: "authoritative-original-host-contract",
        language: "en|es",
        startup: "blocked until every unresolved binding and recording stub used by the chosen branch is replaced by source- or runtime-proven behavior",
        authority: "future-authoritative-runtime",
        readyForStrictBaseline: false,
        blockers: [
          ...unresolvedBindings.map((item) => item.binding),
          "recording/inert host adapters exercised by the chosen branch",
          "authoritative runtime traversal and audio behavior",
        ],
      },
    ],
    languageSwitch: {
      english: "E stops the fixture-owned Spanish overlay and resumes the child when quizSection is false",
      spanish: exactSpanish.length ? `S loads only ${exactSpanish.map((item) => item.fixturePath).join(", ")}` : "unavailable-no-exact-track",
      fqAudio: inventory.animationId.includes("fq-") ? "The child's EN/SP question and answer buttons call guarded fixture adapters. No FQ candidate is loaded until its exact question/option path is selected in a scenario." : "not-applicable",
      visualLocalizationClaimed: false,
    },
    randomControl: randomObligations.length ? {
      untouchedAvm1SeedEntry: null,
      status: "blocked-for-seeded-authoritative-capture",
      reason: "The shipped child uses AVM1 ActionRandomNumber via random(n); Adobe Flash Player exposes no seed API that a parent movie can set.",
      obligations: randomObligations,
      safeProtocol: "Restart the untouched fixture, classify and hash the observed outcome, and repeat until every outcome is covered. A patched/instrumented child may aid diagnosis but is not authoritative baseline evidence.",
    } : {
      untouchedAvm1SeedEntry: "not-required-no-static-random-obligation",
      status: "not-applicable",
      obligations: [],
    },
    interactionCoverage: {
      acceptanceObligations: inventory.coverage.acceptanceObligationsFromReadiness,
      handlerGroupCount: inventory.coverage.handlerBehaviorGroups?.length || 0,
      conditionalBranchCount: inventory.coverage.conditionalBranchObligations?.length || 0,
      buttonTargetCount: inventory.coverage.buttonTargetObligations?.length || 0,
      inputCount: inventory.coverage.inputObligations?.length || 0,
      dragCount: inventory.coverage.dragObligations?.length || 0,
      captureRule: inventory.coverage.minimumSetRule,
    },
    captureProtocol: [
      "Run verify:sources and verify the fixture manifest before every launch.",
      "Launch only through launch-sandboxed.sh. Never double-click host.swf or the original shell.",
      "Confirm the pre-load screen shows the expected animation ID and fixture digest; then click once to load the child lazily.",
      `Wait until the pre-load status disappears and the trace records child-entry-handoff:${entryHandoff.label}. Capture at the native 800x600 stage with device scale 1 and record the Adobe Player/window protocol.`,
      "For English, do not start the Spanish overlay. For Spanish-audio evidence, press S at the declared cue event; press E to stop. Record the event trace and audio start time.",
      "Traverse only the scenario's allowlisted controls. Do not activate any target listed under blocked child calls.",
      "For each reachable branch, capture every one-indexed frame/state required by scenario-inventory.json, plus up/over/down, terminal, and Replay states.",
      "For random(n), record the observed outcome and restart until all outcomes are represented; never write a seed value because the untouched runtime has no seed entry.",
      "Terminate the Player after each scenario so global state, Sound objects, and random state cannot leak into the next capture.",
      "Hash the raw capture archive, event trace, selected scenario configuration, child/audio files, host.swf, sandbox profile, and tool versions.",
    ],
    strictAcceptanceEffect: "none; the generated fixture does not advance migration status, visual acceptance, audio acceptance, human review, or owner acceptance",
  };
  return specification;
}

function asString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n")}"`;
}

function asLiteral(value) {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return asString(value);
}

function safeIdentifierProperty(binding) {
  const match = binding.match(/^_(global|root)\.([A-Za-z_$][\w$]*)$/);
  return match ? {scope: `_${match[1]}`, property: match[2]} : null;
}

export function renderHostActionScript(specification, fixtureDigest) {
  const childPath = specification.stagedDependencies.child.fixturePath;
  const exactAudio = specification.stagedDependencies.exactAudio;
  const audioAssignments = exactAudio.map((item) => `_global.__fixtureAudioAllowlist[${asString(item.fixturePath)}] = true;`).join("\n");
  const spanishPath = exactAudio.find((item) => item.language === "es")?.fixturePath || "";
  const syntheticAssignments = specification.bindings.flatMap((item) => {
    if (!Object.hasOwn(item, "syntheticValue")) return [];
    const target = safeIdentifierProperty(item.binding);
    if (!target) return [];
    return [`${target.scope}.${target.property} = ${asLiteral(item.syntheticValue)};`];
  }).join("\n");
  return `// Generated safe AVM1 fixture. Not an original-host fidelity implementation.
Stage.scaleMode = "noScale";
Stage.align = "TL";
_global.__fixtureId = ${asString(specification.animationId)};
_global.__fixtureDigest = ${asString(fixtureDigest)};
_global.__fixtureChildPath = ${asString(childPath)};
_global.__fixtureChildSha256 = ${asString(specification.source.childSwfSha256)};
_global.__fixtureEntryLabel = ${asString(specification.entryHandoff.label)};
_global.__fixtureLoaded = false;
_global.__fixtureLoadStarted = false;
_global.__fixtureControlsEnabled = true;
_global.__fixtureEvents = new Array();
_global.__fixtureAudioAllowlist = new Object();
_global.__fixtureSpanishPath = ${asString(spanishPath)};
_global.playSwfFileName = ${asString(childPath)};
_global.__fixtureFeedbackRightIndex = 1;
_global.__fixtureFeedbackWrongIndex = 1;
${syntheticAssignments}
${audioAssignments}

function __fixtureRecord(kind, detail)
{
   var item = new Object();
   item.sequence = _global.__fixtureEvents.length + 1;
   item.timerMs = getTimer();
   item.kind = kind;
   item.detail = detail;
   _global.__fixtureEvents.push(item);
   trace("HELP_FIXTURE|" + item.sequence + "|" + item.timerMs + "|" + kind + "|" + detail);
}

function __fixtureGuardedAudio(pathValue, purpose)
{
   if(_global.__fixtureAudioAllowlist[pathValue] != true)
   {
      __fixtureRecord("blocked-audio", purpose + ":" + pathValue);
      return undefined;
   }
   if(_global.__fixtureSound != undefined)
   {
      _global.__fixtureSound.stop();
   }
   _global.__fixtureSound = new Sound();
   _global.__fixtureSound.onLoad = function(success)
   {
      __fixtureRecord("audio-load", purpose + ":" + pathValue + ":" + success);
      if(success)
      {
         _global.__fixtureAudioStartTimerMs = getTimer();
         _global.__fixtureSound.start(0);
         __fixtureRecord("audio-start", purpose + ":" + pathValue);
      }
   };
   _global.__fixtureSound.onSoundComplete = function()
   {
      __fixtureRecord("audio-complete", purpose + ":" + pathValue);
   };
   _global.__fixtureSound.loadSound(pathValue,false);
   return _global.__fixtureSound;
}

_root.createEmptyMovieClip("InternalPreloader",1);
_root.createEmptyMovieClip("animation_mc",10);
_root.createEmptyMovieClip("animation_mc_preload",11);
_root.createTextField("__fixtureStatus",100000,12,12,776,72);
_root.__fixtureStatus.selectable = false;
_root.__fixtureStatus.multiline = true;
_root.__fixtureStatus.wordWrap = true;
_root.__fixtureStatus.text = "SAFE LAZY FIXTURE\\n" + _global.__fixtureId + "\\nclick once to load exact child; launch only through sandbox";

_root.__fixtureStart = function()
{
   if(_global.__fixtureLoadStarted)
   {
      return;
   }
   _global.__fixtureLoadStarted = true;
   __fixtureRecord("child-load-request",_global.__fixtureChildPath);
   var listener = new Object();
   listener.onLoadError = function(target,errorCode,httpStatus)
   {
      _global.__fixtureLoadError = errorCode + ":" + httpStatus;
      _root.__fixtureStatus.text = "LOAD BLOCKED/FAILED: " + _global.__fixtureLoadError;
      __fixtureRecord("child-load-error",_global.__fixtureLoadError);
   };
   listener.onLoadInit = function(target)
   {
      _global.__fixtureLoaded = true;
      _global.__fixtureChildLoadTimerMs = getTimer();
      target.gotoAndPlay(_global.__fixtureEntryLabel);
      _root.__fixtureStatus._visible = false;
      delete _root.onMouseDown;
      __fixtureRecord("child-load-init",_global.__fixtureChildPath);
      __fixtureRecord("child-entry-handoff",_global.__fixtureEntryLabel);
   };
   _global.__fixtureLoader = new MovieClipLoader();
   _global.__fixtureLoader.addListener(listener);
   _global.__fixtureLoader.loadClip(_global.__fixtureChildPath,_root.animation_mc);
};

_root.onMouseDown = function()
{
   _root.__fixtureStart();
};

_root.__fixtureStopSpanishAudio = function()
{
   if(_global.__fixtureSound != undefined)
   {
      _global.__fixtureSound.stop();
   }
   _global.spanSound = false;
   _global.Play = true;
   _global.Pause = false;
   if(_global.quizSection == false && _root.animation_mc.animation != undefined)
   {
      _root.animation_mc.animation.play();
   }
   __fixtureRecord("language","en-stop-spanish-overlay");
};

_root.__fixtureStartSpanishAudio = function()
{
   if(_global.__fixtureSpanishPath == "")
   {
      __fixtureRecord("blocked-audio","no-exact-spanish-association");
      return;
   }
   _global.spanSound = true;
   _global.Play = false;
   _global.Pause = true;
   if(_root.animation_mc.animation != undefined)
   {
      _root.animation_mc.animation.stop();
   }
   __fixtureGuardedAudio(_global.__fixtureSpanishPath,"spanish-page-overlay");
};

_root.doPlaySpanishAudio = function()
{
   _root.__fixtureStartSpanishAudio();
};
_root.doStopSpanishAudio = function()
{
   _root.__fixtureStopSpanishAudio();
};

_root.showWrongFeed = function()
{
   var target = eval("_root.animation_mc.animation.Mc_Wrong_Feed" + _global.__fixtureFeedbackWrongIndex);
   if(target != undefined)
   {
      target._visible = true;
      target.gotoAndPlay(2);
      target._x = 5;
   }
   __fixtureRecord("host-adapter","showWrongFeed:" + _global.__fixtureFeedbackWrongIndex);
};
_root.showRightFeed = function()
{
   var target = eval("_root.animation_mc.animation.Mc_Right_Feed" + _global.__fixtureFeedbackRightIndex);
   if(target != undefined)
   {
      target._visible = true;
      target.gotoAndPlay(2);
      target._x = 5;
   }
   __fixtureRecord("host-adapter","showRightFeed:" + _global.__fixtureFeedbackRightIndex);
};

_root.disableQuizButton = function()
{
   var i = 1;
   while(i <= 25)
   {
      var target = eval("_root.animation_mc.animation.AnsBtn" + i);
      if(target != undefined)
      {
         target.enabled = false;
         target._visible = false;
      }
      i++;
   }
   if(_root.animation_mc.animation.NMHBtn != undefined)
   {
      _root.animation_mc.animation.NMHBtn.enabled = false;
   }
   __fixtureRecord("host-adapter","disableQuizButton");
};
_root.enableQuizButton = function()
{
   var i = 1;
   while(i <= 25)
   {
      var target = eval("_root.animation_mc.animation.AnsBtn" + i);
      if(target != undefined)
      {
         target.enabled = true;
         target._visible = true;
      }
      i++;
   }
   if(_root.animation_mc.animation.NMHBtn != undefined)
   {
      _root.animation_mc.animation.NMHBtn.enabled = true;
   }
   __fixtureRecord("host-adapter","enableQuizButton");
};

_root.DoHyperLinks = function()
{
   __fixtureRecord("blocked-host-adapter","DoHyperLinks requires a separately specified local glossary fixture");
};
_root.setBookMark = function()
{
   __fixtureRecord("blocked-host-adapter","setBookMark persistence disabled");
};
_root.doCloseApp = function()
{
   __fixtureRecord("blocked-host-adapter","doCloseApp disabled");
};
_root.Send_Click_Report_Mc = new Object();
_root.Send_Click_Report_Mc.gotoAndPlay = function(frameValue)
{
   __fixtureRecord("blocked-host-adapter","click-report:" + frameValue);
};
_root.Send_Quiz_Report_Mc = new Object();
_root.Send_Quiz_Report_Mc.gotoAndPlay = function(frameValue)
{
   __fixtureRecord("blocked-host-adapter","quiz-report:" + frameValue);
};

_root.doPlayFQQuestionAudio = function(targetPath,languageCode)
{
   __fixtureRecord("fq-audio-request","question:" + targetPath + ":" + languageCode);
};
_root.doPlayFQAnswerAudio = function(targetPath,languageCode)
{
   __fixtureRecord("fq-audio-request","answer:" + targetPath + ":" + languageCode);
};

_global.__fixtureKeyListener = new Object();
_global.__fixtureKeyListener.onKeyDown = function()
{
   if(!_global.__fixtureControlsEnabled)
   {
      return;
   }
   var keyCode = Key.getCode();
   if(keyCode == 83)
   {
      _root.__fixtureStartSpanishAudio();
   }
   else if(keyCode == 69)
   {
      _root.__fixtureStopSpanishAudio();
   }
};
Key.addListener(_global.__fixtureKeyListener);
__fixtureRecord("fixture-ready",_global.__fixtureDigest);
stop();
`;
}

export function renderBaseSwfXml(stage, fps = 12) {
  const widthTwips = Number(stage.width) * 20;
  const heightTwips = Number(stage.height) * 20;
  if (!Number.isInteger(widthTwips) || !Number.isInteger(heightTwips) || widthTwips <= 0 || heightTwips <= 0) {
    throw new Error("stage must contain positive integer width/height");
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<swf version="8" compressed="1">
  <Header framerate="${Number(fps)}" frames="1">
    <size><Rectangle left="0" right="${widthTwips}" top="0" bottom="${heightTwips}"/></size>
    <tags>
      <SetBackgroundColor><color><Color red="255" green="255" blue="255"/></color></SetBackgroundColor>
      <DoAction><actions><Stop/><EndAction/></actions></DoAction>
      <ShowFrame/>
      <End/>
    </tags>
  </Header>
</swf>
`;
}

function sandboxQuote(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function renderSandboxProfile({fixtureRoot, temporaryRoot}) {
  return `(version 1)
(allow default)
(deny network*)
(deny appleevent-send)
(deny mach-lookup
  (require-any
    (global-name "com.apple.lsd.open")
    (global-name "com.apple.lsd.modifydb")
    (global-name-regex #"^com\\.apple\\.lsd\\.")))
(deny file-write*
  (require-all
    (require-not (subpath ${sandboxQuote(fixtureRoot)}))
    (require-not (subpath ${sandboxQuote(temporaryRoot)}))
    (require-not (literal "/dev/null"))))
`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function probeSandboxProfile({profilePath, directory}) {
  await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/usr/bin/true"]);
  const insidePath = path.join(directory, "sandbox-write-probe.txt");
  await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/bin/sh", "-c", "printf fixture-write-allowed > \"$1\"", "fixture-probe", insidePath]);
  if (await readFile(insidePath, "utf8") !== "fixture-write-allowed") throw new Error("sandbox did not permit its own fixture write probe");
  const outsidePath = `${directory}-sandbox-outside-write-must-not-exist`;
  if (await exists(outsidePath)) throw new Error(`sandbox outside-write probe path already exists: ${outsidePath}`);
  let outsideWriteDenied = false;
  try {
    await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/bin/sh", "-c", "printf forbidden > \"$1\"", "fixture-probe", outsidePath]);
  } catch {
    outsideWriteDenied = true;
  }
  if (!outsideWriteDenied || await exists(outsidePath)) throw new Error("sandbox allowed a write outside the fixture/temp roots");

  let connected = false;
  const server = createServer((socket) => {
    connected = true;
    socket.end();
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  let networkDenied = false;
  try {
    await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/usr/bin/nc", "-w", "1", "127.0.0.1", String(port)], {timeoutMs: 5_000});
  } catch {
    networkDenied = true;
  } finally {
    await closeServer(server);
  }
  if (!networkDenied || connected) throw new Error("sandbox allowed a local TCP connection");
  return {
    syntaxSmokeTest: "passed-with-/usr/bin/true",
    insideWriteAllowed: true,
    outsideWriteDenied: true,
    localTcpDenied: true,
    probeFilePath: insidePath,
  };
}

function renderLauncher({manifestPath, profilePath, hostPath, smokeOnly = false}) {
  return `#!/bin/sh
set -eu
${smokeOnly ? `echo "GUI sandbox smoke only: verify the pre-load screen and DO NOT CLICK the stage."\nnode ${JSON.stringify(scriptPath)} --verify-fixture ${JSON.stringify(manifestPath)}` : `node ${JSON.stringify(scriptPath)} --verify-launch ${JSON.stringify(manifestPath)}`}
exec /usr/bin/sandbox-exec -f ${JSON.stringify(profilePath)} ${JSON.stringify(flashPlayerPath)} ${JSON.stringify(hostPath)}
`;
}

function renderSmokeTemplate(specification, fixtureDigest) {
  return stableJson({
    schemaVersion: 1,
    animationId: specification.animationId,
    fixtureDigest,
    status: "replace-with-passed-after-observed-sandboxed-pre-load-smoke",
    reviewer: "",
    reviewedAt: "",
    evidenceFile: "capture/replace-with-app-window-smoke-evidence.jpg",
    evidenceMimeType: "image/jpeg",
    evidenceSha256: "",
    observation: "Flash Player opened through smoke-sandboxed.sh, showed only this fixture's pre-load screen, and no child was loaded or clicked. The exact screenshot bytes and MIME type are recorded; this safety smoke image is not a visual-fidelity baseline.",
  });
}

function renderFixtureReadme(specification, manifestRelative) {
  return `# ${specification.animationId} safe Adobe host fixture

This is a generated, synthetic AVM1 parent used to inject controlled local dependencies around the untouched child SWF. It is not the original HELP Math shell and is not proof of original host defaults.

Safety rules:

- Run only the generated sandbox wrappers; never double-click \`host.swf\`.
- First run \`./smoke-sandboxed.sh\` and **do not click**. Record an app-window screenshot with its exact bytes and MIME type, then create \`capture/sandbox-gui-smoke-test.json\` from the template. This safety image is not a visual-fidelity baseline. Normal launch fails closed until that evidence is valid.
- The child loads only after one explicit click.
- Network, LaunchServices open/database operations, Apple Events, LMS/report writes, and persistent writes outside this fixture/temp are denied. The minimal LaunchServices bootstrap needed to create the signed Adobe Player window remains allowed.
- Only the exact hash-listed child and audio files are staged.
- Do not activate controls listed as blocked in \`fixture-spec.json\`.
- The original course shell is not present and must not be copied here.

Language controls after load: **S** starts the exact staged Spanish page-audio overlay when available; **E** stops it. These are fixture controls, not reconstructed product UI.

Random seed: the untouched AVM1 \`random(n)\` opcode has no parent-settable Adobe Player seed. Follow the repeat/classify/hash protocol in the specification.

Before capture, verify ${manifestRelative}, then follow every step in \`fixture-spec.json.captureProtocol\`. Captures made before authoritative binding and host-adapter resolution remain synthetic-host probes and cannot satisfy strict acceptance.
`;
}

async function loadEvidence(migrationsRoot, id) {
  const workspace = path.join(migrationsRoot, id);
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const audioPath = path.join(workspace, "audit", "audio-runtime-evidence.json");
  const [inventoryText, audioText] = await Promise.all([readFile(inventoryPath, "utf8"), readFile(audioPath, "utf8")]);
  const inventory = JSON.parse(inventoryText);
  const audioAudit = JSON.parse(audioText);
  if (inventory.animationId !== id || audioAudit.animationId !== id) throw new Error(`${id}: evidence identity mismatch`);
  return {
    inventory,
    audioAudit,
    evidenceHashes: {
      scenarioInventorySha256: sha256Text(inventoryText),
      audioAuditSha256: sha256Text(audioText),
    },
  };
}

async function compileHost({directory, hostSource, baseXml, toolchain}) {
  if (!toolchain.canCompileFixture) throw new Error("swfmill and FFDec importScript are required to compile a fixture");
  const baseXmlPath = path.join(directory, "host-base.xml");
  const baseSwfPath = path.join(directory, "host-base.swf");
  const importRoot = path.join(directory, "as-import");
  const scriptsRoot = path.join(importRoot, "scripts");
  const actionPath = path.join(scriptsRoot, "frame_1", "DoAction.as");
  const firstPath = path.join(directory, "host-build-a.swf");
  const secondPath = path.join(directory, "host-build-b.swf");
  const finalPath = path.join(directory, "host.swf");
  const decompileRoot = path.join(directory, "compiled-host-export");
  const decompiledPath = path.join(directory, "compiled-host-decompiled.as");
  await mkdir(path.dirname(actionPath), {recursive: true});
  await Promise.all([
    writeFile(baseXmlPath, baseXml, "utf8"),
    writeFile(actionPath, hostSource, "utf8"),
  ]);
  await run(toolchain.swfmill.path, ["xml2swf", baseXmlPath, baseSwfPath]);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-importScript", baseSwfPath, firstPath, scriptsRoot]);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-importScript", baseSwfPath, secondPath, scriptsRoot]);
  const [firstHash, secondHash] = await Promise.all([sha256File(firstPath), sha256File(secondPath)]);
  if (firstHash !== secondHash) throw new Error(`FFDec fixture compilation is not deterministic: ${firstHash} != ${secondHash}`);
  await copyFile(firstPath, finalPath);
  const dump = await run(toolchain.ffdec.path, ["-dumpAS2", finalPath]);
  const dumpText = `${dump.stdout}\n${dump.stderr}`;
  if (!dumpText.includes("/frame 1 - DoAction")) {
    throw new Error("compiled host does not contain the expected frame-1 DoAction tag");
  }
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-export", "script", decompileRoot, finalPath]);
  const exportedScriptPath = path.join(decompileRoot, "scripts", "frame_1", "DoAction.as");
  const decompiledText = await readFile(exportedScriptPath, "utf8");
  if (!decompiledText.includes("HELP_FIXTURE") || !decompiledText.includes("__fixtureChildPath")) {
    throw new Error("compiled host does not contain the expected fixture script markers");
  }
  await writeFile(decompiledPath, decompiledText, "utf8");
  return {
    hostPath: finalPath,
    hostSha256: firstHash,
    deterministicDoubleBuild: true,
    baseXmlPath,
    baseSwfPath,
    actionPath,
    firstPath,
    secondPath,
    decompiledPath,
    exportedScriptPath,
    compilerDumpMarkerVerified: true,
  };
}

async function copyVerified(sourceRelative, destination, expectedSha256) {
  const source = path.resolve(projectRoot, sourceRelative);
  const sourceHash = await sha256File(source);
  if (sourceHash !== expectedSha256) throw new Error(`${sourceRelative}: expected ${expectedSha256}, observed ${sourceHash}`);
  await mkdir(path.dirname(destination), {recursive: true});
  if (await exists(destination)) {
    const existingHash = await sha256File(destination);
    if (existingHash !== expectedSha256) throw new Error(`${destination}: existing content-addressed dependency hash mismatch`);
    return {path: destination, sha256: existingHash};
  }
  await copyFile(source, destination);
  const copiedHash = await sha256File(destination);
  if (copiedHash !== expectedSha256) throw new Error(`${destination}: copied hash mismatch`);
  return {path: destination, sha256: copiedHash};
}

async function buildOneFixture({id, migrationsRoot, outputRoot, toolchain, compile}) {
  const {inventory, audioAudit, evidenceHashes} = await loadEvidence(migrationsRoot, id);
  const specification = buildFixtureSpecification({inventory, audioAudit});
  const specificationTextWithoutDigest = stableJson(specification);
  const fixtureDigest = sha256Text(specificationTextWithoutDigest);
  const directory = path.join(outputRoot, "generated", id, fixtureDigest.slice(0, 24));
  await mkdir(directory, {recursive: true});
  const specificationWithDigest = {...specification, fixtureDigest};
  const specificationText = stableJson(specificationWithDigest);
  const specPath = path.join(directory, "fixture-spec.json");
  const childDestination = path.join(directory, specification.stagedDependencies.child.fixturePath);
  const copied = [
    await copyVerified(specification.stagedDependencies.child.sourceFile, childDestination, specification.stagedDependencies.child.expectedSha256),
  ];
  for (const dependency of specification.stagedDependencies.exactAudio) {
    copied.push(await copyVerified(dependency.sourceFile, path.join(directory, dependency.fixturePath), dependency.expectedSha256));
  }
  const hostSource = renderHostActionScript(specification, fixtureDigest);
  const hostSourcePath = path.join(directory, "host.as");
  const baseXml = renderBaseSwfXml(specification.source.stage, specification.source.fps);
  await Promise.all([
    writeFile(specPath, specificationText, "utf8"),
    writeFile(hostSourcePath, hostSource, "utf8"),
  ]);
  const compileResult = compile ? await compileHost({directory, hostSource, baseXml, toolchain}) : null;
  const fixtureRealRoot = await realpath(directory);
  const temporaryRealRoot = await realpath(os.tmpdir());
  const profilePath = path.join(directory, "sandbox.sb");
  const profileText = renderSandboxProfile({fixtureRoot: fixtureRealRoot, temporaryRoot: temporaryRealRoot});
  await writeFile(profilePath, profileText, "utf8");
  const sandboxProbe = await probeSandboxProfile({profilePath, directory});
  const readmePath = path.join(directory, "README.md");
  await writeFile(readmePath, renderFixtureReadme(specificationWithDigest, "fixture-manifest.json"), "utf8");
  const generatedFiles = [specPath, hostSourcePath, profilePath, sandboxProbe.probeFilePath, readmePath, ...copied.map((item) => item.path)];
  if (compileResult) generatedFiles.push(
    compileResult.hostPath,
    compileResult.baseXmlPath,
    compileResult.baseSwfPath,
    compileResult.actionPath,
    compileResult.firstPath,
    compileResult.secondPath,
    compileResult.decompiledPath,
    compileResult.exportedScriptPath,
  );
  const manifestPath = path.join(directory, "fixture-manifest.json");
  const launcherPath = path.join(directory, "launch-sandboxed.sh");
  const smokeLauncherPath = path.join(directory, "smoke-sandboxed.sh");
  const smokeTemplatePath = path.join(directory, "sandbox-gui-smoke-test.template.json");
  const hostPath = compileResult?.hostPath || path.join(directory, "host.swf");
  await Promise.all([
    writeFile(launcherPath, renderLauncher({manifestPath, profilePath, hostPath}), "utf8"),
    writeFile(smokeLauncherPath, renderLauncher({manifestPath, profilePath, hostPath, smokeOnly: true}), "utf8"),
    writeFile(smokeTemplatePath, renderSmokeTemplate(specification, fixtureDigest), "utf8"),
  ]);
  await Promise.all([chmod(launcherPath, 0o755), chmod(smokeLauncherPath, 0o755)]);
  generatedFiles.push(launcherPath, smokeLauncherPath, smokeTemplatePath);
  const generatedFileHashes = [];
  for (const candidate of generatedFiles) {
    generatedFileHashes.push({
      path: portable(path.relative(directory, candidate)),
      sha256: await sha256File(candidate),
    });
  }
  generatedFileHashes.sort((left, right) => compareText(left.path, right.path));
  const manifest = {
    schemaVersion: 1,
    animationId: id,
    fixtureDigest,
    generatedBy: portable(path.relative(projectRoot, scriptPath)),
    generatedBySha256: await sha256File(scriptPath),
    source: specification.source,
    evidenceHashes,
    directory: portable(path.relative(projectRoot, directory)),
    compilation: compileResult ? {
      status: "compiled-deterministic-double-build",
      hostSha256: compileResult.hostSha256,
      compilerDumpMarkerVerified: compileResult.compilerDumpMarkerVerified,
      toolchain: {swfmill: toolchain.swfmill, ffdec: toolchain.ffdec},
    } : {status: "not-compiled"},
    sandbox: {
      profileSyntaxSmokeTest: sandboxProbe.syntaxSmokeTest,
      insideWriteAllowed: sandboxProbe.insideWriteAllowed,
      outsideWriteDenied: sandboxProbe.outsideWriteDenied,
      localTcpDenied: sandboxProbe.localTcpDenied,
      adobeGuiSmokeTest: "pending-not-run-by-non-gui-factory",
      networkDenied: true,
      launchServicesBootstrapAllowed: true,
      launchServicesOpenAndDatabaseDenied: true,
      appleEventsDenied: true,
      writesRestricted: true,
    },
    launchPolicy: compile ? "launch-only-through-launch-sandboxed.sh-after-adobe-gui-sandbox-smoke-test" : "blocked-host-not-compiled",
    guiSmokeAuthorization: {
      smokeLauncher: "smoke-sandboxed.sh",
      rule: "do not click the lazy pre-load stage during smoke",
      requiredApproval: "capture/sandbox-gui-smoke-test.json",
      template: "sandbox-gui-smoke-test.template.json",
    },
    generatedFileHashes,
    strictAcceptanceEffect: specification.strictAcceptanceEffect,
  };
  await writeFile(manifestPath, stableJson(manifest), "utf8");
  return {directory, manifestPath, manifest, specification};
}

async function buildShellExclusion({migrationsRoot, outputRoot}) {
  const {inventory, audioAudit, evidenceHashes} = await loadEvidence(migrationsRoot, COURSE_SHELL_PILOT_ID);
  const sideEffects = inventory.dependencies.safeSideEffectPolicy || [];
  const report = {
    schemaVersion: 1,
    animationId: COURSE_SHELL_PILOT_ID,
    disposition: "excluded-never-execute-original-shell",
    source: inventory.source,
    evidenceHashes,
    reason: "The requested fixture boundary targets nine child SWFs. This original shell is itself the unsafe dependency being replaced and contains navigation, JavaScript, fscommand, LMS/report, persistent storage, local/remote load, and audio/XML side effects.",
    sideEffectCount: sideEffects.length,
    sideEffectApis: [...new Set(sideEffects.map((item) => item.api))].sort(compareText),
    audioAuditAcceptance: audioAudit.acceptance,
    permittedUse: "static script/tag/XML/asset evidence only until a separately reviewed instrumented shell plan exists",
    forbiddenUse: ["do not open in Adobe Player", "do not copy into a child fixture", "do not use as a production renderer"],
    strictAcceptanceEffect: "none",
  };
  const reportText = stableJson(report);
  const directory = path.join(outputRoot, "shell-exclusion");
  await mkdir(directory, {recursive: true});
  const reportPath = path.join(directory, `${COURSE_SHELL_PILOT_ID}.json`);
  await writeFile(reportPath, reportText, "utf8");
  return {reportPath, report, sha256: sha256Text(reportText)};
}

function renderCapabilityReport({toolchain, fixtures, shellExclusion}) {
  const randomBlocked = fixtures.filter((item) => item.specification.randomControl.status.startsWith("blocked"));
  const unresolved = fixtures.map((item) => ({animationId: item.manifest.animationId, unresolvedBindingCount: item.specification.unresolvedBindings.length}));
  return `# Adobe course-host fixture capability and blocking report

Generated ${fixtures.length} content-addressed, lazy AVM1 parent fixtures for the nine course-child pilots. The original course shell was not executed or copied. Each compiled host loads one exact hash-verified local child only after an explicit click and must be launched through its sandbox wrapper.

## Tool decision

- swfmill: ${toolchain.swfmill.version || "unavailable"}; suitable for the minimal SWF container, not AS2 compilation.
- FFDec: ${typeof toolchain.ffdec.version === "string" ? toolchain.ffdec.version : "unavailable"}; its importScript path compiled the one-frame AVM1 host twice to an identical hash for each generated fixture.
- Adobe Animate: installed=${toolchain.adobeAnimate.installed}; GUI/JSFL authoring evidence only, no supported deterministic headless compiler used.
- Separate AS2 compilers: ${toolchain.optionalAs2Compilers.map((item) => `${item.name}=${item.path ? "available" : "absent"}`).join(", ")}.
- Adobe Flash Player is not launched by this non-GUI factory. Every fixture remains launch-gated until the generated sandbox profile receives a GUI smoke test on this workstation.

## Fail-closed limits

- These are synthetic dependency injectors, not reconstructions of the original shell. They cannot establish original parent/root/global defaults.
- Unresolved binding counts: ${unresolved.map((item) => `${item.animationId}=${item.unresolvedBindingCount}`).join(", ")}.
- ${randomBlocked.length} pilots use untouched AVM1 random(n). A parent SWF cannot seed ActionRandomNumber; authoritative coverage must restart, classify, and hash every observed outcome. Instrumented copies are diagnostic only.
- Spanish page tracks are staged only when the audio audit has an exact hash association. FQ question/answer candidates remain absent until a scenario selects an exact file and cue.
- getURL/javascript, fscommand, LMS/report, SharedObject, XML/data loads, sockets, and unknown remote resources are not fixture operations. Child controls containing those calls are excluded from capture steps; the launcher denies network, LaunchServices open/database operations, Apple Events, and out-of-bound writes while permitting only the window-creation bootstrap lookup.
- Human visual review, spoken-content listening, owner acceptance, full-frame RMSE, and strict migration status are unchanged.

## Original shell

${shellExclusion.report.animationId} is dispositioned **${shellExclusion.report.disposition}**. Static evidence lists ${shellExclusion.report.sideEffectCount} side-effect sites across ${shellExclusion.report.sideEffectApis.join(", ")}; it is never a runnable fixture input.
`;
}

export async function verifyFixtureManifest(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const directory = path.dirname(manifestPath);
  const errors = [];
  const expectedFiles = new Set((manifest.generatedFileHashes || []).map((item) => portable(item.path)));
  for (const item of manifest.generatedFileHashes || []) {
    const candidate = path.resolve(directory, item.path);
    const relative = path.relative(directory, candidate);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`${item.path}: escapes fixture directory`);
      continue;
    }
    if (!(await exists(candidate))) errors.push(`${item.path}: missing`);
    else if (await sha256File(candidate) !== item.sha256) errors.push(`${item.path}: hash mismatch`);
  }
  if (manifest.generatedBySha256 !== await sha256File(scriptPath)) errors.push("fixture generator hash differs; rebuild before launch");
  const walk = async (root, prefix = "") => {
    for (const entry of await readdir(root, {withFileTypes: true})) {
      const relative = portable(path.join(prefix, entry.name));
      if (relative === "capture" || relative.startsWith("capture/")) continue;
      if (entry.isDirectory()) await walk(path.join(root, entry.name), relative);
      else if (entry.isSymbolicLink()) errors.push(`${relative}: symbolic links are forbidden in a fixture`);
      else if (relative !== "fixture-manifest.json" && !expectedFiles.has(relative)) errors.push(`${relative}: unlisted fixture file`);
    }
  };
  await walk(directory);
  if (errors.length) throw new Error(`${manifest.animationId || manifestPath}: ${errors.join("; ")}`);
  return manifest;
}

export async function verifyLaunchAuthorization(manifestPath) {
  const manifest = await verifyFixtureManifest(manifestPath);
  const directory = path.dirname(manifestPath);
  const approvalRelative = manifest.guiSmokeAuthorization?.requiredApproval;
  if (approvalRelative !== "capture/sandbox-gui-smoke-test.json") throw new Error(`${manifest.animationId}: unsupported GUI smoke approval path`);
  const approvalPath = path.join(directory, approvalRelative);
  if (!(await exists(approvalPath))) throw new Error(`${manifest.animationId}: GUI sandbox smoke evidence is pending; run smoke-sandboxed.sh without clicking and complete ${approvalRelative}`);
  const approval = JSON.parse(await readFile(approvalPath, "utf8"));
  const errors = [];
  if (approval.animationId !== manifest.animationId) errors.push("animationId mismatch");
  if (approval.fixtureDigest !== manifest.fixtureDigest) errors.push("fixtureDigest mismatch");
  if (approval.status !== "passed") errors.push("status must be passed");
  if (typeof approval.reviewer !== "string" || !approval.reviewer.trim()) errors.push("reviewer is required");
  if (typeof approval.reviewedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(approval.reviewedAt)) errors.push("reviewedAt must be an ISO timestamp");
  if (typeof approval.evidenceFile !== "string" || !approval.evidenceFile.startsWith("capture/") || approval.evidenceFile.includes("..")) errors.push("evidenceFile must stay under capture/");
  if (!["image/jpeg", "image/png"].includes(approval.evidenceMimeType)) errors.push("evidenceMimeType must be image/jpeg or image/png");
  if (!/^[a-f0-9]{64}$/.test(approval.evidenceSha256 || "")) errors.push("evidenceSha256 must be a SHA-256");
  if (typeof approval.observation !== "string" || !approval.observation.includes("no child was loaded")) errors.push("observation must confirm that no child was loaded");
  if (!errors.length) {
    const evidencePath = path.resolve(directory, approval.evidenceFile);
    const relative = path.relative(path.join(directory, "capture"), evidencePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) errors.push("evidenceFile escapes capture/");
    else if (!(await exists(evidencePath))) errors.push("evidenceFile is missing");
    else if (await sha256File(evidencePath) !== approval.evidenceSha256) errors.push("evidenceFile hash mismatch");
  }
  if (errors.length) throw new Error(`${manifest.animationId}: GUI sandbox smoke approval invalid: ${errors.join("; ")}`);
  return {manifest, approval};
}

export async function buildAdobeCourseHostFixtures(options = {}) {
  const migrationsRoot = path.resolve(options.migrationsRoot || defaultMigrationsRoot);
  const outputRoot = path.resolve(options.outputRoot || defaultOutputRoot);
  const ids = options.ids?.length ? options.ids : COURSE_CHILD_PILOT_IDS;
  for (const id of ids) {
    if (!COURSE_CHILD_PILOT_IDS.includes(id)) throw new Error(`unknown course child pilot: ${id}`);
  }
  await mkdir(outputRoot, {recursive: true});
  const toolchain = await probeFixtureToolchain();
  if (options.compile !== false && !toolchain.canCompileFixture) {
    throw new Error("fixture compilation requested but swfmill/FFDec importScript is unavailable");
  }
  const fixtures = [];
  for (const id of ids) fixtures.push(await buildOneFixture({id, migrationsRoot, outputRoot, toolchain, compile: options.compile !== false}));
  const shellExclusion = await buildShellExclusion({migrationsRoot, outputRoot});
  const index = {
    schemaVersion: 1,
    generatedBy: portable(path.relative(projectRoot, scriptPath)),
    generatedBySha256: await sha256File(scriptPath),
    toolchain,
    fixtureCount: fixtures.length,
    fixtures: fixtures.map((item) => ({
      animationId: item.manifest.animationId,
      fixtureDigest: item.manifest.fixtureDigest,
      directory: item.manifest.directory,
      manifest: portable(path.relative(projectRoot, item.manifestPath)),
      hostSha256: item.manifest.compilation.hostSha256 || null,
      unresolvedBindingCount: item.specification.unresolvedBindings.length,
      blockedApis: item.specification.sideEffectPolicy.blockedApis,
      randomControlStatus: item.specification.randomControl.status,
      strictAcceptanceEffect: item.specification.strictAcceptanceEffect,
    })),
    shellExclusion: {
      animationId: COURSE_SHELL_PILOT_ID,
      report: portable(path.relative(projectRoot, shellExclusion.reportPath)),
      sha256: shellExclusion.sha256,
    },
    authority: "safe fixture construction only; no Adobe runtime was launched and no migration status changed",
  };
  const indexPath = path.join(outputRoot, "manifest.json");
  const capabilityPath = path.join(outputRoot, "CAPABILITY_AND_BLOCKING_REPORT.md");
  const indexText = stableJson(index);
  const capabilityText = renderCapabilityReport({toolchain, fixtures, shellExclusion});
  if (options.check) {
    const [existingIndex, existingCapability] = await Promise.all([readFile(indexPath, "utf8"), readFile(capabilityPath, "utf8")]);
    if (existingIndex !== indexText || existingCapability !== capabilityText) throw new Error("Adobe course-host fixture index/report is stale");
  } else {
    await Promise.all([writeFile(indexPath, indexText, "utf8"), writeFile(capabilityPath, capabilityText, "utf8")]);
  }
  return {indexPath, capabilityPath, index, fixtures, shellExclusion};
}

function usage() {
  return `Usage:
  node scripts/build-adobe-course-host-fixtures.mjs [--id <pilot>] [--output <dir>] [--no-compile] [--check]
  node scripts/build-adobe-course-host-fixtures.mjs --verify-fixture <fixture-manifest.json>
  node scripts/build-adobe-course-host-fixtures.mjs --verify-launch <fixture-manifest.json>

Builds safe, lazy, content-addressed AVM1 parent fixtures for the nine course-child pilots. It never launches Adobe Player or the original course shell.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) console.log(usage());
    else if (options.verifyFixture) {
      const manifest = await verifyFixtureManifest(options.verifyFixture);
      console.log(`Verified fixture ${manifest.animationId}: ${manifest.fixtureDigest}`);
    } else if (options.verifyLaunch) {
      const result = await verifyLaunchAuthorization(options.verifyLaunch);
      console.log(`Verified GUI sandbox smoke approval for ${result.manifest.animationId}: ${result.approval.reviewer}`);
    } else {
      const result = await buildAdobeCourseHostFixtures(options);
      console.log(`Built ${result.index.fixtureCount} Adobe course-host fixtures: ${portable(path.relative(projectRoot, result.indexPath))}`);
      console.log(`Original shell excluded: ${result.index.shellExclusion.report}`);
    }
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}
