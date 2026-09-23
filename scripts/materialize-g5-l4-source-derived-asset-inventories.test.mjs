import assert from "node:assert/strict";
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  ASSET_HEADERS,
  RELEASE_ID,
  inspectOutput,
  materializeG5L4SourceDerivedAssetInventories,
  parseArguments,
  renderSourceDerivedAssetInventory,
  sha256,
  validateSourceDerivedAssetInventory,
  writeAssetInventoryTransaction,
} from "./materialize-g5-l4-source-derived-asset-inventories.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const INDEX_SHA = "a".repeat(64);

function sourceDefinition(overrides = {}) {
  return {
    asset_id: "swf-definition-00011",
    swf_character_id: "1",
    library_symbol: "Bauhaus Md BT",
    type: "font",
    source_file:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/IN/L4IN02.swf",
    source_frame: "",
    exported_file: "",
    sha256: "b".repeat(64),
    format: "DefineFont2",
    dimensions_or_bounds: "",
    font_glyphs: "35",
    transformation: "none; machine census only; no renderer export",
    confidence: "machine-extracted-definition-candidate",
    license_or_provenance: "owner-provided SWF",
    notes:
      `container=root; definitionDepth=0; tagOrdinal=11; payloadBytes=100; ` +
      `rawTagPayloadSha256=${"b".repeat(64)}; ` +
      `exactTagIdentitySha256=${"c".repeat(64)}; runtime reachability unresolved; ` +
      "placement and bounds unresolved; renderer suitability unresolved",
    ...overrides,
  };
}

test("CLI is fixed to one full-release dry-run, apply, or check mode", () => {
  assert.deepEqual(parseArguments([]).mode, "dry-run");
  assert.deepEqual(parseArguments(["--apply"]).mode, "apply");
  assert.deepEqual(parseArguments(["--check"]).mode, "check");
  assert.throws(() => parseArguments(["--apply", "--check"]),
    /choose only one execution mode/);
  assert.throws(() => parseArguments(["--id", "course-g05-l04-in-002"]),
    /unknown option/);
  assert.throws(() => parseArguments(["--publish"]), /unknown option/);
});

test("source-definition projection is hash-bound and explicitly non-authoritative", () => {
  const definitionIndexPath =
    "migrations/course-g05-l04-in-002/audit/machine/" +
    "g5-l4-pre-runtime-swf-definition-inventory.csv";
  const definitions = [sourceDefinition()];
  const bytes = renderSourceDerivedAssetInventory({
    animationId: "course-g05-l04-in-002",
    definitionIndexPath,
    definitionIndexSha256: INDEX_SHA,
    definitionRows: definitions,
  });
  const validated = validateSourceDerivedAssetInventory({
    animationId: "course-g05-l04-in-002",
    definitionIndexPath,
    definitionIndexSha256: INDEX_SHA,
    expectedRows: definitions,
    bytes,
  });
  assert.equal(validated.rows.length, 1);
  const row = validated.rows[0];
  assert.equal(row.asset_id, definitions[0].asset_id);
  assert.equal(row.library_symbol, "");
  assert.equal(row.source_frame, "");
  assert.equal(row.dimensions_or_bounds, "");
  assert.equal(row.exported_file, definitionIndexPath);
  assert.equal(row.sha256, INDEX_SHA);
  assert.match(row.type, /^structural-font-definition-candidate$/);
  assert.match(row.notes, /not a visual or renderer asset export/);
  assert.match(row.notes, /not an authoritative original-runtime baseline/);
  assert.match(row.notes, /establishes no runtime reachability/);
  assert.match(row.notes, /human or owner acceptance/);
  assert.match(row.notes, /strict completion/);
  assert.match(row.notes, /publication/);

  const forged = Buffer.from(bytes.toString("utf8").replace(
    "not an authoritative original-runtime baseline",
    "an authoritative baseline",
  ));
  assert.throws(() => validateSourceDerivedAssetInventory({
    animationId: "course-g05-l04-in-002",
    definitionIndexPath,
    definitionIndexSha256: INDEX_SHA,
    expectedRows: definitions,
    bytes: forged,
  }), /crossed the structural evidence boundary/);
});

test("full G5 L4 plan deterministically covers 55 members and 12,066 definitions", async () => {
  const before = await Promise.all([
    readFile(path.join(projectRoot, "catalog/completion-ledger.json")),
    readFile(path.join(projectRoot, "catalog/lesson-release-ledger.json")),
  ]);
  const first = await materializeG5L4SourceDerivedAssetInventories({
    root: projectRoot,
    mode: "dry-run",
  });
  const second = await materializeG5L4SourceDerivedAssetInventories({
    root: projectRoot,
    mode: "dry-run",
  });
  assert.equal(first.releaseId, RELEASE_ID);
  assert.equal(first.memberCount, 55);
  assert.equal(first.assetInventoryCount, 55);
  assert.equal(first.successorReceiptCount, 55);
  assert.equal(first.managedOutputCount, 110);
  assert.equal(first.definitionCandidateRowCount, 12066);
  assert.deepEqual(first.members, second.members);
  assert.deepEqual(first.evidenceBoundary, {
    structuralStaticCandidateOnly: true,
    authoritativeOriginalRuntimeBaseline: false,
    rendererAssetExport: false,
    runtimeReachabilityOrPlacement: false,
    assetUsageOrVisualConfirmation: false,
    humanOrOwnerAcceptance: false,
    strictComplete: false,
    published: false,
  });
  assert.equal(first.sourceAssetsChanged, false);
  assert.equal(first.migrationManifestsChanged, false);
  assert.equal(first.completionLedgersChanged, false);
  assert.equal(first.strictAcceptanceEffect, "none");
  const after = await Promise.all([
    readFile(path.join(projectRoot, "catalog/completion-ledger.json")),
    readFile(path.join(projectRoot, "catalog/lesson-release-ledger.json")),
  ]);
  assert.deepEqual(after, before);
});

test("checked-in canonical candidates and receipts are current", async () => {
  const result = await materializeG5L4SourceDerivedAssetInventories({
    root: projectRoot,
    mode: "check",
  });
  assert.equal(result.staleOutputCount, 0);
  assert.equal(result.changedOutputCount, 0);
  assert.equal(result.definitionCandidateRowCount, 12066);
});

test("transaction rolls back an earlier asset file if a later install fails", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g5-l4-assets-"));
  try {
    await mkdir(path.join(root, "migrations/member/audit/machine"), {
      recursive: true,
    });
    const firstPath = "migrations/member/asset-inventory.csv";
    const secondPath =
      "migrations/member/audit/machine/" +
      "g5-l4-source-derived-asset-inventory-candidate-receipt.json";
    const prior = Buffer.from("prior\n");
    await writeFile(path.join(root, firstPath), prior, {mode: 0o644});
    const allowed = new Set([firstPath, secondPath]);
    const outputs = [
      await inspectOutput(root, firstPath, Buffer.from("next\n"), allowed),
      await inspectOutput(root, secondPath, Buffer.from("receipt\n"), allowed),
    ];
    await assert.rejects(
      writeAssetInventoryTransaction(outputs, {
        transactionHooks: {
          beforeCommit({index}) {
            if (index === 1) throw new Error("injected failure");
          },
        },
      }),
      /injected failure/,
    );
    assert.deepEqual(await readFile(path.join(root, firstPath)), prior);
    await assert.rejects(lstat(path.join(root, secondPath)), {code: "ENOENT"});
    const residue = (await readdir(path.join(root, "migrations/member")))
      .filter((entry) => entry.includes(".desired-") || entry.includes(".backup-"));
    assert.deepEqual(residue, []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("output preflight rejects symbolic and multiply linked canonical targets", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g5-l4-assets-links-"));
  try {
    await mkdir(path.join(root, "migrations/member"), {recursive: true});
    const target = path.join(root, "target.txt");
    await writeFile(target, "protected\n");
    const relative = "migrations/member/asset-inventory.csv";
    const destination = path.join(root, relative);
    const allowed = new Set([relative]);
    await symlink(target, destination);
    await assert.rejects(
      inspectOutput(root, relative, Buffer.from("candidate\n"), allowed),
      /ordinary single-link file/,
    );
    await rm(destination);
    await link(target, destination);
    await assert.rejects(
      inspectOutput(root, relative, Buffer.from("candidate\n"), allowed),
      /ordinary single-link file/,
    );
    assert.equal(sha256(await readFile(target)), sha256(Buffer.from("protected\n")));
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
