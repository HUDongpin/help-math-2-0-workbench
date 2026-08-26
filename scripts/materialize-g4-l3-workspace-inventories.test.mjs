import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  assertLegacyCanonicalOwnership,
  materializeG4L3WorkspaceInventories,
  parseArguments,
  renderCanonicalAudioPreimage,
  validateMaterializationReceipt,
} from "./materialize-g4-l3-workspace-inventories.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("CLI keeps check, dry-run, and repository-root modes explicit", () => {
  assert.deepEqual(parseArguments([]), {check: false, dryRun: false, root});
  assert.deepEqual(parseArguments(["--check", "--root", "/tmp/example"]), {
    check: true,
    dryRun: false,
    root: "/tmp/example",
  });
  assert.equal(parseArguments(["--dry-run"]).dryRun, true);
  assert.throws(() => parseArguments(["--check", "--dry-run"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("dry-run validates the exact 40-member inventory scope without writing", async () => {
  const result = await materializeG4L3WorkspaceInventories({root, dryRun: true});
  assert.deepEqual(result, {
    check: false,
    dryRun: true,
    members: 40,
    outputs: 120,
    canonicalInventoryRestorations: 0,
    canonicalInventoryFilesChanged: false,
    assetDefinitionRows: 8068,
    embeddedAudioRows: 359,
    catalogAudioAssociationRows: 359,
    strictAcceptanceEffect: "none",
  });
});

test("machine inventories are byte-bound while canonical inventories retain exact owner-workspace bytes", async () => {
  const releases = JSON.parse(await readFile(path.join(root, "catalog/lesson-releases.json"), "utf8"));
  const members = releases.releases.find(({releaseId}) =>
    releaseId === "lesson-g04-l03-negative-numbers").members;
  const canonicalAssetTemplate = await readFile(
    path.join(root, "templates/flash-migration/asset-inventory.csv"),
  );
  let assetRows = 0;
  let catalogRows = 0;
  let embeddedRows = 0;
  for (const member of members) {
    const base = path.join(root, "migrations", member.animationId);
    const [assetBytes, audioBytes, canonicalAssetBytes, canonicalAudioBytes, manifestBytes, receiptBytes] = await Promise.all([
      readFile(path.join(base, "audit/machine/g4-l3-swf-definition-inventory.csv")),
      readFile(path.join(base, "audit/machine/g4-l3-audio-source-candidates.csv")),
      readFile(path.join(base, "asset-inventory.csv")),
      readFile(path.join(base, "audio-inventory.csv")),
      readFile(path.join(base, "migration.json")),
      readFile(path.join(base, "audit/machine/g4-l3-inventory-materialization.json")),
    ]);
    const manifest = JSON.parse(manifestBytes);
    const receipt = validateMaterializationReceipt(JSON.parse(receiptBytes));
    assert.equal(receipt.animationId, member.animationId);
    assert.equal(receipt.assetId, member.assetId);
    assert.equal(receipt.outputs.assetDefinitionInventory.sha256, sha256(assetBytes));
    assert.equal(receipt.outputs.audioSourceCandidateInventory.sha256, sha256(audioBytes));
    assert.equal(receipt.outputs.assetDefinitionInventory.bytes, assetBytes.length);
    assert.equal(receipt.outputs.audioSourceCandidateInventory.bytes, audioBytes.length);
    if (member.animationId === "shell-course-g04-l03-index-local") {
      assert.notDeepEqual(canonicalAssetBytes, canonicalAssetTemplate);
      assert.match(canonicalAssetBytes.toString("utf8"), /ffdec-root-frame-assets/);
    } else if (member.animationId === "course-g04-l03-ts-006") {
      assert.notDeepEqual(canonicalAssetBytes, canonicalAssetTemplate);
      assert.match(canonicalAssetBytes.toString("utf8"), /ts006-source-static-canvas-runtime/);
      assert.match(canonicalAssetBytes.toString("utf8"), /ts006-source-static-canvas-manifest/);
      assert.doesNotMatch(canonicalAssetBytes.toString("utf8"), /strict-complete|owner-accepted/);
    } else {
      assert.deepEqual(canonicalAssetBytes, canonicalAssetTemplate);
    }
    if (member.animationId === "shell-course-g04-l03-index-local") {
      assert.match(canonicalAudioBytes.toString("utf8"), /embedded-define-sound-0001/);
      assert.equal(canonicalAudioBytes.toString("utf8").split("\n").length - 2, 16);
    } else if (member.animationId === "course-g04-l03-ts-006") {
      const canonicalAudioText = canonicalAudioBytes.toString("utf8");
      const canonicalAudioRows = canonicalAudioText.trimEnd().split("\n").slice(1);
      const catalogAssociation = manifest.audio.catalogExactAssociations[0];
      assert.equal(canonicalAudioRows.length, 2);
      assert.ok(canonicalAudioRows[0].startsWith(
        `catalog-audio-001,es,${catalogAssociation.sourceFile},${catalogAssociation.sha256},,,host-user-activated,7632,mp3,1,48000,,`,
      ));
      assert.ok(canonicalAudioRows[1].startsWith(
        `embedded-stream-0001,und,${manifest.source.swf},${manifest.source.swfSha256},,,interaction-state,10632,swf-mp3-stream,1,22050,23,`,
      ));
      const audioAudit = JSON.parse(await readFile(
        path.join(base, "audit/audio-runtime-evidence.json"),
        "utf8",
      ));
      assert.equal(audioAudit.animationId, member.animationId);
      assert.equal(audioAudit.generatedBy, "scripts/audit-pilot-audio.mjs");
      assert.equal(audioAudit.source.hashMatches, true);
      assert.equal(audioAudit.source.observedSha256, manifest.source.swfSha256);
      assert.equal(audioAudit.inventory.file, "audio-inventory.csv");
      assert.equal(audioAudit.inventory.rowCount, 2);
      assert.equal(audioAudit.inventory.exactExternalRows, 1);
      assert.equal(audioAudit.inventory.embeddedRows, 1);
      assert.equal(audioAudit.externalAudio.exactAssociations[0].observedSha256,
        catalogAssociation.sha256);
      assert.equal(audioAudit.externalAudio.exactAssociations[0].hashMatchesCatalog, true);
      assert.equal(audioAudit.embeddedAudio.soundStreams[0].context.characterId, 23);
      assert.equal(audioAudit.embeddedAudio.soundStreams[0].blockCount, 128);
      assert.equal(audioAudit.acceptance.authoritativeListeningComplete, false);
      assert.equal(audioAudit.acceptance.hostStateTraversalComplete, false);
      assert.equal(audioAudit.acceptance.synchronizationComplete, false);
      assert.equal(audioAudit.acceptance.strictAudioAcceptance, "pending");
    } else {
      assert.equal(canonicalAudioBytes.toString("utf8"), renderCanonicalAudioPreimage(manifest));
    }
    assert.equal(receipt.canonicalInventoryFiles.assetInventory.sha256, sha256(canonicalAssetBytes));
    assert.equal(receipt.canonicalInventoryFiles.audioInventory.sha256, sha256(canonicalAudioBytes));
    assert.equal(receipt.canonicalInventoryFiles.assetInventory.changedByMaterializer, false);
    assert.equal(receipt.canonicalInventoryFiles.audioInventory.changedByMaterializer, false);
    assert.equal(assetBytes.toString("utf8").split("\n").length - 2,
      receipt.outputs.assetDefinitionInventory.rowCount);
    assert.match(assetBytes.toString("utf8"), /^asset_id,swf_character_id,/);
    assert.match(audioBytes.toString("utf8"), /^cue_id,language,source_file,/);
    assert.doesNotMatch(audioBytes.toString("utf8"), /accepted|authoritative runtime established/i);
    assetRows += receipt.outputs.assetDefinitionInventory.rowCount;
    catalogRows += receipt.outputs.audioSourceCandidateInventory.catalogAssociationRows;
    embeddedRows += receipt.outputs.audioSourceCandidateInventory.embeddedAudioRows;
  }
  assert.equal(assetRows, 8068);
  assert.equal(catalogRows, 359);
  assert.equal(embeddedRows, 359);
});

test("receipt validator fails closed on acceptance or fingerprint drift", async () => {
  const receiptPath = path.join(
    root,
    "migrations/course-g04-l03-rw-002/audit/machine/g4-l3-inventory-materialization.json",
  );
  const original = JSON.parse(await readFile(receiptPath, "utf8"));
  const promoted = structuredClone(original);
  promoted.acceptance.authoritativeRuntimeComplete = true;
  assert.throws(() => validateMaterializationReceipt(promoted), /promoted acceptance/);
  const stale = structuredClone(original);
  stale.outputs.assetDefinitionInventory.rowCount += 1;
  assert.throws(() => validateMaterializationReceipt(stale), /fingerprint is stale/);
});

test("legacy recovery refuses canonical bytes that are not owned by the receipt", () => {
  const currentBytes = Buffer.from("unexpected user content\n");
  const report = {
    animationId: "course-g04-l03-rw-002",
    assetId: `swf-${"1".repeat(64)}`,
    outputs: {
      assetInventory: {
        path: "migrations/course-g04-l03-rw-002/asset-inventory.csv",
        bytes: 12,
        sha256: "0".repeat(64),
      },
    },
  };
  assert.throws(() => assertLegacyCanonicalOwnership({
    report,
    member: {animationId: report.animationId, assetId: report.assetId},
    outputKey: "assetInventory",
    relativePath: report.outputs.assetInventory.path,
    currentBytes,
  }), /refusing to restore unowned canonical inventory/);
});

test("check mode deterministically reproduces all 120 bounded outputs", async () => {
  const result = await materializeG4L3WorkspaceInventories({root, check: true});
  assert.equal(result.check, true);
  assert.equal(result.members, 40);
  assert.equal(result.outputs, 120);
  assert.equal(result.canonicalInventoryRestorations, 0);
  assert.equal(result.canonicalInventoryFilesChanged, false);
  assert.equal(result.strictAcceptanceEffect, "none");
});
