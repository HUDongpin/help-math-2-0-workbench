#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const outputJson = path.join(projectRoot, "migrations", "shell-course-g04-l03-index-local", "audit", "source-local-current-javascript-shell-contract.json");
const outputMarkdown = path.join(projectRoot, "migrations", "shell-course-g04-l03-index-local", "audit", "source-local-current-javascript-shell-contract.md");

const PATHS = Object.freeze({
  lessonContract: "reports/g4-l3-lesson-product-navigation-contract.json",
  hostContract: "reports/g4-l3-shell-legacy-host-dependency-contract.json",
  workCards: "reports/g4-l3-implementation-work-cards.json",
  machineAudit: "reports/g4-l3-machine-source-audits.json",
  migrationManifest: "migrations/shell-course-g04-l03-index-local/migration.json",
  migrationBrief: "migrations/shell-course-g04-l03-index-local/MIGRATION_BRIEF.md",
  implementationModule: "packages/demos/src/modules/shell-course-g04-l03-index-local.tsx",
  timelineModule: "packages/demos/src/timelines/shell-course-g04-l03-index-local.ts",
  implementationTest: "packages/demos/tests/course-shell-g04-l03.test.ts",
  sourceXml: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index.xml",
  sourceSwf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function absolute(projectPath) {
  const resolved = path.resolve(projectRoot, projectPath);
  const rel = path.relative(projectRoot, resolved);
  invariant(rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel), `Path escapes project: ${projectPath}`);
  return resolved;
}

async function bindFile(projectPath) {
  const bytes = await readFile(absolute(projectPath));
  return {path: projectPath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function readBoundJson(projectPath) {
  const bytes = await readFile(absolute(projectPath));
  return {value: JSON.parse(bytes.toString("utf8")), binding: {path: projectPath, bytes: bytes.length, sha256: sha256(bytes)}};
}

function scriptRecord(shellAudit, scriptPathValue) {
  const record = shellAudit.scripts.files.find(({path: candidate}) => candidate === scriptPathValue);
  invariant(record, `Machine shell audit is missing ${scriptPathValue}`);
  return {path: record.path, bytes: record.bytes, sha256: record.sha256, textNormalization: "LF"};
}

export function validateShellCurrentJavascriptContract(contract) {
  invariant(contract.schemaVersion === 1, "Unexpected shell current-JavaScript contract schema");
  invariant(contract.reportType === "g4-l3-source-local-current-javascript-shell-contract", "Unexpected shell contract type");
  invariant(contract.animationId === "shell-course-g04-l03-index-local", "Unexpected shell animation id");
  invariant(contract.source.swf.sha256 === "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e", "Shell SWF hash drifted");
  invariant(contract.source.xml.sha256 === "0f1109321a5b65507c36fb8fd30380c4899cb7f381c2959aa7092d59bba990b0", "Lesson XML hash drifted");
  invariant(contract.runtime.stage.width === 800 && contract.runtime.stage.height === 600 && contract.runtime.fps === 12 && contract.runtime.rootFrameCount === 50, "Shell runtime metadata drifted");
  invariant(contract.sections.length === 8 && contract.pages.length === 39, "Shell product projection must contain 8 sections and 39 pages");
  invariant(contract.pages.every((page, index) => page.globalPageOrdinal === index + 1), "Shell page ordinals are not contiguous");
  invariant(contract.pages[0].previousAnimationId === null && contract.pages.at(-1).nextAnimationId === null, "Shell boundary adjacency drifted");
  invariant(contract.pages.slice(1).every((page, index) => page.previousAnimationId === contract.pages[index].animationId), "Shell previous-page adjacency drifted");
  invariant(contract.pages.slice(0, -1).every((page, index) => page.nextAnimationId === contract.pages[index + 1].animationId), "Shell next-page adjacency drifted");
  invariant(contract.sourceEvidence.frame49InitializationStop.sha256 === "e123f46532b5797df9bfdad8e2778d116dc900fbda07bc3003d1f80ffce26158", "Normalized frame 49 script hash drifted");
  invariant(contract.sourceEvidence.frame50ChildLoadCandidate.sha256 === "5b8eab18c203538d658759ab058914417155bd84ae198af107cd1fcb582b29a4", "Normalized frame 50 script hash drifted");
  invariant(contract.rendererContract.framePhases.length === 3, "Shell frame phase count drifted");
  invariant(contract.rendererContract.framePhases[0].start === 1 && contract.rendererContract.framePhases[0].end === 48, "Shell unresolved pre-initialization phase drifted");
  invariant(contract.rendererContract.framePhases[1].start === 49 && contract.rendererContract.framePhases[1].end === 49, "Shell initialization-stop phase drifted");
  invariant(contract.rendererContract.framePhases[2].start === 50 && contract.rendererContract.framePhases[2].end === 50, "Shell product-map phase drifted");
  invariant(contract.rendererContract.framePhases[0].renderState === "blocked" && contract.rendererContract.framePhases[1].renderState === "blocked", "Unresolved shell source frames must fail closed");
  invariant(contract.rendererContract.framePhases[2].renderState === "ready", "Current-JavaScript shell projection must remain the only ready frame phase");
  invariant(contract.rendererContract.externalEffects.every(({enabled}) => enabled === false), "Legacy shell external effects must remain disabled");
  invariant(Object.values(contract.acceptance).every((value) => value === false), "Shell engineering contract cannot promote acceptance");
}

export async function buildShellCurrentJavascriptContract() {
  const [lesson, host, workCards, machine, manifest, migrationBrief, implementationModule, timelineModule, implementationTest, sourceXml, sourceSwf, generator] = await Promise.all([
    readBoundJson(PATHS.lessonContract),
    readBoundJson(PATHS.hostContract),
    readBoundJson(PATHS.workCards),
    readBoundJson(PATHS.machineAudit),
    readBoundJson(PATHS.migrationManifest),
    bindFile(PATHS.migrationBrief),
    bindFile(PATHS.implementationModule),
    bindFile(PATHS.timelineModule),
    bindFile(PATHS.implementationTest),
    bindFile(PATHS.sourceXml),
    bindFile(PATHS.sourceSwf),
    bindFile(path.relative(projectRoot, scriptPath).split(path.sep).join("/")),
  ]);
  invariant(lesson.value.summary.activePages === 39 && lesson.value.summary.courseShells === 1, "Lesson contract is not 39 pages plus one shell");
  invariant(lesson.value.publication.published === false && lesson.value.publication.strictCompleteMembers === 0, "Lesson publication is not fail-closed");
  const workCard = workCards.value.cards.find(({animationId}) => animationId === "shell-course-g04-l03-index-local");
  invariant(workCard?.sequence === 40 && workCard.releaseRole === "course-shell", "Shell work card is missing or out of order");
  invariant(workCard.source.swf.sha256 === sourceSwf.sha256 && workCard.source.swf.bytes === sourceSwf.bytes, "Shell work-card source binding drifted");
  invariant(lesson.value.sourceBindings.sourceXml.sha256 === sourceXml.sha256, "Lesson contract XML binding drifted");
  invariant(lesson.value.shell.source.swf.sha256 === sourceSwf.sha256, "Lesson contract shell binding drifted");
  invariant(host.value.shell.source.sha256 === sourceSwf.sha256 && host.value.acceptance.gates.routeImplementation === false, "Legacy host dependency contract drifted or promoted route implementation");
  invariant(host.value.summary.candidatesWithoutDisposition === 0 && host.value.acceptance.legacyEndpointExecutions === 0, "Legacy host candidates are unresolved or executed");
  invariant(manifest.value.animationId === "shell-course-g04-l03-index-local" && manifest.value.source.swfSha256 === sourceSwf.sha256, "Shell migration manifest identity/source drifted");
  invariant(manifest.value.runtime.frameCount === 50 && manifest.value.runtime.backgroundColor === "#ffffff" && manifest.value.runtime.actionScriptVersion === "AS1/2", "Shell migration runtime specification is incomplete or stale");
  invariant(manifest.value.implementation.component === PATHS.implementationModule && manifest.value.implementation.timelineModule === PATHS.timelineModule && manifest.value.implementation.testFile === PATHS.implementationTest, "Shell migration implementation map drifted");
  invariant(manifest.value.implementation.frameDomains[0]?.id === "root" && manifest.value.implementation.frameDomains[0]?.frameCount === 50, "Shell migration root frame-domain specification drifted");
  invariant(manifest.value.audio.required === true && manifest.value.acceptance.humanVisualReview.decision === "pending" && manifest.value.acceptance.ownerReview.decision === "pending", "Shell migration evidence/acceptance boundary drifted");
  const shellAudit = machine.value.items.find(({animationId}) => animationId === "shell-course-g04-l03-index-local");
  invariant(shellAudit && shellAudit.source.swf.sha256 === sourceSwf.sha256, "Machine shell audit is missing or stale");

  const pages = lesson.value.pages.map((page) => ({
    globalPageOrdinal: page.globalPageOrdinal,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sectionCode: page.sectionCode,
    animationId: page.animationId,
    assetId: page.assetId,
    sourcePath: page.source.swf.path.replace(/^source-assets\/flash\/HELP MATH_ORIGINAL FILES\/HELP_COURSES\/ELMGR4\/L3\//, ""),
    titleEnglish: page.labels.pageEnglish.valueRaw,
    titleSpanish: page.labels.pageSpanish.valueRaw,
    spanishTitleStatus: page.labels.pageSpanish.status,
    previousAnimationId: page.navigation.previousAnimationId,
    nextAnimationId: page.navigation.nextAnimationId,
    auditRoutes: page.routes,
    strictRoute: null,
    strictComplete: false,
  }));
  const sections = lesson.value.sections.map((section) => ({
    order: section.order,
    code: section.code,
    titleEnglish: section.labels.en.valueRaw,
    titleSpanish: section.labels.es.valueRaw,
    firstActiveAnimationId: section.firstActiveAnimationId,
    pageCount: section.activePageCount,
    pageAnimationIds: pages.filter((page) => page.sectionCode === section.code).map((page) => page.animationId),
  }));

  const contract = {
    schemaVersion: 1,
    reportType: "g4-l3-source-local-current-javascript-shell-contract",
    animationId: "shell-course-g04-l03-index-local",
    generator: {...generator, version: 1},
    sourceBindings: {
      lessonProductContract: lesson.binding,
      shellLegacyHostDependencyContract: host.binding,
      implementationWorkCards: workCards.binding,
      machineSourceAudits: machine.binding,
      migrationManifest: manifest.binding,
      migrationBrief,
      implementationModule,
      timelineModule,
      implementationTest,
    },
    source: {swf: sourceSwf, xml: sourceXml, sourceKind: "swf-only"},
    runtime: {
      stage: {width: 800, height: 600},
      fps: 12,
      rootFrameCount: 50,
      durationMs: (50 * 1000) / 12,
      actionScriptVersion: "AS1/2",
      defaultFrameDomain: "root",
    },
    sourceEvidence: {
      frame35HostContract: lesson.value.shell.staticScriptEvidence.rootScript,
      frame49InitializationStop: scriptRecord(shellAudit, "frame_49/DoAction.as"),
      frame50ChildLoadCandidate: scriptRecord(shellAudit, "frame_50/DoAction.as"),
      frame49Facts: ["Calls Activ()", "initializes default section/page when no bookmark exists", "calls stop()", "does not establish rendered visual parity"],
      frame50Facts: ["calls doCreateSlide()", "calls loadSWFMovie()", "exposes host navigation candidates", "does not establish natural runtime reachability or visual parity"],
      staticSequenceConflict: lesson.value.shell.staticSequence,
      sourceAuthorityBoundary: "Active physical index.xml order drives the 39-page product projection. The shipped shell's 44-path static LessonDetails candidate remains unresolved until authoritative runtime and owner disposition.",
    },
    sections,
    pages,
    rendererContract: {
      classification: "acceptance-neutral-current-javascript-structural-shell-candidate",
      implementationPath: "packages/demos/src/modules/shell-course-g04-l03-index-local.tsx",
      timelinePath: "packages/demos/src/timelines/shell-course-g04-l03-index-local.ts",
      framePhases: [
        {id: "source-root-pre-initialization-unresolved", start: 1, end: 48, renderState: "blocked", visualPolicy: "render explicit unresolved-source-visual placeholder; do not imitate the G4 L1 loader"},
        {id: "source-initialization-stop", start: 49, end: 49, renderState: "blocked", visualPolicy: "render explicit source-initialization-stop status; no source visual parity claim"},
        {id: "current-javascript-lesson-map-projection", start: 50, end: 50, renderState: "ready", visualPolicy: "render source-ordered 39-page audit navigation projection; not an original shell visual baseline"},
      ],
      scenarios: ["default", ...sections.map(({code}) => `section-${code.toLowerCase()}`), "quit-confirmation"],
      languages: ["en", "es"],
      spanishPolicy: "Use exact source section/page labels when present. When a page or lesson title lacks a Spanish source label, retain the English text with an explicit source-language/fallback marker; never invent a translation.",
      childRoutePolicy: "Expose local audit-context links for all 39 current-JavaScript page candidates. Public production admission remains controlled by the strict completion and atomic lesson-release ledgers.",
      replayPolicy: "Reset only the current JavaScript shell interaction state to the lesson map. Original shell child/replay/audio state parity remains unverified.",
      externalEffects: [
        {id: "fscommand", enabled: false},
        {id: "getURL", enabled: false},
        {id: "loadMovie", enabled: false},
        {id: "loadVariablesNum", enabled: false},
        {id: "SharedObject.getLocal", enabled: false},
        {id: "Sound.loadSound", enabled: false},
        {id: "XML.load", enabled: false},
        {id: "legacy-close", enabled: false},
        {id: "keyterms", enabled: false},
        {id: "calculator", enabled: false},
      ],
    },
    unresolved: [
      "frames 1-48 source visuals and exact loader timing",
      "frame 49 and frame 50 native composited visuals",
      "44-path static shell candidate versus 39 active XML pages",
      "natural host navigation, child loading, bookmarks, section/page globals, and Final Quiz visibility",
      "Spanish host audio, pause/resume, synchronization, Replay/reset, and listening acceptance",
      "keyterms XML conflict, glossary diagrams, calculator, accessibility parity, and close behavior",
      "all original-runtime captures, full-frame RMSE, human review, owner acceptance, strict completion, and publication",
    ],
    acceptance: {
      originalRuntimeComplete: false,
      visualParityComplete: false,
      behaviorParityComplete: false,
      bilingualVisualParityComplete: false,
      audioAccepted: false,
      accessibilityAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonComplete: false,
    },
  };
  validateShellCurrentJavascriptContract(contract);
  return contract;
}

export function renderMarkdown(contract) {
  return [
    "# G4 L3 source-local current-JavaScript shell contract",
    "",
    "> Acceptance-neutral implementation contract. It defines a safe structural product candidate, not a faithful shell migration.",
    "",
    `- Source: \`${contract.source.swf.path}\` (${contract.source.swf.sha256}).`,
    `- Runtime: ${contract.runtime.stage.width}×${contract.runtime.stage.height}, ${contract.runtime.fps} FPS, ${contract.runtime.rootFrameCount} root frames.`,
    `- Product projection: ${contract.pages.length} active pages across ${contract.sections.length} sections.`,
    `- Static shipped-shell candidate: ${contract.sourceEvidence.staticSequenceConflict.pageCount} paths; conflict remains ${contract.sourceEvidence.staticSequenceConflict.conflictStatus}.`,
    "",
    "## Frame policy",
    "",
    ...contract.rendererContract.framePhases.map((phase) => `- ${phase.start}–${phase.end}: \`${phase.id}\` — ${phase.visualPolicy}`),
    "",
    "## External effects",
    "",
    ...contract.rendererContract.externalEffects.map((effect) => `- \`${effect.id}\`: disabled`),
    "",
    "## Acceptance boundary",
    "",
    "Original runtime, visual/behavior parity, bilingual visuals, audio, accessibility acceptance, human review, owner acceptance, strict completion, and lesson publication all remain false.",
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const contract = await buildShellCurrentJavascriptContract();
  const json = `${JSON.stringify(contract, null, 2)}\n`;
  const markdown = `${renderMarkdown(contract)}\n`;
  if (options.check) {
    const [existingJson, existingMarkdown] = await Promise.all([readFile(outputJson, "utf8"), readFile(outputMarkdown, "utf8")]);
    invariant(existingJson === json, "G4 L3 shell current-JavaScript JSON contract is stale");
    invariant(existingMarkdown === markdown, "G4 L3 shell current-JavaScript Markdown contract is stale");
    process.stdout.write("verified G4 L3 source-local current-JavaScript shell contract\n");
    return;
  }
  await Promise.all([writeFile(outputJson, json), writeFile(outputMarkdown, markdown)]);
  process.stdout.write("wrote G4 L3 source-local current-JavaScript shell contract\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
