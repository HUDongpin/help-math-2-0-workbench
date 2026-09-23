import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildReport,
  JSON_REPORT_RELATIVE,
  MARKDOWN_REPORT_RELATIVE,
  renderMarkdown,
} from "./build-g4-l10-vb001-host-chain-static-audit.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("VB001 host-chain audit derives the source-static principal and audio domains", async () => {
  const report = await buildReport();
  assert.equal(report.status, "source-static-host-chain-timing-candidate-only");
  assert.equal(report.scope.activeCourseXmlMember, false);
  assert.equal(report.scope.formalReleaseMember, false);
  assert.deepEqual(
    report.frameDomains.sourceStaticHostChainDomains.map(({timelineId, frameCount}) => [timelineId, frameCount]),
    [["root", 10], ["sprite-31", 136], ["sprite-5", 135], ["sprite-6", 135]],
  );
  assert.equal(report.controlledNavigationTimingCandidate.conservativePostDeliveryWaitMs, 15_418);
  assert.equal(report.controlledNavigationTimingCandidate.provesNaturalRuntimeEntry, false);
  assert.equal(report.controlledNavigationTimingCandidate.provesNaturalRuntimeTerminal, false);
});

test("VB001 host-chain audit remains acceptance-neutral", async () => {
  const {authority} = await buildReport();
  assert.equal(authority.sourceStaticHostChainTimingCandidateOnly, true);
  assert.equal(authority.authoritativeOriginalRuntime, false);
  assert.equal(authority.audioListeningOrSynchronization, false);
  assert.equal(authority.visualFidelity, false);
  assert.equal(authority.humanReview, false);
  assert.equal(authority.ownerReview, false);
  assert.equal(authority.strictCompletion, false);
  assert.equal(authority.wholeLessonIntegration, false);
  assert.equal(authority.releaseOrPublication, false);
  assert.equal(authority.strictAcceptanceEffect, "none");
});

test("checked-in VB001 reports are current and preserve the formal denominator", async () => {
  const report = await buildReport();
  assert.deepEqual(
    JSON.parse(await readFile(path.join(projectRoot, JSON_REPORT_RELATIVE), "utf8")),
    report,
  );
  assert.equal(
    await readFile(path.join(projectRoot, MARKDOWN_REPORT_RELATIVE), "utf8"),
    renderMarkdown(report),
  );
  assert.match(renderMarkdown(report), /Active release denominator changed: \*\*false\*\*/);
});
