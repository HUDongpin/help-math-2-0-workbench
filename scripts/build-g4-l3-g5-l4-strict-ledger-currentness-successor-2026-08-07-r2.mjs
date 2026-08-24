#!/usr/bin/env node

import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {chmod, lstat, open, readFile, stat, unlink} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR =
  "scripts/build-g4-l3-g5-l4-strict-ledger-currentness-successor-2026-08-07-r2.mjs";
const COMPLETION_LEDGER = "catalog/completion-ledger.json";
const LESSON_LEDGER = "catalog/lesson-release-ledger.json";
const JSON_OUTPUT =
  "reports/g4-l3-g5-l4-strict-ledger-currentness-successor-2026-08-07-r2.json";
const MARKDOWN_OUTPUT =
  "reports/g4-l3-g5-l4-strict-ledger-currentness-successor-2026-08-07-r2.md";
const HEAD = "42e7f80ce70aaa3819af2f7158e15f5da5470cce";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function absolute(relativePath) {
  invariant(!path.isAbsolute(relativePath), `${relativePath}: absolute path rejected`);
  const resolved = path.resolve(ROOT, relativePath);
  invariant(
    resolved.startsWith(`${ROOT}${path.sep}`),
    `${relativePath}: path escapes project root`,
  );
  return resolved;
}

async function bind(relativePath, parseJson = false) {
  const resolved = absolute(relativePath);
  const before = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(
    before.isFile() && !before.isSymbolicLink(),
    `${relativePath}: ordinary non-symbolic-link file required`,
  );
  invariant(physical.nlink === 1, `${relativePath}: hard link rejected`);
  const bytes = await readFile(resolved);
  const after = await lstat(resolved);
  invariant(
    before.dev === after.dev && before.ino === after.ino && before.size === after.size,
    `${relativePath}: file changed while read`,
  );
  return {
    descriptor: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
    bytes,
    value: parseJson ? JSON.parse(bytes.toString("utf8")) : null,
  };
}

function bindHeadJson(relativePath) {
  const observedHead = execFileSync("/usr/bin/git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
  invariant(observedHead === HEAD, "repository HEAD changed; a new successor is required");
  const bytes = execFileSync(
    "/usr/bin/git",
    ["show", `${HEAD}:${relativePath}`],
    {cwd: ROOT, encoding: null, maxBuffer: 4 * 1024 * 1024},
  );
  return {
    descriptor: {
      path: relativePath,
      head: HEAD,
      bytes: bytes.length,
      sha256: sha256(bytes),
    },
    value: JSON.parse(bytes.toString("utf8")),
  };
}

function diagnostic(ledger, workspace) {
  return ledger.diagnostics.find((row) => row.workspace === workspace);
}

export async function buildStrictLedgerCurrentnessSuccessor() {
  const [
    generator,
    completion,
    lesson,
    strictGapR1,
    captureR1,
    epochClosure,
  ] = await Promise.all([
    bind(GENERATOR),
    bind(COMPLETION_LEDGER, true),
    bind(LESSON_LEDGER, true),
    bind("reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.json", true),
    bind("reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.json", true),
    bind("reports/development-epoch-closure-2026-08-07-r1.json", true),
  ]);
  const completionBefore = bindHeadJson(COMPLETION_LEDGER);
  const lessonBefore = bindHeadJson(LESSON_LEDGER);

  invariant(
    completion.value.summary?.migrationDirectories === 215 &&
      completion.value.summary?.strictComplete === 0 &&
      completion.value.summary?.strictFailed === 215 &&
      completion.value.entries?.length === 0,
    "completion ledger strict-zero boundary changed",
  );
  const beforeTs006 = diagnostic(
    completionBefore.value,
    "migrations/course-g04-l03-ts-006",
  );
  const currentTs006 = diagnostic(
    completion.value,
    "migrations/course-g04-l03-ts-006",
  );
  invariant(
    beforeTs006?.errorCount === 47 &&
      currentTs006?.errorCount === 45 &&
      canonicalJson(beforeTs006.errors) === canonicalJson(currentTs006.errors) &&
      beforeTs006.manifestSha256 === currentTs006.manifestSha256,
    "TS006 completion-ledger diagnostic transition changed",
  );
  const expectedCompletion = structuredClone(completionBefore.value);
  expectedCompletion.generatedMarker = completion.value.generatedMarker;
  diagnostic(
    expectedCompletion,
    "migrations/course-g04-l03-ts-006",
  ).errorCount = 45;
  invariant(
    canonicalJson(expectedCompletion) === canonicalJson(completion.value),
    "completion ledger changed beyond marker and TS006 errorCount 47 to 45",
  );

  invariant(
    lesson.value.summary?.releaseCount === 4 &&
      lesson.value.summary?.publishedReleaseCount === 0 &&
      lesson.value.releases?.every((entry) => entry.published === false),
    "lesson-release ledger zero-publication boundary changed",
  );
  const expectedLesson = structuredClone(lessonBefore.value);
  expectedLesson.generatedMarker = lesson.value.generatedMarker;
  expectedLesson.sources.completionLedger.sha256 = completion.descriptor.sha256;
  expectedLesson.sources.completionLedger.generatedMarker =
    completion.value.generatedMarker;
  invariant(
    canonicalJson(expectedLesson) === canonicalJson(lesson.value),
    "lesson-release ledger changed beyond completion-ledger rebinding and marker",
  );
  invariant(
    strictGapR1.value.status ===
      "current-by-successor-validation-original-runtime-human-owner-strict-and-publication-closed" &&
      captureR1.value.status ===
      "current-javascript-captures-current-unadopted-shell-blocked-all-strict-gates-closed" &&
      epochClosure.value.status ===
      "attributed-retained-test-remediation-bound-acceptance-neutral",
    "predecessor successor boundary changed",
  );

  return {
    schemaVersion: 1,
    reportType: "g4-l3-g5-l4-strict-ledger-currentness-successor",
    issuedOn: "2026-08-07",
    revision: "r2",
    status:
      "ledgers-current-ts006-two-diagnostics-closed-strict-zero-publication-zero",
    generator: generator.descriptor,
    predecessorHead: HEAD,
    predecessorLedgers: {
      completion: completionBefore.descriptor,
      lessonRelease: lessonBefore.descriptor,
    },
    currentLedgers: {
      completion: {
        ...completion.descriptor,
        generatedMarker: completion.value.generatedMarker,
        migrationDirectories: 215,
        strictComplete: 0,
        strictFailed: 215,
      },
      lessonRelease: {
        ...lesson.descriptor,
        generatedMarker: lesson.value.generatedMarker,
        lessonReleaseCount: 4,
        publishedLessonReleaseCount: 0,
      },
    },
    exactTransition: {
      completionLedger: {
        changedSemanticFieldCount: 1,
        changedField: "diagnostics[course-g04-l03-ts-006].errorCount",
        predecessor: 47,
        successor: 45,
        generatedMarkerRecomputed: true,
        strictEntryAdded: false,
        strictEntryRemoved: false,
      },
      lessonReleaseLedger: {
        changedSemanticFieldCount: 0,
        completionLedgerSha256Rebound: true,
        completionLedgerGeneratedMarkerRebound: true,
        generatedMarkerRecomputed: true,
        releaseEntryChanged: false,
      },
    },
    predecessorSuccessors: {
      strictGapR1: strictGapR1.descriptor,
      currentJavascriptCaptureR1: captureR1.descriptor,
      developmentEpochClosureR1: epochClosure.descriptor,
      rewritten: false,
    },
    authority: {
      currentLedgerEvidence: true,
      currentJavascriptCaptureEvidence: true,
      authoritativeOriginalRuntime: false,
      fullFrameRmseAccepted: false,
      audioAccepted: false,
      interactionAccepted: false,
      replayAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      releaseAuthorized: false,
      published: false,
    },
  };
}

function renderMarkdown(report) {
  return `# G4 L3 and G5 L4 strict-ledger currentness successor r2\n\n` +
    `Status: **${report.status}**.\n\n` +
    `The deterministic completion ledger now records TS006 with 45 validation errors instead of 47 because the asset-inventory manifest binding was made current. No strict entry was added or removed: strict completion remains **0/215**.\n\n` +
    `The lesson-release ledger was rebound only to the new completion-ledger SHA-256 and generated marker. Its four release entries did not change, and publication remains **0/4**.\n\n` +
    `The r1 strict-gap, current-JavaScript capture, and development-epoch successor records remain immutable predecessors. No original-runtime, RMSE, audio, interaction, Replay, human, Owner, strict-completion, release, or publication gate changes.\n`;
}

async function readIfPresent(relativePath) {
  try {
    return await readFile(absolute(relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function parseMode(argv) {
  const allowed = new Set(["--json", "--check", "--write-no-clobber"]);
  invariant(
    argv.length === 1 && allowed.has(argv[0]),
    "choose exactly one explicit mode",
  );
  return argv[0].slice(2);
}

async function writeExclusive(relativePath, bytes) {
  const candidate = absolute(relativePath);
  const handle = await open(candidate, "wx", 0o444);
  let complete = false;
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    complete = true;
  } finally {
    await handle.close();
    if (!complete) await unlink(candidate).catch(() => {});
  }
  await chmod(candidate, 0o444);
}

async function emit(mode, report) {
  const jsonBytes = Buffer.from(stableJson(report));
  const markdownBytes = Buffer.from(renderMarkdown(report));
  if (mode === "json") {
    process.stdout.write(jsonBytes);
    return;
  }
  if (mode === "check") {
    const [actualJson, actualMarkdown] = await Promise.all([
      readIfPresent(JSON_OUTPUT),
      readIfPresent(MARKDOWN_OUTPUT),
    ]);
    invariant(actualJson?.equals(jsonBytes), `${JSON_OUTPUT} is stale or missing`);
    invariant(
      actualMarkdown?.equals(markdownBytes),
      `${MARKDOWN_OUTPUT} is stale or missing`,
    );
    process.stdout.write("G4/G5 strict-ledger currentness successor r2: PASS\n");
    return;
  }
  invariant(mode === "write-no-clobber", `unsupported mode: ${mode}`);
  invariant(!(await readIfPresent(JSON_OUTPUT)), `${JSON_OUTPUT} already exists`);
  invariant(
    !(await readIfPresent(MARKDOWN_OUTPUT)),
    `${MARKDOWN_OUTPUT} already exists`,
  );
  let jsonWritten = false;
  try {
    await writeExclusive(JSON_OUTPUT, jsonBytes);
    jsonWritten = true;
    await writeExclusive(MARKDOWN_OUTPUT, markdownBytes);
  } catch (error) {
    if (jsonWritten) await unlink(absolute(JSON_OUTPUT)).catch(() => {});
    throw error;
  }
  process.stdout.write(`wrote ${JSON_OUTPUT} and ${MARKDOWN_OUTPUT}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildStrictLedgerCurrentnessSuccessor()
    .then((report) => emit(parseMode(process.argv.slice(2)), report))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
