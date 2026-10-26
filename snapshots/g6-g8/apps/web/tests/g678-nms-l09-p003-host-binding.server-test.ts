import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {readNmsL09P003Binding} from '../lib/g678-nms-l09-p003-binding.server';
import {NMS_L09_P003_FREEZE} from '../lib/g678-nms-l09-p003-freeze-v3';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url));

function withEnvironment(source: string | undefined, mode: string | undefined,
  run: () => void) {
  const mutableEnvironment = process.env as Record<string, string | undefined>;
  const oldSource = mutableEnvironment.HELP_MATH_G678_SOURCE_ROOT;
  const oldMode = mutableEnvironment.NODE_ENV;
  try {
    if (source === undefined) delete mutableEnvironment.HELP_MATH_G678_SOURCE_ROOT;
    else mutableEnvironment.HELP_MATH_G678_SOURCE_ROOT = source;
    if (mode === undefined) delete mutableEnvironment.NODE_ENV;
    else mutableEnvironment.NODE_ENV = mode;
    run();
  } finally {
    if (oldSource === undefined) delete mutableEnvironment.HELP_MATH_G678_SOURCE_ROOT;
    else mutableEnvironment.HELP_MATH_G678_SOURCE_ROOT = oldSource;
    if (oldMode === undefined) delete mutableEnvironment.NODE_ENV;
    else mutableEnvironment.NODE_ENV = oldMode;
  }
}

test('P003 v3 host freeze requires exact bytes, real AWS root and non-production', () => {
  withEnvironment(sourceRoot, 'development', () => {
    assert.equal(readNmsL09P003Binding(workspaceRoot, NMS_L09_P003_FREEZE).length,
      NMS_L09_P003_FREEZE.bytes);
    assert.throws(() => readNmsL09P003Binding(workspaceRoot,
      {...NMS_L09_P003_FREEZE, sha256: '0'.repeat(64)}),
    /NMS_L09_P003_BINDING_IDENTITY/u);
    assert.throws(() => readNmsL09P003Binding(workspaceRoot,
      {...NMS_L09_P003_FREEZE, path: '../outside.json'}),
    /NMS_L09_P003_BINDING_PATH/u);
  });
  withEnvironment(`${sourceRoot}/../AWS Grade-Classified Courseware`, 'development', () =>
    assert.throws(() => readNmsL09P003Binding(workspaceRoot, NMS_L09_P003_FREEZE),
      /NMS_L09_P003_BINDING_SCOPE/u));
  withEnvironment(sourceRoot, 'production', () =>
    assert.throws(() => readNmsL09P003Binding(workspaceRoot, NMS_L09_P003_FREEZE),
      /NMS_L09_P003_BINDING_SCOPE/u));
});
