/** ISO-BMFF `ftyp` box branded `avif`, not a decodable image. */
export const AVIF_FTYP_BYTES = Buffer.from([
  0x00, 0x00, 0x00, 0x1c,
  0x66, 0x74, 0x79, 0x70,
  0x61, 0x76, 0x69, 0x66,
  0x00, 0x00, 0x00, 0x00,
  0x61, 0x76, 0x69, 0x66,
  0x6d, 0x69, 0x66, 0x31,
  0x6d, 0x69, 0x61, 0x66,
]);

export const GARBAGE_BYTES = Buffer.from('this is not a png or jpeg');

export function frameDataUrl(
  mime: 'image/png' | 'image/jpeg',
  bytes: Buffer,
) {
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

export function novaFrame(dataUrl: string, width = 1, height = 1) {
  return {
    releaseId: 'lesson-g04-l03',
    globalPageOrdinal: 1,
    animationId: 'anim',
    dataUrl,
    width,
    height,
  };
}
