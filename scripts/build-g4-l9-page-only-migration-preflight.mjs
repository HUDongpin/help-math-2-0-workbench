#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  lstat,
  open,
  readFile,
  readdir,
  stat,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const TASK_ID =
  "HELP-MATH-G4-L9-P3-MIGRATION-PREFLIGHT-20260823";
export const CONTROL_THREAD_ID = "01a02a2f-c8b7-7671-84d9-3e49112819b1";
export const PREDECESSOR_TASK_ID =
  "HELP-MATH-P1-1751-PAGE-ONLY-MIGRATION-CONTROL-LEDGER-20260823";
export const INPUT_HEAD = "3594a9a0071bb180c06648b7f6b227a9b3644752";
export const INPUT_PARENT = "60f356be9b34cabd3ca1aad15b6dd00babfc7e35";
export const INPUT_TREE = "1066dc360054c6c09b5a409bf08f0917daeb8058";
export const TARGET_BRANCH =
  "codex/help-math-g4-l9-p3-migration-preflight-20260823";

export const OUTPUT_PATHS = Object.freeze({
  json: "catalog/g4-l9-page-only-migration-preflight-v1.json",
  markdown: "reports/g4-l9-page-only-migration-preflight-v1.md",
});

export const REVIEWED_ALLOWLIST = Object.freeze([
  "catalog/g4-l9-page-only-migration-preflight-v1.json",
  "reports/g4-l9-page-only-migration-preflight-v1.md",
  "scripts/build-g4-l9-page-only-migration-preflight.mjs",
  "scripts/build-g4-l9-page-only-migration-preflight.test.mjs",
]);

const DEFAULT_JSON_PATH = path.join(projectRoot, OUTPUT_PATHS.json);
const DEFAULT_MARKDOWN_PATH = path.join(projectRoot, OUTPUT_PATHS.markdown);
const LEDGER_PATH = path.join(
  projectRoot,
  "catalog/page-only-migration-control-ledger.json",
);
const DASHBOARD_PATH = path.join(
  projectRoot,
  "reports/page-only-migration-control-dashboard.md",
);

const EXPECTED = Object.freeze({
  ledgerSha256: "093674b1f0f4f5d37def6967c5336cf1db0e67382dd8610ccb2efcf4721cae49",
  dashboardSha256: "eb492e79614f1ff08045188df8c2af69de0a88d1441b2d850b9e6fc1cc314e9d",
  auditSummarySha256: "f83567bb9a72486e23aa2adbae7fed2f9b3bab277cffe916e5fafb1b1b2d1f0a",
  auditRowsSha256: "4ed082418e6cc34f9ce58a41d987c184284a0b261beab0a1f80b9c01f3627ee9",
  sourceXmlSha256: "d1d3bdba357f66e252d6201b00cffeed409ea4505233595cedf1f5bfd10722b4",
  placementIdNulSha256: "5637371fd5d1457901f30735da0d52e39160258559e3ebc3a732370a45236ea8",
  expectedSwfPathNulSha256: "7b9e6ba515d36895dd60c8cb6e8a770e04747c56c6b9a17b74787303fae4b4bc",
  assetIdNulSha256: "832c98408b2ba69894ee966a4290ec1d5d77f57866381d7e58cb5c7a74d68082",
  rowProjectionSha256: "313e6e9b9fb30facd55ecddf74eb039ab8cdb4595f7bd7b145dda67a4f1aa0db",
  slicePlacementIdNulSha256: "bfec777a4a43cafc72cf4be00bbe0b73e31a0549bb189c3b75a2c6a6aedaaecb",
  sliceAssetIdNulSha256: "76f2d2b5143d49da55f96979de3f86a15ca9d0e28ad034d2302cde71f94891ee",
  sliceProjectionSha256: "e15a6efc10f31897cf0a67e1d1776a43abf64feeb92a47c3917fc52bd837c3b5",
  allowlistNulSha256: "18a5fdb3ac18ff0be96e62e1373654b84aa6ea83ea8310aa3cd0adfc518e7c54",
  allowlistNulBytes: 215,
  occurrenceCount: 43,
  pairedFlaCount: 25,
  swfOnlyCount: 18,
  sourceXmlPath: "HELP_COURSES/ELMGR4/L9/index.xml",
  sectionCounts: Object.freeze({IR: 1, RW: 3, VB: 10, IN: 12, TI: 6, GS: 1, TS: 7, FQ: 3}),
  sliceSources: Object.freeze([1, 2, 12, 16, 22, 23, 24, 27, 28, 30, 33, 40, 41, 42]),
  globalCounts: Object.freeze({
    lessons: 29,
    occurrences: 1_751,
    registeredOccurrences: 426,
    registeredUniqueRenderers: 425,
    registeredLessons: 8,
    remainingOccurrences: 1_325,
    candidateOnlyOccurrences: 5,
  }),
  p0: Object.freeze({
    checkout: "/Volumes/WestWorld/HELP MATH 2.0-g4-l5-l10-l11-integration",
    branch: "codex/g4-l5-l10-l11-page-only-integration",
    head: INPUT_PARENT,
    inputPlanPath: "reports/help-math-426-page-only-baseline-input-plan-2026-08-22.json",
    inputPlanSha256: "6d181ad88f0c0cd0e6094a4fff2ac4056a883f442e402b3aa9c69ac8c94a4764",
    frozenReceiptPath: "artifacts/handoffs/help-math-p0-426-page-only-baseline-final-receipt-2026-08-23.json",
    frozenReceiptSha256: "5c4c96d98f76977c8bb05438af6b2b7c22ceb8b96193b1d291166fac950bb028",
    frozenReceiptBytes: 280_799,
    frozenReceiptMode: "0444",
    frozenReceiptFlags: Object.freeze(["uchg"]),
  }),
  protectedRoot: Object.freeze({
    path: "/Volumes/WestWorld/HELP MATH 2.0",
    normalPorcelainNulSha256: "7f844e2820d1dd0e79365e3989c5567c7e2aa3cae2cd55566716fe3b5d7f5fb6",
    modified: 111,
    deleted: 663,
    untracked: 73,
    total: 847,
  }),
  phaseAScratch: Object.freeze({
    files: 1_940,
    logicalBytes: 31_995_437,
    closureSha256: "87800b0ec71d40e28499b47fa67724b39ed9c8d2680a11dc7ff4439022eb2a0b",
    runAuditSha256: "9ce53c95c57e5a6da450377fb4c04bf6693ea9bc1f91875b1c94c6ceb49dbdb4",
  }),
});

const FAMILY_DEFINITIONS = Object.freeze([
  Object.freeze({
    familyId: "F01",
    name: "introduction-random-audio-ui",
    pages: Object.freeze([1]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Seeded random introduction IR with input, keyboard, embedded-audio, and modern-host adapters.",
    evidenceReason: "Randomized introduction, keyboard/input state, branching, and embedded audio require a maintained behavior model.",
  }),
  Object.freeze({
    familyId: "F02",
    name: "narrated-click-reveal",
    pages: Object.freeze([2, 3, 4, 5, 7, 8, 10, 11, 13, 14, 15, 19, 21, 25, 34, 35, 36, 37]),
    complexity: "interactive-understood",
    lane: "factory",
    maintainedLogic: "Source-derived timeline IR plus click/reveal configuration and the base host/audio adapter.",
    evidenceReason: "The static scripts expose bounded click/reveal or navigation behavior over source-declared visual timelines.",
  }),
  Object.freeze({
    familyId: "F03",
    name: "quiz-trycount-text-feedback",
    pages: Object.freeze([6, 9, 12]),
    complexity: "interactive-understood",
    lane: "factory",
    maintainedLogic: "Typed-answer, try-counter, and feedback-state primitives driven by source-bound family configuration.",
    evidenceReason: "Try-count, text input, and correct/wrong feedback are statically bounded and share one quiz contract.",
  }),
  Object.freeze({
    familyId: "F04",
    name: "minimal-linear-timeline",
    pages: Object.freeze([16, 38]),
    complexity: "low",
    lane: "factory",
    maintainedLogic: "Minimal source-derived linear timeline IR.",
    evidenceReason: "No buttons and only a minimal script surface were found; the visual timeline remains source-bound.",
  }),
  Object.freeze({
    familyId: "F05",
    name: "random-expression-input",
    pages: Object.freeze([17, 28]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Seeded expression generation, input normalization, and explicit branch-state IR.",
    evidenceReason: "Randomized expression construction, input state, and high branch density require explicit maintained semantics.",
  }),
  Object.freeze({
    familyId: "F06",
    name: "coached-feedback-practice",
    pages: Object.freeze([18, 24, 26]),
    complexity: "interactive-understood",
    lane: "factory",
    maintainedLogic: "Coached answer/feedback primitives with source-bound morph and bitmap configuration.",
    evidenceReason: "The coach and feedback lifecycle is bounded across a repeated structural family.",
  }),
  Object.freeze({
    familyId: "F07",
    name: "drag-swap-reset",
    pages: Object.freeze([27]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Deterministic drag/drop, display-depth swap, reset, and host-state IR.",
    evidenceReason: "Drag state, depth swapping, random selection, and reset obligations require explicit reconstruction.",
  }),
  Object.freeze({
    familyId: "F08",
    name: "drag-choice-random-feedback",
    pages: Object.freeze([20, 29, 30, 32]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Seeded random-question, drag-target, answer, and feedback-state IR.",
    evidenceReason: "Random question choice, drag handlers, feedback, and terminal transitions are behavior-heavy.",
  }),
  Object.freeze({
    familyId: "F09",
    name: "parent-stepped-balance",
    pages: Object.freeze([22]),
    complexity: "interactive-understood",
    lane: "factory",
    maintainedLogic: "Bounded stepped-balance IR with a minimal modern-parent host adapter.",
    evidenceReason: "The page exposes one bounded stepped interaction despite a long declared visual timeline.",
  }),
  Object.freeze({
    familyId: "F10",
    name: "balance-scale-solver",
    pages: Object.freeze([23, 31]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Equation state, seeded random, drag, reset, feedback, terminal, and Replay IR.",
    evidenceReason: "Dense branching plus drag, random, reset, and Replay behavior requires an explicit state machine.",
  }),
  Object.freeze({
    familyId: "F11",
    name: "test-choice-feedback-replay",
    pages: Object.freeze([39, 40]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Choice-test state, feedback, Replay, and multi-stream audio IR.",
    evidenceReason: "Thirty-one buttons, Replay, feedback-host dependencies, and twelve embedded streams make the lifecycle behavior-heavy.",
  }),
  Object.freeze({
    familyId: "F12",
    name: "game-random-score-terminal",
    pages: Object.freeze([33]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Reuse the existing GS002 workspace for seeded game, scoring, Final, Replay, glossary, and host adapters.",
    evidenceReason: "The known GS002 game contains random, score, Final/Repeat/Replay, bilingual, audio, and host obligations.",
  }),
  Object.freeze({
    familyId: "F13",
    name: "final-quiz-intro-controller",
    pages: Object.freeze([41]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Final-quiz lifecycle controller with explicit EN/ES audio-group selection.",
    evidenceReason: "The FQ controller has dense branch/input state and owns the shared bilingual audio lifecycle.",
  }),
  Object.freeze({
    familyId: "F14",
    name: "final-quiz-random-score-report",
    pages: Object.freeze([42, 43]),
    complexity: "behavior-heavy",
    lane: "advanced-manual",
    maintainedLogic: "Seeded question, scoring, review, finish, and modern report adapter with legacy navigation/network denied by default.",
    evidenceReason: "Random/scoring/report state and legacy getURL candidates require an explicit deny-by-default host boundary.",
  }),
]);

const SLICE_SELECTION_REASONS = Object.freeze({
  1: "Covers random introduction, keyboard/input state, and embedded-audio routing.",
  2: "Covers the SWF-only narrated family at its longest nested-domain and mask/morph/bitmap stress point.",
  12: "Covers typed quiz input, try-count, and text-feedback host behavior.",
  16: "Covers the minimal no-button SWF-only linear baseline.",
  22: "Covers the parent-hosted stepped-balance family.",
  23: "Covers the highest-risk balance solver with dense branch, drag, random, reset, and Replay state.",
  24: "Covers coached feedback with morph/bitmap content from a SWF-only source.",
  27: "Covers drag, display-depth swap, reset, and host-state obligations.",
  28: "Covers randomized expression input and high branch density.",
  30: "Covers drag-choice feedback and doGetRndQuest behavior.",
  33: "Retains and recalibrates the known difficult GS002 candidate instead of replacing it.",
  40: "Covers Replay, thirty-one buttons, feedback-host behavior, and twelve embedded streams.",
  41: "Covers the FQ intro/controller and shared EN/ES external-audio lifecycle.",
  42: "Covers FQ random/scoring/report behavior and the legacy getURL deny boundary.",
});

const GS002_FILES = Object.freeze([
  Object.freeze({path: "migrations/course-g04-l09-gs-002/migration.json", sha256: "12100c34e3799601f83871e33bf802803335a0baebc73215b9648a915e59ad42"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/MIGRATION_BRIEF.md", sha256: "3d80bd5298aa8e0407662b48dc212611f048bfe7a383cebe29a283539655c5a8"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/ACCEPTANCE_CHECKLIST.md", sha256: "7ca57dcc4a8c3eb53d85d40fb54d489e9056d40d446337559e4503fb8e456583"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/strict-readiness.json", sha256: "b7041ece9c0a391f137985f18f0c1f68fada36851ca160de45392d6888fd62ae"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/partial-current-js-requirement.json", sha256: "d62646f0f7d285288944acfe38c5add16be254f614df367cce180c13f38b1a60"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/audio-runtime-evidence.json", sha256: "2b08d241f3f7cc5a7699171e9e56af929287d61fcacdfd7ae2eabf2005f19384"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/bilingual-visual-source-disposition.json", sha256: "e70cf40b8389cffb6ab2e7ebd25bb2256e97d767d12e76d07854cd1185d1af81"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/canvas-adapter-spec.json", sha256: "df225caa8673b3ecfa576aac5b2e6b896fd65bf646862199d71091ecaa91a761"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/adobe-course-frame-controller-spec.json", sha256: "d6c9fadaa01741e27eff7f98581f15a0633f5014441177049877c0aa2cb9aa20"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/evidence/nextjs-native-candidate-qa.json", sha256: "de92ad947859c0fcb7d093006a58b34db8141a1dc35e80da34fd94dabdf7d14d"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/machine/ffdec-scripts.txt.gz", sha256: "eb6a87a913b2d9d88f8aef8dbffb3623d3f3dcaac2c38569144fef532a595b72"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/machine/ffdec-tags.txt.gz", sha256: "6ec0581964e29490ffeec5b3a998178051691b13fc98440890ce4716907a77be"}),
  Object.freeze({path: "migrations/course-g04-l09-gs-002/audit/machine/swfmill.xml.gz", sha256: "7aad3613a70ca1b4971e7baf5ded8744e408de67426cf1caee1379942f6c631f"}),
  Object.freeze({path: "packages/demos/src/modules/course-g04-l09-gs-002.tsx", sha256: "14d44a321c920cd5bf642ca47a027ac272419b311e698d07351e4087900adaf9"}),
  Object.freeze({path: "packages/demos/src/timelines/course-g04-l09-gs-002.ts", sha256: "82c2475d97253f5a45ee9950e6de17d692c433233dafd038acee1e7c13fc3677"}),
  Object.freeze({path: "packages/demos/tests/course-g04-l09-gs-002.test.ts", sha256: "7657de39dd32ebb4f5352e67a66a54ded104dce9956fbaf0287bf26f1ec3a2df"}),
  Object.freeze({path: "packages/demos/src/registry.generated.ts", sha256: "c29579a33fced3b75fffd372af890e264e465f349dce6496aeaead64d7d830c0"}),
]);

const INDEPENDENT_FALSE_GATES = Object.freeze([
  "newCandidateGenerated",
  "newRendererGenerated",
  "registeredCurrentJs",
  "originalRuntime",
  "technicalFidelity",
  "audioAccepted",
  "humanReview",
  "ownerAcceptance",
  "strictComplete",
  "released",
  "productionVerified",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function utf8Sorted(values) {
  return [...values].sort((left, right) =>
    Buffer.compare(Buffer.from(left), Buffer.from(right)));
}

export function nulBuffer(values) {
  return Buffer.concat(values.map((value) => Buffer.from(`${value}\0`)));
}

export function sha256Nul(values) {
  return sha256(nulBuffer(values));
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return hash.digest("hex");
}

function modeString(mode) {
  return (mode & 0o777).toString(8).padStart(4, "0");
}

async function readJsonWithBytes(filePath) {
  const bytes = await readFile(filePath);
  return {bytes, value: JSON.parse(bytes.toString("utf8"))};
}

function rowProjection(rows) {
  return rows.map((row) => ({
    placementId: row.placementId,
    sourceOccurrence: row.sourceOccurrence,
    catalogOccurrenceOrdinal: row.catalogOccurrenceOrdinal,
    sectionCode: row.sectionCode,
    sectionOrdinal: row.sectionOrdinal,
    sectionPageOrdinal: row.sectionPageOrdinal,
    expectedSwfPath: row.expectedSwfPath,
    assetId: row.assetId,
    swfSha256: row.swfSha256,
    pairedFla: row.pairedFla,
    catalogAnimationId: row.catalogAnimationId,
    candidateState: row.candidate.state,
    registeredState: row.registeredCurrentJs.state,
  }));
}

function sliceProjection(rows) {
  return rows.map((row) => JSON.stringify({
    sourceOccurrence: row.sourceOccurrence,
    placementId: row.placementId,
    animationId: row.catalogAnimationId,
    assetId: row.assetId,
    expectedSwfPath: row.expectedSwfPath,
    swfSha256: row.swfSha256,
    pairedFla: row.pairedFla,
  })).join("\n") + "\n";
}

function familyByPage() {
  const result = new Map();
  for (const family of FAMILY_DEFINITIONS) {
    for (const page of family.pages) {
      invariant(!result.has(page), `source occurrence ${page} appears in more than one family`);
      result.set(page, family);
    }
  }
  return result;
}

function signalSummary(audit) {
  const signals = audit.scripts.signals
    .map(({id, occurrences}) => `${id}=${occurrences}`)
    .join(", ");
  return [
    `nested=${audit.timelines.nestedDefinitions}`,
    `longest=${audit.timelines.longestStaticallyRootReachableDomain.declaredFrameCount}`,
    `buttons=${audit.tags.buttons}`,
    `editText=${audit.tags.editText}`,
    `pcodeBytes=${audit.pcode.bytes}`,
    signals || "signals=none",
  ].join("; ");
}

async function verifySourceCustody({rows, sourceRoot}) {
  const records = [];
  const errors = [];
  let pairedFla = 0;
  let missing = 0;
  let mismatch = 0;
  let writable = 0;

  async function verifyFile({kind, relativePath, expectedSha256}) {
    const absolutePath = path.join(sourceRoot, relativePath);
    let fileStat;
    try {
      fileStat = await stat(absolutePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        missing += 1;
        errors.push(`${kind} missing: ${relativePath}`);
        return null;
      }
      throw error;
    }
    const actualSha256 = await sha256File(absolutePath);
    const isWritable = (fileStat.mode & 0o222) !== 0;
    if (actualSha256 !== expectedSha256) {
      mismatch += 1;
      errors.push(`${kind} SHA-256 mismatch: ${relativePath}`);
    }
    if (isWritable) {
      writable += 1;
      errors.push(`${kind} writable: ${relativePath}`);
    }
    const record = {
      kind,
      path: relativePath,
      bytes: fileStat.size,
      sha256: actualSha256,
      mode: modeString(fileStat.mode),
      writable: isWritable,
    };
    records.push(record);
    return record;
  }

  const xmlRelativePath = rows[0].sourceXml.path;
  const xmlRecord = await verifyFile({
    kind: "source-xml",
    relativePath: xmlRelativePath,
    expectedSha256: EXPECTED.sourceXmlSha256,
  });
  invariant(xmlRecord !== null, "source XML is missing");
  const xml = (await readFile(path.join(sourceRoot, xmlRelativePath), "utf8"))
    .replace(/<!--[\s\S]*?-->/gu, "");
  const pageRoot = xml.match(/<PageRoot>([^<]+)<\/PageRoot>/u)?.[1];
  invariant(pageRoot, "source XML PageRoot is missing");
  const activePages = [...xml.matchAll(/<Page\b[^>]*>([^<]+\.swf)<\/Page>/gu)]
    .map((match) => `${pageRoot}/${match[1].trim()}`);
  invariant(activePages.length === rows.length,
    `source XML active-page count drift: ${activePages.length}`);
  invariant(activePages.every((value, index) =>
    value === rows[index].expectedSwfPath), "source XML active-page order drift");

  for (const row of rows) {
    await verifyFile({
      kind: "swf",
      relativePath: row.expectedSwfPath,
      expectedSha256: row.swfSha256,
    });
    if (row.pairedFla) {
      pairedFla += 1;
      await verifyFile({
        kind: "fla",
        relativePath: row.pairedFla.path,
        expectedSha256: row.pairedFla.sha256,
      });
    }
  }

  invariant(missing === 0, `source custody has ${missing} missing files`);
  invariant(mismatch === 0, `source custody has ${mismatch} hash mismatches`);
  invariant(writable === 0, `source custody has ${writable} writable files`);
  invariant(pairedFla === EXPECTED.pairedFlaCount,
    `paired FLA count drift: ${pairedFla}`);

  return {
    sourceRoot,
    sourceXml: {
      ...xmlRecord,
      activePageCount: activePages.length,
      exactSourceOrderMatch: true,
    },
    swfCount: rows.length,
    pairedFlaCount: pairedFla,
    swfOnlyCount: rows.length - pairedFla,
    missing,
    mismatch,
    writable,
    physicalFiles: records,
  };
}

async function verifyGs002Reuse() {
  const files = [];
  for (const expected of GS002_FILES) {
    const absolutePath = path.join(projectRoot, expected.path);
    const actualSha256 = await sha256File(absolutePath);
    invariant(actualSha256 === expected.sha256,
      `GS002 evidence hash drift: ${expected.path}`);
    const fileStat = await stat(absolutePath);
    files.push({...expected, bytes: fileStat.size, mode: modeString(fileStat.mode)});
  }

  const migrationsRoot = path.join(projectRoot, "migrations");
  const entries = await readdir(migrationsRoot, {withFileTypes: true});
  const manifestPaths = [];
  const matchingManifestPaths = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(migrationsRoot, entry.name, "migration.json");
    let text;
    try {
      text = await readFile(manifestPath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    const relativePath = path.relative(projectRoot, manifestPath);
    manifestPaths.push(relativePath);
    if (
      text.includes("course-g04-l09-gs-002")
      || text.includes("g04-l09-placement-033")
      || text.includes("41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15")
    ) matchingManifestPaths.push(relativePath);
  }
  manifestPaths.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
  matchingManifestPaths.sort((left, right) =>
    Buffer.compare(Buffer.from(left), Buffer.from(right)));
  invariant(manifestPaths.length === 214,
    `migration manifest count drift: ${manifestPaths.length}`);
  invariant(JSON.stringify(matchingManifestPaths) === JSON.stringify([
    "migrations/course-g04-l09-gs-002/migration.json",
  ]), `GS002 workspace uniqueness drift: ${matchingManifestPaths.join(", ")}`);

  const prototypeRegistry = await readFile(
    path.join(projectRoot, "packages/demos/src/registry.generated.ts"),
    "utf8",
  );
  invariant(prototypeRegistry.includes("course-g04-l09-gs-002"),
    "GS002 is absent from the prototype registry");
  invariant(prototypeRegistry.includes(
    "'course-g04-l09-gs-002': Object.freeze({maturity: 'legacy-prototype', scope: 'prototype'})",
  ), "GS002 prototype maturity/scope drift");
  const formalRegistry = await readFile(
    path.join(projectRoot, "apps/web/lib/whole-lesson-course-registry.ts"),
    "utf8",
  );
  invariant(!formalRegistry.includes("course-g04-l09-gs-002"),
    "GS002 unexpectedly appears in the formal registry");

  return {
    placementId: "g04-l09-placement-033",
    animationId: "course-g04-l09-gs-002",
    assetId: "swf-41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15",
    state: "runnable-unregistered-candidate",
    candidateOnly: true,
    prototypeRegistry: {
      maturity: "legacy-prototype",
      scope: "prototype",
      formallyRegistered: false,
      myLessonsAdmitted: false,
    },
    migrationManifestsScanned: manifestPaths.length,
    matchingManifestPaths,
    exactReuseOnly: true,
    duplicateRenameRewriteOrBypassAuthorized: false,
    currentBoundary: {
      rootFrames: 10,
      sprite787Frames: 653,
      sourceDrawingCandidateFrames: "1-641",
      failClosedFrames: "642-653",
      unresolvedBehavior: [
        "Q1-Q10",
        "seeded-random",
        "scoring",
        "correct-wrong-feedback",
        "Final",
        "Repeat-Replay",
        "glossary-course-routing",
        "Spanish-visual-audio-behavior",
      ],
    },
    files,
  };
}

function validateAuditSummary({auditSummary, auditSummaryBytes, rows}) {
  invariant(sha256(auditSummaryBytes) === EXPECTED.auditSummarySha256,
    "Phase A audit-summary SHA-256 drift");
  invariant(auditSummary.schemaVersion === 1, "audit-summary schema drift");
  invariant(auditSummary.taskId === TASK_ID, "audit-summary task ID drift");
  invariant(auditSummary.audits.length === EXPECTED.occurrenceCount,
    "audit-summary occurrence count drift");
  invariant(sha256(stableJson(auditSummary.audits)) === EXPECTED.auditRowsSha256,
    "audit rows fingerprint drift");
  invariant(auditSummary.auditRowsSha256 === EXPECTED.auditRowsSha256,
    "audit-summary embedded row fingerprint drift");
  invariant(auditSummary.counts.occurrences === EXPECTED.occurrenceCount,
    "audit-summary count drift");
  invariant(auditSummary.counts.pairedFla === EXPECTED.pairedFlaCount,
    "audit-summary paired FLA count drift");
  invariant(auditSummary.counts.swfOnly === EXPECTED.swfOnlyCount,
    "audit-summary SWF-only count drift");
  invariant(auditSummary.counts.machineAuditFailures === 0,
    "audit-summary contains machine-audit failures");
  invariant(auditSummary.counts.pcodeExportFailures === 0,
    "audit-summary contains P-code export failures");
  invariant(auditSummary.counts.externalAudioHashMismatches === 0,
    "audit-summary contains external-audio hash mismatches");
  invariant(auditSummary.counts.externalAudioWritable === 0,
    "audit-summary contains writable external audio");

  for (const [index, audit] of auditSummary.audits.entries()) {
    const row = rows[index];
    invariant(audit.sourceOccurrence === index + 1,
      `audit source order drift at index ${index}`);
    invariant(audit.placementId === row.placementId,
      `audit placement drift at source ${index + 1}`);
    invariant(audit.animationId === row.catalogAnimationId,
      `audit animation drift at source ${index + 1}`);
    invariant(audit.assetId === row.assetId,
      `audit asset drift at source ${index + 1}`);
    invariant(audit.source.swfPath === row.expectedSwfPath,
      `audit source path drift at source ${index + 1}`);
    invariant(audit.source.swfSha256 === row.swfSha256,
      `audit source hash drift at source ${index + 1}`);
    invariant(audit.acceptanceEffects
      && Object.values(audit.acceptanceEffects).every((value) => value === false),
    `audit acceptance effect is not fail-closed at source ${index + 1}`);
  }

  const fq42 = auditSummary.audits[41];
  const fq43 = auditSummary.audits[42];
  invariant(fq42.scripts.externalApiCandidates.some(
    ({id, occurrences}) => id === "getURL" && occurrences === 2),
  "FQ occurrence 42 getURL evidence drift");
  invariant(fq43.scripts.externalApiCandidates.some(
    ({id, occurrences}) => id === "getURL" && occurrences === 1),
  "FQ occurrence 43 getURL evidence drift");
}

function validateLedger({ledger, ledgerBytes, dashboardBytes}) {
  invariant(sha256(ledgerBytes) === EXPECTED.ledgerSha256,
    "P1 ledger SHA-256 drift");
  invariant(sha256(dashboardBytes) === EXPECTED.dashboardSha256,
    "P1 dashboard SHA-256 drift");
  invariant(ledger.scope.occurrenceCount === EXPECTED.globalCounts.occurrences,
    "global occurrence denominator drift");
  invariant(ledger.scope.lessonCount === EXPECTED.globalCounts.lessons,
    "global lesson denominator drift");
  invariant(ledger.scope.courseShellCount === 0,
    "legacy Flash course shell re-entered scope");
  invariant(ledger.summary.currentJs.registeredOccurrences
    === EXPECTED.globalCounts.registeredOccurrences,
  "registered occurrence count drift");
  invariant(ledger.summary.currentJs.registeredUniqueRenderers
    === EXPECTED.globalCounts.registeredUniqueRenderers,
  "registered renderer count drift");
  invariant(ledger.summary.currentJs.registeredLessons
    === EXPECTED.globalCounts.registeredLessons,
  "registered lesson count drift");
  invariant(ledger.summary.currentJs.candidateOnlyOccurrences
    === EXPECTED.globalCounts.candidateOnlyOccurrences,
  "candidate-only count drift");
  invariant(Object.entries(ledger.summary.downstreamGates)
    .filter(([key]) => key !== "myLessonsCurrentCode")
    .every(([, value]) => value === 0), "a downstream gate was inferred");
}

export async function buildArtifact({auditSummaryPath, sourceRoot}) {
  invariant(typeof auditSummaryPath === "string" && auditSummaryPath.length > 0,
    "--audit-summary is required");
  invariant(typeof sourceRoot === "string" && sourceRoot.length > 0,
    "--source-root is required");
  const resolvedAuditSummaryPath = path.resolve(auditSummaryPath);
  const resolvedSourceRoot = path.resolve(sourceRoot);

  const [ledgerInput, dashboardBytes, auditInput] = await Promise.all([
    readJsonWithBytes(LEDGER_PATH),
    readFile(DASHBOARD_PATH),
    readJsonWithBytes(resolvedAuditSummaryPath),
  ]);
  const ledger = ledgerInput.value;
  validateLedger({ledger, ledgerBytes: ledgerInput.bytes, dashboardBytes});

  const rows = ledger.rows
    .filter(({grade, lesson}) => grade === 4 && lesson === 9)
    .sort((left, right) => left.sourceOccurrence - right.sourceOccurrence);
  invariant(rows.length === EXPECTED.occurrenceCount,
    `G4 L9 occurrence count drift: ${rows.length}`);
  rows.forEach((row, index) => {
    invariant(row.sourceOccurrence === index + 1,
      `source occurrence drift at ${row.placementId}`);
    invariant(row.catalogOccurrenceOrdinal === 983 + index,
      `catalog occurrence drift at ${row.placementId}`);
    invariant(row.placementId ===
      `g04-l09-placement-${String(index + 1).padStart(3, "0")}`,
    `placement identity drift at source ${index + 1}`);
  });

  const sectionCounts = Object.fromEntries(Object.keys(EXPECTED.sectionCounts)
    .map((sectionCode) => [sectionCode,
      rows.filter((row) => row.sectionCode === sectionCode).length]));
  invariant(JSON.stringify(sectionCounts) === JSON.stringify(EXPECTED.sectionCounts),
    `section counts drift: ${JSON.stringify(sectionCounts)}`);

  const identityHashes = {
    placementIdOrderedNulSha256: sha256Nul(rows.map(({placementId}) => placementId)),
    expectedSwfPathOrderedNulSha256:
      sha256Nul(rows.map(({expectedSwfPath}) => expectedSwfPath)),
    assetIdOrderedNulSha256: sha256Nul(rows.map(({assetId}) => assetId)),
    canonicalRowProjectionSha256:
      sha256(`${JSON.stringify(rowProjection(rows))}\n`),
  };
  invariant(identityHashes.placementIdOrderedNulSha256
    === EXPECTED.placementIdNulSha256, "placement membership hash drift");
  invariant(identityHashes.expectedSwfPathOrderedNulSha256
    === EXPECTED.expectedSwfPathNulSha256, "SWF path membership hash drift");
  invariant(identityHashes.assetIdOrderedNulSha256
    === EXPECTED.assetIdNulSha256, "asset membership hash drift");
  invariant(identityHashes.canonicalRowProjectionSha256
    === EXPECTED.rowProjectionSha256, "canonical row projection hash drift");

  validateAuditSummary({
    auditSummary: auditInput.value,
    auditSummaryBytes: auditInput.bytes,
    rows,
  });
  const sourceCustody = await verifySourceCustody({rows, sourceRoot: resolvedSourceRoot});
  invariant(sourceCustody.sourceXml.sha256 === EXPECTED.sourceXmlSha256,
    "source XML SHA-256 drift");
  invariant(sourceCustody.swfCount === 43
    && sourceCustody.pairedFlaCount === 25
    && sourceCustody.swfOnlyCount === 18,
  "source custody denominator drift");

  const familyMap = familyByPage();
  invariant(familyMap.size === EXPECTED.occurrenceCount,
    `family partition size drift: ${familyMap.size}`);
  const auditBySource = new Map(auditInput.value.audits
    .map((audit) => [audit.sourceOccurrence, audit]));
  const occurrences = rows.map((row) => {
    const family = familyMap.get(row.sourceOccurrence);
    const audit = auditBySource.get(row.sourceOccurrence);
    invariant(family && audit, `missing planning evidence at source ${row.sourceOccurrence}`);
    return {
      sourceOccurrence: row.sourceOccurrence,
      catalogOccurrenceOrdinal: row.catalogOccurrenceOrdinal,
      placementId: row.placementId,
      animationId: row.catalogAnimationId,
      assetId: row.assetId,
      sectionCode: row.sectionCode,
      sectionOrdinal: row.sectionOrdinal,
      sectionPageOrdinal: row.sectionPageOrdinal,
      pageTitle: row.pageTitle,
      sourceXml: row.sourceXml,
      source: audit.source,
      staticAudit: {
        header: audit.header,
        timelines: audit.timelines,
        tags: audit.tags,
        presentationFeatures: audit.presentationFeatures,
        actionScript: audit.actionScript,
        scripts: audit.scripts,
        pcode: audit.pcode,
        audio: audit.audio,
        importsAndLinkage: audit.importsAndLinkage,
        evidenceConfidence: audit.evidenceConfidence,
      },
      planning: {
        familyId: family.familyId,
        familyName: family.name,
        complexity: family.complexity,
        implementationLane: family.lane,
        reason: `${family.evidenceReason} Static profile: ${signalSummary(audit)}`,
        evidence: {
          sourcePath: row.expectedSwfPath,
          sourceSha256: row.swfSha256,
          auditSummarySha256: EXPECTED.auditSummarySha256,
          auditRowsSha256: EXPECTED.auditRowsSha256,
          timelineFingerprintSha256: audit.timelines.fingerprintSha256,
          scriptEvidenceFingerprintSha256:
            audit.scripts.scriptEvidenceFingerprintSha256,
          pcodeManifestSha256: audit.pcode.manifestSha256,
        },
      },
      existingState: {
        candidate: row.candidate,
        registeredCurrentJs: row.registeredCurrentJs,
        myLessons: row.myLessons,
      },
      acceptanceEffects: audit.acceptanceEffects,
    };
  });

  const complexityCounts = Object.fromEntries([
    "low",
    "interactive-understood",
    "behavior-heavy",
  ].map((complexity) => [complexity,
    occurrences.filter(({planning}) => planning.complexity === complexity).length]));
  const laneCounts = Object.fromEntries([
    "factory",
    "advanced-manual",
  ].map((lane) => [lane,
    occurrences.filter(({planning}) => planning.implementationLane === lane).length]));
  invariant(JSON.stringify(complexityCounts) === JSON.stringify({
    low: 2,
    "interactive-understood": 25,
    "behavior-heavy": 16,
  }), `complexity counts drift: ${JSON.stringify(complexityCounts)}`);
  invariant(JSON.stringify(laneCounts) === JSON.stringify({
    factory: 27,
    "advanced-manual": 16,
  }), `lane counts drift: ${JSON.stringify(laneCounts)}`);

  const sliceRows = rows.filter(({sourceOccurrence}) =>
    EXPECTED.sliceSources.includes(sourceOccurrence));
  invariant(sliceRows.length === 14, "representative slice count drift");
  const sliceHashes = {
    placementIdOrderedNulSha256:
      sha256Nul(sliceRows.map(({placementId}) => placementId)),
    assetIdOrderedNulSha256: sha256Nul(sliceRows.map(({assetId}) => assetId)),
    canonicalIdentityProjectionSha256: sha256(sliceProjection(sliceRows)),
  };
  invariant(sliceHashes.placementIdOrderedNulSha256
    === EXPECTED.slicePlacementIdNulSha256, "slice placement hash drift");
  invariant(sliceHashes.assetIdOrderedNulSha256
    === EXPECTED.sliceAssetIdNulSha256, "slice asset hash drift");
  invariant(sliceHashes.canonicalIdentityProjectionSha256
    === EXPECTED.sliceProjectionSha256, "slice projection hash drift");
  const representativeSlice = sliceRows.map((row) => {
    const occurrence = occurrences[row.sourceOccurrence - 1];
    return {
      sourceOccurrence: row.sourceOccurrence,
      placementId: row.placementId,
      animationId: row.catalogAnimationId,
      assetId: row.assetId,
      expectedSwfPath: row.expectedSwfPath,
      swfSha256: row.swfSha256,
      pairedFla: row.pairedFla,
      familyId: occurrence.planning.familyId,
      complexity: occurrence.planning.complexity,
      implementationLane: occurrence.planning.implementationLane,
      selectionReason: SLICE_SELECTION_REASONS[row.sourceOccurrence],
    };
  });
  invariant(new Set(representativeSlice.map(({familyId}) => familyId)).size === 14,
    "representative slice does not cover each family exactly once");

  const reviewedAllowlist = utf8Sorted(REVIEWED_ALLOWLIST);
  const allowlistBytes = nulBuffer(reviewedAllowlist);
  invariant(reviewedAllowlist.length === 4, "reviewed allowlist count drift");
  invariant(allowlistBytes.length === EXPECTED.allowlistNulBytes,
    "reviewed allowlist byte count drift");
  invariant(sha256(allowlistBytes) === EXPECTED.allowlistNulSha256,
    "reviewed allowlist hash drift");

  const existingGs002Candidate = await verifyGs002Reuse();
  const gsLedgerRow = rows[32];
  invariant(gsLedgerRow.candidate.candidateOnly === true
    && gsLedgerRow.candidate.state === "runnable-unregistered-candidate"
    && gsLedgerRow.registeredCurrentJs.satisfied === false
    && gsLedgerRow.myLessons.satisfied === false,
  "GS002 P1 candidate/formal state drift");

  const beforeCounts = {
    global: {
      lessons: ledger.scope.lessonCount,
      occurrences: ledger.scope.occurrenceCount,
      gradeOccurrences: ledger.scope.gradeOccurrences,
      registeredOccurrences: ledger.summary.currentJs.registeredOccurrences,
      registeredUniqueRenderers:
        ledger.summary.currentJs.registeredUniqueRenderers,
      registeredLessons: ledger.summary.currentJs.registeredLessons,
      remainingOccurrences: ledger.summary.currentJs.remainingOccurrences,
      candidateOnlyOccurrences:
        ledger.summary.currentJs.candidateOnlyOccurrences,
    },
    g4l9: {
      occurrences: 43,
      registeredOccurrences: rows.filter(
        ({registeredCurrentJs}) => registeredCurrentJs.satisfied).length,
      candidateOnlyOccurrences: rows.filter(
        ({candidate}) => candidate.candidateOnly).length,
      myLessonsAdmitted: rows.filter(({myLessons}) => myLessons.satisfied).length,
      persistedComplexityUnclassified: rows.filter(
        ({complexity}) => !complexity.classified).length,
      persistedImplementationLaneUnclassified: rows.filter(
        ({implementationLane}) => !implementationLane.classified).length,
    },
  };
  invariant(JSON.stringify(beforeCounts.g4l9) === JSON.stringify({
    occurrences: 43,
    registeredOccurrences: 0,
    candidateOnlyOccurrences: 1,
    myLessonsAdmitted: 0,
    persistedComplexityUnclassified: 43,
    persistedImplementationLaneUnclassified: 43,
  }), `G4 L9 baseline drift: ${JSON.stringify(beforeCounts.g4l9)}`);

  const allFalse = Object.fromEntries(INDEPENDENT_FALSE_GATES
    .map((gate) => [gate, false]));
  const artifact = {
    schemaVersion: 1,
    artifactKind: "help-math-g4-l9-page-only-migration-preflight",
    generator: {
      path: "scripts/build-g4-l9-page-only-migration-preflight.mjs",
      version: "1.0.0",
      runtime: "Node.js built-ins only",
      jsonFormatting: "JSON.stringify(value, null, 2) plus LF",
      ordering: "source order for occurrences; UTF-8 byte order for path sets",
      pathHashing: "full relative path plus NUL",
      generatedOutputs: [OUTPUT_PATHS.json, OUTPUT_PATHS.markdown],
      generatedOutputsMustNotBeHandEdited: true,
    },
    task: {
      taskId: TASK_ID,
      taskTitle: "HELP MATH G4 L9 P3 — Migration Preflight",
      controlThreadId: CONTROL_THREAD_ID,
      predecessorTaskId: PREDECESSOR_TASK_ID,
      phase: "P3-Phase-B-documentation-only",
      independentAllowlistReview: "PASS",
      implementationMigrationOrRegistrationAuthorized: false,
    },
    provenance: {
      exactCheckout: "/Users/peter/.codex/worktrees/9fb2/HELP MATH 2.0",
      branch: TARGET_BRANCH,
      inputHead: INPUT_HEAD,
      inputParent: INPUT_PARENT,
      inputTree: INPUT_TREE,
      p1: {
        checkout: "/Users/peter/.codex/worktrees/dc10/HELP MATH 2.0",
        branch: "codex/help-math-p1-1751-page-only-migration-control-ledger-20260823",
        head: INPUT_HEAD,
        ledgerPath: "catalog/page-only-migration-control-ledger.json",
        ledgerSha256: EXPECTED.ledgerSha256,
        dashboardPath: "reports/page-only-migration-control-dashboard.md",
        dashboardSha256: EXPECTED.dashboardSha256,
        predecessorGateResult: "PASS",
      },
      p0: EXPECTED.p0,
      protectedRoot: EXPECTED.protectedRoot,
      phaseAStaticAudit: {
        explicitInputPath: resolvedAuditSummaryPath,
        auditSummarySha256: EXPECTED.auditSummarySha256,
        auditRowsSha256: EXPECTED.auditRowsSha256,
        scratchReceipt: EXPECTED.phaseAScratch,
        boundary: auditInput.value.boundary,
        embeddedInThisArtifact: true,
        scratchIsImplicitRepositoryDependency: false,
      },
    },
    scope: {
      ownerDecision: "page-only-active-lesson-animation-occurrences",
      pageOnlySchemaVersion: 2,
      courseShellCount: 0,
      legacyFlashCourseShells: "completely-excluded",
      modernMyLessonHost: "retained",
      global: {
        lessons: 29,
        occurrences: 1_751,
        gradeOccurrences: {3: 546, 4: 645, 5: 560},
      },
      lesson: {
        grade: 4,
        lesson: 9,
        title: "Equations",
        occurrences: 43,
        sourceOrder: ["IR", "RW", "VB", "IN", "TI", "GS", "TS", "FQ"],
        sectionCounts,
        placementRange: [rows[0].placementId, rows.at(-1).placementId],
        catalogOccurrenceOrdinals: [
          rows[0].catalogOccurrenceOrdinal,
          rows.at(-1).catalogOccurrenceOrdinal,
        ],
      },
    },
    beforeCounts,
    afterCounts: structuredClone(beforeCounts),
    sourceCustody,
    identityHashes,
    staticAudit: {
      auditSummarySha256: EXPECTED.auditSummarySha256,
      auditRowsSha256: EXPECTED.auditRowsSha256,
      tools: auditInput.value.tools,
      counts: auditInput.value.counts,
      evidenceBoundary: auditInput.value.boundary,
      originalRuntimeEstablished: false,
      audioListeningPerformed: false,
      networkRequestsExecuted: false,
    },
    complexityClassification: {
      state: "P3-proposed-not-written-to-P1-ledger",
      counts: complexityCounts,
      unclassifiedWithBlocker: 0,
    },
    implementationLanes: {
      state: "P3-proposed-not-written-to-P1-ledger",
      counts: laneCounts,
      unresolvedWithBlocker: 0,
      factoryRequiresRepresentativeSliceBeforeScaleOut: true,
      generatedOutputMayBeHandEdited: false,
    },
    sourceFamilies: FAMILY_DEFINITIONS,
    occurrences,
    existingGs002Candidate,
    legacyEndpointPolicy: {
      affectedSourceOccurrences: [42, 43],
      staticCandidate: "getURL",
      observedOccurrences: {42: 2, 43: 1},
      modernAdapterAuthorized: false,
      executionPolicy: "inert-deny-by-default",
      legacyEndpointCalledByThisTask: false,
      unknownNetworkRequestExecutedByThisTask: false,
    },
    p4RepresentativeSlice: {
      state: "recommendation-only-not-created-not-started",
      taskRecommendation: {
        taskId: "HELP-MATH-G4-L9-P4-14-PAGE-REPRESENTATIVE-SLICE-20260823",
        title: "HELP MATH G4 L9 P4 — 14-page Representative Slice + GS002 Advanced Recalibration",
      },
      count: representativeSlice.length,
      sourceOccurrences: EXPECTED.sliceSources,
      hashes: sliceHashes,
      onePagePerFamily: true,
      rows: representativeSlice,
    },
    decision: {
      result: "NO_GO_SCALE_OUT",
      reason: "Sixteen behavior-heavy pages and unresolved GS002/FQ/audio/runtime obligations block lesson-wide bulk generation.",
      boundedAdvancedManualRecalibrationTarget: {
        placementId: "g04-l09-placement-033",
        animationId: "course-g04-l09-gs-002",
        reuseExistingWorkspaceOnly: true,
        startAuthorizedByThisArtifact: false,
      },
      p4Created: false,
      p4Started: false,
    },
    baselineAndAcceptanceGates: {
      currentInventory: {
        globalCandidateOnlyOccurrences: 5,
        g4l9CandidateOnlyOccurrences: 1,
        globalRegisteredOccurrences: 426,
        globalRegisteredUniqueRenderers: 425,
        globalFormalLessons: 8,
        g4l9RegisteredOccurrences: 0,
      },
      effectsOfThisP3DocumentationCommit: allFalse,
      establishedCounts: {
        originalRuntime: 0,
        technicalFidelity: 0,
        audioAccepted: 0,
        humanReview: 0,
        ownerAcceptance: 0,
        strictComplete: 0,
        released: 0,
        productionVerified: 0,
      },
    },
    reviewedChangedPathAllowlist: {
      paths: reviewedAllowlist,
      count: reviewedAllowlist.length,
      nulBytes: allowlistBytes.length,
      nulSha256: sha256(allowlistBytes),
      everyPathNew: true,
      existingPathModificationAuthorized: false,
    },
    authorityNotExercised: [
      "no-fifth-path",
      "no-existing-path-modification",
      "no-page-427",
      "no-renderer-or-candidate-generation",
      "no-prototype-or-formal-registry-change",
      "no-descriptor-or-My-Lesson-change",
      "no-GS002-change-copy-rename-or-bypass",
      "no-source-private-archive-quarantine-change",
      "no-source-promotion",
      "no-P4-task-creation-or-start",
      "no-second-worker-or-subagent",
      "no-original-runtime-or-Ruffle-authority",
      "no-audio-listening-or-human-owner-acceptance",
      "no-strict-release-or-production-state-change",
      "no-push-PR-deploy-release-or-production-verification",
    ],
    nextControllerAction: "Review the bounded four-path P3 commit; do not infer P4 or scale-out authority.",
    nextSingleTask: "none-not-created",
  };

  validateArtifact(artifact);
  return artifact;
}

export function validateArtifact(artifact) {
  invariant(artifact.schemaVersion === 1, "artifact schemaVersion drift");
  invariant(artifact.scope.pageOnlySchemaVersion === 2,
    "page-only schemaVersion drift");
  invariant(artifact.scope.courseShellCount === 0,
    "courseShellCount must remain zero");
  invariant(artifact.scope.lesson.occurrences === 43,
    "G4 L9 occurrence denominator drift");
  invariant(artifact.occurrences.length === 43,
    "occurrence array does not contain 43 rows");
  invariant(new Set(artifact.occurrences.map(({placementId}) => placementId)).size === 43,
    "occurrence placement identities were collapsed");
  invariant(new Set(artifact.occurrences.map(({assetId}) => assetId)).size === 43,
    "G4 L9 assets unexpectedly collapsed");
  invariant(artifact.sourceFamilies.length === 14,
    "source-family count drift");
  const familyPages = artifact.sourceFamilies.flatMap(({pages}) => pages);
  invariant(familyPages.length === 43 && new Set(familyPages).size === 43,
    "source-family partition is incomplete or non-unique");
  invariant(artifact.complexityClassification.counts.low === 2
    && artifact.complexityClassification.counts["interactive-understood"] === 25
    && artifact.complexityClassification.counts["behavior-heavy"] === 16,
  "complexity partition drift");
  invariant(artifact.implementationLanes.counts.factory === 27
    && artifact.implementationLanes.counts["advanced-manual"] === 16,
  "implementation-lane partition drift");
  invariant(artifact.p4RepresentativeSlice.rows.length === 14
    && new Set(artifact.p4RepresentativeSlice.rows
      .map(({familyId}) => familyId)).size === 14,
  "representative slice family coverage drift");
  invariant(artifact.existingGs002Candidate.exactReuseOnly === true
    && artifact.existingGs002Candidate.matchingManifestPaths.length === 1
    && artifact.existingGs002Candidate.duplicateRenameRewriteOrBypassAuthorized === false,
  "GS002 exact-reuse contract drift");
  invariant(artifact.legacyEndpointPolicy.executionPolicy === "inert-deny-by-default"
    && artifact.legacyEndpointPolicy.modernAdapterAuthorized === false
    && artifact.legacyEndpointPolicy.legacyEndpointCalledByThisTask === false,
  "legacy endpoint policy drift");
  invariant(artifact.decision.result === "NO_GO_SCALE_OUT"
    && artifact.decision.p4Created === false
    && artifact.decision.p4Started === false,
  "decision/P4 boundary drift");
  invariant(Object.values(
    artifact.baselineAndAcceptanceGates.effectsOfThisP3DocumentationCommit,
  ).every((value) => value === false),
  "P3 documentation inferred an implementation or acceptance effect");
  invariant(Object.values(
    artifact.baselineAndAcceptanceGates.establishedCounts,
  ).every((value) => value === 0),
  "a downstream acceptance/release count was inferred");
  invariant(JSON.stringify(artifact.beforeCounts) === JSON.stringify(artifact.afterCounts),
    "P3 documentation changed baseline counts");
  invariant(artifact.reviewedChangedPathAllowlist.count === 4
    && artifact.reviewedChangedPathAllowlist.nulBytes === 215
    && artifact.reviewedChangedPathAllowlist.nulSha256
      === EXPECTED.allowlistNulSha256,
  "reviewed changed-path allowlist drift");
  return true;
}

function markdownEscape(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderMarkdown(artifact) {
  validateArtifact(artifact);
  const lines = [
    "<!-- Generated by scripts/build-g4-l9-page-only-migration-preflight.mjs. Do not edit. -->",
    "",
    "# HELP MATH G4 L9 P3 — Migration Preflight",
    "",
    `**Decision:** \`${artifact.decision.result}\``,
    "",
    "This is a page-only P3 documentation receipt. It does not create or start P4, generate a renderer or candidate, register Current-JS, modify My Lesson, or establish runtime, fidelity, audio, human, Owner, strict, release, or production acceptance.",
    "",
    "## Control provenance",
    "",
    `- Task: \`${artifact.task.taskId}\``,
    `- Input HEAD: \`${artifact.provenance.inputHead}\``,
    `- Input tree: \`${artifact.provenance.inputTree}\``,
    `- Branch: \`${artifact.provenance.branch}\``,
    `- P1 ledger SHA-256: \`${artifact.provenance.p1.ledgerSha256}\``,
    `- P1 dashboard SHA-256: \`${artifact.provenance.p1.dashboardSha256}\``,
    `- Phase A audit-summary SHA-256: \`${artifact.staticAudit.auditSummarySha256}\``,
    `- Phase A audit-row SHA-256: \`${artifact.staticAudit.auditRowsSha256}\``,
    "",
    "## Scope and unchanged baseline",
    "",
    `- Page-only schema: \`${artifact.scope.pageOnlySchemaVersion}\``,
    `- Course shell count: \`${artifact.scope.courseShellCount}\``,
    `- Global: \`${artifact.beforeCounts.global.occurrences}\` occurrences / \`${artifact.beforeCounts.global.registeredOccurrences}\` registered / \`${artifact.beforeCounts.global.registeredUniqueRenderers}\` unique renderers / \`${artifact.beforeCounts.global.registeredLessons}\` formal Lessons`,
    `- G4 L9: \`${artifact.beforeCounts.g4l9.occurrences}\` occurrences / \`${artifact.beforeCounts.g4l9.registeredOccurrences}\` registered / \`${artifact.beforeCounts.g4l9.candidateOnlyOccurrences}\` candidate-only`,
    `- Section counts: \`${JSON.stringify(artifact.scope.lesson.sectionCounts)}\``,
    `- Before and after counts are identical: \`${JSON.stringify(artifact.beforeCounts) === JSON.stringify(artifact.afterCounts)}\``,
    "",
    "## Source custody",
    "",
    `- Source XML: \`${artifact.sourceCustody.sourceXml.path}\``,
    `- Source XML SHA-256: \`${artifact.sourceCustody.sourceXml.sha256}\``,
    `- SWF / paired FLA / SWF-only: \`${artifact.sourceCustody.swfCount} / ${artifact.sourceCustody.pairedFlaCount} / ${artifact.sourceCustody.swfOnlyCount}\``,
    `- Missing / mismatch / writable: \`${artifact.sourceCustody.missing} / ${artifact.sourceCustody.mismatch} / ${artifact.sourceCustody.writable}\``,
    `- Placement-ID NUL SHA-256: \`${artifact.identityHashes.placementIdOrderedNulSha256}\``,
    `- SWF-path NUL SHA-256: \`${artifact.identityHashes.expectedSwfPathOrderedNulSha256}\``,
    `- Asset-ID NUL SHA-256: \`${artifact.identityHashes.assetIdOrderedNulSha256}\``,
    `- Canonical row-projection SHA-256: \`${artifact.identityHashes.canonicalRowProjectionSha256}\``,
    "",
    "## 43 source-ordered occurrences",
    "",
    "| # | Placement | Animation / asset | Source | FLA | Family | Complexity | Lane |",
    "|---:|---|---|---|---|---|---|---|",
  ];
  for (const row of artifact.occurrences) {
    lines.push(`| ${row.sourceOccurrence} | \`${row.placementId}\` | \`${row.animationId}\` / \`${row.assetId}\` | \`${row.source.swfPath}\` / \`${row.source.swfSha256}\` | ${row.source.pairedFla ? `\`${row.source.pairedFla.path}\` / \`${row.source.pairedFla.sha256}\`` : "SWF-only"} | ${row.planning.familyId} | ${row.planning.complexity} | ${row.planning.implementationLane} |`);
  }
  lines.push(
    "",
    "## Source families and lanes",
    "",
    `- Complexity: low \`${artifact.complexityClassification.counts.low}\`, interactive-understood \`${artifact.complexityClassification.counts["interactive-understood"]}\`, behavior-heavy \`${artifact.complexityClassification.counts["behavior-heavy"]}\``,
    `- Lanes: factory \`${artifact.implementationLanes.counts.factory}\`, advanced-manual \`${artifact.implementationLanes.counts["advanced-manual"]}\``,
    "",
    "| Family | Pages | Complexity | Lane | Maintained logic |",
    "|---|---|---|---|---|",
  );
  for (const family of artifact.sourceFamilies) {
    lines.push(`| ${family.familyId} \`${markdownEscape(family.name)}\` | ${family.pages.join(", ")} | ${family.complexity} | ${family.lane} | ${markdownEscape(family.maintainedLogic)} |`);
  }
  lines.push(
    "",
    "Factory is not authorized to scale out until the representative slice closes its applicable family contracts. Generated output must not be hand edited.",
    "",
    "## Existing GS002 candidate",
    "",
    `- Placement / animation: \`${artifact.existingGs002Candidate.placementId}\` / \`${artifact.existingGs002Candidate.animationId}\``,
    `- State: \`${artifact.existingGs002Candidate.state}\``,
    `- Migration manifests scanned: \`${artifact.existingGs002Candidate.migrationManifestsScanned}\``,
    `- Exact matching manifest: \`${artifact.existingGs002Candidate.matchingManifestPaths[0]}\``,
    "- Existing workspace reuse is mandatory. Duplicate, rename, rewrite, or bypass is not authorized.",
    "- Frames 642–653, Q1–Q10, random/scoring, feedback, Final/Replay, glossary/course routing, and Spanish visual/audio behavior remain fail closed.",
    "",
    "## Representative slice recommendation",
    "",
    `- State: \`${artifact.p4RepresentativeSlice.state}\``,
    `- Source occurrences: \`${artifact.p4RepresentativeSlice.sourceOccurrences.join(",")}\``,
    `- Placement-ID NUL SHA-256: \`${artifact.p4RepresentativeSlice.hashes.placementIdOrderedNulSha256}\``,
    `- Asset-ID NUL SHA-256: \`${artifact.p4RepresentativeSlice.hashes.assetIdOrderedNulSha256}\``,
    `- Canonical projection SHA-256: \`${artifact.p4RepresentativeSlice.hashes.canonicalIdentityProjectionSha256}\``,
    "",
    "| # | Family | Lane | Selection reason |",
    "|---:|---|---|---|",
  );
  for (const row of artifact.p4RepresentativeSlice.rows) {
    lines.push(`| ${row.sourceOccurrence} | ${row.familyId} | ${row.implementationLane} | ${markdownEscape(row.selectionReason)} |`);
  }
  lines.push(
    "",
    "P4 is recommendation-only and has not been created or started.",
    "",
    "## Legacy endpoint boundary",
    "",
    "FQ occurrences 42 and 43 contain static legacy `getURL` candidates. No modern adapter is authorized; execution remains `inert-deny-by-default`, and this task made no endpoint or unknown-network request.",
    "",
    "## Independent gates",
    "",
  );
  for (const [gate, count] of Object.entries(
    artifact.baselineAndAcceptanceGates.establishedCounts,
  )) lines.push(`- ${gate}: \`${count}\``);
  lines.push(
    "",
    "This P3 documentation commit generated no candidate or renderer and changed no Current-JS, My Lesson, strict, release, or production state.",
    "",
    "## Reviewed changed-path allowlist",
    "",
  );
  for (const allowedPath of artifact.reviewedChangedPathAllowlist.paths) {
    lines.push(`- \`${allowedPath}\``);
  }
  lines.push(
    "",
    `Count \`${artifact.reviewedChangedPathAllowlist.count}\`; NUL bytes \`${artifact.reviewedChangedPathAllowlist.nulBytes}\`; SHA-256 \`${artifact.reviewedChangedPathAllowlist.nulSha256}\`.`,
    "",
    "## Authority not exercised",
    "",
  );
  for (const boundary of artifact.authorityNotExercised) {
    lines.push(`- \`${boundary}\``);
  }
  lines.push(
    "",
    "## Next action",
    "",
    artifact.nextControllerAction,
    "",
  );
  return lines.join("\n");
}

export async function buildArtifacts({auditSummaryPath, sourceRoot}) {
  const artifact = await buildArtifact({auditSummaryPath, sourceRoot});
  const jsonText = stableJson(artifact);
  const markdownText = renderMarkdown(JSON.parse(jsonText));
  return {
    artifact,
    jsonText,
    markdownText,
    hashes: {
      jsonSha256: sha256(jsonText),
      markdownSha256: sha256(markdownText),
    },
  };
}

async function readIfPresent(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function checkArtifacts({
  auditSummaryPath,
  sourceRoot,
  jsonPath = DEFAULT_JSON_PATH,
  markdownPath = DEFAULT_MARKDOWN_PATH,
}) {
  const expected = await buildArtifacts({auditSummaryPath, sourceRoot});
  const [actualJson, actualMarkdown] = await Promise.all([
    readIfPresent(jsonPath),
    readIfPresent(markdownPath),
  ]);
  const jsonCurrent = actualJson === expected.jsonText;
  const markdownCurrent = actualMarkdown === expected.markdownText;
  return {
    ok: jsonCurrent && markdownCurrent,
    jsonCurrent,
    markdownCurrent,
    expected,
  };
}

async function pathExistsOrSymlink(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function writeArtifacts({
  auditSummaryPath,
  sourceRoot,
  jsonPath = DEFAULT_JSON_PATH,
  markdownPath = DEFAULT_MARKDOWN_PATH,
}) {
  invariant(!(await pathExistsOrSymlink(jsonPath)),
    `create-exclusive target already exists: ${jsonPath}`);
  invariant(!(await pathExistsOrSymlink(markdownPath)),
    `create-exclusive target already exists: ${markdownPath}`);
  const artifacts = await buildArtifacts({auditSummaryPath, sourceRoot});
  let jsonHandle;
  let markdownHandle;
  let jsonCreated = false;
  let markdownCreated = false;
  try {
    jsonHandle = await open(jsonPath, "wx", 0o644);
    jsonCreated = true;
    markdownHandle = await open(markdownPath, "wx", 0o644);
    markdownCreated = true;
    await jsonHandle.writeFile(artifacts.jsonText, "utf8");
    await markdownHandle.writeFile(artifacts.markdownText, "utf8");
    await jsonHandle.sync();
    await markdownHandle.sync();
  } catch (error) {
    await Promise.allSettled([jsonHandle?.close(), markdownHandle?.close()]);
    if (jsonCreated) await unlink(jsonPath).catch(() => {});
    if (markdownCreated) await unlink(markdownPath).catch(() => {});
    throw error;
  }
  await Promise.all([jsonHandle.close(), markdownHandle.close()]);
  return artifacts;
}

export function parseArguments(argv) {
  const options = {
    mode: null,
    auditSummaryPath: null,
    sourceRoot: null,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--write" || argument === "--check") {
      invariant(options.mode === null,
        "exactly one of --write or --check may be supplied");
      options.mode = argument.slice(2);
    } else if (argument === "--audit-summary") {
      invariant(index + 1 < argv.length, "--audit-summary requires a path");
      options.auditSummaryPath = argv[++index];
    } else if (argument === "--source-root") {
      invariant(index + 1 < argv.length, "--source-root requires a path");
      options.sourceRoot = argv[++index];
    } else if (argument === "--json") {
      options.json = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(options.mode === "write" || options.mode === "check",
      "exactly one of --write or --check is required");
    invariant(options.auditSummaryPath, "--audit-summary is required");
    invariant(options.sourceRoot, "--source-root is required");
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g4-l9-page-only-migration-preflight.mjs --write \\
    --audit-summary <explicit-audit-summary.json> --source-root <read-only-source-root>
  node scripts/build-g4-l9-page-only-migration-preflight.mjs --check \\
    --audit-summary <explicit-audit-summary.json> --source-root <read-only-source-root>

--write creates the two generated outputs exclusively and refuses existing
targets. --check is byte-for-byte read-only. The transient Phase A scratch is
never discovered implicitly; both evidence inputs must be supplied explicitly.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.mode === "write") {
    const result = await writeArtifacts(options);
    const receipt = {
      status: "PASS",
      mode: "write-create-exclusive",
      decision: result.artifact.decision.result,
      occurrences: result.artifact.occurrences.length,
      families: result.artifact.sourceFamilies.length,
      representativeSlice: result.artifact.p4RepresentativeSlice.count,
      paths: [OUTPUT_PATHS.json, OUTPUT_PATHS.markdown],
      hashes: result.hashes,
    };
    process.stdout.write(options.json
      ? `${JSON.stringify(receipt, null, 2)}\n`
      : `PASS: created P3 JSON/Markdown exclusively; decision=${receipt.decision}; occurrences=${receipt.occurrences}; families=${receipt.families}; slice=${receipt.representativeSlice}\n`);
    return;
  }
  const result = await checkArtifacts(options);
  const receipt = {
    status: result.ok ? "PASS" : "FAIL",
    mode: "check-read-only",
    jsonCurrent: result.jsonCurrent,
    markdownCurrent: result.markdownCurrent,
    hashes: result.expected.hashes,
  };
  process.stdout.write(options.json
    ? `${JSON.stringify(receipt, null, 2)}\n`
    : `${receipt.status}: P3 JSON=${receipt.jsonCurrent ? "current" : "stale"}; Markdown=${receipt.markdownCurrent ? "current" : "stale"}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (path.resolve(process.argv[1] ?? "") === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
