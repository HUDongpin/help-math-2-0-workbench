import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {link, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";

import {
  buildImplementationRankingReport,
  assertSafeRankingReportOutput,
  parseArguments,
  rankEvidenceItems,
  renderImplementationRankingMarkdown,
  validateImplementationRankingReport,
  validateInputReports,
  writeOrCheckRankingReport,
} from "./build-g4-l3-batch-001-implementation-ranking.mjs";

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();

const INPUT_PATHS = {
  workCards: "reports/g4-l3-implementation-work-cards.json",
  batchSpecificationReadiness: "reports/g4-l3-batch-001-specification-readiness.json",
  machineAudit: "reports/g4-l3-machine-source-audits.json",
  sourceOperations: "reports/g4-l3-source-operation-index-v2.json",
  assetDefinitionCensus: "reports/g4-l3-swf-asset-definition-census.json",
  embeddedAudioArchive: "reports/g4-l3-embedded-audio-archive.json",
  catalogAudioMediaProbe: "reports/g4-l3-catalog-audio-media-probe.json",
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function rawRankingItems(report) {
  return report.rankedItems.map((item) => {
    const copy = structuredClone(item);
    delete copy.ranking;
    delete copy.itemFingerprintSha256;
    return copy;
  });
}

async function loadInputs() {
  const entries = await Promise.all(Object.entries(INPUT_PATHS).map(async ([key, file]) => {
    const bytes = await readFile(file);
    return [key, {
      value: JSON.parse(bytes.toString("utf8")),
      binding: {path: file, bytes: bytes.length, sha256: sha256(bytes)},
    }];
  }));
  return {
    reports: Object.fromEntries(entries.map(([key, entry]) => [key, entry.value])),
    bindings: Object.fromEntries(entries.map(([key, entry]) => [key, entry.binding])),
  };
}

test("ranks 25 scaffolded batch-001 items without promoting implementation or strict completion", async () => {
  const report = await buildImplementationRankingReport();
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.reportType, "g4-l3-batch-001-implementation-complexity-ranking");
  assert.equal(report.scope.canonicalItems, 25);
  assert.equal(report.rankedItems.length, 25);
  assert.equal(report.summary.rankedItems, 25);
  assert.equal(report.summary.flaBacked, 19);
  assert.equal(report.summary.swfOnly, 6);
  assert.equal(report.summary.physicallyRehashedLegacySourceFiles, 44);
  assert.equal(report.summary.physicallyRehashedCatalogAudioFiles, 24);
  assert.equal(report.summary.inputReportsBound, 7);
  assert.equal(report.summary.inputReportGeneratorsWithHashVerifiedNow, 6);
  assert.equal(report.summary.minimumAggregateOrdinalScore, 69);
  assert.equal(report.summary.maximumAggregateOrdinalScore, 322);
  assert.equal(report.summary.implementationAuthorized, 0);
  assert.equal(report.summary.authoritativeRuntimeReady, 0);
  assert.equal(report.summary.strictComplete, 0);
  assert.equal(report.developmentBoundary.scaffoldGateOpen, true);
  assert.equal(report.developmentBoundary.scaffoldedWorkspaces, 25);
  assert.equal(report.developmentBoundary.scaffoldGateAffectsRanking, false);
  assert.equal(report.developmentBoundary.implementationAuthorized, false);
  assert.deepEqual(report.rankedItems.map((item) => item.ranking.implementationSequencePosition),
    Array.from({length: 25}, (_, index) => index + 1));
  assert.equal(report.rankedItems[0].animationId, "course-g04-l03-rw-003");
  assert.equal(report.rankedItems[0].ranking.aggregateOrdinalScore, 69);
  assert.equal(report.rankedItems.at(-1).animationId, "course-g04-l03-ti-002");
  assert.equal(report.rankedItems.at(-1).ranking.aggregateOrdinalScore, 322);
  const tied = report.rankedItems.filter((item) => item.ranking.aggregateOrdinalScore === 189);
  assert.deepEqual(tied.map((item) => item.animationId), [
    "course-g04-l03-in-002",
    "course-g04-l03-in-008",
  ]);
  assert.ok(tied.every((item) => item.ranking.complexityCompetitionRank === 14 &&
    item.ranking.aggregateScoreTieSize === 2));
});

test("uses four equal-width evidence axes and preserves every raw source count", async () => {
  const report = await buildImplementationRankingReport();
  assert.deepEqual(report.method.axes.map((axis) => [axis.id, axis.metrics.length]), [
    ["timeline", 4],
    ["behavior", 4],
    ["assets", 4],
    ["audio", 4],
  ]);
  for (const item of report.rankedItems) {
    assert.equal(Object.keys(item.evidence.metrics).length, 16);
    assert.ok(Object.values(item.evidence.metrics).every((value) => Number.isSafeInteger(value) && value >= 0));
    assert.equal(Object.keys(item.ranking.metricOrdinalRanks).length, 16);
    assert.equal(item.ranking.aggregateOrdinalScore,
      Object.values(item.ranking.metricOrdinalRanks).reduce((sum, value) => sum + value, 0));
    assert.equal(item.ranking.aggregateOrdinalScore,
      Object.values(item.ranking.axisOrdinalScores).reduce((sum, value) => sum + value, 0));
    assert.equal(item.evidence.supplemental.sourceKind, item.source.sourceKind);
    assert.equal(item.source.sourceAvailabilityExcludedFromScore, true);
    assert.equal(item.evidence.supplemental.runtimeReachabilityEstablished, false);
  }
});

test("rehashes every selected legacy source, catalog MP3, input report, and declared report generator", async () => {
  const report = await buildImplementationRankingReport();
  for (const binding of Object.values(report.sourceBindings.inputReports)) {
    const bytes = await readFile(binding.path);
    assert.equal(bytes.length, binding.bytes);
    assert.equal(sha256(bytes), binding.sha256);
    if (binding.generatorBinding.verifiedNow) {
      const generatorBytes = await readFile(binding.generatorBinding.path);
      assert.equal(generatorBytes.length, binding.generatorBinding.bytes);
      assert.equal(sha256(generatorBytes), binding.generatorBinding.sha256);
    }
  }
  for (const entry of report.sourceBindings.selectedLegacySources.filesByAnimation) {
    for (const binding of [entry.swf, entry.fla].filter(Boolean)) {
      const bytes = await readFile(binding.path);
      assert.equal(bytes.length, binding.bytes);
      assert.equal(sha256(bytes), binding.sha256);
      assert.equal(binding.physicalHashVerifiedNow, true);
    }
  }
  for (const binding of report.sourceBindings.selectedCatalogAudioSources.files) {
    const bytes = await readFile(binding.path);
    assert.equal(bytes.length, binding.bytes);
    assert.equal(sha256(bytes), binding.sha256);
  }
});

test("the ranking is deterministic and reacts only to retained raw complexity metrics", async () => {
  const report = await buildImplementationRankingReport();
  assert.deepEqual(rankEvidenceItems(rawRankingItems(report)), report.rankedItems);
  const mutated = rawRankingItems(report);
  const ti002 = mutated.find((item) => item.animationId === "course-g04-l03-ti-002");
  for (const key of Object.keys(ti002.evidence.metrics)) ti002.evidence.metrics[key] = 0;
  const reranked = rankEvidenceItems(mutated);
  assert.equal(reranked[0].animationId, "course-g04-l03-ti-002");
  assert.notEqual(reranked[0].itemFingerprintSha256,
    report.rankedItems.find((item) => item.animationId === "course-g04-l03-ti-002").itemFingerprintSha256);
});

test("upstream validators and cross-bindings fail closed on mutated report evidence", async () => {
  const {reports, bindings} = await loadInputs();
  validateInputReports(reports, bindings);

  const machine = structuredClone(reports);
  machine.machineAudit.summary.rootFrameCountSum += 1;
  assert.throws(() => validateInputReports(machine, bindings), /root frame total is stale/);

  const operation = structuredClone(reports);
  operation.sourceOperations.items[0].counts.operations += 1;
  assert.throws(() => validateInputReports(operation, bindings), /operation\/signal counts are stale/);

  const audio = structuredClone(reports);
  audio.catalogAudioMediaProbe.probes[0].probeFingerprintSha256 = "0".repeat(64);
  assert.throws(() => validateInputReports(audio, bindings), /probe fingerprint is missing or stale/);

  const crossBinding = structuredClone(reports);
  crossBinding.assetDefinitionCensus.sourceBindings.workCards.sha256 = "0".repeat(64);
  assert.throws(() => validateInputReports(crossBinding, bindings), /consistent historical work-card binding/);
});

test("report validator rejects cardinality, metric, rank, hash, method, and acceptance mutations", async () => {
  const report = await buildImplementationRankingReport();

  const cardinality = structuredClone(report);
  cardinality.rankedItems.pop();
  assert.throws(() => validateImplementationRankingReport(cardinality), /exactly 25 unique items/);

  const metric = structuredClone(report);
  metric.rankedItems[0].evidence.metrics.exactOperationCount += 1;
  assert.throws(() => validateImplementationRankingReport(metric), /order, score, or item fingerprint is stale/);

  const rank = structuredClone(report);
  rank.rankedItems[0].ranking.implementationSequencePosition = 2;
  assert.throws(() => validateImplementationRankingReport(rank), /exact 1\.\.25 sequence/);

  const source = structuredClone(report);
  source.rankedItems[0].source.swf.sha256 = "0".repeat(64);
  assert.throws(() => validateImplementationRankingReport(source),
    /selected legacy-source set binding is stale|invalid physical source identity/);

  const inputReport = structuredClone(report);
  inputReport.sourceBindings.inputReports.machineAudit.sha256 = "0".repeat(64);
  assert.throws(() => validateImplementationRankingReport(inputReport), /input-report set SHA-256 is stale/);

  const inputReportCount = structuredClone(report);
  inputReportCount.summary.inputReportsBound -= 1;
  assert.throws(() => validateImplementationRankingReport(inputReportCount), /verification summary is stale/);

  const generatorBinding = structuredClone(report);
  generatorBinding.sourceBindings.inputReports.machineAudit.generatorBinding.verifiedNow = false;
  assert.throws(() => validateImplementationRankingReport(generatorBinding),
    /Invalid input report generator binding|input-report set SHA-256 is stale/);

  const legacySourceSet = structuredClone(report);
  legacySourceSet.sourceBindings.selectedLegacySources.sourceSetSha256 = "0".repeat(64);
  assert.throws(() => validateImplementationRankingReport(legacySourceSet), /legacy-source set binding is stale/);

  const selectedAudio = structuredClone(report);
  selectedAudio.sourceBindings.selectedCatalogAudioSources.files[0].sha256 = "0".repeat(64);
  assert.throws(() => validateImplementationRankingReport(selectedAudio), /catalog-audio source set binding is stale/);

  const selectedAudioSet = structuredClone(report);
  selectedAudioSet.sourceBindings.selectedCatalogAudioSources.sourceSetSha256 = "0".repeat(64);
  assert.throws(() => validateImplementationRankingReport(selectedAudioSet), /catalog-audio source set binding is stale/);

  const itemFingerprint = structuredClone(report);
  itemFingerprint.rankedItems[0].itemFingerprintSha256 = "0".repeat(64);
  assert.throws(() => validateImplementationRankingReport(itemFingerprint), /order, score, or item fingerprint is stale/);

  const minimum = structuredClone(report);
  minimum.summary.minimumAggregateOrdinalScore += 1;
  assert.throws(() => validateImplementationRankingReport(minimum), /aggregate summary is stale/);

  const maximum = structuredClone(report);
  maximum.summary.maximumAggregateOrdinalScore -= 1;
  assert.throws(() => validateImplementationRankingReport(maximum), /aggregate summary is stale/);

  const rankingSet = structuredClone(report);
  rankingSet.summary.rankingSetSha256 = "0".repeat(64);
  assert.throws(() => validateImplementationRankingReport(rankingSet), /summary\/cardinality\/set hash is stale/);

  const method = structuredClone(report);
  method.method.aggregation = "promoted";
  assert.throws(() => validateImplementationRankingReport(method), /method drifted/);

  const boundary = structuredClone(report);
  boundary.rankedItems[0].boundaries.implementationAuthorized = true;
  assert.throws(() => validateImplementationRankingReport(boundary), /crossed a runtime\/acceptance boundary/);

  const acceptance = structuredClone(report);
  acceptance.acceptance.strictAcceptanceEffect = true;
  assert.throws(() => validateImplementationRankingReport(acceptance), /acceptance-neutral boundary/);

  const scaffoldPromotion = structuredClone(report);
  scaffoldPromotion.developmentBoundary.implementationAuthorized = true;
  assert.throws(() => validateImplementationRankingReport(scaffoldPromotion), /scaffold state crossed/);
});

test("local output guard rejects escape, extension, symlink, hardlink, and FIFO targets and check mode never writes", async (t) => {
  const directory = await mkdtemp(path.join(projectRoot, "reports", ".implementation-ranking-output-test-"));
  t.after(async () => rm(directory, {recursive: true, force: true}));

  await assert.rejects(
    assertSafeRankingReportOutput(path.join(projectRoot, "outside-ranking.json"), {extension: ".json"}),
    /inside/,
  );
  await assert.rejects(
    assertSafeRankingReportOutput(path.join(directory, "wrong.md"), {extension: ".json"}),
    /end in \.json/,
  );

  const realTarget = path.join(directory, "real-target.json");
  const symlinkTarget = path.join(directory, "symlink-target.json");
  await writeFile(realTarget, "real\n");
  await symlink(realTarget, symlinkTarget);
  await assert.rejects(assertSafeRankingReportOutput(symlinkTarget, {extension: ".json"}), /symbolic-link/);

  const realDirectory = path.join(directory, "real-directory");
  const symlinkDirectory = path.join(directory, "symlink-directory");
  await mkdir(realDirectory);
  await symlink(realDirectory, symlinkDirectory);
  await assert.rejects(
    assertSafeRankingReportOutput(path.join(symlinkDirectory, "nested.json"), {extension: ".json"}),
    /symbolic-link/,
  );

  const hardlinkSource = path.join(directory, "hardlink-source.json");
  const hardlinkTarget = path.join(directory, "hardlink-target.json");
  await writeFile(hardlinkSource, "hardlink\n");
  await link(hardlinkSource, hardlinkTarget);
  await assert.rejects(assertSafeRankingReportOutput(hardlinkTarget, {extension: ".json"}),
    /hard-linked|single-link/);

  const fifoTarget = path.join(directory, "fifo-target.json");
  await execFileAsync("mkfifo", [fifoTarget]);
  await assert.rejects(assertSafeRankingReportOutput(fifoTarget, {extension: ".json"}),
    /regular, non-symlink, single-link file/);

  const sentinel = path.join(directory, "sentinel.json");
  await writeFile(sentinel, "sentinel-must-survive\n");
  await assert.rejects(
    writeOrCheckRankingReport(sentinel, "different\n", {extension: ".json", check: true}),
    /missing or stale/,
  );
  assert.equal(await readFile(sentinel, "utf8"), "sentinel-must-survive\n");
  await writeOrCheckRankingReport(sentinel, "sentinel-must-survive\n", {extension: ".json", check: true});
  assert.equal(await readFile(sentinel, "utf8"), "sentinel-must-survive\n");
});

test("checked-in JSON and Markdown exactly match the deterministic generator", async () => {
  const report = await buildImplementationRankingReport();
  const [json, markdown] = await Promise.all([
    readFile("reports/g4-l3-batch-001-implementation-ranking.json", "utf8"),
    readFile("reports/g4-l3-batch-001-implementation-ranking.md", "utf8"),
  ]);
  assert.equal(json, `${JSON.stringify(report, null, 2)}\n`);
  assert.equal(markdown, renderImplementationRankingMarkdown(report));
});

test("CLI parsing is deterministic and rejects incomplete or unknown options", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--help"]).help, true);
  assert.equal(path.basename(parseArguments(["--json-output", "reports/custom-ranking.json"]).jsonOutput),
    "custom-ranking.json");
  assert.equal(path.basename(parseArguments(["--markdown-output", "reports/custom-ranking.md"]).markdownOutput),
    "custom-ranking.md");
  assert.throws(() => parseArguments(["--json-output"]), /requires a path/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});
