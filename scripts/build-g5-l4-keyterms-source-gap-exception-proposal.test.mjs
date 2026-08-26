import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  buildG5L4KeytermsSourceGapExceptionProposal,
  renderMarkdown,
  validateG5L4KeytermsSourceGapExceptionProposal,
  writeG5L4KeytermsSourceGapExceptionProposal,
} from "./build-g5-l4-keyterms-source-gap-exception-proposal.mjs";

const projectRoot = path.resolve(".");

test("proposal preserves the missing-source boundary and requires runtime, validator, and Owner evidence", async () => {
  const report = await buildG5L4KeytermsSourceGapExceptionProposal({projectRoot});
  assert.equal(report.status, "unsigned-proposal-runtime-observation-and-owner-review-required");
  assert.deepEqual(report.proposal.exactMissingDeclaredPaths, [
    "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
    "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
  ]);
  assert.equal(report.proposal.machineEvidence.shippedShellStaticLiteralCounts["L4KTE01.xml"], 0);
  assert.equal(report.proposal.machineEvidence.shippedShellStaticLiteralCounts["L4KTS01.xml"], 0);
  assert.equal(report.proposal.machineEvidence.runtimeLoadSuccessProven, false);
  assert.equal(report.proposal.proposedDisposition.renameOrSubstituteMissingLessonXml, false);
  assert.equal(report.proposal.proposedDisposition.abortIfMissingLessonXmlIsRequested, true);
  assert.equal(report.admissionPrerequisites.every(({satisfied}) => satisfied === false), true);
  assert.equal(Object.values(report.acceptanceEffects).some(Boolean), false);
  assert.match(renderMarkdown(report), /Owner decision: \*\*pending\*\*/u);
});

test("validator rejects a renamed substitute, satisfied prerequisite, or acceptance promotion", async () => {
  const report = await buildG5L4KeytermsSourceGapExceptionProposal({projectRoot});
  const renamed = structuredClone(report);
  renamed.proposal.proposedDisposition.renameOrSubstituteMissingLessonXml = true;
  assert.throws(
    () => validateG5L4KeytermsSourceGapExceptionProposal(renamed),
    /disposition drifted/u,
  );
  const preaccepted = structuredClone(report);
  preaccepted.admissionPrerequisites[0].satisfied = true;
  assert.throws(
    () => validateG5L4KeytermsSourceGapExceptionProposal(preaccepted),
    /prerequisite or Owner decision/u,
  );
  const promoted = structuredClone(report);
  promoted.acceptanceEffects.sourceGapClosed = true;
  assert.throws(
    () => validateG5L4KeytermsSourceGapExceptionProposal(promoted),
    /acceptance or publication/u,
  );
  const injected = structuredClone(report);
  injected.proposal.runtimeExecutionAuthorized = true;
  assert.throws(
    () => validateG5L4KeytermsSourceGapExceptionProposal(injected),
    /proposal body keys drifted/u,
  );
});

test("written proposal matches a fresh deterministic rebuild", async () => {
  const written = await writeG5L4KeytermsSourceGapExceptionProposal({projectRoot});
  assert.equal(written.status, "written");
  const current = await writeG5L4KeytermsSourceGapExceptionProposal({projectRoot, check: true});
  assert.equal(current.status, "current");
  const stored = JSON.parse(
    await readFile(path.join(projectRoot, "reports/g5-l4-keyterms-source-gap-exception-proposal.json")),
  );
  assert.equal(stored.reportFingerprintSha256, written.reportFingerprintSha256);
});
