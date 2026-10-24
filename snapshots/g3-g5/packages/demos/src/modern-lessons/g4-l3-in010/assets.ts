import INPUT from './source-inputs.generated.json';
import GEOMETRY from './geometry.packed.json';
import {loadBitmaps, disposeBitmaps, type Geometry, type Bitmap} from './painter';
import type {PackedInputs} from './figure-model';

/** Proposed public membership; publishing this exact PNG is a separate root transaction. */
export const POINTER_ASSET = {
  id: 35,
  url: '/lesson-typography-v1/graphics/course-g04-l03-in-010/bitmap35.png',
  sha256: 'c6c83797feaf22b66717d3aa9b9ea305310e08721f2532b4141e9edbf4bf6a26',
  width: 38,
  height: 29,
} as const;
export interface In010Assets {
  input: PackedInputs;
  geometry: Geometry;
  bitmaps: ReadonlyMap<number, Bitmap>;
  dispose(): void;
}
/** Compiled, source-pinned IR and geometry; only the pointer bitmap is fetched. */
export async function loadIn010Assets(signal: AbortSignal): Promise<In010Assets> {
  const bitmaps = await loadBitmaps([POINTER_ASSET], signal);
  let disposed = false;
  return {
    input: INPUT as unknown as PackedInputs,
    geometry: GEOMETRY as Geometry,
    bitmaps,
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeBitmaps(bitmaps);
    },
  };
}
