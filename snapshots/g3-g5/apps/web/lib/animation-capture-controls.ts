export function buildCaptureFrameLinks(frameCount: number): readonly number[] {
  if (!Number.isSafeInteger(frameCount) || frameCount < 1) {
    throw new Error("frameCount must be a positive safe integer");
  }
  return Object.freeze([
    ...new Set([1, Math.ceil(frameCount / 2), frameCount]),
  ]);
}
