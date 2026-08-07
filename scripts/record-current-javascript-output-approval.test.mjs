import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, mkdtemp, mkdir, readFile, readdir, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  amendCurrentJavaScriptOutputApprovalBinding,
  recordCurrentJavaScriptOutputApproval,
  verifyCurrentJavaScriptOutputApproval,
  writeApprovalTransaction,
} from "./record-current-javascript-output-approval.mjs";

async function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, contents);
  return filePath;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("records a scope-limited, hash-bound current JavaScript approval and detects later changes", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-current-js-approval-"));
  t.after(() => rm(root, {recursive: true, force: true}));

  const animationId = "fixture-animation";
  const fixtureComponent = "import {fixtureDependency} from './FixtureDependency.js';\nexport default function Fixture() { return fixtureDependency ? null : null; }\n";
  const fixtureDependency = "import {nestedDependency} from './Nested.generated';\nexport const fixtureDependency = nestedDependency;\n";
  await write(root, "components/Nested.generated.ts", "export const nestedDependency = 1;\n");
  await write(root, "components/FixtureDependency.js", fixtureDependency);
  await write(root, "components/Fixture.jsx", fixtureComponent);
  await write(root, "lib/fixture-timeline.js", "export const frame = 1;\n");
  await write(root, "lib/fixture.test.mjs", "// fixture test\n");
  await write(root, "apps/web/proxy.ts", "export default function proxy() { return 'fixture-proxy-v1'; }\n");
  await write(root, "apps/web/next.config.ts", "export default {reactStrictMode: true};\n");
  await write(root, "apps/web/app/fixture/page.tsx", "export default function Page() { return null; }\n");
  await write(root, `migrations/${animationId}/evidence/full-frame-coverage.json`, "{}\n");
  await write(root, `migrations/${animationId}/evidence/behavior-qa.json`, "{}\n");
  await write(root, `migrations/${animationId}/keyframes.csv`, "frame\n1\n");
  await write(root, `migrations/${animationId}/migration.json`, `${JSON.stringify({
    animationId,
    source: {swf: {sha256: "a".repeat(64)}},
    movie: {stage: {width: 100, height: 100}, fps: 12, frameCount: 1},
    implementation: {
      route: `/animations/${animationId}`,
      routeFile: "apps/web/app/fixture/page.tsx",
      component: "components/Fixture.jsx",
      timelineModule: "lib/fixture-timeline.js",
      testFile: "lib/fixture.test.mjs",
    },
    evidence: {
      fullFrameCoverageFile: "evidence/full-frame-coverage.json",
      behaviorQaFile: "evidence/behavior-qa.json",
      keyframeCsv: "keyframes.csv",
    },
    acceptance: {
      humanVisualReview: {decision: "pending", reviewer: "", reviewedAt: "", scope: "all-keyframe-and-full-frame-diffs"},
      ownerReview: {decision: "pending", reviewer: "", reviewedAt: ""},
      currentJavaScriptOutputApproval: {
        decision: "stale",
        priorDecision: "accepted",
        reviewer: "Project user",
        reviewedAt: "2026-07-20T00:00:00Z",
        invalidationReason: "fixture changed",
      },
    },
  }, null, 2)}\n`);

  const escapedReport = `${root}-outside-approval.json`;
  t.after(() => rm(escapedReport, {force: true}));
  await assert.rejects(
    recordCurrentJavaScriptOutputApproval({
      projectRoot: root,
      report: escapedReport,
      animationIds: [animationId],
      reviewer: "Project user (explicit human approval in test thread)",
      reviewedAt: "2026-07-21T20:54:03Z",
      sourceMessage: "human approves the current JavaScript animation",
    }),
    /Approval artifact escapes the project root/,
  );
  await assert.rejects(readFile(escapedReport), {code: "ENOENT"});

  const recorded = await recordCurrentJavaScriptOutputApproval({
    projectRoot: root,
    animationIds: [animationId],
    reviewer: "Project user (explicit human approval in test thread)",
    reviewedAt: "2026-07-21T20:54:03Z",
    sourceMessage: "human approves the current JavaScript animation",
  });

  assert.equal(recorded.record.summary.animations, 1);
  assert.equal(recorded.record.summary.renewedFromStale, 1);
  assert.equal(recorded.record.authorityBoundary.strictHumanVisualReview, false);
  assert.equal(recorded.record.authorityBoundary.ownerAcceptance, false);

  const manifestPath = path.join(root, `migrations/${animationId}/migration.json`);
  const manifestTextAfterRecord = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestTextAfterRecord);
  const approval = manifest.acceptance.currentJavaScriptOutputApproval;
  assert.equal(approval.decision, "accepted");
  assert.equal(approval.approvalRecordSha256, recorded.reportSha256);
  assert.equal(approval.history.at(-1).decision, "stale");
  assert.equal(manifest.acceptance.humanVisualReview.decision, "pending");
  assert.equal(manifest.acceptance.ownerReview.decision, "pending");

  const current = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(current.ok, true, current.errors.join("\n"));

  const tamperedManifest = structuredClone(manifest);
  tamperedManifest.acceptance.currentJavaScriptOutputApproval.reviewer = "Fake Owner";
  tamperedManifest.acceptance.currentJavaScriptOutputApproval.ownerAcceptance = "accepted";
  await writeFile(manifestPath, `${JSON.stringify(tamperedManifest, null, 2)}\n`);
  const tamperedMirror = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(tamperedMirror.ok, false);
  assert.ok(tamperedMirror.errors.some((error) => error.includes("reviewer does not match")), tamperedMirror.errors.join("\n"));
  assert.ok(tamperedMirror.errors.some((error) => error.includes("ownerAcceptance is not allowed")), tamperedMirror.errors.join("\n"));
  await assert.rejects(
    amendCurrentJavaScriptOutputApprovalBinding({
      projectRoot: root,
      amendmentReason: "A tampered manifest mirror must never be legitimized by an evidence-only amendment.",
    }),
    /reviewer does not match|ownerAcceptance is not allowed/,
  );
  await writeFile(manifestPath, manifestTextAfterRecord);

  const tamperedHistoryManifest = JSON.parse(manifestTextAfterRecord);
  tamperedHistoryManifest.acceptance.currentJavaScriptOutputApproval.history[0] = {
    decision: "accepted",
    priorDecision: "",
    reviewer: "Fake Owner",
    reviewedAt: "2026-07-21T20:54:03Z",
    invalidatedAt: "",
    invalidationReason: "",
    scope: "strict migration, fidelity, audio, and owner acceptance",
  };
  await writeFile(manifestPath, `${JSON.stringify(tamperedHistoryManifest, null, 2)}\n`);
  const tamperedHistory = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(tamperedHistory.ok, false);
  assert.ok(tamperedHistory.errors.some((error) => error.includes("history does not match approval report")), tamperedHistory.errors.join("\n"));
  assert.ok(tamperedHistory.errors.some((error) => error.includes("scope exceeds the current-JavaScript-only authority boundary")), tamperedHistory.errors.join("\n"));
  await writeFile(manifestPath, manifestTextAfterRecord);

  await write(root, "apps/web/proxy.ts", "export default function proxy() { return 'fixture-proxy-v2'; }\n");
  const proxyStale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(proxyStale.ok, false);
  assert.ok(proxyStale.errors.some((error) => error.includes("artifact binding changed")), proxyStale.errors.join("\n"));
  await write(root, "apps/web/proxy.ts", "export default function proxy() { return 'fixture-proxy-v1'; }\n");

  await write(root, "apps/web/next.config.ts", "export default {reactStrictMode: false};\n");
  const nextConfigStale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(nextConfigStale.ok, false);
  assert.ok(nextConfigStale.errors.some((error) => error.includes("artifact binding changed")), nextConfigStale.errors.join("\n"));
  await write(root, "apps/web/next.config.ts", "export default {reactStrictMode: true};\n");

  await write(root, "components/Nested.generated.ts", "export const nestedDependency = 2;\n");
  const transitiveStale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(transitiveStale.ok, false);
  assert.ok(transitiveStale.errors.some((error) => error.includes("artifact binding changed")), transitiveStale.errors.join("\n"));
  await write(root, "components/Nested.generated.ts", "export const nestedDependency = 1;\n");

  await write(root, "components/Fixture.jsx", "export default function Fixture() { return <div />; }\n");
  const stale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(stale.ok, false);
  assert.ok(stale.errors.some((error) => error.includes("artifact binding changed")), stale.errors.join("\n"));

  await assert.rejects(
    amendCurrentJavaScriptOutputApprovalBinding({
      projectRoot: root,
      amendmentReason: "The fixture renderer changed, so this evidence-only amendment must fail closed.",
    }),
    /protected JavaScript artifact set changed; fresh human approval is required/,
  );

  await write(root, "components/Fixture.jsx", fixtureComponent);
  await write(root, `migrations/${animationId}/evidence/behavior-qa.json`, "{\"refreshed\":true}\n");
  const evidenceOnlyStale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(evidenceOnlyStale.ok, false);
  assert.ok(evidenceOnlyStale.errors.some((error) => error.includes("artifact binding changed")), evidenceOnlyStale.errors.join("\n"));

  const amendmentReason = "Only the fixture migration evidence changed; the renderer, timeline, route, test, shared runtime, and public dependencies remain byte-identical.";
  const reportTextBeforeTamper = await readFile(recorded.reportPath, "utf8");
  const tamperedReportIdentity = JSON.parse(reportTextBeforeTamper);
  tamperedReportIdentity.reviewer = "Fake Owner";
  await writeFile(recorded.reportPath, `${JSON.stringify(tamperedReportIdentity, null, 2)}\n`);
  await assert.rejects(
    amendCurrentJavaScriptOutputApprovalBinding({projectRoot: root, amendmentReason}),
    /manifest approval reviewer does not match|manifest approval report hash mismatch/,
  );
  await writeFile(recorded.reportPath, reportTextBeforeTamper);
  const amended = await amendCurrentJavaScriptOutputApprovalBinding({projectRoot: root, amendmentReason});
  assert.equal(amended.record.bindingAmendment.reason, amendmentReason);
  assert.equal(amended.record.bindingAmendment.humanDecisionChanged, false);
  const amendedCurrent = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(amendedCurrent.ok, true, amendedCurrent.errors.join("\n"));
  const amendedReportText = await readFile(amended.reportPath, "utf8");

  const unknownTopLevelClaim = {...amended.record, ownerAcceptance: "accepted"};
  await writeFile(amended.reportPath, `${JSON.stringify(unknownTopLevelClaim, null, 2)}\n`);
  const unknownTopLevelResult = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(unknownTopLevelResult.ok, false);
  assert.ok(unknownTopLevelResult.errors.some((error) => error.includes("approval report.ownerAcceptance is not allowed")), unknownTopLevelResult.errors.join("\n"));
  await writeFile(amended.reportPath, amendedReportText);

  const overclaim = structuredClone(amended.record);
  overclaim.authorityBoundary.strictMigrationCompletion = true;
  await writeFile(amended.reportPath, `${JSON.stringify(overclaim, null, 2)}\n`);
  const overclaimResult = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(overclaimResult.ok, false);
  assert.ok(overclaimResult.errors.some((error) => error.includes("authorityBoundary.strictMigrationCompletion must be false")), overclaimResult.errors.join("\n"));
  await assert.rejects(
    amendCurrentJavaScriptOutputApprovalBinding({projectRoot: root, amendmentReason}),
    /authorityBoundary.strictMigrationCompletion must be false/,
  );

  const empty = {...amended.record, summary: {...amended.record.summary, animations: 0}, animations: []};
  await writeFile(amended.reportPath, `${JSON.stringify(empty, null, 2)}\n`);
  const emptyResult = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(emptyResult.ok, false);
  assert.ok(emptyResult.errors.includes("approval report must bind at least one animation"), emptyResult.errors.join("\n"));
});

test("approval verification is read-only when a nested report path is absent", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-approval-check-readonly-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const missingParent = path.join(root, "missing");
  await assert.rejects(
    verifyCurrentJavaScriptOutputApproval({projectRoot: root, report: "missing/nested/approval.json"}),
    /Approval report parent does not exist/,
  );
  await assert.rejects(lstat(missingParent), {code: "ENOENT"});
});

test("binds only the route-visible catalog projection for the approved animation", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-approval-catalog-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const animationId = "fixture-catalog-animation";
  const catalogPath = "catalog/animations.json";
  const ledgerPath = "catalog/completion-ledger.json";
  const catalog = {
    schemaVersion: 1,
    animations: [
      {animationId, assetId: "swf-fixture", classification: {titleDisplay: "Fixture title"}, source: {path: "fixture.swf"}},
      {animationId: "unrelated-animation", assetId: "swf-unrelated", classification: {titleDisplay: "Unrelated title"}, source: {path: "unrelated.swf"}},
    ],
  };
  const ledger = {
    schemaVersion: 1,
    entries: [],
    diagnostics: [
      {animationId, status: "preserved"},
      {animationId: "unrelated-animation", status: "blocked"},
    ],
  };
  await write(root, catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  await write(root, ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  await write(root, "apps/web/lib/catalog.ts", "export function findAnimation() { return null; }\n");
  await write(root, "apps/web/app/[locale]/animations/[animationId]/page.tsx", "import {findAnimation} from '@/lib/catalog';\nexport default function Page() { return findAnimation(); }\n");
  await write(root, "components/CatalogFixture.jsx", "export default function CatalogFixture() { return null; }\n");
  await write(root, `migrations/${animationId}/migration.json`, `${JSON.stringify({
    animationId,
    source: {swf: {sha256: "c".repeat(64)}},
    movie: {stage: {width: 100, height: 100}, fps: 12, frameCount: 1},
    implementation: {route: `/animations/${animationId}`, component: "components/CatalogFixture.jsx"},
    evidence: {},
    acceptance: {humanVisualReview: {decision: "pending"}, ownerReview: {decision: "pending"}},
  }, null, 2)}\n`);

  const recorded = await recordCurrentJavaScriptOutputApproval({
    projectRoot: root,
    animationIds: [animationId],
    reviewer: "Project user (explicit human approval in test thread)",
    reviewedAt: "2026-07-21T20:54:03Z",
    sourceMessage: "human approves the current catalog-backed JavaScript animation",
  });
  assert.equal(recorded.record.animations[0].catalogProjection.migrationStatus, "preserved");
  assert.equal(recorded.record.animations[0].catalogProjection.animation.classification.titleDisplay, "Fixture title");

  catalog.animations[1].classification.titleDisplay = "Changed unrelated title";
  ledger.diagnostics[1].status = "validating";
  await write(root, catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  await write(root, ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  const unrelatedChange = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(unrelatedChange.ok, true, unrelatedChange.errors.join("\n"));

  catalog.animations[0].classification.titleDisplay = "Changed approved title";
  await write(root, catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  const catalogStale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(catalogStale.ok, false);
  assert.ok(catalogStale.errors.some((error) => error.includes("route-visible catalog projection changed")), catalogStale.errors.join("\n"));
  await assert.rejects(
    amendCurrentJavaScriptOutputApprovalBinding({
      projectRoot: root,
      amendmentReason: "A route-visible catalog title change requires fresh human approval.",
    }),
    /route-visible catalog projection changed/,
  );

  catalog.animations[0].classification.titleDisplay = "Fixture title";
  ledger.diagnostics[0].status = "blocked";
  await write(root, catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  await write(root, ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  const statusStale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(statusStale.ok, false);
  assert.ok(statusStale.errors.some((error) => error.includes("route-visible catalog projection changed")), statusStale.errors.join("\n"));
});

test("re-recording a shared report cannot orphan an omitted animation approval", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-approval-animation-set-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const animationIds = ["fixture-one", "fixture-two"];
  for (const [index, animationId] of animationIds.entries()) {
    const component = `components/Fixture${index + 1}.jsx`;
    await write(root, component, `export default function Fixture${index + 1}() { return null; }\n`);
    await write(root, `migrations/${animationId}/migration.json`, `${JSON.stringify({
      animationId,
      source: {swf: {sha256: String(index + 1).repeat(64)}},
      movie: {stage: {width: 100, height: 100}, fps: 12, frameCount: 1},
      implementation: {route: `/animations/${animationId}`, component},
      evidence: {},
      acceptance: {humanVisualReview: {decision: "pending"}, ownerReview: {decision: "pending"}},
    }, null, 2)}\n`);
  }
  const initial = await recordCurrentJavaScriptOutputApproval({
    projectRoot: root,
    animationIds,
    reviewer: "Project user (explicit human approval in test thread)",
    reviewedAt: "2026-07-21T20:54:03Z",
    sourceMessage: "human approves both current JavaScript animations",
  });
  const reportBefore = await readFile(initial.reportPath);
  const omittedManifestPath = path.join(root, "migrations/fixture-two/migration.json");
  const omittedManifestBefore = await readFile(omittedManifestPath);

  await assert.rejects(
    recordCurrentJavaScriptOutputApproval({
      projectRoot: root,
      animationIds: ["fixture-one"],
      reviewer: "Project user (explicit human approval in test thread)",
      reviewedAt: "2026-07-21T21:54:03Z",
      sourceMessage: "human approves only the first current JavaScript animation",
    }),
    /Existing approval report animation set differs/,
  );
  assert.deepEqual(await readFile(initial.reportPath), reportBefore);
  assert.deepEqual(await readFile(omittedManifestPath), omittedManifestBefore);

  await assert.rejects(
    recordCurrentJavaScriptOutputApproval({
      projectRoot: root,
      report: "reports/fixture-one-only.json",
      animationIds: ["fixture-one"],
      reviewer: "Project user (explicit human approval in test thread)",
      reviewedAt: "2026-07-21T21:54:03Z",
      sourceMessage: "human approves only the first current JavaScript animation",
    }),
    /selected manifest belongs to a larger existing approval set; reapprove the complete set/,
  );
  await assert.rejects(readFile(path.join(root, "reports/fixture-one-only.json")), {code: "ENOENT"});
  assert.deepEqual(await readFile(initial.reportPath), reportBefore);
  assert.deepEqual(await readFile(omittedManifestPath), omittedManifestBefore);
  const current = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(current.ok, true, current.errors.join("\n"));
});

test("approval write transaction detects concurrent changes and rolls back a mid-commit failure", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-approval-transaction-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const first = await write(root, "first.json", "first-before\n");
  const second = await write(root, "second.json", "second-before\n");

  await assert.rejects(
    writeApprovalTransaction([
      {filePath: first, value: "first-after\n", expectedBefore: "first-before\n"},
      {filePath: second, value: "second-after\n", expectedBefore: "second-before\n"},
    ], {
      beforeCommit: () => writeFile(second, "second-concurrent\n"),
    }),
    /changed before commit/,
  );
  assert.equal(await readFile(first, "utf8"), "first-before\n");
  assert.equal(await readFile(second, "utf8"), "second-concurrent\n");

  const concurrentlyCreated = path.join(root, "concurrently-created.json");
  await assert.rejects(
    writeApprovalTransaction([
      {filePath: concurrentlyCreated, value: "transaction-value\n", expectedBefore: null},
    ], {
      beforeCommit: () => writeFile(concurrentlyCreated, "concurrent-writer-value\n"),
    }),
    /changed before commit/,
  );
  assert.equal(await readFile(concurrentlyCreated, "utf8"), "concurrent-writer-value\n");

  await writeFile(second, "second-before\n");
  await assert.rejects(
    writeApprovalTransaction([
      {filePath: first, value: "first-after\n", expectedBefore: "first-before\n"},
      {filePath: second, value: "second-after\n", expectedBefore: "second-before\n"},
    ], {
      beforeCommitEntry: (_entry, index) => {
        if (index === 1) throw new Error("injected mid-commit failure");
      },
    }),
    /injected mid-commit failure/,
  );
  assert.equal(await readFile(first, "utf8"), "first-before\n");
  assert.equal(await readFile(second, "utf8"), "second-before\n");

  await assert.rejects(
    writeApprovalTransaction([
      {filePath: first, value: "first-after\n", expectedBefore: "first-before\n"},
      {filePath: second, value: "second-after\n", expectedBefore: "second-before\n"},
    ], {
      beforeCommitEntry: async (_entry, index) => {
        if (index === 1) {
          await writeFile(first, "first-concurrent-after-commit\n");
          throw new Error("injected failure after concurrent replacement");
        }
      },
    }),
    /concurrent bytes were preserved/,
  );
  assert.equal(await readFile(first, "utf8"), "first-concurrent-after-commit\n");
  assert.equal(await readFile(second, "utf8"), "second-before\n");

  const recreated = await write(root, "recreated.json", "recreated-before\n");
  await assert.rejects(
    writeApprovalTransaction([
      {filePath: recreated, value: "recreated-after\n", expectedBefore: "recreated-before\n"},
    ], {
      afterTargetMoved: async (entry) => {
        await writeFile(entry.filePath, "recreated-concurrent\n");
        throw new Error("injected failure after target move");
      },
    }),
    /recreated before rollback restore; concurrent bytes were preserved/,
  );
  assert.equal(await readFile(recreated, "utf8"), "recreated-concurrent\n");
  const recreatedBackup = (await readdir(root)).find((name) => name.startsWith("recreated.json.transaction-") && name.endsWith(".bak"));
  assert.ok(recreatedBackup, "the original-byte backup must be retained on a rollback conflict");
  assert.equal(await readFile(path.join(root, recreatedBackup), "utf8"), "recreated-before\n");

  const restoreFailure = await write(root, "restore-failure.json", "restore-before\n");
  const laterFailure = await write(root, "later-failure.json", "later-before\n");
  await assert.rejects(
    writeApprovalTransaction([
      {filePath: restoreFailure, value: "restore-after\n", expectedBefore: "restore-before\n"},
      {filePath: laterFailure, value: "later-after\n", expectedBefore: "later-before\n"},
    ], {
      beforeCommitEntry: (_entry, index) => {
        if (index === 1) throw new Error("injected later failure");
      },
      beforeRollbackEntry: (entry) => {
        if (entry.filePath === restoreFailure) throw new Error("injected restore failure");
      },
    }),
    /Approval write transaction rollback failed[\s\S]*injected restore failure/,
  );
  assert.equal(await readFile(restoreFailure, "utf8"), "restore-after\n");
  const restoreBackup = (await readdir(root)).find((name) => name.startsWith("restore-failure.json.transaction-") && name.endsWith(".bak"));
  assert.ok(restoreBackup, "the original-byte backup must survive a restore failure");
  assert.equal(await readFile(path.join(root, restoreBackup), "utf8"), "restore-before\n");
});

test("binds generated renderer manifest closure and detects an unreported runtime byte change", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-renderer-approval-"));
  t.after(() => rm(root, {recursive: true, force: true}));

  const animationId = "fixture-generated-renderer";
  const rendererRoot = `public/flash-assets/courses/${animationId}`;
  const runtimeBytes = "window.FIXTURE_RENDERER = {revision: 1};\n";
  const indexBytes = "<!doctype html><script src=\"runtime.js\"></script>\n";
  await write(root, `${rendererRoot}/runtime.js`, runtimeBytes);
  await write(root, `${rendererRoot}/index.html`, indexBytes);
  const generatedManifest = {
    schemaVersion: 1,
    animationId,
    generatedFiles: {
      "index.html": {sha256: sha256(indexBytes), bytes: Buffer.byteLength(indexBytes)},
      "runtime.js": {sha256: sha256(runtimeBytes), bytes: Buffer.byteLength(runtimeBytes)},
    },
  };
  const generatedManifestText = `${JSON.stringify(generatedManifest, null, 2)}\n`;
  await write(root, `${rendererRoot}/manifest.json`, generatedManifestText);

  const componentPath = "packages/demos/src/modules/fixture-generated-renderer.tsx";
  const indirectAudioPath = "public/flash-assets/audio/fixture-indirect.mp3";
  await write(root, indirectAudioPath, "fixture-audio-v1\n");
  await write(root, "packages/demos/src/fixture-renderer-dependencies.ts", `export const source = "/flash-assets/courses/${animationId}/index.html?frame=1";\nexport const audio = "/flash-assets/audio/fixture-indirect.mp3";\n`);
  await write(root, componentPath, "export {source, audio} from '../fixture-renderer-dependencies';\n");
  const candidateQa = {
    animationId,
    implementation: {
      adapterManifest: {
        path: `${rendererRoot}/manifest.json`,
        sha256: sha256(generatedManifestText),
        bytes: Buffer.byteLength(generatedManifestText),
      },
    },
  };
  await write(root, `migrations/${animationId}/evidence/candidate-qa.json`, `${JSON.stringify(candidateQa, null, 2)}\n`);
  await write(root, `migrations/${animationId}/migration.json`, `${JSON.stringify({
    animationId,
    source: {swf: {sha256: "b".repeat(64)}},
    movie: {stage: {width: 100, height: 100}, fps: 12, frameCount: 1},
    implementation: {
      route: `/animations/${animationId}`,
      component: componentPath,
      candidateQa: "evidence/candidate-qa.json",
    },
    evidence: {},
    acceptance: {
      humanVisualReview: {decision: "pending"},
      ownerReview: {decision: "pending"},
    },
  }, null, 2)}\n`);

  const recorded = await recordCurrentJavaScriptOutputApproval({
    projectRoot: root,
    animationIds: [animationId],
    reviewer: "Project user (explicit human approval in test thread)",
    reviewedAt: "2026-07-21T20:54:03Z",
    sourceMessage: "human approves the current generated JavaScript renderer",
  });
  const recordedRendererPaths = recorded.record.animations[0].rendererDependencies.map(({path: dependencyPath}) => dependencyPath);
  assert.deepEqual(recordedRendererPaths, [
    indirectAudioPath,
    `${rendererRoot}/index.html`,
    `${rendererRoot}/manifest.json`,
    `${rendererRoot}/runtime.js`,
  ]);
  const current = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(current.ok, true, current.errors.join("\n"));

  await write(root, indirectAudioPath, "fixture-audio-v2\n");
  const indirectAssetStale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(indirectAssetStale.ok, false);
  assert.ok(indirectAssetStale.errors.some((error) => error.includes("artifact binding changed")), indirectAssetStale.errors.join("\n"));
  await write(root, indirectAudioPath, "fixture-audio-v1\n");

  await write(root, `${rendererRoot}/runtime.js`, "window.FIXTURE_RENDERER = {revision: 2};\n");
  const stale = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(stale.ok, false);
  assert.ok(stale.errors.some((error) => error.includes("renderer inventory SHA-256")), stale.errors.join("\n"));
  // The neutral capture-closure collector now fails closed before the approval
  // projection can be recomputed when an inventoried renderer byte is stale.
  // That stronger diagnostic replaces the later generic binding-change error.

  await assert.rejects(
    amendCurrentJavaScriptOutputApprovalBinding({
      projectRoot: root,
      amendmentReason: "A stale renderer inventory must never be rebound as an evidence-only approval amendment.",
    }),
    /renderer inventory SHA-256/,
  );

  const changedRuntimeBytes = "window.FIXTURE_RENDERER = {revision: 2};\n";
  generatedManifest.generatedFiles["runtime.js"] = {
    sha256: sha256(changedRuntimeBytes),
    bytes: Buffer.byteLength(changedRuntimeBytes),
  };
  const changedGeneratedManifestText = `${JSON.stringify(generatedManifest, null, 2)}\n`;
  await write(root, `${rendererRoot}/manifest.json`, changedGeneratedManifestText);
  candidateQa.implementation.adapterManifest = {
    path: `${rendererRoot}/manifest.json`,
    sha256: sha256(changedGeneratedManifestText),
    bytes: Buffer.byteLength(changedGeneratedManifestText),
  };
  await write(root, `migrations/${animationId}/evidence/candidate-qa.json`, `${JSON.stringify(candidateQa, null, 2)}\n`);
  await assert.rejects(
    amendCurrentJavaScriptOutputApprovalBinding({
      projectRoot: root,
      amendmentReason: "The renderer inventory is internally current but its runtime bytes changed, so fresh human approval is required.",
    }),
    /renderer dependency closure changed; fresh human approval is required/,
  );

  const legacyRecord = {...recorded.record, schemaVersion: 1, ownerAcceptance: "accepted"};
  await writeFile(recorded.reportPath, `${JSON.stringify(legacyRecord, null, 2)}\n`);
  const legacyResult = await verifyCurrentJavaScriptOutputApproval({projectRoot: root});
  assert.equal(legacyResult.ok, false);
  assert.ok(legacyResult.errors.includes("approval report schemaVersion 1 is unsupported"), legacyResult.errors.join("\n"));
  await assert.rejects(
    amendCurrentJavaScriptOutputApprovalBinding({projectRoot: root}),
    /expanded renderer dependency boundary requires fresh human approval/
  );

  const escapingBytes = "window.ESCAPE = true;\n";
  await write(root, "public/flash-assets/courses/escape.js", escapingBytes);
  generatedManifest.generatedFiles["../escape.js"] = {
    sha256: sha256(escapingBytes),
    bytes: Buffer.byteLength(escapingBytes),
  };
  const escapingManifestText = `${JSON.stringify(generatedManifest, null, 2)}\n`;
  await write(root, `${rendererRoot}/manifest.json`, escapingManifestText);
  candidateQa.implementation.adapterManifest = {
    path: `${rendererRoot}/manifest.json`,
    sha256: sha256(escapingManifestText),
    bytes: Buffer.byteLength(escapingManifestText),
  };
  await write(root, `migrations/${animationId}/evidence/candidate-qa.json`, `${JSON.stringify(candidateQa, null, 2)}\n`);
  await assert.rejects(
    recordCurrentJavaScriptOutputApproval({
      projectRoot: root,
      animationIds: [animationId],
      reviewer: "Project user (explicit human approval in test thread)",
      reviewedAt: "2026-07-21T20:54:03Z",
      sourceMessage: "human approves the current generated JavaScript renderer",
    }),
    /generated file escapes its directory/
  );
});
