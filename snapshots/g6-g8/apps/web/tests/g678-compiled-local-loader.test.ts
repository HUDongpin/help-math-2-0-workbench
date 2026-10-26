import assert from 'node:assert/strict';
import test from 'node:test';
import {loadClientAnimationModule} from '../lib/load-animation-module.client';

const sourceCanvasIds = ['004', '047', '051'].map(page => `shared-nms002-l07-p${page}`);
const keys = ['NODE_ENV', 'HELP_MATH_G678_COMPILED_LOCAL_QA'] as const;
async function withEnvironment(value: string | undefined, action: () => Promise<void>) {
  const before = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    Reflect.set(process.env, 'NODE_ENV', 'production');
    if (value === undefined) delete process.env.HELP_MATH_G678_COMPILED_LOCAL_QA;
    else process.env.HELP_MATH_G678_COMPILED_LOCAL_QA = value;
    await action();
  } finally {
    for (const key of keys) {
      if (before[key] === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, before[key]);
    }
  }
}

test('default production generic course loader denies local NMS HFR and source-canvas pages', async () => {
  for (const value of [undefined, '0', 'true']) await withEnvironment(value, async () => {
    for (const id of [...sourceCanvasIds, 'shared-nms002-l07-p005', 'shared-nms002-l07-p006', 'shared-nms002-l07-p007']) {
      assert.equal(await loadClientAnimationModule(id), undefined, id);
    }
  });
});

test('compiled generic course loader resolves the actual three registered NMS source-canvas modules', async () => {
  // Run after the maintained registry producer regenerates its outputs. This
  // uses the real generic course dispatch, not the separate HFR review loader.
  await withEnvironment('1', async () => {
    for (const id of sourceCanvasIds) {
      const module = await loadClientAnimationModule(id);
      assert.equal(module?.key, id);
      assert.equal(module?.maturity, 'private-current-js');
      assert.equal(typeof module?.Renderer, 'function');
    }
  });
});
