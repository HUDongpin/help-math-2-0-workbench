import {parseFrame} from '../runtime';

export function displayedFlashFrame(
  captureFrame: number | undefined,
  frameCount: number,
  solved: boolean
): number {
  if (captureFrame != null) {
    return captureFrame;
  }
  return solved ? Math.max(1, frameCount) : 1;
}

export function parseCaptureFrame(
  value: string | string[] | undefined,
  frameCount: number
): number | undefined {
  return parseFrame(value, Math.max(1, frameCount));
}
