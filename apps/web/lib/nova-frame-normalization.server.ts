import 'server-only';

import sharp, {type Metadata} from 'sharp';

import {NOVA_REQUEST_LIMITS} from './nova-request-schema';

/**
 * libvips chooses a decoder from the bytes, not the data-URL label. Keep the
 * HEIF/AVIF loader blocked so a mislabeled payload cannot reach libheif.
 */
sharp.block({operation: ['VipsForeignLoadHeif']});

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

type DeclaredNovaFrameMimeType = 'image/png' | 'image/jpeg';

export interface NovaFrameForNormalization {
  readonly releaseId: string;
  readonly globalPageOrdinal: number;
  readonly animationId: string;
  readonly dataUrl: string;
  readonly width: number;
  readonly height: number;
}

export interface NormalizedNovaTutorFrame extends NovaFrameForNormalization {
  readonly dataUrl: `data:image/jpeg;base64,${string}`;
}

/** Carries no image bytes or metadata into route logs or client errors. */
export class NovaFrameNormalizationError extends Error {
  constructor() {
    super('Nova Tutor frame is invalid');
    this.name = 'NovaFrameNormalizationError';
  }
}

function invalidFrame(): never {
  throw new NovaFrameNormalizationError();
}

function isDeclaredNovaFrameMimeType(
  value: string,
): value is DeclaredNovaFrameMimeType {
  switch (value) {
    case 'image/png':
    case 'image/jpeg':
      return true;
    default:
      return false;
  }
}

function signatureMatchesDeclaredType(
  bytes: Buffer,
  declaredMimeType: DeclaredNovaFrameMimeType,
): boolean {
  switch (declaredMimeType) {
    case 'image/png':
      return (
        bytes.byteLength >= PNG_SIGNATURE.byteLength &&
        bytes.subarray(0, PNG_SIGNATURE.byteLength).equals(PNG_SIGNATURE)
      );
    case 'image/jpeg':
      return (
        bytes.byteLength >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff
      );
    default: {
      const unexpected: never = declaredMimeType;
      return unexpected;
    }
  }
}

function decodeFrameDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    dataUrl,
  );
  if (!match || match[2].length % 4 !== 0) return invalidFrame();

  let bytes: Buffer;
  try {
    bytes = Buffer.from(match[2], 'base64');
  } catch {
    return invalidFrame();
  }
  if (
    bytes.byteLength === 0 ||
    bytes.byteLength > NOVA_REQUEST_LIMITS.frameBytes ||
    bytes.toString('base64') !== match[2]
  ) {
    return invalidFrame();
  }
  const declaredMimeType = match[1];
  if (!declaredMimeType || !isDeclaredNovaFrameMimeType(declaredMimeType)) {
    return invalidFrame();
  }
  return Object.freeze({bytes, declaredMimeType});
}

function pngContainsAnimationControl(bytes: Buffer) {
  let offset = 8;
  while (offset + 12 <= bytes.byteLength) {
    const dataLength = bytes.readUInt32BE(offset);
    const chunkEnd = offset + 12 + dataLength;
    if (chunkEnd > bytes.byteLength) return invalidFrame();
    if (bytes.toString('ascii', offset + 4, offset + 8) === 'acTL') {
      return true;
    }
    offset = chunkEnd;
  }
  return false;
}

/**
 * Decode and re-encode learner-derived frames on the server. This strips
 * metadata, rejects pixel bombs and mismatched dimensions, flattens alpha,
 * and produces a bounded JPEG before any provider transfer.
 */
export async function normalizeNovaTutorFrame(
  frame: NovaFrameForNormalization,
): Promise<NormalizedNovaTutorFrame> {
  const {bytes, declaredMimeType} = decodeFrameDataUrl(frame.dataUrl);
  if (!signatureMatchesDeclaredType(bytes, declaredMimeType)) {
    return invalidFrame();
  }
  if (
    declaredMimeType === 'image/png' &&
    pngContainsAnimationControl(bytes)
  ) {
    return invalidFrame();
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(bytes, {
      failOn: 'error',
      limitInputPixels: 2_048 * 2_048,
      sequentialRead: true,
    }).metadata();
  } catch {
    return invalidFrame();
  }

  const expectedFormat = declaredMimeType === 'image/png' ? 'png' : 'jpeg';
  if (
    metadata.format !== expectedFormat ||
    (metadata.pages !== undefined && metadata.pages > 1) ||
    (metadata.delay !== undefined && metadata.delay.length > 0) ||
    metadata.width !== frame.width ||
    metadata.height !== frame.height ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > 2_048 ||
    metadata.height > 2_048 ||
    metadata.width * metadata.height > 2_048 * 2_048
  ) {
    return invalidFrame();
  }

  const qualities = [70, 55, 40] as const;
  for (const quality of qualities) {
    try {
      const {data, info} = await sharp(bytes, {
        failOn: 'error',
        limitInputPixels: 2_048 * 2_048,
        sequentialRead: true,
      })
        .rotate()
        .flatten({background: '#ffffff'})
        .resize({
          width: 1_024,
          height: 1_024,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({quality, chromaSubsampling: '4:2:0'})
        .toBuffer({resolveWithObject: true});
      if (
        data.byteLength > 0 &&
        data.byteLength <= NOVA_REQUEST_LIMITS.frameBytes
      ) {
        return Object.freeze({
          releaseId: frame.releaseId,
          globalPageOrdinal: frame.globalPageOrdinal,
          animationId: frame.animationId,
          dataUrl: `data:image/jpeg;base64,${data.toString('base64')}`,
          width: info.width,
          height: info.height,
        });
      }
    } catch {
      return invalidFrame();
    }
  }
  return invalidFrame();
}
