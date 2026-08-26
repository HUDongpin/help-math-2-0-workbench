import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRendererGapClosure,
  classifyDomainSupport,
  parseArguments,
  validateRendererGapClosure,
} from "./build-g4-l3-renderer-gap-closure.mjs";

function probe({outcome, blocker = null, language = "en"}) {
  return {outcome, actual: {blocker}, request: {language}};
}

test("renderer closure classifies only evidence-bounded domain shapes", () => {
  assert.equal(classifyDomainSupport({
    support: {frameDomain: "sprite-1", fullyRenderable: true, probeCount: 2, renderableCount: 2, blockedCount: 0},
    probes: [probe({outcome: "renderable-exact"}), probe({outcome: "renderable-exact", language: "es"})],
    requirements: [],
  }), "fully-renderable-current-js");
  assert.equal(classifyDomainSupport({
    support: {frameDomain: "sprite-2", fullyRenderable: false, probeCount: 2, renderableCount: 1, blockedCount: 1},
    probes: [probe({outcome: "renderable-exact"}), probe({outcome: "blocked-not-renderable", blocker: "spanish-visual-and-audio-unvalidated", language: "es"})],
    requirements: [],
  }), "spanish-visual-audio-evidence-gated");
  assert.equal(classifyDomainSupport({
    support: {frameDomain: "root", fullyRenderable: false, probeCount: 2, renderableCount: 0, blockedCount: 2},
    probes: [probe({outcome: "blocked-not-renderable", blocker: "root-baseline-unavailable"}), probe({outcome: "blocked-not-renderable", blocker: "spanish-visual-and-audio-unvalidated", language: "es"})],
    requirements: [],
  }), "authoritative-root-runtime-evidence-gated");
  const requirements = ["en", "es"].map((language) => ({
    language,
    status: "pending",
    scenario: "source-static-reachable-domain",
    entryState: {runtimeReachabilityEstablished: false},
    baselineAuthority: "unresolved",
    capturedFrameCount: 0,
  }));
  assert.equal(classifyDomainSupport({
    support: {frameDomain: "sprite-3", fullyRenderable: false, probeCount: 2, renderableCount: 0, blockedCount: 2},
    probes: [probe({outcome: "identity-mismatch", blocker: "unsupported-runtime-request"}), probe({outcome: "identity-mismatch", blocker: "unsupported-runtime-request", language: "es"})],
    requirements,
  }), "natural-trace-parent-composition-and-renderer-gated");
});

test("checked-in renderer gap closure is deterministic and acceptance-neutral", async () => {
  const {report} = await buildRendererGapClosure({check: true});
  assert.equal(report.summary.declaredFrameDomains, 261);
  assert.equal(report.summary.safeRendererOnlyImplementationDomainsNow, 0);
  assert.equal(report.categoryCounts["natural-trace-parent-composition-and-renderer-gated"], 149);
  assert.equal(report.acceptance.strictComplete, false);
  assert.equal(report.acceptance.published, false);
});

test("renderer gap closure validator rejects unclassified or promoted work", async () => {
  const {report} = await buildRendererGapClosure({check: true});
  const unclassified = structuredClone(report);
  unclassified.categoryCounts["unclassified-fail-closed"] = 1;
  assert.throws(() => validateRendererGapClosure(unclassified), /category partition drifted/);
  const promoted = structuredClone(report);
  promoted.acceptance.strictComplete = true;
  assert.throws(() => validateRendererGapClosure(promoted), /acceptance promotion/);
});

test("renderer gap closure CLI exposes only read-only verification", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--render-anyway"]), /Unknown option/);
});
