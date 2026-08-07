import assert from 'node:assert/strict';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {catalogInputIdentity} from '../lib/catalog-cache-identity';

test('catalog cache identity is stable until a bound input file changes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'helpmath-catalog-cache-'));
  try {
    await mkdir(path.join(root, 'catalog'));
    const files = [
      'animations.json',
      'missing-references.json',
      'completion-ledger.json',
      'lesson-releases.json',
      'lesson-release-ledger.json',
    ];
    for (const file of files) await writeFile(path.join(root, 'catalog', file), '{}\n');
    const first = catalogInputIdentity(root);
    assert.equal(catalogInputIdentity(root), first);

    await writeFile(path.join(root, 'catalog', 'completion-ledger.json'), '{"changed":true}\n');
    assert.notEqual(catalogInputIdentity(root), first);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('catalog cache identity safely represents optional missing release files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'helpmath-catalog-cache-missing-'));
  try {
    await mkdir(path.join(root, 'catalog'));
    const identity = catalogInputIdentity(root);
    assert.match(identity, /lesson-releases\.json:missing/);
    assert.match(identity, /lesson-release-ledger\.json:missing/);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
