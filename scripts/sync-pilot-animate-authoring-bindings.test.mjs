import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import test from "node:test";
import {PNG} from "pngjs";

import {
  AUTHORING_AUDIT_FILE,
  AUTHORING_AUDIT_SCHEMA_VERSION,
  AUTHORING_CONTRACT_STATUS,
  AUTHORING_EVIDENCE_KIND,
  EXPECTED_ANIMATE_VERSION,
  parseArguments,
  syncPilotAnimateAuthoringBindings,
} from "./sync-pilot-animate-authoring-bindings.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function png(width, height) {
  const image = new PNG({width, height});
  image.data.fill(0xff);
  return PNG.sync.write(image);
}

function idatDataRange(bytes) {
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") return {start: offset + 8, length};
    offset += 12 + length;
  }
  throw new Error("fixture PNG has no IDAT chunk");
}

function withoutBinding(manifest) {
  const clone = structuredClone(manifest);
  delete clone.audit.machineEvidence.authoringEvidence;
  return clone;
}

async function createRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-binding-sync-"));
  await mkdir(path.join(root, "scripts"), {recursive: true});
  await mkdir(path.join(root, "source-assets", "flash"), {recursive: true});
  const auditScript = Buffer.from("current recursive JSFL fixture\n");
  await writeFile(path.join(root, "scripts", "animate-audit-current-document.jsfl"), auditScript);
  return {root, auditScript};
}

async function addPilot(context, id, {binding = null, auditMutation = null} = {}) {
  const {root, auditScript} = context;
  const fla = `source-assets/flash/${id}.fla`;
  const sourceBytes = Buffer.from(`legacy FLA bytes for ${id}`);
  const flaSha256 = hash(sourceBytes);
  const migrationDir = path.join(root, "migrations", id);
  const auditDir = path.join(migrationDir, "audit");
  const workingCopyRelative = `work/animate/read-only-fla-copies/${id}/${id}.fla`;
  const workingCopy = path.join(root, workingCopyRelative);
  await mkdir(auditDir, {recursive: true});
  await mkdir(path.dirname(workingCopy), {recursive: true});
  await writeFile(path.join(root, fla), sourceBytes);
  await writeFile(workingCopy, sourceBytes);
  await chmod(workingCopy, 0o444);

  const frameRelative = "audit/adobe-animate-2021-authoring-frame-0002.png";
  const frameBytes = png(10, 8);
  await writeFile(path.join(migrationDir, frameRelative), frameBytes);

  const audit = {
    schemaVersion: AUTHORING_AUDIT_SCHEMA_VERSION,
    evidenceKind: AUTHORING_EVIDENCE_KIND,
    authority: "Original owner-provided FLA inspected read-only in Adobe Animate 2021",
    animationId: id,
    capturedAt: "2026-07-22T01:02:03.000Z",
    animateVersion: EXPECTED_ANIMATE_VERSION,
    protocol: {
      coldStartPerFla: true,
      openedWithoutSaving: true,
      originalSourceHashVerified: true,
      readOnlyWorkingCopyRequired: true,
      readOnlyWorkingCopyPathVerified: true,
      readOnlyWorkingCopyHashVerifiedAtFinalize: true,
      readOnlyWorkingCopyPermissionsVerifiedAtFinalize: true,
      recursiveLibraryTimelineAuditRequired: true,
      recursiveLibraryTimelineAuditVerified: true,
    },
    auditScript: {
      file: "scripts/animate-audit-current-document.jsfl",
      sha256: hash(auditScript),
    },
    source: {
      fla,
      flaSha256,
      workingCopy: {
        path: workingCopyRelative,
        sha256: flaSha256,
        bytes: sourceBytes.length,
        readOnlyAtFinalize: true,
        byteIdenticalToSourceAtFinalize: true,
      },
    },
    nativeMovie: {width: 10, height: 8, fps: 12, frameCount: 2},
    capturedAuthoringFrame: {
      flashFrame: 2,
      file: frameRelative,
      sha256: hash(frameBytes),
      width: 10,
      height: 8,
    },
    rawAuditSha256: "a".repeat(64),
    authoringAudit: {
      schemaVersion: 1,
      evidenceKind: "adobe-animate-authoring-audit",
      recursiveLibraryTimelineAudit: true,
      document: {
        name: `${id}.fla`,
        pathURI: pathToFileURL(workingCopy).href,
        width: 10,
        height: 8,
        frameRate: 12,
      },
      timeline: {
        frameCount: 2,
        layers: [{keyframes: [{elements: []}]}],
      },
      library: [{timeline: {layers: [{keyframes: [{elements: []}]}]}}],
    },
    limitations: ["fixture does not promote acceptance"],
  };
  if (auditMutation) auditMutation(audit);
  const auditText = `${JSON.stringify(audit, null, 2)}\n`;
  await writeFile(path.join(migrationDir, AUTHORING_AUDIT_FILE), auditText);

  const machineEvidence = {
    authoringInspectionStatus: "legacy-field-preserved",
    limitations: ["preserve this exact field"],
    report: "audit/machine/report.json",
    runtimeCrossCheckPassed: true,
    sourceHashVerified: true,
    status: "partial",
  };
  if (binding !== null) {
    machineEvidence.authoringEvidence = binding;
    const reordered = {authoringEvidence: machineEvidence.authoringEvidence};
    for (const [key, value] of Object.entries(machineEvidence)) if (key !== "authoringEvidence") reordered[key] = value;
    Object.keys(machineEvidence).forEach((key) => delete machineEvidence[key]);
    Object.assign(machineEvidence, reordered);
  }
  const manifest = {
    acceptance: {humanReview: {status: "accepted", reviewer: "Owner"}, ownerReview: {status: "accepted"}},
    animationId: id,
    audit: {machineEvidence, untouchedAuditField: {keep: true}},
    id,
    implementation: {renderer: "fixture-renderer", complete: false},
    runtime: {stage: {width: 10, height: 8}, fps: 12, frameCount: 2},
    source: {pairedFlaStatus: "present", fla, flaSha256},
    status: "validating",
    trailingField: "retain insertion order",
  };
  const manifestPath = path.join(migrationDir, "migration.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const pilot = {id, fla, swf: `source-assets/flash/${id}.swf`};
  return {
    id,
    pilot,
    manifestPath,
    sourcePath: path.join(root, fla),
    auditPath: path.join(migrationDir, AUTHORING_AUDIT_FILE),
    framePath: path.join(migrationDir, frameRelative),
  };
}

async function replaceAuthoringFrame(fixture, bytes) {
  await writeFile(fixture.framePath, bytes);
  const audit = JSON.parse(await readFile(fixture.auditPath, "utf8"));
  audit.capturedAuthoringFrame.sha256 = hash(bytes);
  await writeFile(fixture.auditPath, `${JSON.stringify(audit, null, 2)}\n`);
}

test("CLI parsing is explicit and fail closed", () => {
  assert.deepEqual(parseArguments(["--id", "one", "--id", "two", "--check"]), {
    ids: ["one", "two"],
    check: true,
    help: false,
  });
  assert.throws(() => parseArguments(["--id"]), /requires an animation ID/);
  assert.throws(() => parseArguments(["--write-acceptance"]), /Unknown option/);
});

test("replaces a legacy binding while preserving key order and every unrelated manifest field", async () => {
  const context = await createRoot();
  const legacy = {
    animateVersion: EXPECTED_ANIMATE_VERSION,
    file: AUTHORING_AUDIT_FILE,
    openedWithoutSaving: true,
    sha256: "b".repeat(64),
    ownerNote: "must survive",
  };
  const fixture = await addPilot(context, "formula-pilot", {binding: legacy});
  const beforeText = await readFile(fixture.manifestPath, "utf8");
  const before = JSON.parse(beforeText);
  const beforeRootKeys = Object.keys(before);
  const beforeMachineKeys = Object.keys(before.audit.machineEvidence);
  const beforeBindingKeys = Object.keys(before.audit.machineEvidence.authoringEvidence);

  const plans = await syncPilotAnimateAuthoringBindings({root: context.root, pilots: [fixture.pilot]});
  assert.equal(plans.length, 1);
  assert.equal(plans[0].changed, true);
  const after = JSON.parse(await readFile(fixture.manifestPath, "utf8"));
  const binding = after.audit.machineEvidence.authoringEvidence;
  assert.equal(binding.schemaVersion, 2);
  assert.equal(binding.evidenceKind, AUTHORING_EVIDENCE_KIND);
  assert.equal(binding.status, AUTHORING_CONTRACT_STATUS);
  assert.equal(binding.sha256, hash(await readFile(fixture.auditPath)));
  assert.equal(binding.ownerNote, "must survive");
  assert.deepEqual(Object.keys(after), beforeRootKeys);
  assert.deepEqual(Object.keys(after.audit.machineEvidence), beforeMachineKeys);
  assert.deepEqual(Object.keys(binding).slice(0, beforeBindingKeys.length), beforeBindingKeys);
  assert.deepEqual(withoutBinding(after), withoutBinding(before));
  await syncPilotAnimateAuthoringBindings({root: context.root, pilots: [fixture.pilot], check: true});
});

test("adds a missing binding without moving or changing existing machine-evidence fields", async () => {
  const context = await createRoot();
  const fixture = await addPilot(context, "keyterm-pilot");
  const before = JSON.parse(await readFile(fixture.manifestPath, "utf8"));
  const beforeMachineKeys = Object.keys(before.audit.machineEvidence);
  await syncPilotAnimateAuthoringBindings({root: context.root, pilots: [fixture.pilot]});
  const after = JSON.parse(await readFile(fixture.manifestPath, "utf8"));
  assert.deepEqual(Object.keys(after.audit.machineEvidence).slice(0, -1), beforeMachineKeys);
  assert.equal(Object.keys(after.audit.machineEvidence).at(-1), "authoringEvidence");
  assert.deepEqual(withoutBinding(after), withoutBinding(before));
  assert.equal(after.acceptance.humanReview.reviewer, "Owner");
  assert.equal(after.status, "validating");
});

test("check mode reports a stale binding and writes nothing", async () => {
  const context = await createRoot();
  const fixture = await addPilot(context, "stale-pilot", {binding: {sha256: "c".repeat(64)}});
  const before = await readFile(fixture.manifestPath, "utf8");
  await assert.rejects(
    syncPilotAnimateAuthoringBindings({root: context.root, pilots: [fixture.pilot], check: true}),
    /bindings are stale for: stale-pilot/,
  );
  assert.equal(await readFile(fixture.manifestPath, "utf8"), before);
});

test("rejects a truncated authoring PNG even when its hash and IHDR dimensions are pinned", async () => {
  const context = await createRoot();
  const fixture = await addPilot(context, "truncated-png-pilot", {binding: {sha256: "c".repeat(64)}});
  const valid = await readFile(fixture.framePath);
  const idat = idatDataRange(valid);
  const truncated = valid.subarray(0, idat.start + Math.max(1, Math.floor(idat.length / 2)));
  assert.equal(truncated.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(truncated.readUInt32BE(16), 10);
  assert.equal(truncated.readUInt32BE(20), 8);
  await replaceAuthoringFrame(fixture, truncated);
  const before = await readFile(fixture.manifestPath, "utf8");
  await assert.rejects(
    syncPilotAnimateAuthoringBindings({root: context.root, pilots: [fixture.pilot]}),
    /PNG is not fully decodable/,
  );
  assert.equal(await readFile(fixture.manifestPath, "utf8"), before);
});

test("rejects corrupt IDAT bytes even when the PNG signature, dimensions, and file hash match", async () => {
  const context = await createRoot();
  const fixture = await addPilot(context, "corrupt-png-pilot", {binding: {sha256: "c".repeat(64)}});
  const corrupt = Buffer.from(await readFile(fixture.framePath));
  const idat = idatDataRange(corrupt);
  corrupt[idat.start] ^= 0xff;
  assert.equal(corrupt.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(corrupt.readUInt32BE(16), 10);
  assert.equal(corrupt.readUInt32BE(20), 8);
  await replaceAuthoringFrame(fixture, corrupt);
  const before = await readFile(fixture.manifestPath, "utf8");
  await assert.rejects(
    syncPilotAnimateAuthoringBindings({root: context.root, pilots: [fixture.pilot]}),
    /PNG is not fully decodable/,
  );
  assert.equal(await readFile(fixture.manifestPath, "utf8"), before);
});

test("preflights the selected transaction and writes nothing when a later source hash is invalid", async () => {
  const context = await createRoot();
  const first = await addPilot(context, "first-pilot", {binding: {sha256: "d".repeat(64)}});
  const second = await addPilot(context, "second-pilot", {binding: {sha256: "e".repeat(64)}});
  const firstBefore = await readFile(first.manifestPath, "utf8");
  const secondBefore = await readFile(second.manifestPath, "utf8");
  await writeFile(second.sourcePath, "mutated source bytes");
  await assert.rejects(
    syncPilotAnimateAuthoringBindings({root: context.root, pilots: [first.pilot, second.pilot]}),
    /no manifests were written[\s\S]*source FLA bytes differ/,
  );
  assert.equal(await readFile(first.manifestPath, "utf8"), firstBefore);
  assert.equal(await readFile(second.manifestPath, "utf8"), secondBefore);
});

test("rolls back every manifest when a later atomic replacement fails", async () => {
  const context = await createRoot();
  const first = await addPilot(context, "rollback-first-pilot", {binding: {sha256: "1".repeat(64)}});
  const second = await addPilot(context, "rollback-second-pilot", {binding: {sha256: "2".repeat(64)}});
  const firstBefore = await readFile(first.manifestPath, "utf8");
  const secondBefore = await readFile(second.manifestPath, "utf8");
  await assert.rejects(
    syncPilotAnimateAuthoringBindings({
      root: context.root,
      pilots: [first.pilot, second.pilot],
      transactionHooks: {
        beforeCommitEntry: (_plan, index) => {
          if (index === 1) throw new Error("injected second-manifest replacement failure");
        },
      },
    }),
    /injected second-manifest replacement failure/,
  );
  assert.equal(await readFile(first.manifestPath, "utf8"), firstBefore);
  assert.equal(await readFile(second.manifestPath, "utf8"), secondBefore);
});

test("preserves concurrent manifest bytes and the original backup when rollback cannot safely restore", async () => {
  const context = await createRoot();
  const first = await addPilot(context, "rollback-concurrent-first", {binding: {sha256: "3".repeat(64)}});
  const second = await addPilot(context, "rollback-concurrent-second", {binding: {sha256: "4".repeat(64)}});
  const firstBefore = await readFile(first.manifestPath, "utf8");
  const concurrentText = "concurrent writer owns these bytes\n";
  let preservedBackup;

  await assert.rejects(
    syncPilotAnimateAuthoringBindings({
      root: context.root,
      pilots: [first.pilot, second.pilot],
      transactionHooks: {
        beforeCommitEntry: async (plan, index) => {
          if (index === 0) {
            preservedBackup = plan.backup;
            return;
          }
          await writeFile(first.manifestPath, concurrentText);
          throw new Error("injected failure after concurrent first-manifest update");
        },
      },
    }),
    /Animate binding transaction rollback failed:[\s\S]*preserving concurrent target bytes/,
  );

  assert.equal(await readFile(first.manifestPath, "utf8"), concurrentText);
  assert.equal(await readFile(preservedBackup, "utf8"), firstBefore);
});

test("rejects legacy schemas, incomplete protocol status, and non-relative evidence paths", async (t) => {
  const cases = [
    {
      name: "schema-v1",
      mutate: (audit) => { audit.schemaVersion = 1; },
      message: /must be schema v2/,
    },
    {
      name: "incomplete-protocol",
      mutate: (audit) => { audit.protocol.recursiveLibraryTimelineAuditVerified = false; },
      message: /protocol flag recursiveLibraryTimelineAuditVerified is not true/,
    },
    {
      name: "absolute-frame",
      mutate: (audit) => { audit.capturedAuthoringFrame.file = "/tmp/forbidden.png"; },
      message: /authoring frame: path must be portable and relative/,
    },
  ];
  for (const item of cases) {
    await t.test(item.name, async () => {
      const context = await createRoot();
      const fixture = await addPilot(context, `${item.name}-pilot`, {binding: {sha256: "f".repeat(64)}, auditMutation: item.mutate});
      const before = await readFile(fixture.manifestPath, "utf8");
      await assert.rejects(
        syncPilotAnimateAuthoringBindings({root: context.root, pilots: [fixture.pilot]}),
        item.message,
      );
      assert.equal(await readFile(fixture.manifestPath, "utf8"), before);
    });
  }
});
