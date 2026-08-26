import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {buildReport, parseArguments, renderMarkdown} from "./build-pilot-animate-authoring-index.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function png(width, height) {
  const bytes = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

async function fixture({legacy = false} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-pilot-index-"));
  const flaPilot = {id: "pilot-fla", fla: "source-assets/flash/Test.fla", swf: "source-assets/flash/Test.swf"};
  const swfPilot = {id: "pilot-swf", swf: "source-assets/flash/Only.swf"};
  const fla = Buffer.from("fla");
  const swf = Buffer.from("swf");
  const onlySwf = Buffer.from("only-swf");
  const auditScript = Buffer.from("recursive-jsfl");
  const frame = png(800, 600);
  const rawAudit = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    document: {name: "Test.fla", pathURI: "file:///tmp/Test.fla", width: 800, height: 600},
    timeline: {frameCount: 10, layers: [{name: "root", keyframes: [{elements: [], actionScriptLength: 1, soundName: ""}]}]},
    library: [{name: "Replay", itemType: "button", timeline: {layers: [{keyframes: [{elements: []}]}]}}],
    recursiveLibraryTimelineAudit: !legacy,
  };
  if (legacy) {
    delete rawAudit.timeline.layers[0].keyframes[0].elements;
    delete rawAudit.library[0].timeline.layers;
  }
  const rawBytes = Buffer.from(JSON.stringify(rawAudit));
  const probeDir = path.join(root, "work", "animate", "jsfl-cli-probes", "run-one");
  const workingCopy = path.join(root, "work", "animate", "read-only-fla-copies", flaPilot.id, "Test.fla");
  for (const directory of [
    path.join(root, "source-assets", "flash"),
    path.join(root, "migrations", flaPilot.id, "audit"),
    path.join(root, "migrations", swfPilot.id),
    path.join(root, "scripts"),
    probeDir,
    path.dirname(workingCopy),
    path.join(root, "work", "animate"),
  ]) await mkdir(directory, {recursive: true});
  await writeFile(path.join(root, flaPilot.fla), fla);
  await writeFile(path.join(root, flaPilot.swf), swf);
  await writeFile(path.join(root, swfPilot.swf), onlySwf);
  await writeFile(path.join(root, "scripts", "animate-audit-current-document.jsfl"), auditScript);
  await writeFile(workingCopy, fla);
  await chmod(workingCopy, 0o444);
  await writeFile(path.join(root, "work", "animate", "Test.fla-authoring-audit.json"), rawBytes);
  await writeFile(path.join(root, "migrations", flaPilot.id, "audit", "frame.png"), frame);
  const canonical = {
    schemaVersion: legacy ? 1 : 2,
    evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
    animationId: flaPilot.id,
    animateVersion: "MAC 21,0,7,42652",
    capturedAt: "Wed, 22 Jul 2026 00:00:00 GMT",
    protocol: legacy ? {coldStartPerFla: true} : {
      recursiveLibraryTimelineAuditVerified: true,
      readOnlyWorkingCopyPermissionsVerifiedAtFinalize: true,
    },
    auditScript: legacy ? undefined : {file: "scripts/animate-audit-current-document.jsfl", sha256: hash(auditScript)},
    source: {
      fla: flaPilot.fla,
      flaSha256: hash(fla),
      workingCopy: legacy ? undefined : {
        path: "work/animate/read-only-fla-copies/pilot-fla/Test.fla",
        sha256: hash(fla),
        readOnlyAtFinalize: true,
        byteIdenticalToSourceAtFinalize: true,
      },
    },
    nativeMovie: {width: 800, height: 600, fps: 12, frameCount: 10, rootLayerCount: 1, libraryItemCount: 1},
    capturedAuthoringFrame: {file: "audit/frame.png", sha256: hash(frame), flashFrame: 10},
    rawAuditSha256: hash(rawBytes),
    authoringAudit: rawAudit,
    limitations: ["authoring only"],
  };
  await writeFile(path.join(root, "migrations", flaPilot.id, "audit", "adobe-animate-2021-authoring-audit.json"), JSON.stringify(canonical));
  await writeFile(path.join(root, "migrations", flaPilot.id, "migration.json"), JSON.stringify({
    animationId: flaPilot.id,
    source: {fla: flaPilot.fla, flaSha256: hash(fla), swf: flaPilot.swf, swfSha256: hash(swf)},
    runtime: {stage: {width: 800, height: 600}, fps: 12, frameCount: 10},
  }));
  await writeFile(path.join(root, "migrations", swfPilot.id, "migration.json"), JSON.stringify({
    animationId: swfPilot.id,
    source: {fla: "", swf: swfPilot.swf, swfSha256: hash(onlySwf)},
    runtime: {stage: {width: 800, height: 600}, fps: 12, frameCount: 1},
  }));

  const probeReport = Buffer.from("probe-report");
  const probePng = png(550, 400);
  await writeFile(path.join(probeDir, "report.json"), probeReport);
  await writeFile(path.join(probeDir, "frame.png"), probePng);
  const probe = {
    schemaVersion: 1,
    status: "passed",
    scope: "disposable-blank-document",
    limitations: ["blank document only"],
    command: {executable: "/Applications/Animate", executableSha256: "a".repeat(64)},
    scripts: {auditTemplate: {file: "scripts/animate-audit-current-document.jsfl", sha256: hash(auditScript)}},
    artifacts: {
      report: {file: "work/animate/jsfl-cli-probes/run-one/report.json", sha256: hash(probeReport), capturedAt: "Wed, 22 Jul 2026 01:00:00 GMT", animateVersion: "MAC 21,0,7,42652"},
      png: {file: "work/animate/jsfl-cli-probes/run-one/frame.png", sha256: hash(probePng)},
    },
  };
  await writeFile(path.join(probeDir, "probe-result.json"), JSON.stringify(probe));
  return {root, pilots: [flaPilot, swfPilot]};
}

test("indexes current recursive authoring evidence without expanding authority", async () => {
  const context = await fixture();
  const report = await buildReport(context);
  assert.equal(report.summary.pilots, 2);
  assert.equal(report.summary.flaBacked, 1);
  assert.equal(report.summary.verifiedAuthoringAudits, 1);
  assert.equal(report.summary.legacyPartialAuthoringAudits, 0);
  assert.equal(report.summary.swfOnly, 1);
  assert.equal(report.authorityBoundary.strictAcceptanceEffect, false);
  assert.equal(report.pilots[0].authoringAudit.structure.replayLibraryItems[0].name, "Replay");
  assert.match(renderMarkdown(report), /Current recursive Animate authoring audits: 1\/1/);
});

test("classifies a hash-valid shallow audit as refresh-required", async () => {
  const context = await fixture({legacy: true});
  const report = await buildReport(context);
  assert.equal(report.summary.verifiedAuthoringAudits, 0);
  assert.equal(report.summary.legacyPartialAuthoringAudits, 1);
  assert.equal(report.summary.pendingAuthoringAudits, 1);
  assert.equal(report.pilots[0].status, "legacy-partial-authoring-audit-refresh-required");
});

test("parseArguments is fail-closed", () => {
  assert.equal(parseArguments(["--check"]).check, true);
  assert.throws(() => parseArguments(["--accept"]), /Unknown option/);
});
