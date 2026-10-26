import assert from "node:assert/strict";
import test from "node:test";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {
  resolveInteractivePlaybackPolicy,
  resolveInteractiveSeekPolicy,
} from "../src/runtime";

import geoModule, {
  SHARED_GEO001_L01_P001_RENDERER,
  SHARED_GEO001_L01_P001_RUNTIME,
  SHARED_GEO001_L01_P001_SOURCE,
  SHARED_GEO001_L01_P001_SOURCE_CONTRACT,
} from "../src/modules/shared-geo001-l01-p001";
import nmsModule, {
  SHARED_NMS002_L11_P030_RENDERER,
  SHARED_NMS002_L11_P030_RUNTIME,
  SHARED_NMS002_L11_P030_SOURCE,
  SHARED_NMS002_L11_P030_SOURCE_CONTRACT,
} from "../src/modules/shared-nms002-l11-p030";
import datModule, {
  SHARED_DAT001_L05_P040_RENDERER,
  SHARED_DAT001_L05_P040_RUNTIME,
  SHARED_DAT001_L05_P040_SOURCE,
  SHARED_DAT001_L05_P040_SOURCE_CONTRACT,
} from "../src/modules/shared-dat001-l05-p040";

const englishContext = Object.freeze({
  lang: "en" as const,
  scenario: "source-static-frame",
  seed: 0,
});

function assertAcceptanceBoundary(markup: string) {
  for (const attribute of [
    "data-audio-accepted",
    "data-authoritative-original-runtime",
    "data-human-visual-accepted",
    "data-owner-accepted",
    "data-published",
    "data-released",
    "data-strict-complete",
    "data-visual-fidelity-accepted",
  ]) {
    assert.match(markup, new RegExp(`${attribute}="false"`), attribute);
  }
}

test("the three generated modules are private, source-bound, and unregistered", () => {
  const cases = [
    {
      module: geoModule,
      runtime: SHARED_GEO001_L01_P001_RUNTIME,
      generatedSource: SHARED_GEO001_L01_P001_SOURCE,
      wrapperContract: SHARED_GEO001_L01_P001_SOURCE_CONTRACT,
      key: "shared-geo001-l01-p001",
      mainDomain: "sprite-142",
      companionDomainCount: 1,
      stopFrame: null,
      finalFrame: 127,
      seekCapabilityId: "geo-source-progress-seek",
      feedbackSelection: "not-applicable",
    },
    {
      module: nmsModule,
      runtime: SHARED_NMS002_L11_P030_RUNTIME,
      generatedSource: SHARED_NMS002_L11_P030_SOURCE,
      wrapperContract: SHARED_NMS002_L11_P030_SOURCE_CONTRACT,
      key: "shared-nms002-l11-p030",
      mainDomain: "sprite-260",
      companionDomainCount: 9,
      stopFrame: 97,
      finalFrame: 356,
      seekCapabilityId: null,
      feedbackSelection: "source-host-cardinality-page-seed-v1",
    },
    {
      module: datModule,
      runtime: SHARED_DAT001_L05_P040_RUNTIME,
      generatedSource: SHARED_DAT001_L05_P040_SOURCE,
      wrapperContract: SHARED_DAT001_L05_P040_SOURCE_CONTRACT,
      key: "shared-dat001-l05-p040",
      mainDomain: "sprite-315",
      companionDomainCount: 7,
      stopFrame: 238,
      finalFrame: 254,
      seekCapabilityId: null,
      feedbackSelection: "source-host-cardinality-page-seed-v1",
    },
  ] as const;

  for (const candidate of cases) {
    assert.equal(candidate.module.key, candidate.key);
    assert.equal(candidate.module.maturity, "private-current-js");
    assert.equal(candidate.runtime.frameCount, 10);
    assert.equal(candidate.runtime.defaultFrameDomain, candidate.mainDomain);
    assert.equal(
      candidate.runtime.frameDomains?.length,
      candidate.companionDomainCount + 1,
    );
    assert.equal(candidate.module.audioCues.length, 0);
    assert.equal(candidate.module.transport?.legacyBehaviorParity, false);
    assert.equal(candidate.module.transport?.strictAcceptanceEffect, "none");
    assert.equal(
      candidate.module.playbackEndFrameByDomain?.[candidate.mainDomain],
      candidate.finalFrame,
    );
    assert.equal(candidate.module.interactiveStops?.[0]?.stopFrame ?? null,
      candidate.stopFrame);
    assert.equal(candidate.module.interactiveSeek?.id ?? null,
      candidate.seekCapabilityId);
    assert.equal(candidate.generatedSource.privateCurrentJsModuleGenerated, true);
    assert.equal(candidate.generatedSource.currentJavaScriptRegistered, false);
    assert.equal(candidate.generatedSource.productCalibrationPassed, false);
    assert.equal(candidate.generatedSource.engineeringPreviewReady, false);
    assert.equal(candidate.generatedSource.requiresHostInteractiveStop,
      candidate.stopFrame !== null);
    assert.equal(candidate.generatedSource.requiresHostSeekConsumer,
      candidate.seekCapabilityId !== null);
    assert.equal(candidate.generatedSource.hostSeekConsumerImplemented, true);
    assert.equal(
      candidate.generatedSource.interactiveResolutionIntentContractImplemented,
      true,
    );
    assert.equal(candidate.generatedSource.feedbackVariantSelection,
      candidate.feedbackSelection);
    assert.equal(candidate.generatedSource.audioLifecycleAccepted, false);
    assert.equal(candidate.generatedSource.spanishBehaviorAccepted, false);
    assert.equal(candidate.wrapperContract.ownerAccepted, false);
    assert.equal(candidate.wrapperContract.humanVisualReviewAccepted, false);
    assert.equal(candidate.wrapperContract.strictAcceptanceEffect, "none");
  }
});

test("GEO exposes the exact 127-frame accessible seek surface and interaction reset", () => {
  const markup = renderToStaticMarkup(createElement(
    SHARED_GEO001_L01_P001_RENDERER,
    {
      ...englishContext,
      frame: 1,
      frameDomain: "sprite-142",
    },
  ));

  assert.match(markup, /data-advanced-manual-kind="accessible-source-seek"/);
  assert.match(markup, /data-host-seek-consumer-status="blocked"/);
  assert.match(markup, /aria-label="Source media controls"/);
  assert.match(markup, /Source media frame 1 of 127/);
  assert.match(markup, /id="shared-geo001-l01-p001-seek"/);
  assert.match(markup, /type="range"/);
  assert.match(markup, />Reset interaction<\/button>/);
  assert.match(markup, /seek formula, and local Canvas preview/);
  assert.match(markup, /product playhead seek\/resume is blocked/);
  assert.match(markup, /legacy FUI scrollbar is not proven/);
  assertAcceptanceBoundary(markup);

  const terminalMarkup = renderToStaticMarkup(createElement(
    SHARED_GEO001_L01_P001_RENDERER,
    {...englishContext, frame: 127, frameDomain: "sprite-142"},
  ));
  assert.match(terminalMarkup, /Source media frame 127 of 127/);
  assert.match(terminalMarkup, /Local frame preview only/);
});

test("GEO typed seek policy rejects an absent host and resumes only nonterminal accepted seeks", () => {
  const capability = geoModule.interactiveSeek;
  assert.ok(capability);
  const intent = {
    capabilityId: capability.id,
    frameDomain: capability.frameDomain,
    targetFrame: 64,
    input: "native-range-change" as const,
    source: "maintained-source-derived-range" as const,
  };
  const blocked = resolveInteractiveSeekPolicy(capability, intent, {
    hostSeekConsumerImplemented: false,
  });
  assert.deepEqual(blocked, {
    accepted: false,
    frame: null,
    resume: false,
    blocker: "host-seek-consumer-unavailable",
  });
  const accepted = resolveInteractiveSeekPolicy(capability, intent, {
    hostSeekConsumerImplemented: true,
  });
  assert.deepEqual(accepted, {
    accepted: true,
    frame: 64,
    resume: true,
    blocker: null,
  });
  const terminal = resolveInteractiveSeekPolicy(capability, {
    ...intent,
    targetFrame: 127,
  }, {hostSeekConsumerImplemented: true});
  assert.equal(terminal.accepted, true);
  assert.equal(terminal.frame, 127);
  assert.equal(terminal.resume, false);
});

test("NMS exposes four source answers and waits for a source-host-cardinality selection", () => {
  const markup = renderToStaticMarkup(createElement(
    SHARED_NMS002_L11_P030_RENDERER,
    {
      ...englishContext,
      frame: 97,
      frameDomain: "sprite-260",
    },
  ));

  assert.match(markup, /data-advanced-manual-kind="choice-attempt-feedback"/);
  assert.match(markup, /data-feedback-variant-status="not-active"/);
  assert.match(markup, /data-host-interactive-stop-consumer-status="blocked"/);
  assert.match(markup, />Need More Help<\/button>/);
  assert.match(markup, /<legend>Select one source answer option<\/legend>/);
  for (const answerId of ["AnsBtn1", "AnsBtn2", "AnsBtn3", "AnsBtn4"]) {
    assert.match(markup, new RegExp(`>${answerId}</button>`), answerId);
  }
  assert.doesNotMatch(markup, /feedback-active/);
  assert.doesNotMatch(markup, /feedback-domain-resolved/);
  assert.match(markup, /product-host 3-wrong\/4-right branch cardinality/);
  assert.match(markup, /does not claim Adobe random-state parity/);
  assert.match(markup, />Reset interaction<\/button>/);
  assertAcceptanceBoundary(markup);
});

test("DAT exposes five pointer-and-keyboard pick/drop pairs with the source-host cardinality bound", () => {
  const markup = renderToStaticMarkup(createElement(
    SHARED_DAT001_L05_P040_RENDERER,
    {
      ...englishContext,
      frame: 238,
      frameDomain: "sprite-315",
    },
  ));

  assert.match(markup, /data-advanced-manual-kind="five-item-drag-drop"/);
  assert.match(markup, /data-feedback-variant-status="not-active"/);
  assert.match(markup, /data-host-interactive-stop-consumer-status="blocked"/);
  assert.match(markup, /aria-label="Source items" role="group"/);
  assert.match(markup, /aria-label="Drop targets" role="group"/);
  for (let index = 1; index <= 5; index += 1) {
    assert.match(markup, new RegExp(`>Src_${index}</button>`), `Src_${index}`);
    assert.match(markup, new RegExp(`>Tar_${index}</button>`), `Tar_${index}`);
  }
  assert.equal((markup.match(/draggable="true"/g) ?? []).length, 5);
  assert.match(markup, /0 of 5 exact suffix-matched drops recorded/);
  assert.match(markup, /product-host 3-wrong\/4-right branch cardinality/);
  assert.match(markup, /does not claim Adobe random-state parity/);
  assert.match(markup, />Reset interaction<\/button>/);
  assertAcceptanceBoundary(markup);
});

test("NMS and DAT playback sequences hold at authored interaction stops and block completion", () => {
  const cases = [
    {
      stops: nmsModule.interactiveStops ?? [],
      frameDomain: "sprite-260",
      stopFrame: 97,
      resumeFrame: 98,
      finalFrame: 356,
    },
    {
      stops: datModule.interactiveStops ?? [],
      frameDomain: "sprite-315",
      stopFrame: 238,
      resumeFrame: 239,
      finalFrame: 254,
    },
  ] as const;

  for (const candidate of cases) {
    const before = resolveInteractivePlaybackPolicy(candidate.stops, {
      frameDomain: candidate.frameDomain,
      requestedFrame: candidate.stopFrame - 1,
    });
    assert.equal(before.frame, candidate.stopFrame - 1);
    assert.equal(before.held, false);
    assert.equal(before.completionAllowed, false);

    const atStop = resolveInteractivePlaybackPolicy(candidate.stops, {
      frameDomain: candidate.frameDomain,
      requestedFrame: candidate.stopFrame,
    });
    assert.equal(atStop.frame, candidate.stopFrame);
    assert.equal(atStop.held, true);
    assert.equal(atStop.completionAllowed, false);
    assert.equal(atStop.resumeFrame, candidate.resumeFrame);

    const elapsedPastStop = resolveInteractivePlaybackPolicy(candidate.stops, {
      frameDomain: candidate.frameDomain,
      requestedFrame: candidate.finalFrame,
    });
    assert.equal(elapsedPastStop.frame, candidate.stopFrame);
    assert.equal(elapsedPastStop.held, true);
    assert.equal(elapsedPastStop.completionAllowed, false);

    const resolved = resolveInteractivePlaybackPolicy(candidate.stops, {
      frameDomain: candidate.frameDomain,
      requestedFrame: candidate.finalFrame,
      resolvedStopIds: [candidate.stops[0]!.id],
    });
    assert.equal(resolved.frame, candidate.finalFrame);
    assert.equal(resolved.held, false);
    assert.equal(resolved.completionAllowed, true);
  }
});

test("unproven Spanish behavior stays fail-closed and omits modern controls", () => {
  const markup = renderToStaticMarkup(createElement(
    SHARED_NMS002_L11_P030_RENDERER,
    {
      frame: 97,
      frameDomain: "sprite-260",
      lang: "es",
      scenario: "source-static-frame",
      seed: 0,
    },
  ));

  assert.match(markup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/);
  assert.doesNotMatch(markup, /aria-label="Source question controls"/);
  assert.doesNotMatch(markup, />Need More Help<\/button>/);
  assert.doesNotMatch(markup, />AnsBtn1<\/button>/);
  assertAcceptanceBoundary(markup);
});
