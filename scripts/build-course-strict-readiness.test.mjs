import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { PNG } from "pngjs";

import {
  buildAllCourseStrictReadiness,
  buildCourseStrictReadiness,
  materializeCourseStrictReadiness,
  parseArgs,
} from "./build-course-strict-readiness.mjs";

const ID = "course-g03-l06-ti-001";
const FLA_ID = "course-g03-l01-vb-004";
const RELEASE_ID = "lesson-g09-l99-fixture";
const RELEASE_MEMBER_ID = "course-g09-l99-in-001";
const RELEASE_SHELL_ID = "shell-course-g09-l99-index-local";
const COURSE_SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const RELEASE_SHELL_BYTES = Buffer.from("distinct-shell-source");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeArtifact(root, relative, bytes) {
  const candidate = path.join(root, relative);
  await mkdir(path.dirname(candidate), { recursive: true });
  await writeFile(candidate, bytes);
  return { file: relative.split(path.sep).join("/"), sha256: sha256(bytes) };
}

function png(width = 8, height = 6, red = 0) {
  const image = new PNG({ width, height });
  for (let offset = 0; offset < image.data.length; offset += 4) {
    image.data[offset] = red;
    image.data[offset + 1] = 32;
    image.data[offset + 2] = 64;
    image.data[offset + 3] = 255;
  }
  return PNG.sync.write(image);
}

async function json(root, relative, value) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const result = await writeArtifact(root, relative, bytes);
  return { ...result, path: path.join(root, relative), bytes };
}

async function makeFixture({ id = ID, authoringSchema = null, releaseSource = null } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "course-readiness-test-"));
  const workspace = path.join(root, "migrations", id);
  const swf = Buffer.from("immutable-swf-fixture");
  const sourcePath = releaseSource ? `${COURSE_SOURCE_PREFIX}/${releaseSource}` : "source-assets/flash/fixture.swf";
  await writeArtifact(root, sourcePath, swf);
  const fla = authoringSchema === null ? null : Buffer.from("immutable-fla-fixture");
  const flaPath = fla ? "source-assets/flash/fixture.fla" : null;
  if (fla) await writeArtifact(root, flaPath, fla);

  await json(root, `migrations/${id}/migration.json`, {
    schemaVersion: releaseSource ? 2 : 1,
    ...(releaseSource ? {
      id,
      assetId: `swf-${sha256(swf)}`,
      classification: { collection: "course", grade: 9, lesson: 99 },
    } : {}),
    animationId: id,
    status: "preserved",
    source: {
      ...(releaseSource ? { placementPath: sourcePath } : {}),
      swf: sourcePath,
      swfSha256: sha256(swf),
      fla: flaPath,
      flaSha256: fla ? sha256(fla) : null,
    },
    runtime: { stage: { width: 8, height: 6 }, fps: 12, frameCount: 2 },
  });

  const machineText = Buffer.from("machine evidence\n");
  const machineGzip = gzipSync(machineText, { mtime: 0 });
  const machineOutputPath = `migrations/${id}/audit/machine/ffdec-scripts.txt.gz`;
  await writeArtifact(root, machineOutputPath, machineGzip);
  await json(root, `migrations/${id}/audit/machine/report.json`, {
    schemaVersion: 1,
    animationId: id,
    auditStatus: "partial",
    migrationStatus: "preserved",
    migrationStatusUnchanged: true,
    source: {
      path: sourcePath,
      expectedSha256: sha256(swf),
      observedSha256Before: sha256(swf),
      observedSha256After: sha256(swf),
      hashMatches: true,
    },
    authoringSource: fla ? {
      path: flaPath,
      expectedSha256: sha256(fla),
      observedSha256Before: sha256(fla),
      observedSha256After: sha256(fla),
      hashMatches: true,
      inspectionStatus: "not-performed-by-this-script",
    } : { pairedFlaStatus: "missing", inspectionStatus: "not-applicable" },
    tools: {
      ffdec: { version: "JPEXS Free Flash Decompiler v.26.2.1", success: true },
      swfmill: { version: "swfmill 0.3.6", success: true },
    },
    findings: {
      ffdecHeader: { widthPx: 8, heightPx: 6, frameRate: 12, frameCount: 2, version: 6 },
      swfmill: {
        actionScriptVersion: "AS1/2",
        tagCounts: { ShowFrame: 4, DoAction: 1, DefineSprite: 1 },
      },
      exportedScriptFileCount: 1,
      externalCallCandidates: [],
      runtimeCrossCheck: { allMatch: true },
    },
    outputs: [{
      path: "audit/machine/ffdec-scripts.txt.gz",
      format: "gzip+text/actionscript",
      bytes: machineGzip.length,
      sha256: sha256(machineGzip),
      uncompressedBytes: machineText.length,
      uncompressedSha256: sha256(machineText),
    }],
  });

  const frameRoot = `artifacts/full-frame/pilot-baselines/${id}/ffdec-root-frames`;
  const frames = [];
  for (const frame of [1, 2]) {
    const bytes = png(8, 6, frame * 20);
    await writeArtifact(root, `${frameRoot}/${frame}.png`, bytes);
    frames.push({ frame, file: `${frame}.png`, sha256: sha256(bytes), bytes: bytes.length, width: 8, height: 6 });
  }
  await json(root, `migrations/${id}/baseline/ffdec-root-frames.json`, {
    schemaVersion: 1,
    animationId: id,
    status: "structural-baseline-only",
    authority: { kind: "swf-static-root-timeline-render" },
    source: { swf: sourcePath, swfSha256: sha256(swf) },
    runtime: { stage: { width: 8, height: 6 }, fps: 12, frameCount: 2 },
    archive: { root: frameRoot, ignoredByGit: true },
    frames,
  });

  const audioInventory = "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms,format,channels,sample_rate_hz,source_character_id,notes\n";
  await writeArtifact(root, `migrations/${id}/audio-inventory.csv`, Buffer.from(audioInventory));
  await json(root, `migrations/${id}/audit/audio-runtime-evidence.json`, {
    schemaVersion: 2,
    animationId: id,
    generatedBy: "fixture",
    migrationStatusBefore: "preserved",
    migrationStatusUnchanged: true,
    source: { swf: sourcePath, expectedSha256: sha256(swf), observedSha256: sha256(swf), hashMatches: true },
    authority: { xmlReferences: [] },
    externalAudio: { exactAssociations: [] },
    embeddedAudio: { defineSounds: [], soundStreams: [] },
    inventory: { file: "audio-inventory.csv", rowCount: 0 },
    acceptance: {
      structurallyAudited: true,
      authoritativeListeningComplete: false,
      hostStateTraversalComplete: false,
      synchronizationComplete: false,
      strictAudioAcceptance: "pending",
      requirements: ["authoritative listening remains required"],
    },
  });

  const animateApplication = path.join(root, "Applications", "Adobe Animate 2021");
  await mkdir(animateApplication, { recursive: true });
  await json(root, "catalog/toolchain.json", {
    schemaVersion: 1,
    recordedOn: "2026-07-21",
    authoringEvidence: {
      adobeAnimateDetected: true,
      application: "Adobe Animate 2021",
      productVersion: "21.0.7",
      applicationPath: animateApplication,
    },
  });

  const runRoot = `work/animate/jsfl-cli-probes/run-fixture`;
  const executable = await writeArtifact(root, `${runRoot}/Adobe Animate 2021`, Buffer.from("animate-binary"));
  const auditTemplate = await writeArtifact(root, "scripts/animate-audit-current-document.jsfl", Buffer.from("audit-template"));
  let canonicalAuthoringAuditPath = null;
  let authoringFramePath = null;
  let workingCopyPath = null;
  if (fla) {
    workingCopyPath = `work/animate/read-only-fla-copies/${id}/fixture.fla`;
    await writeArtifact(root, workingCopyPath, fla);
    await chmod(path.join(root, workingCopyPath), 0o444);

    const recursive = authoringSchema === 2;
    const authoringDocumentUrl = pathToFileURL(path.join(root, recursive ? workingCopyPath : flaPath)).href;
    const embeddedAuthoringAudit = {
      schemaVersion: 1,
      evidenceKind: "adobe-animate-authoring-audit",
      animateVersion: "MAC 21,0,7,42652",
      capturedAt: "Wed, 22 Jul 2026 02:00:00 GMT",
      document: {
        name: "fixture.fla",
        pathURI: recursive ? authoringDocumentUrl.replace("file:///", "file:///Macintosh%20HD/") : authoringDocumentUrl,
        width: 8,
        height: 6,
        frameRate: 12,
        backgroundColor: "#ffffff",
        libraryItemCount: 1,
      },
      timeline: {
        name: "Scene 1",
        frameCount: 2,
        layerCount: 1,
        currentFrame: 1,
        currentFlashFrame: 2,
        layers: [{
          index: 0,
          name: "Layer 1",
          keyframes: [{ flashFrame: 1, ...(recursive ? { elements: [] } : {}) }],
        }],
      },
      library: [{
        name: "Teaching clip",
        itemType: "movie clip",
        timeline: {
          frameCount: 1,
          layerCount: 1,
          ...(recursive ? { layers: [{ keyframes: [{ flashFrame: 1, elements: [] }] }] } : {}),
        },
      }],
      ...(recursive ? { recursiveLibraryTimelineAudit: true } : {}),
    };
    const authoringFrame = png(8, 6, 96);
    authoringFramePath = `migrations/${id}/audit/adobe-animate-2021-authoring-frame-0002.png`;
    await writeArtifact(root, authoringFramePath, authoringFrame);
    const canonical = {
      schemaVersion: authoringSchema,
      evidenceKind: "adobe-animate-2021-cold-start-authoring-audit",
      authority: "Original owner-provided FLA inspected read-only in Adobe Animate 2021",
      animationId: id,
      capturedAt: embeddedAuthoringAudit.capturedAt,
      animateVersion: embeddedAuthoringAudit.animateVersion,
      protocol: authoringSchema === 2 ? {
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
      ...(authoringSchema === 2 ? { auditScript: auditTemplate } : {}),
      source: {
        fla: flaPath,
        flaSha256: sha256(fla),
        ...(authoringSchema === 2 ? {
          workingCopy: {
            path: workingCopyPath,
            sha256: sha256(fla),
            bytes: fla.length,
            readOnlyAtFinalize: true,
            byteIdenticalToSourceAtFinalize: true,
          },
        } : {}),
      },
      nativeMovie: {
        width: 8,
        height: 6,
        fps: 12,
        frameCount: 2,
        backgroundColor: "#ffffff",
        rootLayerCount: 1,
        libraryItemCount: 1,
      },
      capturedAuthoringFrame: {
        flashFrame: 2,
        file: "audit/adobe-animate-2021-authoring-frame-0002.png",
        sha256: sha256(authoringFrame),
        ...(authoringSchema === 2 ? { width: 8, height: 6 } : {}),
      },
      rawAuditSha256: sha256(Buffer.from(JSON.stringify(embeddedAuthoringAudit))),
      authoringAudit: embeddedAuthoringAudit,
      limitations: ["Authoring evidence does not prove original-runtime behavior."],
    };
    canonicalAuthoringAuditPath = `migrations/${id}/audit/adobe-animate-2021-authoring-audit.json`;
    await json(root, canonicalAuthoringAuditPath, canonical);
  }
  const generatedAudit = await writeArtifact(root, `${runRoot}/generated.jsfl`, Buffer.from("generated-audit"));
  const controller = await writeArtifact(root, `${runRoot}/controller.jsfl`, Buffer.from("controller"));
  const stdout = await writeArtifact(root, `${runRoot}/stdout.log`, Buffer.alloc(0));
  const stderr = await writeArtifact(root, `${runRoot}/stderr.log`, Buffer.alloc(0));
  const marker = await writeArtifact(root, `${runRoot}/controller-result.json`, Buffer.from("{}\n"));
  const authoringReport = await writeArtifact(root, `${runRoot}/Untitled-1-authoring-audit.json`, Buffer.from("{}\n"));
  const frame = await writeArtifact(root, `${runRoot}/Untitled-1-frame-1.png`, png(8, 6));
  const absoluteExecutable = path.join(root, executable.file);
  const probe = await json(root, `${runRoot}/probe-result.json`, {
    schemaVersion: 1,
    evidenceKind: "adobe-animate-jsfl-cli-probe",
    status: "passed",
    scope: "disposable-blank-document",
    limitations: [
      "This proves only a generated blank document.",
      "Legacy ActionScript conversion dialogs still require human acknowledgement.",
    ],
    command: { executable: absoluteExecutable, executableSha256: executable.sha256, intentionallyOmitsQuitFlag: true },
    scripts: {
      auditTemplate,
      generatedAudit,
      controller,
    },
    process: { exitCode: 0, timedOut: false, stdout, stderr },
    artifacts: {
      marker,
      report: { ...authoringReport, animateVersion: "MAC 21,0,7,42652" },
      png: frame,
    },
    failure: null,
  });

  return {
    root,
    workspace,
    migrationsRoot: path.join(root, "migrations"),
    toolchainPath: path.join(root, "catalog", "toolchain.json"),
    probeRoot: path.join(root, "work", "animate", "jsfl-cli-probes"),
    machineOutputPath: path.join(root, machineOutputPath),
    auditTemplatePath: path.join(root, auditTemplate.file),
    probePath: probe.path,
    canonicalAuthoringAuditPath: canonicalAuthoringAuditPath && path.join(root, canonicalAuthoringAuditPath),
    authoringFramePath: authoringFramePath && path.join(root, authoringFramePath),
    workingCopyPath: workingCopyPath && path.join(root, workingCopyPath),
    sourcePath,
    sourceSha256: sha256(swf),
  };
}

async function writeReleaseCatalog(fixture) {
  const sourceLessonRelative = "HELP_COURSES/ELMGR9/L99/index.xml";
  const sourceLesson = Buffer.from("<Lesson><Page File=\"IN/L99IN01.swf\" /></Lesson>\n");
  await writeArtifact(fixture.root, `${COURSE_SOURCE_PREFIX}/${sourceLessonRelative}`, sourceLesson);
  const shellSha256 = sha256(RELEASE_SHELL_BYTES);
  const document = {
    schemaVersion: 1,
    releases: [{
      releaseOrder: 1,
      releaseId: RELEASE_ID,
      releaseType: "complete-lesson",
      publicationMode: "atomic",
      developmentMode: "parallel-shards",
      queueId: "release-g09-l99-fixture",
      grade: 9,
      lesson: 99,
      titleDisplay: "Fixture lesson",
      domain: "fixture-domain",
      sourceLesson: {
        path: sourceLessonRelative,
        bytes: sourceLesson.length,
        sha256: sha256(sourceLesson),
        sequenceAuthority: "active-course-xml-global-page-order",
      },
      expectedCounts: { activeXmlReferencedPages: 1, courseShells: 1, members: 2, shards: 1 },
      scope: { collection: "course", grade: 9, lesson: 99, excludeNonMembers: true },
      shards: [{
        shardId: "g09-l99-fixture",
        batchId: "g09-l99-fixture",
        ordinal: 1,
        parallelGroup: "g09-l99-mvp",
        memberCount: 2,
        developmentPrerequisites: [],
      }],
      members: [{
        ordinal: 1,
        animationId: RELEASE_MEMBER_ID,
        assetId: `swf-${fixture.sourceSha256}`,
        releaseRole: "active-xml-referenced-page",
        batchId: "g09-l99-fixture",
        shardId: "g09-l99-fixture",
        source: { path: "HELP_COURSES/ELMGR9/L99/IN/L99IN01.swf", sha256: fixture.sourceSha256 },
        xmlOccurrence: 1,
      }, {
        ordinal: 2,
        animationId: RELEASE_SHELL_ID,
        assetId: `swf-${shellSha256}`,
        releaseRole: "course-shell",
        batchId: "g09-l99-fixture",
        shardId: "g09-l99-fixture",
        source: { path: "HELP_COURSES/ELMGR9/L99/index_local.swf", sha256: shellSha256 },
        xmlOccurrence: null,
      }],
    }],
  };
  return json(fixture.root, "catalog/lesson-releases.json", document);
}

async function cloneReleaseShellWorkspace(fixture) {
  const shellWorkspace = path.join(fixture.migrationsRoot, RELEASE_SHELL_ID);
  await cp(fixture.workspace, shellWorkspace, { recursive: true });
  const shellSourceRelative = "HELP_COURSES/ELMGR9/L99/index_local.swf";
  const shellSourcePath = `${COURSE_SOURCE_PREFIX}/${shellSourceRelative}`;
  const shellSha256 = sha256(RELEASE_SHELL_BYTES);
  await writeArtifact(fixture.root, shellSourcePath, RELEASE_SHELL_BYTES);

  const manifestPath = path.join(shellWorkspace, "migration.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.id = RELEASE_SHELL_ID;
  manifest.animationId = RELEASE_SHELL_ID;
  manifest.assetId = `swf-${shellSha256}`;
  manifest.source.placementPath = shellSourcePath;
  manifest.source.swf = shellSourcePath;
  manifest.source.swfSha256 = shellSha256;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const machinePath = path.join(shellWorkspace, "audit", "machine", "report.json");
  const machine = JSON.parse(await readFile(machinePath, "utf8"));
  machine.animationId = RELEASE_SHELL_ID;
  machine.source.path = shellSourcePath;
  machine.source.expectedSha256 = shellSha256;
  machine.source.observedSha256Before = shellSha256;
  machine.source.observedSha256After = shellSha256;
  await writeFile(machinePath, `${JSON.stringify(machine, null, 2)}\n`);

  const baselinePath = path.join(shellWorkspace, "baseline", "ffdec-root-frames.json");
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  const oldArchiveRoot = baseline.archive.root;
  const newArchiveRoot = `artifacts/full-frame/pilot-baselines/${RELEASE_SHELL_ID}/ffdec-root-frames`;
  await cp(path.join(fixture.root, oldArchiveRoot), path.join(fixture.root, newArchiveRoot), { recursive: true });
  baseline.animationId = RELEASE_SHELL_ID;
  baseline.source.swf = shellSourcePath;
  baseline.source.swfSha256 = shellSha256;
  baseline.archive.root = newArchiveRoot;
  await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);

  const audioPath = path.join(shellWorkspace, "audit", "audio-runtime-evidence.json");
  const audio = JSON.parse(await readFile(audioPath, "utf8"));
  audio.animationId = RELEASE_SHELL_ID;
  audio.source.swf = shellSourcePath;
  audio.source.expectedSha256 = shellSha256;
  audio.source.observedSha256 = shellSha256;
  await writeFile(audioPath, `${JSON.stringify(audio, null, 2)}\n`);
}

async function withFixture(run, options) {
  const fixture = await makeFixture(options);
  try {
    await run(fixture);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

test("builds a deterministic fail-closed readiness report from verified evidence", async () => {
  await withFixture(async (fixture) => {
    const options = {
      projectRoot: fixture.root,
      migrationsRoot: fixture.migrationsRoot,
      toolchainPath: fixture.toolchainPath,
      probeRoot: fixture.probeRoot,
    };
    const first = await buildCourseStrictReadiness(ID, options);
    const second = await buildCourseStrictReadiness(ID, options);
    assert.deepEqual(second, first);
    assert.equal(first.schemaVersion, 2);
    assert.equal(first.conclusion.strictAcceptanceReady, false);
    assert.equal(first.conclusion.completionClaimAllowed, false);
    assert.equal(first.migrationStatusChanged, false);
    assert.equal(first.toolReadiness.adobeAnimate.installed, true);
    assert.equal(first.toolReadiness.jsflCliProbe.status, "passed");
    assert.equal(first.toolReadiness.perFileFlaAuthoringAudit.status, "not-applicable-fla-missing");
    assert.equal(first.machineAudit.report.path, "audit/machine/report.json");
    assert.match(first.machineAudit.report.sha256, /^[a-f0-9]{64}$/);
    assert.ok(first.evidence.every((item) => item.path && /^[a-f0-9]{64}$/.test(item.sha256)));
    assert.equal("releaseScope" in first, false);
    assert.equal(first.evidence.some(({ id }) => id === "lesson-release-catalog"), false);

    await materializeCourseStrictReadiness(ID, { ...options, check: false });
    await materializeCourseStrictReadiness(ID, { ...options, check: true });
  });
});

test("builds an exact release-scoped generic profile without inventing member behavior or acceptance", async () => {
  await withFixture(async (fixture) => {
    await writeReleaseCatalog(fixture);
    const options = {
      projectRoot: fixture.root,
      migrationsRoot: fixture.migrationsRoot,
      toolchainPath: fixture.toolchainPath,
      probeRoot: fixture.probeRoot,
      releaseId: RELEASE_ID,
    };
    const first = await buildCourseStrictReadiness(RELEASE_MEMBER_ID, options);
    const second = await buildCourseStrictReadiness(RELEASE_MEMBER_ID, options);
    assert.deepEqual(second, first);
    assert.equal(first.releaseScope.releaseId, RELEASE_ID);
    assert.equal(first.releaseScope.publicationMode, "atomic");
    assert.equal(first.releaseScope.exactMembershipVerified, true);
    assert.equal(first.releaseScope.expectedMemberCount, 2);
    assert.equal(first.releaseScope.member.ordinal, 1);
    assert.equal(first.releaseScope.member.releaseRole, "active-xml-referenced-page");
    assert.equal(first.releaseScope.profileKind, "machine-derived-conservative-generic");
    assert.equal(first.releaseScope.strictAcceptanceEffect, false);
    assert.equal(first.conclusion.risk, "critical");
    assert.equal(first.conclusion.strictAcceptanceReady, false);
    assert.equal(first.conclusion.completionClaimAllowed, false);
    assert.equal(first.migrationStatusChanged, false);
    assert.equal(first.review.decision, "pending");
    assert.ok(first.machineAudit.observedBehaviorFromExtractedScripts.every((item) => /^(Hash-verified|Atomic release)/.test(item)));
    assert.match(first.machineAudit.observedBehaviorFromExtractedScripts[0], /2-frame root timeline at 12 fps/);
    assert.match(first.machineAudit.observedBehaviorFromExtractedScripts[1], /1 conservative ActionScript\/interaction-state signals/);
    assert.match(first.branchCaptureReadiness.requiredScenarioInventory.join("\n"), /every reachable interaction, branch, and state transition/);
    assert.ok(first.evidence.some(({ id, path: evidencePath }) => id === "lesson-release-catalog" && evidencePath === "catalog/lesson-releases.json"));
    assert.ok(first.evidence.some(({ id, path: evidencePath }) => id === "lesson-source-xml" && evidencePath.endsWith("/index.xml")));

    await materializeCourseStrictReadiness(RELEASE_MEMBER_ID, options);
    await materializeCourseStrictReadiness(RELEASE_MEMBER_ID, { ...options, check: true });
  }, { id: RELEASE_MEMBER_ID, releaseSource: "HELP_COURSES/ELMGR9/L99/IN/L99IN01.swf" });
});

test("release mode preserves a fractional native stage behind an explicit ceil-raster contract", async () => {
  await withFixture(async (fixture) => {
    await writeReleaseCatalog(fixture);
    const manifestPath = path.join(fixture.workspace, "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.runtime.stage = { width: 7.5, height: 5.25 };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const machinePath = path.join(fixture.workspace, "audit", "machine", "report.json");
    const machine = JSON.parse(await readFile(machinePath, "utf8"));
    machine.findings.ffdecHeader.widthPx = 7.5;
    machine.findings.ffdecHeader.heightPx = 5.25;
    await writeFile(machinePath, `${JSON.stringify(machine, null, 2)}\n`);

    const baselinePath = path.join(fixture.workspace, "baseline", "ffdec-root-frames.json");
    const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
    baseline.runtime.stage = { width: 7.5, height: 5.25 };
    baseline.runtime.rasterization = {
      rule: "ceil-positive-native-stage-dimensions",
      width: 8,
      height: 6,
      rationale: "PNG dimensions are whole pixels.",
    };
    await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);

    const options = {
      projectRoot: fixture.root,
      migrationsRoot: fixture.migrationsRoot,
      toolchainPath: fixture.toolchainPath,
      probeRoot: fixture.probeRoot,
      releaseId: RELEASE_ID,
    };
    const report = await buildCourseStrictReadiness(RELEASE_MEMBER_ID, options);
    assert.deepEqual(report.machineAudit.stage, { width: 7.5, height: 5.25 });
    assert.deepEqual(report.baselineReadiness.ffdecStructuralRootFrameExport.nativeStage, { width: 7.5, height: 5.25 });
    assert.equal(report.baselineReadiness.ffdecStructuralRootFrameExport.rasterization.width, 8);
    assert.match(report.machineAudit.observedBehaviorFromExtractedScripts[2], /explicit ceil-positive-native-stage-dimensions PNG raster 8x6/);
    assert.match(report.executableNextActions.join("\n"), /native 7\.5x5\.25 stage/);

    delete baseline.runtime.rasterization;
    await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    await assert.rejects(
      buildCourseStrictReadiness(RELEASE_MEMBER_ID, options),
      /fractional native stage requires an explicitly authorized rasterization contract/,
    );
  }, { id: RELEASE_MEMBER_ID, releaseSource: "HELP_COURSES/ELMGR9/L99/IN/L99IN01.swf" });
});

test("release mode fails closed on workspace binding drift", async () => {
  await withFixture(async (fixture) => {
    await writeReleaseCatalog(fixture);
    const manifestPath = path.join(fixture.workspace, "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.assetId = `swf-${"f".repeat(64)}`;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(
      buildCourseStrictReadiness(RELEASE_MEMBER_ID, {
        projectRoot: fixture.root,
        migrationsRoot: fixture.migrationsRoot,
        toolchainPath: fixture.toolchainPath,
        probeRoot: fixture.probeRoot,
        releaseId: RELEASE_ID,
      }),
      /release\/workspace assetId mismatch/,
    );
  }, { id: RELEASE_MEMBER_ID, releaseSource: "HELP_COURSES/ELMGR9/L99/IN/L99IN01.swf" });
});

test("release-wide generation writes and checks every exact member while all remain blocked", async () => {
  await withFixture(async (fixture) => {
    await writeReleaseCatalog(fixture);
    await cloneReleaseShellWorkspace(fixture);
    const options = {
      projectRoot: fixture.root,
      migrationsRoot: fixture.migrationsRoot,
      toolchainPath: fixture.toolchainPath,
      probeRoot: fixture.probeRoot,
      releaseId: RELEASE_ID,
    };
    const written = await buildAllCourseStrictReadiness(options);
    assert.deepEqual(written.map(({ id, status }) => ({ id, status })), [
      { id: RELEASE_MEMBER_ID, status: "blocked" },
      { id: RELEASE_SHELL_ID, status: "blocked" },
    ]);
    const page = JSON.parse(await readFile(path.join(fixture.workspace, "audit", "strict-readiness.json"), "utf8"));
    const shell = JSON.parse(await readFile(path.join(fixture.migrationsRoot, RELEASE_SHELL_ID, "audit", "strict-readiness.json"), "utf8"));
    assert.equal(page.releaseScope.member.ordinal, 1);
    assert.equal(shell.releaseScope.member.ordinal, 2);
    assert.equal(shell.releaseScope.member.releaseRole, "course-shell");
    assert.equal(page.conclusion.strictAcceptanceReady, false);
    assert.equal(shell.conclusion.strictAcceptanceReady, false);
    assert.equal(page.review.decision, "pending");
    assert.equal(shell.review.decision, "pending");
    const checked = await buildAllCourseStrictReadiness({ ...options, check: true });
    assert.deepEqual(checked, written);
  }, { id: RELEASE_MEMBER_ID, releaseSource: "HELP_COURSES/ELMGR9/L99/IN/L99IN01.swf" });
});

test("release-wide generation validates every exact member before writing any report", async () => {
  await withFixture(async (fixture) => {
    await writeReleaseCatalog(fixture);
    await assert.rejects(
      buildAllCourseStrictReadiness({
        projectRoot: fixture.root,
        migrationsRoot: fixture.migrationsRoot,
        toolchainPath: fixture.toolchainPath,
        probeRoot: fixture.probeRoot,
        releaseId: RELEASE_ID,
      }),
      /shell-course-g09-l99-index-local/,
    );
    await assert.rejects(
      () => readFile(path.join(fixture.workspace, "audit", "strict-readiness.json"), "utf8"),
      (error) => error.code === "ENOENT",
    );
  }, { id: RELEASE_MEMBER_ID, releaseSource: "HELP_COURSES/ELMGR9/L99/IN/L99IN01.swf" });
});

test("verifies and pins the complete schema-v2 Animate authoring contract without promoting acceptance", async () => {
  await withFixture(async (fixture) => {
    const report = await buildCourseStrictReadiness(FLA_ID, {
      projectRoot: fixture.root,
      migrationsRoot: fixture.migrationsRoot,
      toolchainPath: fixture.toolchainPath,
      probeRoot: fixture.probeRoot,
    });
    const authoring = report.toolReadiness.perFileFlaAuthoringAudit;
    assert.equal(authoring.status, "verified-current-recursive-authoring-audit");
    assert.equal(authoring.comprehensiveCurrentContract, true);
    assert.equal(authoring.strictAcceptanceEffect, false);
    assert.equal(authoring.recursiveLibraryTimelineAuditVerified, true);
    assert.equal(authoring.auditScript.path, "scripts/animate-audit-current-document.jsfl");
    assert.equal(authoring.workingCopy.path, `work/animate/read-only-fla-copies/${FLA_ID}/fixture.fla`);
    assert.equal(authoring.workingCopy.readOnly, true);
    assert.equal(authoring.capturedAuthoringFrame.path, "audit/adobe-animate-2021-authoring-frame-0002.png");
    assert.deepEqual(
      report.evidence.filter(({ id }) => id.startsWith("animate-authoring-")).map(({ id }) => id),
      [
        "animate-authoring-audit",
        "animate-authoring-audit-script",
        "animate-authoring-working-copy",
        "animate-authoring-frame",
      ],
    );
    assert.ok(report.evidence.every(({ sha256: hash }) => /^[a-f0-9]{64}$/.test(hash)));
    assert.equal(report.source.authoringInspection, "verified-current-recursive-authoring-audit");
    assert.equal(report.conclusion.strictAcceptanceReady, false);
    assert.equal(report.conclusion.completionClaimAllowed, false);
    assert.equal(report.migrationStatusChanged, false);
    assert.equal(report.review.decision, "pending");
    assert.ok(report.strictGateBlockers.every((blocker) => !blocker.includes("schema-v1")));
  }, { id: FLA_ID, authoringSchema: 2 });
});

test("classifies a hash-valid schema-v1 shallow Animate audit as refresh-required", async () => {
  await withFixture(async (fixture) => {
    const report = await buildCourseStrictReadiness(FLA_ID, {
      projectRoot: fixture.root,
      migrationsRoot: fixture.migrationsRoot,
      toolchainPath: fixture.toolchainPath,
      probeRoot: fixture.probeRoot,
    });
    const authoring = report.toolReadiness.perFileFlaAuthoringAudit;
    assert.equal(authoring.status, "legacy-partial-authoring-audit-refresh-required");
    assert.equal(authoring.canonicalSchemaVersion, 1);
    assert.equal(authoring.comprehensiveCurrentContract, false);
    assert.match(authoring.blocker, /schema-v1 Animate audit is shallow/);
    assert.deepEqual(
      report.evidence.filter(({ id }) => id.startsWith("animate-authoring-")).map(({ id }) => id),
      ["animate-authoring-audit", "animate-authoring-frame"],
    );
    assert.equal(report.conclusion.strictAcceptanceReady, false);
    assert.equal(report.conclusion.completionClaimAllowed, false);
    assert.ok(report.executableNextActions.some((action) => action.includes("human-assisted")));
  }, { id: FLA_ID, authoringSchema: 1 });
});

test("fails closed when a schema-v2 Animate audit script pin or working-copy permissions are stale", async () => {
  await withFixture(async (fixture) => {
    const canonical = JSON.parse(await readFile(fixture.canonicalAuthoringAuditPath, "utf8"));
    canonical.auditScript.sha256 = "f".repeat(64);
    await writeFile(fixture.canonicalAuthoringAuditPath, `${JSON.stringify(canonical, null, 2)}\n`);
    await assert.rejects(
      buildCourseStrictReadiness(FLA_ID, {
        projectRoot: fixture.root,
        migrationsRoot: fixture.migrationsRoot,
        toolchainPath: fixture.toolchainPath,
        probeRoot: fixture.probeRoot,
      }),
      /Animate schema-v2 audit script: hash mismatch/,
    );
  }, { id: FLA_ID, authoringSchema: 2 });

  await withFixture(async (fixture) => {
    await chmod(fixture.workingCopyPath, 0o644);
    await assert.rejects(
      buildCourseStrictReadiness(FLA_ID, {
        projectRoot: fixture.root,
        migrationsRoot: fixture.migrationsRoot,
        toolchainPath: fixture.toolchainPath,
        probeRoot: fixture.probeRoot,
      }),
      /working copy is currently writable/,
    );
  }, { id: FLA_ID, authoringSchema: 2 });
});

test("readiness is reproducible after human/owner signatures and complete status", async () => {
  await withFixture(async (fixture) => {
    const options = {
      projectRoot: fixture.root,
      migrationsRoot: fixture.migrationsRoot,
      toolchainPath: fixture.toolchainPath,
      probeRoot: fixture.probeRoot,
    };
    const before = await buildCourseStrictReadiness(ID, options);
    const manifestPath = path.join(fixture.workspace, "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.status = "complete";
    manifest.acceptance = {
      humanVisualReview: {decision: "accepted", reviewer: "Named human", reviewedAt: "2026-07-22T00:00:00.000Z"},
      ownerReview: {decision: "accepted", reviewer: "Named owner", reviewedAt: "2026-07-22T01:00:00.000Z"},
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const after = await buildCourseStrictReadiness(ID, options);
    assert.deepEqual(after, before);
    assert.equal("migrationStatusObserved" in after, false);
  });
});

test("rejects a stale hash pinned inside audit/machine/report.json", async () => {
  await withFixture(async (fixture) => {
    await writeFile(fixture.machineOutputPath, gzipSync(Buffer.from("changed evidence\n"), { mtime: 0 }));
    await assert.rejects(
      buildCourseStrictReadiness(ID, {
        projectRoot: fixture.root,
        migrationsRoot: fixture.migrationsRoot,
        toolchainPath: fixture.toolchainPath,
        probeRoot: fixture.probeRoot,
      }),
      /machine output: hash mismatch/,
    );
  });
});

test("rejects a stale path/hash pin inside the selected Animate probe", async () => {
  await withFixture(async (fixture) => {
    await writeFile(fixture.auditTemplatePath, "tampered audit template");
    await assert.rejects(
      buildCourseStrictReadiness(ID, {
        projectRoot: fixture.root,
        migrationsRoot: fixture.migrationsRoot,
        toolchainPath: fixture.toolchainPath,
        probeRoot: fixture.probeRoot,
      }),
      /No passing Animate JSFL CLI probe result is available|Animate probe artifact: hash mismatch/,
    );
  });
});

test("--check rejects a stale generated readiness report", async () => {
  await withFixture(async (fixture) => {
    const options = {
      projectRoot: fixture.root,
      migrationsRoot: fixture.migrationsRoot,
      toolchainPath: fixture.toolchainPath,
      probeRoot: fixture.probeRoot,
    };
    await materializeCourseStrictReadiness(ID, options);
    const output = path.join(fixture.workspace, "audit", "strict-readiness.json");
    const report = JSON.parse(await readFile(output, "utf8"));
    report.conclusion.strictAcceptanceReady = true;
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
    await assert.rejects(materializeCourseStrictReadiness(ID, { ...options, check: true }), /strict-readiness\.json is stale/);
  });
});

test("parses checker overrides and rejects unknown flags", () => {
  const options = parseArgs([
    "--check",
    "--release-id",
    "lesson-fixture",
    "--lesson-releases",
    "/tmp/releases.json",
    "--project-root",
    "/tmp/project",
    "--probe-root",
    "/tmp/probes",
  ]);
  assert.equal(options.check, true);
  assert.equal(options.releaseId, "lesson-fixture");
  assert.equal(options.lessonReleasesPath, "/tmp/releases.json");
  assert.equal(options.projectRoot, "/tmp/project");
  assert.equal(options.probeRoot, "/tmp/probes");
  assert.throws(() => parseArgs(["--release-id"]), /requires a value/);
  assert.throws(() => parseArgs(["--release-id", "one", "--release-id", "two"]), /only once/);
  assert.throws(() => parseArgs(["--promote"]), /Unknown option/);
});
