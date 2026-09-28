import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";

import vb007, {
  COURSE_G04_L03_VB_007_SOURCE_CONTRACT,
  getCourseG04L03Vb007FrameState,
} from "../src/modules/course-g04-l03-vb-007";
import in012, {
  COURSE_G04_L03_IN_012_SOURCE_CONTRACT,
  getCourseG04L03In012FrameState,
} from "../src/modules/course-g04-l03-in-012";
import ts007, {
  COURSE_G04_L03_TS_007_SOURCE_CONTRACT,
  getCourseG04L03Ts007FrameState,
} from "../src/modules/course-g04-l03-ts-007";
import {
  COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CAPTURES,
  COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CONFIGS,
  COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CONFIG,
  COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CONFIG,
} from "../src/timelines/course-g04-l03-vb-007";
import {
  COURSE_G04_L03_IN_012_DIRECT_COMPANION_COMPOSITE_CAPTURES,
  COURSE_G04_L03_IN_012_DIRECT_COMPANION_COMPOSITE_CONFIGS,
  COURSE_G04_L03_IN_012_NATURAL_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_IN_012_NATURAL_PARENT_COMPOSITE_CONFIG,
  COURSE_G04_L03_IN_012_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_IN_012_PARENT_COMPOSITE_CONFIG,
} from "../src/timelines/course-g04-l03-in-012";
import {
  COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CAPTURES,
  COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CONFIGS,
  COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CONFIG,
  COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CONFIG,
} from "../src/timelines/course-g04-l03-ts-007";

const fixtures = [
  {
    animationId: "course-g04-l03-vb-007",
    captures: COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CAPTURES,
    config: COURSE_G04_L03_VB_007_PARENT_COMPOSITE_CONFIG,
    getFrameState: getCourseG04L03Vb007FrameState,
    module: vb007,
    sourceContract: COURSE_G04_L03_VB_007_SOURCE_CONTRACT,
    runtimeSha256:
      "05aa87f28633bef5aadac6549df653720cf6bf6689544e837441652b59af3525",
  },
  {
    animationId: "course-g04-l03-in-012",
    captures: COURSE_G04_L03_IN_012_PARENT_COMPOSITE_CAPTURES,
    config: COURSE_G04_L03_IN_012_PARENT_COMPOSITE_CONFIG,
    getFrameState: getCourseG04L03In012FrameState,
    module: in012,
    sourceContract: COURSE_G04_L03_IN_012_SOURCE_CONTRACT,
    runtimeSha256:
      "3cbb9410855a3a10151231f617277a6f82a054995834f6ceccfc229b3b327fe4",
  },
  {
    animationId: "course-g04-l03-ts-007",
    captures: COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CAPTURES,
    config: COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CONFIG,
    getFrameState: getCourseG04L03Ts007FrameState,
    module: ts007,
    sourceContract: COURSE_G04_L03_TS_007_SOURCE_CONTRACT,
    runtimeSha256:
      "e61534640484f17fae940a0a90ad92930f87734f4f9f01c9130a0eec1834fc21",
  },
] as const;

const naturalFixtures = [
  {
    captures: COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CAPTURES,
    config: COURSE_G04_L03_VB_007_NATURAL_PARENT_COMPOSITE_CONFIG,
    getFrameState: getCourseG04L03Vb007FrameState,
    module: vb007,
    sourceContract: COURSE_G04_L03_VB_007_SOURCE_CONTRACT,
    runtimeSha256:
      "dc7398f247294c9e80209c914447b515761808b6f291ae05edbb2e6108f435d9",
  },
  {
    captures: COURSE_G04_L03_IN_012_NATURAL_PARENT_COMPOSITE_CAPTURES,
    config: COURSE_G04_L03_IN_012_NATURAL_PARENT_COMPOSITE_CONFIG,
    getFrameState: getCourseG04L03In012FrameState,
    module: in012,
    sourceContract: COURSE_G04_L03_IN_012_SOURCE_CONTRACT,
    runtimeSha256:
      "68dcec64874ccbf7fb0858a5857dadc76982e0a92e61d4dbfbebec9c4875f8f2",
  },
  {
    captures: COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CAPTURES,
    config: COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CONFIG,
    getFrameState: getCourseG04L03Ts007FrameState,
    module: ts007,
    sourceContract: COURSE_G04_L03_TS_007_SOURCE_CONTRACT,
    runtimeSha256:
      "acb54274f85ae9f0f9b67c3109cae67380b0e68c0b8bc6a0149f3fbda9c2b8cd",
  },
] as const;

const directFixtures = [
  {
    captures: COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CAPTURES,
    configs: COURSE_G04_L03_VB_007_DIRECT_COMPANION_COMPOSITE_CONFIGS,
    expectedStatus:
      "seven-source-static-direct-companion-domains-current-js-only",
    getFrameState: getCourseG04L03Vb007FrameState,
    module: vb007,
    sourceContract: COURSE_G04_L03_VB_007_SOURCE_CONTRACT,
  },
  {
    captures: COURSE_G04_L03_IN_012_DIRECT_COMPANION_COMPOSITE_CAPTURES,
    configs: COURSE_G04_L03_IN_012_DIRECT_COMPANION_COMPOSITE_CONFIGS,
    expectedStatus:
      "five-source-static-direct-companion-domains-current-js-only",
    getFrameState: getCourseG04L03In012FrameState,
    module: in012,
    sourceContract: COURSE_G04_L03_IN_012_SOURCE_CONTRACT,
  },
  {
    captures: COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CAPTURES,
    configs: COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CONFIGS,
    expectedStatus:
      "twelve-source-static-direct-companion-domains-current-js-only",
    getFrameState: getCourseG04L03Ts007FrameState,
    module: ts007,
    sourceContract: COURSE_G04_L03_TS_007_SOURCE_CONTRACT,
  },
] as const;

test("all nine source-observable placement paths expose exact Current-JS request identities", () => {
  assert.equal(fixtures.reduce((sum, fixture) =>
    sum + fixture.captures.length, 0), 9);
  for (const fixture of fixtures) {
    for (const mapping of fixture.captures) {
      const context = {
        entryStateSha256: mapping.entryStateSha256,
        frameDomain: mapping.frameDomain,
        lang: mapping.language,
        requirementId: mapping.requirementId,
        scenario: mapping.scenario,
        seed: 0,
        traceId: mapping.traceId,
      };
      const state = fixture.getFrameState(mapping.localFrameCount, context);
      assert.equal(state.status, "ready", mapping.requirementId);
      assert.equal(state.frameDomain, mapping.frameDomain);
      assert.equal(state.rootFrame, 6);
      assert.deepEqual(state.visibleSourceMarkers, [
        `${mapping.frameDomain}-path-${mapping.pathIndex}-source-behavior-composite-frame-${mapping.localFrameCount}`,
      ]);

      const markup = renderToStaticMarkup(createElement(
        fixture.module.Renderer,
        {...context, frame: mapping.localFrameCount},
      ));
      assert.match(
        markup,
        new RegExp(
          `data-source-static-behavior-composite-capture="${mapping.frameDomain}-frames-1-${mapping.localFrameCount}"`,
        ),
        mapping.requirementId,
      );

      for (const changed of [
        {...context, requirementId: `${mapping.requirementId}:forged`},
        {...context, traceId: `${mapping.traceId}:forged`},
        {...context, entryStateSha256: "f".repeat(64)},
        {...context, lang: "es" as const},
      ]) {
        assert.equal(
          fixture.getFrameState(1, changed).status,
          "blocked",
          `${mapping.requirementId} must reject forged identity`,
        );
      }
    }
  }
});

test("the shared generated assets and product contracts retain zero acceptance authority", () => {
  for (const fixture of fixtures) {
    assert.equal(fixture.config.assetSha256, fixture.runtimeSha256);
    assert.equal(
      fixture.sourceContract.parentCompositeCaptureStatus,
      "three-source-static-placement-paths-current-js-only",
    );
    assert.equal(fixture.sourceContract.originalRuntimeAuthorityEstablished,
      false);
    assert.equal(fixture.sourceContract.ownerAccepted, false);
    assert.equal(fixture.sourceContract.strictMigrationComplete, false);
    assert.equal(fixture.sourceContract.strictAcceptanceEffect, "none");
  }
});

test("all six source parent timelines expose exact Current-JS request identities", () => {
  assert.equal(naturalFixtures.reduce((sum, fixture) =>
    sum + fixture.captures.length, 0), 6);
  for (const fixture of naturalFixtures) {
    assert.equal(fixture.config.assetSha256, fixture.runtimeSha256);
    assert.equal(
      fixture.sourceContract.naturalParentCompositeCaptureStatus,
      "two-source-static-parent-domains-current-js-only",
    );
    assert.equal(fixture.sourceContract.originalRuntimeAuthorityEstablished,
      false);
    assert.equal(fixture.sourceContract.ownerAccepted, false);
    assert.equal(fixture.sourceContract.strictMigrationComplete, false);
    for (const mapping of fixture.captures) {
      const context = {
        entryStateSha256: mapping.entryStateSha256,
        frameDomain: mapping.frameDomain,
        lang: mapping.language,
        requirementId: mapping.requirementId,
        scenario: mapping.scenario,
        seed: 0,
        traceId: mapping.traceId,
      };
      const state = fixture.getFrameState(mapping.localFrameCount, context);
      assert.equal(state.status, "ready", mapping.requirementId);
      assert.equal(state.frameDomain, mapping.frameDomain);
      assert.deepEqual(state.visibleSourceMarkers, [
        `${mapping.frameDomain}-path-${mapping.pathIndex}-source-behavior-composite-frame-${mapping.localFrameCount}`,
      ]);
      const markup = renderToStaticMarkup(createElement(
        fixture.module.Renderer,
        {...context, frame: mapping.localFrameCount},
      ));
      assert.match(
        markup,
        new RegExp(
          `data-source-static-behavior-composite-capture="${mapping.frameDomain}-frames-1-${mapping.localFrameCount}"`,
        ),
        mapping.requirementId,
      );
      for (const changed of [
        {...context, requirementId: `${mapping.requirementId}:forged`},
        {...context, traceId: `${mapping.traceId}:forged`},
        {...context, entryStateSha256: "f".repeat(64)},
        {...context, lang: "es" as const},
      ]) {
        assert.equal(
          fixture.getFrameState(1, changed).status,
          "blocked",
          `${mapping.requirementId} must reject forged identity`,
        );
      }
    }
  }
});

test("all 24 source-visible direct companion domains expose exact identities", () => {
  assert.equal(directFixtures.reduce((sum, fixture) =>
    sum + fixture.captures.length, 0), 24);
  for (const fixture of directFixtures) {
    assert.equal(
      fixture.sourceContract.directCompanionCompositeCaptureStatus,
      fixture.expectedStatus,
    );
    assert.deepEqual(
      fixture.sourceContract.directCompanionCompositeAssets.map(
        ({sha256}) => sha256,
      ),
      fixture.configs.map(({assetSha256}) => assetSha256),
    );
    assert.equal(fixture.sourceContract.originalRuntimeAuthorityEstablished,
      false);
    assert.equal(fixture.sourceContract.ownerAccepted, false);
    assert.equal(fixture.sourceContract.strictMigrationComplete, false);
    for (const mapping of fixture.captures) {
      const context = {
        entryStateSha256: mapping.entryStateSha256,
        frameDomain: mapping.frameDomain,
        lang: mapping.language,
        requirementId: mapping.requirementId,
        scenario: mapping.scenario,
        seed: 0,
        traceId: mapping.traceId,
      };
      const state = fixture.getFrameState(mapping.localFrameCount, context);
      assert.equal(state.status, "ready", mapping.requirementId);
      assert.equal(state.frameDomain, mapping.frameDomain);
      assert.deepEqual(state.visibleSourceMarkers, [
        `${mapping.frameDomain}-path-1-source-behavior-composite-frame-${mapping.localFrameCount}`,
      ]);
      const markup = renderToStaticMarkup(createElement(
        fixture.module.Renderer,
        {...context, frame: mapping.localFrameCount},
      ));
      assert.match(
        markup,
        new RegExp(
          `data-source-static-behavior-composite-capture="${mapping.frameDomain}-frames-1-${mapping.localFrameCount}"`,
        ),
        mapping.requirementId,
      );
      for (const changed of [
        {...context, requirementId: `${mapping.requirementId}:forged`},
        {...context, traceId: `${mapping.traceId}:forged`},
        {...context, entryStateSha256: "f".repeat(64)},
        {...context, lang: "es" as const},
      ]) {
        assert.equal(
          fixture.getFrameState(1, changed).status,
          "blocked",
          `${mapping.requirementId} must reject forged identity`,
        );
      }
    }
  }
});
