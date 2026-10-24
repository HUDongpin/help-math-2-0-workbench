import source from './generated/g4-l3-in012-bitmaps.json';
import type {In012Bitmap} from './g4-l3-in012-paints';

if (source.sourceSwfSha256 !== 'fa131c4cfad5619beb1343d0bfbc941bd9ffa59f190ae1b002f81d5f9d8cde55') {
  throw new Error('IN012 bitmap source mismatch');
}
export const IN012_BITMAPS: ReadonlyMap<number, In012Bitmap> = new Map(
  source.bitmaps.map(bitmap => [bitmap.characterId, {
    href: bitmap.href, width: bitmap.width, height: bitmap.height,
  }]),
);
