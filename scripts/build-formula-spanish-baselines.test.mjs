import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdtemp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {pathToFileURL} from "node:url";
import {gzipSync} from "node:zlib";

import {PNG} from "pngjs";

import {
  archiveInvalidatedCapture,
  archiveInvalidatedComparison,
  buildPanelOverlaySvg,
  compositeSpanishPanel,
  FORMULA_PILOTS,
  FORMULA_SPANISH_BASELINE_GENERATOR_VERSION,
  FORMULA_SPANISH_BASELINE_SCHEMA_VERSION,
  parseArguments,
  parseStructure,
  requireCurrentFormulaAuthoringAudit,
} from "./build-formula-spanish-baselines.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function solidPng(width, height, rgba) {
  const image = new PNG({width, height});
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = rgba[0];
    image.data[index + 1] = rgba[1];
    image.data[index + 2] = rgba[2];
    image.data[index + 3] = rgba[3];
  }
  return PNG.sync.write(image);
}

function formulaXml() {
  return Buffer.from(`<?xml version="1.0"?>
<swf version="6" compressed="1">
  <Header framerate="12" frames="3">
    <size><Rectangle left="0" top="0" right="15600" bottom="7580"/></size>
    <tags>
      <DefineShape3 objectID="132"/>
      <DefineText objectID="133"/>
      <DefineSprite objectID="134" frames="1">
        <tags>
          <PlaceObject2 replace="0" depth="1" objectID="132"><transform><Transform transX="0" transY="0"/></transform></PlaceObject2>
          <PlaceObject2 replace="0" depth="2" objectID="133"><transform><Transform transX="280" transY="280"/></transform></PlaceObject2>
          <ShowFrame/><End/>
        </tags>
      </DefineSprite>
      <PlaceObject2 replace="0" depth="4" objectID="134" name="Mc_SD"><transform><Transform transX="8286" transY="6457"/></transform></PlaceObject2>
      <ShowFrame/><ShowFrame/><ShowFrame/><End/>
    </tags>
  </Header>
</swf>`);
}

function panelSvg() {
  return Buffer.from(`<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:ffdec="https://www.free-decompiler.com/flash" width="365.7px" height="52.8px">
  <g><use ffdec:characterId="132" href="#shape"/><use ffdec:characterId="133" href="#text"/></g>
  <defs><g id="shape"><rect width="365.7" height="52.8" fill="#b9df9f"/></g><g id="text"><path d="M0 0"/></g></defs>
</svg>`);
}

async function formulaAuthoringFixture({schemaVersion = 2} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "formula-authoring-contract-"));
  const pilot = FORMULA_PILOTS[0];
  const migrationRoot = path.join(root, "migrations", pilot.id);
  const fla = Buffer.from("formula-fla-source");
  const flaPath = "source-assets/flash/Conversion_1_1.fla";
  const workingCopyPath = `work/animate/read-only-fla-copies/${pilot.id}/Conversion_1_1.fla`;
  const scriptPath = "scripts/animate-audit-current-document.jsfl";
  const auditScript = Buffer.from("current recursive JSFL fixture");
  const frame = solidPng(780, 379, [228, 228, 228, 255]);
  const framePath = "audit/adobe-animate-2021-authoring-frame-0001.png";
  for (const [relative, bytes] of [
    [flaPath, fla],
    [workingCopyPath, fla],
    [scriptPath, auditScript],
    [`migrations/${pilot.id}/${framePath}`, frame],
  ]) {
    const destination = path.join(root, relative);
    await mkdir(path.dirname(destination), {recursive: true});
    await writeFile(destination, bytes);
  }
  await chmod(path.join(root, workingCopyPath), 0o444);

  const workingCopyUrl = pathToFileURL(path.join(root, workingCopyPath)).href
    .replace("file:///", "file:///Macintosh%20HD/");
  const embedded = {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-authoring-audit",
    animateVersion: "MAC 21,0,7,42652",
    capturedAt: "Wed, 22 Jul 2026 03:00:00 GMT",
    document: {
      name: "Conversion_1_1.fla",
      pathURI: workingCopyUrl,
      width: 780,
      height: 379,
      frameRate: 12,
      backgroundColor: "#e4e4e4",
      libraryItemCount: 1,
    },
    timeline: {
      name: "Scene 1",
      frameCount: pilot.frameCount,
      layerCount: 1,
      currentFrame: 0,
      currentFlashFrame: 1,
      layers: [{
        index: 0,
        name: "Mc",
        frameCount: pilot.frameCount,
        keyframes: [{
          flashFrame: 1,
          duration: pilot.frameCount,
          elementCount: 2,
          elements: [{elementType: "instance"}, {elementType: "instance"}],
        }],
      }],
    },
    library: [{
      name: "Mc_S_Def",
      itemType: "movie clip",
      timeline: {
        frameCount: 1,
        layerCount: 2,
        layers: [
          {keyframes: [{flashFrame: 1, elements: [{elementType: "shape"}]}]},
          {keyframes: [{flashFrame: 1, elements: [{elementType: "text"}]}]},
        ],
      },
    }],
    recursiveLibraryTimelineAudit: true,
  };
  const manifest = {
    animationId: pilot.id,
    source: {fla: flaPath, flaSha256: sha256(fla)},
    runtime: {stage: {width: 780, height: 379}, fps: 12, frameCount: pilot.frameCount},
  };
  const canonical = {
    schemaVersion,
    evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
    authority: "Original owner-provided FLA inspected read-only in Adobe Animate 2021",
    animationId: pilot.id,
    capturedAt: embedded.capturedAt,
    animateVersion: embedded.animateVersion,
    protocol: schemaVersion === 2 ? {
      coldStartPerFla: true,
      openedWithoutSaving: true,
      originalSourceHashVerified: true,
      readOnlyWorkingCopyRequired: true,
      readOnlyWorkingCopyPathVerified: true,
      readOnlyWorkingCopyHashVerifiedAtFinalize: true,
      readOnlyWorkingCopyPermissionsVerifiedAtFinalize: true,
      recursiveLibraryTimelineAuditRequired: true,
      recursiveLibraryTimelineAuditVerified: true,
    } : {
      coldStartPerFla: true,
      openedWithoutSaving: true,
      originalSourceHashVerified: true,
    },
    ...(schemaVersion === 2 ? {auditScript: {file: scriptPath, sha256: sha256(auditScript)}} : {}),
    source: {
      fla: flaPath,
      flaSha256: sha256(fla),
      ...(schemaVersion === 2 ? {workingCopy: {
        path: workingCopyPath,
        sha256: sha256(fla),
        bytes: fla.length,
        readOnlyAtFinalize: true,
        byteIdenticalToSourceAtFinalize: true,
      }} : {}),
    },
    nativeMovie: {
      width: 780,
      height: 379,
      fps: 12,
      frameCount: pilot.frameCount,
      backgroundColor: "#e4e4e4",
      rootLayerCount: 1,
      libraryItemCount: 1,
    },
    capturedAuthoringFrame: {
      flashFrame: 1,
      file: framePath,
      sha256: sha256(frame),
      ...(schemaVersion === 2 ? {width: 780, height: 379} : {}),
    },
    rawAuditSha256: sha256(Buffer.from(JSON.stringify(embedded))),
    authoringAudit: embedded,
    limitations: ["Authoring evidence does not prove runtime behavior."],
  };
  const authoringFile = path.join(migrationRoot, "audit", "adobe-animate-2021-authoring-audit.json");
  await mkdir(path.dirname(authoringFile), {recursive: true});
  await writeFile(authoringFile, `${JSON.stringify(canonical, null, 2)}\n`);
  return {
    root,
    pilot,
    manifest,
    migrationRoot,
    authoringFile,
    header: {widthPx: 780, heightPx: 379, frameRate: 12, frameCount: pilot.frameCount},
  };
}

test("parses formula Spanish baseline arguments", () => {
  assert.deepEqual(parseArguments([
    "--id", "formula-elementary-conversion-01-01",
    "--check",
    "--generated-at", "2026-07-21T00:00:00.000Z",
    "--ffdec", "ffdec-test",
    "--python", "python-test",
  ]), {
    ids: ["formula-elementary-conversion-01-01"],
    check: true,
    generatedAt: "2026-07-21T00:00:00.000Z",
    ffdec: "ffdec-test",
    python: "python-test",
  });
  assert.throws(() => parseArguments(["--id"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("requires and pins the current schema-v2 recursive Animate contract before formula Spanish generation", async () => {
  const fixture = await formulaAuthoringFixture();
  try {
    const result = await requireCurrentFormulaAuthoringAudit(fixture);
    assert.equal(FORMULA_SPANISH_BASELINE_SCHEMA_VERSION, 2);
    assert.equal(FORMULA_SPANISH_BASELINE_GENERATOR_VERSION, "2.0.0");
    assert.equal(result.contract.status, "verified-current-recursive-authoring-audit");
    assert.equal(result.contract.comprehensiveCurrentContract, true);
    assert.equal(result.contract.strictAcceptanceEffect, false);
    assert.equal(result.contract.canonicalSchemaVersion, 2);
    assert.deepEqual(result.contract.evidence.map(({id}) => id), [
      "animate-authoring-audit",
      "animate-authoring-audit-script",
      "animate-authoring-working-copy",
      "animate-authoring-frame",
    ]);
    assert.equal(result.semanticEvidence.mcLayer.frameCount, fixture.pilot.frameCount);
    assert.equal(result.semanticEvidence.spanishLibraryItem.name, "Mc_S_Def");
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("fails closed on schema-v1 authoring evidence before formula Spanish generation or check", async () => {
  const fixture = await formulaAuthoringFixture({schemaVersion: 1});
  try {
    await assert.rejects(
      requireCurrentFormulaAuthoringAudit(fixture),
      /requires a verified current schema-v2 recursive Animate authoring audit; observed legacy-partial-authoring-audit-refresh-required/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("retains the Mc and Mc_S_Def semantic gates after schema-v2 contract validation", async () => {
  const fixture = await formulaAuthoringFixture();
  try {
    const canonical = JSON.parse(await readFile(fixture.authoringFile, "utf8"));
    canonical.authoringAudit.library[0].name = "wrong-spanish-symbol";
    canonical.rawAuditSha256 = sha256(Buffer.from(JSON.stringify(canonical.authoringAudit)));
    await writeFile(fixture.authoringFile, `${JSON.stringify(canonical, null, 2)}\n`);
    await assert.rejects(
      requireCurrentFormulaAuthoringAudit(fixture),
      /FLA Mc_S_Def is not a static one-frame\/two-layer symbol/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("uses ElementTree to prove one fixed root Mc_SD placement", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "formula-panel-parser-"));
  try {
    const swfmill = path.join(root, "movie.xml.gz");
    const svg = panelSvg();
    await writeFile(swfmill, gzipSync(formulaXml()));
    const structure = await parseStructure({python: "python3", swfmill, svg});
    assert.deepEqual(structure.stage, {left: 0, top: 0, width: 780, height: 379});
    assert.equal(structure.header.frameRate, 12);
    assert.equal(structure.header.frameCount, 3);
    assert.equal(structure.header.showFrameCount, 3);
    assert.equal(structure.panel.objectId, 134);
    assert.equal(structure.panel.depth, 4);
    assert.deepEqual(structure.panel.placementPixels, {x: 414.3, y: 322.85});
    assert.equal(structure.panel.persistsThroughFrame, 3);
    assert.deepEqual(structure.panel.rootDepthEvents.map(({frame, tag}) => ({frame, tag})), [
      {frame: 1, tag: "PlaceObject2"},
    ]);
    assert.deepEqual(structure.exportedSvg.characterIds, [132, 133]);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("compositor changes only the translated source panel region", async () => {
  const base = solidPng(8, 6, [228, 228, 228, 255]);
  const source = Buffer.from(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="2px" height="2px"><rect width="2" height="2" fill="#b9df9f"/></svg>`);
  const overlay = buildPanelOverlaySvg(source, {x: 4, y: 3}, {width: 2, height: 2}, {width: 8, height: 6});
  const result = PNG.sync.read(await compositeSpanishPanel(base, overlay));
  assert.equal(result.width, 8);
  assert.equal(result.height, 6);
  for (let y = 0; y < 6; y += 1) for (let x = 0; x < 8; x += 1) {
    const offset = (y * 8 + x) * 4;
    const expected = x >= 4 && x < 6 && y >= 3 && y < 5 ? [185, 223, 159, 255] : [228, 228, 228, 255];
    assert.deepEqual([...result.data.subarray(offset, offset + 4)], expected);
  }
});

test("archives the failed FFDec whole-frame comparison byte-for-byte and fails closed on drift", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "formula-invalidated-comparison-"));
  try {
    const sourceFile = path.join(root, "evidence", "full-frame-comparison-default-es.json");
    const archiveFile = path.join(root, "evidence", "full-frame-comparison-default-es.invalidated-ffdec-whole-frame.json");
    const report = Buffer.from(`${JSON.stringify({
      animationId: "formula-test",
      inputs: {baseline: {directory: "archive/ffdec-root-frames"}},
      summary: {
        allAssignedThresholdsPass: false,
        outliers: {failingAssignedThreshold: [2, 4]},
      },
    }, null, 2)}\n`);
    await mkdir(path.dirname(sourceFile), {recursive: true});
    await writeFile(sourceFile, report);
    const record = await archiveInvalidatedComparison({
      sourceFile,
      archiveFile,
      expectedSha256: sha256(report),
      animationId: "formula-test",
      expectedFailures: [2, 4],
    });
    assert.deepEqual(await readFile(archiveFile), report);
    assert.equal(record.disposition, "invalidated-as-runtime-baseline");
    assert.deepEqual(record.failingAssignedThresholdFrames, [2, 4]);

    await writeFile(sourceFile, Buffer.from("superseding canonical report"));
    await archiveInvalidatedComparison({
      sourceFile,
      archiveFile,
      expectedSha256: sha256(report),
      animationId: "formula-test",
      expectedFailures: [2, 4],
      check: true,
    });
    await writeFile(archiveFile, Buffer.from("drift"));
    await assert.rejects(
      archiveInvalidatedComparison({
        sourceFile,
        archiveFile,
        expectedSha256: sha256(report),
        animationId: "formula-test",
        expectedFailures: [2, 4],
        check: true,
      }),
      /SHA-256 mismatch/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("archives an interrupted dev-HMR capture and preserves its failed diagnostics", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "formula-invalidated-capture-"));
  try {
    const sourceFile = path.join(root, "output", "capture-manifest.json");
    const archiveFile = path.join(root, "evidence", "capture.invalidated.json");
    const manifest = Buffer.from(`${JSON.stringify({
      status: "failed",
      captured: [{frame: 1}, {frame: 2}],
      failedRequests: ["frame=3: net::ERR_ABORTED"],
      error: "page.goto: net::ERR_ABORTED at http://localhost:3213/animation?frame=3",
    }, null, 2)}\n`);
    await mkdir(path.dirname(sourceFile), {recursive: true});
    await writeFile(sourceFile, manifest);
    const record = await archiveInvalidatedCapture({
      sourceFile,
      archiveFile,
      expectedSha256: sha256(manifest),
      animationId: "formula-test",
      expectedCapturedFrames: [1, 2],
      expectedFailedRequestCount: 1,
      expectedAbortedFrame: 3,
    });
    assert.deepEqual(await readFile(archiveFile), manifest);
    assert.equal(record.disposition, "invalidated-transient-dev-hmr-capture");
    assert.equal(record.abortedFrame, 3);
    await writeFile(sourceFile, Buffer.from("new canonical manifest"));
    await archiveInvalidatedCapture({
      sourceFile,
      archiveFile,
      expectedSha256: sha256(manifest),
      animationId: "formula-test",
      expectedCapturedFrames: [1, 2],
      expectedFailedRequestCount: 1,
      expectedAbortedFrame: 3,
      check: true,
    });
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
