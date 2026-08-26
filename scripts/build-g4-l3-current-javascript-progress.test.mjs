import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  generateG4L3CurrentJavascriptProgress,
  lessonSourceAuthorityProjection,
  parseArguments,
} from "./build-g4-l3-current-javascript-progress.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(
  ROOT,
  "reports/g4-l3-current-javascript-progress.json",
);

test("G4 L3 JavaScript progress CLI is explicit", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--unknown"]), /Unknown argument/);
});

test("G4 L3 JavaScript progress reproduces all 39 acceptance-neutral dispositions", async () => {
  const report = await generateG4L3CurrentJavascriptProgress({check: true});
  assert.equal(report.summary.activePages, 39);
  assert.equal(report.pages.length, 39);
  assert.ok(report.summary.currentJavaScriptModules >= 2);
  assert.equal(
    report.summary.currentJavaScriptModules +
      report.summary.pagesWithoutCurrentJavaScript,
    39,
  );
  assert.equal(report.summary.hashBoundCandidateReports, 39);
  assert.equal(report.summary.registeredHashBoundCandidateModules, 39);
  assert.equal(report.summary.pilotPrototypeModules, 0);
  assert.equal(report.summary.mainTimelineAudioCandidateMembers, 34);
  assert.equal(report.summary.mainTimelineAudioEnglishQaPassed, 34);
  assert.equal(report.summary.mainTimelineAudioSpanishQaPassed, 34);
  assert.equal(report.summary.autoplayFallbackQaPassed, true);
  assert.equal(report.summary.randomBranchAudioCandidateMembers, 1);
  assert.equal(report.summary.randomBranchAudioQaPassed, 1);
  assert.equal(report.summary.eventAudioCandidateMembers, 1);
  assert.equal(report.summary.eventAudioQaPassed, 1);
  assert.equal(report.summary.currentJavaScriptAudioCandidateMembers, 36);
  assert.equal(report.summary.currentJavaScriptAudioEnglishQaPassed, 36);
  assert.equal(report.summary.currentJavaScriptAudioSpanishQaPassed, 35);
  assert.equal(report.summary.strictCompletePages, 0);
  assert.equal(
    report.summary.historicalSchemaV3ApprovalAppliedToTheseOutputs,
    0,
  );
  assert.deepEqual(
    report.pages.map((page) => page.globalPageOrdinal),
    Array.from({length: 39}, (_, index) => index + 1),
  );
  assert.ok(
    report.pages
      .filter((page) => page.currentJavaScript.candidateReport)
      .every((page) => page.disposition.startsWith("hash-bound-")),
  );
  assert.ok(
    report.pages.every(
      (page) =>
        page.strict.strictComplete === false &&
        Object.values(page.acceptance).every((value) => value === false),
    ),
  );
  assert.equal(
    report.pages.filter(
      (page) => page.currentJavaScript.audioEngineeringCandidate,
    ).length,
    36,
  );
  assert.ok(
    report.pages
      .filter((page) => page.currentJavaScript.audioEngineeringCandidate)
      .every(
        (page) =>
          page.currentJavaScript.audioEngineeringCandidate.browserQa
            .englishPassed === true &&
          [true, null].includes(
            page.currentJavaScript.audioEngineeringCandidate.browserQa
              .spanishPassed,
          ) &&
          Object.values(
            page.currentJavaScript.audioEngineeringCandidate.acceptance,
          ).every((value) => value === false),
      ),
  );
  const ir001 = report.pages.find(
    (page) => page.animationId === "course-g04-l03-ir-001-341242cc",
  );
  assert.equal(
    ir001?.currentJavaScript.audioEngineeringCandidate?.integration,
    "specialized-random-branch-module",
  );
  assert.equal(
    ir001?.currentJavaScript.audioEngineeringCandidate?.randomBranches.length,
    2,
  );
  assert.equal(
    ir001?.currentJavaScript.audioEngineeringCandidate?.browserQa
      .spanishPassed,
    null,
  );
  const ti003 = report.pages.find(
    (page) => page.animationId === "course-g04-l03-ti-003",
  );
  assert.equal(
    ti003?.currentJavaScript.audioEngineeringCandidate?.integration,
    "specialized-event-sound-module",
  );
  assert.equal(
    ti003?.currentJavaScript.audioEngineeringCandidate?.eventSound?.soundId,
    14,
  );
  assert.equal(
    ti003?.currentJavaScript.audioEngineeringCandidate
      ?.excludedInteractionAudio?.state,
    "disabled-until-source-interaction-branches-are-implemented",
  );
  const in009 = report.pages.find(
    (page) => page.animationId === "course-g04-l03-in-009",
  );
  assert.equal(
    in009?.disposition,
    "hash-bound-current-javascript-engineering-candidate",
  );
  assert.match(
    in009?.currentJavaScript?.candidateReport?.path ?? "",
    /g4-l3-in009-current-javascript-candidate\.json$/,
  );
  assert.deepEqual(
    in009?.currentJavaScript?.candidateOutputs?.map(({kind}) => kind).sort(),
    ["canvasManifest", "canvasRuntime"],
  );
});

test("checked-in progress report never promotes a current output to acceptance", async () => {
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  assert.equal(report.reportType, "g4-l3-current-javascript-progress-acceptance-neutral");
  assert.equal(report.acceptance.acceptanceNeutral, true);
  assert.equal(report.acceptance.strictAcceptanceEffect, "none");
  assert.equal(report.acceptance.lessonComplete, false);
  assert.ok(
    Object.entries(report.acceptance)
      .filter(([name]) => !["acceptanceNeutral", "strictAcceptanceEffect"].includes(name))
      .every(([, value]) => value === false),
  );
  assert.equal(
    report.sourceBindings.lessonProductContract.bindingMode,
    "lesson-source-authority-projection-v1",
  );
  assert.match(
    report.sourceBindings.lessonProductContract.targetProjectionSha256,
    /^[a-f0-9]{64}$/,
  );
  assert.equal(
    report.sourceBindings.lessonProductContract.wholeReportBytesOrSha256Bound,
    false,
  );
  assert.match(
    report.sourceBindings.mainTimelineAudioCandidates.sha256,
    /^[a-f0-9]{64}$/,
  );
  assert.match(
    report.sourceBindings.mainTimelineAudioBrowserQa.sha256,
    /^[a-f0-9]{64}$/,
  );
  assert.match(
    report.sourceBindings.ir001RandomAudioCandidate.sha256,
    /^[a-f0-9]{64}$/,
  );
  assert.match(
    report.sourceBindings.ir001RandomAudioBrowserQa.sha256,
    /^[a-f0-9]{64}$/,
  );
  assert.match(
    report.sourceBindings.ti003EventAudioCandidate.sha256,
    /^[a-f0-9]{64}$/,
  );
  assert.match(
    report.sourceBindings.ti003EventAudioBrowserQa.sha256,
    /^[a-f0-9]{64}$/,
  );
});

test("lesson source projection excludes circular product-QA bindings", async () => {
  const contractPath = path.join(
    ROOT,
    "reports/g4-l3-lesson-product-navigation-contract.json",
  );
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  const drifted = structuredClone(contract);
  drifted.sourceBindings.browserProductQa.sha256 = "0".repeat(64);
  drifted.routes.browserProductQa.evidence.sha256 = "1".repeat(64);
  drifted.pages[0].engineeringEvidence.currentJavascriptProductQaComplete = false;
  assert.deepEqual(
    lessonSourceAuthorityProjection(drifted),
    lessonSourceAuthorityProjection(contract),
  );
});

test("lesson source projection changes when a page is promoted", async () => {
  const contractPath = path.join(
    ROOT,
    "reports/g4-l3-lesson-product-navigation-contract.json",
  );
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  const promoted = structuredClone(contract);
  promoted.pages[0].acceptance.ownerAccepted = true;
  assert.notDeepEqual(
    lessonSourceAuthorityProjection(promoted),
    lessonSourceAuthorityProjection(contract),
  );
});
