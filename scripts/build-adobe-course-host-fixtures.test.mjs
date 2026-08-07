import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildFixtureSpecification,
  parseArguments,
  renderBaseSwfXml,
  renderHostActionScript,
  renderSandboxProfile,
  verifyFixtureManifest,
  verifyLaunchAuthorization,
} from "./build-adobe-course-host-fixtures.mjs";

const childHash = "a".repeat(64);
const audioHash = "b".repeat(64);

function evidenceFixture({withRandom = true} = {}) {
  const animationId = "course-g03-l06-ti-001";
  return {
    inventory: {
      animationId,
      source: {
        swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf",
        swfSha256: childHash,
        stage: {width: 800, height: 600},
        fps: 12,
        rootFrameCount: 10,
        actionScriptVersion: "AS1/2",
      },
      dependencies: {
        bindings: [
          {
            binding: "_global.quizSection",
            scope: "_global",
            fixtureRequirement: "shared-state-must-be-initialized-per-scenario",
            originalDefaultStatus: "single-source-literal-candidate-not-runtime-proven",
            sourceInitializationCandidates: [{expression: "false", parsedLiteral: {kind: "boolean", value: false}, evidence: {artifactId: "ffdec-scripts", line: 5}}],
            evidence: {artifactId: "ffdec-scripts", line: 5},
          },
          {
            binding: "_root.unresolvedHostValue",
            scope: "_root",
            fixtureRequirement: "required-or-explicitly-proven-absent",
            originalDefaultStatus: "unresolved-or-multiple-runtime-values",
            sourceInitializationCandidates: [],
            evidence: {artifactId: "ffdec-scripts", line: 6},
          },
          {
            binding: "_global.tempRandomSoundMc",
            scope: "_global",
            fixtureRequirement: "none-intrinsic-or-child-self-initialized",
            originalDefaultStatus: "not-applicable-no-host-default",
            sourceInitializationCandidates: [{expression: "\"Mc_Sound_\" + tempNum", parsedLiteral: null, evidence: {artifactId: "ffdec-scripts", line: 14}}],
            staticResolution: {
              status: "resolved-by-hash-verified-static-source-evidence",
              disposition: "child-self-initialized-before-use",
              rationale: "child frame 1 assignment precedes frame 5 use",
              evidence: [{artifactId: "ffdec-scripts", line: 14}],
              strictAcceptanceEffect: "none",
            },
            evidence: {artifactId: "ffdec-scripts", line: 14},
          },
        ],
        safeSideEffectPolicy: [
          {api: "getURL", kind: "network-or-host-navigation", sourceLine: "getURL(target);", evidence: {artifactId: "ffdec-scripts", line: 9}},
          {api: "unloadMovie", kind: "dynamic-movie-unload", sourceLine: "unloadMovie(target);", evidence: {artifactId: "ffdec-scripts", line: 10}},
        ],
      },
      timelineInventory: [{
        timelineId: "root",
        frameLabels: [{frame: 6, label: "begin"}],
      }],
      coverage: {
        randomObligations: withRandom ? [{obligationId: "random-001", expression: "random(2)", evidence: {artifactId: "ffdec-scripts", line: 11}}] : [],
        acceptanceObligationsFromReadiness: [{obligationId: "readiness-01", statement: "every branch"}],
        handlerBehaviorGroups: [{scenarioId: "handler-group-001"}],
        conditionalBranchObligations: [{obligationId: "conditional-001"}],
        buttonTargetObligations: [{buttonObjectId: "1"}],
        inputObligations: [],
        dragObligations: [],
        minimumSetRule: ["capture every frame"],
      },
    },
    audioAudit: {
      animationId,
      source: {expectedSha256: childHash, hashMatches: true},
      externalAudio: {
        exactAssociations: [{
          sourceFile: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/SA/L6TI01.mp3",
          observedSha256: audioHash,
          associationStatus: "exact-basename-association",
          languageAssessment: {language: "es"},
          probe: {durationMs: 1234},
          startFrame: null,
          startFrameAuthority: "host-triggered",
        }],
        lessonGroupCandidates: [],
      },
    },
  };
}

test("fixture specification is fail-closed and keeps the untouched child/audio hashes", () => {
  const specification = buildFixtureSpecification(evidenceFixture());
  assert.equal(specification.stagedDependencies.child.fixturePath, "lesson/TI/L6TI01.swf");
  assert.equal(specification.stagedDependencies.child.expectedSha256, childHash);
  assert.equal(specification.stagedDependencies.exactAudio[0].fixturePath, "lesson/SA/L6TI01.mp3");
  assert.deepEqual(specification.sideEffectPolicy.blockedApis, ["getURL"]);
  assert.equal(specification.sideEffectPolicy.childCalls.find((item) => item.api === "unloadMovie").fixturePolicy, "local-content-addressed-allowlist-only");
  assert.deepEqual(specification.unresolvedBindings, ["_root.unresolvedHostValue"]);
  assert.equal(specification.bindings.find((item) => item.binding === "_global.tempRandomSoundMc").fixtureDisposition, "do-not-inject-intrinsic-or-child-self-initialized");
  assert.equal(specification.entryHandoff.label, "begin");
  assert.equal(specification.entryHandoff.oneIndexedRootFrame, 6);
  assert.equal(specification.randomControl.untouchedAvm1SeedEntry, null);
  assert.match(specification.randomControl.reason, /no seed API/);
  assert.equal(specification.authority.originalHostBehaviorClaimed, false);
});

test("generated host is lazy, local-only, language-guarded, and contains no blocked primitive", () => {
  const specification = buildFixtureSpecification(evidenceFixture({withRandom: false}));
  const source = renderHostActionScript(specification, "c".repeat(64));
  assert.match(source, /_root\.onMouseDown/);
  assert.match(source, /MovieClipLoader/);
  assert.match(source, /__fixtureEntryLabel = "begin"/);
  assert.match(source, /target\.gotoAndPlay\(_global\.__fixtureEntryLabel\)/);
  assert.match(source, /child-entry-handoff/);
  assert.match(source, /lesson\/TI\/L6TI01\.swf/);
  assert.match(source, /__fixtureAudioAllowlist\["lesson\/SA\/L6TI01\.mp3"\] = true/);
  assert.match(source, /keyCode == 83/);
  assert.match(source, /keyCode == 69/);
  assert.doesNotMatch(source, /\bgetURL\s*\(/);
  assert.doesNotMatch(source, /\bfscommand\s*\(/);
  assert.doesNotMatch(source, /\bloadVariables(?:Num)?\s*\(/);
  assert.doesNotMatch(source, /javascript:/i);
  assert.doesNotMatch(source, /https?:\/\//i);
});

test("base SWF and sandbox policy preserve native stage while denying external side effects", () => {
  const xml = renderBaseSwfXml({width: 800, height: 600}, 12);
  assert.match(xml, /right="16000"/);
  assert.match(xml, /bottom="12000"/);
  assert.match(xml, /framerate="12" frames="1"/);
  assert.match(xml, /<DoAction>/);
  const profile = renderSandboxProfile({fixtureRoot: "/private/tmp/fixture", temporaryRoot: "/private/tmp/runtime"});
  assert.match(profile, /\(deny network\*\)/);
  assert.match(profile, /deny appleevent-send/);
  assert.doesNotMatch(profile, /com\.apple\.coreservices\.launchservicesd/);
  assert.match(profile, /com\.apple\.lsd\.open/);
  assert.match(profile, /com\.apple\.lsd\.modifydb/);
  assert.match(profile, /deny file-write\*/);
  assert.match(profile, /\/private\/tmp\/fixture/);
});

test("argument parsing separates build and manifest verification modes", () => {
  const parsed = parseArguments(["--id", "course-g03-l06-ti-001", "--output", "./work/fixture-test", "--no-compile"]);
  assert.deepEqual(parsed.ids, ["course-g03-l06-ti-001"]);
  assert.equal(parsed.compile, false);
  assert.equal(parsed.outputRoot, path.resolve("./work/fixture-test"));
  const verify = parseArguments(["--verify-fixture", "./manifest.json"]);
  assert.equal(verify.verifyFixture, path.resolve("./manifest.json"));
  const launch = parseArguments(["--verify-launch", "./manifest.json"]);
  assert.equal(launch.verifyLaunch, path.resolve("./manifest.json"));
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("fixture manifest verifier rejects a mutated generated file", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "help-fixture-manifest-"));
  const payloadPath = path.join(directory, "payload.txt");
  const manifestPath = path.join(directory, "fixture-manifest.json");
  const payload = "safe\n";
  const generatorSource = await readFile(new URL("./build-adobe-course-host-fixtures.mjs", import.meta.url));
  await writeFile(payloadPath, payload, "utf8");
  await writeFile(manifestPath, JSON.stringify({animationId: "fixture-test", fixtureDigest: "d", generatedBySha256: createHash("sha256").update(generatorSource).digest("hex"), guiSmokeAuthorization: {requiredApproval: "capture/sandbox-gui-smoke-test.json"}, generatedFileHashes: [{path: "payload.txt", sha256: createHash("sha256").update(payload).digest("hex")}]}), "utf8");
  await verifyFixtureManifest(manifestPath);
  await assert.rejects(() => verifyLaunchAuthorization(manifestPath), /GUI sandbox smoke evidence is pending/);
  const captureDirectory = path.join(directory, "capture");
  const evidencePath = path.join(captureDirectory, "smoke.png");
  const evidence = "lossless-smoke-placeholder-for-verifier-test\n";
  await mkdir(captureDirectory);
  await writeFile(evidencePath, evidence, "utf8");
  await writeFile(path.join(captureDirectory, "sandbox-gui-smoke-test.json"), JSON.stringify({
    schemaVersion: 1,
    animationId: "fixture-test",
    fixtureDigest: "d",
    status: "passed",
    reviewer: "test reviewer",
    reviewedAt: "2026-07-21T12:00:00Z",
    evidenceFile: "capture/smoke.png",
    evidenceMimeType: "image/png",
    evidenceSha256: createHash("sha256").update(evidence).digest("hex"),
    observation: "The sandbox pre-load screen was shown and no child was loaded or clicked.",
  }), "utf8");
  const authorized = await verifyLaunchAuthorization(manifestPath);
  assert.equal(authorized.approval.reviewer, "test reviewer");
  await writeFile(payloadPath, "mutated\n", "utf8");
  await assert.rejects(() => verifyFixtureManifest(manifestPath), /hash mismatch/);
  assert.match(await readFile(payloadPath, "utf8"), /mutated/);
});
