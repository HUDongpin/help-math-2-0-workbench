import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {before, describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';

import sharp from 'sharp';

import {
  NovaFrameNormalizationError,
  normalizeNovaTutorFrame,
} from '../lib/nova-frame-normalization.server';
import {
  AVIF_FTYP_BYTES,
  GARBAGE_BYTES,
  frameDataUrl,
  novaFrame,
} from './support/nova-frame-bytes';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function assertInvalidFrame(error: unknown) {
  assert.ok(error instanceof NovaFrameNormalizationError);
  assert.equal(error.name, 'NovaFrameNormalizationError');
  assert.equal(error.message, 'Nova Tutor frame is invalid');
  return true;
}

describe('normalizeNovaTutorFrame', () => {
  let pngBytes: Buffer;
  let jpegBytes: Buffer;

  before(async () => {
    const pixels = {
      create: {
        width: 8,
        height: 6,
        channels: 3 as const,
        background: {r: 20, g: 40, b: 80},
      },
    };
    pngBytes = await sharp(pixels).png().toBuffer();
    jpegBytes = await sharp(pixels).jpeg().toBuffer();
    assert.ok(pngBytes.subarray(0, PNG_SIGNATURE.byteLength).equals(PNG_SIGNATURE));
    assert.equal(jpegBytes[0], 0xff);
    assert.equal(jpegBytes[1], 0xd8);
    assert.equal(jpegBytes[2], 0xff);
  });

  it('rejects AVIF and garbage bytes declared as image/png before sharp decodes them', () => {
    const result = spawnSync(process.execPath, [
      '--conditions=react-server',
      '--import',
      path.join(webRoot, 'tests/support/block-sharp-decode-hook.mjs'),
      '--import',
      'tsx',
      path.join(webRoot, 'tests/support/nova-frame-reject-without-sharp.ts'),
    ], {
      cwd: webRoot,
      encoding: 'utf8',
      env: process.env,
    });
    assert.equal(
      result.status,
      0,
      result.stderr || result.stdout || result.error?.message || 'reject probe failed',
    );
  });

  it('rejects AVIF bytes, garbage, and cross-declared PNG/JPEG signatures', async () => {
    await assert.rejects(
      () => normalizeNovaTutorFrame(novaFrame(frameDataUrl('image/png', AVIF_FTYP_BYTES))),
      assertInvalidFrame,
    );
    await assert.rejects(
      () => normalizeNovaTutorFrame(novaFrame(frameDataUrl('image/png', GARBAGE_BYTES))),
      assertInvalidFrame,
    );
    await assert.rejects(
      () => normalizeNovaTutorFrame(novaFrame(frameDataUrl('image/png', jpegBytes), 8, 6)),
      assertInvalidFrame,
    );
    await assert.rejects(
      () => normalizeNovaTutorFrame(novaFrame(frameDataUrl('image/jpeg', pngBytes), 8, 6)),
      assertInvalidFrame,
    );
  });

  it('normalizes a valid PNG and a valid JPEG to a bounded JPEG', async () => {
    for (const source of [
      {mime: 'image/png' as const, bytes: pngBytes},
      {mime: 'image/jpeg' as const, bytes: jpegBytes},
    ]) {
      const normalized = await normalizeNovaTutorFrame(
        novaFrame(frameDataUrl(source.mime, source.bytes), 8, 6),
      );
      assert.match(normalized.dataUrl, /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/);
      assert.equal(normalized.width, 8);
      assert.equal(normalized.height, 6);
      const output = Buffer.from(
        normalized.dataUrl.slice('data:image/jpeg;base64,'.length),
        'base64',
      );
      assert.equal(output[0], 0xff);
      assert.equal(output[1], 0xd8);
      assert.equal(output[2], 0xff);
    }
  });
});
