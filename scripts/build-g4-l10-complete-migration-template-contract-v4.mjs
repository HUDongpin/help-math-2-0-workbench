#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PROJECT_ROOT } from "./build-g4-l10-complete-migration-template-contract-v2.mjs";
import {
  deriveContract as deriveV3Contract,
  readSnapshot as readV3Snapshot,
} from "./build-g4-l10-complete-migration-template-contract-v3.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v4-2026-08-04.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v4-2026-08-04.md";

const REJECTED_V3_INPUTS = Object.freeze({
  rejectedV3Generator: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v3.mjs",
    kind: "text",
    sha256: "00a5d40925220897506b341e8aa08354c7bcac3135807ac32f03a61a6f1794e2",
  },
  rejectedV3Tests: {
    path: "scripts/build-g4-l10-complete-migration-template-contract-v3.test.mjs",
    kind: "text",
    sha256: "d87e4808cea907bf14f057af02324b76f140033d0e39717eeb7ae149a02b4052",
  },
  rejectedV3Json: {
    path: "reports/g4-l10-complete-migration-template-contract-v3-2026-08-04.json",
    kind: "json",
    sha256: "c18ba22b2e78eaf989bca4e4394ecac6be7aa02c0e6f0df99a9698683a83c555",
  },
  rejectedV3Markdown: {
    path: "reports/g4-l10-complete-migration-template-contract-v3-2026-08-04.md",
    kind: "text",
    sha256: "77471bf4d0952b541cebbc85dee11944e938cb38f3bdcf7398530ae5c75c194c",
  },
});

const FULL_LOCAL_CODE_CLOSURE = Object.freeze({
  recordCount: 53,
  totalBytes: 180303,
  setSha256: "a5105dbfc86efd9111975395cfc2f7c3d6cbda7d2ae072e30dbafb23bbebf893",
});

const RUNTIME_ASSET_CLOSURE = Object.freeze({
  recordCount: 24,
  totalBytes: 45089726,
  setSha256: "b736fa0a4434788032dc7fdea4251cd802560ec2c6b9aa29a75ff41f2ed825a8",
});

const EFFECT_KEYS = Object.freeze([
  "sourcePromotion",
  "authoritativeOriginalRuntimeEvidence",
  "ruffleBaselineAuthority",
  "currentJavascriptBaselineAuthority",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "wholeLessonIntegration",
  "atomicLessonPublication",
  "wholeCourseIntegration",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function reportFingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  return sha256(canonicalJson(projection));
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false, `Absolute path is forbidden: ${relativePath}`);
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`), `Path escapes project root: ${relativePath}`);
  return absolute;
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

async function readStable(projectRoot, key, specification) {
  const absolute = resolveInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, { bigint: true });
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${specification.path} must be an ordinary non-symlink file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, { bigint: true });
  assert.equal(statIdentity(after), statIdentity(before), `${specification.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size, `${specification.path} size drifted while read`);
  const digest = sha256(bytes);
  if (specification.sha256) {
    assert.equal(digest, specification.sha256, `${specification.path} fixed SHA-256 epoch drifted`);
  }
  const record = {
    key,
    path: specification.path,
    kind: specification.kind,
    bytes: bytes.length,
    sha256: digest,
    mode: Number(before.mode & 0o777n).toString(8).padStart(4, "0"),
    statIdentity: statIdentity(before),
  };
  if (specification.kind !== "binary") record.text = bytes.toString("utf8");
  if (specification.kind === "json") record.document = JSON.parse(record.text);
  return record;
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function utf8Compare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function descriptorClosure(records) {
  const sorted = [...records].sort((left, right) => utf8Compare(left.path, right.path));
  assert.equal(new Set(sorted.map(({ path: value }) => value)).size, sorted.length,
    "Closure contains duplicate paths");
  const encoded = sorted.map((record) => `${record.path}\0${record.sha256}\n`).join("");
  return {
    recordCount: sorted.length,
    totalBytes: sorted.reduce((sum, record) => sum + record.bytes, 0),
    setSha256: sha256(encoded),
    algorithm:
      "UTF-8 path-byte sort; concatenate relative path, NUL, lowercase file SHA-256, LF",
    records: sorted.map(binding),
  };
}

function localImportSpecifiers(source) {
  return [...source.matchAll(
    /(?:import|export)\s+(?:type\s+)?(?:[^"'`;]+?\s+from\s+)?["']([^"']+)["']/gsu,
  )].map((match) => match[1]).filter((specifier) => specifier.startsWith("."));
}

async function existingOrdinaryFile(projectRoot, relativePath) {
  try {
    const info = await lstat(resolveInsideRoot(projectRoot, relativePath), { bigint: true });
    return info.isFile() && !info.isSymbolicLink();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function resolveLocalImport(projectRoot, importerPath, specifier) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(importerPath), specifier));
  const hasRecognizedExtension = /\.(?:[cm]?[jt]sx?|json)$/u.test(base);
  const candidates = hasRecognizedExtension ? [base] : [
    `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.json`,
    `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`, `${base}/index.mjs`,
  ];
  const matches = [];
  for (const candidate of candidates) {
    if (await existingOrdinaryFile(projectRoot, candidate)) matches.push(candidate);
  }
  assert.equal(matches.length, 1,
    `${importerPath} import ${specifier} resolved to ${JSON.stringify(matches)}`);
  return matches[0];
}

function timelineRuntimeAsset(text, timelinePath) {
  const source = text.match(/\bassetSource:\s*"([^"]+)"/u)?.[1];
  const digest = text.match(/\bassetSha256:\s*"([a-f0-9]{64})"/u)?.[1];
  assert.ok(source?.startsWith("/flash-assets/") && !source.includes(".."),
    `${timelinePath} lacks one safe local assetSource`);
  assert.ok(digest, `${timelinePath} lacks one assetSha256`);
  return {
    source,
    path: `public${source}`,
    sha256: digest,
  };
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const base = await readV3Snapshot(projectRoot);
  const records = { ...base.records };
  const fixed = await Promise.all(Object.entries(REJECTED_V3_INPUTS)
    .map(([key, specification]) => readStable(projectRoot, key, specification)));
  for (const record of fixed) records[record.key] = record;

  const pathToKey = new Map(Object.entries(records).map(([key, record]) => [record.path, key]));
  const initialKeys = [...base.candidateModuleKeys, ...base.candidateTimelineKeys];
  const queue = initialKeys.map((key) => records[key].path);
  const fullCodePaths = new Set();

  while (queue.length > 0) {
    const relativePath = queue.shift();
    if (fullCodePaths.has(relativePath)) continue;
    fullCodePaths.add(relativePath);
    let key = pathToKey.get(relativePath);
    if (!key) {
      key = `candidate:transitive:${relativePath}`;
      const record = await readStable(projectRoot, key, { path: relativePath, kind: "text" });
      records[key] = record;
      pathToKey.set(relativePath, key);
    }
    const record = records[key];
    assert.equal(typeof record.text, "string", `${relativePath} must be textual candidate code`);
    for (const specifier of localImportSpecifiers(record.text)) {
      queue.push(await resolveLocalImport(projectRoot, relativePath, specifier));
    }
  }

  const assetSpecifications = base.candidateTimelineKeys.map((key) => {
    const timeline = records[key];
    return timelineRuntimeAsset(timeline.text, timeline.path);
  });
  assert.equal(new Set(assetSpecifications.map(({ path: value }) => value)).size, 24,
    "Candidate runtime asset paths must be unique");
  const assetRecords = await Promise.all(assetSpecifications.map((specification, index) =>
    readStable(projectRoot, `candidate:runtime-asset:${String(index + 1).padStart(2, "0")}`, {
      path: specification.path,
      kind: "binary",
      sha256: specification.sha256,
    }),
  ));
  for (const record of assetRecords) records[record.key] = record;

  return {
    ...base,
    projectRoot: path.resolve(projectRoot),
    records,
    candidateFullCodeKeys: [...fullCodePaths]
      .sort(utf8Compare).map((relativePath) => pathToKey.get(relativePath)),
    candidateRuntimeAssetKeys: assetRecords.map(({ key }) => key),
  };
}

export async function assertSnapshotUnchanged(snapshot) {
  for (const record of Object.values(snapshot.records)) {
    const reread = await readStable(snapshot.projectRoot, record.key, {
      path: record.path,
      kind: record.kind,
    });
    assert.equal(reread.statIdentity, record.statIdentity, `${record.path} stat identity drifted`);
    assert.equal(reread.sha256, record.sha256, `${record.path} SHA-256 drifted`);
  }
}

export function deriveContract(snapshot) {
  const rejected = deriveV3Contract(snapshot);
  const fullLocalCodeClosure = descriptorClosure(
    snapshot.candidateFullCodeKeys.map((key) => snapshot.records[key]),
  );
  const runtimeAssetClosure = descriptorClosure(
    snapshot.candidateRuntimeAssetKeys.map((key) => snapshot.records[key]),
  );
  assert.deepEqual({
    recordCount: fullLocalCodeClosure.recordCount,
    totalBytes: fullLocalCodeClosure.totalBytes,
    setSha256: fullLocalCodeClosure.setSha256,
  }, FULL_LOCAL_CODE_CLOSURE, "Full local candidate code closure drifted");
  assert.deepEqual({
    recordCount: runtimeAssetClosure.recordCount,
    totalBytes: runtimeAssetClosure.totalBytes,
    setSha256: runtimeAssetClosure.setSha256,
  }, RUNTIME_ASSET_CLOSURE, "Candidate runtime asset closure drifted");

  const addedLocalDependencies = fullLocalCodeClosure.records.filter(({ path: value }) =>
    !rejected.liveWholeLessonClosure.candidateCode.moduleClosure.records.some(({ path: item }) =>
      item === value) &&
    !rejected.liveWholeLessonClosure.candidateCode.timelineClosure.records.some(({ path: item }) =>
      item === value));
  assert.deepEqual(addedLocalDependencies.map(({ path: value }) => value), [
    "packages/demos/src/contract.ts",
    "packages/demos/src/g4-l3-main-timeline-audio.generated.ts",
    "packages/demos/src/lesson-host-contract.ts",
    "packages/demos/src/source-static-candidate-authority.ts",
    "packages/demos/src/source-static-canvas-candidate.tsx",
  ]);

  const authority = snapshot.records[
    snapshot.candidateFullCodeKeys.find((key) =>
      snapshot.records[key].path === "packages/demos/src/source-static-candidate-authority.ts")
  ].text;
  for (const assertion of [
    "implementationAuthorized: false",
    "productRouteMayBeAdded: false",
    "embeddedAudioRendered: false",
    "associatedAudioRendered: false",
    "spanishVisualRuntimeEstablished: false",
    "humanVisualReviewAccepted: false",
    "strictMigrationComplete: false",
    'strictAcceptanceEffect: "none"',
  ]) assert.ok(authority.includes(assertion), `Candidate authority lost ${assertion}`);

  const report = structuredClone(rejected);
  report.schemaVersion = 4;
  report.status = "fail-closed-template-not-stable";
  report.templateStable = false;
  report.successorOf = binding(snapshot.records.rejectedV3Json);
  report.predecessorDisposition = {
    v3: {
      status: "rejected-p1-transitive-candidate-code-closure-incomplete",
      preserved: true,
      independentReview: { p0: 0, p1: 1, p2: 0 },
      finding:
        "V3 bound 24 direct modules and 24 direct timelines but omitted their shared runtime, authority, contract, generated-audio, and lesson-host dependencies; its currentness check could miss semantic drift.",
      artifacts: {
        generator: binding(snapshot.records.rejectedV3Generator),
        tests: binding(snapshot.records.rejectedV3Tests),
        json: binding(snapshot.records.rejectedV3Json),
        markdown: binding(snapshot.records.rejectedV3Markdown),
      },
      acceptanceEffect: "none",
    },
    ...rejected.predecessorDisposition,
  };
  report.evidenceEpochClosure.rule =
    "Writer attribution and the historical A/B observation establish provenance only. Current v4 --check binds the exact 269 member inputs, complete recursive local candidate-code closure, 24 digest-declared runtime assets, registries, and gate reports; none creates migration or acceptance evidence.";
  report.liveWholeLessonClosure.status = "current-and-transitively-bound";
  report.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure = fullLocalCodeClosure;
  report.liveWholeLessonClosure.candidateCode.newlyBoundTransitiveDependencies = {
    recordCount: addedLocalDependencies.length,
    records: addedLocalDependencies,
  };
  report.liveWholeLessonClosure.candidateCode.runtimeAssetClosure = runtimeAssetClosure;
  report.liveWholeLessonClosure.candidateCode.assetDigestMismatchCount = 0;
  report.liveWholeLessonClosure.candidateCode.recursiveLocalImportResolution = "complete";
  report.liveWholeLessonClosure.candidateCode.semanticRuntimeBoundary = {
    authorityBound: true,
    canvasRuntimeBound: true,
    contractBound: true,
    lessonHostContractBound: true,
    generatedAudioLookupBound: true,
    formalRegistrationEffect: "none",
    acceptanceEffect: "none",
  };
  report.currentFormalState.javascript.transitiveLocalCodeFiles =
    fullLocalCodeClosure.recordCount;
  report.currentFormalState.javascript.digestDeclaredRuntimeAssets =
    runtimeAssetClosure.recordCount;
  report.currentFormalState.javascript.runtimeAssetDigestMismatches = 0;
  report.currentFormalState.javascript.diagnosticFormalEffect = 0;
  report.acceptanceEffects = Object.fromEntries(EFFECT_KEYS.map((key) => [key, false]));
  report.inputBindings = Object.fromEntries(Object.keys(snapshot.records).sort()
    .map((key) => [key, binding(snapshot.records[key])]));
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 4);
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.predecessorDisposition.v3.status,
    "rejected-p1-transitive-candidate-code-closure-incomplete");
  assert.equal(report.predecessorDisposition.v3.preserved, true);
  assert.deepEqual({
    recordCount: report.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.recordCount,
    totalBytes: report.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.totalBytes,
    setSha256: report.liveWholeLessonClosure.candidateCode.fullLocalCodeClosure.setSha256,
  }, FULL_LOCAL_CODE_CLOSURE);
  assert.deepEqual({
    recordCount: report.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.recordCount,
    totalBytes: report.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.totalBytes,
    setSha256: report.liveWholeLessonClosure.candidateCode.runtimeAssetClosure.setSha256,
  }, RUNTIME_ASSET_CLOSURE);
  assert.equal(report.liveWholeLessonClosure.candidateCode.newlyBoundTransitiveDependencies.recordCount, 5);
  assert.equal(report.liveWholeLessonClosure.candidateCode.assetDigestMismatchCount, 0);
  assert.equal(report.liveWholeLessonClosure.candidateCode.recursiveLocalImportResolution, "complete");
  assert.equal(Object.keys(report.inputBindings).length, 375);
  assert.equal(report.liveWholeLessonClosure.memberLevel.recordCount, 269);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured, 0);
  assert.equal(report.currentFormalState.reviewAndRelease.checklistChecked, 0);
  assert.equal(report.currentFormalState.reviewAndRelease.strictCompleteMembers, 0);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.gates.filter(({ satisfied }) => satisfied).length, 1);
  assert.ok(report.gates.every(({ acceptanceEffect }) => acceptanceEffect === "none"));
  assert.deepEqual(Object.keys(report.acceptanceEffects), EFFECT_KEYS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return true;
}

export function renderMarkdown(report) {
  const candidate = report.liveWholeLessonClosure.candidateCode;
  const rows = report.gates.map((item) =>
    `| ${item.id} | ${item.status} | ${item.satisfied ? "yes" : "no"} | ${item.blocker} |`,
  ).join("\n");
  const bindings = Object.values(report.inputBindings).map((item) =>
    `| \`${item.path}\` | ${item.bytes} | \`${item.sha256}\` | \`${item.mode}\` |`,
  ).join("\n");
  const dependencyRows = candidate.newlyBoundTransitiveDependencies.records.map((item) =>
    `| \`${item.path}\` | ${item.bytes} | \`${item.sha256}\` |`,
  ).join("\n");

  return `# Grade 4 Lesson 10 complete-migration template contract v4

Evidence date: **${report.evidenceDate}**  
Status: **${report.status}**  
Template stable: **${report.templateStable}**  
Fingerprint: \`${report.reportFingerprintSha256}\`

## Outcome

V4 preserves v3 as a rejected attempt after independent review found one P1: v3's 24-module and 24-timeline direct closure omitted shared runtime and authority dependencies. V4 recursively resolves every local import from those 48 entry files and binds the resulting **${candidate.fullLocalCodeClosure.recordCount}-file** code closure (SHA-256 \`${candidate.fullLocalCodeClosure.setSha256}\`). It separately binds all **${candidate.runtimeAssetClosure.recordCount}** timeline-declared runtime assets and verifies every asset against its declared digest (closure SHA-256 \`${candidate.runtimeAssetClosure.setSha256}\`; mismatches 0).

This correction establishes currentness only. L10 still has **0/44,488 authoritative original-runtime frames**, **0/520 RMSE results**, **0/47 formal renderer fields complete**, **0/2,726 checklist items checked**, **0/47 human/engineering/owner approvals**, and **0/47 strict-complete members**. The downstream transaction retains three P0 classes and decision **DO_NOT_APPLY**. Template stability, batch admission, whole-course integration, and publication remain false.

## Newly bound transitive dependencies

| Path | Bytes | SHA-256 |
|---|---:|---|
${dependencyRows}

These files control candidate authority, runtime behavior, capture identity, audio lookup, language/control behavior, and host capability types. Any byte drift now changes the v4 closure and makes \`--check\` fail.

## Exact closure summary

- Member evidence/source closure: ${report.liveWholeLessonClosure.memberLevel.recordCount} files; SHA-256 \`${report.liveWholeLessonClosure.memberLevel.setSha256}\`.
- Recursive local candidate-code closure: ${candidate.fullLocalCodeClosure.recordCount} files / ${candidate.fullLocalCodeClosure.totalBytes} bytes; SHA-256 \`${candidate.fullLocalCodeClosure.setSha256}\`.
- Digest-declared candidate runtime assets: ${candidate.runtimeAssetClosure.recordCount} files / ${candidate.runtimeAssetClosure.totalBytes} bytes; SHA-256 \`${candidate.runtimeAssetClosure.setSha256}\`; digest mismatches 0.
- Candidate set: ${candidate.candidateCount} diagnostics / ${candidate.declaredFrameCount} declared frames; registry references 0; formal effect none.
- Requirements: 520 = 94 root + 426 nested; EN 260 + ES 260; all blocked and authority unresolved.
- Audio inventories: 245 rows; formal listening acceptance 0. Course-level missing SHA-unresolved MP3 remains 16 (L2 14, L6 1, L8 1; L10 0).
- Ruffle and current-JavaScript diagnostics remain forensic/engineering references, never original-runtime authority.

## Gate matrix

| Gate | Status | Satisfied | Blocker |
|---|---:|---:|---|
${rows}

Only source custody is satisfied, with source-custody-only effect. Every other gate is closed.

## Downstream and human boundary

The bound transaction must not run in \`--apply\`, \`--dry-run\`, or its downstream \`--check\` mode until descriptor-relative creation, persistent no-delete custody, removal of recursive pathname cleanup, adversarial tests, and independent review close its P0s. Only after that review may the owner authorize one named Adobe Animate/original-runtime operator and approved disposable offline environment, run a new quiescent preflight, and finalize the source-open/pre-frame receipt.

All 16 acceptance/publication effects are false. V4 is a read-only currentness contract, not a baseline, renderer acceptance, RMSE result, audio/listening decision, human/owner decision, strict completion, release, integration, or publication authority.

## Bound inputs

| Path | Bytes | SHA-256 | Mode |
|---|---:|---|---:|
${bindings}
`;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]), "Expected --write or --check");
  return args[0];
}

export async function writeNoClobber(absolute, contents) {
  try {
    const current = await readFile(absolute, "utf8");
    assert.equal(current, contents, `${absolute} exists with different bytes; refusing overwrite`);
    return "already-current";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(absolute, contents, { flag: "wx", mode: 0o644 });
  return "created";
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  await assertSnapshotUnchanged(snapshot);
  const jsonPath = resolveInsideRoot(projectRoot, REPORT_JSON);
  const markdownPath = resolveInsideRoot(projectRoot, REPORT_MARKDOWN);
  if (mode === "--write") {
    const dispositions = [
      await writeNoClobber(jsonPath, json),
      await writeNoClobber(markdownPath, markdown),
    ];
    await assertSnapshotUnchanged(snapshot);
    return { mode, report, written: [REPORT_JSON, REPORT_MARKDOWN], dispositions };
  }
  assert.equal(await readFile(jsonPath, "utf8"), json, `${REPORT_JSON} is stale`);
  assert.equal(await readFile(markdownPath, "utf8"), markdown, `${REPORT_MARKDOWN} is stale`);
  await assertSnapshotUnchanged(snapshot);
  return { mode, report, checked: [REPORT_JSON, REPORT_MARKDOWN] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${result.mode === "--write" ? "WROTE" : "CHECKED"} ${REPORT_JSON} and ${REPORT_MARKDOWN}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
