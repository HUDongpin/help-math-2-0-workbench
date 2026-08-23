import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {describe, it} from 'node:test';

import sharp from 'sharp';

import {
  NovaFrameNormalizationError,
  normalizeNovaTutorFrame,
} from '../lib/nova-frame-normalization.server';
import {NOVA_REQUEST_LIMITS} from '../lib/nova-request-schema';

function frameInput(
  data: Buffer,
  width: number,
  height: number,
  mimeType = 'image/png',
) {
  return {
    releaseId: 'lesson-g04-l03-negative-numbers',
    globalPageOrdinal: 1,
    animationId: 'course-g04-l03-ir-001-341242cc',
    dataUrl: `data:${mimeType};base64,${data.toString('base64')}`,
    width,
    height,
  };
}

function sha256(data: Uint8Array) {
  return createHash('sha256').update(data).digest('hex');
}

describe('normalizeNovaTutorFrame', () => {
  it('strips and bounds a valid frame while preserving canonical placement', async () => {
    const png = await sharp({
      create: {
        width: 1_200,
        height: 600,
        channels: 4,
        background: {r: 32, g: 96, b: 192, alpha: 0.7},
      },
    }).png().withMetadata({orientation: 1}).toBuffer();
    assert.ok(png.byteLength <= NOVA_REQUEST_LIMITS.frameBytes);
    assert.equal(
      sha256(png),
      '3f3194901a03310151c423c781724259216aa5ea01492d510e5ae9b8cfe69536',
    );

    const normalized = await normalizeNovaTutorFrame(
      frameInput(png, 1_200, 600),
    );
    assert.equal(normalized.releaseId, 'lesson-g04-l03-negative-numbers');
    assert.equal(normalized.globalPageOrdinal, 1);
    assert.equal(normalized.animationId, 'course-g04-l03-ir-001-341242cc');
    assert.equal(normalized.width, 1_024);
    assert.equal(normalized.height, 512);
    assert.match(normalized.dataUrl, /^data:image\/jpeg;base64,/u);

    const output = Buffer.from(normalized.dataUrl.split(',', 2)[1]!, 'base64');
    assert.ok(output.byteLength <= NOVA_REQUEST_LIMITS.frameBytes);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, 'jpeg');
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.icc, undefined);
  });

  it('rejects a declaration whose dimensions do not match decoded pixels', async () => {
    const png = await sharp({
      create: {
        width: 12,
        height: 8,
        channels: 3,
        background: '#ffffff',
      },
    }).png().toBuffer();
    await assert.rejects(
      normalizeNovaTutorFrame(frameInput(png, 11, 8)),
      NovaFrameNormalizationError,
    );
  });

  it('rejects unsupported MIME types and MIME/file-signature mismatches', async () => {
    const png = await sharp({
      create: {
        width: 8,
        height: 6,
        channels: 3,
        background: '#336699',
      },
    }).png().toBuffer();
    const jpeg = await sharp(png).jpeg().toBuffer();

    for (const input of [
      frameInput(png, 8, 6, 'image/gif'),
      frameInput(png, 8, 6, 'image/jpeg'),
      frameInput(jpeg, 8, 6, 'image/png'),
    ]) {
      await assert.rejects(
        normalizeNovaTutorFrame(input),
        NovaFrameNormalizationError,
      );
    }
  });

  it('rejects corrupt PNG and JPEG data even when their signatures are present', async () => {
    const corruptPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x00,
    ]);
    const corruptJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]);
    assert.equal(
      sha256(corruptPng),
      '1b56b50ac4e976f488f128cabdcdffb2fc9331d6974bb9968131a415d14ade24',
    );
    assert.equal(
      sha256(corruptJpeg),
      '03b70d49139e0ee9121b9aa599be36d4e93e3ac61604974c3fd41e1e22012e58',
    );

    await assert.rejects(
      normalizeNovaTutorFrame(frameInput(corruptPng, 1, 1)),
      NovaFrameNormalizationError,
    );
    await assert.rejects(
      normalizeNovaTutorFrame(frameInput(corruptJpeg, 1, 1, 'image/jpeg')),
      NovaFrameNormalizationError,
    );
  });

  it('rejects a compressed pixel bomb above the decoded-pixel ceiling', async () => {
    const compressedPixelBomb = await sharp({
      create: {
        width: 2_049,
        height: 2_048,
        channels: 3,
        background: '#ffffff',
      },
    }).png({compressionLevel: 9}).toBuffer();
    assert.ok(compressedPixelBomb.byteLength <= NOVA_REQUEST_LIMITS.frameBytes);

    await assert.rejects(
      normalizeNovaTutorFrame(frameInput(compressedPixelBomb, 2_049, 2_048)),
      NovaFrameNormalizationError,
    );
  });

  it('rejects a decoded frame whose byte envelope exceeds 18 KiB', async () => {
    const oversized = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(NOVA_REQUEST_LIMITS.frameBytes - 7),
    ]);
    assert.equal(oversized.byteLength, NOVA_REQUEST_LIMITS.frameBytes + 1);

    await assert.rejects(
      normalizeNovaTutorFrame(frameInput(oversized, 1, 1)),
      NovaFrameNormalizationError,
    );
  });

  it('rejects animated PNG input instead of selecting an arbitrary frame', async () => {
    const animatedPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAABAAAAAQBPJcTWAAAACGFjVEwAAAACAAAAAPONk3AAAAAaZmNUTAAAAAAAAAACAAAAAgAAAAAAAAAAAAEAAgAA5keNuAAAABBJREFUeJxj/MMAAixgkgEADQQBAr9QFbMAAAAaZmNUTAAAAAEAAAABAAAAAQAAAAAAAAAAAAEAAgAAzx+LvAAAABBmZEFUAAAAAnicY/zDwAAAAvwA/uU1kAgAAAAASUVORK5CYII=',
      'base64',
    );
    assert.equal(animatedPng.includes(Buffer.from('acTL')), true);
    assert.equal(
      sha256(animatedPng),
      '373df112cb2f4103564ca164f9690d074a4389b3ba1f4f7974327084c8efb8f3',
    );

    await assert.rejects(
      normalizeNovaTutorFrame(frameInput(animatedPng, 2, 2)),
      NovaFrameNormalizationError,
    );
  });
});
