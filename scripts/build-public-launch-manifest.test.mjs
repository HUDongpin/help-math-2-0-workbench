import assert from "node:assert/strict";
import {mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildPublicLaunchArtifact,
  buildPublicLaunchManifest,
  checkPublicLaunchArtifact,
  computePublicLaunchGeneratedMarker,
  derivePublicLaunchSmokeRoutes,
  derivePublicLaunchSummary,
  parseArguments,
  validatePublicLaunchManifestContract,
} from "./build-public-launch-manifest.mjs";

const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);
const SHA_C = "c".repeat(64);
const SHA_D = "d".repeat(64);

let baseline;
let baselineText;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function refresh(manifest) {
  manifest.smokeRoutes = derivePublicLaunchSmokeRoutes(
    manifest.publicRoutes,
    manifest.lessons,
  );
  manifest.summary = derivePublicLaunchSummary(manifest);
  manifest.generatedMarker = computePublicLaunchGeneratedMarker(manifest);
  return manifest;
}

function previewLesson(manifest, lessonKey = "g04-l03") {
  const lesson = manifest.lessons.find((candidate) =>
    candidate.lessonKey === lessonKey);
  assert.ok(lesson, lessonKey);
  assert.equal(lesson.currentJs.complete, true, lessonKey);
  Object.assign(lesson.publication, {
    tier: "preview",
    routeAuthorized: true,
    indexable: true,
    runtimeAssetClosureSha256: SHA_A,
    previewProductQaReceiptSha256: SHA_B,
    ownerPreviewDecisionSha256: SHA_C,
  });
  return lesson;
}

test.before(async () => {
  const artifact = await buildPublicLaunchArtifact();
  baseline = artifact.manifest;
  baselineText = artifact.text;
});

test("derives the exact 29-Lesson page-only public catalog without legacy shells", () => {
  assert.equal(baseline.lessons.length, 29);
  assert.equal(baseline.summary.lessonCount, 29);
  assert.equal(baseline.summary.pageOccurrenceDenominator, 1_751);
  assert.equal(baseline.launchContract.courseShellCount, 0);
  assert.deepEqual(Object.fromEntries([3, 4, 5].map((grade) => [
    grade,
    baseline.lessons.filter((lesson) => lesson.grade === grade)
      .reduce((sum, lesson) => sum + lesson.pageOccurrenceCount, 0),
  ])), {3: 546, 4: 645, 5: 560});
  assert.deepEqual(baseline.lessons.map(({catalogOrdinal}) => catalogOrdinal),
    Array.from({length: 29}, (_, index) => index + 1));
  assert.equal(validatePublicLaunchManifestContract(baseline), true);
});

test("keeps 426/425/8 as engineering truth without granting publication", () => {
  assert.equal(baseline.summary.registeredCurrentJsOccurrences, 426);
  assert.equal(baseline.summary.registeredCurrentJsUniqueRenderers, 425);
  assert.equal(baseline.summary.currentJsCompleteLessons, 8);
  const g5l3 = baseline.lessons.find(({lessonKey}) => lessonKey === "g05-l03");
  assert.ok(g5l3);
  assert.equal(g5l3.pageOccurrenceCount, 65);
  assert.equal(g5l3.currentJs.registeredOccurrenceCount, 65);
  assert.equal(g5l3.currentJs.registeredUniqueRendererCount, 64);
  assert.deepEqual(baseline.summary.publicationCounts, {
    unavailable: 29,
    preview: 0,
    released: 0,
  });
  assert.equal(baseline.summary.publiclyRoutableLessons, 0);
  assert.equal(baseline.summary.strictCompleteLessons, 0);
  assert.equal(baseline.smokeRoutes.some(({kind}) => kind === "lesson"), false);
});

test("keeps all public features as exact boolean false", () => {
  assert.deepEqual(baseline.publicFeatures, {
    novaTutor: false,
    lrs: false,
    auth: false,
    teacher: false,
    family: false,
    contactForm: false,
  });
  for (const [key, value] of Object.entries(baseline.publicFeatures)) {
    assert.equal(typeof value, "boolean", key);
    assert.equal(value, false, key);
  }
  for (const invalid of [true, "false", null]) {
    const candidate = clone(baseline);
    candidate.publicFeatures.novaTutor = invalid;
    assert.throws(() => validatePublicLaunchManifestContract(candidate, {
      validateGeneratedMarker: false,
    }), /novaTutor must be the boolean false/u);
  }
});

test("rejects unavailable Lessons that acquire routes or publication evidence", () => {
  const routed = clone(baseline);
  routed.lessons[0].publication.routeAuthorized = true;
  assert.throws(() => validatePublicLaunchManifestContract(routed, {
    validateGeneratedMarker: false,
  }), /unavailable Lesson cannot be routed or indexed/u);

  const receipt = clone(baseline);
  receipt.lessons[0].publication.ownerPreviewDecisionSha256 = SHA_A;
  assert.throws(() => validatePublicLaunchManifestContract(receipt, {
    validateGeneratedMarker: false,
  }), /unavailable Lesson cannot carry publication receipts/u);
});

test("requires every Preview engineering, asset, QA, Owner, route, and index gate", () => {
  const fields = [
    ["runtimeAssetClosureSha256", null],
    ["previewProductQaReceiptSha256", null],
    ["ownerPreviewDecisionSha256", null],
    ["routeAuthorized", false],
    ["indexable", false],
  ];
  for (const [field, invalid] of fields) {
    const candidate = clone(baseline);
    const lesson = previewLesson(candidate);
    lesson.publication[field] = invalid;
    assert.throws(() => validatePublicLaunchManifestContract(candidate, {
      validateGeneratedMarker: false,
    }), /Preview\/Released/u, field);
  }
  const incomplete = clone(baseline);
  const lesson = incomplete.lessons.find(({lessonKey}) => lessonKey === "g03-l01");
  assert.ok(lesson);
  Object.assign(lesson.publication, {
    tier: "preview",
    routeAuthorized: true,
    indexable: true,
    runtimeAssetClosureSha256: SHA_A,
    previewProductQaReceiptSha256: SHA_B,
    ownerPreviewDecisionSha256: SHA_C,
  });
  assert.throws(() => validatePublicLaunchManifestContract(incomplete, {
    validateGeneratedMarker: false,
  }), /complete Current-JS and My Lesson/u);
});

test("accepts a Preview while keeping strict and release receipts independently null", () => {
  const candidate = clone(baseline);
  const lesson = previewLesson(candidate);
  refresh(candidate);
  assert.equal(validatePublicLaunchManifestContract(candidate), true);
  assert.equal(candidate.summary.publicationCounts.preview, 1);
  assert.equal(candidate.summary.publicationCounts.released, 0);
  assert.equal(candidate.summary.strictCompleteLessons, 0);
  for (const key of [
    "originalRuntimeReceiptSha256",
    "technicalComparisonReceiptSha256",
    "audioAcceptanceReceiptSha256",
    "humanVisualAcceptanceReceiptSha256",
    "ownerReleaseDecisionSha256",
    "strictCompletionReceiptSha256",
    "productionTrustReceiptSha256",
    "productionVerificationReceiptSha256",
  ]) assert.equal(lesson.publication[key], null, key);
});

test("does not relabel partially evidenced Preview as Released", () => {
  const candidate = clone(baseline);
  const lesson = previewLesson(candidate);
  lesson.publication.audioAcceptanceReceiptSha256 = SHA_D;
  refresh(candidate);
  assert.equal(validatePublicLaunchManifestContract(candidate), true);
  assert.equal(candidate.summary.publicationCounts.preview, 1);
  assert.equal(candidate.summary.publicationCounts.released, 0);
});

test("requires the complete strict receipt set for Released", () => {
  const receiptFields = [
    "originalRuntimeReceiptSha256",
    "technicalComparisonReceiptSha256",
    "audioAcceptanceReceiptSha256",
    "humanVisualAcceptanceReceiptSha256",
    "ownerReleaseDecisionSha256",
    "strictCompletionReceiptSha256",
    "productionTrustReceiptSha256",
    "productionVerificationReceiptSha256",
  ];
  for (const missing of receiptFields) {
    const candidate = clone(baseline);
    const lesson = previewLesson(candidate);
    lesson.publication.tier = "released";
    for (const field of receiptFields) lesson.publication[field] = SHA_D;
    lesson.publication[missing] = null;
    assert.throws(() => validatePublicLaunchManifestContract(candidate, {
      validateGeneratedMarker: false,
    }), /Released requires every strict release receipt/u, missing);
  }
  const valid = clone(baseline);
  const lesson = previewLesson(valid);
  lesson.publication.tier = "released";
  for (const field of receiptFields) lesson.publication[field] = SHA_D;
  refresh(valid);
  assert.equal(validatePublicLaunchManifestContract(valid), true);
  assert.equal(valid.summary.publicationCounts.released, 1);
  assert.equal(valid.summary.publicationCounts.preview, 0);
});

test("fails closed on extra fields, invalid hashes, duplicate Lessons, and routes", () => {
  const extra = clone(baseline);
  extra.unreviewedShortcut = true;
  assert.throws(() => validatePublicLaunchManifestContract(extra, {
    validateGeneratedMarker: false,
  }), /manifest fields must be exactly/u);

  const badHash = clone(baseline);
  badHash.lessons[0].currentJs.engineeringBindingSha256 = "not-a-hash";
  assert.throws(() => validatePublicLaunchManifestContract(badHash, {
    validateGeneratedMarker: false,
  }), /completion\/binding is invalid/u);

  const duplicate = clone(baseline);
  duplicate.lessons[1] = clone(duplicate.lessons[0]);
  duplicate.lessons[1].catalogOrdinal = 2;
  assert.throws(() => validatePublicLaunchManifestContract(duplicate, {
    validateGeneratedMarker: false,
  }), /Lesson keys must be unique|grade occurrence denominators/u);

  const duplicateRoute = clone(baseline);
  duplicateRoute.lessons[1].routes = clone(duplicateRoute.lessons[0].routes);
  assert.throws(() => validatePublicLaunchManifestContract(duplicateRoute, {
    validateGeneratedMarker: false,
  }), /routes drifted|Lesson routes must be unique/u);
});

test("rejects denominator and summary drift", () => {
  const occurrence = clone(baseline);
  occurrence.lessons[0].pageOccurrenceCount += 1;
  assert.throws(() => validatePublicLaunchManifestContract(occurrence, {
    validateGeneratedMarker: false,
  }), /currentJs.complete drifted|summary|denominator/u);

  const summary = clone(baseline);
  summary.summary.registeredCurrentJsOccurrences += 1;
  assert.throws(() => validatePublicLaunchManifestContract(summary, {
    validateGeneratedMarker: false,
  }), /summary must be mechanically derived/u);
});

test("is deterministic and validates its payload marker", async () => {
  const first = await buildPublicLaunchArtifact();
  const second = await buildPublicLaunchArtifact();
  assert.equal(first.text, second.text);
  assert.equal(first.text, baselineText);
  assert.equal(first.manifest.generatedMarker,
    computePublicLaunchGeneratedMarker(first.manifest));
  const drifted = clone(first.manifest);
  drifted.lessons[0].title.en += " drift";
  assert.throws(() => validatePublicLaunchManifestContract(drifted),
    /generatedMarker is stale/u);
});

test("blocks generation when the checked-in page-only ledger is stale", async () => {
  const directory = await mkdtemp(path.join(
    process.env.TMPDIR ?? os.tmpdir(),
    "help-math-public-launch-ledger-",
  ));
  const stalePath = path.join(directory, "page-only.json");
  const current = await readFile(
    new URL("../catalog/page-only-migration-control-ledger.json", import.meta.url),
    "utf8",
  );
  await writeFile(stalePath, `${current.trimEnd()} \n`);
  await assert.rejects(() => buildPublicLaunchManifest({
    pageOnlyLedgerPath: stalePath,
  }), /is stale; public launch manifest generation is blocked/u);
});

test("binds optional deploy-manifest presence without inferring currentness", async () => {
  const directory = await mkdtemp(path.join(
    process.env.TMPDIR ?? os.tmpdir(),
    "help-math-public-launch-deploy-",
  ));
  const deployPath = path.join(directory, "deploy.json");
  await writeFile(deployPath, '{"unreviewed":true}\n');
  const candidate = await buildPublicLaunchManifest({
    deployAssetManifestPath: deployPath,
  });
  assert.match(candidate.sourceBindings.deployAssetManifest.sha256,
    /^[a-f0-9]{64}$/u);
  assert.equal(candidate.sourceBindings.deployAssetManifest.current, false);
  assert.equal(candidate.assetClosure.deployAssetManifestCurrent, false);
  assert.equal(candidate.summary.launchReadiness, "NO_GO");
  assert.notEqual(candidate.generatedMarker, baseline.generatedMarker);
});

test("--check detects missing and stale outputs without writing them", async () => {
  const directory = await mkdtemp(path.join(
    process.env.TMPDIR ?? os.tmpdir(),
    "help-math-public-launch-check-",
  ));
  const manifestPath = path.join(directory, "manifest.json");
  const missing = await checkPublicLaunchArtifact({manifestPath});
  assert.equal(missing.ok, false);
  await assert.rejects(() => readFile(manifestPath), {code: "ENOENT"});
  await writeFile(manifestPath, '{}\n');
  const stale = await checkPublicLaunchArtifact({manifestPath});
  assert.equal(stale.ok, false);
  assert.equal(await readFile(manifestPath, "utf8"), '{}\n');
});

test("treats Draft legal content as structurally valid but launch NO_GO", () => {
  assert.equal(baseline.legalAndSupport.privacy.state, "draft");
  assert.equal(baseline.legalAndSupport.terms.state, "draft");
  assert.equal(baseline.legalAndSupport.accessibility.state, "missing");
  assert.equal(baseline.legalAndSupport.support.state,
    "runtime-binding-pending");
  assert.equal(baseline.summary.legalPagesFinal, false);
  assert.equal(baseline.summary.assetClosureCurrent, false);
  assert.equal(baseline.summary.minimumPreviewLessonsSatisfied, false);
  assert.equal(baseline.summary.externalInputsComplete, true);
  assert.equal(baseline.summary.launchReadiness, "NO_GO");
});

test("never derives GO when any required external input is absent", () => {
  const authorized = clone(baseline);
  previewLesson(authorized, "g04-l03");
  previewLesson(authorized, "g05-l04");
  for (const route of authorized.publicRoutes) {
    route.authorized = true;
    route.indexable = true;
  }
  for (const page of ["privacy", "terms", "accessibility"]) {
    authorized.legalAndSupport[page] = {
      state: "approved",
      approvalReceiptSha256: SHA_A,
      contentSha256: SHA_B,
    };
  }
  authorized.legalAndSupport.support = {
    state: "approved",
    mailboxVerificationReceiptSha256: SHA_A,
    runtimeValueBindingSha256: SHA_B,
    approvalReceiptSha256: SHA_C,
  };
  authorized.assetClosure.deployAssetManifestCurrent = true;
  authorized.assetClosure.deployAssetManifestSha256 = SHA_D;
  authorized.sourceBindings.deployAssetManifest.current = true;
  authorized.sourceBindings.deployAssetManifest.sha256 = SHA_D;
  assert.equal(derivePublicLaunchSummary(authorized).launchReadiness, "GO");

  const missingInputs = [
    ["operatingLegalEntityReceived", "operating-legal-entity-not-received"],
    ["jurisdictionReceived", "jurisdiction-not-received"],
    ["staffedAdultSupportEmailReceived", "staffed-adult-support-email-not-received"],
    ["staffedAdultSupportEmailTwoWayVerified",
      "staffed-adult-support-email-not-two-way-verified"],
  ];
  for (const [field, blocker] of missingInputs) {
    const candidate = clone(authorized);
    candidate.legalAndSupport[field] = false;
    const summary = derivePublicLaunchSummary(candidate);
    assert.equal(summary.externalInputsComplete, false, field);
    assert.equal(summary.launchReadiness, "NO_GO", field);
    assert.deepEqual(summary.blockers, [blocker], field);
  }
});

test("parses only the documented fail-closed CLI switches", () => {
  assert.deepEqual(parseArguments([]), {check: false, json: false, help: false});
  assert.deepEqual(parseArguments(["--check", "--json"]),
    {check: true, json: true, help: false});
  assert.throws(() => parseArguments(["--go"]), /Unknown argument/u);
});
