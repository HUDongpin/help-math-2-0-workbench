import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  normalizeInventoryRows,
  parseCatalog,
  parseInventory,
  reconcileInventory,
  scanHistoricalRoot,
  serializePlanCsv,
  validateOutputPaths,
} from "./reconcile-drive-source-intake.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(scriptDirectory, "test-fixtures", "drive-source-intake.csv");

function catalogFixture() {
  return parseCatalog(
    JSON.stringify({
      schemaVersion: 1,
      files: [
        {
          path: "HELP_COURSES/ELMGR4/L1/IN/L1IN01.swf",
          bytes: 10,
          sha256: "a".repeat(64),
        },
        {
          path: "HELP_COURSES/ELMGR4/L3/VB/L3VB01.swf",
          bytes: 11,
          sha256: "b".repeat(64),
        },
      ],
    }),
  );
}

test("builds a deterministic Grade 4 plan and redacts rows outside scope", async () => {
  const content = await readFile(fixturePath, "utf8");
  const rows = parseInventory(content, fixturePath);
  const plan = reconcileInventory(rows, catalogFixture(), {
    includeSharedKeyterms: true,
    inputSha256: createHash("sha256").update(content).digest("hex"),
    catalogSha256: "f".repeat(64),
  });

  assert.equal(plan.mode, "plan-only-no-source-mutation");
  assert.equal(plan.counts.inputRows, 7);
  assert.equal(plan.counts.selectedTechnicalRows, 6);
  assert.equal(plan.counts.redactedOutOfScopeRows, 1);
  assert.deepEqual(plan.counts.byDownloadDecision, { download: 3, hold: 2, skip: 1 });
  assert.deepEqual(
    plan.records.map((record) => record.canonicalPath),
    [...plan.records.map((record) => record.canonicalPath)].sort((left, right) =>
      left.localeCompare(right, "en"),
    ),
  );

  const exact = plan.records.find((record) => record.driveId === "id-exact");
  assert.equal(exact.pathStatus, "canonical-path-present");
  assert.equal(exact.identityStatus, "canonical-exact-hash");
  assert.equal(exact.disposition, "skip-byte-identical-canonical");

  const duplicate = plan.records.find((record) => record.driveId === "id-hash-duplicate");
  assert.equal(duplicate.pathStatus, "canonical-exact-path-missing");
  assert.equal(duplicate.identityStatus, "canonical-hash-duplicate");
  assert.equal(duplicate.disposition, "hold-placement-alias-review");

  const conflict = plan.records.find((record) => record.driveId === "id-conflict");
  assert.equal(conflict.conflictStatus, "exact-path-content-variant");
  assert.equal(conflict.downloadDecision, "hold");

  const unhashed = plan.records.find((record) => record.driveId === "id-unhashed");
  assert.equal(unhashed.downloadDecision, "download");
  assert.equal(unhashed.disposition, "download-to-quarantine-for-hashing");

  assert.equal(plan.records.some((record) => record.driveId === "id-private"), false);
  const csv = serializePlanCsv(plan);
  assert.match(csv, /^drive_id,drive_relative_path,canonical_path,/);
  assert.match(csv, /"HELP_COURSES\/ELMGR4\/L2\/FQ\/L2FQ01, review\.swf"/);
  assert.doesNotMatch(csv, /Executive Notes|id-private/);

  const repeated = reconcileInventory(rows, catalogFixture(), {
    includeSharedKeyterms: true,
    inputSha256: plan.inputs.inventorySha256,
    catalogSha256: plan.inputs.canonicalCatalogSha256,
  });
  assert.equal(JSON.stringify(repeated), JSON.stringify(plan));
});

test("shared elementary KeyTerms require explicit selection", async () => {
  const rows = parseInventory(await readFile(fixturePath, "utf8"), fixturePath);
  const plan = reconcileInventory(rows, catalogFixture());
  assert.equal(plan.records.some((record) => record.driveId === "id-keyterm"), false);
  assert.equal(plan.counts.redactedSharedKeytermsRows, 1);
});

test("rejects traversal, embedded roots, type conflicts, and case collisions", () => {
  const base = {
    driveId: "safe-id",
    type: "swf",
    size: "1",
    sha256: "a".repeat(64),
  };
  assert.throws(
    () => normalizeInventoryRows([{ ...base, relativePath: "../ELMGR4/file.swf" }]),
    /traversal/,
  );
  assert.throws(
    () =>
      normalizeInventoryRows([
        {
          ...base,
          relativePath: "HELP_ELM_FINAL_Dec21_2015/HELP_COURSES/ELMGR4/L1/IN/L1IN01.swf",
        },
      ]),
    /strip-prefix/,
  );
  assert.throws(
    () =>
      normalizeInventoryRows([
        {
          ...base,
          relativePath: "HELP_COURSES/ELMGR4/L1/IN/L1IN01.mp3",
        },
      ]),
    /conflicts/,
  );
  assert.throws(
    () =>
      normalizeInventoryRows([
        { ...base, relativePath: "HELP_COURSES/ELMGR4/L1/IN/File.swf" },
        {
          ...base,
          driveId: "safe-id-2",
          relativePath: "HELP_COURSES/ELMGR4/L1/IN/file.swf",
        },
      ]),
    /collide by case/,
  );
});

test("applies one explicit Drive-root prefix to every row", () => {
  const normalized = normalizeInventoryRows(
    [
      {
        driveId: "prefixed-id",
        relativePath: "HELP_ELM_FINAL_Dec21_2015/HELP_COURSES/ELMGR4/L12/index_local.swf",
        type: "swf",
        size: "20",
      },
    ],
    { stripPrefix: "HELP_ELM_FINAL_Dec21_2015" },
  );
  assert.equal(
    normalized.records[0].canonicalPath,
    "HELP_COURSES/ELMGR4/L12/index_local.swf",
  );
});

test("matches optional historical bytes without emitting historical paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-drive-history-"));
  try {
    const nested = path.join(root, "private", "legacy");
    await mkdir(nested, { recursive: true });
    const historicalBytes = "historical-swf-bytes";
    const historicalPath = path.join(nested, "Recovered Name.swf");
    await writeFile(historicalPath, historicalBytes);
    await symlink(historicalPath, path.join(root, "ignored-link.swf"));
    const digest = createHash("sha256").update(historicalBytes).digest("hex");
    const rows = [
      {
        driveId: "historical-id",
        relativePath: "HELP_COURSES/ELMGR4/L4/TS/L4TS01.swf",
        type: "swf",
        size: String(Buffer.byteLength(historicalBytes)),
        sha256: digest,
      },
      {
        driveId: "historical-md5-id",
        relativePath: "HELP_COURSES/ELMGR4/L4/TS/L4TS02.swf",
        type: "swf",
        size: String(Buffer.byteLength(historicalBytes)),
        md5: createHash("md5").update(historicalBytes).digest("hex"),
      },
    ];
    const normalized = normalizeInventoryRows(rows);
    const historical = await scanHistoricalRoot(root, normalized.records);
    const plan = reconcileInventory(rows, catalogFixture(), {
      historicalBySha256: historical.bySha256,
      historicalByMd5: historical.byMd5,
      historicalScan: historical.summary,
    });
    const shaMatch = plan.records.find((record) => record.driveId === "historical-id");
    const md5Match = plan.records.find((record) => record.driveId === "historical-md5-id");
    assert.equal(shaMatch.identityStatus, "historical-hash-duplicate");
    assert.equal(
      shaMatch.disposition,
      "use-local-historical-candidate-after-custody-review",
    );
    assert.equal(md5Match.identityStatus, "historical-md5-candidate-needs-sha256");
    assert.equal(md5Match.downloadDecision, "download");
    assert.equal(md5Match.disposition, "download-to-quarantine-for-sha256-verification");
    assert.equal(plan.inputs.historicalScan.skippedSymlinkCount, 1);
    assert.match(shaMatch.historicalHashMatches[0], /^historical-[a-f0-9]{20}$/);
    assert.match(md5Match.historicalMd5Matches[0], /^historical-[a-f0-9]{20}$/);
    assert.doesNotMatch(JSON.stringify(plan), /private|Recovered Name|help-math-drive-history/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("refuses to write plans inside the repository or historical source root", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-drive-output-"));
  try {
    const inventoryPath = path.join(tempRoot, "inventory.json");
    const catalogPath = path.join(tempRoot, "catalog.json");
    const historicalRoot = path.join(tempRoot, "historical");
    await mkdir(historicalRoot);
    assert.throws(
      () =>
        validateOutputPaths({
          inventoryPath,
          catalogPath,
          historicalRoot,
          outputJson: path.join(scriptDirectory, "unsafe-plan.json"),
          outputCsv: path.join(tempRoot, "safe.csv"),
        }),
      /outside the HELP Math repository/,
    );
    assert.throws(
      () =>
        validateOutputPaths({
          inventoryPath,
          catalogPath,
          historicalRoot,
          outputJson: path.join(historicalRoot, "unsafe.json"),
          outputCsv: path.join(tempRoot, "safe.csv"),
        }),
      /historical root/,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
