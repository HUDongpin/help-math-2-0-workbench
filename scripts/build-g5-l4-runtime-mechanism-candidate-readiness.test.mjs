import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import path from "node:path";
import test from "node:test";

import {
  buildG5L4RuntimeMechanismCandidateReadiness,
  renderMarkdown,
  validateG5L4RuntimeMechanismCandidateReadiness,
} from "./build-g5-l4-runtime-mechanism-candidate-readiness.mjs";

const reportPromise = buildG5L4RuntimeMechanismCandidateReadiness({projectRoot: path.resolve(".")});

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
}

function refingerprint(report) {
  const {reportFingerprintSha256: ignored, ...withoutFingerprint} = report;
  void ignored;
  report.reportFingerprintSha256 = createHash("sha256")
    .update(Buffer.from(`${JSON.stringify(sortDeep(withoutFingerprint), null, 2)}\n`))
    .digest("hex");
  return report;
}

test("materialized runtime mechanisms remain candidate-only and execution-closed", async () => {
  const report = await reportPromise;
  assert.equal(report.summary.mechanismsSelected, 8);
  assert.equal(report.summary.candidateImplementationsPresent, 8);
  assert.equal(report.summary.offlineOrDiagnosticVerified, 8);
  assert.equal(report.summary.materializedReadOnlyHostTrees, 1);
  assert.equal(report.summary.materializedEmptyProfiles, 2);
  assert.equal(report.machineDiagnostics.sandboxLoopbackConnectDenied, true);
  assert.equal(report.machineDiagnostics.freshProcessAbsencePassed, false);
  assert.equal(Object.values(report.executionGate).some(Boolean), false);
  assert.equal(Object.values(report.acceptanceEffects).some(Boolean), false);
  assert.match(renderMarkdown(report), /Projector launch remains deliberately disabled/u);
});

test("validator rejects injected execution, approval, or acceptance claims", async () => {
  const report = await reportPromise;
  const injected = structuredClone(report);
  injected.summary.runtimeExecutionAuthorized = true;
  refingerprint(injected);
  assert.throws(
    () => validateG5L4RuntimeMechanismCandidateReadiness(injected),
    /report summary keys drifted/u,
  );
  const approved = structuredClone(report);
  approved.controls[0].ownerTechnicalApprovalEstablished = true;
  refingerprint(approved);
  assert.throws(
    () => validateG5L4RuntimeMechanismCandidateReadiness(approved),
    /improperly claims approval/u,
  );
  const promoted = structuredClone(report);
  promoted.acceptanceEffects.authoritativeOriginalRuntime = true;
  refingerprint(promoted);
  assert.throws(
    () => validateG5L4RuntimeMechanismCandidateReadiness(promoted),
    /improperly claims execution or acceptance/u,
  );

  const unboundSource = structuredClone(report);
  unboundSource.sourceBindings[0].path = "arbitrary/unbound-source.mjs";
  refingerprint(unboundSource);
  assert.throws(
    () => validateG5L4RuntimeMechanismCandidateReadiness(unboundSource),
    /source binding descriptor drifted/u,
  );

  const executedHost = structuredClone(report);
  executedHost.materializedCandidates.hostTree.runtimeSessionsExecuted = 1;
  refingerprint(executedHost);
  assert.throws(
    () => validateG5L4RuntimeMechanismCandidateReadiness(executedHost),
    /host-tree candidate boundary drifted/u,
  );

  const authorizedHost = structuredClone(report);
  authorizedHost.machineDiagnostics.exactHostSessionAuthorizationVerified = true;
  refingerprint(authorizedHost);
  assert.throws(
    () => validateG5L4RuntimeMechanismCandidateReadiness(authorizedHost),
    /machine diagnostic boundary drifted/u,
  );

  const driftedControl = structuredClone(report);
  driftedControl.controls[3].candidateImplementationPresent = false;
  driftedControl.controls[3].offlineOrDiagnosticVerified = false;
  refingerprint(driftedControl);
  assert.throws(
    () => validateG5L4RuntimeMechanismCandidateReadiness(driftedControl),
    /improperly claims approval or live verification/u,
  );

  const promotedAuthority = structuredClone(report);
  promotedAuthority.authority = "Runtime execution authorized and complete.";
  refingerprint(promotedAuthority);
  assert.throws(
    () => validateG5L4RuntimeMechanismCandidateReadiness(promotedAuthority),
    /authority boundary drifted/u,
  );
});
