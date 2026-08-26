import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import * as React from 'react';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import type {
  AnimationLanguage,
  AnimationModule,
  RuntimeContext
} from '../src/contract';
import {buildLegacyCaptureAttributes} from '../src/legacy-capture-identity';
import conversion11 from '../src/modules/conversion-1-1';
import conversion12 from '../src/modules/conversion-1-2';
import conversion13 from '../src/modules/conversion-1-3';
import conversion14 from '../src/modules/conversion-1-4';
import acuteAngle from '../src/modules/keyterm-elementary-acute-angle';
import computeghgh from '../src/modules/keyterm-elementary-computeghgh';
import {matchPrototype} from '../src/prototype-manifest';

// The product build uses the automatic JSX runtime. The tsx node:test loader
// evaluates a few legacy renderer modules with the classic runtime, so expose
// React only inside this test process.
(globalThis as typeof globalThis & {React: typeof React}).React = React;

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

interface CoverageRequirement {
  readonly requirementId: string;
  readonly scenario: string;
  readonly frameDomainId: string;
  readonly traceId: string;
  readonly language: AnimationLanguage;
  readonly seed: string;
  readonly requiredRange: Readonly<{firstFrame: number; lastFrame: number}>;
  readonly entryStateSha256: string;
}

interface Coverage {
  readonly schemaVersion: number;
  readonly animationId: string;
  readonly requirements: readonly CoverageRequirement[];
}

const pilots: readonly Readonly<{
  animationId: string;
  module: AnimationModule;
  stage: Readonly<{width: number; height: number}>;
}>[] = Object.freeze([
  Object.freeze({
    animationId: 'formula-elementary-conversion-01-01',
    module: conversion11,
    stage: Object.freeze({width: 780, height: 379})
  }),
  Object.freeze({
    animationId: 'formula-elementary-conversion-01-02',
    module: conversion12,
    stage: Object.freeze({width: 780, height: 379})
  }),
  Object.freeze({
    animationId: 'formula-elementary-conversion-01-03',
    module: conversion13,
    stage: Object.freeze({width: 780, height: 379})
  }),
  Object.freeze({
    animationId: 'formula-elementary-conversion-01-04',
    module: conversion14,
    stage: Object.freeze({width: 780, height: 379})
  }),
  Object.freeze({
    animationId: 'keyterm-elementary-acute-angle',
    module: acuteAngle,
    stage: Object.freeze({width: 225, height: 225})
  }),
  Object.freeze({
    animationId: 'keyterm-elementary-computeghgh',
    module: computeghgh,
    stage: Object.freeze({width: 225, height: 225})
  })
]);

function openingTags(markup: string): readonly Readonly<{name: string; source: string}>[] {
  return Array.from(markup.matchAll(/<([a-z][a-z0-9:-]*)(?:\s[^<>]*?)?>/gi), (match) =>
    Object.freeze({name: match[1]!.toLowerCase(), source: match[0]})
  );
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return match?.[1];
}

function assertIdentity(
  tag: string,
  animationId: string,
  requirement: CoverageRequirement,
  frame: number
) {
  assert.equal(attribute(tag, 'data-animation-id'), animationId);
  assert.equal(attribute(tag, 'data-flash-frame'), String(frame));
  assert.equal(attribute(tag, 'data-flash-frame-domain'), requirement.frameDomainId);
  assert.equal(attribute(tag, 'data-flash-lang'), requirement.language);
  assert.equal(attribute(tag, 'data-flash-root-frame'), String(frame));
  assert.equal(attribute(tag, 'data-flash-scenario'), requirement.scenario);
  assert.equal(attribute(tag, 'data-flash-seed'), requirement.seed);
  assert.equal(attribute(tag, 'data-flash-requirement-id'), requirement.requirementId);
  assert.equal(attribute(tag, 'data-flash-trace-id'), requirement.traceId);
  assert.equal(
    attribute(tag, 'data-flash-entry-state-sha256'),
    requirement.entryStateSha256
  );
  assert.equal(attribute(tag, 'data-runtime-scenario'), requirement.scenario);
  assert.equal(attribute(tag, 'data-runtime-language'), requirement.language);
  assert.equal(attribute(tag, 'data-runtime-seed'), requirement.seed);
}

async function readCoverage(animationId: string): Promise<Coverage> {
  return JSON.parse(
    await readFile(
      `${repositoryRoot}migrations/${animationId}/evidence/full-frame-coverage.json`,
      'utf8'
    )
  ) as Coverage;
}

test('all six legacy routes resolve to the intended module and exact native stage', () => {
  for (const pilot of pilots) {
    const route = matchPrototype({animationId: pilot.animationId});
    assert.ok(route, `${pilot.animationId} must resolve through the product route manifest`);
    assert.equal(route.key, pilot.module.key);
    assert.equal(route.preferredAnimationId, pilot.animationId);
    assert.deepEqual(route.runtime.stage, pilot.stage);
    assert.deepEqual(pilot.module.movie.stage, pilot.stage);
    assert.equal(route.runtime.frameCount, pilot.module.movie.frameCount);
  }
});

test('all six legacy renderers expose exact coverage-v2 schema-v4 capture identities', async () => {
  for (const pilot of pilots) {
    const coverage = await readCoverage(pilot.animationId);
    assert.equal(coverage.schemaVersion, 2);
    assert.equal(coverage.animationId, pilot.animationId);
    assert.equal(coverage.requirements.length, 2);

    for (const requirement of coverage.requirements) {
      assert.equal(requirement.frameDomainId, 'root');
      assert.equal(requirement.scenario, 'default');
      for (const frame of [
        requirement.requiredRange.firstFrame,
        requirement.requiredRange.lastFrame
      ]) {
        const context: RuntimeContext = {
          entryStateSha256: requirement.entryStateSha256,
          frame,
          frameDomain: requirement.frameDomainId,
          lang: requirement.language,
          replay: 0,
          requirementId: requirement.requirementId,
          rootFrame: frame,
          scenario: requirement.scenario,
          seed: Number(requirement.seed),
          traceId: requirement.traceId
        };
        const pureState = pilot.module.getFrameState(frame, context) as Record<
          string,
          unknown
        >;
        assert.equal(pureState.frameDomain, requirement.frameDomainId);
        assert.equal(pureState.frame, frame);
        assert.equal(pureState.rootFrame, frame);
        assert.equal(pureState.scenario, requirement.scenario);
        assert.equal(pureState.language, requirement.language);
        assert.equal(pureState.seed, Number(requirement.seed));
        assert.equal(pureState.status, 'ready');
        assert.equal(pureState.blocker, null);
        const markup = renderToStaticMarkup(
          createElement(pilot.module.Renderer, {
            ...context,
            state: pureState
          })
        );
        const tags = openingTags(markup);
        const stage = tags.find(({source}) =>
          source.includes('data-capture-stage="true"')
        );
        const visual = tags.find(({source}) =>
          source.includes('data-render-visual="true"')
        );
        assert.ok(stage, `${pilot.animationId} frame ${frame} must expose a capture stage`);
        assert.ok(visual, `${pilot.animationId} frame ${frame} must expose a visual target`);
        assert.equal(stage.name, 'div');
        assert.equal(visual.name, 'svg');
        assert.equal(attribute(stage.source, 'data-render-state'), 'ready');
        assert.equal(attribute(visual.source, 'data-render-state'), 'ready');
        assertIdentity(stage.source, pilot.animationId, requirement, frame);
        assertIdentity(visual.source, pilot.animationId, requirement, frame);
        assert.equal(
          attribute(visual.source, 'viewBox'),
          `0 0 ${pilot.stage.width} ${pilot.stage.height}`
        );
      }
    }
  }
});

test('legacy capture identity fails closed without bindings or for unsupported contexts', () => {
  const unbound = buildLegacyCaptureAttributes({
    animationId: 'formula-elementary-conversion-01-01',
    frame: 1,
    frameDomain: 'root',
    lang: 'en',
    renderedFrame: 1,
    rootFrame: 1,
    scenario: 'default',
    seed: 0
  });
  assert.equal(unbound.stage['data-capture-stage'], undefined);
  assert.equal(unbound.stage['data-render-state'], 'ready');
  assert.equal(unbound.visual['data-render-visual'], 'true');

  const unsupported = buildLegacyCaptureAttributes({
    animationId: 'keyterm-elementary-computeghgh',
    entryStateSha256:
      'c4e59050847229fb64f73610691e51bf1ca2bba42f3ef5d7bb5da6ddc57553c0',
    frame: 35,
    frameDomain: 'root',
    lang: 'en',
    renderedFrame: 35,
    requirementId: 'req:root:replay-hover:en',
    rootFrame: 35,
    scenario: 'replay-hover',
    seed: 0,
    traceId: 'trace:root:replay-hover:en:seed-0'
  });
  assert.equal(unsupported.stage['data-capture-stage'], undefined);
  assert.equal(unsupported.stage['data-render-state'], 'blocked');
  assert.equal(unsupported.visual['data-render-visual'], undefined);
  assert.equal(unsupported.visual['data-render-state'], 'blocked');
});

test('all six pure timelines remain deterministic and one-indexed', () => {
  for (const pilot of pilots) {
    const context: RuntimeContext = {
      frame: 1,
      frameDomain: 'root',
      lang: 'en',
      rootFrame: 1,
      scenario: 'default',
      seed: 0
    };
    const first = pilot.module.getFrameState(0, context) as {readonly frame?: number};
    const firstAgain = pilot.module.getFrameState(0, context) as {readonly frame?: number};
    const last = pilot.module.getFrameState(pilot.module.movie.frameCount + 1, {
      ...context,
      frame: pilot.module.movie.frameCount + 1,
      rootFrame: pilot.module.movie.frameCount + 1
    }) as {readonly frame?: number};
    assert.deepEqual(firstAgain, first);
    assert.equal(first.frame, 1, `${pilot.animationId} must clamp to one-indexed frame 1`);
    assert.equal(
      last.frame,
      pilot.module.movie.frameCount,
      `${pilot.animationId} must clamp to its root terminal frame`
    );
  }
});
