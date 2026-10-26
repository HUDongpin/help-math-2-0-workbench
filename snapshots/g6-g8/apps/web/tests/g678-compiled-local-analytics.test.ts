import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const webDirectory = fileURLToPath(new URL('..', import.meta.url));
const analyticsSpecifier = '@vercel/analytics/next';
const stub = path.join(webDirectory, 'lib/g678-compiled-local-analytics.stub.tsx');
const enhancedResolve = createRequire(import.meta.url)('enhanced-resolve');
const keys = ['NODE_ENV', 'VERCEL', 'VERCEL_ENV', 'HELP_MATH_G678_COMPILED_LOCAL_QA',
  'HELP_MATH_G678_LOCAL_PREVIEW', 'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_HFR_LOCAL_QA'] as const;
let serial = 0;
async function withEnvironment(values: Record<string, string | undefined>, run: () => Promise<void>) {
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) {
      if (values[key] === undefined) delete process.env[key];
      else Reflect.set(process.env, key, values[key]);
    }
    await run();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else Reflect.set(process.env, key, previous[key]);
    }
  }
}
const local = {NODE_ENV: 'production', HELP_MATH_G678_COMPILED_LOCAL_QA: '1',
  HELP_MATH_G678_LOCAL_PREVIEW: '1', HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'};
const config = async () => (await import(`../next.config.ts?analyticsCase=${++serial}`)).default;
class Replacement {
  constructor(readonly resource: RegExp, readonly replacement: string) {}
}

test('compiled loopback QA resolves only the exact Analytics Next entry to the null component', async () => {
  await withEnvironment(local, async () => {
    const next = await config();
    for (const isServer of [false, true]) {
      const result = next.webpack({plugins: [], resolve: {alias: {'existing-alias': '/existing'}}},
        {dev: false, isServer, webpack: {NormalModuleReplacementPlugin: Replacement}});
      assert.equal(result.resolve.alias[`${analyticsSpecifier}$`], stub);
      assert.equal(result.resolve.alias['existing-alias'], '/existing');
      const resolve = enhancedResolve.create.sync({extensions: ['.tsx', '.ts', '.mjs', '.js', '.json'],
        conditionNames: ['import', 'default'], alias: result.resolve.alias});
      for (const context of [webDirectory, path.join(webDirectory, 'app/[locale]')]) {
        assert.equal(resolve(context, analyticsSpecifier), stub);
        assert.notEqual(resolve(context, '@vercel/analytics'), stub, 'existing Nova track import remains real');
        assert.notEqual(resolve(context, '@vercel/analytics/react'), stub);
        assert.throws(() => resolve(context, `${analyticsSpecifier}/not-exported`), 'no prefix replacement');
      }
    }
  });
});

test('ordinary production, cloud production and development keep their existing Analytics dependency', async () => {
  for (const values of [
    {NODE_ENV: 'production'},
    {NODE_ENV: 'production', VERCEL: '1'},
    {NODE_ENV: 'development'},
    {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: '1', HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'},
    {...local, HELP_MATH_G678_COMPILED_LOCAL_QA: '0'},
  ]) await withEnvironment(values, async () => {
    const next = await config();
    const result = next.webpack({plugins: [], resolve: {}},
      {dev: values.NODE_ENV === 'development', isServer: false, webpack: {NormalModuleReplacementPlugin: Replacement}});
    assert.equal(result.resolve.alias[`${analyticsSpecifier}$`], undefined);
    assert.equal(result.resolve.alias[analyticsSpecifier], undefined);
    assert.equal(result.resolve.alias['@vercel/analytics'], undefined);
  });
});

test('invalid compiled QA requests retain the existing fail-closed configuration guard', async () => {
  for (const override of [{VERCEL: '1'}, {VERCEL_ENV: 'preview'},
    {HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'}, {NODE_ENV: 'development'}]) {
    await withEnvironment({...local, ...override}, async () => {
      await assert.rejects(config, /G678_COMPILED_QA_REQUIRES_PRODUCTION_LOOPBACK_NON_CLOUD_OPT_IN/);
    });
  }
});

test('the actual stub exports Analytics and returns null without imported runtime dependencies', async () => {
  const module = await import('../lib/g678-compiled-local-analytics.stub');
  assert.deepEqual(Object.keys(module), ['Analytics']);
  assert.equal(module.Analytics(), null);
  const source = fs.readFileSync(stub, 'utf8');
  assert.ok(source.startsWith("'use client';"));
  assert.doesNotMatch(source, /^\s*import\b|^\s*export\b[^\n]*\bfrom\b/m);
});
