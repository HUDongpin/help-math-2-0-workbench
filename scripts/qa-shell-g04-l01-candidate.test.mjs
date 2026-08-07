import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

import {
  ANIMATION_ID,
  AUTHORITY_CLAIM_KEYS,
  ENDPOINT_FRAMES,
  FRAME_DOMAIN,
  IMPLEMENTATION_PATHS,
  LANGUAGES,
  SCENARIOS,
  allAuthorityClaimsFalse,
  bindCandidateQaHash,
  buildCandidateQaIdentity,
  buildCandidateUrl,
  buildCompletionAdmissionSnapshot,
  buildEndpointMatrix,
  endpointIdentityPass,
  expectedEndpointState,
  normalizeLoopbackBaseUrl,
  parseArguments,
  protectedMigrationSnapshot,
  runtimeAndCandidateIdentityPass,
} from "./qa-shell-g04-l01-candidate.mjs";
import {devOverlaySuppressionPass} from "./qa-next-dev-overlay.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(
  projectRoot,
  "migrations/shell-course-g04-l01-index-local/migration.json",
);
const reportPath = path.join(
  projectRoot,
  "migrations/shell-course-g04-l01-index-local/evidence/native-navigation-candidate-qa.json",
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exactState(request, identity, {width = 800, height = 600} = {}) {
  const expected = expectedEndpointState(request);
  const shared = {
    animationId: ANIMATION_ID,
    frame: String(request.frame),
    frameDomain: FRAME_DOMAIN,
    rootFrame: String(request.frame),
    requirementId: identity.requirementId,
    traceId: identity.traceId,
    entryStateSha256: identity.entryStateSha256,
    scenario: request.scenario,
    language: request.language,
    seed: String(request.seed),
  };
  return {
    runtime: shared,
    candidate: {
      ...shared,
      stateFrameDomain: FRAME_DOMAIN,
      renderState: "ready",
      renderVisual: "true",
      phase: expected.phase,
      view: expected.view,
    },
    stage: {width, height},
  };
}

test("shell QA CLI accepts only unembellished loopback origins", () => {
  assert.equal(normalizeLoopbackBaseUrl("http://127.0.0.1:3427"), "http://127.0.0.1:3427");
  assert.equal(normalizeLoopbackBaseUrl("http://localhost:3427/"), "http://localhost:3427");
  assert.equal(normalizeLoopbackBaseUrl("http://[::1]:3427"), "http://[::1]:3427");
  assert.deepEqual(parseArguments(["--help"]), {
    baseUrl: "http://127.0.0.1:3213",
    help: true,
  });
  assert.equal(
    parseArguments(["--base-url", "http://localhost:3427"]).baseUrl,
    "http://localhost:3427",
  );
  assert.throws(() => normalizeLoopbackBaseUrl("https://example.com"), /loopback|localhost/);
  assert.throws(() => normalizeLoopbackBaseUrl("file:///tmp/server"), /http or https/);
  assert.throws(() => normalizeLoopbackBaseUrl("http://localhost:3427/subpath"), /without credentials/);
  assert.throws(() => normalizeLoopbackBaseUrl("http://user@localhost:3427"), /without credentials/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("shell endpoint matrix is the exact 10 scenario by 2 language by 2 frame contract", () => {
  const matrix = buildEndpointMatrix(23);
  assert.equal(matrix.length, 40);
  assert.deepEqual(new Set(matrix.map(({scenario}) => scenario)), new Set(SCENARIOS));
  assert.deepEqual(new Set(matrix.map(({language}) => language)), new Set(LANGUAGES));
  assert.deepEqual(new Set(matrix.map(({frame}) => frame)), new Set(ENDPOINT_FRAMES));
  assert.ok(matrix.every(({frameDomain, seed}) => frameDomain === FRAME_DOMAIN && seed === 23));
  assert.equal(
    new Set(matrix.map(({scenario, language, frame}) => `${scenario}:${language}:${frame}`)).size,
    40,
  );
});

test("shell URLs bind the full deterministic identity and Spanish locale route", () => {
  const request = {frame: 50, scenario: "section-in", language: "es", seed: 11};
  const built = buildCandidateUrl("http://localhost:3427", request);
  const parsed = new URL(built.url);
  assert.equal(parsed.pathname, `/es/animations/${ANIMATION_ID}`);
  assert.equal(parsed.searchParams.get("frame"), "50");
  assert.equal(parsed.searchParams.get("frameDomain"), "root");
  assert.equal(parsed.searchParams.get("scenario"), "section-in");
  assert.equal(parsed.searchParams.get("lang"), "es");
  assert.equal(parsed.searchParams.get("seed"), "11");
  assert.equal(parsed.searchParams.get("requirementId"), built.identity.requirementId);
  assert.equal(parsed.searchParams.get("trace"), built.identity.traceId);
  assert.equal(parsed.searchParams.get("entryStateSha256"), built.identity.entryStateSha256);
  assert.equal(parsed.searchParams.get("capture"), "1");
  assert.equal(
    buildCandidateQaIdentity(request).entryStateSha256,
    sha256(JSON.stringify(built.identity.entryState)),
  );
});

test("shell endpoint acceptance rejects identity, frame, phase, view, or native-stage drift", () => {
  const request = {frame: 50, scenario: "quit-confirmation", language: "en", seed: 11};
  const identity = buildCandidateQaIdentity(request);
  const state = exactState(request, identity);
  assert.equal(endpointIdentityPass(state, request, identity), true);
  assert.equal(
    endpointIdentityPass({...state, stage: {width: 799, height: 600}}, request, identity),
    false,
  );
  assert.equal(
    endpointIdentityPass(
      {...state, candidate: {...state.candidate, view: "menu"}},
      request,
      identity,
    ),
    false,
  );
  assert.equal(
    endpointIdentityPass(
      {...state, runtime: {...state.runtime, traceId: "wrong"}},
      request,
      identity,
    ),
    false,
  );
  const responsive = exactState(request, identity, {width: 390, height: 293});
  assert.equal(runtimeAndCandidateIdentityPass(responsive, request, identity), true);
  assert.equal(endpointIdentityPass(responsive, request, identity), false);
});

test("shell endpoint phases and views are explicit at frames 1 and 50", () => {
  assert.deepEqual(expectedEndpointState({frame: 1, scenario: "section-in"}), {
    phase: "loading-content",
    view: "menu",
  });
  assert.deepEqual(expectedEndpointState({frame: 50, scenario: "default"}), {
    phase: "ready",
    view: "menu",
  });
  assert.deepEqual(expectedEndpointState({frame: 50, scenario: "section-in"}), {
    phase: "ready",
    view: "section",
  });
  assert.deepEqual(expectedEndpointState({frame: 50, scenario: "quit-confirmation"}), {
    phase: "ready",
    view: "quit-confirmation",
  });
});

test("shell authority boundary is fail-closed and QA hash binding preserves review authority", async () => {
  const claims = Object.fromEntries(AUTHORITY_CLAIM_KEYS.map((key) => [key, false]));
  assert.equal(allAuthorityClaimsFalse(claims), true);
  assert.equal(allAuthorityClaimsFalse({...claims, ownerAcceptance: true}), false);
  assert.equal(allAuthorityClaimsFalse({}), false);

  const manifest = JSON.parse(await readFile(migrationPath, "utf8"));
  const protectedBefore = protectedMigrationSnapshot(manifest);
  const bound = bindCandidateQaHash(manifest, "a".repeat(64));
  assert.equal(bound.evidence.candidateQaSha256, "a".repeat(64));
  assert.deepEqual(protectedMigrationSnapshot(bound), protectedBefore);
  assert.notEqual(bound, manifest);
  assert.throws(() => bindCandidateQaHash(manifest, "not-a-sha"), /SHA-256/);
});

test("shell completion admission evidence is an unpinned runtime snapshot", () => {
  const navigation = {
    pass: true,
    section: {
      content: {pageRows: 35, pageLinks: 0, disabledPageButtons: 35},
    },
  };
  const snapshot = buildCompletionAdmissionSnapshot(navigation);
  assert.deepEqual(snapshot, {
    authority: "non-authoritative-runtime-observation",
    source: "routeNavigation.section.content",
    observedChildDestinationCount: 35,
    observedEnabledChildRouteCount: 0,
    observedDisabledChildDestinationCount: 35,
    observedPubliclyAdmittedChildLinkCount: 0,
    ledgerFileHashPinned: false,
    pass: true,
    strictAcceptanceEffect: false,
    boundary:
      "The product route consults the completion ledger at runtime, but this QA records only the rendered navigation result. It deliberately does not hash-pin the ledger because that ledger validates and hashes this migration manifest, which binds this QA report.",
  });
  assert.equal(
    Object.values(IMPLEMENTATION_PATHS).some((value) => /completion-ledger/i.test(value)),
    false,
  );
  assert.deepEqual(
    Object.keys(snapshot).filter((key) => ["path", "sha256", "bytes"].includes(key)),
    [],
  );
  assert.equal(buildCompletionAdmissionSnapshot({...navigation, pass: false}).pass, false);
  assert.equal(
    buildCompletionAdmissionSnapshot({
      pass: true,
      section: {content: {pageRows: 34, pageLinks: 0, disabledPageButtons: 34}},
    }).pass,
    false,
  );
  assert.equal(
    buildCompletionAdmissionSnapshot({
      pass: true,
      section: {content: {pageRows: 35, pageLinks: 0, disabledPageButtons: 34}},
    }).pass,
    false,
  );
  assert.equal(
    buildCompletionAdmissionSnapshot({
      pass: true,
      section: {content: {pageRows: 35, pageLinks: 1, disabledPageButtons: 34}},
    }).pass,
    false,
  );
});

test("generated shell browser QA is current, comprehensive for candidate scope, and non-authoritative", async () => {
  const [reportBytes, migrationBytes] = await Promise.all([
    readFile(reportPath),
    readFile(migrationPath),
  ]);
  const report = JSON.parse(reportBytes);
  const migration = JSON.parse(migrationBytes);

  assert.equal(report.schemaVersion, 3);
  assert.equal(report.animationId, ANIMATION_ID);
  assert.equal(report.status, "pass");
  assert.equal(report.acceptanceEffect, "none");
  assert.equal(report.strictAcceptanceEffect, false);
  assert.equal(report.generatedBy.script, "scripts/qa-shell-g04-l01-candidate.mjs");
  assert.equal(report.generatedBy.deterministic, false);
  assert.equal(allAuthorityClaimsFalse(report.claims), true);
  assert.equal(allAuthorityClaimsFalse(report.authorityBoundary), true);
  assert.ok(report.assertions.every(({pass}) => pass === true));

  assert.equal(report.migrationStatusBefore, "preserved");
  assert.equal(report.migrationStatusAfter, "preserved");
  assert.equal(migration.status, "preserved");
  assert.equal(migration.baseline.authority, "undecided");
  assert.equal(migration.acceptance.humanVisualReview.decision, "pending");
  assert.equal(migration.acceptance.currentJavaScriptOutputApproval.decision, "accepted");
  assert.match(migration.acceptance.currentJavaScriptOutputApproval.approvalRecordSha256, /^[a-f0-9]{64}$/);
  assert.equal(migration.acceptance.ownerReview.decision, "pending");
  assert.equal(migration.evidence.candidateQaFile, "evidence/native-navigation-candidate-qa.json");
  assert.equal(migration.evidence.candidateQaSha256, sha256(reportBytes));

  for (const record of [
    report.generatedBy,
    ...report.sources,
    ...Object.values(report.implementation),
  ]) {
    const relativePath = record.path ?? record.script;
    const expectedSha = record.sha256 ?? record.scriptSha256;
    const bytes = await readFile(path.join(projectRoot, relativePath));
    assert.equal(sha256(bytes), expectedSha, relativePath);
    if (record.bytes !== undefined) assert.equal(bytes.length, record.bytes, relativePath);
  }
  assert.ok(report.sources.every(({exact}) => exact));

  assert.deepEqual(report.rendererEndpointContract, {
    evidence: report.implementation.rendererEndpointAudit,
    expectedEndpointCount: 40,
    probeCount: 40,
    exactIdentityCount: 40,
    renderableCount: 40,
    identityMismatchCount: 0,
    strictAcceptanceEffect:
      "none; this audit only exposes renderer-addressability gaps and does not advance migration status or satisfy strict acceptance",
  });
  assert.equal(report.deterministicContract.expectedCaseCount, 40);
  assert.equal(report.deterministicContract.observedCaseCount, 40);
  assert.equal(report.deterministicContract.exactIdentityCount, 40);
  assert.equal(report.deterministicContract.frozenCount, 40);
  assert.equal(report.deterministicContract.nativeStageCount, 40);
  assert.equal(report.deterministicContract.representativeCaptureCount, 4);
  assert.equal(report.deterministicContract.matrix.length, 40);
  assert.ok(report.deterministicContract.matrix.every(({pass}) => pass));
  assert.equal(report.routeNavigation.pass, true);
  assert.equal(report.routeNavigation.section.content.pageRows, 35);
  assert.equal(report.routeNavigation.section.content.pageLinks, 0);
  assert.equal(report.routeNavigation.section.content.disabledPageButtons, 35);
  assert.deepEqual(report.completionAdmissionSnapshot, {
    authority: "non-authoritative-runtime-observation",
    source: "routeNavigation.section.content",
    observedChildDestinationCount: 35,
    observedEnabledChildRouteCount: 0,
    observedDisabledChildDestinationCount: 35,
    observedPubliclyAdmittedChildLinkCount: 0,
    ledgerFileHashPinned: false,
    pass: true,
    strictAcceptanceEffect: false,
    boundary:
      "The product route consults the completion ledger at runtime, but this QA records only the rendered navigation result. It deliberately does not hash-pin the ledger because that ledger validates and hashes this migration manifest, which binds this QA report.",
  });
  assert.equal(
    Object.values(report.implementation).some(
      (record) => record.path === "catalog/completion-ledger.json",
    ),
    false,
  );
  assert.equal(/completion-ledger/i.test(JSON.stringify(report.implementation)), false);
  assert.equal(report.replay.cases.length, 6);
  assert.deepEqual(
    new Set(report.replay.cases.map(({control, input}) => `${control}:${input}`)),
    new Set([
      "host:pointer",
      "host:Enter",
      "host:Space",
      "candidate:pointer",
      "candidate:Enter",
      "candidate:Space",
    ]),
  );
  assert.ok(report.replay.cases.every(({pass}) => pass));
  assert.equal(report.mobile.pass, true);
  assert.equal(report.reducedMotion.pass, true);
  assert.deepEqual(report.diagnostics.console.errors, []);
  assert.deepEqual(report.diagnostics.console.warnings, []);
  assert.deepEqual(report.diagnostics.pageErrors, []);
  assert.deepEqual(report.diagnostics.network.failedRequests, []);
  assert.deepEqual(report.diagnostics.network.httpErrors, []);
  assert.deepEqual(report.diagnostics.network.unexpectedRequests, []);
  assert.ok(
    report.diagnostics.network.observedOrigins.every((origin) =>
      ["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname),
    ),
  );

  const captures = [
    ...report.deterministicContract.matrix.map(({capture}) => capture).filter(Boolean),
    report.mobile.screenshot,
    report.reducedMotion.screenshot,
  ];
  assert.equal(captures.length, 6);
  for (const capture of captures) {
    assert.match(
      capture.path,
      /^output\/playwright\/shell-course-g04-l01-index-local-candidate-qa\//,
    );
    const bytes = await readFile(path.join(projectRoot, capture.path));
    assert.equal(sha256(bytes), capture.sha256, capture.path);
    const png = PNG.sync.read(bytes);
    assert.equal(png.width, capture.width, capture.path);
    assert.equal(png.height, capture.height, capture.path);
    assert.equal(devOverlaySuppressionPass(capture.devOverlaySuppression), true, capture.path);
  }
  const representative = report.deterministicContract.matrix
    .map(({capture}) => capture)
    .filter(Boolean);
  assert.ok(representative.every(({width, height}) => width === 800 && height === 600));
  assert.ok(report.limitations.some((value) => /not pixel-fidelity evidence/i.test(value)));
  assert.ok(report.limitations.some((value) => /audio remains unimplemented/i.test(value)));
  assert.ok(report.limitations.some((value) => /owner acceptance.*pending/i.test(value)));
});
