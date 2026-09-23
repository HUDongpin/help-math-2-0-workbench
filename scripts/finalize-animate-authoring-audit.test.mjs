import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { finalizeOne, parseArgs } from "./finalize-animate-authoring-audit.mjs";

const PNG = Buffer.alloc(24);
Buffer.from("89504e470d0a1a0a", "hex").copy(PNG);
PNG.writeUInt32BE(780, 16);
PNG.writeUInt32BE(379, 20);
const hash = (value) => createHash("sha256").update(value).digest("hex");

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-authoring-audit-"));
  const id = "formula-test";
  const flaRelative = "source-assets/flash/Test.fla";
  const fla = Buffer.from("fla-source");
  await mkdir(path.join(root, "source-assets", "flash"), { recursive: true });
  await mkdir(path.join(root, "migrations", id), { recursive: true });
  await mkdir(path.join(root, "raw"), { recursive: true });
  await mkdir(path.join(root, "scripts"), { recursive: true });
  await writeFile(path.join(root, "scripts", "animate-audit-current-document.jsfl"), "fixture-current-recursive-audit-script");
  await writeFile(path.join(root, flaRelative), fla);
  const workingCopyRoot = path.join(root, "work", "animate", "read-only-fla-copies");
  const workingCopy = path.join(workingCopyRoot, id, "Test.fla");
  await mkdir(path.dirname(workingCopy), { recursive: true });
  await writeFile(workingCopy, fla);
  await chmod(workingCopy, 0o444);
  await writeFile(
    path.join(root, "migrations", id, "migration.json"),
    JSON.stringify({
      source: { fla: flaRelative, flaSha256: hash(fla) },
      runtime: { stage: { width: 780, height: 379 }, fps: 12, frameCount: 10 },
    }),
  );
  await writeFile(
    path.join(root, "raw", "Test.fla-authoring-audit.json"),
    JSON.stringify({
      schemaVersion: 1,
      evidenceKind: "adobe-animate-authoring-audit",
      capturedAt: "Mon, 20 Jul 2026 00:00:00 GMT",
      animateVersion: "21.0.7",
      document: {
        name: "Test.fla",
        pathURI: pathToFileURL(workingCopy).href,
        width: 780,
        height: 379,
        frameRate: 12,
        backgroundColor: "#e4e4e4",
        libraryItemCount: 3,
      },
      timeline: {
        frameCount: 10,
        layerCount: 2,
        currentFlashFrame: 4,
        layers: [{keyframes: [{flashFrame: 1, elements: []}]}],
      },
      library: [],
      recursiveLibraryTimelineAudit: true,
    }),
  );
  await writeFile(path.join(root, "raw", "Test.fla-frame-4.png"), PNG);
  return { root, id, workingCopy, workingCopyRoot };
}

test("parseArgs accepts multiple animation ids and a raw root", () => {
  const options = parseArgs(["--raw-root", "/tmp/raw", "one", "two"]);
  assert.equal(options.rawRoot, "/tmp/raw");
  assert.match(options.workingCopyRoot, /work\/animate\/read-only-fla-copies$/);
  assert.deepEqual(options.animationIds, ["one", "two"]);
});

test("finalizeOne hashes the FLA and stores canonical audit evidence", async () => {
  const { root, id } = await fixture();
  const result = await finalizeOne(id, path.join(root, "raw"), root);
  assert.equal(result.frameCount, 10);
  const output = JSON.parse(
    await readFile(path.join(root, "migrations", id, "audit", "adobe-animate-2021-authoring-audit.json"), "utf8"),
  );
  assert.equal(output.protocol.coldStartPerFla, true);
  assert.equal(output.protocol.originalSourceHashVerified, true);
  assert.equal(output.protocol.recursiveLibraryTimelineAuditVerified, true);
  assert.equal(output.schemaVersion, 2);
  assert.equal(output.source.workingCopy.readOnlyAtFinalize, true);
  assert.equal(output.auditScript.sha256, hash("fixture-current-recursive-audit-script"));
  assert.equal(output.capturedAuthoringFrame.flashFrame, 4);
  assert.equal(output.capturedAuthoringFrame.sha256, hash(PNG));
  assert.deepEqual(
    {width: output.capturedAuthoringFrame.width, height: output.capturedAuthoringFrame.height},
    {width: 780, height: 379},
  );
});

test("finalizeOne rejects an authoring/runtime frame-count mismatch", async () => {
  const { root, id } = await fixture();
  const migrationPath = path.join(root, "migrations", id, "migration.json");
  const migration = JSON.parse(await readFile(migrationPath, "utf8"));
  migration.runtime.frameCount = 11;
  await writeFile(migrationPath, JSON.stringify(migration));
  await assert.rejects(
    finalizeOne(id, path.join(root, "raw"), root),
    /frameCount mismatch/,
  );
});

test("finalizeOne enforces the exact byte-identical read-only working copy", async () => {
  const { root, id, workingCopy, workingCopyRoot } = await fixture();
  const reportPath = path.join(root, "raw", "Test.fla-authoring-audit.json");
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  report.document.pathURI = "file:///Macintosh%20HD/example/Test.fla";
  await writeFile(reportPath, JSON.stringify(report));
  await assert.rejects(
    finalizeOne(id, path.join(root, "raw"), root, workingCopyRoot),
    /must come from the read-only working copy/,
  );
  report.document.pathURI = pathToFileURL(workingCopy).href;
  await writeFile(reportPath, JSON.stringify(report));
  const result = await finalizeOne(id, path.join(root, "raw"), root, workingCopyRoot);
  assert.equal(result.frameCount, 10);
  const output = JSON.parse(
    await readFile(path.join(root, "migrations", id, "audit", "adobe-animate-2021-authoring-audit.json"), "utf8"),
  );
  assert.equal(output.protocol.readOnlyWorkingCopyRequired, true);
  assert.equal(output.protocol.readOnlyWorkingCopyPathVerified, true);
  assert.equal(output.source.workingCopy.byteIdenticalToSourceAtFinalize, true);

  await chmod(workingCopy, 0o644);
  await assert.rejects(
    finalizeOne(id, path.join(root, "raw"), root, workingCopyRoot),
    /working-copy FLA is writable/,
  );

  await writeFile(workingCopy, Buffer.from("changed-copy"));
  await assert.rejects(
    finalizeOne(id, path.join(root, "raw"), root, workingCopyRoot),
    /working-copy FLA hash mismatch/,
  );
});

test("finalizeOne rejects a missing working copy, unsupported schema, and shallow pre-recursive audit", async () => {
  const {root, id, workingCopy, workingCopyRoot} = await fixture();
  await rm(workingCopy);
  await assert.rejects(
    finalizeOne(id, path.join(root, "raw"), root, workingCopyRoot),
    /required read-only working copy is missing/,
  );

  const wrongSchema = await fixture();
  const wrongSchemaPath = path.join(wrongSchema.root, "raw", "Test.fla-authoring-audit.json");
  const wrongSchemaReport = JSON.parse(await readFile(wrongSchemaPath, "utf8"));
  wrongSchemaReport.schemaVersion = 2;
  await writeFile(wrongSchemaPath, JSON.stringify(wrongSchemaReport));
  await assert.rejects(
    finalizeOne(wrongSchema.id, path.join(wrongSchema.root, "raw"), wrongSchema.root, wrongSchema.workingCopyRoot),
    /unexpected raw audit schemaVersion 2/,
  );

  const refreshed = await fixture();
  const reportPath = path.join(refreshed.root, "raw", "Test.fla-authoring-audit.json");
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  delete report.recursiveLibraryTimelineAudit;
  await writeFile(reportPath, JSON.stringify(report));
  await assert.rejects(
    finalizeOne(refreshed.id, path.join(refreshed.root, "raw"), refreshed.root, refreshed.workingCopyRoot),
    /predates the recursive library-timeline contract/,
  );
});

test("finalizeOne archives a superseded canonical audit and its frame before replacement", async () => {
  const {root, id, workingCopyRoot} = await fixture();
  const first = await finalizeOne(id, path.join(root, "raw"), root, workingCopyRoot);
  const canonicalPath = path.join(root, "migrations", id, "audit", "adobe-animate-2021-authoring-audit.json");
  const firstCanonical = await readFile(canonicalPath);
  assert.equal(first.canonicalSha256, hash(firstCanonical));

  const same = await finalizeOne(id, path.join(root, "raw"), root, workingCopyRoot);
  assert.deepEqual(same.historyArchive, {status: "already-current", archived: false});

  const rawPath = path.join(root, "raw", "Test.fla-authoring-audit.json");
  const raw = JSON.parse(await readFile(rawPath, "utf8"));
  raw.capturedAt = "Tue, 21 Jul 2026 00:00:00 GMT";
  await writeFile(rawPath, JSON.stringify(raw));
  const second = await finalizeOne(id, path.join(root, "raw"), root, workingCopyRoot);
  assert.equal(second.historyArchive.archived, true);
  assert.equal(second.historyArchive.canonicalSha256, hash(firstCanonical));
  const historyRoot = path.join(root, "migrations", id, "audit", "history", hash(firstCanonical));
  assert.deepEqual(await readFile(path.join(historyRoot, "adobe-animate-2021-authoring-audit.json")), firstCanonical);
  assert.deepEqual(await readFile(path.join(historyRoot, "adobe-animate-2021-authoring-frame-0004.png")), PNG);
  const archiveManifest = JSON.parse(await readFile(path.join(historyRoot, "archive-manifest.json"), "utf8"));
  assert.equal(archiveManifest.archivedCanonical.sha256, hash(firstCanonical));
  assert.equal(archiveManifest.supersededByCanonicalSha256, second.canonicalSha256);
});
