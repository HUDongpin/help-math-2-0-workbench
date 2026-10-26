import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, realpathSync, rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {resolveP047ProxyHostPins, P047_PROXY_SUCCESSOR} from '../lib/g678-p047-proxy-host-successor.server';
import {resolveTypographyHostClosurePins, TYPOGRAPHY_HOST_SUCCESSOR} from '../lib/g678-typography-host-successor.server';

const keys = ['NODE_ENV', 'VERCEL', 'VERCEL_ENV', 'HELP_MATH_G678_COMPILED_LOCAL_QA',
  'HELP_MATH_G678_LOCAL_PREVIEW', 'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_CALIBRATION_PHASE'] as const;
let serial = 0;
async function withConfigEnvironment<T>(values: Record<string, string | undefined>, callback: () => Promise<T>) {
  const before = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) {
      if (values[key] === undefined) delete process.env[key];
      else Reflect.set(process.env, key, values[key]);
    }
    return await callback();
  } finally {
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key];
      else Reflect.set(process.env, key, before[key]);
    }
  }
}
const production = {NODE_ENV: 'production', HELP_MATH_G678_LOCAL_PREVIEW: '1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'};
const loadConfig = async () => (await import(`../next.config.ts?compiledQaCase=${++serial}`)).default;

class Replacement {
  constructor(readonly resource: RegExp, readonly replacement: string) {}
}

test('default production still stubs private registries and emits closed compile constant', async () => {
  await withConfigEnvironment(production, async () => {
    const config = await loadConfig();
    assert.equal(config.env.HELP_MATH_G678_COMPILED_LOCAL_QA, '0');
    assert.notEqual(config.distDir, '.next-g678-compiled-local-qa');
    const webpack = config.webpack({plugins: [], resolve: {}}, {dev: false, isServer: false,
      webpack: {NormalModuleReplacementPlugin: Replacement}});
    const target = webpack.resolve.alias['@helpmath/demos/local-only-animation-registry'];
    assert.ok(target.endsWith('/lib/g678-local-only-registry.production-stub.ts'));
    assert.ok(webpack.plugins.some((item: Replacement) => item.resource.test('@helpmath/demos/local-only-animation-registry')));
    assert.equal(config.turbopack.resolveAlias['@helpmath/demos/local-only-animation-registry'], target);
  });
});

test('compiled QA is isolated, bounded in workers, and has no development lazy backend', async () => {
  await withConfigEnvironment({...production, HELP_MATH_G678_COMPILED_LOCAL_QA: '1'}, async () => {
    const config = await loadConfig();
    assert.equal(config.distDir, '.next-g678-compiled-local-qa');
    assert.equal(config.env.HELP_MATH_G678_COMPILED_LOCAL_QA, '1');
    assert.equal(config.experimental.cpus, 1);
    assert.equal(config.experimental.webpackMemoryOptimizations, true);
    assert.equal(config.experimental.webpackBuildWorker, true);
    assert.equal(config.experimental.parallelServerCompiles, false);
    assert.equal(config.experimental.parallelServerBuildTraces, false);
    assert.equal(config.experimental.preloadEntriesOnStart, false);
    const webpack = config.webpack({plugins: [], resolve: {}}, {dev: false, isServer: false,
      webpack: {NormalModuleReplacementPlugin: Replacement}});
    assert.equal(webpack.cache, false);
    assert.equal(webpack.experiments?.lazyCompilation, undefined);
    assert.equal(webpack.resolve.alias['@helpmath/demos/local-only-animation-registry'], undefined);
    assert.equal(config.turbopack.resolveAlias['@helpmath/demos/local-only-animation-registry'], undefined);
    assert.ok(!webpack.plugins.some((item: Replacement) => item.resource.test('@helpmath/demos/local-only-animation-registry')));
    for (const page of ['004', '047', '051']) {
      const module = `packages/demos/src/modules/shared-nms002-l07-p${page}.tsx`;
      assert.ok(!webpack.plugins.some((item: Replacement) => item.resource.test(module)), module);
    }
    // This profile deliberately does not widen legacy candidate page adapters.
    assert.ok(webpack.plugins.some((item: Replacement) => item.resource.test('@/components/g678-alg-l07-current-host-lesson-v1')));
    assert.notEqual(config.typescript?.ignoreBuildErrors, true);
  });
});

test('cloud, non-loopback and incomplete compiled QA configuration fail before build/start', async () => {
  for (const override of [{VERCEL: '1'}, {VERCEL_ENV: 'preview'}, {VERCEL_ENV: 'production'},
    {HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'}, {HELP_MATH_G678_LOCAL_PREVIEW: undefined}]) {
    await withConfigEnvironment({...production, HELP_MATH_G678_COMPILED_LOCAL_QA: '1', ...override}, async () => {
      await assert.rejects(loadConfig, /G678_COMPILED_QA_REQUIRES_PRODUCTION_LOOPBACK_NON_CLOUD_OPT_IN/);
    });
  }
});

test('compiled local commands select the current reviewed base lineage without changing deployment commands', () => {
  const {scripts} = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const phase = 'HELP_MATH_G678_CALIBRATION_PHASE=frozen16-continuous-audio-provisional-browser-qa';
  for (const key of ['build:g678:local', 'start:g678:local']) {
    assert.equal(scripts[key].split(phase).length, 2, key);
    assert.match(scripts[key], /HELP_MATH_G678_COMPILED_LOCAL_QA=1/);
    assert.match(scripts[key], /HELP_MATH_G678_LOCAL_PREVIEW_BIND=127\.0\.0\.1/);
    assert.ok(!scripts[key].includes('HELP_MATH_G678_SOURCE_ROOT='), 'source root stays an inspected caller binding');
  }
  assert.match(scripts['start:g678:local'], /next start --hostname 127\.0\.0\.1/);
  for (const key of ['build', 'start']) {
    assert.ok(!scripts[key].includes('HELP_MATH_G678_CALIBRATION_PHASE'));
    assert.ok(!scripts[key].includes('HELP_MATH_G678_COMPILED_LOCAL_QA'));
  }
});

test('compiled local build passes its bounded heap to a separately spawned TypeScript-style child', () => {
  const {scripts} = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const commands = scripts['build:g678:local'].split(' && ');
  assert.equal(commands.length, 2);
  const nodeAt = commands[1].indexOf(' node --max-old-space-size=12288 ');
  assert.ok(nodeAt > 0, 'exact local environment prefix');
  const environmentPrefix = commands[1].slice(0, nodeAt);
  const quote = (value: string) => "'" + value.replaceAll("'", "'\\''") + "'";
  const childCode = 'process.stdout.write(JSON.stringify({heap:require("node:v8").getHeapStatistics().heap_size_limit,options:process.env.NODE_OPTIONS}))';
  // Next's CLI checker uses process.execPath with no inherited execArgv. This
  // allocates no large heap; it reads the actual separately spawned V8 limit.
  const parentCode = `require('node:child_process').execFileSync(process.execPath,['-e',${JSON.stringify(childCode)}],{stdio:['ignore','inherit','inherit']})`;
  const command = `${environmentPrefix} ${quote(process.execPath)} --max-old-space-size=12288 -e ${quote(parentCode)}`;
  const value = JSON.parse(execFileSync('/bin/sh', ['-c', command], {
    env: {...process.env, NODE_OPTIONS: '--no-warnings --max-old-space-size=4096'},
    encoding: 'utf8', timeout: 10000,
  }));
  assert.equal(value.options, '--no-warnings --max-old-space-size=4096 --max-old-space-size=16384');
  assert.ok(value.heap >= 16384 * 1024 * 1024 && value.heap <= 16640 * 1024 * 1024,
    `actual child heap limit: ${value.heap}`);
});

test('historical host resolvers require explicit compiled local scope and retain exact witness failures', async () => {
  const phase = 'frozen16-continuous-audio-provisional-browser-qa';
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'g678-compiled-lineage-')));
  const pins = [{path: 'sentinel', bytes: 1, sha256: 'a'.repeat(64)}];
  try {
    for (const pin of [P047_PROXY_SUCCESSOR, TYPOGRAPHY_HOST_SUCCESSOR]) {
      const file = path.join(root, pin.path); mkdirSync(path.dirname(file), {recursive: true});
      writeFileSync(file, '{}\n');
    }
    const local = {...production, HELP_MATH_G678_COMPILED_LOCAL_QA: '1', HELP_MATH_G678_CALIBRATION_PHASE: phase};
    for (const override of [
      {HELP_MATH_G678_COMPILED_LOCAL_QA: undefined}, {HELP_MATH_G678_COMPILED_LOCAL_QA: '0'},
      {VERCEL: '1'}, {VERCEL_ENV: 'preview'}, {VERCEL_ENV: 'production'},
      {HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'}, {HELP_MATH_G678_LOCAL_PREVIEW: undefined},
      {HELP_MATH_G678_CALIBRATION_PHASE: undefined}, {HELP_MATH_G678_CALIBRATION_PHASE: 'unreviewed'},
    ]) await withConfigEnvironment({...local, ...override}, async () => {
      assert.equal(resolveP047ProxyHostPins(root, pins), pins);
      assert.equal(resolveTypographyHostClosurePins(root, pins), pins);
    });
    await withConfigEnvironment({...production, HELP_MATH_G678_CALIBRATION_PHASE: phase}, async () => {
      const config = await loadConfig();
      assert.equal(config.env.HELP_MATH_G678_COMPILED_LOCAL_QA, '0', 'phase alone never enables a deployed build');
      assert.ok(config.turbopack.resolveAlias['@helpmath/demos/local-only-animation-registry'].endsWith('.production-stub.ts'));
    });
    await withConfigEnvironment(local, async () => {
      assert.throws(() => resolveP047ProxyHostPins(root, pins), /P047_PROXY_SUCCESSOR_INVALID: exact bytes/);
      assert.throws(() => resolveTypographyHostClosurePins(root, pins), /G678_TYPOGRAPHY_HOST_SUCCESSOR_INVALID: manifest bytes/);
    });
  } finally {rmSync(root, {recursive: true, force: true});}
});
