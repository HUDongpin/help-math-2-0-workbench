import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  reconstructFinal342DescriptorPlayer,
  reconstructFinal342ProductBridge,
} from './audit-g678-final342-current-bridge-successor-compatibility.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('current bridge exactly reconstructs the final342 browser-bound predecessor', async () => {
  const current = await readFile(new URL(
    '../apps/web/lib/g678-calibration-product-bridge.server.ts',
    import.meta.url), 'utf8');
  const reconstructed = Buffer.from(reconstructFinal342ProductBridge(current));
  assert.equal(reconstructed.length, 146389);
  assert.equal(sha256(reconstructed),
    'dcde1345c14742265165c683b4990fe0a4955d125d0ddd4df214f80caed464df');
  assert.notEqual(sha256(Buffer.from(reconstructFinal342ProductBridge(
    `${current}\n`))), sha256(reconstructed));
});

test('current descriptor player exactly reconstructs its final342 predecessor', async () => {
  const current = await readFile(new URL(
    '../apps/web/components/descriptor-driven-whole-lesson-player.tsx',
    import.meta.url), 'utf8');
  const reconstructed = Buffer.from(reconstructFinal342DescriptorPlayer(
    current));
  assert.equal(reconstructed.length, 47564);
  assert.equal(sha256(reconstructed),
    '531a6af5504f7b7dbdf9ced742a730ad270308c7595efd68a66710cc31ab2b06');
  assert.notEqual(sha256(Buffer.from(reconstructFinal342DescriptorPlayer(
    `${current}\n`))), sha256(reconstructed));
});

test('successor audit source requires all 342 invariants and fresh browser replay', async () => {
  const source = await readFile(new URL(
    './audit-g678-final342-current-bridge-successor-compatibility.mjs',
    import.meta.url), 'utf8');
  assert.match(source, /records\.length === 342/u);
  assert.match(source, /changedGlossaryPageCount/u);
  assert.match(source, /predecessorSamplesMustBeReplayed: true/u);
  assert.match(source, /currentHostBrowserRevalidated: false/u);
  assert.match(source, /shared-alg001-l11-p005/u);
  assert.match(source, /shared-alg001-l11-p012/u);
  assert.match(source, /inequalityUnicodeRequired: \['<', '≥', '≤', '≠'\]/u);
  assert.match(source, /runningOpenCloseResumes: true/u);
  assert.match(source, /inspectedOpenCloseRemainsPaused: true/u);
  assert.match(source, /inspectedSeekRequestIdentityPreserved: true/u);
  assert.match(source, /navigationReplayAndResetMustClearSnapshot: true/u);
  assert.match(source, /browserStarted: false, httpRequestsIssued: false/u);
});
