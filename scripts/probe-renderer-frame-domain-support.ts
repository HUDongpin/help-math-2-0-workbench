#!/usr/bin/env node

import {readFile} from 'node:fs/promises';

import {loadAnimationModule} from '../packages/demos/src/animation-registry';
import {prototypeManifest} from '../packages/demos/src/prototype-manifest';
import type {RuntimeContext} from '../packages/demos/src/contract';

type ProbeRequest = Readonly<{
  requestId: string;
  frameDomain: string;
  frame: number;
  scenario: string;
  language: 'en' | 'es';
  seed: number;
}>;

type ProbeInput = Readonly<{
  animationId: string;
  requests: readonly ProbeRequest[];
}>;

function primitive(value: unknown): string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
    ? (value as string | number | boolean | null)
    : null;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error('Expected a JSON probe-input path');
  const input = JSON.parse(await readFile(inputPath, 'utf8')) as ProbeInput;
  const prototype = prototypeManifest.find(
    (entry) => entry.preferredAnimationId === input.animationId
  );
  if (!prototype) throw new Error(`${input.animationId}: prototype runtime is missing`);
  const module = await loadAnimationModule(prototype.key);
  if (!module) {
    throw new Error(
      `${input.animationId}: animation module is not registered for prototype key ${prototype.key}`
    );
  }

  const results = input.requests.map((request) => {
    const context: RuntimeContext = Object.freeze({
      frame: request.frame,
      frameDomain: request.frameDomain,
      rootFrame: request.frameDomain === 'root' ? request.frame : 1,
      scenario: request.scenario,
      lang: request.language,
      seed: request.seed,
      traceId: `renderer-audit-${request.requestId}`,
      requirementId: `renderer-audit-${request.requestId}`,
      entryStateSha256: '0'.repeat(64),
      replay: 0
    });
    try {
      const state = module.getFrameState(request.frame, context);
      const record = state && typeof state === 'object'
        ? (state as Record<string, unknown>)
        : {};
      return {
        requestId: request.requestId,
        moduleScenarioDeclared: module.scenarios.some(({id}) => id === request.scenario),
        actual: {
          frameDomain: primitive(record.frameDomain),
          frame: primitive(record.frame),
          scenario: primitive(record.scenario),
          language: primitive(record.language),
          status: primitive(record.status),
          blocker: primitive(record.blocker)
        },
        error: null
      };
    } catch (error) {
      return {
        requestId: request.requestId,
        moduleScenarioDeclared: module.scenarios.some(({id}) => id === request.scenario),
        actual: null,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      };
    }
  });

  process.stdout.write(`${JSON.stringify({
    animationId: input.animationId,
    prototypeKey: prototype.key,
    prototypeRuntime: prototype.runtime,
    module: {
      key: module.key,
      maturity: module.maturity,
      scenarios: module.scenarios.map(({id}) => id)
    },
    results
  })}\n`);
}

await main();
