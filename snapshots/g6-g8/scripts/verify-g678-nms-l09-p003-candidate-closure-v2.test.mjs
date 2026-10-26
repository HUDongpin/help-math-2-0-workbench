import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {assertP003CandidateRelations} from
  './verify-g678-nms-l09-p003-candidate-closure-v2.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const LOCK = path.join(ROOT,
  'migrations/shared-nms002-l09-p003/audit/CANDIDATE_CLOSURE_V2.json');
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

test('P003 candidate closure rejects changed audio, drawing, and admission claims',
  {skip: process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot}, async () => {
    const lock = JSON.parse(await readFile(LOCK));
    const entries = await Promise.all(Object.entries(lock.files).map(
      async ([key, pin]) => [key, await readFile(path.isAbsolute(pin.path)
        ? pin.path : path.join(ROOT, pin.path))]));
    const bytes = Object.fromEntries(entries);
    assert.doesNotThrow(() => assertP003CandidateRelations(bytes,
      lock.generatorSourceGraph));
    assert.throws(() => assertP003CandidateRelations({...bytes,
      audioInventory: Buffer.from('changed source audio inventory')},
      lock.generatorSourceGraph));
    assert.throws(() => assertP003CandidateRelations({...bytes,
      currentRootRuntime: Buffer.from('changed root drawing')},
      lock.generatorSourceGraph));
    const admitted = JSON.parse(bytes.variantManifest);
    admitted.claimBoundary.registered = true;
    assert.throws(() => assertP003CandidateRelations({...bytes,
      variantManifest: Buffer.from(JSON.stringify(admitted))},
      lock.generatorSourceGraph));
  });
